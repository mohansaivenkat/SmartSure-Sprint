import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { claimsAPI, policyAPI } from '../services/api';
import { 
  HiClipboardList, 
  HiPlus, 
  HiUpload, 
  HiCurrencyRupee, 
  HiEye,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiIdentification
} from 'react-icons/hi';
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
        title="Claim Center"
        subtitle="Submit, track, and manage your insurance reimbursement claims"
        action={
          <Button 
            onClick={() => setShowNewClaim(true)}
            className="rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 font-bold"
          >
            <HiPlus className="w-5 h-5 mr-1" />
            File a Claim
          </Button>
        }
      />

      {claims.length === 0 ? (
        <EmptyState
          icon={HiClipboardList}
          title="No Claims on Record"
          description="You haven't submitted any claims yet. If you have an incident to report, file a claim to get started."
          action={
            <Button onClick={() => setShowNewClaim(true)} className="mt-2 rounded-full px-6 py-3 font-bold shadow-md">
              <HiPlus className="w-5 h-5 mr-1" /> File a New Claim
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {claims.map((claim) => (
            <Card key={claim.claimId} className="flex flex-col relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-opacity-50" style={{ borderColor: 'var(--color-border)' }}>
              
              {/* Card Header: IDs & Status */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <HiOutlineDocumentText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-primary)' }}>Claim #{claim.claimId}</p>
                    <p className="text-xs font-medium flex items-center gap-1 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                      <HiIdentification className="w-3.5 h-3.5" /> Policy #{claim.policyId}
                    </p>
                  </div>
                </div>
                <Badge status={claim.status} />
              </div>

              {/* Description */}
              <p className="text-sm mb-5 flex-1 line-clamp-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {claim.description}
              </p>

              {/* Highlighted Amount Block */}
              <div className="flex items-center justify-between p-4 rounded-2xl mb-5 border" 
                   style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)20' }}>
                    <HiCurrencyRupee className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Amount</span>
                </div>
                <span className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                  ₹{claim.claimAmount?.toLocaleString()}
                </span>
              </div>

              {/* Bottom Action Grid */}
              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowUpload(claim.claimId)}
                  className="rounded-xl font-semibold border-dashed hover:border-solid transition-all"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  <HiUpload className="w-4 h-4 mr-1.5" /> Upload
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDownloadDoc(claim.claimId)}
                  className="rounded-xl font-semibold hover:bg-opacity-80"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <HiEye className="w-4 h-4 mr-1.5" style={{ color: 'var(--color-text-secondary)' }} /> View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modern New Claim Modal */}
      <Modal isOpen={showNewClaim} onClose={() => setShowNewClaim(false)} title="File a New Claim">
        <div className="space-y-5 px-1 py-2">
          {userPolicies.length === 0 ? (
            <div className="p-4 rounded-xl text-sm text-center border text-amber-600 bg-amber-50 border-amber-200">
              You do not have any active policies eligible for a claim.
            </div>
          ) : (
            <>
              <Select
                label="Select Active Policy"
                value={claimForm.policyId}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, policyId: e.target.value }))}
                className="w-full"
              >
                <option value="">Choose a policy to claim against...</option>
                {userPolicies.map((p) => (
                  <option key={p.id} value={p.id}>{p.policyName} (Policy ID: {p.id})</option>
                ))}
              </Select>
              
              <Input
                label="Claim Amount (₹)"
                type="number"
                value={claimForm.claimAmount}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, claimAmount: e.target.value }))}
                placeholder="e.g. 50000"
              />
              
              <Textarea
                label="Incident Description"
                value={claimForm.description}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe the reason for your claim in detail..."
                rows={4}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t mt-6" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowNewClaim(false)}>Cancel</Button>
            <Button onClick={handleSubmitClaim} loading={submitting} disabled={userPolicies.length === 0} className="rounded-xl shadow-md">
              Submit Claim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Redesigned Upload Document Modal */}
      <Modal isOpen={!!showUpload} onClose={() => { setShowUpload(null); setFile(null); }} title="Upload Supporting Document">
        <div className="space-y-5 py-2">
          <div className="text-sm p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'var(--color-bg)' }}>
            <HiOutlineDocumentText className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Please upload clear, legible documents to support <strong style={{ color: 'var(--color-text)' }}>Claim #{showUpload}</strong>. 
              Accepted formats are JPG, JPEG, and PDF.
            </p>
          </div>

          <div
            className={`group border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${file ? 'bg-opacity-10' : 'hover:bg-opacity-50'}`}
            style={{ 
              borderColor: file ? 'var(--color-success)' : 'var(--color-border)',
              backgroundColor: file ? 'var(--color-success)10' : 'transparent' 
            }}
            onClick={() => document.getElementById('file-upload').click()}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                  <HiOutlineDocumentText className="w-7 h-7" />
                </div>
                <p className="text-base font-bold truncate max-w-xs" style={{ color: 'var(--color-text)' }}>{file.name}</p>
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-success)' }}>File ready to upload</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <HiOutlineCloudUpload className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  Click to browse files
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Maximum file size: 5MB</p>
              </div>
            )}
            
            <input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowUpload(null); setFile(null); }}>Cancel</Button>
            <Button onClick={handleUploadDoc} loading={submitting} disabled={!file} className="rounded-xl shadow-md">
              Confirm Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}