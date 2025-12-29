"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Eye, EyeOff, Lock, Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { PasswordStrengthIndicator } from './protect-pdf/password-strength'
import { PERMISSION_PRESETS, type EncryptionLevel, type PrintingPermission, type ProtectionPermissions } from './protect-pdf/types'

export function ProtectInterface() {
  const t = useTranslations('tools.protect')
  const tCommon = useTranslations('common')

  const [file, setFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Passwords
  const [userPassword, setUserPassword] = useState('')
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('')
  const [useUserPassword, setUseUserPassword] = useState(true)
  const [showUserPassword, setShowUserPassword] = useState(false)

  const [ownerPassword, setOwnerPassword] = useState('')
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState('')
  const [useOwnerPassword, setUseOwnerPassword] = useState(false)
  const [showOwnerPassword, setShowOwnerPassword] = useState(false)

  // Permissions
  const [permissions, setPermissions] = useState<ProtectionPermissions>({
    printing: 'highResolution',
    modifying: true,
    copying: true,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: true
  })

  // Encryption (default to 256-bit for maximum security)
  const [encryptionLevel, setEncryptionLevel] = useState<EncryptionLevel>('256-bit-aes')

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFileSelected = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0])
    }
  }

  const validatePasswords = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (useUserPassword) {
      if (!userPassword) {
        newErrors.userPassword = t('errors.noPassword')
      } else if (userPassword.length < 8) {
        newErrors.userPassword = t('errors.passwordTooShort')
      } else if (userPassword !== userPasswordConfirm) {
        newErrors.userPasswordConfirm = t('errors.passwordMismatch')
      }
    }

    if (useOwnerPassword) {
      if (!ownerPassword) {
        newErrors.ownerPassword = t('errors.noPassword')
      } else if (ownerPassword.length < 8) {
        newErrors.ownerPassword = t('errors.passwordTooShort')
      } else if (ownerPassword !== ownerPasswordConfirm) {
        newErrors.ownerPasswordConfirm = t('errors.passwordMismatch')
      }

      if (useUserPassword && userPassword === ownerPassword) {
        newErrors.ownerPassword = t('errors.passwordsSame')
      }
    }

    if (!useUserPassword && !useOwnerPassword) {
      newErrors.general = t('errors.noPassword')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const applyPreset = (presetKey: string) => {
    const preset = PERMISSION_PRESETS[presetKey]
    if (preset) {
      setPermissions(preset.permissions)
    }
  }



  const protectPDF = async () => {
    if (!file) return

    if (!validatePasswords()) {
      return
    }

    setIsProcessing(true)

    try {
      // Server-side processing using /api/lock-pdf
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('userPassword', useUserPassword ? userPassword : '')
      formData.append('ownerPassword', useOwnerPassword ? ownerPassword : '')
      formData.append('permissions', JSON.stringify(permissions))

      // Map encryption level to key length
      const keyLengthMap: Record<EncryptionLevel, number> = {
        '40-bit-rc4': 40,
        '128-bit-rc4': 128,
        '128-bit-aes': 128,
        '256-bit-aes': 256
      }
      formData.append('keyLength', keyLengthMap[encryptionLevel].toString())

      const response = await fetch('/api/lock-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to protect PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `protected-${file.file.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(t('toasts.success'), {
        description: t('toasts.successDesc')
      })

    } catch (error) {
      console.error('Error protecting PDF:', error)
      toast.error(t('toasts.error'), {
        description: error instanceof Error ? error.message : t('toasts.errorDesc')
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <Card className="p-8 text-center space-y-6">
          <div className="text-center space-y-2">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t('title')}</h2>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>

          <FileDropZone
            onFilesSelected={handleFileSelected}
            accept=".pdf"
            maxFiles={1}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {tCommon('back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* File Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-red-600 font-semibold text-lg">PDF</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{file.file.name}</h3>
            <p className="text-sm text-gray-500">
              {(file.file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {t('notProtected')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      {/* User Password */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{t('userPassword')}</h3>
            <p className="text-sm text-gray-500">{t('userPasswordDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useUserPassword}
              onChange={(e) => setUseUserPassword(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">{t('addUserPassword')}</span>
          </label>

          {useUserPassword && (
            <div className="space-y-4 pl-6">
              <div>
                <Label htmlFor="userPassword">{t('password')}</Label>
                <div className="relative mt-1">
                  <Input
                    id="userPassword"
                    type={showUserPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={t('enterPassword')}
                    className={errors.userPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                  >
                    {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.userPassword && <p className="text-xs text-red-500 mt-1">{errors.userPassword}</p>}
              </div>

              <div>
                <Label htmlFor="userPasswordConfirm">{t('confirmPassword')}</Label>
                <Input
                  id="userPasswordConfirm"
                  type={showUserPassword ? 'text' : 'password'}
                  value={userPasswordConfirm}
                  onChange={(e) => setUserPasswordConfirm(e.target.value)}
                  placeholder={t('confirmPassword')}
                  className={`mt-1 ${errors.userPasswordConfirm ? 'border-red-500' : ''}`}
                />
                {errors.userPasswordConfirm && <p className="text-xs text-red-500 mt-1">{errors.userPasswordConfirm}</p>}
              </div>

              <PasswordStrengthIndicator password={userPassword} />
            </div>
          )}
        </div>
      </Card>

      {/* Owner Password */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{t('ownerPassword')}</h3>
            <p className="text-sm text-gray-500">{t('ownerPasswordDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useOwnerPassword}
              onChange={(e) => setUseOwnerPassword(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">{t('setOwnerPassword')}</span>
          </label>

          {useOwnerPassword && (
            <>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ {t('ownerPasswordWarning')}
              </div>

              <div className="space-y-4 pl-6">
                <div>
                  <Label htmlFor="ownerPassword">{t('ownerPassword')}</Label>
                  <div className="relative mt-1">
                    <Input
                      id="ownerPassword"
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder={t('enterOwnerPassword')}
                      className={errors.ownerPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    >
                      {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.ownerPassword && <p className="text-xs text-red-500 mt-1">{errors.ownerPassword}</p>}
                </div>

                <div>
                  <Label htmlFor="ownerPasswordConfirm">{t('confirmOwnerPassword')}</Label>
                  <Input
                    id="ownerPasswordConfirm"
                    type={showOwnerPassword ? 'text' : 'password'}
                    value={ownerPasswordConfirm}
                    onChange={(e) => setOwnerPasswordConfirm(e.target.value)}
                    placeholder={t('confirmOwnerPassword')}
                    className={`mt-1 ${errors.ownerPasswordConfirm ? 'border-red-500' : ''}`}
                  />
                  {errors.ownerPasswordConfirm && <p className="text-xs text-red-500 mt-1">{errors.ownerPasswordConfirm}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Permissions */}
      {useOwnerPassword && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">{t('permissions')}</h3>

          <div className="space-y-6">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">{t('quickPresets')}</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(key)}
                    title={preset.description}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="printing" className="text-sm font-medium">{t('printing')}</Label>
                <Select
                  value={permissions.printing}
                  onValueChange={(value) => setPermissions({...permissions, printing: value as PrintingPermission})}
                >
                  <SelectTrigger id="printing" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('printingNone')}</SelectItem>
                    <SelectItem value="lowResolution">{t('printingLow')}</SelectItem>
                    <SelectItem value="highResolution">{t('printingHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.copying}
                    onChange={(e) => setPermissions({...permissions, copying: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowCopying')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.modifying}
                    onChange={(e) => setPermissions({...permissions, modifying: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowModifying')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.documentAssembly}
                    onChange={(e) => setPermissions({...permissions, documentAssembly: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowAssembly')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.fillingForms}
                    onChange={(e) => setPermissions({...permissions, fillingForms: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowForms')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.annotating}
                    onChange={(e) => setPermissions({...permissions, annotating: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowAnnotations')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.contentAccessibility}
                    onChange={(e) => setPermissions({...permissions, contentAccessibility: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t('allowScreenReaders')}</span>
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Encryption Level */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">{t('encryptionSettings')}</h3>

        <RadioGroup value={encryptionLevel} onValueChange={(value) => setEncryptionLevel(value as EncryptionLevel)}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="40-bit-rc4" id="40-bit" />
              <Label htmlFor="40-bit" className="font-normal cursor-pointer">
                <span className="font-medium">{t('encryption40bit')}</span>
                <span className="text-xs text-gray-500 ml-2">{t('encryption40bitDesc')}</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="128-bit-rc4" id="128-rc4" />
              <Label htmlFor="128-rc4" className="font-normal cursor-pointer">
                <span className="font-medium">{t('encryption128rc4')}</span>
                <span className="text-xs text-gray-500 ml-2">{t('encryption128rc4Desc')}</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="128-bit-aes" id="128-aes" />
              <Label htmlFor="128-aes" className="font-normal cursor-pointer">
                <span className="font-medium">{t('encryption128aes')}</span>
                <span className="text-xs text-green-600 ml-2">{t('encryption128aesDesc')}</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="256-bit-aes" id="256-aes" />
              <Label htmlFor="256-aes" className="font-normal cursor-pointer">
                <span className="font-medium">{t('encryption256aes')}</span>
                <span className="text-xs text-gray-500 ml-2">{t('encryption256aesDesc')}</span>
              </Label>
            </div>
          </div>
        </RadioGroup>

        <p className="text-xs text-gray-500 mt-4">
          ℹ️ {t('encryptionInfo')}
        </p>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setFile(null)}>
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={protectPDF}
          disabled={isProcessing}
          size="lg"
        >
          {isProcessing ? (
            t('processing')
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {t('protectPdf')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
