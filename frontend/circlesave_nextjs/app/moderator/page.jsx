"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import Navbar from "@/views/layout/Navbar";
import toast from "react-hot-toast";

const TABS = [
  { key: "kyc", label: "KYC Reviews", icon: "fact_check" },
  { key: "pools", label: "Pool Monitor", icon: "monitoring" },
  { key: "flags", label: "My Flags", icon: "flag" },
];

export default function ModeratorDashboard() {
  const { user, isModerator, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("kyc");

  if (loading) return <ModLoading />;
  if (!isModerator && !isAdmin) { router.push("/"); return null; }

  return (
    <div className="min-h-screen bg-luxury-dark">
      <Navbar />
      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-2xl">shield_person</span>
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black text-luxury-cream">Moderator Console</h1>
              <p className="text-luxury-gold/40 text-xs font-bold uppercase tracking-widest">
                Observe · Review · Flag
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-blue-500/20 text-luxury-cream border border-blue-500/30"
                    : "text-luxury-gold/40 hover:text-luxury-gold hover:bg-white/5"
                }`}>
                <span className="material-symbols-outlined text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "kyc" && <KycReviewTab />}
          {tab === "pools" && <PoolMonitorTab />}
          {tab === "flags" && <MyFlagsTab />}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   KYC REVIEW TAB — Moderators can approve/reject KYC
   ══════════════════════════════════════════════════════════════════════════ */
function KycReviewTab() {
  const [users, setUsers] = useState([]);
  const [kycDetail, setKycDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?kycStatus=submitted&limit=50");
      const data = await res.json();
      setUsers(data.users || []);
    } catch { setUsers([]); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const viewKyc = async (userId) => {
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`);
      const data = await res.json();
      setKycDetail(data.kyc);
    } catch { toast.error("Failed to load KYC"); }
  };

  const handleAction = async (userId, action) => {
    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(action === "verify" ? "Customer verified!" : "KYC rejected");
      setKycDetail(null);
      setRejectReason("");
      fetchPending();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-amber-400">pending_actions</span>
        <h3 className="text-xl font-serif font-black text-luxury-cream">
          Pending KYC Submissions ({users.length})
        </h3>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-luxury-gold/20 text-5xl mb-4 block">task_alt</span>
          <p className="text-luxury-gold/40 text-sm">No pending KYC submissions</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-xl p-5 gold-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center text-white text-sm font-black">
                  {u.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="text-luxury-cream text-sm font-bold">{u.fullName}</p>
                  <p className="text-luxury-gold/40 text-xs">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full">
                  Submitted {u.submittedAt ? new Date(u.submittedAt).toLocaleDateString() : ""}
                </span>
                <button onClick={() => viewKyc(u.id)}
                  className="text-luxury-gold text-xs font-bold hover:underline">
                  Review →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC Detail Modal */}
      {kycDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setKycDetail(null)}>
          <div className="bg-[#1A1A22] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-black text-luxury-cream">KYC Review</h2>
              <button onClick={() => setKycDetail(null)} className="text-white/40 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Full Name", kycDetail.fullName],
                ["Email", kycDetail.email],
                ["Phone", kycDetail.phone],
                ["DOB", kycDetail.dateOfBirth],
                ["Gender", kycDetail.gender],
                ["Address", kycDetail.addressLine],
                ["City", kycDetail.city],
                ["State", kycDetail.state],
                ["Pincode", kycDetail.pincode],
                ["Aadhaar", kycDetail.aadhaarNumber],
                ["PAN", kycDetail.panNumber],
                ["Bank", kycDetail.bankName],
                ["Account", kycDetail.bankAccount],
                ["IFSC", kycDetail.ifscCode],
                ["Nominee", kycDetail.nomineeName],
                ["Relation", kycDetail.nomineeRelation],
              ].map(([label, val]) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-luxury-gold/40 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-luxury-cream font-mono text-xs">{val || "—"}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required if rejecting)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-luxury-cream text-sm placeholder-white/20 outline-none focus:border-luxury-crimson"
                rows={2}
              />
              <div className="flex gap-4">
                <button onClick={() => handleAction(kycDetail.userId, "verify")}
                  disabled={actionLoading === kycDetail.userId}
                  className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 font-bold uppercase tracking-widest py-3 rounded-xl text-sm hover:bg-green-600/30 disabled:opacity-50">
                  ✓ Approve
                </button>
                <button onClick={() => handleAction(kycDetail.userId, "reject")}
                  disabled={actionLoading === kycDetail.userId}
                  className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 font-bold uppercase tracking-widest py-3 rounded-xl text-sm hover:bg-red-600/30 disabled:opacity-50">
                  ✗ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   POOL MONITOR TAB — Read-only observation of on-chain pools
   ══════════════════════════════════════════════════════════════════════════ */
function PoolMonitorTab() {
  const [flagForm, setFlagForm] = useState({ poolId: "", reason: "", severity: "warning" });
  const [flagging, setFlagging] = useState(false);

  const handleRaiseFlag = async (e) => {
    e.preventDefault();
    if (!flagForm.poolId || !flagForm.reason) {
      toast.error("Pool ID and reason are required");
      return;
    }
    setFlagging(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: parseInt(flagForm.poolId),
          reason: flagForm.reason,
          severity: flagForm.severity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Flag raised successfully!");
      setFlagForm({ poolId: "", reason: "", severity: "warning" });
    } catch (e) { toast.error(e.message); }
    finally { setFlagging(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Info Panel */}
      <div className="glass-card rounded-xl p-8 gold-border-subtle">
        <h3 className="text-xl font-serif font-black text-luxury-cream mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-luxury-gold">monitoring</span>
          Pool Observation
        </h3>
        <p className="text-luxury-gold/60 text-sm leading-relaxed mb-6">
          As a moderator, you can observe all pool activities on the blockchain. 
          If you notice any suspicious behavior — unusual bidding patterns, 
          suspected collusion, or fund manipulation — raise a flag immediately.
        </p>
        <div className="space-y-3">
          {[
            { icon: "visibility", text: "Monitor all pool contributions and bids" },
            { icon: "flag", text: "Raise flags on suspicious activities" },
            { icon: "block", text: "You cannot create, modify, or interact with pools" },
            { icon: "fact_check", text: "Review and approve/reject customer KYC" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
              <span className="material-symbols-outlined text-luxury-gold text-base">{item.icon}</span>
              <span className="text-luxury-gold/60 text-xs">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Raise Flag Form */}
      <div className="glass-card rounded-xl p-8 gold-border-subtle">
        <h3 className="text-xl font-serif font-black text-luxury-cream mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">flag</span>
          Raise a Flag
        </h3>
        <form onSubmit={handleRaiseFlag} className="space-y-4">
          <div>
            <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-1.5 block">Pool ID</label>
            <input
              type="number"
              value={flagForm.poolId}
              onChange={(e) => setFlagForm((p) => ({ ...p, poolId: e.target.value }))}
              placeholder="e.g. 1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-luxury-cream text-sm placeholder-white/20 outline-none focus:border-luxury-crimson"
            />
          </div>
          <div>
            <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-1.5 block">Severity</label>
            <select
              value={flagForm.severity}
              onChange={(e) => setFlagForm((p) => ({ ...p, severity: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-luxury-cream text-sm outline-none focus:border-luxury-crimson"
            >
              <option value="info" className="bg-[#1A1A22]">Info</option>
              <option value="warning" className="bg-[#1A1A22]">Warning</option>
              <option value="critical" className="bg-[#1A1A22]">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-1.5 block">Reason</label>
            <textarea
              value={flagForm.reason}
              onChange={(e) => setFlagForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Describe the suspicious activity..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-luxury-cream text-sm placeholder-white/20 outline-none focus:border-luxury-crimson resize-none"
            />
          </div>
          <button type="submit" disabled={flagging}
            className="w-full bg-red-600/20 border border-red-500/30 text-red-400 font-bold uppercase tracking-widest py-3.5 rounded-xl text-sm hover:bg-red-600/30 transition-all disabled:opacity-50">
            {flagging ? "Submitting…" : "Raise Flag"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MY FLAGS TAB — View flags raised by this moderator
   ══════════════════════════════════════════════════════════════════════════ */
function MyFlagsTab() {
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/flags?limit=100");
        const data = await res.json();
        setFlags(data.flags || []);
      } catch { setFlags([]); }
    })();
  }, []);

  const severityColors = {
    info: "bg-blue-500/20 text-blue-400",
    warning: "bg-amber-500/20 text-amber-400",
    critical: "bg-red-500/20 text-red-400",
  };

  const statusColors = {
    open: "bg-amber-500/20 text-amber-400",
    acknowledged: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
    dismissed: "bg-white/5 text-white/30",
  };

  return (
    <div>
      {flags.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-luxury-gold/20 text-5xl mb-4 block">flag</span>
          <p className="text-luxury-gold/40 text-sm">No flags raised yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.id} className="glass-card rounded-xl p-5 gold-border-subtle">
              <div className="flex items-start gap-3 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${severityColors[f.severity]}`}>
                  {f.severity}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[f.status]}`}>
                  {f.status}
                </span>
                <span className="text-luxury-gold/40 text-xs ml-auto">
                  {new Date(f.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-luxury-cream text-sm font-bold mt-3">Pool #{f.poolId}</p>
              <p className="text-luxury-gold/60 text-xs mt-1">{f.reason}</p>
              {f.resolvedByName && (
                <p className="text-luxury-gold/30 text-[10px] mt-2">
                  {f.status} by {f.resolvedByName} on {new Date(f.resolvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModLoading() {
  return (
    <div className="min-h-screen bg-luxury-dark flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-luxury-gold text-4xl">progress_activity</span>
    </div>
  );
}
