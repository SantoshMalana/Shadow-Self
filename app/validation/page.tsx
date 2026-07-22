'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ValidationPage() {
  const [testId, setTestId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('testId')) {
      setTestId(params.get('testId'))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Blind Pairwise Validation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Can you tell the human from the clone?
          </p>
        </div>

        {testId ? (
          <TakeTest testId={testId} />
        ) : (
          <GenerateTest onTestCreated={(id) => setTestId(id)} />
        )}
      </div>
    </div>
  )
}

function GenerateTest({ onTestCreated }: { onTestCreated: (id: string) => void }) {
  const [scenario, setScenario] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/pairwise/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, userAnswer })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate test')
      }

      const data = await res.json()
      
      // Update the URL to include the testId so it can be shared
      window.history.pushState({}, '', `/validation?testId=${data.testId}`)
      onTestCreated(data.testId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
      <h3 className="text-xl font-bold mb-4">Create a new test</h3>
      <p className="text-gray-400 mb-6 text-sm">
        Provide a scenario and your authentic human response. We'll generate a clone response in the background and create a blind A/B test.
      </p>
      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300">Scenario / Prompt</label>
          <textarea
            required
            className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            rows={3}
            placeholder="e.g. How would you architect the auth system for this app?"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Your Answer (Ground Truth)</label>
          <textarea
            required
            className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            rows={5}
            placeholder="Your detailed response..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
        </div>
        
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50"
        >
          {isGenerating ? 'Generating Clone Answer...' : 'Create Blind Test'}
        </button>
      </form>
    </div>
  )
}

function TakeTest({ testId }: { testId: string }) {
  const [test, setTest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [result, setResult] = useState<{ correctOption: string, isCorrect: boolean } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/pairwise/vote?testId=${testId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTest(data)
        if (data.resolvedAt) {
          setResult({ correctOption: data.correctOption, isCorrect: data.votedOption === data.correctOption })
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [testId])

  const handleVote = async (option: 'A' | 'B') => {
    setIsVoting(true)
    setError('')
    try {
      const res = await fetch('/api/pairwise/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, votedOption: option })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to vote')
      }
      const data = await res.json()
      setResult(data)
      setTest((prev: any) => ({ ...prev, resolvedAt: new Date().toISOString() }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) return <div className="text-center text-gray-400">Loading test...</div>
  if (error) return <div className="text-center text-red-500">{error}</div>
  if (!test) return null

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 space-y-6">
      <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Scenario</h4>
        <p className="text-gray-100 whitespace-pre-wrap">{test.scenario}</p>
      </div>

      {!result && (
        <p className="text-center text-yellow-400 text-sm font-medium animate-pulse">
          Vote for the answer you believe was written by the HUMAN.
        </p>
      )}

      {result && (
        <div className={`p-4 rounded-md text-center font-bold text-lg ${result.isCorrect ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
          {result.isCorrect ? 'Correct! You spotted the human.' : 'Fooled! You picked the clone.'}
          <div className="text-sm mt-2 font-normal text-gray-300">
            The human answer was Option {result.correctOption}.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['A', 'B'].map((opt) => (
          <div 
            key={opt}
            onClick={() => !result && !isVoting && handleVote(opt as 'A'|'B')}
            className={`
              p-6 rounded-lg border-2 transition-all duration-200 flex flex-col h-full
              ${!result && !isVoting ? 'cursor-pointer hover:border-blue-500 hover:bg-gray-750 border-gray-700 bg-gray-900' : ''}
              ${result && result.correctOption === opt ? 'border-green-500 bg-gray-900' : ''}
              ${result && result.correctOption !== opt ? 'border-gray-800 bg-gray-900/50 opacity-75' : ''}
            `}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold">Option {opt}</h4>
              {result && result.correctOption === opt && (
                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs font-bold uppercase rounded">Human</span>
              )}
              {result && result.correctOption !== opt && (
                <span className="px-2 py-1 bg-purple-900 text-purple-300 text-xs font-bold uppercase rounded">Clone</span>
              )}
            </div>
            <div className="text-gray-300 whitespace-pre-wrap flex-grow">
              {opt === 'A' ? test.optionA : test.optionB}
            </div>
            
            {!result && (
              <button 
                className="mt-6 w-full py-2 px-4 border border-gray-600 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                disabled={isVoting}
              >
                Vote Human
              </button>
            )}
          </div>
        ))}
      </div>
      
      {result && (
        <div className="text-center pt-4">
          <button 
            onClick={() => window.location.href = '/validation'}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            ← Create another test
          </button>
        </div>
      )}
    </div>
  )
}
