import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Groundlight Deployment',
  description: 'A configuration interface for your Groundlight deployment.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* <link rel="icon" href="/favicon.ico" sizes="any" /> */}
      <body className={inter.className}>{children}</body>
    </html>
  )
}
