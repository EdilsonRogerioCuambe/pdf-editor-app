"use client"

import { PDFFooter } from "@/components/pdf-footer"
import { PDFHeader } from "@/components/pdf-header"
import { PDFSidebar } from "@/components/pdf-sidebar"
import { cn } from "@/lib/utils"
// import { ThemeProvider } from "@/components/theme-provider" // Assuming this might be needed or is generic
import { locales } from "@/i18n/request"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isLandingPage = pathname === "/" || locales.some((locale) => pathname === `/${locale}`)

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <PDFSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ml-0",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        {/* Header */}
        <PDFHeader
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Content */}
        <main className="flex-1 px-4 py-8 pt-24 lg:px-6">
          {children}
        </main>

        {/* Footer */}
        <PDFFooter />
      </div>
    </div>
  )
}
