import React, { useEffect, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  User,
  ShieldCheck,
  IndianRupee,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import CashierRechargeModal from '../../components/CashierRechargeModal';

const WalletApprovals = () => {
  const { events } = useSocket();
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('PENDING'); // 'PENDING' | 'ALL'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // request being rejected
  const [rejectReason, setRejectReason] = useState('Cash not received at counter');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/wallet/recharge/pending', {
        params: { status: tab, search: search.trim() || undefined },
      });
      setRequests(data.requests);
    } catch (err) {
      setError('Failed to load recharge requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Live socket updates
  useEffect(() => {
    const latest = events[0];
    if (latest?.type === 'recharge:new' || latest?.type === 'recharge:updated') {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  const handleApprove = async (request) => {
    setActionBusyId(request._id);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await api.patch(`/wallet/recharge/${request._id}/approve`);
      setSuccessMsg(`✓ Approved ₹${request.amount} for ${request.studentName} (${request.requestCode})`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    setActionBusyId(rejectModal._id);
    setError('');
    try {
      await api.patch(`/wallet/recharge/${rejectModal._id}/reject`, { reason: rejectReason });
      setSuccessMsg(`Rejected request ${rejectModal.requestCode}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setRejectModal(null);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Reject failed');
    } finally {
      setActionBusyId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedTotal = requests
    .filter((r) => r.status === 'APPROVED')
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">Wallet Cash Approvals</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={13} /> Counter Verification
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Verify physical cash received at the canteen desk before crediting student balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDirectModal(true)}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
          >
            <Banknote size={15} className="text-emerald-600" />
            <span>Direct Cash Top-Up</span>
          </button>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Refresh queue"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="card p-4 border border-neutral-200">
          <p className="text-xs text-neutral-400 font-semibold uppercase">Pending Requests</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 flex items-center gap-1">
            <Clock size={20} /> {tab === 'PENDING' ? requests.length : pendingCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Waiting at canteen counter</p>
        </div>
        <div className="card p-4 border border-neutral-200">
          <p className="text-xs text-neutral-400 font-semibold uppercase">Approved In View</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={20} /> ₹{approvedTotal}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Total cash credited</p>
        </div>
        <div className="col-span-2 md:col-span-1 card p-4 border border-neutral-200 bg-neutral-50/60 flex flex-col justify-center">
          <p className="text-xs font-semibold text-neutral-700">Audit Rule</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Always count the physical currency notes before clicking <strong>Approve</strong>.
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl max-w-xs">
          <button
            onClick={() => setTab('PENDING')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'PENDING'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Pending Queue
          </button>
          <button
            onClick={() => setTab('ALL')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'ALL'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            All History
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code #CR-..., name, or ID"
            className="input pl-8 py-2 text-xs w-full"
          />
        </form>
      </div>

      {/* Requests Queue */}
      <div className="card divide-y divide-neutral-100 border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2 opacity-60" />
            <p className="font-semibold text-neutral-800 text-sm">No Pending Requests</p>
            <p className="text-xs text-neutral-400 mt-1">
              When a student requests counter recharge from their app, it will appear here in real time.
            </p>
          </div>
        ) : (
          requests.map((r) => {
            const isPending = r.status === 'PENDING';
            const isApproved = r.status === 'APPROVED';
            const isRejected = r.status === 'REJECTED';

            return (
              <div
                key={r._id}
                className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-neutral-50/50'
                }`}
              >
                {/* Left: Code, Student details */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex flex-col items-center justify-center font-mono font-bold shrink-0">
                    <span className="text-[10px] text-brand-400 leading-none">TOKEN</span>
                    <span className="text-xs mt-0.5">{r.requestCode}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 text-sm">{r.studentName}</span>
                      {r.studentId && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                          ID: {r.studentId}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 mt-0.5">
                      {r.studentEmail} {r.studentPhone ? `· ${r.studentPhone}` : ''}
                    </p>

                    <p className="text-[11px] text-neutral-400 mt-1">
                      Requested: {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {r.approvedByName ? ` · Approved by ${r.approvedByName}` : ''}
                      {r.rejectionReason ? ` · Reason: ${r.rejectionReason}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  <div className="text-left md:text-right mr-2">
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Amount</span>
                    <span className="text-xl font-black text-neutral-900 flex items-center md:justify-end gap-0.5">
                      <IndianRupee size={18} className="text-brand-600" />
                      {r.amount}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(r)}
                        disabled={actionBusyId === r._id}
                        className="btn-primary text-xs py-2 px-3.5 font-bold flex items-center gap-1 shadow-sm bg-emerald-600 hover:bg-emerald-700"
                      >
                        {actionBusyId === r._id ? (
                          <span>Crediting…</span>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Collect Cash & Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectModal(r)}
                        disabled={actionBusyId === r._id}
                        className="btn-secondary text-xs py-2 px-2.5 text-rose-700 hover:bg-rose-50 border-rose-200"
                        title="Reject request"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100">
            <h3 className="font-bold text-base text-neutral-900 mb-1">Reject Recharge Request</h3>
            <p className="text-xs text-neutral-500 mb-3">
              Reject token <strong className="font-mono text-neutral-800">{rejectModal.requestCode}</strong> (₹{rejectModal.amount} for {rejectModal.studentName})
            </p>

            <label className="block text-xs font-semibold text-neutral-700 mb-1">Reason for Rejection</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input text-xs mb-4"
              placeholder="e.g. Student walked away / cash not paid"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="btn-primary flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Counter Modal fallback */}
      <CashierRechargeModal
        isOpen={showDirectModal}
        onClose={() => {
          setShowDirectModal(false);
          loadRequests();
        }}
      />
    </div>
  );
};

export default WalletApprovals;
