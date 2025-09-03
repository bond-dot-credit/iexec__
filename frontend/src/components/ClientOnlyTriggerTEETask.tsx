'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const TriggerTEETask = dynamic(() => import('./TriggerTEETask'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-500/20">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Loading wallet connection...</h4>
        <div className="animate-pulse bg-gray-600/20 h-10 rounded"></div>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-600/20 h-20 rounded"></div>
        <div className="bg-gray-600/20 h-32 rounded"></div>
        <div className="bg-gray-600/20 h-12 rounded"></div>
      </div>
    </div>
  )
})

interface TaskResult {
  deal: string
  task: string
  status?: string
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

interface ClientOnlyTriggerTEETaskProps {
  onTaskComplete: (result: TaskResult) => void
  onTaskStart: () => void
  isLoading: boolean
}

export default function ClientOnlyTriggerTEETask(props: ClientOnlyTriggerTEETaskProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/20 rounded-lg p-4 border border-gray-500/20">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Initializing...</h4>
        </div>
      </div>
    )
  }

  return <TriggerTEETask {...props} />
}