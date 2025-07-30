'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-climate-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🌍</span>
              </div>
              <span className="font-bold text-xl text-gray-900">CryptoGreen</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-climate-green-600 font-medium">
              Home
            </Link>
{/*            <Link href="/gallery" className="text-gray-600 hover:text-climate-green-600 font-medium">
              My NFTs
            </Link>*/}
            <Link href="/create" className="text-gray-600 hover:text-climate-green-600 font-medium">
              Create Project
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}