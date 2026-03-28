import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck, HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

  const faqs = [
    { q: "How do I file a claim?", a: "You can file a claim directly from your dashboard. Most claims are processed within 48 hours." },
    { q: "What documents do I need?", a: "Typically, you'll need a photo of the incident/report and your policy ID." },
    { q: "Can I cancel my policy any time?", a: "Yes, you can cancel your subscription from the My Policies section at any time." },
    { q: "Do you offer international coverage?", a: "Standard policies are domestic, but we offer international riders for most plans." }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">Contact <span style={{ color: 'var(--color-primary)' }}>Us</span></h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Have a question or need assistance? Reach out to our team—we are here to help 24/7.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Information & FAQ */}
          <div className="space-y-12">
            <div className="space-y-8 p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-6">Ways to Connect</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-primary)' }}><HiMail className="w-6 h-6" /></div>
                  <div><h3 className="font-semibold">Email</h3><p className="text-sm opacity-70 italic">support@smartsure.com</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}><HiPhone className="w-6 h-6" /></div>
                  <div><h3 className="font-semibold">Phone</h3><p className="text-sm opacity-70">+1 (800) 123-4567</p></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold px-4">Common Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-5 rounded-2xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                       <span className="text-primary">Q:</span> {faq.q}
                    </h4>
                    <p className="text-sm leading-relaxed opacity-70">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-[2rem] shadow-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-4">Send a Message</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 rounded-2xl text-sm outline-none border focus:border-primary transition-all" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-5 py-4 rounded-2xl text-sm outline-none border focus:border-primary transition-all" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Message</label>
              <textarea rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-5 py-4 rounded-2xl text-sm outline-none border focus:border-primary transition-all resize-none" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} placeholder="How can we help you?" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 shadow-md" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              {loading ? 'Sending Request...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>
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
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
