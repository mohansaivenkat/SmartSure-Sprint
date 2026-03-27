import { Link } from 'react-router-dom';
import { HiShieldCheck, HiUserGroup, HiGlobeAlt, HiTrendingUp } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Mini Public Header */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b"
              style={{ background: 'rgba(var(--color-surface-rgb), 0.8)', borderColor: 'var(--color-border)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            <HiShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Smart<span style={{ color: 'var(--color-primary)' }}>Sure</span></span>
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="px-5 py-2 font-semibold transition-colors rounded-xl"
                style={{ color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">About <span style={{ color: 'var(--color-primary)' }}>SmartSure</span></h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-secondary)' }}>
            Redefining insurance for the modern age with transparency, technology, and trust.
          </p>
        </motion.div>

        <section className="space-y-12">
          <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4">
              <HiGlobeAlt className="w-8 h-8" style={{ color: 'var(--color-primary)' }}/> Our Mission
            </h2>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Our mission is to democratize insurance. We believe that everyone deserves clear, comprehensible, and fair coverage. By leveraging the latest in microservices Architecture and seamless user interfaces, we aim to strip away the bureaucracy and replace it with empathy and efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="flex items-center gap-3 text-2xl font-bold mb-4">
                <HiUserGroup className="w-8 h-8" style={{ color: 'var(--color-accent)' }}/> Who We Are
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Founded by industry veterans and tech enthusiasts, SmartSure brings together expertise from both worlds to deliver an insurance platform that actually feels like it belongs in the 21st century.
              </p>
            </div>
            <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="flex items-center gap-3 text-2xl font-bold mb-4">
                <HiTrendingUp className="w-8 h-8" style={{ color: 'var(--color-success)' }}/> The Future
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                We continuously evolve our platform, utilizing real-time analytics and user feedback to ensure our policies offer the maximum benefit and minimum friction when you need them most.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
