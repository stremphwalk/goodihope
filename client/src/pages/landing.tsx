import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Mic, FileText, Shield, Sparkles, Clock, Headset, Workflow } from "lucide-react";
import { useLocation } from "wouter";

// --- Brand ---
const Logo = ({ className = "h-8 w-auto" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg width="28" height="28" viewBox="0 0 64 64" className="rounded-xl shadow-sm">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect rx="14" width="64" height="64" fill="url(#g)" />
      <path d="M18 44l7-24h6l7 24h-5l-1.4-5h-7.2L23 44h-5zm10.1-10h5.8L33 26.7 28.1 34z" fill="white" />
      <rect x="40" y="16" width="6" height="20" rx="2" fill="white" opacity="0.75" />
    </svg>
    <span className="font-semibold tracking-tight text-xl">Arinote</span>
  </div>
);

const container = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ArinoteLanding() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/auth?mode=register");
  };

  const handleSignIn = () => {
    setLocation("/auth?mode=login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/50 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-sky-600 transition">Features</a>
            <a href="#how" className="hover:text-sky-600 transition">How it works</a>
            <a href="#pricing" className="hover:text-sky-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-sky-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:inline-flex" onClick={handleSignIn}>Sign in</Button>
            <Button className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-sm hover:from-cyan-500 hover:to-blue-700" onClick={handleGetStarted}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(60%_60%_at_50%_20%,#000_40%,transparent_100%)]">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[560px] w-[1200px] bg-cyan-200/40 blur-3xl rounded-full" />
          <div className="absolute top-16 left-1/3 h-72 w-72 bg-blue-200/40 blur-3xl rounded-full" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:pt-24 md:pb-16">
          <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-10 items-center">
            <div className="text-center md:text-left">
              <Badge className="mb-4 bg-sky-100 text-sky-700 border-sky-200">Built for clinicians</Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Document care <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">faster</span>.
              </h1>
              <p className="mt-4 text-slate-600 text-lg md:text-xl">
                Arinote is a modern medical documentation tool that turns your voice and clinical thinking into clean, structured notes—directly in your EHR.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700" onClick={handleGetStarted}>
                  Try it free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6">
                  Watch 90s demo
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center md:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> PHIPA & PIPEDA aligned</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Save 3–6 min/note</div>
              </div>
            </div>

            {/* Mockup */}
            <motion.div className="relative">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-cyan-200/40 to-blue-200/40 rounded-[2rem] blur-2xl" />
              <Card className="rounded-2xl shadow-xl border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-sky-600" /> Live Dictation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <p className="mb-2"><span className="font-medium text-slate-900">You:</span> Patient with dyspnea on exertion, past ILD, baseline monocyte count elevated...</p>
                    <p className="mb-2"><span className="font-medium text-sky-700">Arinote:</span> <em>Drafting HPI with ILD context. Flagging relevant biomarkers and prior PFTs.</em></p>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-sky-600"/> SOAP Note</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-1">
                          <p><span className="font-medium">S:</span> Dyspnea on exertion for 3 weeks...</p>
                          <p><span className="font-medium">O:</span> SpO₂ 95%, bibasilar crackles, HRCT pending...</p>
                          <p><span className="font-medium">A:</span> ILD flare vs infection; consider steroids if...</p>
                          <p><span className="font-medium">P:</span> HRCT, labs incl. CRP; f/u 2 weeks...</p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2"><Workflow className="h-4 w-4 text-sky-600"/> Smart Phrases</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center gap-2"><Badge variant="secondary">.ild-followup</Badge> <span>Pre-fills labs, imaging, and next steps.</span></div>
                          <div className="flex items-center gap-2"><Badge variant="secondary">.copd-exac</Badge> <span>Auto-inserts discharge meds & education.</span></div>
                          <div className="flex items-center gap-2"><Badge variant="secondary">.admit-hpi</Badge> <span>Structured HPI scaffold in seconds.</span></div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          {[
            "University Health Network",
            "CHUS Sherbrooke",
            "Montreal General",
            "Saskatoon Health",
            "Sunnybrook",
          ].map((n) => (
            <span key={n} className="text-slate-500 text-sm md:text-base">{n}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Less typing. More medicine.</h2>
          <p className="mt-3 text-slate-600">Purpose-built for inpatient teams and outpatient clinics. Fast, safe, and EHR-friendly.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Mic className="h-5 w-5" />, title: "Realtime dictation", desc: "Low-latency speech-to-text with medical vocabulary in English & French.",
            },
            {
              icon: <Sparkles className="h-5 w-5" />, title: "Smart phrases", desc: "Dot-phrases expand into structured notes tailored to your service.",
            },
            {
              icon: <FileText className="h-5 w-5" />, title: "Structured output", desc: "SOAP, consults, and discharge summaries that read like you wrote them.",
            },
            {
              icon: <Shield className="h-5 w-5" />, title: "Privacy-first", desc: "End-to-end encryption in transit, PHIPA & PIPEDA aligned by design.",
            },
            {
              icon: <Clock className="h-5 w-5" />, title: "Lightning fast", desc: "Designed to shave minutes off every note without losing nuance.",
            },
            {
              icon: <Headset className="h-5 w-5" />, title: "Clinical support", desc: "Built with residents in mind: shortcuts, templates, and guardrails.",
            },
          ].map((f) => (
            <Card key={f.title} className="rounded-2xl border-slate-200">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-sky-700">
                  {f.icon}
                </div>
                <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Works with your existing workflow</h3>
            <p className="mt-3 text-slate-600">Open Arinote, press record, and speak naturally. Use dot-phrases to expand sections, then paste directly into your EHR—or use our embed where supported.</p>

            <ul className="mt-6 space-y-3 text-slate-700">
              {[
                "Press ⌘K to open command palette",
                "Use .admit-hpi to scaffold your note",
                "Say 'insert vitals' to pull your last set",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-sky-600" /> {t}</li>
              ))}
            </ul>

            <div className="mt-6 flex gap-2">
              <Input placeholder="Your email" className="h-11" />
              <Button className="h-11 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700">Join the waitlist</Button>
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-xl">
            <CardHeader>
              <CardTitle>90-second flow</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid sm:grid-cols-3 gap-3 text-sm">
                {[
                  { step: "1", label: "Record" },
                  { step: "2", label: "Refine" },
                  { step: "3", label: "Paste" },
                ].map((s) => (
                  <li key={s.step} className="p-4 rounded-xl border bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">{s.step}</span>
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <p className="mt-2 text-slate-600">{s.label === "Record" && "Speak as you examine—Arinote transcribes instantly."}
                    {s.label === "Refine" && "Insert dot-phrases, add details, and validate facts."}
                    {s.label === "Paste" && "Drop it into your EHR with clean formatting."}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, fair pricing</h3>
          <p className="mt-3 text-slate-600">Start free. Upgrade when Arinote saves you real time.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[{
            name: "Resident", price: "$0", blurb: "For trainees and testing.", features: ["Unlimited drafts", "Core dot-phrases", "Email support"], cta: "Start free" },
            { name: "Clinician", price: "$19/mo", blurb: "Everything you need, daily.", features: ["Realtime dictation", "Custom phrases", "Export to EHR"], cta: "Start 14-day trial", highlight: true },
            { name: "Team", price: "$49/user", blurb: "For services & clinics.", features: ["Shared templates", "Admin console", "Priority support"], cta: "Contact sales" },
          ].map((tier) => (
            <Card key={tier.name} className={`rounded-2xl border-slate-200 ${tier.highlight ? "ring-2 ring-sky-500" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  {tier.highlight && (
                    <Badge className="bg-sky-100 text-sky-700 border-sky-200">Popular</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tier.price}</div>
                <p className="text-slate-600 mt-1">{tier.blurb}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-sky-600" /> {f}</li>
                  ))}
                </ul>
                <Button 
                  className="mt-6 w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700"
                  onClick={tier.cta === "Start free" || tier.cta === "Start 14-day trial" ? handleGetStarted : undefined}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "Arinote feels like a co-resident who never gets tired of notes.", author: "PGY-1, Internal Medicine",
            },
            {
              quote: "The dot-phrases are gold. Our discharge summaries improved overnight.", author: "Hospitalist, Montreal",
            },
            {
              quote: "Finally a dictation tool that understands French medical terms.", author: "Pulmonology Fellow",
            },
          ].map((t) => (
            <Card key={t.quote} className="rounded-2xl border-slate-200">
              <CardContent className="pt-6 text-slate-700">
                <p className="text-lg">"{t.quote}"</p>
                <p className="mt-4 text-sm text-slate-500">{t.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-10 md:py-20">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">Frequently asked questions</h3>
        <Accordion type="single" collapsible className="mt-6">
          {[
            {
              q: "Is Arinote compliant with PHIPA / PIPEDA?",
              a: "Arinote is designed with Canadian privacy in mind. Data in transit is encrypted and we avoid storing PHI unless explicitly configured by your institution.",
            },
            {
              q: "Does it work with my EHR?",
              a: "Yes. You can paste clean, structured notes anywhere. For supported EHRs, we also provide embedded components.",
            },
            {
              q: "Which languages are supported?",
              a: "English and French at launch—optimized for medical vocabulary.",
            },
          ].map((i, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left">{i.q}</AccordionTrigger>
              <AccordionContent>{i.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-10 md:p-12">
          <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(70%_70%_at_30%_30%,#000,transparent)]">
            <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="text-2xl md:text-3xl font-semibold">Write less. Care more.</h4>
              <p className="mt-2 text-white/90">Join clinicians using Arinote to move faster without compromising quality.</p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <Button variant="secondary" className="h-11 px-6">Book a demo</Button>
              <Button className="h-11 px-6 bg-white text-slate-900 hover:bg-slate-100" onClick={handleGetStarted}>Start free <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <Logo className="h-7" />
            <p className="mt-3 text-slate-600">A faster, cleaner way to document care.</p>
          </div>
          <div>
            <div className="font-medium mb-3">Product</div>
            <ul className="space-y-2 text-slate-600">
              <li><a className="hover:text-sky-600" href="#features">Features</a></li>
              <li><a className="hover:text-sky-600" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-sky-600" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Company</div>
            <ul className="space-y-2 text-slate-600">
              <li><a className="hover:text-sky-600" href="#">About</a></li>
              <li><a className="hover:text-sky-600" href="#">Security</a></li>
              <li><a className="hover:text-sky-600" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Stay in touch</div>
            <p className="text-slate-600 mb-3">Get product updates and early access.</p>
            <div className="flex gap-2">
              <Input placeholder="Email address" />
              <Button className="bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700">Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} Arinote. All rights reserved.</div>
      </footer>
    </div>
  );
}