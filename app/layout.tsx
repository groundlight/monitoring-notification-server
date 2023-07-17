import Image from 'next/image'
import './globals.css'
import { Inter } from 'next/font/google'
import { Nav } from '@/components/Nav'

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
      <body className={inter.className}>
        {/* <div className='grid grid-cols-2 grid-rows-2 h-full'> */}
        <div className='grid grid-cols-[300px_minmax(900px,_1fr)] grid-rows-[50px_minmax(200px,_1fr)] h-screen relative'>
          <div className='bg-white flex place-items-center col-span-2'>
            <div className="p-2"></div>
            <Image src="/favicon.ico" alt="groundlight logo" width={40} height={40} />
            <div className="p-2"></div>
            <span className='text-lg font-semibold' >
              Groundlight Detector Configurator
            </span>
          </div>
          <Nav />
          <div className='relative' >
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
