'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import Header from '../../components/layout/Header'

interface NFTMetadata {
  tokenId: number
  donationTier: number
  climateTheme: string
  timestamp: number
  imageUrl: string
  tierName: string
}

// Climate theme configuration
const CLIMATE_THEMES = {
  FOREST: {
    name: 'Forest Protection',
    emoji: '🌲',
    color: 'from-green-400 to-emerald-600',
    bgImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop'
  },
  OCEAN: {
    name: 'Ocean Protection', 
    emoji: '🌊',
    color: 'from-blue-400 to-cyan-600',
    bgImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=300&h=200&fit=crop'
  },
  RENEWABLE: {
    name: 'Renewable Energy',
    emoji: '☀️',
    color: 'from-yellow-400 to-orange-600',
    bgImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=200&fit=crop'
  },
  CARBON: {
    name: 'Carbon Neutral',
    emoji: '🏭',
    color: 'from-gray-400 to-slate-600',
    bgImage: 'https://images.unsplash.com/photo-1497436072909-f5e4be1dfeaf?w=300&h=200&fit=crop'
  }
}

// Donation tier configuration
const TIER_CONFIG = {
  1: { name: 'Basic', emoji: '⭐', color: 'bg-gray-100 text-gray-800' },
  2: { name: 'Bronze', emoji: '🥉', color: 'bg-amber-100 text-amber-800' },
  3: { name: 'Silver', emoji: '🥈', color: 'bg-gray-200 text-gray-800' },
  4: { name: 'Gold', emoji: '🥇', color: 'bg-yellow-100 text-yellow-800' },
  5: { name: 'Diamond', emoji: '💎', color: 'bg-purple-100 text-purple-800' }
}

export default function NFTGalleryPage() {
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState<NFTMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNft, setSelectedNft] = useState<NFTMetadata | null>(null)

  useEffect(() => {
    const loadUserNFTs = async () => {
      if (!isConnected || !address) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // TODO: 从智能合约获取用户的NFTs
        // const userNFTs = await getUserNFTs(address)
        
        // 模拟数据
        const mockNFTs: NFTMetadata[] = [
          {
            tokenId: 1,
            donationTier: 5,
            climateTheme: 'FOREST',
            timestamp: Date.now() - 86400000,
            imageUrl: CLIMATE_THEMES.FOREST.bgImage,
            tierName: TIER_CONFIG[5].name
          },
          {
            tokenId: 2,
            donationTier: 3,
            climateTheme: 'OCEAN',
            timestamp: Date.now() - 172800000,
            imageUrl: CLIMATE_THEMES.OCEAN.bgImage,
            tierName: TIER_CONFIG[3].name
          },
          {
            tokenId: 3,
            donationTier: 4,
            climateTheme: 'RENEWABLE',
            timestamp: Date.now() - 259200000,
            imageUrl: CLIMATE_THEMES.RENEWABLE.bgImage,
            tierName: TIER_CONFIG[4].name
          }
        ]
        
        setNfts(mockNFTs)
      } catch (error) {
        console.error('加载NFTs失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserNFTs()
  }, [isConnected, address])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }

  const NFTCard = ({ nft }: { nft: NFTMetadata }) => {
    const theme = CLIMATE_THEMES[nft.climateTheme as keyof typeof CLIMATE_THEMES]
    const tier = TIER_CONFIG[nft.donationTier as keyof typeof TIER_CONFIG]

    return (
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
        onClick={() => setSelectedNft(nft)}
      >
        <div className="relative h-48">
          <Image
            src={nft.imageUrl}
            alt={`${theme.name} NFT`}
            fill
            className="object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${theme.color} opacity-20`}></div>
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tier.color}`}>
              {tier.emoji} {tier.name}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {theme.emoji} {theme.name}
            </h3>
            <span className="text-sm text-gray-500">
              #{nft.tokenId}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            获得时间: {formatDate(nft.timestamp)}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-600 font-medium">
              🎁 感谢您的环保贡献
            </span>
            <button className="text-blue-600 text-sm hover:text-blue-800">
              查看详情 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const NFTModal = ({ nft, onClose }: { nft: NFTMetadata; onClose: () => void }) => {
    const theme = CLIMATE_THEMES[nft.climateTheme as keyof typeof CLIMATE_THEMES]
    const tier = TIER_CONFIG[nft.donationTier as keyof typeof TIER_CONFIG]

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="relative h-64">
            <Image
              src={nft.imageUrl}
              alt={`${theme.name} NFT`}
              fill
              className="object-cover rounded-t-lg"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme.color} opacity-30 rounded-t-lg`}></div>
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {theme.emoji} {theme.name} NFT
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tier.color}`}>
                {tier.emoji} {tier.name}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">NFT 信息</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Token ID: #{nft.tokenId}</p>
                  <p>获得时间: {formatDate(nft.timestamp)}</p>
                  <p>主题: {theme.name}</p>
                  <p>等级: {tier.name}</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  🌍 环保贡献证明
                </h3>
                <p className="text-sm text-green-700">
                  感谢您对气候保护的支持！这个NFT证明了您的匿名捐款，
                  是您为地球环境做出贡献的永久记录。
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  分享 NFT
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Please Connect Your Wallet
            </h1>
            <p className="text-gray-600">
              Connect your wallet to view your Climate Protection NFT collection
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎨 My Climate Protection NFTs
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each NFT represents your contribution to the Earth's environment, thank you for your anonymous donation support
            </p>
          </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">加载您的NFT收藏...</span>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              还没有NFT收藏
            </h2>
            <p className="text-gray-600 mb-8">
              参与气候保护项目捐款，获得您的第一个环保NFT！
            </p>
            <a 
              href="/"
              className="btn-primary inline-block"
            >
              🌍 去捐款支持项目
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                共有 <span className="font-semibold text-green-600">{nfts.length}</span> 个NFT
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} />
              ))}
            </div>
          </>
        )}

        {selectedNft && (
          <NFTModal 
            nft={selectedNft} 
            onClose={() => setSelectedNft(null)} 
          />
        )}
        </div>
      </div>
    </div>
  )
}