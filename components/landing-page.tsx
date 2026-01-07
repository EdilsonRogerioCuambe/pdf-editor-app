"use client"

import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { getPDFTools } from "@/lib/pdf-tools"
import { ArrowRight, Check, Download, FileText, Github, Globe, Mail, Menu, Phone, Shield, X, Zap } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const params = useParams()
  const locale = params.locale as string || 'pt-BR'

  const t = useTranslations('landing')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tFooter = useTranslations('footer')
  const tTools = useTranslations('tools')

  // Get translated tools
  const tools = getPDFTools((key) => tTools(key))

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50">
                <Image
                  src="/pdf_master.png"
                  alt="PDF Icon"
                  width={24}
                  height={24}
                  className="h-full w-full object-cover rounded-lg"
                />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">{tCommon('appName')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden gap-6 md:flex">
            <Link href="#tools" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              {tNav('tools')}
            </Link>
            <Link href="#features" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              {tNav('features')}
            </Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <LanguageSelector />
            <Link href={`/${locale}/merge`}>
              <Button className="bg-primary text-white hover:bg-primary/90">
                {tNav('startNow')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="absolute left-0 top-16 h-[calc(100vh-4rem)] w-full bg-zinc-950 p-6 md:hidden animate-in slide-in-from-top-4">
             <nav className="flex flex-col gap-6">
                <Link
                  href="#tools"
                  className="text-lg font-medium text-zinc-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav('tools')}
                </Link>
                <Link
                  href="#features"
                  className="text-lg font-medium text-zinc-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav('features')}
                </Link>
                <hr className="border-white/10" />
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                </div>
                <Link
                  href={`/${locale}/merge`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-primary text-white hover:bg-primary/90">
                    {tNav('startNow')}
                  </Button>
                </Link>
             </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Background Gradients */}
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-full -translate-x-1/2 rounded-full bg-primary/10 opacity-30 blur-[120px]" />

        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 flex max-w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {t('newToolsAvailable')}
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            {t('heroTitle')} <br/>
            <span className="bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">{t('heroTitleHighlight')}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            {t('heroDescription')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/merge`}>
              <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-primary/90 shadow-lg shadow-primary/25">
                {tNav('startFree')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#tools">
               <Button size="lg" variant="outline" className="h-12 rounded-xl border-zinc-700 bg-black/50 px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800">
                {tNav('viewTools')}
              </Button>
            </Link>
            <Link href={`/${locale}/download`}>
               <Button size="lg" className="h-12 rounded-xl bg-white px-8 text-base font-semibold text-black transition-all hover:bg-zinc-200 hover:scale-105 shadow-lg shadow-white/10">
                <Download className="mr-2 h-4 w-4" />
                {tCommon('downloadApp') || "Download App"}
              </Button>
            </Link>
          </div>

           {/* Stats / Trust */}
           <div className="mt-16 border-y border-white/5 bg-white/[0.02] py-8 backdrop-blur-sm">
              <div className="container mx-auto flex flex-wrap justify-center gap-12 px-4 sm:gap-24 text-zinc-400">
                 <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="font-medium text-zinc-300">{t('securePrivate')}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-primary" />
                    <span className="font-medium text-zinc-300">{t('instantProcessing')}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-primary" />
                    <span className="font-medium text-zinc-300">{t('multiPlatform')}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-24 bg-zinc-950/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('powerfulTools')}</h2>
            <p className="mt-4 text-lg text-zinc-400">
              {t('powerfulToolsDescription')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((tool) => {
              const Icon = tool.icon

              return (
                <Link
                  key={tool.id}
                  href={`/${locale}/${tool.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-zinc-400 transition-colors group-hover:text-primary" />
                  </div>

                  <h3 className="mb-2 text-xl font-semibold text-white">{tool.name}</h3>
                  <p className="text-sm text-zinc-400 group-hover:text-zinc-300">{tool.description}</p>

                  <div className="absolute bottom-4 right-4 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {t('featuresTitle')} <br/>
                    <span className="text-primary">{t('featuresTitleHighlight')}</span>
                 </h2>
                 <p className="mt-4 text-lg text-zinc-400">
                    {t('featuresDescription')}
                 </p>

                 <div className="mt-8 space-y-4">
                    {[
                       t('feature1'),
                       t('feature2'),
                       t('feature3'),
                       t('feature4')
                    ].map((feature, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                             <Check className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-zinc-300">{feature}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="relative rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl lg:p-12">
                 <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
                 <div className="relative z-10 grid gap-6">
                    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
                       <div className="rounded-lg bg-red-500/20 p-2">
                          <FileText className="h-6 w-6 text-red-500" />
                       </div>
                       <div className="flex-1">
                          <div className="h-2 w-24 rounded-full bg-white/10" />
                          <div className="mt-2 h-2 w-16 rounded-full bg-white/5" />
                       </div>
                       <div className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                          {t('ready')}
                       </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
                       <div className="rounded-lg bg-blue-500/20 p-2">
                          <Shield className="h-6 w-6 text-blue-500" />
                       </div>
                       <div className="flex-1">
                          <div className="h-2 w-32 rounded-full bg-white/10" />
                          <div className="mt-2 h-2 w-20 rounded-full bg-white/5" />
                       </div>
                       <div className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                          {t('protected')}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-zinc-950 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                 <Link href={`/${locale}`} className="mb-6 flex items-center gap-2">
                   <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <FileText className="h-5 w-5 text-white" />
                   </div>
                   <span className="text-lg font-bold text-white">{tCommon('appName')}</span>
                 </Link>
                 <p className="text-sm text-zinc-500">
                    {tFooter('description')}
                 </p>
              </div>

              <div>
                 <h3 className="mb-4 text-sm font-semibold text-white">{tFooter('toolsSection')}</h3>
                 <ul className="space-y-2 text-sm text-zinc-500">
                    <li><Link href={`/${locale}/merge`} className="hover:text-primary">{tFooter('mergePdf')}</Link></li>
                    <li><Link href={`/${locale}/split`} className="hover:text-primary">{tFooter('splitPdf')}</Link></li>
                    <li><Link href={`/${locale}/compress`} className="hover:text-primary">{tFooter('compressPdf')}</Link></li>
                    <li><Link href={`/${locale}/convert`} className="hover:text-primary">{tFooter('convertPdf')}</Link></li>
                 </ul>
              </div>

             <div>
                <h3 className="mb-4 text-sm font-semibold text-white">{tFooter('contactTitle')}</h3>
                <ul className="space-y-4 text-sm text-zinc-500">
                   <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <a href="mailto:edicuambe@gmail.com" className="hover:text-primary transition-colors">edicuambe@gmail.com</a>
                   </li>
                   <li className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-zinc-400" />
                      <a href="https://github.com/EdilsonRogerioCuambe" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{tFooter('github')}</a>
                   </li>
                   <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <a href="tel:+5585999670030" className="hover:text-primary transition-colors">(85) 99967-0030</a>
                   </li>
                </ul>
             </div>

              <div>
                 <h3 className="mb-4 text-sm font-semibold text-white">{tFooter('legalSection')}</h3>
                 <ul className="space-y-2 text-sm text-zinc-500">
                    <li><Link href={`/${locale}/privacy`} className="hover:text-primary">{tFooter('privacy')}</Link></li>
                    <li><Link href={`/${locale}/terms`} className="hover:text-primary">{tFooter('terms')}</Link></li>
                    <li><Link href={`/${locale}/cookies`} className="hover:text-primary">{tFooter('cookies')}</Link></li>
                    <li><Link href={`/${locale}/contact`} className="hover:text-primary">{tFooter('contact')}</Link></li>
                 </ul>
              </div>
           </div>

           <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-600">
              &copy; {new Date().getFullYear()} {tCommon('appName')}. {tFooter('allRightsReserved')}.
           </div>
        </div>
      </footer>
    </div>
  )
}
