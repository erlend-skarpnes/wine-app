import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { getCellars } from '../api/cellars'
import type { CellarSummary } from '../api/types'

interface CellarState {
  cellars: CellarSummary[]
  activeCellar: CellarSummary | null
  setActiveCellar: (cellar: CellarSummary) => void
  isLoading: boolean
}

const CellarContext = createContext<CellarState>(null!)

export function CellarProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  const [activeCellarId, setActiveCellarId] = useState<number | null>(() => {
    const stored = localStorage.getItem('activeCellarId')
    return stored ? parseInt(stored, 10) : null
  })

  const { data: cellars = [], isLoading } = useQuery<CellarSummary[]>({
    queryKey: ['cellars'],
    queryFn: getCellars,
    enabled: isAuthenticated,
  })

  const activeCellar =
    (activeCellarId !== null && cellars.find(c => c.id === activeCellarId)) ||
    cellars[0] ||
    null

  // Keep localStorage in sync if we fell back to a different cellar
  useEffect(() => {
    if (activeCellar && activeCellar.id !== activeCellarId) {
      setActiveCellarId(activeCellar.id)
      localStorage.setItem('activeCellarId', String(activeCellar.id))
    }
  }, [activeCellar, activeCellarId])

  function setActiveCellar(cellar: CellarSummary) {
    setActiveCellarId(cellar.id)
    localStorage.setItem('activeCellarId', String(cellar.id))
  }

  return (
    <CellarContext.Provider value={{ cellars, activeCellar, setActiveCellar, isLoading }}>
      {children}
    </CellarContext.Provider>
  )
}

export function useCellar() {
  return useContext(CellarContext)
}
