import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TenantAuthProvider } from "@/hooks/use-tenant-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FarmTrack Pro - Smart Farm Management",
  description: "Professional farm inventory and management system",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TenantAuthProvider>{children}</TenantAuthProvider>
      </body>
    </html>
  )
}
