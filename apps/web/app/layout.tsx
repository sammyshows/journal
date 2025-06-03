import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reflective Journal',
  description: 'A thoughtful journaling companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}