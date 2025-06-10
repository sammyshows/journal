'use client'

import { useSearchParams } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import DatabaseView from '../components/DatabaseView'

export default function DatabasePage() {
  const searchParams = useSearchParams()
  const table = searchParams.get('table') || 'journal_entries'

  return (
    <AppLayout>
      <DatabaseView />
    </AppLayout>
  )
}