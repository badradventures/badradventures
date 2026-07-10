import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageSeo as useSeo } from "@/lib/seo";

export default function TermsPage() {
  useSeo({
    path: "/terms",
    title: "Terms & conditions",
    description:
      "Badr Adventures UK Ltd terms and conditions for hike bookings, equipment rental, and website use.",
  });
  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Legal
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Terms & Conditions</h1>
          <p className="mt-2 text-stone-300">
            Badr Adventures UK Ltd · Company No. 15921546 · Last updated June 2026
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Who we are</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-stone-600">
            <p>
              <strong>Badr Adventures UK Ltd</strong> (company number 15921546, registered office: 106
              Castlesteads Drive, Carlisle, England, CA2 7XD) operates the website badradventures.co.uk
              and provides guided hiking, camping, and outdoor adventure services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Booking & payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              When you book a hike or rental, you enter into a binding contract with us. Payment is
              due at the time of booking unless otherwise agreed in writing.
            </p>
            <p>
              All prices are in British Pounds (GBP) and inclusive of applicable VAT. Payment is
              processed securely through Stripe. We never see or store your card details.
            </p>
            <p>
              Your booking is confirmed when you receive a confirmation email from us. If you do not
              receive this within 24 hours, please contact us.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Cancellation & refunds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Our cancellation policy depends on the type of booking:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Hikes:</strong> Full refund if cancelled 14+ days before the hike date. 50%
                refund if cancelled 7–13 days before. No refund for cancellations within 7 days of the
                hike.
              </li>
              <li>
                <strong>Equipment rental:</strong> Full refund if cancelled 7+ days before the rental
                start date. No refund for cancellations within 7 days.
              </li>
              <li>
                <strong>Cancellation by us:</strong> If we cancel a hike due to unsafe weather
                conditions, guide illness, or insufficient numbers, you will receive a full refund or
                the option to transfer to another date.
              </li>
            </ul>
            <p>
              To cancel, email us at{" "}
              <a href="mailto:enquiries@badradventures.co.uk" className="text-pine underline">
                enquiries@badradventures.co.uk
              </a>{" "}
              with your booking reference. Refunds are processed within 14 days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Participant responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>By booking with us, you confirm that:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You are physically fit enough to participate in the selected activity.</li>
              <li>
                You will disclose any medical conditions, injuries, or medications that may affect
                your participation (this information is treated confidentially).
              </li>
              <li>You will follow the instructions of our guides at all times.</li>
              <li>
                You are responsible for having appropriate clothing, footwear, and equipment for the
                conditions.
              </li>
            </ul>
            <p>
              We reserve the right to refuse participation or remove a participant from an activity if
              we believe their safety or the safety of others is at risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              Outdoor activities carry inherent risks. While we take every reasonable precaution,
              participants acknowledge that hiking, scrambling, and outdoor activities involve
              potential hazards including uneven terrain, weather changes, and physical exertion.
            </p>
            <p>
              Our liability is limited to the value of the booking. We do not accept liability for
              loss or damage to personal property, or for indirect or consequential losses.
            </p>
            <p>
              Nothing in these terms limits our liability for death or personal injury caused by our
              negligence.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Equipment rental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              Rented equipment remains our property at all times. You are responsible for returning
              equipment in the same condition as received, subject to reasonable wear and tear.
            </p>
            <p>
              Lost or damaged equipment may be charged at replacement cost. We recommend inspecting
              equipment before use and reporting any defects immediately.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Insurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              We hold public liability insurance. Participants are strongly recommended to have their
              own personal accident and cancellation insurance, especially for higher-difficulty hikes
              and multi-day trips.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Changes to these terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              We may update these terms at any time. Changes will be posted on this page with an
              updated date. Continued use of our services after changes constitutes acceptance of the
              new terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Governing law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              These terms are governed by the laws of England and Wales. Any disputes shall be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:enquiries@badradventures.co.uk" className="text-pine underline">
                enquiries@badradventures.co.uk
              </a>{" "}
              or via our{" "}
              <Link to="/contact" className="text-pine underline">
                contact page
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
