'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { ClimateProtectionPHEABI, getContractAddressesPHE } from '../../lib/contracts-phe-v2'
import { generateVirtualNFT, saveVirtualNFT, calculateDonationTier } from '../../lib/virtual-nft'
import { initializeFHE, isFHEInitialized, encryptDonationAmount } from '../../lib/fhe-real'

interface DonationFormPHEProps {
  projectId: number
  projectTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function DonationFormPHE({ 
  projectId, 
  projectTitle, 
  onClose, 
  onSuccess 
}: DonationFormPHEProps) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'input' | 'encrypting' | 'donating' | 'success'>('input')
  const [generatedNFT, setGeneratedNFT] = useState<any>(null)
  const [fheReady, setFheReady] = useState(false)
  const [fheError, setFheError] = useState<string | null>(null)

  const { address } = useAccount()
  const { climateProtectionPHE } = getContractAddressesPHE()

  // Hook for making donation
  const { 
    writeContract: makeDonation, 
    data: donationHash,
    isPending: isDonationPending,
    error: donationError
  } = useWriteContract()

  // Wait for transaction confirmation
  const { isSuccess: isDonationSuccess } = useWaitForTransactionReceipt({ hash: donationHash })

  // Initialize FHE when component mounts
  useEffect(() => {
    const initFHE = async () => {
      try {
        setStep('encrypting')
        if (!isFHEInitialized()) {
          console.log('🔐 初始化FHE环境...')
          const success = await initializeFHE()
          if (!success) {
            throw new Error('FHE初始化失败')
          }
        }
        setFheReady(true)
        setStep('input')
        console.log('✅ FHE环境准备就绪')
      } catch (error) {
        console.error('❌ FHE初始化错误:', error)
        setFheError(`FHE初始化失败: ${(error as Error).message}`)
        setStep('input')
      }
    }

    initFHE()
  }, [])

  // Handle donation with ETH
  const handleDonate = async () => {
    if (!address || !amount || !fheReady) return

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      alert('请输入有效的捐款金额')
      return
    }

    try {
      setStep('encrypting')
      
      // Convert ETH to wei
      const amountWei = parseEther(amount)
      
      console.log('🔐 开始加密捐款数据...')
      console.log('捐款金额 (wei):', amountWei.toString())
      console.log('合约地址:', climateProtectionPHE)
      console.log('用户地址:', address)
      
      // 使用真实的FHE加密 - 根据官方示例
      const encryptedData = await encryptDonationAmount(
        climateProtectionPHE,
        address,
        amountWei
      )
      
      console.log('✅ 加密完成:')
      console.log('- handles:', encryptedData.handles)
      console.log('- inputProof length:', encryptedData.inputProof.length)

      setStep('donating')

      // 提交捐款交易 - 使用加密数据
      await makeDonation({
        address: climateProtectionPHE as `0x${string}`,
        abi: ClimateProtectionPHEABI,
        functionName: 'donate',
        args: [
          BigInt(projectId), 
          encryptedData.handles[0] as `0x${string}`, 
          encryptedData.inputProof as `0x${string}`
        ],
        value: amountWei // Send ETH with the transaction
      })

    } catch (error) {
      console.error('❌ 捐款失败:', error)
      setStep('input')
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`捐款失败: ${errorMessage}`)
    }
  }

  // Handle successful donation
  if (isDonationSuccess && step === 'donating') {
    // Generate and save virtual NFT
    if (!generatedNFT && address) {
      const amountNum = parseFloat(amount)
      const tier = calculateDonationTier(amountNum)
      const virtualNFT = generateVirtualNFT(
        projectId,
        projectTitle,
        address,
        amountNum,
        message
      )
      
      if (saveVirtualNFT(virtualNFT)) {
        setGeneratedNFT(virtualNFT)
      }
    }
    
    setStep('success')
  }

  const predefinedAmounts = ['0.01', '0.05', '0.1', '0.5', '1.0', '2.0'] // In ETH

  return (
    <div className="space-y-4">
      {step === 'input' && (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💰 ETH加密捐款</h4>
            <p className="text-sm text-blue-800">
              直接使用ETH进行捐款，同时保护您的隐私安全
            </p>
            {!fheReady && (
              <div className="mt-2 flex items-center text-sm text-orange-600">
                <div className="loading-spinner mr-2" style={{width: '16px', height: '16px'}}></div>
                FHE环境初始化中...
              </div>
            )}
            {fheError && (
              <div className="mt-2 text-sm text-red-600">
                ⚠️ {fheError}
              </div>
            )}
          </div>

          {/* Amount Input */}
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

          {/* Predefined amounts */}
          <div>
            <p className="text-sm text-gray-700 mb-2">快速选择:</p>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {preset} ETH
                </button>
              ))}
            </div>
          </div>

          {/* NFT Tier Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-purple-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    🎨 NFT 奖励预览
                  </p>
                  <p className="text-xs text-purple-600">
                    {(() => {
                      const tier = calculateDonationTier(parseFloat(amount))
                      return `${tier.tierEmoji} ${tier.tierName}`
                    })()}
                  </p>
                </div>
                <div className="text-2xl">
                  {(() => {
                    const tier = calculateDonationTier(parseFloat(amount))
                    return tier.tierEmoji
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          {/*<div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              个人消息 (可选)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="留下您对这个项目的支持消息..."
              maxLength={200}
              rows={3}
              className="input w-full resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/200 - 此消息将保存在您的NFT中
            </p>
          </div>*/}

          {/* FHE Privacy notice */}
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">🔐</span>
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">FHE隐私保护说明:</p>
                <ul className="text-xs space-y-1">
                  <li>• 使用Zama FHEVM技术完全加密捐款金额</li>
                  <li>• 支持在加密数据上直接计算比较</li>
                  <li>• 只有您可以解密查看自己的捐款记录</li>
                  <li>• 项目结束后可解密显示最高捐赠者</li>
                </ul>
              </div>
            </div>
          </div>

          {donationError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              捐款失败: {donationError.message}
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
              disabled={!amount || parseFloat(amount) <= 0 || !address || !fheReady}
              className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fheReady ? '💚 捐款支持' : '🔐 准备中...'}
            </button>
          </div>
        </>
      )}

      {step === 'encrypting' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">🔐 加密处理中</h3>
          <p className="text-gray-600">
            {fheReady ? '正在为您的捐款数据进行FHE加密...' : '正在初始化FHE环境...'}
          </p>
          <div className="mt-4 text-xs text-gray-500">
            <p>• 使用Zama FHEVM技术进行同态加密</p>
            <p>• 确保捐款金额完全保密</p>
            <p>• 支持加密状态下的数值比较</p>
          </div>
        </div>
      )}

      {step === 'donating' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDonationPending ? '📤 提交交易中' : '⏳ 等待确认'}
          </h3>
          <p className="text-gray-600">
            {isDonationPending ? '正在向区块链提交您的ETH捐款...' : '等待区块链确认交易...'}
          </p>
          {donationHash && (
            <div className="mt-4 text-sm">
              <a 
                href={`https://sepolia.etherscan.io/tx/${donationHash}`}
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
          <h3 className="text-xl font-bold text-green-600 mb-2">ETH捐款成功！</h3>
          <p className="text-gray-600 mb-4">
            感谢您对 <strong>{projectTitle}</strong> 的{parseFloat(amount)} ETH支持！
          </p>

          {/* NFT Reward Display */}
          {generatedNFT && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="mb-3">
                <h5 className="text-sm font-medium text-purple-800 mb-2">
                  🎨 您获得了纪念NFT！
                </h5>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-3xl">{generatedNFT.metadata.image}</span>
                </div>
                <p className="text-xs text-purple-700 font-medium">
                  {generatedNFT.metadata.name}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  感谢您 {amount} ETH 的捐款
                </p>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded mb-4">
            <p className="mb-1">🔐 隐私保护说明:</p>
            <p>• 您的捐款金额已完全加密存储</p>
            <p>• 项目结束后可通过解密oracle揭示最高捐赠者</p>
            <p>• NFT纪念品已保存到您的收藏中</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              完成
            </button>
            
            <button
              onClick={() => window.open('/nft-collection', '_blank')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              查看我的NFT收藏
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading spinner styles
const styles = `
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('donation-form-phe-styles')) {
  const style = document.createElement('style')
  style.id = 'donation-form-phe-styles'
  style.textContent = styles
  document.head.appendChild(style)
}