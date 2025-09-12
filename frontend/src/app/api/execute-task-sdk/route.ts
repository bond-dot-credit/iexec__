import { NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'

interface ExecuteTaskRequest {
  iAppAddress: string
  useProtectedData: boolean
  protectedDataAddress?: string
  inputValue?: string
  userAddress: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteTaskRequest = await request.json()
    
    if (!body.iAppAddress || !body.userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Initialize iExec SDK
    const ethProvider = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec', // Bellecour RPC
      process.env.WALLET_PRIVATE_KEY || '' // Need to set this in environment
    )
    const iexec = new IExec({ ethProvider })

    console.log('Executing task with SDK for app:', body.iAppAddress)

    // Step 0: Get app information to determine TEE framework
    const { app } = await iexec.app.showApp(body.iAppAddress)
    console.log('App info:', app)
    
    // Determine TEE framework from app's mrenclave
    let teeFramework: 'scone' | 'gramine' = 'scone' // Default fallback
    if (app.appMREnclave) {
      try {
        const mrenclave = JSON.parse(app.appMREnclave)
        teeFramework = mrenclave.framework?.toLowerCase() || 'scone'
      } catch (e) {
        console.log('Could not parse mrenclave, using default scone framework')
      }
    }
    console.log('Using TEE framework:', teeFramework)

    // Step 1: Provision requester secrets if needed (for TEE execution)
    if (body.inputValue && !body.useProtectedData) {
      console.log('Provisioning requester secret with value:', body.inputValue)
      console.log('TEE framework:', teeFramework)
      
      try {
        // Check if secret exists at index 1
        const secretExists = await iexec.secrets.checkRequesterSecretExists(
          ethProvider.address,
          '1',
          { teeFramework }
        )
        
        if (!secretExists) {
          // Push the secret at index 1
          await iexec.secrets.pushRequesterSecret(
            '1', // Secret index for IEXEC_REQUESTER_SECRET_1
            body.inputValue, // The actual value
            { teeFramework }
          )
          console.log('Requester secret provisioned at index 1')
        } else {
          console.log('Requester secret already exists at index 1, updating...')
          // Update existing secret
          await iexec.secrets.pushRequesterSecret(
            '1',
            body.inputValue,
            { teeFramework }
          )
          console.log('Requester secret updated at index 1')
        }
      } catch (secretError) {
        console.error('Failed to provision requester secret:', secretError)
        throw new Error(`Failed to provision requester secret: ${secretError instanceof Error ? secretError.message : 'Unknown error'}`)
      }
    }

    // Step 2: Create and sign a requestorder
    let requestParams: any = {}
    
    if (body.useProtectedData && body.protectedDataAddress) {
      // For protected data, we DO need the dataset address in request order
      // But we need to create a dataset order for it (not fetch from orderbook)
      requestParams = {
        dataset: body.protectedDataAddress,
        datasetmaxprice: utils.parseRLC('1 RLC') // Allow up to 1 RLC for dataset
      }
    } else if (body.inputValue) {
      // For requester secrets, use TEE tag and specify secrets in params
      requestParams = {
        dataset: utils.NULL_ADDRESS, // No dataset when using secrets
        datasetmaxprice: 0,
        tag: ['tee', teeFramework], // Required for iexec_secrets with correct TEE framework
        params: {
          iexec_secrets: { '1': body.inputValue } // Map secret index to value
        }
      }
    } else {
      // Default case - no data, no secrets
      requestParams = {
        dataset: utils.NULL_ADDRESS,
        datasetmaxprice: 0
      }
    }
    
    const requestorderTemplate = await iexec.order.createRequestorder({
      app: body.iAppAddress,
      category: 0, // Standard category
      appmaxprice: 0, // Free app
      workerpoolmaxprice: utils.parseRLC('1 RLC'), // Maximum price for workerpool
      volume: 1, // Single task execution
      ...requestParams
    })

    const signedRequestorder = await iexec.order.signRequestorder(requestorderTemplate)
    console.log('Created requestorder:', signedRequestorder)

    // Step 3: Create app order (like CLI does)
    const apporderTemplate = await iexec.order.createApporder({
      app: body.iAppAddress,
      appprice: 0, // Free app
      volume: 1, // Single execution
      tag: ['tee', teeFramework] // Match the app's TEE framework
    })

    const signedApporder = await iexec.order.signApporder(apporderTemplate)
    console.log('Created app order:', signedApporder)

    // Step 4: Create dataset order for protected data if needed
    let datasetorder = undefined
    if (body.useProtectedData && body.protectedDataAddress) {
      console.log('Creating dataset order for protected data...')
      // For protected data, create a dataset order instead of fetching from orderbook
      const datasetorderTemplate = await iexec.order.createDatasetorder({
        dataset: body.protectedDataAddress,
        datasetprice: 0, // Free access (access controlled by DataProtector)
        volume: 1
      })
      
      datasetorder = await iexec.order.signDatasetorder(datasetorderTemplate)
      console.log('Created dataset order for protected data:', datasetorder)
    }

    // Step 5: Fetch compatible workerpool order from orderbook
    const workerpoolFilters = {
      category: 0,
      minVolume: 1,
      pageSize: 10, // Minimum required page size
      minTag: ['tee', teeFramework] // Ensure workerpool supports the required TEE framework
    }
    
    console.log('Fetching workerpool orders with filters:', workerpoolFilters)
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook(workerpoolFilters)

    if (!workerpoolOrderbook.orders || workerpoolOrderbook.orders.length === 0) {
      throw new Error('No compatible workerpool orders found in orderbook')
    }

    const workerpoolorder = workerpoolOrderbook.orders[0].order
    console.log('Found workerpool order:', workerpoolorder)

    // Step 6: Match orders to create a deal and trigger execution
    const orderMatchParams: any = {
      apporder: signedApporder,
      workerpoolorder,
      requestorder: signedRequestorder
    }
    
    // Include dataset order if using protected data
    if (datasetorder) {
      orderMatchParams.datasetorder = datasetorder
      console.log('Including dataset order for protected data')
    }
    
    console.log('Matching orders with params:', JSON.stringify({
      apporder: { ...signedApporder, sign: '[SIGNATURE]' },
      workerpoolorder: { ...workerpoolorder, sign: '[SIGNATURE]' },
      requestorder: { ...signedRequestorder, sign: '[SIGNATURE]' },
      hasDatasetOrder: !!datasetorder
    }, null, 2))
    
    const matchOrdersResult = await iexec.order.matchOrders(orderMatchParams)

    console.log('Orders matched successfully:', matchOrdersResult)
    console.log('Deal ID:', matchOrdersResult.dealid)
    console.log('Transaction Hash:', matchOrdersResult.txHash)

    // Extract task ID from deal
    const dealDetails = await iexec.deal.show(matchOrdersResult.dealid)
    console.log('Deal details:', dealDetails)
    const taskId = dealDetails.tasks['0'] // First (and only) task in the deal
    console.log('Extracted Task ID:', taskId)

    return NextResponse.json({
      deal: matchOrdersResult.dealid,
      task: taskId,
      txHash: matchOrdersResult.txHash,
      status: 'submitted',
      timestamp: new Date().toISOString(),
      explorerUrl: `https://blockscout-bellecour.iex.ec/tx/${matchOrdersResult.txHash}`,
      volume: matchOrdersResult.volume.toString()
    })

  } catch (error) {
    console.error('Error executing task with SDK:', error)
    
    // Provide detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}