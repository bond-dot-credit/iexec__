import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

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

    // Check task status using iExec CLI
    const scoringDir = '/Users/ojasarora/Documents/bond.credit/iexec__/scoring-algorithm'
    const result = await checkTaskStatus(taskId, scoringDir)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking task status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

function checkTaskStatus(taskId: string, workingDir: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const command = `cd "${workingDir}" && npx iapp task ${taskId}`
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
          // Parse the iExec task status output
          const statusMatch = stdout.match(/status:\s*(\w+)/)
          const resultMatch = stdout.match(/results:\s*({[^}]+})/)
          
          const status = statusMatch ? statusMatch[1] : 'unknown'
          
          let result = null
          if (resultMatch) {
            try {
              result = JSON.parse(resultMatch[1])
            } catch {
              // If parsing fails, keep result as null
            }
          }

          resolve({
            taskId,
            status,
            result,
            timestamp: new Date().toISOString()
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse task status: ${parseError}`))
        }
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}