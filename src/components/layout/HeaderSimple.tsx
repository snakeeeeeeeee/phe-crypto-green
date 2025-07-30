'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import Link from 'next/link'

export default function HeaderSimple() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-climate-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🌍</span>
              </div>
              <span className="font-bold text-xl text-gray-900">气候保护平台</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-climate-green-600 font-medium">
              首页
            </Link>
            <Link href="/gallery" className="text-gray-600 hover:text-climate-green-600 font-medium">
              我的 NFT
            </Link>
            <Link href="/create" className="text-gray-600 hover:text-climate-green-600 font-medium">
              创建项目
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  断开连接
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const metaMaskConnector = connectors.find(c => c.name === 'MetaMask')
                  if (metaMaskConnector) {
                    connect({ connector: metaMaskConnector })
                  }
                }}
                className="bg-climate-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-climate-green-700 transition-colors"
              >
                连接钱包
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}