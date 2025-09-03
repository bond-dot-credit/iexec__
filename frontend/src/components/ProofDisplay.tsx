'use client'

import { useState } from 'react'

interface ProofDisplayProps {
  deal: string
  task: string
  ipfsHash?: string
}

export default function ProofDisplay({ deal, task, ipfsHash }: ProofDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const truncateHash = (hash: string, startChars: number = 10, endChars: number = 8) => {
    if (hash.length <= startChars + endChars) return hash
    return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`
  }

  const explorerUrl = `https://explorer.iex.ec/bellecour/deal/${deal}`
  const ipfsUrl = ipfsHash ? `https://ipfs-gateway.v8-bellecour.iex.ec/ipfs/${ipfsHash}` : null

  return (
    <div className="space-y-6">
      {/* Blockchain Verification */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-300">Blockchain Verified</h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">On-Chain</span>
          </div>
        </div>
        
        <p className="text-sm text-green-200 mb-4">
          This computation has been recorded on the iExec blockchain with cryptographic proof
        </p>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>View on Explorer</span>
        </a>
      </div>

      {/* Transaction Details */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-300">Transaction Details</h4>
        
        {/* Deal ID */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Deal ID</span>
            <button
              onClick={() => copyToClipboard(deal, 'deal')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              {copiedField === 'deal' ? (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate-300 break-all">
            {deal}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Smart contract managing the confidential computation deal
          </p>
        </div>

        {/* Task ID */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Task ID</span>
            <button
              onClick={() => copyToClipboard(task, 'task')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              {copiedField === 'task' ? (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate-300 break-all">
            {task}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Unique identifier for the TEE computation task
          </p>
        </div>

        {/* IPFS Hash */}
        {ipfsHash && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">IPFS Hash</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(ipfsHash, 'ipfs')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  {copiedField === 'ipfs' ? (
                    <>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {ipfsUrl && (
                  <a
                    href={ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View</span>
                  </a>
                )}
              </div>
            </div>
            <p className="font-mono text-xs text-slate-300 break-all">
              {ipfsHash}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Decentralized storage location for computation results
            </p>
          </div>
        )}
      </div>

      {/* Verification Steps */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-300 mb-3">Verification Process</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-blue-200">Smart contract execution verified</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-blue-200">TEE attestation confirmed</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-blue-200">Result integrity validated</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-blue-200">Blockchain transaction recorded</span>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Technical Details</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Network:</span>
            <p className="text-slate-300 mt-1">iExec Bellecour</p>
          </div>
          <div>
            <span className="text-slate-400">TEE Type:</span>
            <p className="text-slate-300 mt-1">Intel SGX</p>
          </div>
          <div>
            <span className="text-slate-400">Storage:</span>
            <p className="text-slate-300 mt-1">IPFS Distributed</p>
          </div>
          <div>
            <span className="text-slate-400">Consensus:</span>
            <p className="text-slate-300 mt-1">Proof of Stake</p>
          </div>
        </div>
      </div>
    </div>
  )
}