import { NextRequest, NextResponse } from 'next/server'
import { IExec, utils } from 'iexec'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const watch = searchParams.get('watch') === 'true' // Optional watch parameter
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log('Monitoring task with SDK:', taskId, watch ? '(watching)' : '')

    // Initialize iExec SDK
    const ethProvider = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec',
      process.env.WALLET_PRIVATE_KEY || ''
    )
    const iexec = new IExec({ ethProvider })

    if (watch) {
      // Use obsTask for real-time monitoring
      console.log('Starting task observation...')
      
      try {
        const taskObservable = await iexec.task.obsTask(taskId)
        console.log('Task observable created:', taskObservable)

        // Get the initial status
        let currentStatus = null
        
        // Set up a promise that resolves when task completes or fails
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(NextResponse.json({
              taskId: taskId,
              status: 'TIMEOUT',
              completed: false,
              results: null,
              message: 'Task monitoring timed out after 30 seconds. Task may still be processing.'
            }))
          }, 30000) // 30 second timeout for watch mode
          
          taskObservable.subscribe({
            next: (taskUpdate) => {
              console.log('Task update received:', taskUpdate)
              currentStatus = taskUpdate
              
              // Check if task is complete or failed
              if (taskUpdate.status === 3 || taskUpdate.status === 4) {
                clearTimeout(timeout)
                resolve(NextResponse.json({
                  taskId: taskId,
                  status: getStatusString(taskUpdate.status),
                  statusCode: taskUpdate.status,
                  completed: taskUpdate.status === 3,
                  failed: taskUpdate.status === 4,
                  results: taskUpdate.status === 3 ? 'Available for download' : null,
                  taskUpdate: taskUpdate,
                  message: taskUpdate.status === 3 ? 'Task completed successfully' : 'Task failed'
                }))
              }
            },
            error: (error) => {
              console.error('Task observation error:', error)
              clearTimeout(timeout)
              resolve(NextResponse.json({
                error: 'Task monitoring failed',
                errorDetails: error instanceof Error ? error.message : String(error)
              }, { status: 500 }))
            }
          })
        })
        
      } catch (obsError) {
        console.error('Error creating task observable:', obsError)
        return NextResponse.json({
          error: 'Failed to create task monitor',
          errorDetails: obsError instanceof Error ? obsError.message : String(obsError)
        }, { status: 500 })
      }
    } else {
      // Simple status check without watching
      try {
        const taskDetails = await iexec.task.show(taskId)
        console.log('Task details:', taskDetails)

        return NextResponse.json({
          taskId: taskId,
          status: getStatusString(taskDetails.status),
          statusCode: taskDetails.status,
          completed: taskDetails.status === 3,
          failed: taskDetails.status === 4,
          results: taskDetails.status === 3 ? 'Available for download' : null,
          dealid: taskDetails.dealid,
          message: getStatusMessage(taskDetails.status)
        })

      } catch (showError) {
        console.log('Task not found, may still be processing...')
        return NextResponse.json({
          taskId: taskId,
          status: 'PENDING',
          statusCode: null,
          completed: false,
          results: null,
          message: 'Task is being processed on the blockchain. Please check again in a few minutes.',
          error: 'Task not found - may still be processing'
        })
      }
    }

  } catch (error) {
    console.error('Error monitoring task:', error)
    
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

// Helper functions
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

function getStatusMessage(status: number): string {
  const messageMap: Record<number, string> = {
    0: 'Task has not been set up yet',
    1: 'Task is being executed',
    2: 'Task execution completed, revealing results',
    3: 'Task completed successfully',
    4: 'Task execution failed',
    5: 'Task timed out'
  }
  return messageMap[status] || 'Unknown task status'
}