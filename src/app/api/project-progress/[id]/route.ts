import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { ClimateProtectionPHEABI } from '../../../../lib/contracts-phe-v2'

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('contract')
    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (!contractAddress || !projectId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Read project progress from the contract using getProjectProgress
    const progressData = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ClimateProtectionPHEABI,
      functionName: 'getProjectProgress',
      args: [BigInt(projectId)]
    })

    if (!progressData) {
      return NextResponse.json({ error: 'Project progress not found' }, { status: 404 })
    }

    // Format the progress data according to getProjectProgress ABI output
    // getProjectProgress returns: [currentAmount, targetAmount, donorCount]
    const progressArray = progressData as any[];
    const formattedProgress = {
      currentAmount: progressArray[0].toString(), // convert BigInt to string
      targetAmount: progressArray[1].toString(),  // convert BigInt to string
      donorCount: progressArray[2].toString()     // convert BigInt to string
    }

    return NextResponse.json(formattedProgress)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch project progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}