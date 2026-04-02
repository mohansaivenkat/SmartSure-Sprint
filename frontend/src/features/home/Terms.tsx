import { Link } from 'react-router-dom';
import { HiShieldCheck, HiOutlineDocumentText } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 pb-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-4">
            <HiOutlineDocumentText className="w-10 h-10" style={{ color: 'var(--color-primary)' }}/> Terms & Conditions
          </h1>
          <p className="text-sm opacity-60">
            Last updated: March 2026 • Version 2.1
          </p>
        </motion.div>

        <section className="space-y-10" style={{ color: 'var(--color-text)' }}>
          {[
            { 
              title: "1. Acceptance of Terms", 
              content: "By accessing and using SmartSure's platform and services, you accept and agree to be bound by the terms and provisions of this agreement. Any participation in this platform will constitute acceptance of this agreement." 
            },
            { 
              title: "2. User Conduct", 
              content: "Users agree not to use the service for any unlawful purposes. You are responsible for all activities that occur under your account, including the accuracy of claim data submitted.",
              list: ["You must be 18+ to hold a policy.", "Unauthorized access attempts are strictly prohibited.", "Fraudulent claims will lead to immediate termination."]
            },
            { 
              title: "3. Payments & Subscriptions", 
              content: "Subscription fees are billed monthly or annually. Failure to pay on time may result in a temporary suspension of coverage. We provide a 7-day grace period for late payments." 
            },
            { 
              title: "4. Claim Eligibility", 
              content: "SmartSure reserves the right to verify all documentation. Claims must be submitted within 30 days of the incident to be considered for full compensation." 
            },
            { 
              title: "5. Privacy & Data Protection", 
              content: "Your privacy is paramount. We use industry-standard encryption to protect your personal and health information. Please refer to our Privacy Policy for full details on data handling." 
            },
            { 
              title: "6. Limitation of Liability", 
              content: "SmartSure is not liable for indirect, incidental, or consequential damages resulting from the use or inability to use our services beyond the total policy value." 
            }
          ].map((section, idx) => (
            <div key={idx} className="p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-4">{section.title}</h2>
              <p className="leading-relaxed opacity-80 text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {section.content}
              </p>
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 text-sm opacity-70">
                  {section.list.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
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
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
