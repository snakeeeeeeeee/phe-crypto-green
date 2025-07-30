'use client'

import { useEffect, useState } from 'react'

interface SuccessToastProps {
  show: boolean
  title: string
  message: string
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export default function SuccessToast({
  show,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 4000
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progressWidth, setProgressWidth] = useState(100)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setProgressWidth(100)
      
      if (autoClose) {
        // Start the progress bar countdown
        setTimeout(() => setProgressWidth(0), 100)
        
        // Auto close after duration
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onClose, 300) // Wait for animation to complete
        }, duration)
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
      setProgressWidth(100)
    }
  }, [show, autoClose, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full
          transform transition-all duration-300 ease-out pointer-events-auto
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Progress bar (if autoClose is enabled) */}
        {autoClose && (
          <div className="h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all ease-linear"
              style={{
                width: `${progressWidth}%`,
                transitionDuration: `${duration}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}