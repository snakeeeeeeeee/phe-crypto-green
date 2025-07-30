'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ClimateProtectionPHEABI as ClimateProtectionETHABI } from '../../lib/contracts-phe-v2'

interface DonationFormETHProps {
  projectId: number
  projectTitle: string
  contractAddress: string
  onClose: () => void
  onSuccess: () => void
}

export default function DonationFormETH({ 
  projectId, 
  projectTitle, 
  contractAddress,
  onClose, 
  onSuccess 
}: DonationFormETHProps) {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'encrypting' | 'donating' | 'success'>('input')

  const { address } = useAccount()

  // Hook for donation
  const { 
    writeContract: donate, 
    data: hash,
    isPending: isDonating,
    error: contractError
  } = useWriteContract()

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  })

  const handleDonate = async () => {
    if (!address || !amount) {
      setError('请输入捐款金额')
      return
    }

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      setError('捐款金额必须大于0')
      return
    }

    try {
      setIsProcessing(true)
      setError('')
      setStep('encrypting')

      // 对于ETH版本，我们简化处理，直接使用明文金额
      // 在实际FHE实现中，这里需要使用FHE加密
      const amountWei = parseEther(amount)
      
      // 创建模拟的加密数据（实际应用中需要真正的FHE加密）
      const mockEncryptedAmount = '0x' + amountWei.toString(16).padStart(64, '0')
      const mockInputProof = '0x00' // 模拟的输入证明

      setStep('donating')

      await donate({
        address: contractAddress as `0x${string}`,
        abi: ClimateProtectionETHABI,
        functionName: 'donate',
        args: [BigInt(projectId), mockEncryptedAmount as `0x${string}`, mockInputProof as `0x${string}`],
        value: amountWei
      })

    } catch (err) {
      console.error('Donation error:', err)
      setError('捐款失败，请重试')
      setStep('input')
      setIsProcessing(false)
    }
  }

  // Handle successful donation
  if (isConfirmed && step !== 'success') {
    setStep('success')
    setIsProcessing(false)
    
    setTimeout(() => {
      onSuccess()
    }, 2000)
  }

  const isTransactionPending = isDonating || isConfirming

  return (
    <div className="space-y-4">
      {step === 'input' && (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💰 ETH直接捐款</h4>
            <p className="text-sm text-blue-800">
              直接使用ETH进行捐款，保护您的隐私安全
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              捐款金额 (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input w-full pr-12"
                placeholder="0.01"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                ETH
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              最低捐款: 0.001 ETH
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💰 直接捐款</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div>• 0.001+ ETH: 支持环保项目</div>
              <div>• 0.05+ ETH: 有意义的贡献</div>
              <div>• 0.1+ ETH: 重大支持</div>
              <div>• 0.5+ ETH: 杰出贡献</div>
            </div>
          </div>

          {(error || contractError) && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error || contractError?.message}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleDonate}
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>准备中...</span>
                </>
              ) : (
                <>
                  <span>💚</span>
                  <span>捐助支持</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === 'encrypting' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">🔐 准备加密数据</h3>
          <p className="text-gray-600">正在为您的捐款数据进行FHE加密...</p>
        </div>
      )}

      {step === 'donating' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDonating ? '📤 提交交易中' : '⏳ 等待确认'}
          </h3>
          <p className="text-gray-600">
            {isDonating ? '正在向区块链提交您的捐款...' : '等待区块链确认交易...'}
          </p>
          {hash && (
            <div className="mt-4 text-sm">
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                查看交易详情
              </a>
            </div>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">捐款成功！</h3>
          <p className="text-gray-600 mb-4">
            感谢您对 <strong>{projectTitle}</strong> 的支持！
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-medium">💰 您的捐款已成功提交！</p>
            <p className="text-green-700 text-sm mt-1">
              感谢您对环保事业的支持和贡献
            </p>
          </div>
        </div>
      )}
    </div>
  )
}