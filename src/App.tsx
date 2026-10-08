import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { dataSync } from '@/services/dataSync'
import { GlobalInitialLoader } from '@/components/shared/GlobalInitialLoader'

export default function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true)

  useEffect(() => {
    // Initialize cross-tab realtime sync
    dataSync.initRealtime()
    return () => {
      dataSync.destroyRealtime()
    }
  }, [])

  const handleLoaderComplete = () => {
    setShowInitialLoader(false)
  }

  return (
    <BrowserRouter>
      {showInitialLoader && (
        <GlobalInitialLoader onComplete={handleLoaderComplete} />
      )}
      <AppRoutes />
    </BrowserRouter>
  )
}
