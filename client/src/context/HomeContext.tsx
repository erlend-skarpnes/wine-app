import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { getHomes } from '../api/homes'
import { queryKeys } from '../api/queryKeys'
import type { HomeSummary } from '../api/types'

interface HomeState {
  homes: HomeSummary[]
  activeHome: HomeSummary | null
  setActiveHome: (home: HomeSummary) => void
  isLoading: boolean
}

const HomeContext = createContext<HomeState>(null!)

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  const [activeHomeId, setActiveHomeId] = useState<number | null>(() => {
    const stored = localStorage.getItem('activeHomeId')
    return stored ? parseInt(stored, 10) : null
  })

  const { data: homes = [], isLoading } = useQuery<HomeSummary[]>({
    queryKey: queryKeys.homes(),
    queryFn: getHomes,
    enabled: isAuthenticated,
  })

  const activeHome =
    (activeHomeId !== null && homes.find(h => h.id === activeHomeId)) ||
    homes[0] ||
    null

  // Keep localStorage in sync if we fell back to a different home
  useEffect(() => {
    if (activeHome && activeHome.id !== activeHomeId) {
      setActiveHomeId(activeHome.id)
      localStorage.setItem('activeHomeId', String(activeHome.id))
    }
  }, [activeHome, activeHomeId])

  function setActiveHome(home: HomeSummary) {
    setActiveHomeId(home.id)
    localStorage.setItem('activeHomeId', String(home.id))
  }

  return (
    <HomeContext.Provider value={{ homes, activeHome, setActiveHome, isLoading }}>
      {children}
    </HomeContext.Provider>
  )
}

export function useHome() {
  return useContext(HomeContext)
}
