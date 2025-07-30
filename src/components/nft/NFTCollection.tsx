'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { VirtualNFT, getVirtualNFTs, getNFTStats, generateNFTCardData, formatTokenAmount, getTierColor } from '../../lib/virtual-nft'

interface VirtualNFTCardProps {
  nft: VirtualNFT
  onClick?: () => void
}

function VirtualNFTCard({ nft, onClick }: VirtualNFTCardProps) {
  const cardData = generateNFTCardData(nft)
  const tierColor = getTierColor(nft.tier)

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
    >
      {/* NFT Image/Visual */}
      <div className={`h-48 bg-gradient-to-br ${tierColor} flex items-center justify-center relative`}>
        <div className="text-center text-white">
          <div className="text-6xl mb-2">{nft.tierEmoji}</div>
          <div className="text-sm font-medium opacity-90">#{nft.id.slice(-8)}</div>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          {cardData.rarity}
        </div>
      </div>

      {/* NFT Details */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 text-lg">{cardData.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cardData.description}</p>
        
        {/* Attributes */}
        <div className="space-y-2">
          {cardData.attributes.slice(0, 3).map((attr, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-gray-500">{attr.trait}:</span>
              <span className="text-gray-900 font-medium">{attr.value}</span>
            </div>
          ))}
        </div>

        {/* Donation Amount (if not encrypted) */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Contribution:</span>
            <span className="text-green-600 font-bold text-sm">
              {formatTokenAmount(nft.donationAmount)} cUSDC
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NFTCollectionProps {
  title?: string
  showStats?: boolean
}

export default function NFTCollection({ title = "My Climate NFTs", showStats = true }: NFTCollectionProps) {
  const { address } = useAccount()
  const [userNFTs, setUserNFTs] = useState<VirtualNFT[]>([])
  const [selectedNFT, setSelectedNFT] = useState<VirtualNFT | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (address) {
      setIsLoading(true)
      // Load user's virtual NFTs
      const nfts = getVirtualNFTs(address)
      setUserNFTs(nfts)
      setIsLoading(false)
    } else {
      setUserNFTs([])
      setIsLoading(false)
    }
  }, [address])

  const stats = address ? getNFTStats(address) : null

  if (!address) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          🔗 Connect your wallet to view your Climate NFT collection
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading your NFT collection...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">
          Your climate protection contribution certificates
        </p>
      </div>

      {/* Stats */}
      {showStats && stats && stats.total > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Stats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total NFTs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.projectsSupported}</div>
              <div className="text-sm text-gray-600">Projects Supported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTokenAmount(stats.totalDonated)}
              </div>
              <div className="text-sm text-gray-600">Total Donated (cUSDC)</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center space-x-1 text-lg mb-1">
                {stats.platinum > 0 && <span>💎×{stats.platinum}</span>}
                {stats.gold > 0 && <span>🥇×{stats.gold}</span>}
                {stats.silver > 0 && <span>🥈×{stats.silver}</span>}
                {stats.bronze > 0 && <span>🥉×{stats.bronze}</span>}
              </div>
              <div className="text-sm text-gray-600">Tier Distribution</div>
            </div>
          </div>
        </div>
      )}

      {/* NFT Grid */}
      {userNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            🎨 No Climate NFTs yet
          </div>
          <p className="text-gray-400 mb-6">
            Make your first donation to earn a commemorative NFT!
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userNFTs.map((nft) => (
            <VirtualNFTCard
              key={nft.id}
              nft={nft}
              onClick={() => setSelectedNFT(nft)}
            />
          ))}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                NFT Details
              </h3>
              <button
                onClick={() => setSelectedNFT(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Large NFT Display */}
            <div className={`h-64 bg-gradient-to-br ${getTierColor(selectedNFT.tier)} rounded-lg flex items-center justify-center mb-4`}>
              <div className="text-center text-white">
                <div className="text-8xl mb-2">{selectedNFT.tierEmoji}</div>
                <div className="text-lg font-medium">#{selectedNFT.id.slice(-8)}</div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedNFT.tierEmoji} {selectedNFT.tierName}
                </h4>
                <p className="text-gray-600 text-sm">
                  Thank you for supporting "{selectedNFT.projectTitle}". Your contribution makes a difference!
                </p>
              </div>

              {/* All Attributes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Attributes</h5>
                {generateNFTCardData(selectedNFT).attributes.map((attr, index) => (
                  <div key={index} className="flex justify-between py-1">
                    <span className="text-gray-600">{attr.trait}:</span>
                    <span className="text-gray-900 font-medium">{attr.value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-t border-gray-200 mt-2 pt-2">
                  <span className="text-gray-600">Contribution:</span>
                  <span className="text-green-600 font-bold">
                    {formatTokenAmount(selectedNFT.donationAmount)} cUSDC
                  </span>
                </div>
              </div>

              {selectedNFT.message && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Personal Message</h5>
                  <p className="text-gray-700 text-sm italic">"{selectedNFT.message}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}