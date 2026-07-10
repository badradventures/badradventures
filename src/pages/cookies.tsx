import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageSeo as useSeo } from "@/lib/seo";

export default function CookiesPage() {
  useSeo({
    path: '/cookies',
    title: 'Cookie policy',
    description: 'What cookies Badr Adventures uses and why. UK GDPR and PECR compliant.',
  });
  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Legal
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Cookie Policy</h1>
          <p className="mt-2 text-stone-300">UK GDPR & PECR compliant · Last updated June 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What are cookies?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-600">
            <p>Cookies are small text files stored on your device when you visit a website. Some are essential for the site to function; others help us understand how visitors use the site. Under UK GDPR and the Privacy and Electronic Communications Regulations (PECR), we ask for your consent before placing non-essential cookies.</p>
            <p className="mt-2">You can change your preferences at any time using the <button onClick={() => window.dispatchEvent(new CustomEvent("zo:manage-cookies"))} className="text-pine underline cursor-pointer">Manage cookies</button> link in the footer. Your choice is stored in this browser only and applies to this site only.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Categories we use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-600">
            <p>We group cookies into three categories. Essential cookies are always on. Analytics and marketing are opt-in.</p>
            <h3 className="mb-2 mt-4 font-semibold text-stone-900">🟢 Essential (always on)</h3>
            <p>Required for the website to function. Exempt from consent under Regulation 6(1)(a) of PECR.</p>
            <h3 className="mb-2 mt-4 font-semibold text-stone-900">🟡 Analytics (opt-in)</h3>
            <p>Anonymous, aggregated usage data via <a href="https://umami.is" className="text-pine underline" target="_blank" rel="noopener">Umami</a> — a privacy-friendly analytics tool that does not set cross-site tracking cookies and does not collect personal data.</p>
            <h3 className="mb-2 mt-4 font-semibold text-stone-900">🔴 Marketing (opt-in, currently unused)</h3>
            <p>We do not use advertising, remarketing, or cross-site tracking. This category is here in case we ever add such features, and will stay off until you opt in.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cookie inventory</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-600">
            <p className="mb-4">We use <strong>only essential (strictly necessary) cookies</strong>. These are required for the website to function and are exempt from consent under Regulation 6(1)(a) of PECR.</p>

            <h3 className="mb-2 mt-6 font-semibold text-stone-900">🟢 Essential (no consent required)</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="pb-2 font-medium text-stone-900">Name</th>
                  <th className="pb-2 font-medium text-stone-900">Purpose</th>
                  <th className="pb-2 font-medium text-stone-900">Expiry</th>
                  <th className="pb-2 font-medium text-stone-900">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr>
                  <td className="py-2 font-mono text-xs">sb-* (Supabase session)</td>
                  <td className="py-2">Keeps you signed in, maintains your session across page loads</td>
                  <td className="py-2">Session (expires when browser closes)</td>
                  <td className="py-2">Essential — HttpOnly, Secure, SameSite=Lax</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">badr.cart</td>
                  <td className="py-2">Stores your cart contents (localStorage, not a cookie)</td>
                  <td className="py-2">Persistent (cleared on checkout)</td>
                  <td className="py-2">Essential — client-side only</td>
                </tr>
              </tbody>
            </table>

            <h3 className="mb-2 mt-6 font-semibold text-stone-900">🟡 Analytics (none set)</h3>
            <p className="text-stone-500">We do not use Google Analytics, Plausible, Fathom, or any analytics service. No analytics cookies are set.</p>

            <h3 className="mb-2 mt-6 font-semibold text-stone-900">🔴 Marketing (none set)</h3>
            <p className="text-stone-500">We do not use Facebook Pixel, Google Ads, or any advertising or marketing cookies. No marketing cookies are set.</p>

            <h3 className="mb-2 mt-6 font-semibold text-stone-900">🟠 Third-party embedded content (none set)</h3>
            <p className="text-stone-500">We do not embed YouTube videos, Twitter timelines, Instagram feeds, or any third-party content that would set cookies. Social links are plain-text links only — clicking them takes you to the external site, where their own cookie policies apply.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Managing cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Most web browsers allow you to control cookies through their settings:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-pine underline" target="_blank" rel="noopener">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-pine underline" target="_blank" rel="noopener">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/sfri11471/mac" className="text-pine underline" target="_blank" rel="noopener">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-pine underline" target="_blank" rel="noopener">Microsoft Edge</a></li>
            </ul>
            <p>Disabling essential cookies will prevent you from signing in or making bookings.</p>
            <p>You can also <button onClick={() => window.dispatchEvent(new CustomEvent("zo:manage-cookies"))} className="text-pine underline cursor-pointer">manage your consent preferences</button> at any time.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-600">
            <p>You were shown a cookie consent banner when you first visited the site. Your choice (accept or reject) is stored in your browser and applies to this site only. You can change your mind at any time using the <button onClick={() => window.dispatchEvent(new CustomEvent("zo:manage-cookies"))} className="text-pine underline cursor-pointer">Manage cookies</button> link in the footer.</p>
            <p className="mt-2">Because we only use essential cookies, rejecting non-essential cookies does not affect how the site works — there are simply no non-essential cookies to block. If we ever add analytics or marketing features, you will be asked for explicit consent before any such cookies are placed.</p>
            <p className="mt-2">If you have any questions, contact us at <a href="mailto:enquiries@badradventures.co.uk" className="text-pine underline">enquiries@badradventures.co.uk</a>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}