import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// RainbowKit configuration with default connectors
export const config = getDefaultConfig({
  appName: 'CryptoGreen Platform',
  projectId: 'local-only', // Local identifier, not used for WalletConnect  
  chains: [sepolia],
  ssr: true,
});

export const CONTRACT_ADDRESSES = {
  ClimateProtection: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
  ClimateNFT: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
} as const;