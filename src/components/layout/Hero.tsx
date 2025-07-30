export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            CryptoGreen
            <span className="text-climate-green-600"> Privacy Guardian</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Using PHE homomorphic encryption technology to protect donation privacy,
            join us in supporting environmental projects for a better planet.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#projects"
              className="btn-primary px-8 py-3 text-base font-semibold"
            >
              Start Donating
            </a>
            <a
              href="#learn-more"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Learn More <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-climate-green-100">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Privacy Protection</h3>
            <p className="mt-2 text-sm text-gray-600">
              Donation amounts fully encrypted to protect your privacy
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ocean-blue-100">
              <span className="text-2xl">🌟</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Mutual Support</h3>
            <p className="mt-2 text-sm text-gray-600">
              Connecting caring people to support environmental causes
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-climate-green-100">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Transparent Statistics</h3>
            <p className="mt-2 text-sm text-gray-600">
              Real-time display of project progress and participant numbers
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ocean-blue-100">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Sustainable Development</h3>
            <p className="mt-2 text-sm text-gray-600">
              Funding real environmental projects, creating sustainable value
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}