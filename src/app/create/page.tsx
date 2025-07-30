'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useRouter } from 'next/navigation'
import { ClimateProtectionPHEABI, getContractAddressesPHE } from '../../lib/contracts-phe-v2'
import Header from '../../components/layout/Header'
import SuccessToast from '../../components/ui/SuccessToast'

export default function CreateProjectPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { climateProtectionPHE } = getContractAddressesPHE()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetAmount: '',
    duration: '30', // Default 30 days
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Hook for creating project
  const { 
    writeContract: createProject, 
    data: hash,
    isPending: isCreating,
    error: contractError
  } = useWriteContract()

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    // Form validation
    if (!formData.title.trim()) {
      setError('Please enter project title')
      return
    }

    if (!formData.description.trim()) {
      setError('Please enter project description')
      return
    }

    const targetAmountNum = parseFloat(formData.targetAmount)
    if (targetAmountNum <= 0) {
      setError('Target amount must be greater than 0')
      return
    }

    const durationNum = parseInt(formData.duration)
    if (durationNum < 1 || durationNum > 365) {
      setError('Project duration must be between 1-365 days')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Call smart contract to create project
      const targetAmountWei = parseEther(formData.targetAmount)
      const durationSeconds = BigInt(durationNum * 24 * 60 * 60)
      
      await createProject({
        address: climateProtectionPHE as `0x${string}`,
        abi: ClimateProtectionPHEABI,
        functionName: 'createProject',
        args: [
          formData.title,
          formData.description,
          targetAmountWei,
          durationSeconds
        ],
      })

    } catch (err) {
      setIsLoading(false)
      setError('Failed to create project, please try again')
      console.error('Create project error:', err)
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && !showSuccessToast) {
      setIsLoading(false)
      setShowSuccessToast(true)
      
      // Redirect after showing toast
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [isConfirmed, showSuccessToast, router])

  // Update loading state
  const isTransactionPending = isCreating || isConfirming
  if (isTransactionPending !== isLoading) {
    setIsLoading(isTransactionPending)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Create Climate Protection Project
              </h1>
              <p className="text-lg text-gray-600">
                Launch your environmental project and get global support
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Amazon Rainforest Protection Plan"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input w-full h-32 resize-none"
                  placeholder="Describe your project goals, implementation plan and expected results in detail..."
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="input w-full"
                  placeholder="https://example.com/project-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default environmental theme image will be used if not provided
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount (ETH) *
                  </label>
                  <input
                    type="number"
                    id="targetAmount"
                    step="0.01"
                    min="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                    className="input w-full"
                    placeholder="1.0"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (Days) *
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">365 days</option>
                  </select>
                </div>
              </div>

              {(error || contractError) && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error || contractError?.message}
                </div>
              )}

              {hash && (
                <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded">
                  🔗 Transaction submitted: <a 
                    href={`https://sepolia.etherscan.io/tx/${hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800"
                  >
                    View transaction details
                  </a>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  📋 Project Creation Guidelines
                </h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Projects cannot be modified once created, please verify information carefully</li>
                  <li>• After project deadline, you can withdraw all raised funds</li>
                  <li>• All donations are anonymous, protecting donor privacy</li>
                  <li>• Projects will receive global exposure, attracting more supporters</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={!isConnected || isLoading}
                className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    {isCreating ? 'Creating project...' : isConfirming ? 'Waiting for confirmation...' : 'Processing...'}
                  </div>
                ) : (
                  '🌍 Create Climate Protection Project'
                )}
              </button>

              {!isConnected && (
                <p className="text-center text-sm text-gray-500">
                  Please connect your wallet to create a project
                </p>
              )}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Toast */}
      <SuccessToast
        show={showSuccessToast}
        title="Project Created Successfully!"
        message="Your climate protection project has been created and is now live on the platform. Redirecting you to the homepage..."
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  )
}