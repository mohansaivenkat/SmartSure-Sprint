import { useState, useEffect } from 'react';
import { policyAPI, adminAPI } from '../../core/services/api';
import { HiPlus, HiPencil, HiTrash, HiDocumentText, HiSearch, HiRefresh } from 'react-icons/hi';
import { PageHeader, Card, Button, Modal, Input, Textarea, Select } from '../../shared/components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../../shared/components/UI';
import toast from 'react-hot-toast';

const STYLES = `
  .pol-root { font-family: var(--font-family); }
  .pol-root .serif { font-family: var(--font-family); font-weight: 800; }
  .pol-root .mono  { font-family: 'JetBrains Mono', monospace; }

  .c-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--color-text-secondary); opacity: .65;
  }

  /* Search */
  .pol-search {
    width: 100%;
    padding: 12px 16px 12px 46px;
    border-radius: 14px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    font-family: var(--font-family);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .pol-search:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary)18;
  }

  /* Create button */
  .create-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 14px;
    background: var(--color-primary);
    color: #fff;
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer;
    font-family: var(--font-family);
    transition: opacity .15s, transform .12s, box-shadow .15s;
    box-shadow: 0 4px 14px var(--color-primary)35;
    white-space: nowrap;
  }
  .create-btn:hover { opacity: .9; transform: translateY(-1px); }
  .create-btn:active { transform: scale(.97); }

  /* ── DESKTOP TABLE ── */
  .pol-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
  .pol-table thead th {
    padding: 12px 20px;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-weight: 700; font-size: 10.5px;
    letter-spacing: .08em; text-transform: uppercase;
    border-bottom: 1.5px solid var(--color-border);
  }
  .pol-table tbody tr { transition: background .1s; }
  .pol-table tbody tr:hover td { background: var(--color-primary)05; }
  .pol-table tbody td {
    padding: 15px 20px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    background: var(--color-surface);
    color: var(--color-text);
  }
  .pol-table tbody tr:last-child td { border-bottom: none; }

  /* Action icon btn */
  .act-btn {
    width: 34px; height: 34px; border-radius: 10px;
    border: none; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all .14s;
  }
  .act-btn:hover { transform: scale(1.1); }
  .act-btn:active { transform: scale(.93); }

  /* Pagination */
  .pag-btn {
    padding: 7px 16px; border-radius: 10px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: var(--font-family);
    transition: all .12s;
  }
  .pag-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
  .pag-btn:disabled { opacity: .35; cursor: not-allowed; }

  /* ── MOBILE CARDS (hidden on desktop) ── */
  .mob-cards { display: none; flex-direction: column; gap: 12px; }

  .pol-card {
    border-radius: 16px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    overflow: hidden;
    transition: box-shadow .15s;
  }
  .pol-card:active { box-shadow: 0 0 0 2px var(--color-primary)30; }

  .pol-card-header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--color-border);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
  }

  .pol-card-body {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
  }

  .pol-card-foot {
    padding: 10px 16px;
    border-top: 1px solid var(--color-border);
    display: flex; gap: 8px; justify-content: flex-end;
  }

  /* ── BREAKPOINT ── */
  @media (max-width: 768px) {
    .desk-table { display: none !important; }
    .mob-cards { display: flex !important; }

    .pol-header-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 14px !important;
    }
    .pol-header-row h1 { font-size: 28px !important; }
    .create-btn { width: 100%; justify-content: center; }

    .pol-search { font-size: 16px; } /* prevent iOS zoom */
  }

  @media (max-width: 480px) {
    .pol-root { padding: 20px 16px !important; }
    .pol-card-body { grid-template-columns: 1fr; }
  }

  /* Modal form grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 560px) {
    .form-grid { grid-template-columns: 1fr; }
  }

  /* Skel */
  .skel {
    border-radius: 8px;
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp .25s ease forwards; }

  /* Coverage badge */
  .cov-badge {
    display: inline-flex; align-items: center;
    padding: 3px 8px; border-radius: 99px;
    font-size: 11px; font-weight: 700;
    background: var(--color-primary)14;
    color: var(--color-primary);
  }

  /* Duration chip */
  .dur-chip {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 99px;
    font-size: 11px; font-weight: 700;
    background: var(--color-border);
    color: var(--color-text-secondary);
  }
`;

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
    policyName: '', description: '', policyTypeId: '',
    premiumAmount: '', coverageAmount: '', durationInMonths: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [policiesRes, typesRes] = await Promise.all([
        policyAPI.getAllPolicies(),
        policyAPI.getPolicyTypes(),
      ]);
      setPolicies(policiesRes.data);
      setPolicyTypes(typesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally { setLoading(false); }
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
    if (!form.policyName || !form.description || !form.premiumAmount || !form.coverageAmount || !form.durationInMonths) {
      toast.error('Please fill in all required fields'); return;
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
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await adminAPI.deletePolicy(id);
      toast.success('Policy deleted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  };

  const filtered = policies.filter(p =>
    (p.policyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.id || '').toString().includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPolicies = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  /* ── Shared metric cell for mobile cards ── */
  const MetaCell = ({ label, value, mono, color }) => (
    <div>
      <p className="c-label" style={{ marginBottom: 4 }}>{label}</p>
      <p className={mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--color-text)', margin: 0 }}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="pol-root fade-up" style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <div className="pol-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="c-label" style={{ marginBottom: 8 }}>Admin Console</p>
          <h1 className="serif" style={{ fontSize: 36, color: 'var(--color-text)', lineHeight: 1.15, margin: 0 }}>
            Manage Policies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 520 }}>
            Create and maintain insurance products. Configure coverage limits, premiums, and eligibility durations.
          </p>
        </div>
        <button className="create-btn" onClick={openCreate}>
          <HiPlus style={{ width: 17, height: 17 }} /> Create Policy
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 22 }}>
        <HiSearch style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', opacity: .45, width: 18, height: 18 }} />
        <input
          className="pol-search"
          placeholder="Search policies by name or ID…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: policies.length, color: 'var(--color-text)' },
          { label: 'Showing', value: filtered.length, color: 'var(--color-primary)' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: 12, fontWeight: 700,
            color: 'var(--color-text-secondary)',
          }}>
            <span className="mono" style={{ color: s.color, fontSize: 13 }}>{s.value}</span>
            <span style={{ opacity: .6 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HiDocumentText} title="No Policies Found"
          description="Try adjusting your search or create a new policy."
          action={<button className="create-btn" onClick={openCreate}><HiPlus style={{ width: 15, height: 15 }} /> Create Policy</button>}
        />
      ) : (
        <>
          {/* ── DESKTOP TABLE ── */}
          <div className="desk-table" style={{ borderRadius: 20, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
            <table className="pol-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: 60 }}>ID</th>
                  <th style={{ textAlign: 'left' }}>Policy Name</th>
                  <th style={{ textAlign: 'left' }}>Premium</th>
                  <th style={{ textAlign: 'left' }}>Coverage</th>
                  <th style={{ textAlign: 'left' }}>Duration</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPolicies.map(policy => (
                  <tr key={policy.id}>
                    <td>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', opacity: .65 }}>#{policy.id}</span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{policy.policyName}</p>
                      {policy.description && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '3px 0 0', opacity: .6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                          {policy.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>₹{policy.premiumAmount?.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="cov-badge mono">₹{policy.coverageAmount?.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="dur-chip">{policy.durationInMonths} mos</span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="act-btn" onClick={() => openEdit(policy)}
                          style={{ color: 'var(--color-primary)', background: 'var(--color-primary)12' }} title="Edit">
                          <HiPencil style={{ width: 15, height: 15 }} />
                        </button>
                        <button className="act-btn" onClick={() => handleDelete(policy.id)}
                          style={{ color: 'var(--color-danger, #ef4444)', background: 'var(--color-danger, #ef4444)12' }} title="Delete">
                          <HiTrash style={{ width: 15, height: 15 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
                <button className="pag-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', opacity: .6 }}>
                  {currentPage} / {totalPages}
                </span>
                <button className="pag-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
              </div>
            )}
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="mob-cards">
            {currentPolicies.map(policy => (
              <div key={policy.id} className="pol-card">
                {/* Card header */}
                <div className="pol-card-header">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', margin: 0 }}>{policy.policyName}</p>
                    {policy.description && (
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '4px 0 0', opacity: .6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {policy.description}
                      </p>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', opacity: .5, flexShrink: 0, marginTop: 2 }}>#{policy.id}</span>
                </div>

                {/* Card body */}
                <div className="pol-card-body">
                  <MetaCell label="Premium" value={`₹${policy.premiumAmount?.toLocaleString()}`} mono />
                  <MetaCell label="Coverage" value={`₹${policy.coverageAmount?.toLocaleString()}`} mono color="var(--color-primary)" />
                  <MetaCell label="Duration" value={`${policy.durationInMonths} months`} />
                </div>

                {/* Card footer actions */}
                <div className="pol-card-foot">
                  <button
                    onClick={() => openEdit(policy)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid var(--color-primary)30',
                      background: 'var(--color-primary)10', color: 'var(--color-primary)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'var(--font-family)',
                    }}
                  >
                    <HiPencil style={{ width: 14, height: 14 }} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid #ef444430',
                      background: '#ef444410', color: '#ef4444',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'var(--font-family)',
                    }}
                  >
                    <HiTrash style={{ width: 14, height: 14 }} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Mobile pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px' }}>
                <button className="pag-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', opacity: .6 }}>
                  {currentPage} / {totalPages}
                </span>
                <button className="pag-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPolicy ? 'Edit Policy' : 'Create New Policy'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Full-width fields */}
          <Input
            label="Policy Name *"
            value={form.policyName}
            onChange={e => setForm(p => ({ ...p, policyName: e.target.value }))}
            placeholder="e.g., Premium Health Plan"
          />
          <Textarea
            label="Description *"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Describe the policy features and terms in detail (no word limit)..."
          />

          {/* Two-col grid (stacks on mobile via .form-grid) */}
          <div className="form-grid">
            {!editingPolicy && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Select
                  label="Policy Type"
                  value={form.policyTypeId}
                  onChange={e => setForm(p => ({ ...p, policyTypeId: e.target.value }))}
                >
                  <option value="">Select type…</option>
                  {policyTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.category} — {t.description}</option>
                  ))}
                </Select>
              </div>
            )}
            <Input
              label="Premium Amount (₹) *"
              type="number"
              value={form.premiumAmount}
              onChange={e => setForm(p => ({ ...p, premiumAmount: e.target.value }))}
              placeholder="e.g., 2000"
            />
            <Input
              label="Coverage Amount (₹) *"
              type="number"
              value={form.coverageAmount}
              onChange={e => setForm(p => ({ ...p, coverageAmount: e.target.value }))}
              placeholder="e.g., 500000"
            />
            <Input
              label="Duration (months) *"
              type="number"
              value={form.durationInMonths}
              onChange={e => setForm(p => ({ ...p, durationInMonths: e.target.value }))}
              placeholder="e.g., 12"
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingPolicy ? 'Update' : 'Create'} Policy</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}