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

    // Read project data from the contract using projects mapping to get full data
    const projectData = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ClimateProtectionPHEABI,
      functionName: 'projects',
      args: [BigInt(projectId)]
    })

    if (!projectData || !(projectData as any[])[0]) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Format the project data according to projects mapping ABI output
    // projects returns: [id, title, description, beneficiary, targetAmount, auctionStartTime, auctionEndTime, isActive, isCompleted, fundsWithdrawn, totalDonationsEncrypted, donorCount, totalDonationsPublic]
    const projectArray = projectData as any[];
    const formattedProject = [
      projectArray[0].toString(),  // id (index 0) - convert BigInt to string
      projectArray[1],             // title (index 1)
      projectArray[2],             // description (index 2)
      projectArray[3],             // beneficiary (index 3)
      projectArray[4].toString(),  // targetAmount (index 4) - convert BigInt to string
      projectArray[5].toString(),  // auctionStartTime (index 5) - convert BigInt to string
      projectArray[6].toString(),  // auctionEndTime (index 6) - convert BigInt to string
      projectArray[7],             // isActive (index 7)
      projectArray[8],             // isCompleted (index 8)
      projectArray[9],             // fundsWithdrawn (index 9)
      projectArray[10].toString(), // totalDonationsEncrypted (index 10) - now uint256, convert to string
      projectArray[11].toString(), // donorCount (index 11) - convert BigInt to string
      projectArray[12].toString()  // totalDonationsPublic (index 12) - convert BigInt to string
    ]

    return NextResponse.json(formattedProject)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch project data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}