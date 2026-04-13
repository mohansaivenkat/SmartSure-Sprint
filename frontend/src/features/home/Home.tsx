import { Link } from 'react-router-dom';
import { HiShieldCheck, HiArrowRight, HiLightningBolt, HiPhone, HiTruck, HiHeart, HiHome } from 'react-icons/hi';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ 
          background: 'radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--color-primary-light), transparent 85%), transparent 50%)'
        }}></div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="z-10 max-w-4xl space-y-8"
        >
          <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Insurance Made <span style={{ color: 'var(--color-primary)' }}>Simple</span> <br className="hidden md:block"/> and Transparent
          </motion.h1>
          <motion.p variants={itemVariants} className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            SmartSure provides intelligent, comprehensive coverage that adapts to your life. Secure your future with confidence and crystal-clear policies.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register" className="flex items-center gap-2 px-8 py-4 font-bold text-white transition-all hover:shadow-2xl hover:-translate-y-1 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              Get Started Now <HiArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/about" className="flex items-center gap-2 px-8 py-4 font-bold transition-all hover:translate-y-[-2px] rounded-2xl shadow-sm"
                  style={{ color: 'var(--color-text)', background: 'var(--color-surface)' }}>
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Why Choose SmartSure */}
      <section className="py-24 px-6 relative z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl font-bold mb-4">Why Choose SmartSure?</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>We leverage technology to bring you the best insurance experience.</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}
                   className="p-8 rounded-3xl transition-all hover:shadow-2xl hover:-translate-y-2 group bg-bg shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform"
                     style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)' }} className="leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Products */}
      <section className="py-20 px-6 bg-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-3">Our Signature Products</h2>
            <p className="text-sm opacity-70">Comprehensive coverage tailored to every aspect of your life.</p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { name: 'Auto Insurance', desc: 'Secure your journey with road-side assistance.', icon: <HiTruck className="w-8 h-8" /> },
              { name: 'Health Care', desc: 'Premium medical coverage for your entire family.', icon: <HiHeart className="w-8 h-8" /> },
              { name: 'Life Security', desc: 'Protect your loved ones with long-term benefits.', icon: <HiShieldCheck className="w-8 h-8" /> },
              { name: 'Home Shield', desc: 'Safe-guard your property against any disaster.', icon: <HiHome className="w-8 h-8" /> }
            ].map((p, i) => (
              <motion.div key={i} variants={itemVariants} 
                   className="p-6 rounded-2xl transition-all bg-surface hover:shadow-lg shadow-sm">
                <div className="mb-4 text-primary">{p.icon}</div>
                <h4 className="font-bold mb-2 text-base">{p.name}</h4>
                <p className="text-xs text-text-secondary">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center">How It Works</h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12 text-center relative"
          >
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5" style={{ backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
            {[
              { step: '01', title: 'Choose Plan', desc: 'Browse our curated policies and select the one that fits you.' },
              { step: '02', title: 'Get Quote', desc: 'Instant pricing with no hidden costs or long applications.' },
              { step: '03', title: 'Fast Claim', desc: 'Digital processing means you get results in under 48 hours.' }
            ].map((s, i) => (
              <motion.div key={i} variants={itemVariants} className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-6 shadow-md border-4"
                     style={{ backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-bg)' }}>
                  {s.step}
                </div>
                <h4 className="font-bold text-base mb-2">{s.title}</h4>
                <p className="text-xs px-4 text-text-secondary">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 mt-auto bg-surface">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HiShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-bold">SmartSure</span>
          </div>
          <p className="text-xs opacity-60">© 2026 SmartSure Insurance. All rights reserved.</p>
          <div className="flex gap-6 text-xs font-medium">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
