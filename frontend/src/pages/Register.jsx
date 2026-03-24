import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { HiShieldCheck, HiMail, HiLockClosed, HiUser, HiPhone, HiLocationMarker, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Register() {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: details
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordErrors = (pwd) => {
    const errors = [];
    if (pwd.length < 12) errors.push('At least 12 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('One special symbol');
    return errors;
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSendOtp = async () => {
    if (!form.email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.sendOtp(form.email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { toast.error('Please enter the OTP'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(form.email, otp);
      toast.success('OTP verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.password) { toast.error('Please fill in all required fields'); return; }
    
    const pwdErrors = getPasswordErrors(form.password);
    if (pwdErrors.length > 0) {
      toast.error('Please fix password requirements');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Registration failed');
    } finally { setLoading(false); }
  };

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              backgroundColor: step >= s ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: step >= s ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {s}
          </div>
          {s < 3 && <div className="w-8 h-0.5 rounded" style={{ backgroundColor: step > s ? 'var(--color-primary)' : 'var(--color-border)' }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}>
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <HiShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join SmartSure</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Create your account and start managing your insurance policies with our state-of-the-art platform.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
              <HiShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>SmartSure</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Create Account</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {step === 1 ? 'Enter your email to get started' : step === 2 ? 'Verify your email address' : 'Complete your profile'}
          </p>

          {stepIndicator}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    id="register-email"
                    type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
              <button
                id="send-otp-btn" onClick={handleSendOtp} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Enter OTP</label>
                <input
                  id="otp-input"
                  type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-center tracking-[0.5em] outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <button
                id="verify-otp-btn" onClick={handleVerifyOtp} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button onClick={handleSendOtp} className="w-full text-center text-sm" style={{ color: 'var(--color-primary)' }}>
                Resend OTP
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input id="register-name" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input id="register-password" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={(e) => update('password', e.target.value)} placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ color: 'var(--color-text-secondary)' }}>
                      {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {form.password && getPasswordErrors(form.password).length > 0 && (
                  <div className="mt-2 text-xs text-red-500 space-y-1">
                    <p className="font-semibold">Password must contain:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {getPasswordErrors(form.password).map(err => <li key={err}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiPhone className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input id="register-phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <HiLocationMarker className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <textarea id="register-address" value={form.address} onChange={(e) => update('address', e.target.value)}
                    placeholder="Your address" rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                </div>
              </div>
              <button id="register-submit" type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-sm text-center mt-6" style={{ color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
