import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getPDFTools } from "@/lib/pdf-tools"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

interface PDFSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function PDFSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: PDFSidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string || 'pt-BR'
  const tCommon = useTranslations('common')
  const tSidebar = useTranslations('sidebar')
  const tTools = useTranslations('tools')

  // Get translated tools
  const tools = getPDFTools((key) => tTools(key))

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
            collapsed ? "lg:w-16" : "lg:w-64",
            mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
             // Base width for mobile is w-64 when open. On desktop it depends on collapsed.
             // We need to ensure w-64 is set for mobile when open, and ignore collapsed on mobile.
             !collapsed && "w-64"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href={`/${locale}`} className="flex items-center gap-3" onClick={onMobileClose}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <Image
                  src="/pdf_master.png"
                  alt="PDF Master Logo"
                  width={120}
                  height={40}
                  className="object-contain rounded-lg"
                />
              </div>
              {/* Show text only when sidebar is expanded */}
              {(!collapsed || mobileOpen) && (
                <span className="text-lg font-semibold tracking-tight whitespace-nowrap">
                  {tCommon('appName')}
                </span>
              )}
            </Link>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
            <div className="space-y-1 px-2">
              {tools.map((tool) => {
                const Icon = tool.icon
                const isActive = pathname === `/${locale}/${tool.id}`

                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${locale}/${tool.id}`}
                        onClick={onMobileClose}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {/* Show label only when sidebar is expanded */}
                        {(!collapsed || mobileOpen) && (
                          <span className="truncate">{tool.name}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && !mobileOpen && (
                      <TooltipContent side="right" className="font-medium hidden lg:block">
                        <p>{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-sidebar-border px-2 py-2">
            <Link
              href="/download"
              onClick={onMobileClose}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                pathname === "/download" && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Download className="h-5 w-5 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="truncate">{tCommon('downloadApp') || "Download App"}</span>
              )}
            </Link>
          </div>

          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden border-t border-sidebar-border p-2 lg:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-full justify-center text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>{tSidebar('collapse')}</span>
                </>
              )}
            </Button>
          </div>
        </aside>
      </TooltipProvider>
    </>
  )
}
