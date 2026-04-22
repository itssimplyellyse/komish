'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Kōmish — Art Commission Marketplace</title>
        <meta name="description" content="Post a brief, get proposals from artists, or pitch directly. Real art, real artists." />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
