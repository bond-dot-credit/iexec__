'use client'

interface ScoreResult {
  inputA: number
  scoringFormula: string
  result: number
  timestamp: string
  confidentialComputing: boolean
  teeProtected: boolean
}

interface ScoreDisplayProps {
  result?: ScoreResult
  isLoading: boolean
  error?: string
}

export default function ScoreDisplay({ result, isLoading, error }: ScoreDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        <p className="text-slate-300 text-center">
          Computing in secure TEE environment...
        </p>
        <div className="text-xs text-slate-400 text-center max-w-md">
          Your data is being processed within an Intel SGX enclave on the iExec network
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-300">Computation Error</h3>
        </div>
        <p className="text-red-200 text-sm">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-800/50 rounded-full h-20 w-20 mx-auto mb-4 flex items-center justify-center">
          <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Compute</h3>
        <p className="text-slate-400 text-sm">
          Trigger a TEE computation to see confidential scoring results
        </p>
      </div>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Main Result Display */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-green-300">Computation Complete</h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">TEE Verified</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-green-200 mb-1">Input (A)</p>
            <p className="text-3xl font-bold text-white">{result.inputA}</p>
          </div>
          <div>
            <p className="text-sm text-green-200 mb-1">Output (Result)</p>
            <p className="text-3xl font-bold text-white">{result.result}</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-black/20 rounded-lg">
          <p className="text-sm text-green-200 mb-1">Formula Applied</p>
          <p className="font-mono text-green-300">{result.scoringFormula}</p>
        </div>
      </div>

      {/* Security Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-blue-300 font-medium">Confidential Computing</span>
          </div>
          <p className="text-xs text-blue-200">
            {result.confidentialComputing ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-purple-300 font-medium">TEE Protection</span>
          </div>
          <p className="text-xs text-purple-200">
            {result.teeProtected ? 'Intel SGX Secured' : 'Not Protected'}
          </p>
        </div>
      </div>

      {/* Computation Details */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Computation Details</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-300 font-mono">{formatTimestamp(result.timestamp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Algorithm:</span>
            <span className="text-slate-300">Confidential Scoring</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Environment:</span>
            <span className="text-slate-300">iExec Decentralized Network</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Security:</span>
            <span className="text-green-300">Hardware TEE (Intel SGX)</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-300 mb-1">Privacy Guarantee</h4>
            <p className="text-xs text-amber-200">
              Your input data was processed within a hardware-secured enclave. 
              The raw data never left the TEE environment and remains confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}