'use client'

import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import JournalView from './components/JournalView'
import DatabaseView from './components/DatabaseView'
import AISearchView from './components/AISearchView'

type PageType = 'journal' | 'database' | 'ai-search'

export default function Home(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<PageType>('journal')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'journal':
        return <JournalView />
      case 'database':
        return <DatabaseView />
      case 'ai-search':
        return <AISearchView />
      default:
        return <JournalView />
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        {renderCurrentPage()}
      </main>
    </div>
  )
}