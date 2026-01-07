import { Button } from "@/components/ui/button"
import { Check, Download, Lock, Shield, WifiOff, Zap } from "lucide-react"
import { useTranslations } from "next-intl"

export default function DownloadPage() {
  const t = useTranslations('download')
  const common = useTranslations('common')

  const features = [
    {
      icon: WifiOff,
      title: t('features.offline'),
      description: t('features.offlineDesc'),
    },
    {
      icon: Zap,
      title: t('features.faster'),
      description: t('features.fasterDesc'),
    },
    {
      icon: Lock,
      title: t('features.privacy'),
      description: t('features.privacyDesc'),
    },
    {
      icon: Check,
      title: t('features.unlimited'),
      description: t('features.unlimitedDesc'),
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              {t('title')}
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              {t('subtitle')}
            </p>

            <div className="flex flex-col gap-4 min-[400px]:flex-row pt-4">
              <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg shadow-primary/20" asChild>
                <a href="/PDF-Master-Setup.exe" download>
                  <Download className="h-5 w-5" />
                  {t('button')}
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>{t('security.verified')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{t('security.noVirus')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span>{t('security.secure')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background gradients */}
        <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background" />
      </section>

      <section className="container py-12 md:py-24 lg:py-32 bg-muted/50 rounded-3xl mb-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 px-4">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-4 p-6 bg-background rounded-xl shadow-sm border hover:shadow-md transition-all">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
