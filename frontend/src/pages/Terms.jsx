import { Link } from 'react-router-dom';
import { HiShieldCheck, HiOutlineDocumentText } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function Terms() {
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
          <Link to="/" className="px-5 py-2 font-semibold transition-colors rounded-xl flex items-center gap-2"
                style={{ color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 pb-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4">
            <HiOutlineDocumentText className="w-10 h-10" style={{ color: 'var(--color-primary)' }}/> Terms & Conditions
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Last updated: March 2026
          </p>
        </motion.div>

        <section className="space-y-12 prose prose-lg" style={{ color: 'var(--color-text)' }}>
          <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              By accessing and using SmartSure's platform and services, you accept and agree to be bound by the terms and provisions of this agreement. Any participation in this platform will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this platform.
            </p>
          </div>

          <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4">2. User Accounts and Responsibilities</h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our platform.
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-primary" style={{ color: 'var(--color-text-secondary)' }}>
              <li>You are responsible for safeguarding your password and OTPs.</li>
              <li>You must not disclose your password to any third party.</li>
              <li>You must notify us immediately upon becoming aware of any breach of security.</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4">3. Data Privacy and Handling</h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We highly value your privacy. SmartSure will only handle user data strictly in accordance with our Privacy Policy. Personal details and sensitive claim documentation submitted to SmartSure will be encrypted during transmission and rest. We do not sell your personal data to non-affiliated third parties.
            </p>
          </div>

          <div className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4">4. Claims Processing Limitations</h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Insurance coverage is subject to specific limitations and exclusions. SmartSure determines claim validity strictly based on policy agreements and the provided evidence. We reserve the right to reject partial submissions or those found to be fraudulent.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
