"use client"

import { Button } from "@/components/ui/button"
import { pdfTools } from "@/lib/pdf-tools"
import { ArrowRight, Check, FileText, Globe, Menu, Shield, X, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

// Translations for the landing page
const translations: Record<string, { name: string; description: string }> = {
  merge: { name: "Juntar PDFs", description: "Combine vários arquivos PDF em um único documento ordenado." },
  split: { name: "Dividir PDF", description: "Extraia páginas específicas ou divida seu documento em várias partes." },
  compress: { name: "Comprimir PDF", description: "Reduza o tamanho do arquivo mantendo a melhor qualidade possível." },
  rotate: { name: "Rodar PDF", description: "Gire suas páginas PDF. Salve agora mesmo permanentemente." },
  delete: { name: "Excluir Páginas", description: "Remova páginas indesejadas do seu documento PDF." },
  reorder: { name: "Reorganizar", description: "Organize as páginas do seu PDF simplesmente arrastando e soltando." },
  "pdf-to-image": { name: "PDF para Imagem", description: "Converta páginas de PDF em imagens JPG ou PNG." },
  "image-to-pdf": { name: "Imagem para PDF", description: "Transforme suas imagens (JPG, PNG) em arquivos PDF." },
  watermark: { name: "Marca d'água", description: "Adicione texto ou imagem como estampa em seu PDF." },
  "page-numbers": { name: "Números de Página", description: "Adicione numeração às páginas do seu PDF com facilidade." },
  sign: { name: "Assinar PDF", description: "Assine digitalmente seus documentos PDF." },
  annotate: { name: "Anotar PDF", description: "Adicione notas, destaques e desenhos ao seu PDF." },
  protect: { name: "Proteger PDF", description: "Adicione senha e criptografe seus arquivos PDF importantes." },
  unlock: { name: "Desbloquear PDF", description: "Remova a senha e proteção de arquivos PDF." },
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      {/* Navbar */}
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50">
                <Image
                  src="/pdf_master.png"
                  alt="PDF Icon"
                  width={24}
                  height={24}
                  className="h-full w-full object-cover rounded-lg"
                />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">PDF Master</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden gap-6 md:flex">
            <Link href="#tools" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              Ferramentas
            </Link>
            <Link href="#features" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              Recursos
            </Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/merge">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Começar Agora
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
                  Ferramentas
                </Link>
                <Link
                  href="#features"
                  className="text-lg font-medium text-zinc-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recursos
                </Link>
                <hr className="border-white/10" />
                <Link
                  href="/merge"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-primary text-white hover:bg-primary/90">
                    Começar Agora
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
            Novas ferramentas disponíveis
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Tudo o que você precisa para <br/>
            <span className="bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">seus PDFs</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Edite, converta e assine PDFs em segundos. Sem cadastro, sem pagamentos, sem marcas d'água. Totalmente gratuito e ilimitado para todos.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/merge">
              <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-primary/90 shadow-lg shadow-primary/25">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#tools">
               <Button size="lg" variant="outline" className="h-12 rounded-xl border-zinc-700 bg-black/50 px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800">
                Ver Ferramentas
              </Button>
            </Link>
          </div>

           {/* Stats / Trust */}
           <div className="mt-16 border-y border-white/5 bg-white/[0.02] py-8 backdrop-blur-sm">
             <div className="container mx-auto flex flex-wrap justify-center gap-12 px-4 sm:gap-24 text-zinc-400">
                <div className="flex items-center gap-3">
                   <Shield className="h-6 w-6 text-primary" />
                   <span className="font-medium text-zinc-300">100% Seguro & Privado</span>
                </div>
                <div className="flex items-center gap-3">
                   <Zap className="h-6 w-6 text-primary" />
                   <span className="font-medium text-zinc-300">Processamento Instantâneo</span>
                </div>
                <div className="flex items-center gap-3">
                   <Globe className="h-6 w-6 text-primary" />
                   <span className="font-medium text-zinc-300">Multi-Plataforma</span>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-24 bg-zinc-950/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ferramentas Poderosas</h2>
            <p className="mt-4 text-lg text-zinc-400">
              Escolha a ferramenta ideal para sua necessidade
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pdfTools.map((tool) => {
              const Icon = tool.icon
              const translation = translations[tool.id] || { name: tool.name, description: tool.description }

              return (
                <Link
                  key={tool.id}
                  href={`/${tool.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-zinc-400 transition-colors group-hover:text-primary" />
                  </div>

                  <h3 className="mb-2 text-xl font-semibold text-white">{translation.name}</h3>
                  <p className="text-sm text-zinc-400 group-hover:text-zinc-300">{translation.description}</p>

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
                    Edição Profissional de PDF <br/>
                    <span className="text-primary">Simplificada</span>
                 </h2>
                 <p className="mt-4 text-lg text-zinc-400">
                    Nossa plataforma oferece recursos avançados que antes só estavam disponíveis em softwares caros e complexos.
                 </p>

                 <div className="mt-8 space-y-4">
                    {[
                       "Totalmente Gratuito (Sem custos ocultos)",
                       "Sem necessidade de login ou cadastro",
                       "Downloads ilimitados e sem marca d'água",
                       "Criptografia de ponta a ponta (SSL)"
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
                          Pronto
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
                          Protegido
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
                 <Link href="/" className="mb-6 flex items-center gap-2">
                   <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <FileText className="h-5 w-5 text-white" />
                   </div>
                   <span className="text-lg font-bold text-white">PDF Master</span>
                 </Link>
                 <p className="text-sm text-zinc-500">
                    A melhor plataforma online para gerenciar seus documentos PDF de forma rápida e segura.
                 </p>
              </div>

              <div>
                 <h3 className="mb-4 text-sm font-semibold text-white">Ferramentas</h3>
                 <ul className="space-y-2 text-sm text-zinc-500">
                    <li><Link href="/merge" className="hover:text-primary">Juntar PDF</Link></li>
                    <li><Link href="/split" className="hover:text-primary">Dividir PDF</Link></li>
                    <li><Link href="/compress" className="hover:text-primary">Comprimir PDF</Link></li>
                    <li><Link href="/convert" className="hover:text-primary">Converter PDF</Link></li>
                 </ul>
              </div>

              <div>
                 <h3 className="mb-4 text-sm font-semibold text-white">Recursos</h3>
                 <ul className="space-y-2 text-sm text-zinc-500">
                    <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                    <li><Link href="#" className="hover:text-primary">Desenvolvedores</Link></li>
                    <li><Link href="#" className="hover:text-primary">Segurança</Link></li>
                 </ul>
              </div>

              <div>
                 <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
                 <ul className="space-y-2 text-sm text-zinc-500">
                    <li><Link href="#" className="hover:text-primary">Privacidade</Link></li>
                    <li><Link href="#" className="hover:text-primary">Termos de Uso</Link></li>
                    <li><Link href="#" className="hover:text-primary">Cookies</Link></li>
                    <li><Link href="#" className="hover:text-primary">Contato</Link></li>
                 </ul>
              </div>
           </div>

           <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-600">
              &copy; {new Date().getFullYear()} PDF Master. Todos os direitos reservados.
           </div>
        </div>
      </footer>
    </div>
  )
}
