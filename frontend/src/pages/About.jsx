import { Link } from 'react-router-dom';
import { HiShieldCheck, HiUserGroup, HiGlobeAlt, HiTrendingUp } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">About <span style={{ color: 'var(--color-primary)' }}>SmartSure</span></h1>
          <p className="text-base md:text-lg max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            We are a technology-first insurance provider dedicated to making coverage accessible, understandable, and lightning-fast.
          </p>
        </motion.div>

        <section className="space-y-16">
          {/* Mission & Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                <HiGlobeAlt className="w-8 h-8" style={{ color: 'var(--color-primary)' }}/> Our Mission
              </h2>
              <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Our mission is to democratize insurance. We believe everyone deserves fair coverage without the traditional hurdles.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                By stripping away the bureaucracy and replacing it with AI-driven efficiency, we ensure you get protected when it matters most.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Our Story</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Founded in 2024 by a team of software engineers and insurance veterans, SmartSure was born out of frustration with legacy systems. We saw a world where filing a claim took weeks, and understood that it shouldn't be that way.
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Today, we serve millions across the globe, providing instant quotes and 48-hour claim processing.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-12">Our Core Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Transparency', desc: 'No hidden fees. No fine print jargon. Just clear policies.', color: 'var(--color-primary)' },
                { title: 'Innovation', desc: 'Leveraging AI and microservices for the ultimate user experience.', color: 'var(--color-accent)' },
                { title: 'Empathy', desc: 'We put people first, especially when they need to make a claim.', color: 'var(--color-success)' },
                { title: 'Security', desc: 'Your data is encrypted and protected with bank-grade standards.', color: 'var(--color-primary)' }
              ].map((v, i) => (
                <div key={i} className="p-6 rounded-2xl border text-left" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="h-1 w-12 rounded-full mb-4" style={{ backgroundColor: v.color }}></div>
                  <h4 className="font-bold mb-2">{v.title}</h4>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team/Tech Section */}
          <div className="p-10 rounded-[2.5rem] border border-primary/20 text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary-light), transparent 90%)' }}>
            <h3 className="text-2xl font-bold mb-4">Powered by Innovation</h3>
            <p className="max-w-2xl mx-auto mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Our platform is built on a resilient microservices architecture, ensuring 99.9% uptime and instant synchronization across all your devices.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 text-sm font-bold">Scalable Architecture</span>
              <span className="px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 text-sm font-bold">AI Claim Processing</span>
              <span className="px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 text-sm font-bold">Real-time Analytics</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HiShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-bold">SmartSure</span>
          </div>
          <p className="text-sm opacity-60">© 2026 SmartSure Insurance. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
