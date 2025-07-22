import { useEffect, useState, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DotPhraseManager } from './components/DotPhraseManager'
import { GlobalListener } from './components/GlobalListener'
import { AuthProvider } from './components/AuthProvider'
import { SuggestionHandler } from './components/SuggestionHandler'
import { SmartOptionsManager } from './components/SmartOptionsManager'
import { WidgetManager } from './components/WidgetManager'
import { SpecialFunctionsManager } from './components/SpecialFunctionsManager'
import { SystemTrayManager } from './components/SystemTrayManager'
import { startupOptimizer, withPerformanceTracking } from './lib/startupOptimizer'

import { cacheManager } from './lib/intelligentCache'
import './lib/registerWidgets' // Initialize widgets
import { useMediaQuery } from 'usehooks-ts';

// Optimized query client with performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 minutes
      gcTime: 600000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Loading fallback component for lazy-loaded components
const LoadingFallback = ({ componentName }: { componentName: string }) => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading {componentName}...</span>
  </div>
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize performance monitoring
        
        
        // Add non-critical initializers
        startupOptimizer.addInitializer('cache-optimization', () => {
          console.log('Cache optimization initialized')
        }, 2)
        
        startupOptimizer.addInitializer('performance-monitoring', () => {
          
        }, 3)
        
        // Wait for critical resources
        await startupOptimizer.waitForCriticalResources()
        
        // Mark components as ready
        startupOptimizer.markComponentReady('components')
        
        setIsInitialized(true)
        
        // Log startup metrics
        const metrics = startupOptimizer.getMetrics()
        console.log('App initialization metrics:', metrics)
        
      } catch (error) {
        console.error('App initialization failed:', error)
        setIsInitialized(true) // Continue even if optimization fails
      }
    }

    initializeApp()

    // Cleanup on unmount
    return () => {
      
      cacheManager.destroyAll()
    }
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Starting AriNote Companion</h2>
          <p className="text-gray-600">Optimizing for performance...</p>
        </div>
      </div>
    )
  }

  // Check if we're in suggestion window mode
  const urlParams = new URLSearchParams(window.location.search)
  const isInSuggestionWindow = urlParams.get('window') === 'suggestion'
  
  console.log('🔍 [APP] URL params check:', {
    href: window.location.href,
    search: window.location.search,
    windowParam: urlParams.get('window'),
    isInSuggestionWindow
  })

  if (isInSuggestionWindow) {
    console.log('🪟 [APP] Rendering in suggestion window mode')
    // In suggestion window mode, only render the SuggestionHandler with transparent background
    return (
      <div style={{ background: 'transparent', width: '100vw', height: '100vh' }}>
        <QueryClientProvider client={queryClient}>
          <SuggestionHandler />
        </QueryClientProvider>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onAuthChange={setIsAuthenticated}>
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${isDarkMode ? 'dark' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AriNote Companion
              </h1>
              <p className="text-gray-600">
                System-wide dot phrase expansion with sleek suggestions
              </p>
            </header>

            {isAuthenticated ? (
              <Suspense fallback={<LoadingFallback componentName="Application" />}>
                <DotPhraseManager />
                <GlobalListener />
                <SmartOptionsManager />
                <WidgetManager />
                <SpecialFunctionsManager />
                <SystemTrayManager />
              </Suspense>
            ) : (
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Please sign in to access your dot phrases
                </p>
              </div>
            )}
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Wrap App with performance tracking
export default withPerformanceTracking(App, 'MainApp')