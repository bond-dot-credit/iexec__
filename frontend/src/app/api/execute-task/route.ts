import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { promisify } from 'util'

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

    // Build the iApp command - run from the scoring algorithm directory
    const scoringDir = '/Users/ojasarora/Documents/bond.credit/iexec__/scoring-algorithm'
    let command = `cd "${scoringDir}" && npx iapp run ${body.iAppAddress}`
    
    if (body.useProtectedData && body.protectedDataAddress) {
      command += ` --protectedData ${body.protectedDataAddress}`
    } else if (!body.useProtectedData && body.inputValue) {
      command += ` --requesterSecret 1=${body.inputValue}`
    }

    // Execute the command
    const result = await executeIExecCommand(command, scoringDir)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

function executeIExecCommand(command: string, workingDir: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', command], {
      cwd: workingDir,
      stdio: ['inherit', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`))
      } else {
        try {
          // Parse the iApp output to extract task information and tx hash
          const taskIdMatch = stdout.match(/task:\s*([0-9a-fA-Fx]+)/)
          const dealIdMatch = stdout.match(/deal:\s*([0-9a-fA-Fx]+)/)
          const txHashMatch = stdout.match(/txHash:\s*([0-9a-fA-Fx]+)/)
          
          // Also try alternative patterns for transaction hash
          const altTxMatch = stdout.match(/transaction:\s*([0-9a-fA-Fx]+)/) || 
                           stdout.match(/tx:\s*([0-9a-fA-Fx]+)/) ||
                           stdout.match(/hash:\s*([0-9a-fA-Fx]+)/)
          
          console.log('iApp output:', stdout) // Debug logging
          
          if (!taskIdMatch) {
            reject(new Error('Could not parse task ID from iApp output'))
            return
          }

          const txHash = txHashMatch?.[1] || altTxMatch?.[1]

          resolve({
            deal: dealIdMatch?.[1] || '',
            task: taskIdMatch[1],
            txHash: txHash,
            status: 'submitted',
            timestamp: new Date().toISOString(),
            explorerUrl: txHash ? `https://blockscout-bellecour.iex.ec/tx/${txHash}` : undefined
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse command output: ${parseError}`))
        }
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}