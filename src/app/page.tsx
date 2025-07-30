import Header from '../components/layout/Header'
import Hero from '../components/layout/Hero'
import ProjectListPHE from '../components/projects/ProjectListPHE'
import StatsSection from '../components/stats/StatsSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-climate-green-50 to-ocean-blue-50">
      <Header />
      <Hero />
      <StatsSection />
      <ProjectListPHE />
    </main>
  )
}