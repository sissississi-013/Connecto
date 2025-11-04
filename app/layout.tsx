import './globals.css'
import type { Metadata } from 'next'
import { SessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'CONNECTO - AI-Powered Networking Agent',
  description: 'Automate your professional networking with AI-powered connection management',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
