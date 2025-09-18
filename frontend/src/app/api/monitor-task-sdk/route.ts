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
        // let currentStatus = null // Unused variable
        
        // Set up a promise that resolves when task completes or fails
        return new Promise<NextResponse>((resolve) => {
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
              // currentStatus = taskUpdate // Unused variable

              // Check if task is complete or failed
              const taskStatus = taskUpdate.task?.status
              if (taskStatus === 3 || taskStatus === 4) {
                clearTimeout(timeout)
                resolve(NextResponse.json({
                  taskId: taskId,
                  status: getStatusString(taskStatus),
                  statusCode: taskStatus,
                  completed: taskStatus === 3,
                  failed: taskStatus === 4,
                  results: taskStatus === 3 ? 'Available for download' : null,
                  taskUpdate: taskUpdate,
                  message: taskStatus === 3 ? 'Task completed successfully' : 'Task failed'
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

        // Check for deadline expiration
        let isExpired = false
        let dealDetails = null

        try {
          dealDetails = await iexec.deal.show(taskDetails.dealid)
          // Deal object has deadline field, not endTime
          const deadline = new Date((dealDetails as { deadline: number }).deadline * 1000)
          const now = new Date()
          isExpired = now > deadline

          if (isExpired && taskDetails.status !== 3 && taskDetails.status !== 4) {
            console.log(`Task ${taskId} has expired. Deadline: ${deadline}, Now: ${now}`)
          }
        } catch (dealError) {
          console.log('Could not fetch deal details for deadline check:', dealError)
        }

        return NextResponse.json({
          taskId: taskId,
          status: isExpired && taskDetails.status !== 3 && taskDetails.status !== 4 ? 'EXPIRED' : getStatusString(taskDetails.status),
          statusCode: taskDetails.status,
          completed: taskDetails.status === 3,
          failed: taskDetails.status === 4 || isExpired,
          expired: isExpired,
          results: taskDetails.status === 3 ? 'Available for download' : null,
          dealid: taskDetails.dealid,
          deadline: dealDetails ? new Date((dealDetails as { deadline: number }).deadline * 1000).toISOString() : null,
          message: isExpired && taskDetails.status !== 3 && taskDetails.status !== 4
            ? 'Task has expired and will not complete. Try submitting a new task with a longer timeout.'
            : getStatusMessage(taskDetails.status)
        })

      } catch {
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