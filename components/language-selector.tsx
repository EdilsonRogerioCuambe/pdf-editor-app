"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { locales } from "@/i18n/request"
import { formatLocale, getLocaleFlag } from "@/lib/i18n-helpers"
import { Globe } from "lucide-react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

export function LanguageSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (params.locale as string) || 'pt-BR'

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Replace the locale in the pathname
      const segments = pathname.split('/')
      segments[1] = newLocale
      const newPath = segments.join('/')

      router.push(newPath)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{getLocaleFlag(currentLocale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className="gap-2"
          >
            <span>{getLocaleFlag(locale)}</span>
            <span>{formatLocale(locale)}</span>
            {locale === currentLocale && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
