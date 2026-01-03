"use client"

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">
          Last updated: January 3, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using PDF Master, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            PDF Master is a free, browser-based PDF editing tool that allows you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Edit, merge, split, and compress PDF files</li>
            <li>Convert between PDF and image formats</li>
            <li>Add annotations, signatures, and watermarks</li>
            <li>Protect and unlock PDF documents</li>
            <li>Perform other PDF-related operations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Use of Service</h2>
          <p className="mb-4">You agree to use this service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only for lawful purposes</li>
            <li>In accordance with these Terms of Use</li>
            <li>Without violating any applicable laws or regulations</li>
            <li>Without infringing on the rights of others</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p>
            You retain all rights to the documents you process using PDF Master. We do not claim any ownership over your files or their contents.
          </p>
          <p className="mt-4">
            The PDF Master software, design, and user interface are protected by copyright and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
          <p className="mb-4">
            PDF Master is provided "as is" without any warranties, express or implied. We do not guarantee:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>That the service will be uninterrupted or error-free</li>
            <li>That defects will be corrected</li>
            <li>That the service is free of viruses or harmful components</li>
            <li>The accuracy or reliability of any results</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. User Responsibilities</h2>
          <p className="mb-4">You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The security of your device and browser</li>
            <li>Backing up important documents before processing</li>
            <li>Verifying the output of any operations</li>
            <li>Ensuring you have the right to modify any documents you process</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Modifications to Service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue the service at any time without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p>
            These Terms of Use shall be governed by and construed in accordance with the laws of Brazil, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We may revise these terms at any time. The revised terms will be effective immediately upon posting. Your continued use of the service after any changes indicates your acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
          <p>
            For questions about these Terms of Use, please contact:{' '}
            <a href="mailto:edicuambe@gmail.com" className="text-primary hover:underline">
              edicuambe@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
