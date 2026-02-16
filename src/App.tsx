import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUIStore } from '@/stores/uiStore'

export default function App() {
  const darkMode = useUIStore((s) => s.darkMode)

  // Sync dark class on mount and when darkMode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return <AppLayout />
}
