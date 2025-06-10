'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  
  const getCurrentPage = (): 'journal' | 'database' | 'ai-search' | 'soul-map' => {
    if (pathname.startsWith('/database')) return 'database'
    if (pathname.startsWith('/search')) return 'ai-search'
    if (pathname.startsWith('/soul-map')) return 'soul-map'
    return 'journal'
  }

  const handlePageChange = (page: 'journal' | 'database' | 'ai-search' | 'soul-map') => {
    const routes = {
      'journal': '/journal',
      'database': '/database',
      'ai-search': '/search',
      'soul-map': '/soul-map'
    }
    router.push(routes[page])
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={getCurrentPage()} onPageChange={handlePageChange} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}