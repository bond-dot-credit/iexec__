import { NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'

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

    console.log('Fetching task result with SDK for task:', taskId)

    // Initialize iExec SDK
    const ethProvider = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec', // Bellecour RPC
      process.env.WALLET_PRIVATE_KEY || '' // Need to set this in environment
    )
    const iexec = new IExec({ ethProvider })

    // Get task details and status
    let taskDetails;
    try {
      taskDetails = await iexec.task.show(taskId)
      console.log('Task details:', taskDetails)
    } catch (showError) {
      console.log('Task not found with show method, it may still be processing...')
      
      // For tasks that are recently submitted but not yet indexed,
      // return a pending status
      return NextResponse.json({
        taskId: taskId,
        status: 'PENDING',
        statusCode: null,
        completed: false,
        results: null,
        message: 'Task is being processed on the blockchain. Please check again in a few minutes.',
        error: 'Task not found - may still be processing',
        errorDetails: showError instanceof Error ? showError.message : String(showError)
      })
    }

    // Check if task is completed
    if (taskDetails.status !== 3) { // Status 3 = COMPLETED
      return NextResponse.json({
        taskId: taskId,
        status: getStatusString(taskDetails.status),
        statusCode: taskDetails.status,
        completed: false,
        results: null,
        message: 'Task not completed yet'
      })
    }

    // If task is completed, try to download results
    console.log('Task completed, attempting to download results...')
    
    try {
      // Download task result - this returns the result content
      const resultContent = await iexec.task.fetchResults(taskId)
      console.log('Downloaded result content type:', typeof resultContent)
      console.log('Downloaded result content:', resultContent)

      return NextResponse.json({
        taskId: taskId,
        status: getStatusString(taskDetails.status),
        statusCode: taskDetails.status,
        completed: true,
        results: resultContent,
        dealid: taskDetails.dealid,
        resultLocation: taskDetails.results ? extractIPFSHash(taskDetails.results) : null,
        taskDetails: {
          app: taskDetails.app,
          dataset: taskDetails.dataset,
          workerpool: taskDetails.workerpool,
          trust: taskDetails.trust,
          category: taskDetails.category,
          volume: taskDetails.volume,
          cost: taskDetails.cost,
          contributionDeadline: taskDetails.contributionDeadline,
          finalDeadline: taskDetails.finalDeadline
        }
      })

    } catch (downloadError) {
      console.error('Error downloading results:', downloadError)
      
      // Fallback: return task details even if download fails
      return NextResponse.json({
        taskId: taskId,
        status: getStatusString(taskDetails.status),
        statusCode: taskDetails.status,
        completed: true,
        results: null,
        error: 'Failed to download results',
        errorDetails: downloadError instanceof Error ? downloadError.message : String(downloadError),
        dealid: taskDetails.dealid,
        resultLocation: taskDetails.results ? extractIPFSHash(taskDetails.results) : null,
        taskDetails: {
          app: taskDetails.app,
          dataset: taskDetails.dataset,
          workerpool: taskDetails.workerpool,
          trust: taskDetails.trust,
          category: taskDetails.category,
          volume: taskDetails.volume,
          cost: taskDetails.cost,
          contributionDeadline: taskDetails.contributionDeadline,
          finalDeadline: taskDetails.finalDeadline
        }
      })
    }

  } catch (error) {
    console.error('Error fetching task with SDK:', error)
    
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

// Helper function to convert status codes to readable strings
function getStatusString(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'UNSET',
    1: 'ACTIVE',
    2: 'REVEALING',
    3: 'COMPLETED',
    4: 'FAILED',
    5: 'TIMEOUT'
  }
  return statusMap[status] || 'UNKNOWN'
}

// Helper function to extract IPFS hash from results object
function extractIPFSHash(results: unknown): string | null {
  console.log('Extracting IPFS hash from results:', results)

  if (typeof results === 'string') {
    // If it's already a string, return it
    return results
  }

  if (typeof results === 'object' && results !== null) {
    // Check for common IPFS hash properties
    if (results.location) {
      return String(results.location)
    }
    if (results.storage) {
      return String(results.storage)
    }
    if (results.ipfs) {
      return String(results.ipfs)
    }
    if (results.hash) {
      return String(results.hash)
    }

    // If results has a direct IPFS hash pattern
    const stringified = String(results)
    if (stringified.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)) {
      return stringified
    }
  }

  console.log('Could not extract IPFS hash from results:', results)
  return null
}