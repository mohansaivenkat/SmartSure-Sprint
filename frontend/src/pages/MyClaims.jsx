import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { claimsAPI, policyAPI } from '../services/api';
import { HiClipboardList, HiPlus, HiUpload, HiDocumentText, HiCurrencyRupee, HiEye } from 'react-icons/hi';
import { PageHeader, Card, Badge, Button, Modal, Input, Textarea, Select } from '../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function MyClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [userPolicies, setUserPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showUpload, setShowUpload] = useState(null);
  const [claimForm, setClaimForm] = useState({ policyId: '', claimAmount: '', description: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [claimsRes, policiesRes] = await Promise.all([
        claimsAPI.getClaimsByUser(user.id),
        policyAPI.getUserPolicies(user.id),
      ]);
      setClaims(claimsRes.data);
      setUserPolicies(policiesRes.data.filter((p) => p.status === 'ACTIVE'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitClaim = async () => {
    if (!claimForm.policyId || !claimForm.claimAmount || !claimForm.description) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await claimsAPI.initiateClaim({
        policyId: Number(claimForm.policyId),
        userId: user.id,
        claimAmount: Number(claimForm.claimAmount),
        description: claimForm.description,
      });
      toast.success('Claim submitted successfully!');
      setShowNewClaim(false);
      setClaimForm({ policyId: '', claimAmount: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      await claimsAPI.uploadDocument(showUpload, file);
      toast.success('Document uploaded successfully!');
      setShowUpload(null);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDoc = async (claimId) => {
    try {
      const res = await claimsAPI.downloadDocument(claimId);
      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      if (contentType.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `claim-${claimId}-document`;
        link.click();
      }
    } catch {
      toast.error('No document found for this claim');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Claims"
        subtitle="Submit and track your insurance claims"
        action={
          <Button onClick={() => setShowNewClaim(true)}>
            <HiPlus className="w-4 h-4" />
            New Claim
          </Button>
        }
      />

      {claims.length === 0 ? (
        <EmptyState
          icon={HiClipboardList}
          title="No Claims Yet"
          description="You haven't submitted any claims"
          action={<Button onClick={() => setShowNewClaim(true)}><HiPlus className="w-4 h-4" /> File a Claim</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {claims.map((claim) => (
            <Card key={claim.claimId}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Claim #{claim.claimId}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Policy #{claim.policyId}</p>
                </div>
                <Badge status={claim.status} />
              </div>

              <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>{claim.description}</p>

              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                <HiCurrencyRupee className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>₹{claim.claimAmount?.toLocaleString()}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowUpload(claim.claimId)}>
                  <HiUpload className="w-3 h-3" /> Upload Doc
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDownloadDoc(claim.claimId)}>
                  <HiEye className="w-3 h-3" /> View Doc
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Claim Modal */}
      <Modal isOpen={showNewClaim} onClose={() => setShowNewClaim(false)} title="File a New Claim">
        <div className="space-y-4">
          <Select
            label="Select Policy"
            value={claimForm.policyId}
            onChange={(e) => setClaimForm((prev) => ({ ...prev, policyId: e.target.value }))}
          >
            <option value="">Choose a policy...</option>
            {userPolicies.map((p) => (
              <option key={p.id} value={p.id}>{p.policyName} (ID: {p.id})</option>
            ))}
          </Select>
          <Input
            label="Claim Amount (₹)"
            type="number"
            value={claimForm.claimAmount}
            onChange={(e) => setClaimForm((prev) => ({ ...prev, claimAmount: e.target.value }))}
            placeholder="Enter amount"
          />
          <Textarea
            label="Description"
            value={claimForm.description}
            onChange={(e) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the reason for your claim..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNewClaim(false)}>Cancel</Button>
            <Button onClick={handleSubmitClaim} loading={submitting}>Submit Claim</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={!!showUpload} onClose={() => { setShowUpload(null); setFile(null); }} title="Upload Document">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Upload supporting documents for Claim #{showUpload}. Accepted formats: JPG, PDF
          </p>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <HiUpload className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {file ? file.name : 'Click to select a file'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>JPG or PDF, max 5MB</p>
            <input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowUpload(null); setFile(null); }}>Cancel</Button>
            <Button onClick={handleUploadDoc} loading={submitting}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
