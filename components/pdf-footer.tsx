import { Check } from "lucide-react"

export function PDFFooter() {
  const features = ["100% Free", "Secure - Files processed in browser", "No file upload to server", "Unlimited usage"]

  return (
    <footer className="border-t border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-4xl px-6">
        {/* Features */}
        <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PDF Master. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
