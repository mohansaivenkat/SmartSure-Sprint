import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI } from '../../core/services/api';
import { HiShieldCheck, HiMail, HiLockClosed, HiUser, HiPhone, HiLocationMarker, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const detailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string()
    .min(12, 'At least 12 characters')
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One number')
    .regex(/[^A-Za-z0-9]/, 'One special symbol'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type DetailsFormValues = z.infer<typeof detailsSchema>;

export default function Register() {
  const [step, setStep] = useState(1);
  const [emailValue, setEmailValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1 Form
  const { register: regEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2 Form
  const { register: regOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  // Step 3 Form
  const { register: regDetails, handleSubmit: handleDetailsSubmit, formState: { errors: detailsErrors } } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
  });

  const onSendOtp = async (data: EmailFormValues) => {
    setLoading(true);
    try {
      await authAPI.sendOtp(data.email);
      setEmailValue(data.email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async (data: OtpFormValues) => {
    setLoading(true);
    try {
      await authAPI.verifyOtp(emailValue, data.otp);
      toast.success('OTP verified!');
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const onRegister = async (data: DetailsFormValues) => {
    setLoading(true);
    try {
      await authAPI.register({ ...data, email: emailValue });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data || 'Registration failed');
    } finally { setLoading(false); }
  };

  const getPasswordErrors = () => {
    if (!detailsErrors.password) return [];
    // Just returning the simple error message or we can do more complex handling.
    // React Hook Form handles multiple errors if criteriaMode: 'all' is set, but single by default.
    // For visual similarity with old one:
    return [detailsErrors.password.message as string];
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
            <form onSubmit={handleEmailSubmit(onSendOtp)} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    {...regEmail('email')}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties}
                  />
                </div>
                {emailErrors.email && <p className="text-red-500 text-xs mt-1">{emailErrors.email.message}</p>}
              </div>
              <button
                id="send-otp-btn" type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Enter OTP</label>
                <input
                  id="otp-input"
                  type="text"
                  {...regOtp('otp')}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-center tracking-[0.5em] outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties}
                />
                {otpErrors.otp && <p className="text-red-500 text-xs mt-1 text-center">{otpErrors.otp.message}</p>}
              </div>
              <button
                id="verify-otp-btn" type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => onSendOtp({ email: emailValue })} className="w-full text-center text-sm" style={{ color: 'var(--color-primary)' }}>
                Resend OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleDetailsSubmit(onRegister)} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input id="register-name" type="text" {...regDetails('name')} placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties} />
                </div>
                {detailsErrors.name && <p className="text-red-500 text-xs mt-1">{detailsErrors.name.message}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input id="register-password" type={showPassword ? 'text' : 'password'} {...regDetails('password')}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ color: 'var(--color-text-secondary)' }}>
                      {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {detailsErrors.password && (
                  <div className="mt-2 text-xs text-red-500 space-y-1">
                    <p className="font-semibold">Password Error:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {getPasswordErrors().map((err, i) => <li key={i}>{err}</li>)}
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
                  <input id="register-phone" type="tel" {...regDetails('phone')} placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <HiLocationMarker className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <textarea id="register-address" {...regDetails('address')}
                    placeholder="Your address" rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' } as React.CSSProperties} />
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
