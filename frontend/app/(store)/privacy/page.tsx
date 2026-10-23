import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

// TODO(client): have this reviewed before launch.
export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="We collect only what we need to run the store and deliver your orders."
      sections={[
        {
          heading: "What we collect",
          body: (
            <p>
              Your name, email, phone number and delivery address when you order or create an
              account, and your email if you sign up for new-drop updates.
            </p>
          ),
        },
        {
          heading: "Payments",
          body: (
            <p>
              Payments are processed by Razorpay. We never see or store your card or UPI details.
            </p>
          ),
        },
        {
          heading: "Stored in your browser",
          body: (
            <p>
              Your Garage (cart), wishlist, recently viewed cars and light/dark theme are saved in
              your browser so they&apos;re there when you come back. Clearing your browser data
              removes them.
            </p>
          ),
        },
        {
          heading: "Your data",
          body: (
            <p>
              To see, correct or delete your information, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
