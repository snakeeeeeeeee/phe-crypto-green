'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { PlatformStats } from '../../lib/contracts-phe-v2'

interface GlobalStats {
  totalProjects: string
  activeProjects: string
  completedProjects: string
  totalDonors: string
  totalDonationsEth: string
}

export default function StatsSection() {
  const [stats, setStats] = useState<GlobalStats>({
    totalProjects: "0",
    activeProjects: "0", 
    completedProjects: "0",
    totalDonors: "0",
    totalDonationsEth: "0"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/platform-stats')
        if (response.ok) {
          const data: PlatformStats = await response.json()
          setStats({
            totalProjects: data.totalProjects.toString(),
            activeProjects: data.activeProjects.toString(),
            completedProjects: data.completedProjects.toString(),
            totalDonors: data.totalDonors.toString(),
            totalDonationsEth: formatEther(BigInt(data.totalDonationsAmount))
          })
        } else {
          setError('Failed to fetch platform statistics')
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err)
        setError('Failed to fetch platform statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      suffix: '',
      icon: '📊',
      color: 'text-blue-600'
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      suffix: '',
      icon: '🌱',
      color: 'text-green-600'
    },
    {
      label: 'Completed',
      value: stats.completedProjects,
      suffix: '',
      icon: '✅',
      color: 'text-purple-600'
    },
    {
      label: 'Participants',
      value: stats.totalDonors,
      suffix: '',
      icon: '👥',
      color: 'text-ocean-blue-600'
    },
    {
      label: 'Total Donations',
      value: parseFloat(stats.totalDonationsEth).toFixed(4),
      suffix: ' ETH',
      icon: '💰',
      color: 'text-yellow-600',
      note: 'Privacy protected with PHE technology'
    }
  ]

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              CryptoGreen Platform Statistics
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Using PHE technology to protect donation privacy, showcasing platform impact in real-time
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-center">
                <div className="bg-gray-50 rounded-2xl p-8 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              CryptoGreen Platform Statistics
            </h2>
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            CryptoGreen Platform Statistics
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Using PHE technology to protect donation privacy, showcasing platform impact in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className={`text-3xl font-bold ${item.color} mb-2`}>
                  {typeof item.value === 'string' && !isNaN(Number(item.value)) ? 
                    Number(item.value).toLocaleString() : item.value}
                  <span className="text-lg">{item.suffix}</span>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {item.label}
                </div>
                {item.note && (
                  <div className="text-xs text-gray-500">
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Privacy Statement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center bg-blue-50 rounded-lg px-4 py-3">
            <span className="text-blue-500 mr-2">🔒</span>
            <p className="text-sm text-blue-800">
              <span className="font-medium">PHE Privacy Protection:</span>
              All donation amounts are protected using fully homomorphic encryption technology to ensure user privacy security.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}