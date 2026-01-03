"use client"

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">
          Last updated: January 3, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">
            PDF Master uses cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
            <li><strong>Preference Cookies:</strong> Remember your settings (like theme preference)</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as setting your privacy preferences or language selection.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
            <p>
              We use Vercel Analytics to collect anonymous usage data. This helps us understand:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Which features are most popular</li>
              <li>How users navigate through the site</li>
              <li>Where improvements can be made</li>
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Preference Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make (such as theme or language) and provide enhanced, more personalized features.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Vercel Analytics:</strong> For website analytics</li>
            <li><strong>Google Fonts:</strong> For typography (may set cookies)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
          <p className="mb-4">
            You can control and/or delete cookies as you wish. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Delete all cookies that are already on your device</li>
            <li>Set your browser to prevent cookies from being placed</li>
            <li>Use browser extensions to block specific types of cookies</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> If you disable cookies, some features of our website may not function properly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookie Duration</h2>
          <p>
            We use both session cookies (which expire when you close your browser) and persistent cookies (which stay on your device for a set period or until you delete them).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. More Information</h2>
          <p>
            For more information about how we handle your data, please see our{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <p className="mt-4">
            If you have questions about our use of cookies, contact us at:{' '}
            <a href="mailto:edicuambe@gmail.com" className="text-primary hover:underline">
              edicuambe@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
