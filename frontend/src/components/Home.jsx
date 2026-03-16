function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/50 via-neutral-100 to-primary/50">
      {/* Combined Landing Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text mb-8 text-center">
          VIRS Writing Challenge
        </h1>

        {/* TODO: Add a caption/tagline here in the future */}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto my-12">
          {/* Card 1 - Track Progress */}
          <div className="bg-background rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text mb-3">
              Track Your Progress
            </h3>
            <p className="text-muted">
              Monitor your writing sessions and see your improvement over time.
            </p>
          </div>

          {/* Card 2 - Build Habits */}
          <div className="bg-background rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text mb-3">
              Build Daily Habits
            </h3>
            <p className="text-muted">
              Develop a consistent writing routine with challenges and timed
              sessions.
            </p>
          </div>

          {/* Card 3 - Achieve Goals */}
          <div className="bg-background rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text mb-3">
              Achieve Your Goals
            </h3>
            <p className="text-muted">
              Set personal writing goals and celebrate your achievements as you
              reach new milestones.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {/* TODO: Change to Login button once authentication is implemented */}
          <button className="px-8 py-3 bg-primary text-background font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="px-8 py-3 bg-secondary text-text font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity">
            Learn More
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
