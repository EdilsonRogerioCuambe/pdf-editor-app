import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, Moon, Shield, Sun } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

interface PDFHeaderProps {
  sidebarCollapsed: boolean
  onMobileMenuToggle: () => void
}

export function PDFHeader({ sidebarCollapsed, onMobileMenuToggle }: PDFHeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const t = useTranslations('header')

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 left-0",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('toggleMenu')}</span>
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="hidden h-4 w-4 text-primary sm:block" />
          <span className="hidden sm:inline">{t('free')} • {t('private')} • {t('noSignup')}</span>
          <span className="sm:hidden">{t('free')} & {t('private')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelector />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">{t('toggleDarkMode')}</span>
        </Button>
      </div>
    </header>
  )
}
