'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

interface Task {
  id: string
  taskId: string
  dealId: string
  transactionHash: string
  status: string
  timestamp: number
  blockNumber: number
  requester: string
  beneficiary: string
  results?: string
  resultsHash?: string
  resultsTimestamp?: number
  app: {
    id?: string
    name?: string
    owner?: string
    multihash?: string
  }
  dataset?: {
    id?: string
    name?: string
    owner?: string
    multihash?: string
  }
  workerpool: {
    id?: string
    owner?: string
  }
  result?: {
    inputA?: number
    result?: number
    scoringFormula?: string
    timestamp: string
    confidentialComputing: boolean
    teeProtected: boolean
    transactionHash: string
    ipfsHash?: string
  }
  isLoadingResult?: boolean
}

interface TransactionHistoryProps {
  iAppAddress?: string
}

export default function TransactionHistory({ iAppAddress = '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d' }: TransactionHistoryProps) {
  const { address, isConnected } = useAccount()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Connected wallet address:', address)
      console.log('Fetching tasks from subgraph...')
      
      // Use the subgraph to get tasks directly
      const response = await fetch(`/api/subgraph-tasks?walletAddress=${address}`)
      
      if (!response.ok) {
        throw new Error(`Subgraph query failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Fetched task data from subgraph:', data)

      // Validate and sanitize task data
      const sanitizedTasks = (data.tasks || []).map((task: Record<string, unknown>) => ({
        ...task,
        // Ensure all fields are serializable and not objects
        app: {
          id: task.app?.id || '',
          name: task.app?.name || '',
          owner: task.app?.owner || '',
          multihash: task.app?.multihash || ''
        },
        dataset: task.dataset ? {
          id: task.dataset.id || '',
          name: task.dataset.name || '',
          owner: task.dataset.owner || '',
          multihash: task.dataset.multihash || ''
        } : undefined,
        workerpool: {
          id: task.workerpool?.id || '',
          owner: task.workerpool?.owner || ''
        }
      }))

      // Set tasks data
      setTasks(sanitizedTasks)
      setLastRefresh(new Date())
      
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [isConnected, address])

  const fetchTaskResult = async (taskId: string, txHash: string) => {
    try {
      console.log(`Fetching IPFS hash for task: ${taskId}`)
      
      // Update task to show loading state
      setTasks(prev => prev.map(task => 
        task.taskId === taskId ? { ...task, isLoadingResult: true } : task
      ))

      // Use new SDK-based result endpoint to get task results
      const response = await fetch(`/api/get-task-result-sdk?taskId=${taskId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task IPFS: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Task result data from SDK:', data)

      // Create result object with SDK data and extract IPFS hash properly
      let ipfsHash = null
      console.log('Raw API response:', data)

      // Try multiple sources for IPFS hash
      if (data.results && typeof data.results === 'object' && data.results.url) {
        // Extract hash from URL like "https://ipfs-gateway.v8-bellecour.iex.ec/ipfs/Qmb3zrctWhkN32vuVKfQRmWnziUQDA9wbooFnXp9YSoGUz"
        const urlMatch = data.results.url.match(/\/ipfs\/([A-Za-z0-9]{46,})/)
        if (urlMatch && urlMatch[1]) {
          ipfsHash = urlMatch[1]
          console.log('Extracted IPFS hash from results.url:', ipfsHash)
        }
      } else if (data.resultLocation) {
        if (typeof data.resultLocation === 'string') {
          // Check if it's a URL or direct hash
          if (data.resultLocation.includes('/ipfs/')) {
            const urlMatch = data.resultLocation.match(/\/ipfs\/([A-Za-z0-9]{46,})/)
            ipfsHash = urlMatch ? urlMatch[1] : null
          } else {
            ipfsHash = data.resultLocation
          }
        } else if (typeof data.resultLocation === 'object' && data.resultLocation !== null) {
          // Extract from object structure like {storage: "hash", location: "hash"}
          ipfsHash = data.resultLocation.location || data.resultLocation.storage || data.resultLocation.ipfs || data.resultLocation.hash || null
        }
      }

      // Ensure it's a valid IPFS hash (starts with Qm and has correct length)
      if (ipfsHash && typeof ipfsHash === 'string' && ipfsHash.startsWith('Qm') && ipfsHash.length >= 46) {
        console.log('Valid IPFS hash found:', ipfsHash)
      } else {
        console.log('Invalid or missing IPFS hash:', ipfsHash)
        ipfsHash = null
      }

      const parsedResult = {
        taskId: taskId,
        status: data.status || 'Unknown',
        completed: data.completed || false,
        results: data.results || 'Not available',
        timestamp: new Date().toISOString(),
        confidentialComputing: true,
        teeProtected: true,
        transactionHash: txHash,
        ipfsHash: ipfsHash,
        message: data.message || (data.completed ? 'Task completed successfully' : 'Task still processing')
      }

      // Update task with the fetched result
      setTasks(prev => prev.map(task => 
        task.taskId === taskId 
          ? { ...task, result: parsedResult, isLoadingResult: false }
          : task
      ))

    } catch (error) {
      console.error('Error fetching task result:', error)
      
      // Update task to show error state
      setTasks(prev => prev.map(task => 
        task.taskId === taskId 
          ? { 
              ...task, 
              isLoadingResult: false,
              result: {
                result: 'Failed to fetch result',
                timestamp: new Date().toISOString(),
                confidentialComputing: true,
                teeProtected: true,
                transactionHash: task.transactionHash
              }
            }
          : task
      ))
    }
  }

  const handleFetchResult = async (taskId: string) => {
    try {
      console.log('Fetching result for task:', taskId)
      
      // Directly use the task ID from subgraph data
      await fetchTaskResult(taskId, taskId)
      
    } catch (error) {
      console.error('Error handling fetch result:', error)
      setError(`Failed to fetch result: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Auto-fetch on component mount and wallet connection
  useEffect(() => {
    if (isConnected && address) {
      fetchTasks()
    }
  }, [isConnected, address, iAppAddress, fetchTasks])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Transaction History</h3>
        <button
          onClick={fetchTasks}
          disabled={loading || !isConnected}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {!isConnected && (
        <div className="text-center py-8">
          <p className="text-slate-400">Connect your wallet to view transaction history</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {isConnected && !loading && tasks.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-slate-400">No tasks found</p>
          <p className="text-slate-500 text-sm mt-2">
            iExec tasks from your wallet will appear here
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.taskId} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'COMPLETED' ? 'bg-green-900/40 text-green-300' : 
                      task.status === 'FAILED' ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'
                    }`}>
                      {task.status === 'COMPLETED' ? '✅ Completed' : 
                       task.status === 'FAILED' ? '❌ Failed' : `🔄 ${task.status}`}
                    </span>
                    {task.app.name && (
                      <span className="px-2 py-1 text-xs rounded bg-purple-900/40 text-purple-300">
                        {task.app.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Task ID:</span>
                      <span className="text-blue-300 font-mono ml-2">{truncateHash(task.taskId)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">TX Hash:</span>
                      <a
                        href={`https://blockscout-bellecour.iex.ec/tx/${task.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 font-mono ml-2"
                      >
                        {truncateHash(task.transactionHash)}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400">Time:</span>
                      <span className="text-slate-200 ml-2">{formatTimestamp(task.timestamp)}</span>
                    </div>
                    {task.resultsHash && (
                      <div>
                        <span className="text-slate-400">Results:</span>
                        <span className="text-green-300 font-mono ml-2">Available</span>
                        <div className="mt-1">
                          <a
                            href={`https://ipfs.iex.ec/ipfs/${task.resultsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            <span>📁 Download Result</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Fetch Result Button - Show for completed tasks without results */}
                {task.status === 'COMPLETED' && !task.result && !task.isLoadingResult && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleFetchResult(task.taskId)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      📁 Fetch TEE Result & IPFS Download
                    </button>
                  </div>
                )}
                
                {/* Loading State */}
                {task.isLoadingResult && (
                  <div className="mt-3 flex items-center space-x-2 text-xs text-blue-300">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-300 border-t-transparent"></div>
                    <span>Fetching result from IPFS...</span>
                  </div>
                )}
                
                {/* Result Display */}
                {task.result && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">TEE Computation Result</h4>
                    <div className="space-y-2 text-xs">
                      {task.result.ipfsHash && task.result.ipfsHash !== 'Not available' && (
                        <div>
                          <span className="text-slate-400">IPFS Hash:</span>
                          <div className="mt-1">
                            <span className="text-purple-300 font-mono text-xs bg-black/20 px-2 py-1 rounded">
                              {String(task.result.ipfsHash)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {task.result.ipfsHash && task.result.ipfsHash !== 'Not available' && (
                        <div>
                          <span className="text-slate-400">Download Result:</span>
                          <div className="mt-1">
                            <a
                              href={`https://ipfs.iex.ec/ipfs/${String(task.result.ipfsHash)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium"
                            >
                              <span>📁 Download from IPFS</span>
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {(task.result as { status?: unknown }).status && (
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <span className="text-green-300 ml-2">{String((task.result as { status?: unknown }).status)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}

          {lastRefresh && (
            <div className="text-center pt-4">
              <p className="text-slate-500 text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}