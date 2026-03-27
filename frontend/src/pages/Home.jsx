import { Link } from 'react-router-dom';
import { HiShieldCheck, HiArrowRight, HiCheckCircle, HiLightningBolt, HiPhone } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function Home() {
  const features = [
    {
      icon: <HiShieldCheck className="w-6 h-6" />,
      title: "Comprehensive Coverage",
      description: "From auto to health, we provide end-to-end insurance policies tailored to your exact needs."
    },
    {
      icon: <HiLightningBolt className="w-6 h-6" />,
      title: "Fast Claims Process",
      description: "Submit claims online and get them processed within 48 hours. No paperwork, no hassle."
    },
    {
      icon: <HiPhone className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to assist you with any inquiries."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Public Header Component built-in for simplicity */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b"
              style={{ background: 'rgba(var(--color-surface-rgb), 0.8)', borderColor: 'var(--color-border)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            <HiShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Smart<span style={{ color: 'var(--color-primary)' }}>Sure</span></span>
        </Link>
        <div className="hidden md:flex gap-6 items-center font-medium">
          <Link to="/" className="hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Home</Link>
          <Link to="/about" className="hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>About</Link>
          <Link to="/contact" className="hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Contact</Link>
          <Link to="/terms" className="hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Terms</Link>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2 font-semibold transition-colors rounded-xl"
                style={{ color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}>
            Login
          </Link>
          <Link to="/register" className="px-5 py-2 font-semibold text-white transition-transform hover:scale-105 rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ 
          background: 'radial-gradient(circle at 50% -20%, var(--color-primary-light) 0%, transparent 50%)',
          opacity: 0.15 
        }}></div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="z-10 max-w-4xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Insurance Made <span style={{ color: 'var(--color-primary)' }}>Simple</span> <br className="hidden md:block"/> and Transparent
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            SmartSure provides intelligent, comprehensive coverage that adapts to your life. Secure your future with confidence and crystal-clear policies.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register" className="flex items-center gap-2 px-8 py-4 font-bold text-white transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              Get Started Now <HiArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/about" className="flex items-center gap-2 px-8 py-4 font-bold transition-all rounded-2xl"
                  style={{ color: 'var(--color-text)', background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>
              Learn More
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="py-24 px-6 relative z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SmartSure?</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>We leverage technology to bring you the best insurance experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                   className="p-8 rounded-3xl transition-shadow hover:shadow-lg"
                   style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                     style={{ background: 'var(--color-primary-light)', color: 'var(--color-text)' }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)' }} className="leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 text-center" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>© 2026 SmartSure Insurance. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4 opacity-75 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
          <Link to="/contact" className="hover:underline">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
}
