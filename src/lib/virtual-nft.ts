// Virtual NFT rewards system for donations
import { ClimateProjectPHE } from './contracts-phe'

export interface VirtualNFT {
  id: string
  projectId: number
  projectTitle: string
  donorAddress: string
  donationAmount: number // In token units
  timestamp: number
  tier: 1 | 2 | 3 | 4 // Bronze, Silver, Gold, Platinum
  tierName: string
  tierEmoji: string
  message?: string
  imageUrl: string
}

// NFT tier thresholds (in USDC with 6 decimals)
export const NFT_TIERS = {
  BRONZE: { threshold: 10 * 10**6, name: 'Bronze Contributor', emoji: '🥉' },
  SILVER: { threshold: 50 * 10**6, name: 'Silver Supporter', emoji: '🥈' },
  GOLD: { threshold: 100 * 10**6, name: 'Gold Protector', emoji: '🥇' },
  PLATINUM: { threshold: 500 * 10**6, name: 'Platinum Guardian', emoji: '💎' }
}

// Calculate donation tier
export const calculateDonationTier = (amount: number): {
  tier: 1 | 2 | 3 | 4
  tierName: string
  tierEmoji: string
} => {
  if (amount >= NFT_TIERS.PLATINUM.threshold) {
    return { tier: 4, tierName: NFT_TIERS.PLATINUM.name, tierEmoji: NFT_TIERS.PLATINUM.emoji }
  }
  if (amount >= NFT_TIERS.GOLD.threshold) {
    return { tier: 3, tierName: NFT_TIERS.GOLD.name, tierEmoji: NFT_TIERS.GOLD.emoji }
  }
  if (amount >= NFT_TIERS.SILVER.threshold) {
    return { tier: 2, tierName: NFT_TIERS.SILVER.name, tierEmoji: NFT_TIERS.SILVER.emoji }
  }
  return { tier: 1, tierName: NFT_TIERS.BRONZE.name, tierEmoji: NFT_TIERS.BRONZE.emoji }
}

// Generate virtual NFT after donation
export const generateVirtualNFT = (
  projectId: number,
  projectTitle: string,
  donorAddress: string,
  donationAmount: number,
  message?: string
): VirtualNFT => {
  const { tier, tierName, tierEmoji } = calculateDonationTier(donationAmount)
  
  return {
    id: `${projectId}-${donorAddress}-${Date.now()}`,
    projectId,
    projectTitle,
    donorAddress,
    donationAmount,
    timestamp: Date.now(),
    tier,
    tierName,
    tierEmoji,
    message,
    imageUrl: `https://climate-nft-images.vercel.app/tier-${tier}.png` // Placeholder
  }
}

// Local storage key for user's virtual NFTs
export const VIRTUAL_NFTS_KEY = 'climate-protection-virtual-nfts'

// Save virtual NFT to local storage
export const saveVirtualNFT = (nft: VirtualNFT) => {
  try {
    const existingNFTs = getVirtualNFTs()
    const updatedNFTs = [...existingNFTs, nft]
    localStorage.setItem(VIRTUAL_NFTS_KEY, JSON.stringify(updatedNFTs))
    return true
  } catch (error) {
    console.error('Failed to save virtual NFT:', error)
    return false
  }
}

// Get user's virtual NFTs from local storage
export const getVirtualNFTs = (address?: string): VirtualNFT[] => {
  try {
    const nfts = JSON.parse(localStorage.getItem(VIRTUAL_NFTS_KEY) || '[]') as VirtualNFT[]
    if (address) {
      return nfts.filter(nft => nft.donorAddress.toLowerCase() === address.toLowerCase())
    }
    return nfts
  } catch (error) {
    console.error('Failed to get virtual NFTs:', error)
    return []
  }
}

// Get NFT collection stats
export const getNFTStats = (address: string) => {
  const userNFTs = getVirtualNFTs(address)
  const stats = {
    total: userNFTs.length,
    bronze: userNFTs.filter(nft => nft.tier === 1).length,
    silver: userNFTs.filter(nft => nft.tier === 2).length,
    gold: userNFTs.filter(nft => nft.tier === 3).length,
    platinum: userNFTs.filter(nft => nft.tier === 4).length,
    totalDonated: userNFTs.reduce((sum, nft) => sum + nft.donationAmount, 0),
    projectsSupported: new Set(userNFTs.map(nft => nft.projectId)).size
  }
  return stats
}

// Generate NFT card data for display
export const generateNFTCardData = (nft: VirtualNFT) => ({
  title: `${nft.tierEmoji} Climate ${nft.tierName}`,
  description: `Thank you for supporting "${nft.projectTitle}". Your contribution makes a difference for our planet!`,
  attributes: [
    { trait: 'Tier', value: nft.tierName },
    { trait: 'Project', value: nft.projectTitle },
    { trait: 'Donation Date', value: new Date(nft.timestamp).toLocaleDateString() },
    { trait: 'Project ID', value: `#${nft.projectId}` },
    ...(nft.tier === 4 ? [{ trait: 'Special', value: 'Legendary Contributor' }] : [])
  ],
  rarity: nft.tier === 4 ? 'Legendary' : nft.tier === 3 ? 'Rare' : nft.tier === 2 ? 'Uncommon' : 'Common'
})

// Export utilities for formatting
export const formatTokenAmount = (amount: number): string => {
  return (amount / 10**6).toFixed(2) // Convert from 6-decimal token to display format
}

export const getTierColor = (tier: 1 | 2 | 3 | 4): string => {
  switch (tier) {
    case 4: return 'from-purple-500 to-pink-500' // Platinum
    case 3: return 'from-yellow-400 to-orange-500' // Gold
    case 2: return 'from-gray-400 to-gray-600' // Silver
    case 1: return 'from-orange-600 to-red-600' // Bronze
    default: return 'from-gray-300 to-gray-500'
  }
}