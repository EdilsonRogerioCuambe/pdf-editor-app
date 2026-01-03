"use client"

import { Github, Mail } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-12">
          Have questions, suggestions, or need support? We'd love to hear from you!
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <a
                  href="mailto:edicuambe@gmail.com"
                  className="text-primary hover:underline"
                >
                  edicuambe@gmail.com
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  For general inquiries and support
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
              <Github className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">GitHub</h3>
                <a
                  href="https://github.com/EdilsonRogerioCuambe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @EdilsonRogerioCuambe
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  Report bugs and contribute
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">About the Developer</h2>
          <p className="mb-4">
            PDF Master is developed and maintained by <strong>Edilson Rogério Cuambe</strong>,
            a passionate developer dedicated to creating useful, privacy-focused tools.
          </p>
          <p>
            This project is open-source and welcomes contributions from the community.
            If you'd like to contribute, check out our{' '}
            <a
              href="https://github.com/EdilsonRogerioCuambe/pdf-editor-app"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Is PDF Master really free?</h3>
              <p>
                Yes! PDF Master is completely free with no hidden costs, subscriptions, or premium features.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Are my files safe?</h3>
              <p>
                Absolutely. All processing happens locally in your browser. Your files never leave your device.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I use this for commercial purposes?</h3>
              <p>
                Yes, you can use PDF Master for both personal and commercial purposes at no cost.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">How can I report a bug?</h3>
              <p>
                Please open an issue on our{' '}
                <a
                  href="https://github.com/EdilsonRogerioCuambe/pdf-editor-app/issues"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues page
                </a>{' '}
                or email us directly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I suggest new features?</h3>
              <p>
                Of course! We welcome feature suggestions. Please share them via GitHub Issues or email.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Business Hours</h2>
          <p>
            While PDF Master is available 24/7, support inquiries are typically responded to within 1-2 business days.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please note: This is a personal project maintained in my free time, so response times may vary.
          </p>
        </section>
      </div>
    </div>
  )
}
