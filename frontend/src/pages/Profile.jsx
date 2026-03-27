import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { HiUser, HiMail, HiPhone, HiLocationMarker, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      // Update local storage and context
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser, user.token);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl"
               style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            <HiUser className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Manage your personal details and contact info</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="p-6 rounded-3xl space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
               <div className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold"
                       style={{ background: 'var(--color-primary)' }}>
                    {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="font-bold text-lg">{user?.name}</h2>
                  <p className="text-sm px-3 py-1 rounded-full inline-block mt-1" style={{ backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}>{user?.role}</p>
               </div>
               <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                 <div className="flex items-center gap-2 text-sm">
                   <HiMail className="w-4 h-4" style={{ color: 'var(--color-primary)' }}/>
                   <span style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="p-8 rounded-3xl space-y-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 resize-none"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all transform hover:-translate-y-1 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {loading ? 'Saving...' : <><HiCheckCircle className="w-5 h-5"/> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
