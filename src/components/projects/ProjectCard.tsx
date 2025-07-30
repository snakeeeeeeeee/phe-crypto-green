'use client'

import { formatEther } from 'viem'
import { ClimateProjectPHE, getProjectStatus, getProjectStatusForCreator } from '../../lib/contracts-phe-v2'

interface ProjectCardProps {
  project: ClimateProjectPHE
  onDonate?: (project: ClimateProjectPHE) => void
  onWithdraw?: (project: ClimateProjectPHE) => void
  progress?: number
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  }
  canDonate?: boolean
  canWithdraw?: boolean
  isCreator?: boolean
  isDonor?: boolean
  userAddress?: string
  showFHEBadge?: boolean
  isWithdrawing?: boolean
  withdrawHash?: string
}

export default function ProjectCard({ 
  project, 
  onDonate,
  onWithdraw, 
  progress = 0, 
  timeRemaining, 
  canDonate = false,
  canWithdraw = false,
  isCreator = false,
  isDonor = false,
  userAddress,
  showFHEBadge = false,
  isWithdrawing = false,
  withdrawHash
}: ProjectCardProps) {

  const formatDeadline = () => {
    if (!timeRemaining) return 'Time TBD'
    
    if (timeRemaining.expired) {
      return 'Expired'
    }
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} days left`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours} hours left`
    } else {
      return `${timeRemaining.minutes} minutes left`
    }
  }

  const handleDonate = () => {
    if (onDonate && canDonate) {
      onDonate(project)
    }
  }

  const handleWithdraw = () => {
    if (onWithdraw && canWithdraw) {
      onWithdraw(project)
    }
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow relative">
      {/* 标签区域 - 统一管理所有标签 */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
        {/* 左上角：功能标签 */}
        <div className="flex flex-col gap-1">
          {showFHEBadge && (
            <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm border border-purple-200 backdrop-blur-sm">
              🔐 PHE Encrypted
            </span>
          )}
        </div>
        
        {/* 右上角：用户关系标签 */}
        <div className="flex flex-col gap-1.5 items-end">
          {isCreator && (
            <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm border border-purple-300">
              👑 Creator
            </span>
          )}
          {isDonor && !isCreator && (
            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm border border-green-300">
              ✅ Supported
            </span>
          )}
        </div>
      </div>
      
      <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg mb-4 overflow-hidden mt-8">
        <div className="w-full h-full flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-sm font-medium">{project.title}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {project.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Target Amount</span>
            <span className="font-medium text-gray-900">
              {formatEther(project.targetAmount)} ETH
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Donors</span>
            <span className="font-medium text-green-600">
              {Number(project.donorCount)} people
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Deadline</span>
            <span className={`font-medium ${timeRemaining?.expired ? 'text-red-600' : 'text-orange-600'}`}>
              {formatDeadline()}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          {isCreator ? (
            // Show withdrawal button for project creator
            <div className="space-y-2">
              {canWithdraw ? (
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>💰</span>
                      <span>Withdraw Funds</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-lg font-medium text-center bg-gray-100 text-gray-500">
                  {getProjectStatusForCreator(project, progress, timeRemaining)}
                </div>
              )}
              
              {/* Show project status for creator */}
              <div className="text-xs text-gray-500 text-center">
                Current raised: {formatEther(project.totalDonationsPublic)} ETH
                {project.isCompleted ? ' • Project completed' : ''}
                {withdrawHash && (
                  <div className="mt-2">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${withdrawHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      View Transaction
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show donation button for regular users
            <>
              {canDonate ? (
                <button
                  onClick={handleDonate}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>🔐</span>
                  <span>Encrypted Donation</span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-lg font-medium text-center bg-gray-100 text-gray-500">
                  {getProjectStatus(project, timeRemaining)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}