import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { ClimateProtectionPHEABI, getContractAddressesPHE } from '../../../lib/contracts-phe-v2'

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

export async function GET(request: NextRequest) {
  try {
    const { climateProtectionPHE } = getContractAddressesPHE()
    
    if (!climateProtectionPHE) {
      return NextResponse.json({ error: 'Contract address not configured' }, { status: 500 })
    }

    // Read platform statistics from the contract
    const statsData = await publicClient.readContract({
      address: climateProtectionPHE as `0x${string}`,
      abi: ClimateProtectionPHEABI,
      functionName: 'getPlatformStats'
    })

    if (!statsData) {
      return NextResponse.json({ error: 'Failed to fetch platform stats' }, { status: 404 })
    }

    // Format the statistics data according to getPlatformStats ABI output
    // getPlatformStats returns: [totalProjects, activeProjects, completedProjects, totalDonationsAmount, totalDonors]
    const statsArray = statsData as any[];
    const formattedStats = {
      totalProjects: statsArray[0].toString(),
      activeProjects: statsArray[1].toString(), 
      completedProjects: statsArray[2].toString(),
      totalDonationsAmount: statsArray[3].toString(),
      totalDonors: statsArray[4].toString()
    }

    return NextResponse.json(formattedStats)
  } catch (error) {
    console.error('Platform Stats API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch platform statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}