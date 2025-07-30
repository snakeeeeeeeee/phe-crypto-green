'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import ProjectCard from './ProjectCard'
import DonationFormPHEReal from '../donation/DonationFormPHEReal'
import SuccessToast from '../ui/SuccessToast'
import { ClimateProtectionPHEABI, getContractAddressesPHE, ClimateProjectPHE, ClimateProjectPHEWithUserRelation, formatProjectDataPHE, calculateProgressPHE, getTimeRemainingPHE, canDonateToProject, canWithdrawFunds, getProjectStatus, getProjectStatusForCreator, ProjectProgress } from '../../lib/contracts-phe-v2'

type TabType = 'all' | 'my'

export default function ProjectListPHE() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [projects, setProjects] = useState<ClimateProjectPHE[]>([])
  const [myProjects, setMyProjects] = useState<ClimateProjectPHEWithUserRelation[]>([])
  const [projectsProgress, setProjectsProgress] = useState<Map<bigint, ProjectProgress>>(new Map())
  const [selectedProject, setSelectedProject] = useState<ClimateProjectPHE | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMyProjectsLoading, setIsMyProjectsLoading] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [withdrawingProjectId, setWithdrawingProjectId] = useState<bigint | null>(null)

  const { address } = useAccount()
  const { climateProtectionPHE } = getContractAddressesPHE()

  // 添加钱包连接状态调试
  console.log('Debug: Wallet address:', address)
  console.log('Debug: Is wallet connected:', !!address)

  // Get all projects using new contract function
  const { data: allProjectIds, refetch: refetchAllProjects } = useReadContract({
    address: climateProtectionPHE as `0x${string}`,
    abi: ClimateProtectionPHEABI,
    functionName: 'getAllProjects',
  })

  // Get active projects using new contract function
  const { data: activeProjectIds, refetch: refetchActiveProjects } = useReadContract({
    address: climateProtectionPHE as `0x${string}`,
    abi: ClimateProtectionPHEABI,
    functionName: 'getActiveProjects',
  })

  // Get user created projects
  const { data: userCreatedProjectIds, refetch: refetchUserCreatedProjects } = useReadContract({
    address: climateProtectionPHE as `0x${string}`,
    abi: ClimateProtectionPHEABI,
    functionName: 'getUserCreatedProjects',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Get user donated projects
  const { data: userDonatedProjectIds, refetch: refetchUserDonatedProjects } = useReadContract({
    address: climateProtectionPHE as `0x${string}`,
    abi: ClimateProtectionPHEABI,
    functionName: 'getUserDonatedProjects',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      console.log('Debug: allProjectIds =', allProjectIds, 'activeProjectIds =', activeProjectIds)
      
      // Use active projects if available, otherwise use all projects
      const projectIds = activeProjectIds || allProjectIds;
      
      if (!projectIds || (projectIds as bigint[]).length === 0) {
        console.log('Debug: No projects to fetch')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const projectPromises = []
        
        const ids = projectIds as bigint[];
        console.log(`Debug: Attempting to fetch ${ids.length} projects`, ids)
        
        // Fetch project data using the project IDs from contract
        for (const projectId of ids) {
          projectPromises.push(
            fetch(`/api/project/${Number(projectId)}?contract=${climateProtectionPHE}`)
              .then(res => res.json())
              .then(data => {
                console.log(`Debug: Project ${projectId} data:`, data)
                return data
              })
              .catch(err => {
                console.log(`Debug: Project ${projectId} error:`, err)
                return null
              })
          )
        }

        const projectsData = await Promise.all(projectPromises)
        console.log('Debug: All projects data:', projectsData)
        
        const formattedProjects = projectsData
          .filter(project => project && !project.error)
          .map((project) => {
            const formatted = formatProjectDataPHE(project);
            console.log('Debug: Formatted project:', formatted);
            console.log('Debug: isActive:', formatted.isActive);
            console.log('Debug: canDonate:', canDonateToProject(formatted));
            return formatted;
          })
          .filter(project => {
            // For "all projects" tab, show active projects and recently completed projects
            // This provides better user experience as users can see projects they might have participated in
            const isActive = project.isActive;
            const isRecentlyCompleted = project.isCompleted && !project.isActive;
            console.log('Debug: Project', project.id, 'isActive:', isActive, 'isCompleted:', project.isCompleted);
            return isActive || isRecentlyCompleted;
          })

        console.log('Debug: Formatted active projects:', formattedProjects)
        setProjects(formattedProjects)
        
        // Fetch project progress for each project
        await fetchProjectsProgress(formattedProjects)
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchProjectsProgress = async (projectsList: ClimateProjectPHE[]) => {
      const progressMap = new Map<bigint, ProjectProgress>()
      
      try {
        // Fetch progress for each project
        const progressPromises = projectsList.map(async (project) => {
          try {
            const response = await fetch(`/api/project-progress/${Number(project.id)}?contract=${climateProtectionPHE}`)
            if (response.ok) {
              const progressData = await response.json()
              const progress: ProjectProgress = {
                currentAmount: BigInt(progressData.currentAmount || 0),
                targetAmount: BigInt(progressData.targetAmount || 0),
                donorCount: BigInt(progressData.donorCount || 0)
              }
              progressMap.set(project.id, progress)
              console.log(`Debug: Project ${project.id} progress:`, progress)
            }
          } catch (error) {
            console.error(`Failed to fetch progress for project ${project.id}:`, error)
          }
        })
        
        await Promise.all(progressPromises)
        setProjectsProgress(progressMap)
      } catch (error) {
        console.error('Failed to fetch projects progress:', error)
      }
    }

    fetchProjects()
  }, [allProjectIds, activeProjectIds, climateProtectionPHE])

  // Fetch user's projects (created and donated to)
  useEffect(() => {
    const fetchProjectsProgress = async (projectsList: ClimateProjectPHE[]) => {
      const progressMap = new Map<bigint, ProjectProgress>()
      
      try {
        // Fetch progress for each project
        const progressPromises = projectsList.map(async (project) => {
          try {
            const response = await fetch(`/api/project-progress/${Number(project.id)}?contract=${climateProtectionPHE}`)
            if (response.ok) {
              const progressData = await response.json()
              const progress: ProjectProgress = {
                currentAmount: BigInt(progressData.currentAmount || 0),
                targetAmount: BigInt(progressData.targetAmount || 0),
                donorCount: BigInt(progressData.donorCount || 0)
              }
              progressMap.set(project.id, progress)
              console.log(`Debug: Project ${project.id} progress:`, progress)
            }
          } catch (error) {
            console.error(`Failed to fetch progress for project ${project.id}:`, error)
          }
        })
        
        await Promise.all(progressPromises)
        setProjectsProgress(prev => new Map([...prev, ...progressMap]))
      } catch (error) {
        console.error('Failed to fetch projects progress:', error)
      }
    }

    const fetchMyProjects = async () => {
      if (!address || (!userCreatedProjectIds && !userDonatedProjectIds)) {
        setMyProjects([])
        return
      }

      try {
        setIsMyProjectsLoading(true)
        
        // Combine created and donated project IDs, remove duplicates
        const createdIds = (userCreatedProjectIds as bigint[]) || []
        const donatedIds = (userDonatedProjectIds as bigint[]) || []
        const allUserProjectIds = [...new Set([...createdIds, ...donatedIds])]
        
        console.log('Debug: User created projects:', createdIds)
        console.log('Debug: User donated projects:', donatedIds)
        console.log('Debug: All user projects:', allUserProjectIds)

        if (allUserProjectIds.length === 0) {
          setMyProjects([])
          return
        }

        const projectPromises = allUserProjectIds.map(async (projectId) => {
          try {
            const response = await fetch(`/api/project/${Number(projectId)}?contract=${climateProtectionPHE}`)
            const data = await response.json()
            console.log(`Debug: User project ${projectId} data:`, data)
            
            if (data && !data.error) {
              const formatted = formatProjectDataPHE(data)
              // Add metadata about user's relationship to this project
              return {
                ...formatted,
                userRelation: {
                  isCreator: createdIds.includes(projectId),
                  isDonor: donatedIds.includes(projectId)
                }
              }
            }
            return null
          } catch (error) {
            console.error(`Failed to fetch user project ${projectId}:`, error)
            return null
          }
        })

        const myProjectsData = await Promise.all(projectPromises)
        const validMyProjects = myProjectsData.filter(project => project !== null)
        
        console.log('Debug: User\'s projects:', validMyProjects)
        setMyProjects(validMyProjects)
        
        // Fetch progress for user's projects
        await fetchProjectsProgress(validMyProjects)
      } catch (error) {
        console.error('Failed to fetch user projects:', error)
      } finally {
        setIsMyProjectsLoading(false)
      }
    }

    fetchMyProjects()
  }, [userCreatedProjectIds, userDonatedProjectIds, address, climateProtectionPHE])

  const handleDonate = (project: ClimateProjectPHE) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  const handleDonationSuccess = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
    
    // 显示成功提示
    setShowSuccessToast(true)
    
    // 刷新数据 - 延迟一点时间确保区块链数据同步
    setTimeout(() => {
      refetchAllProjects()
      refetchActiveProjects()
      refetchUserCreatedProjects()
      refetchUserDonatedProjects()
    }, 2000)
  }

  // Withdrawal functionality
  const { 
    writeContract: withdrawFunds, 
    data: withdrawHash,
    isPending: isWithdrawing,
    error: withdrawError
  } = useWriteContract()

  // Wait for withdrawal transaction confirmation
  const { 
    isLoading: isWithdrawConfirming, 
    isSuccess: isWithdrawConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash: withdrawHash 
  })

  const handleWithdraw = async (project: ClimateProjectPHE) => {
    if (!address) return
    
    try {
      setWithdrawingProjectId(project.id)
      await withdrawFunds({
        address: climateProtectionPHE as `0x${string}`,
        abi: ClimateProtectionPHEABI,
        functionName: 'withdrawProjectFunds',
        args: [project.id]
      })
    } catch (error) {
      console.error('Withdrawal error:', error)
      setWithdrawingProjectId(null)
    }
  }

  // Handle successful withdrawal
  useEffect(() => {
    if (isWithdrawConfirmed) {
      // Clear withdrawing state
      setWithdrawingProjectId(null)
      
      // Refresh the project data after successful withdrawal
      refetchAllProjects()
      refetchActiveProjects()
      refetchUserCreatedProjects()
      refetchUserDonatedProjects()
    }
  }, [isWithdrawConfirmed, refetchAllProjects, refetchActiveProjects, refetchUserCreatedProjects, refetchUserDonatedProjects])

  // Handle withdrawal error
  useEffect(() => {
    if (withdrawError) {
      setWithdrawingProjectId(null)
    }
  }, [withdrawError])

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Privacy Projects
            </h2>
            <p className="text-lg text-gray-600">
              Using PHE technology to protect donation privacy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy Projects
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Using PHE technology to protect donation privacy
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-climate-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'bg-white text-climate-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!address}
              >
                My Projects
              </button>
            </div>
          </div>

          {/* Tab Content Info */}
          {activeTab === 'all' && (
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Active Projects: {activeProjectIds ? (activeProjectIds as bigint[]).length : 0}
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Total Projects: {allProjectIds ? (allProjectIds as bigint[]).length : 0}
              </div>
            </div>
          )}
          
          {activeTab === 'my' && address && (
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Created Projects: {userCreatedProjectIds ? (userCreatedProjectIds as bigint[]).length : 0}
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                Participated Projects: {userDonatedProjectIds ? (userDonatedProjectIds as bigint[]).length : 0}
              </div>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'all' ? (
          // All Projects Tab Content
          <>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  🌱 No active privacy projects
                </div>
                <p className="text-gray-400">
                  Please come back later to check for new environmental projects
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => {
                  const progress = projectsProgress.get(project.id)
                  const progressPercentage = progress ? 
                    calculateProgressPHE(progress.currentAmount, progress.targetAmount) : 0
                  
                  // Calculate time remaining
                  const now = BigInt(Math.floor(Date.now() / 1000))
                  const remaining = project.auctionEndTime - now
                  const expired = remaining <= 0n
                  
                  let days = 0, hours = 0, minutes = 0
                  if (!expired) {
                    const remainingSeconds = Number(remaining)
                    days = Math.floor(remainingSeconds / (24 * 60 * 60))
                    hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60))
                    minutes = Math.floor((remainingSeconds % (60 * 60)) / 60)
                  }
                  
                  const timeRemaining = { days, hours, minutes, expired }
                  
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDonate={handleDonate}
                      progress={progressPercentage}
                      timeRemaining={timeRemaining}
                      canDonate={!!address && canDonateToProject(project)}
                      showFHEBadge={true}
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // My Projects Tab Content
          <>
            {!address ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  🔐 Please connect your wallet
                </div>
                <p className="text-gray-400">
                  Connect wallet to view projects you created and participated in
                </p>
              </div>
            ) : isMyProjectsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : myProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  📂 You haven't participated in any projects yet
                </div>
                <p className="text-gray-400">
                  After creating new projects or donating to existing ones, they will appear here
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myProjects.map((project) => {
                  const progress = projectsProgress.get(project.id)
                  const progressPercentage = progress ? 
                    calculateProgressPHE(progress.currentAmount, progress.targetAmount) : 0
                  
                  // Calculate time remaining
                  const now = BigInt(Math.floor(Date.now() / 1000))
                  const remaining = project.auctionEndTime - now
                  const expired = remaining <= 0n
                  
                  let days = 0, hours = 0, minutes = 0
                  if (!expired) {
                    const remainingSeconds = Number(remaining)
                    days = Math.floor(remainingSeconds / (24 * 60 * 60))
                    hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60))
                    minutes = Math.floor((remainingSeconds % (60 * 60)) / 60)
                  }
                  
                  const timeRemaining = { days, hours, minutes, expired }
                  
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDonate={handleDonate}
                      onWithdraw={handleWithdraw}
                      progress={progressPercentage}
                      timeRemaining={timeRemaining}
                      canDonate={!!address && canDonateToProject(project)}
                      canWithdraw={!!address && project.userRelation?.isCreator && progress && canWithdrawFunds(project, progress.currentAmount)}
                      isCreator={project.userRelation?.isCreator || false}
                      isDonor={project.userRelation?.isDonor || false}
                      userAddress={address}
                      showFHEBadge={true}
                      isWithdrawing={withdrawingProjectId === project.id}
                      withdrawHash={withdrawingProjectId === project.id ? withdrawHash : undefined}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Donation Modal */}
        {isModalOpen && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  FHE Encrypted Donation
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <DonationFormPHEReal
                projectId={Number(selectedProject.id)}
                projectTitle={selectedProject.title}
                onClose={handleCloseModal}
                onSuccess={handleDonationSuccess}
              />
            </div>
          </div>
        )}

        {/* 成功提示 */}
        <SuccessToast
          show={showSuccessToast}
          title="Donation Successful!"
          message="Thank you for supporting environmental projects! Your donation has been securely encrypted."
          onClose={() => setShowSuccessToast(false)}
        />
      </div>
    </section>
  )
}