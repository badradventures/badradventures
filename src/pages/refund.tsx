import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageSeo as useSeo } from "@/lib/seo";

export default function RefundPage() {
  useSeo({
    path: "/refund",
    title: "Refund policy",
    description:
      "Badr Adventures UK Ltd cancellation and refund policy for hike bookings and equipment rental.",
  });
  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Legal
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Refund Policy</h1>
          <p className="mt-2 text-stone-300">
            Badr Adventures UK Ltd · Effective June 2026
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Hike cancellations by you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>You may cancel a hike booking at any time by emailing enquiries@badradventures.co.uk with your booking reference. Refunds are calculated based on when we receive your cancellation notice:</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="pb-2 font-medium text-stone-900">Notice period</th>
                  <th className="pb-2 font-medium text-stone-900">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr>
                  <td className="py-2">14+ days before hike</td>
                  <td className="py-2">Full refund (minus Stripe fees, typically ~1.5%)</td>
                </tr>
                <tr>
                  <td className="py-2">7–13 days before hike</td>
                  <td className="py-2">50% refund</td>
                </tr>
                <tr>
                  <td className="py-2">Fewer than 7 days</td>
                  <td className="py-2">No refund</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-stone-500">
              "Days before" means calendar days before the hike start date, not business days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment rental cancellations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="pb-2 font-medium text-stone-900">Notice period</th>
                  <th className="pb-2 font-medium text-stone-900">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr>
                  <td className="py-2">7+ days before rental start</td>
                  <td className="py-2">Full refund</td>
                </tr>
                <tr>
                  <td className="py-2">Fewer than 7 days</td>
                  <td className="py-2">No refund</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellations by us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>We rarely cancel, but when we do you're fully protected:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Weather:</strong> If the Met Office issues a danger-to-life warning for the area, we'll cancel and offer a full refund or transfer.</li>
              <li><strong>Guide illness:</strong> If we can't find a qualified replacement guide, we'll cancel with full refund or transfer.</li>
              <li><strong>Minimum numbers:</strong> If a hike doesn't reach the minimum number of participants 7 days before the date, we may cancel and offer a full refund or transfer.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How refunds are processed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Refunds are processed back to the original payment method via Stripe. You will receive the refund within 14 days of our confirmation. The refund will appear on your statement within 5–10 business days after processing.</p>
            <p>Stripe's processing fee (~1.5% + 20p) is non-refundable and may be deducted from the refund amount for voluntary cancellations.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfers & credit notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>At our discretion and subject to availability, we may offer:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Transfer:</strong> Move your booking to a different hike date of equal or lesser value. Price differences must be settled before the new date.</li>
              <li><strong>Credit note:</strong> A credit valid for 12 months toward any future Badr Adventures booking.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact for cancellations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Email: <a href="mailto:enquiries@badradventures.co.uk" className="text-pine underline">enquiries@badradventures.co.uk</a></p>
            <p>Please include your booking reference number. We aim to respond within 24 hours.</p>
            <p className="mt-4 text-xs text-stone-500">
              Your statutory rights under the Consumer Contracts Regulations 2013 are not affected.
              For full terms, see our{" "}
              <Link to="/terms" className="text-pine underline">Terms & Conditions</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
