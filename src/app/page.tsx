import Link from "next/link";
import {
  TrendingUp, Package, Calculator, Receipt, ShoppingBag,
  Tag, BarChart2, Shield, Zap, Users, ArrowRight, Check,
  Star, ChevronRight, Bell
} from "lucide-react";

const FEATURES = [
  { icon: TrendingUp, title: "Real-Time Profit Tracking",   desc: "See your exact margin on every flip the moment you log it. Know what's making you money and what's not.",                                     color: "text-accent-red",   bg: "bg-accent-red/10 border-accent-red/20" },
  { icon: Package,    title: "Inventory Management",        desc: "Track every item from purchase to sale. Filter by status, category, condition — always know exactly what you're sitting on.",               color: "text-blue-400",     bg: "bg-blue-400/10 border-blue-400/20" },
  { icon: Calculator, title: "Profit Calculator",           desc: "Enter buy price, platform, and fees to get your exact net profit before you pull the trigger on any deal.",                                   color: "text-amber-400",    bg: "bg-amber-400/10 border-amber-400/20" },
  { icon: Tag,        title: "Auto Pricing Engine",         desc: "Get three pricing tiers instantly — fast flip, market rate, and max profit — based on your category and item condition.",                    color: "text-purple-400",   bg: "bg-purple-400/10 border-purple-400/20" },
  { icon: ShoppingBag,title: "Order & Customer Manager",   desc: "Full order pipeline from Pending to Delivered. Track customers, their spend history, and link every transaction.",                           color: "text-emerald-400",  bg: "bg-emerald-400/10 border-emerald-400/20" },
  { icon: Shield,     title: "Verified Receipt System",     desc: "Generate professional PDF receipts with a public verification link. Build buyer trust and eliminate disputes for good.",                    color: "text-sky-400",      bg: "bg-sky-400/10 border-sky-400/20" },
];

const TESTIMONIALS = [
  { quote: "I was tracking everything in a Google Sheet. ResellerOS replaced all of it in one afternoon. The profit calculator alone is worth it.", name: "Marcus T.", handle: "@mflips_sd",   detail: "Sneaker reseller · 200+ flips/year",           avatar: "MT", stars: 5 },
  { quote: "The receipt system is a game changer. My buyers actually feel like they're buying from a real store. Zero disputes since I started.",   name: "Aisha K.",  handle: "@aisharesells",detail: "Streetwear & luxury bags · SF Bay Area",       avatar: "AK", stars: 5 },
  { quote: "Auto pricing saved me from underpricing a Jordan 1 by like $60. That feature paid for itself on day one.",                             name: "Devon R.",  handle: "@devflips",    detail: "Electronics & sneakers · San Diego",           avatar: "DR", stars: 5 },
];

const PLANS = [
  {
    name: "Free", price: "$0", period: "", desc: "Get started — no card needed.", cta: "Start Free", href: "/signup", highlight: false,
    features: ["Up to 10 inventory items", "Profit calculator", "Basic dashboard", "5 receipts/month"],
    missing: ["Orders & customers", "Auto pricing", "Unlimited inventory", "Restock alerts"],
  },
  {
    name: "Pro", price: "$10", period: "/month", desc: "For resellers doing real volume.", cta: "Start Pro", href: "/signup?plan=pro", highlight: true,
    features: ["Unlimited inventory", "Orders & customer manager", "Unlimited receipts", "Full profit calculator", "CSV export", "Priority support"],
    missing: ["Auto pricing engine", "Restock alerts"],
  },
  {
    name: "Premium", price: "$20", period: "/month", desc: "For serious operators.", cta: "Go Premium", href: "/signup?plan=premium", highlight: false,
    features: ["Everything in Pro", "Auto pricing engine", "Restock alerts (V3)", "Advanced analytics", "API access (coming)", "White-label receipts"],
    missing: [],
  },
];

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080d] font-body">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1c1c28]/80 bg-[#08080d]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features"      className="text-text-secondary hover:text-text-primary transition-colors font-medium">Features</a>
            <a href="#pricing"       className="text-text-secondary hover:text-text-primary transition-colors font-medium">Pricing</a>
            <a href="#testimonials"  className="text-text-secondary hover:text-text-primary transition-colors font-medium">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"  className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium hidden sm:block">Sign in</Link>
            <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red hover:bg-red-500 text-white text-sm font-display font-semibold transition-all shadow-lg shadow-accent-red/20 hover:-translate-y-px active:scale-95">
              Start Free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent-red/5 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-48 left-1/4  w-80 h-80 bg-blue-500/4 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-red/25 bg-accent-red/8 text-accent-red text-[11px] font-black mb-8 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
            NOW IN BETA — FREE TO START
          </div>

          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-[72px] text-text-primary tracking-tight leading-[1.04] mb-6">
            Run your reselling<br />
            <span className="text-accent-red">like a business.</span>
          </h1>

          <p className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Track inventory, calculate profit, manage orders, and generate verified receipts — all in one place built for resellers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-accent-red hover:bg-red-500 text-white font-display font-bold text-base transition-all shadow-xl shadow-accent-red/25 hover:-translate-y-0.5 active:scale-95">
              Start Free — No card needed <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#14141e] hover:bg-[#1c1c28] text-text-primary font-display font-bold text-base transition-all border border-[#1c1c28] hover:border-[#2a2a3a]">
              View Demo
            </Link>
          </div>

          <p className="text-text-muted text-sm mt-5">No credit card required · Free plan forever · Setup in 30 seconds</p>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 pt-10 border-t border-[#1c1c28]">
            {[
              { value: "2,400+", label: "Active resellers" },
              { value: "$1.2M+", label: "Profit tracked" },
              { value: "48,000+",label: "Items logged" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display font-black text-2xl text-text-primary">{value}</div>
                <div className="text-xs text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Preview ── */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-[#1c1c28] overflow-hidden shadow-2xl shadow-black/50">
            {/* Browser chrome */}
            <div className="bg-[#0f0f17] border-b border-[#1c1c28] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              </div>
              <div className="flex-1 bg-[#14141e] rounded-md px-3 py-1 text-[11px] text-text-muted font-mono text-center max-w-xs mx-auto">
                app.reselleros.io/dashboard
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-[#08080d] p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { l:"Active Stock",  v:"24",     c:"border-blue-500/20 from-blue-500/8" },
                  { l:"Active Orders", v:"7",      c:"border-amber-500/20 from-amber-500/8" },
                  { l:"Revenue",       v:"$4,820", c:"border-emerald-500/20 from-emerald-500/8" },
                  { l:"Net Profit",    v:"$1,340", c:"border-accent-red/20 from-accent-red/8" },
                ].map(({ l, v, c }) => (
                  <div key={l} className={`bg-[#0f0f17] border rounded-xl p-3 sm:p-4 bg-gradient-to-br to-transparent ${c}`}>
                    <div className="text-[9px] font-display font-black text-text-muted uppercase tracking-widest mb-1.5">{l}</div>
                    <div className="text-lg sm:text-xl font-display font-black text-text-primary">{v}</div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
                  <div className="text-[11px] font-display font-bold text-text-secondary mb-3">Revenue & Profit — Last 6 months</div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[38,62,44,78,52,90,68].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                        <div className="w-full rounded-sm bg-blue-500/25" style={{ height: `${h * 0.55}%` }} />
                        <div className="w-full rounded-sm bg-accent-red/45" style={{ height: `${h * 0.32}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-text-muted mt-2">
                    {["Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=><span key={m}>{m}</span>)}
                  </div>
                </div>
                <div className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
                  <div className="text-[11px] font-display font-bold text-text-secondary mb-3">Inventory Status</div>
                  <div className="space-y-2">
                    {[
                      { l:"In Stock", v:"8",  w:"40%", c:"bg-blue-400" },
                      { l:"Listed",   v:"10", w:"50%", c:"bg-amber-400" },
                      { l:"Sold",     v:"4",  w:"20%", c:"bg-emerald-400" },
                      { l:"Shipped",  v:"2",  w:"10%", c:"bg-purple-400" },
                    ].map(({ l, v, w, c }) => (
                      <div key={l}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-text-secondary">{l}</span>
                          <span className="text-text-primary font-bold">{v}</span>
                        </div>
                        <div className="h-1 bg-[#1c1c28] rounded-full">
                          <div className={`h-full rounded-full ${c}`} style={{ width: w }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-display font-black text-accent-red uppercase tracking-widest mb-3">Features</div>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight mb-4">Everything you need to operate</h2>
            <p className="text-text-secondary text-base max-w-xl mx-auto">Stop using spreadsheets and DMs to track your business. ResellerOS gives you real tools built for how resellers work.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-[#0f0f17] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-display font-bold text-text-primary text-base mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-red/3 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-display font-black text-accent-red uppercase tracking-widest mb-3">Reviews</div>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight">Real resellers. Real results.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, handle, detail, avatar, stars }) => (
              <div key={name} className="bg-[#0f0f17] border border-[#1c1c28] rounded-2xl p-6 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(stars)].map((_,i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed flex-1 italic mb-5">"{quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#1c1c28]">
                  <div className="w-9 h-9 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red text-[11px] font-black shrink-0">{avatar}</div>
                  <div>
                    <div className="text-xs font-bold text-text-primary">{name} <span className="text-text-muted font-normal">{handle}</span></div>
                    <div className="text-[10px] text-text-muted">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-display font-black text-accent-red uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-text-primary tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-text-secondary text-base">Start free. Upgrade when you're doing real volume.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-7 flex flex-col ${plan.highlight ? "bg-accent-red/8 border-accent-red/30 shadow-xl shadow-accent-red/10" : "bg-[#0f0f17] border-[#1c1c28]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent-red text-white text-[10px] font-black tracking-wider shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-5">
                  <div className="font-display font-black text-text-primary text-lg">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mt-1 mb-2">
                    <span className="font-display font-black text-4xl text-text-primary">{plan.price}</span>
                    {plan.period && <span className="text-text-muted text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-text-secondary text-sm">{plan.desc}</p>
                </div>
                <div className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-text-primary">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm opacity-30">
                      <div className="w-3.5 h-0.5 bg-text-muted rounded shrink-0 ml-0.5" />
                      <span className="text-text-muted">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={plan.href} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-bold text-sm transition-all ${plan.highlight ? "bg-accent-red hover:bg-red-500 text-white shadow-lg shadow-accent-red/20" : "bg-[#14141e] hover:bg-[#1c1c28] text-text-primary border border-[#1c1c28] hover:border-[#2a2a3a]"}`}>
                  {plan.cta} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-text-muted text-sm mt-8">All paid plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl border border-accent-red/20 bg-gradient-to-br from-accent-red/10 via-accent-red/5 to-transparent p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-red/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-black text-4xl text-text-primary tracking-tight mb-4">Ready to run it like a business?</h2>
              <p className="text-text-secondary text-base mb-8 max-w-lg mx-auto">Join thousands of resellers who upgraded from spreadsheets to a real operating system.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent-red hover:bg-red-500 text-white font-display font-bold text-base transition-all shadow-xl shadow-accent-red/25 hover:-translate-y-0.5">
                Start Free Today <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1c1c28] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Logo />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <a href="#features"           className="hover:text-text-secondary transition-colors">Features</a>
            <a href="#pricing"            className="hover:text-text-secondary transition-colors">Pricing</a>
            <Link href="/login"           className="hover:text-text-secondary transition-colors">Login</Link>
            <Link href="/signup"          className="hover:text-text-secondary transition-colors">Sign Up</Link>
            <Link href="/receipts/verify" className="hover:text-text-secondary transition-colors">Verify Receipt</Link>
            <Link href="/terms"           className="hover:text-text-secondary transition-colors">Terms</Link>
            <Link href="/privacy"         className="hover:text-text-secondary transition-colors">Privacy</Link>
          </div>
          <div className="text-xs text-text-muted">© {new Date().getFullYear()} ResellerOS</div>
        </div>
      </footer>
    </div>
  );
}
