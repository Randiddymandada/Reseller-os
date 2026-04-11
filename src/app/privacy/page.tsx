import Link from "next/link";
import { TrendingUp, ArrowLeft } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-accent-red flex items-center justify-center shadow-lg shadow-accent-red/30 shrink-0">
        <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
      </div>
      <div className="leading-none">
        <span className="font-display font-black text-[15px] text-text-primary tracking-tight">RESELLER</span>
        <span className="font-display font-black text-[15px] text-accent-red tracking-tight">OS</span>
      </div>
    </div>
  );
}

const SECTIONS = [
  {
    title: "1. Information We Collect",
    items: [
      {
        label: "Account Data",
        text: "When you create an account, we collect your name and email address. If you sign up through Supabase Auth, we store the information you provide during registration.",
      },
      {
        label: "Usage Data",
        text: "We may collect anonymized data about how you interact with the app — such as features used and pages visited — to help us improve the product. This data is never tied to personally identifiable information.",
      },
      {
        label: "Business Data",
        text: "All inventory, orders, receipts, and customer records you create in ResellerOS are your data. We do not read, analyze, or share this content.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    items: [
      {
        label: "To operate the service",
        text: "Your account information is used to authenticate you, associate your data with your account, and provide the features of ResellerOS.",
      },
      {
        label: "To communicate with you",
        text: "We may use your email to send transactional messages such as account confirmations, billing notifications, or important service updates. We do not send unsolicited marketing emails.",
      },
      {
        label: "To improve the product",
        text: "Aggregated, anonymized usage data may be used to understand how the app is being used and to prioritize improvements.",
      },
    ],
  },
  {
    title: "3. We Do Not Sell Your Data",
    body: "ResellerOS does not sell, rent, trade, or otherwise transfer your personal information to third parties for commercial purposes. Your data is yours. We will never monetize it by selling it to advertisers, data brokers, or any other third party.",
  },
  {
    title: "4. Payments & Stripe",
    body: "All payment processing is handled by Stripe, a PCI-DSS compliant third-party payment processor. ResellerOS does not collect, store, or have access to your credit card numbers, bank account details, or any other sensitive payment information. When you subscribe to a paid plan, your payment details are entered directly into Stripe's secure interface. You can review Stripe's privacy practices at stripe.com/privacy.",
  },
  {
    title: "5. Cookies & Local Storage",
    body: "ResellerOS uses browser local storage to save your app data (inventory, orders, receipts) on your device in demo mode. In authenticated mode, session cookies set by Supabase are used to maintain your login state. We do not use tracking cookies or third-party advertising cookies. You can clear local storage at any time from your browser settings or from the Settings page within the app.",
  },
  {
    title: "6. Data Storage & Security",
    body: "When Supabase is configured, your data is stored in a PostgreSQL database hosted by Supabase with row-level security — meaning each user can only access their own records. In demo mode, all data is stored locally in your browser and never sent to any server. We take reasonable technical measures to protect your data, but no system is completely immune to breaches. We recommend using a strong, unique password for your account.",
  },
  {
    title: "7. Third-Party Services",
    items: [
      {
        label: "Supabase",
        text: "Used for authentication and database storage. supabase.com/privacy",
      },
      {
        label: "Stripe",
        text: "Used for payment processing. stripe.com/privacy",
      },
    ],
  },
  {
    title: "8. Your Rights",
    body: "You have the right to access, correct, or delete your personal data at any time. You can update your profile information in the Settings page. To request complete deletion of your account and all associated data, email us at support@reselleros.com. We will process your request within 30 days.",
  },
  {
    title: "9. Children's Privacy",
    body: "ResellerOS is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.",
  },
  {
    title: "10. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated date. Your continued use of the service after changes are posted constitutes your acceptance of the updated policy.",
  },
  {
    title: "11. Contact",
    body: "If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us at support@reselleros.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080d] font-body">
      {/* Navbar */}
      <nav className="border-b border-[#1c1c28] bg-[#08080d]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="mb-10 pb-8 border-b border-[#1c1c28]">
          <div className="text-[11px] font-display font-black text-accent-red uppercase tracking-widest mb-3">
            Legal
          </div>
          <h1 className="font-display font-black text-4xl text-text-primary tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-text-muted text-sm">
            Last Updated: <span className="text-text-secondary">April 2026</span>
          </p>
          <p className="text-text-secondary text-sm mt-4 leading-relaxed max-w-2xl">
            Your privacy matters. This policy explains what information we collect,
            how we use it, and what control you have over it.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            { emoji: "🚫", title: "No data selling", desc: "We never sell your personal data to anyone, ever." },
            { emoji: "🔒", title: "Stripe handles payments", desc: "We never see or store your card details." },
            { emoji: "📦", title: "Your data stays yours", desc: "Your inventory and records belong to you." },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
              <div className="text-xl mb-2">{emoji}</div>
              <div className="font-display font-bold text-text-primary text-sm mb-1">{title}</div>
              <div className="text-text-muted text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display font-bold text-text-primary text-base mb-3">
                {section.title}
              </h2>
              {"body" in section && section.body && (
                <p className="text-text-secondary text-sm leading-[1.75]">
                  {section.body}
                </p>
              )}
              {"items" in section && section.items && (
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.label} className="pl-4 border-l border-[#1c1c28]">
                      <span className="text-text-primary text-sm font-semibold">{item.label}: </span>
                      <span className="text-text-secondary text-sm leading-[1.75]">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-[#1c1c28]">
          <div className="bg-[#0f0f17] border border-[#1c1c28] rounded-2xl p-5">
            <p className="text-text-muted text-xs leading-relaxed">
              This Privacy Policy is effective as of April 2026. For questions, email us at{" "}
              <a
                href="mailto:support@reselleros.com"
                className="text-accent-red hover:underline"
              >
                support@reselleros.com
              </a>
              . You can also review our{" "}
              <Link href="/terms" className="text-accent-red hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1c1c28] py-8 px-4 sm:px-6 mt-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-text-muted">
            <Link href="/"              className="hover:text-text-secondary transition-colors">Home</Link>
            <Link href="/login"         className="hover:text-text-secondary transition-colors">Login</Link>
            <Link href="/signup"        className="hover:text-text-secondary transition-colors">Sign Up</Link>
            <Link href="/terms"         className="hover:text-text-secondary transition-colors">Terms of Service</Link>
            <Link href="/receipts/verify" className="hover:text-text-secondary transition-colors">Verify Receipt</Link>
          </div>
          <div className="text-xs text-text-muted">© {new Date().getFullYear()} ResellerOS</div>
        </div>
      </footer>
    </div>
  );
}
