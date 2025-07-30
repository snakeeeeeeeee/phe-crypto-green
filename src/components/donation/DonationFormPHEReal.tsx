'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { ClimateProtectionPHEABI, getContractAddressesPHE } from '../../lib/contracts-phe-v2'
import {encryptDonationAmount, encryptDonationAmountNew, isFHEInitialized, testFHEEnvironment} from '../../lib/fhe-real'

interface DonationFormPHERealProps {
  projectId: number
  projectTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function DonationFormPHEReal({ 
  projectId, 
  projectTitle, 
  onClose, 
  onSuccess 
}: DonationFormPHERealProps) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'init' | 'input' | 'encrypting' | 'donating' | 'success'>('init')
  const [fheStatus, setFheStatus] = useState<string>('Not initialized')
  const [error, setError] = useState<string>('')
  const [isButtonLoading, setIsButtonLoading] = useState(false)

  const { address } = useAccount()
  const { climateProtectionPHE } = getContractAddressesPHE()

  // Hook for making donation
  const { 
    writeContract: makeDonation, 
    data: donationHash,
    isPending: isDonationPending,
    error: donationError,
    status: donationStatus
  } = useWriteContract()

  // Wait for transaction confirmation
  const { isSuccess: isDonationSuccess } = useWaitForTransactionReceipt({ hash: donationHash })

  // Monitor donation status changes
  useEffect(() => {
    console.log('Donation status changed:');
    console.log('- donationHash:', donationHash);
    console.log('- isDonationPending:', isDonationPending);
    console.log('- donationError:', donationError);
    console.log('- donationStatus:', donationStatus);
    
    if (donationError) {
      console.error('Donation error:', donationError);
      setError('Donation failed: ' + donationError.message);
      setStep('input');
      setIsButtonLoading(false); // Reset button loading state
    }
  }, [donationHash, isDonationPending, donationError, donationStatus]);

  // Initialize FHE environment on component mount
  useEffect(() => {
    const setupFHE = async () => {
      try {
        setFheStatus('Initializing FHE environment...')
        
        console.log('=== FHE initialization debug start ===');
        console.log('Current environment:', typeof window !== 'undefined' ? 'browser' : 'server');
        console.log('navigator.userAgent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A');
        
        // Test FHE environment
        const isWorking = await testFHEEnvironment()
        
        console.log('FHE environment test result:', isWorking);
        console.log('=== FHE initialization debug end ===');
        
        if (isWorking) {
          setFheStatus('FHE environment ready')
          setStep('input')
        } else {
          setFheStatus('FHE environment initialization failed')
          setError('FHE environment initialization failed, please check network connection or try refreshing the page')
        }
      } catch (error) {
        console.error('FHE initialization error:', error)
        setFheStatus('FHE environment initialization failed')
        setError('FHE environment initialization failed: ' + (error as Error).message)
      }
    }

    setupFHE()
  }, [])

  // Handle donation with real FHE encryption
  const handleDonate = async () => {
    if (!address || !amount) return

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      setError('Please enter a valid donation amount')
      return
    }

    if (!isFHEInitialized()) {
      setError('FHE environment not ready, please refresh page and try again')
      return
    }

    try {
      setError('')
      setIsButtonLoading(true) // 立即显示按钮 loading
      
      // 等待一个短暂的时间让UI更新
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setStep('encrypting')
      setIsButtonLoading(false) // 进入加密阶段后取消按钮loading
      
      // Convert ETH to wei
      const amountWei = parseEther(amount)
      
      console.log('开始FHE加密...')
      console.log('金额 (wei):', amountWei.toString())
      console.log('合约地址:', climateProtectionPHE)
      console.log('用户地址:', address)

      // Use real FHE encryption
      let ciphertexts = await encryptDonationAmountNew(
            climateProtectionPHE,
            address,
            amountWei
      );

      console.log('FHE加密完成 (新函数)');
      console.log('原始加密结果:', ciphertexts);
      console.log('handles数组:', ciphertexts.handles);
      console.log('handles[0]:', ciphertexts.handles[0]);
      console.log('handles[0]类型:', typeof ciphertexts.handles[0]);
      console.log('handles[0]构造函数:', ciphertexts.handles[0]?.constructor?.name);
      console.log('inputProof:', ciphertexts.inputProof);
      console.log('inputProof类型:', typeof ciphertexts.inputProof);
      console.log('inputProof构造函数:', ciphertexts.inputProof?.constructor?.name);
      
      // 需要将Uint8Array转换为hex字符串，因为ABI编码器期望字符串
      let processedHandle: string;
      let processedInputProof: string;
      
      // 处理handle (bytes32)
      if (ciphertexts.handles[0] instanceof Uint8Array) {
        processedHandle = '0x' + Array.from(ciphertexts.handles[0] as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        console.log('Handle转换为hex:', processedHandle);
      } else if (typeof ciphertexts.handles[0] === 'string') {
        processedHandle = ciphertexts.handles[0].startsWith('0x') ? ciphertexts.handles[0] : '0x' + ciphertexts.handles[0];
        console.log('Handle已是字符串:', processedHandle);
      } else {
        throw new Error('Handle格式不正确: ' + typeof ciphertexts.handles[0]);
      }
      
      // 处理inputProof (bytes)
      if (ciphertexts.inputProof instanceof Uint8Array) {
        processedInputProof = '0x' + Array.from(ciphertexts.inputProof as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        console.log('InputProof转换为hex:', processedInputProof);
      } else if (typeof ciphertexts.inputProof === 'string') {
        processedInputProof = ciphertexts.inputProof.startsWith('0x') ? ciphertexts.inputProof : '0x' + ciphertexts.inputProof;
        console.log('InputProof已是字符串:', processedInputProof);
      } else {
        throw new Error('InputProof格式不正确: ' + typeof ciphertexts.inputProof);
      }
      
      console.log('最终处理后的数据:');
      console.log('- processedHandle:', processedHandle);
      console.log('- processedInputProof长度:', processedInputProof.length);
      
      setStep('donating')

      // Submit the donation with real FHE encrypted data
      console.log(`projectId: ${BigInt(projectId)}`);
      console.log('准备提交合约调用...');
      console.log('合约地址:', climateProtectionPHE);
      console.log('ETH金额:', amountWei.toString());
      
      // 由于FHE合约的特殊性，直接尝试调用而不进行模拟
      // FHE数据的验证只能在真实的FHE环境中进行，模拟调用可能无法正确验证
      console.log('直接调用FHE合约...');
      
      // writeContract 是同步调用，会触发钱包弹窗
      makeDonation({
        address: climateProtectionPHE as `0x${string}`,
        abi: ClimateProtectionPHEABI,
        functionName: 'donate',
        args: [BigInt(projectId), processedHandle as `0x${string}`, processedInputProof as `0x${string}`],
        value: amountWei,
      });
      
      console.log("完成writeContract调用 - 钱包应该弹出了");

    } catch (error) {
      console.error('捐款失败:', error)
      setError('捐款失败: ' + (error as Error).message)
      setStep('input')
      setIsButtonLoading(false)
    }
  }

  // Handle successful donation
  useEffect(() => {
    if (isDonationSuccess && step === 'donating') {
      setStep('success')
    }
  }, [isDonationSuccess, step])

  const predefinedAmounts = ['0.001', '0.002', '0.005', '0.008', '0.01', '0.02'] // 使用更小的测试金额

  return (
    <div className="space-y-4">
      {step === 'init' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">🔐 Initializing FHE Environment</h3>
          <p className="text-gray-600 mb-4">{fheStatus}</p>
          <p className="text-sm text-gray-500">
            Connecting to Zama FHEVM gateway, please wait...
          </p>
          {error && (
            <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {step === 'input' && (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔐 Genuine FHE Encrypted Donation</h4>
            <p className="text-sm text-blue-800">
              Uses Zama FHEVM technology for fully homomorphic encryption, protecting your donation privacy
            </p>
            <div className="mt-2 text-xs text-blue-700">
              ✅ FHE Environment Status: {fheStatus}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Amount (ETH)
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
              Minimum donation: 0.001 ETH
            </p>
          </div>

          {/* Predefined amounts */}
          <div>
            <p className="text-sm text-gray-700 mb-2">Quick Select:</p>
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

          {/* NFT Tier Preview - Removed */}

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
              {message.length}/200
            </p>
          </div>*/}

          {/* Real FHE Privacy notice */}
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">🔐</span>
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Genuine FHE Privacy Protection:</p>
                <ul className="text-xs space-y-1">
                  <li>• Uses Zama FHEVM fully homomorphic encryption technology</li>
                  <li>• Donation amounts encrypted on client side, server cannot view</li>
                  <li>• Supports direct computation and comparison on encrypted data</li>
                  <li>• Decryption through decentralized oracle network</li>
                  <li>• Meets highest level privacy protection standards</li>
                </ul>
              </div>
            </div>
          </div>

          {(error || donationError) && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error || donationError?.message}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDonate}
              disabled={!amount || parseFloat(amount) <= 0 || !address || !isFHEInitialized() || isButtonLoading}
              className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isButtonLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === 'encrypting' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">🔐 FHE Encrypting</h3>
          <p className="text-gray-600 mb-4">
            Using Zama FHEVM technology to encrypt your donation amount...
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Generating encryption keys</p>
            <p>• Encrypting donation amount</p>
            <p>• Generating zero-knowledge proof</p>
            <p>• Preparing blockchain transaction</p>
          </div>
        </div>
      )}

      {step === 'donating' && (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDonationPending ? '📤 Submitting Encrypted Transaction' : '⏳ Waiting for Blockchain Confirmation'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDonationPending ? 'Submitting your FHE encrypted donation to blockchain...' : 'Waiting for blockchain transaction confirmation...'}
          </p>
          {donationHash && (
            <div className="text-sm">
              <a 
                href={`https://sepolia.etherscan.io/tx/${donationHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Transaction Details
              </a>
            </div>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">FHE Encrypted Donation Successful!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for your {parseFloat(amount)} ETH support to <strong>{projectTitle}</strong>!
          </p>
          <p className="text-sm text-green-700 mb-4">
            Your donation amount is fully encrypted and protected using advanced FHE technology
          </p>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded mb-4">
            <p className="mb-1">🔐 FHE Privacy Protection Notice:</p>
            <p>• Your donation amount is protected with fully homomorphic encryption</p>
            <p>• Only you have the key to decrypt your own donation records</p>
            <p>• Highest donor revealed through decentralized oracle after project ends</p>
            <p>• All computations performed directly on encrypted data</p>
          </div>

          <button
            onClick={() => {
              onSuccess()
              onClose()
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Complete
          </button>
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
if (typeof document !== 'undefined' && !document.getElementById('donation-form-phe-real-styles')) {
  const style = document.createElement('style')
  style.id = 'donation-form-phe-real-styles'
  style.textContent = styles
  document.head.appendChild(style)
}