"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Unlock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function UnlockInterface() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const handleFileSelected = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0])
      setError("")
      setPassword("")
    }
  }

  const handleUnlock = async () => {
    if (!file) return
    if (!password) {
      setError("Please enter the password to unlock the PDF")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file.file)
      formData.append("password", password)

      const response = await fetch("/api/unlock-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to unlock PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `unlocked-${file.file.name}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("PDF unlocked successfully!")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An error occurred")
      toast.error("Failed to unlock PDF. Please check the password.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Unlock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Unlock PDF</h1>
          <p className="text-muted-foreground">
            Remove password protection and restrictions from your PDF files
          </p>
        </div>

        <FileDropZone
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          maxFiles={1}

        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>We support removing owner passwords and user passwords if you know them.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFile(null)
            setPassword("")
            setError("")
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Unlock PDF</h1>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{file.file.name}</h3>
            <p className="text-sm text-muted-foreground">
              {(file.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              setPassword("")
              setError("")
            }}
          >
            Change
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Enter PDF Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the password to unlock"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <p>
              Note: You must provide the correct password to unlock the document.
              We cannot crack unknown passwords.
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUnlock}
            disabled={isProcessing || !password}
          >
            {isProcessing ? "Unlocking..." : "Unlock PDF"}
          </Button>
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium">Remove Password</h3>
          <p className="text-xs text-muted-foreground">Strip open password</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium">Remove Restrictions</h3>
          <p className="text-xs text-muted-foreground">Enable print & edit</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium">Secure Handling</h3>
          <p className="text-xs text-muted-foreground">Files processed locally</p>
        </div>
      </div>
    </div>
  )
}
