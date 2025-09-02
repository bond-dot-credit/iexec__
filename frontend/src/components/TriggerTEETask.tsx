'use client'

import { useState, useEffect } from 'react'
import { IExecDataProtectorCore } from '@iexec/dataprotector'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface TaskResult {
  deal: string
  task: string
  status?: string
  txHash?: string
  explorerUrl?: string
  result?: {
    inputA: number
    scoringFormula: string
    result: number
    timestamp: string
    confidentialComputing: boolean
    teeProtected: boolean
  }
  ipfsHash?: string
  error?: string
  timestamp?: string
}

interface TriggerTEETaskProps {
  onTaskComplete: (result: TaskResult) => void
  onTaskStart: () => void
  isLoading: boolean
}


export default function TriggerTEETask({ onTaskComplete, onTaskStart, isLoading }: TriggerTEETaskProps) {
  const [inputValue, setInputValue] = useState<string>('5')
  const [useProtectedData, setUseProtectedData] = useState<boolean>(true)
  const [iAppAddress] = useState<string>('0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d')
  
  // Wallet connection
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [dataProtectorCore, setDataProtectorCore] = useState<IExecDataProtectorCore | null>(null)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null)
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isConnected && typeof window !== 'undefined' && window.ethereum) {
      // Request switch to Bellecour network
      const switchToBellecour = async () => {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x86' }], // 134 in hex
          })
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x86',
                chainName: 'iExec Bellecour',
                nativeCurrency: {
                  name: 'xRLC',
                  symbol: 'xRLC',
                  decimals: 18,
                },
                rpcUrls: ['https://bellecour.iex.ec'],
                blockExplorerUrls: ['https://blockscout-bellecour.iex.ec'],
              }],
            })
          }
        }
      }
      
      switchToBellecour().then(() => {
        // DataProtector will automatically use Bellecour (134) as the default network
        const dataProtector = new IExecDataProtectorCore(window.ethereum)
        setDataProtectorCore(dataProtector)
      }).catch(console.error)
    }
  }, [mounted, isConnected])

  const createProtectedData = async () => {
    try {
      if (!dataProtectorCore) {
        throw new Error('Wallet not connected')
      }
      
      if (!inputValue || isNaN(parseInt(inputValue))) {
        throw new Error('Invalid input value')
      }

      const protectedData = await dataProtectorCore.protectData({
        data: {
          integerA: parseInt(inputValue),
          description: "Frontend generated scoring data",
          source: "iExec Frontend Demo"
        },
        name: `Scoring Data - ${inputValue}`
      })

      return protectedData.address
    } catch (error) {
      console.error('Error creating protected data:', error)
      throw new Error(`Failed to create protected data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const grantAccessToApp = async (protectedDataAddr: string) => {
    try {
      if (!dataProtectorCore || !address) {
        throw new Error('Wallet not connected')
      }

      await dataProtectorCore.grantAccess({
        protectedData: protectedDataAddr,
        authorizedApp: iAppAddress,
        authorizedUser: address,
        numberOfAccess: 10,
        pricePerAccess: 0
      })
    } catch (error) {
      console.error('Error granting access:', error)
      throw new Error(`Failed to grant access: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const triggerTEETask = async () => {
    try {
      setError(null)
      
      if (!isConnected || !dataProtectorCore) {
        throw new Error('Wallet not connected')
      }
      
      if (!inputValue) {
        throw new Error('Input value is required')
      }
      
      onTaskStart()

      let protectedDataAddr = ''
      
      if (useProtectedData) {
        // Create new protected data with current input value
        protectedDataAddr = await createProtectedData()
        
        // Grant access to the iApp
        await grantAccessToApp(protectedDataAddr)
      }

      // Call backend API to execute iExec task
      const response = await fetch('/api/execute-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iAppAddress,
          useProtectedData,
          protectedDataAddress: protectedDataAddr,
          inputValue: useProtectedData ? undefined : inputValue,
          userAddress: address
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error (${response.status}): ${errorText || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.task) {
        setCurrentTaskId(result.task)
        setTaskStatus('submitted')
        setCurrentTxHash(result.txHash || null)
        setExplorerUrl(result.explorerUrl || null)
        // Start monitoring task status
        monitorTaskStatus(result.task)
      } else {
        onTaskComplete(result)
      }
      
    } catch (error) {
      console.error('Error triggering TEE task:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      setCurrentTaskId(null)
      setTaskStatus('')
      setCurrentTxHash(null)
      setExplorerUrl(null)
      onTaskComplete({
        deal: '',
        task: '',
        error: errorMessage
      })
    }
  }
  
  const monitorTaskStatus = async (taskId: string) => {
    let attempts = 0
    const maxAttempts = 60 // Monitor for up to 5 minutes (60 * 5s = 300s)
    
    const checkStatus = async () => {
      attempts++
      
      try {
        console.log(`Checking task ${taskId} status (attempt ${attempts})...`)
        const response = await fetch(`/api/task-status?taskId=${taskId}`)
        
        if (response.ok) {
          const statusData = await response.json()
          console.log('Task status:', statusData)
          setTaskStatus(statusData.status || 'checking')
          
          // Check for completed states
          if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED' || statusData.status === 'TIMEOUT') {
            setCurrentTaskId(null)
            setCurrentTxHash(null)
            setExplorerUrl(null)
            onTaskComplete({
              deal: '',
              task: taskId,
              status: statusData.status,
              result: statusData.result,
              timestamp: statusData.timestamp
            })
            return
          }
          
          // Continue monitoring if not completed and haven't exceeded max attempts
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000) // Check every 5 seconds
          } else {
            // Max attempts reached
            setError('Task monitoring timeout - please check manually')
            setCurrentTaskId(null)
          }
        } else {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Error monitoring task:', error)
        
        if (attempts < maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.min(15000, 5000 * Math.pow(1.5, attempts - 1))
          setTimeout(checkStatus, delay)
        } else {
          setError(`Task monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setCurrentTaskId(null)
        }
      }
    }
    
    // Start monitoring immediately
    checkStatus()
  }


  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
          <h4 className="text-sm font-medium text-red-300 mb-2">Error</h4>
          <p className="text-xs text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Wallet Connection */}
      {!mounted ? (
        <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-500/20">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Loading...</h4>
        </div>
      ) : !isConnected ? (
        <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/20">
          <h4 className="text-sm font-medium text-yellow-300 mb-3">Connect Wallet</h4>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/20">
          <h4 className="text-sm font-medium text-green-300 mb-2">Wallet Connected</h4>
          <p className="text-xs text-green-200 font-mono">{address}</p>
          <button
            onClick={() => disconnect()}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Transaction Tracking */}
      {currentTaskId && (
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-300 mb-3">Task Processing</h4>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-blue-200">Task ID:</span>
              <span className="font-mono text-blue-100 ml-2">{currentTaskId}</span>
            </div>
            <div>
              <span className="text-blue-200">Status:</span>
              <span className="text-blue-100 ml-2 capitalize">{taskStatus}</span>
            </div>
            {currentTxHash && (
              <div>
                <span className="text-blue-200">Transaction:</span>
                <span className="font-mono text-blue-100 ml-2">{currentTxHash.slice(0, 10)}...{currentTxHash.slice(-8)}</span>
              </div>
            )}
            {explorerUrl && (
              <div className="mt-3">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                >
                  <span>View on iExec Explorer</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Value */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Input Value (Integer A)
        </label>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter integer value"
          disabled={!mounted || isLoading}
        />
        <p className="text-xs text-slate-400 mt-1">
          This value will be processed securely in the TEE
        </p>
      </div>

      {/* Input Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Input Method
        </label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={useProtectedData}
              onChange={() => setUseProtectedData(true)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              disabled={!mounted || isLoading}
            />
            <span className="text-slate-300">
              Protected Data (Encrypted via DataProtector)
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={!useProtectedData}
              onChange={() => setUseProtectedData(false)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              disabled={!mounted || isLoading}
            />
            <span className="text-slate-300">
              Requester Secret (Direct encrypted input)
            </span>
          </label>
        </div>
      </div>


      {/* App Configuration */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Configuration</h4>
        <div className="space-y-2 text-xs text-slate-400">
          <p><span className="font-mono">iApp:</span> {iAppAddress}</p>
          {useProtectedData && (
            <p><span className="font-mono">Protected Data:</span> Will be created dynamically</p>
          )}
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={triggerTEETask}
        disabled={!mounted || isLoading || !isConnected || !inputValue || !!currentTaskId}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isLoading || currentTaskId ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>
              {currentTaskId ? `Task ${taskStatus || 'submitted'}...` : 'Processing in TEE...'}
            </span>
          </div>
        ) : (
          'Trigger TEE Computation'
        )}
      </button>

      {/* Process Description */}
      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Process Overview</h4>
        <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
          <li>Input value is encrypted using DataProtector or Requester Secret</li>
          <li>TEE task is triggered on iExec decentralized network</li>
          <li>Computation (A × 2) occurs within Intel SGX enclave</li>
          <li>Result is returned unencrypted with blockchain proof</li>
        </ol>
      </div>
    </div>
  )
}