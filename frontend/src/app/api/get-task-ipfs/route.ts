import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching IPFS hash for task:', taskId)

    // iExec Bellecour Subgraph endpoint
    const subgraphUrl = 'https://thegraph-product.iex.ec/subgraphs/name/bellecour/poco-v5'
    
    // GraphQL query to get specific task with results
    const query = `
      query GetTaskIPFS($taskId: String!) {
        task(id: $taskId) {
          id
          status
          results
        }
      }
    `

    const variables = {
      taskId: taskId.toLowerCase()
    }

    console.log('GraphQL query for IPFS:', query)
    console.log('Variables:', variables)

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Subgraph IPFS response:', data)

    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    const task = data.data?.task
    if (!task) {
      return NextResponse.json({
        error: 'Task not found',
        taskId,
        ipfsHash: null
      })
    }

    // Decode the hex-encoded results
    let ipfsHash = null
    let decodedResults = null
    
    if (task.results) {
      try {
        // Remove 0x prefix and decode hex to string
        const hexString = task.results.startsWith('0x') ? task.results.slice(2) : task.results
        const decodedString = Buffer.from(hexString, 'hex').toString('utf8')
        console.log('Decoded results string:', decodedString)
        
        // Parse the JSON to extract the IPFS location
        const resultData = JSON.parse(decodedString)
        console.log('Parsed result data:', resultData)
        
        if (resultData.location) {
          // Extract IPFS hash from location like "/ipfs/QmY42vKG7BdjxG3fbqFjWeEGsYxHWYVg9TaeLumxLtHYe"
          const ipfsMatch = resultData.location.match(/\/ipfs\/(.+)/)
          if (ipfsMatch) {
            ipfsHash = ipfsMatch[1]
          }
        }
        
        decodedResults = resultData
      } catch (decodeError) {
        console.error('Error decoding results:', decodeError)
        console.log('Raw results:', task.results)
      }
    }

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      ipfsHash: ipfsHash,
      ipfsUrl: ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : null,
      rawResults: task.results,
      decodedResults: decodedResults
    })

  } catch (error) {
    console.error('Error fetching task IPFS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}