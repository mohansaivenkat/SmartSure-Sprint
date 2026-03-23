import { useState, useEffect } from 'react';
import { policyAPI, adminAPI } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiDocumentText, HiSearch } from 'react-icons/hi';
import { PageHeader, Card, Button, Modal, Input, Textarea, Select } from '../../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../../components/UI';
import toast from 'react-hot-toast';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);


  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form, setForm] = useState({
    policyName: '', description: '', policyTypeId: '', premiumAmount: '', coverageAmount: '', durationInMonths: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policiesRes, typesRes] = await Promise.all([
        policyAPI.getAllPolicies(),
        policyAPI.getPolicyTypes(),
      ]);
      setPolicies(policiesRes.data);
      setPolicyTypes(typesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingPolicy(null);
    setForm({ policyName: '', description: '', policyTypeId: '', premiumAmount: '', coverageAmount: '', durationInMonths: '' });
    setShowModal(true);
  };

  const openEdit = (policy) => {
    setEditingPolicy(policy);
    setForm({
      policyName: policy.policyName || '',
      description: policy.description || '',
      policyTypeId: '',
      premiumAmount: policy.premiumAmount || '',
      coverageAmount: policy.coverageAmount || '',
      durationInMonths: policy.durationInMonths || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.policyName || !form.premiumAmount || !form.coverageAmount || !form.durationInMonths) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        policyName: form.policyName,
        description: form.description,
        policyTypeId: Number(form.policyTypeId) || 1,
        premiumAmount: Number(form.premiumAmount),
        coverageAmount: Number(form.coverageAmount),
        durationInMonths: Number(form.durationInMonths),
      };

      if (editingPolicy) {
        await adminAPI.updatePolicy(editingPolicy.id, data);
        toast.success('Policy updated successfully!');
      } else {
        await adminAPI.createPolicy(data);
        toast.success('Policy created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await adminAPI.deletePolicy(id);
      toast.success('Policy deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  };

  const filtered = policies.filter((p) =>
    p.policyName?.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPolicies = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Manage Policies"
        subtitle="Create, update, and manage insurance policy products"
        action={<Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Create Policy</Button>}
      />

      <div className="relative mb-6">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search policies..."
          className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HiDocumentText} title="No Policies" description="Create your first policy product"
          action={<Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Create Policy</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['ID', 'Policy Name', 'Premium', 'Coverage', 'Duration', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPolicies.map((policy) => (
                <tr key={policy.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-text)' }}>#{policy.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{policy.policyName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{policy.description?.substring(0, 50)}...</p>
                  </td>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-text)' }}>₹{policy.premiumAmount?.toLocaleString()}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--color-text)' }}>₹{policy.coverageAmount?.toLocaleString()}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--color-text)' }}>{policy.durationInMonths} months</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(policy)} className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary)10' }}>
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(policy.id)} className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger)10' }}>
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
               <Button 
                variant="outline" size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
               >
                 Previous
               </Button>
               <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                 Page {currentPage} of {totalPages}
               </span>
               <Button 
                variant="outline" size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
               >
                 Next
               </Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPolicy ? 'Edit Policy' : 'Create Policy'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Policy Name *" value={form.policyName}
              onChange={(e) => setForm((prev) => ({ ...prev, policyName: e.target.value }))} placeholder="e.g., Premium Health Plan" />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Description" value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe the policy..." />
          </div>
          {!editingPolicy && (
            <Select label="Policy Type" value={form.policyTypeId}
              onChange={(e) => setForm((prev) => ({ ...prev, policyTypeId: e.target.value }))}>
              <option value="">Select type...</option>
              {policyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.category} - {t.description}</option>
              ))}
            </Select>
          )}
          <Input label="Premium Amount (₹) *" type="number" value={form.premiumAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, premiumAmount: e.target.value }))} placeholder="e.g., 2000" />
          <Input label="Coverage Amount (₹) *" type="number" value={form.coverageAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, coverageAmount: e.target.value }))} placeholder="e.g., 500000" />
          <Input label="Duration (months) *" type="number" value={form.durationInMonths}
            onChange={(e) => setForm((prev) => ({ ...prev, durationInMonths: e.target.value }))} placeholder="e.g., 12" />
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{editingPolicy ? 'Update' : 'Create'} Policy</Button>
        </div>
      </Modal>
    </div>
  );
}
