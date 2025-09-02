'use client'

import { useState } from 'react'
import TriggerTEETask from '@/components/TriggerTEETask'
import ScoreDisplay from '@/components/ScoreDisplay'
import ProofDisplay from '@/components/ProofDisplay'

interface TaskResult {
  deal: string
  task: string
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
}

export default function Home() {
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTaskComplete = (result: TaskResult) => {
    setTaskResult(result)
    setIsLoading(false)
  }

  const handleTaskStart = () => {
    setIsLoading(true)
    setTaskResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            iExec Confidential Computing
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Secure scoring algorithm powered by Trusted Execution Environments (TEE) 
            on the iExec decentralized network
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Task Trigger */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Trigger TEE Computation
            </h2>
            <TriggerTEETask 
              onTaskComplete={handleTaskComplete}
              onTaskStart={handleTaskStart}
              isLoading={isLoading}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Score Display */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Computation Results
              </h2>
              <ScoreDisplay 
                result={taskResult?.result} 
                isLoading={isLoading}
                error={taskResult?.error}
              />
            </div>

            {/* Proof Display */}
            {taskResult && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Blockchain Proof
                </h2>
                <ProofDisplay 
                  deal={taskResult.deal}
                  task={taskResult.task}
                  ipfsHash={taskResult.ipfsHash}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-400">
            Powered by iExec • Secured by Intel SGX • Verified on Blockchain
          </p>
        </div>
      </div>
    </div>
  )
}
