"use client"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">
          Last updated: January 3, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            At PDF Master, we take your privacy seriously. This Privacy Policy explains how we handle your information when you use our PDF editing application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Data Processing</h2>
          <p className="mb-4">
            <strong>Complete Client-Side Processing:</strong> All PDF operations are performed entirely in your browser. Your files never leave your device.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not upload your files to any server</li>
            <li>We do not store your files</li>
            <li>We do not access the content of your documents</li>
            <li>All processing happens locally on your device</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
          <p className="mb-4">We may collect minimal analytics data to improve our service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Anonymous usage statistics</li>
            <li>Browser type and version</li>
            <li>Device type</li>
            <li>General location (country/region)</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> We never collect file names, file contents, or any personal information from your documents.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookies</h2>
          <p>
            We use minimal cookies for essential functionality and analytics. See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
          <p className="mb-4">We may use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Vercel Analytics:</strong> For anonymous usage statistics</li>
            <li><strong>Google Fonts:</strong> For typography (loaded from Google's CDN)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p>
            Since all processing happens in your browser, your files are as secure as your device. We recommend:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Using a secure, updated browser</li>
            <li>Ensuring your device has up-to-date security software</li>
            <li>Not using public computers for sensitive documents</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p>
            Since we don't store your data, there's nothing to delete or modify. However, you can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Clear your browser cache and cookies at any time</li>
            <li>Use private/incognito browsing mode</li>
            <li>Disable analytics through browser extensions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            Our service is not directed to children under 13. We do not knowingly collect information from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be indicated by the "Last updated" date at the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:edicuambe@gmail.com" className="text-primary hover:underline">
              edicuambe@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
