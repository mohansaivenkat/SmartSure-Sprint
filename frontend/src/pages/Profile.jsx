import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { HiUser, HiMail, HiPhone, HiLocationMarker, HiCheckCircle, HiPencil, HiShieldCheck, HiBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ── Animation variants ──────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 300, damping: 28 },
  }),
};

// ── Floating orb background decoration ─────────────────────────────
function FloatingOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      {[
        { size: 320, top: '-80px', left: '-100px', delay: 0, opacity: 0.06 },
        { size: 220, top: '40%',   right: '-60px', delay: 1.2, opacity: 0.05 },
        { size: 160, bottom: '10%', left: '30%',  delay: 0.6, opacity: 0.04 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [orb.opacity * 0.6, orb.opacity, orb.opacity * 0.6],
          }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
          className="absolute rounded-full"
          style={{
            width: orb.size, height: orb.size,
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
            background: 'radial-gradient(circle, var(--color-primary), transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      ))}
    </div>
  );
}

// ── Avatar with 3-D tilt effect ────────────────────────────────────
function TiltAvatar({ initial }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-40, 40], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-40, 40], [-12, 12]), { stiffness: 200, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 600 }}
      className="relative mx-auto mb-5 cursor-default select-none group"
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div
        className="relative w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl z-10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #818cf8))' }}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
        <HiUser className="w-10 h-10 relative z-10" />
      </div>
      {/* Verified badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 400, damping: 18 }}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-20"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <HiBadgeCheck className="w-5 h-5 text-white" />
      </motion.div>
    </motion.div>
  );
}

// ── Stat chip ──────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, delay }) {
  return (
    <motion.div
      variants={fieldVariants}
      custom={delay}
      className="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--color-primary)20, var(--color-bg))' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 truncate" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{value || '—'}</p>
      </div>
    </motion.div>
  );
}

// ── Animated input field ───────────────────────────────────────────
function AnimatedField({ label, icon: Icon, children, index }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      variants={fieldVariants}
      custom={index}
      className="space-y-2"
    >
      <label
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
        {label}
      </label>
      <motion.div
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="relative"
      >
        {/* Animated focus glow */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 rounded-xl pointer-events-none z-0"
              style={{
                boxShadow: '0 0 0 3px var(--color-primary)30',
                borderRadius: '12px',
              }}
            />
          )}
        </AnimatePresence>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Admin Guard: Don't show profile for admins
  if (user?.role === 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
          <HiShieldCheck className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text)' }}>Access Restricted</h2>
        <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Admin accounts are managed through the centralized administration dashboard. Profile modifications for administrative users are disabled for security.
        </p>
      </div>
    );
  }

  const initial = (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser, user.token);
      setSaved(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'relative z-10 w-full px-4 py-3 rounded-xl outline-none text-sm font-medium transition-colors duration-200';
  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6">
      <FloatingOrbs />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">

          {/* ── Page Title ── */}
          <motion.div variants={cardVariants} className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #818cf8))' }}
              whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
              transition={{ duration: 0.5 }}
            >
              <HiUser className="w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                Your Profile
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Manage your personal details and contact information
              </p>
            </div>
          </motion.div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* ── Left: Identity Card ── */}
            <motion.div variants={cardVariants} className="md:col-span-1 space-y-4">

              {/* Avatar Card */}
              <div
                className="p-6 rounded-3xl border relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {/* Decorative mesh top-right */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--color-primary)15, transparent 70%)',
                    filter: 'blur(24px)',
                  }}
                />

                <div className="text-center relative z-10">
                  <TiltAvatar initial={initial} />

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-black text-lg tracking-tight mt-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {user?.name || 'Anonymous'}
                  </motion.h2>

                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
                    className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
                    style={{
                      backgroundColor: 'var(--color-primary)18',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {user?.role || 'User'}
                  </motion.span>
                </div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="border-t mt-5 mb-4"
                  style={{ borderColor: 'var(--color-border)' }}
                />

                {/* Email row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <HiMail className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="truncate text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {user?.email}
                  </span>
                </motion.div>
              </div>

              {/* Account info chips */}
              <motion.div variants={cardVariants} className="space-y-2">
                <StatChip icon={HiShieldCheck} label="Account Status" value="Verified" delay={0} />
                <StatChip icon={HiPhone}       label="Phone"         value={formData.phone || user?.phone} delay={1} />
                <StatChip icon={HiLocationMarker} label="Address"   value={formData.address || user?.address} delay={2} />
              </motion.div>
            </motion.div>

            {/* ── Right: Edit Form ── */}
            <motion.div variants={cardVariants} className="md:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-3xl border relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {/* Decorative orb inside form */}
                <div
                  className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--color-primary)10, transparent 70%)',
                    filter: 'blur(32px)',
                  }}
                />

                {/* Form header */}
                <motion.div
                  variants={fieldVariants}
                  custom={0}
                  className="flex items-center gap-3 mb-7"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)18' }}
                  >
                    <HiPencil className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h2 className="font-black text-base" style={{ color: 'var(--color-text)' }}>Edit Details</h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Changes are saved to your account instantly
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={pageVariants} className="space-y-5 relative z-10">
                  {/* Name + Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <AnimatedField label="Full Name" icon={HiUser} index={1}>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleChange('name')}
                        placeholder="Your full name"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </AnimatedField>

                    <AnimatedField label="Phone Number" icon={HiPhone} index={2}>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={handleChange('phone')}
                        placeholder="+91 98765 43210"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </AnimatedField>
                  </div>

                  {/* Address */}
                  <AnimatedField label="Address" icon={HiLocationMarker} index={3}>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={handleChange('address')}
                      placeholder="Your full address..."
                      className={`${inputClass} resize-none`}
                      style={inputStyle}
                    />
                  </AnimatedField>

                  {/* Email (read-only) */}
                  <AnimatedField label="Email Address" icon={HiMail} index={4}>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className={`${inputClass} cursor-not-allowed opacity-60`}
                      style={{ ...inputStyle, borderStyle: 'dashed' }}
                    />
                    <p className="mt-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Email cannot be changed after registration.
                    </p>
                  </AnimatedField>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.55, duration: 0.45 }}
                  className="border-t my-7"
                  style={{ borderColor: 'var(--color-border)' }}
                />

                {/* Submit button */}
                <motion.div
                  variants={fieldVariants}
                  custom={5}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
                >
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Your information is encrypted and never shared.
                  </p>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #818cf8))' }}
                  >
                    {/* Shimmer sweep */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        transform: 'skewX(-20deg)',
                      }}
                    />

                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                          />
                          Saving...
                        </motion.span>
                      ) : saved ? (
                        <motion.span
                          key="saved"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <HiCheckCircle className="w-5 h-5" /> Saved!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="default"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <HiCheckCircle className="w-5 h-5" /> Save Changes
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}