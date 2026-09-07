import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Roboto_Mono } from 'next/font/google'

import './globals.css'

// The mono/serif pairing is the system — see DESIGN.md. DM Serif carries the
// warmth, Roboto Mono does all functional work including body copy. Do not add
// a sans-serif to this file.
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'nurture · tasks',
  description: 'A quiet place for your own work.',
}

export const viewport: Viewport = {
  themeColor: '#e3492b',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
