import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../core/services/api';
import { HiShieldCheck, HiMail, HiLockClosed, HiCheckCircle, HiChevronLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (password.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character (@$!%*?&)";
    
    return null;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPasswordSendOtp(email);
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data || 'User not found';
      toast.error(typeof errorMsg === 'string' ? errorMsg : (errorMsg.message || 'User not found'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) return toast.error('Please fill in all fields');
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) return toast.error(passwordError);

    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await authAPI.forgotPasswordVerifyOtp(email, otp);
      await authAPI.resetPassword({ email, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data || 'Invalid OTP or session expired';
      toast.error(typeof errorMsg === 'string' ? errorMsg : (errorMsg.message || 'Invalid OTP or session expired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in stager-children">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
              <HiShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Smart<span style={{ color: 'var(--color-primary)' }}>Sure</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Recover <span style={{ color: 'var(--color-primary)' }}>Password</span></h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {step === 1 ? 'Enter your email to receive a reset code' : `Enter the OTP sent to ${email}`}
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl shadow-xl"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6 stager-children">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiCheckCircle className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 tracking-[0.2em] font-mono text-center"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Resetting Password...' : 'Reset My Password'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
             <Link to="/login" className="text-sm font-semibold flex items-center justify-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
               <HiChevronLeft className="w-4 h-4" /> Back to Sign In
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
