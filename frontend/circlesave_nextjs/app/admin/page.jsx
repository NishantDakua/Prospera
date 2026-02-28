"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useWeb3 } from "@/context/Web3Provider";
import useContract from "@/hooks/useContract";
import { parseEther } from "ethers";
import { fmtEthSymbol, shortenAddress, poolTypeName } from "@/lib/utils";
import Navbar from "@/views/layout/Navbar";
import toast from "react-hot-toast";

/* ── Tabs ─────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "users", label: "Users & KYC", icon: "group" },
  { key: "moderators", label: "Moderators", icon: "shield_person" },
  { key: "circles", label: "Create Circle", icon: "add_circle" },
  { key: "manage", label: "Manage Circles", icon: "tune" },
  { key: "flags", label: "Flags", icon: "flag" },
  { key: "audit", label: "Audit Log", icon: "history" },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return <Loading />;

  return (
    <div className="min-h-screen bg-luxury-dark">
      <Navbar />
      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl premium-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black text-luxury-cream">Admin Console</h1>
              <p className="text-luxury-gold/40 text-xs font-bold uppercase tracking-widest">Platform Management</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-luxury-crimson/20 text-luxury-cream border border-luxury-crimson/30"
                    : "text-luxury-gold/40 hover:text-luxury-gold hover:bg-white/5"
                }`}>
                <span className="material-symbols-outlined text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "moderators" && <ModeratorsTab />}
          {tab === "circles" && <CreateCircleTab />}
          {tab === "manage" && <ManageCirclesTab />}
          {tab === "flags" && <FlagsTab />}
          {tab === "audit" && <AuditTab />}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, flagsRes] = await Promise.all([
          fetch("/api/admin/users?limit=1"),
          fetch("/api/flags?limit=1"),
        ]);
        const usersData = usersRes.ok ? await usersRes.json() : { total: 0 };
        const flagsData = flagsRes.ok ? await flagsRes.json() : { total: 0 };

        // Get breakdown by role
        const [custRes, modRes, pendingRes] = await Promise.all([
          fetch("/api/admin/users?role=customer&limit=1"),
          fetch("/api/admin/users?role=moderator&limit=1"),
          fetch("/api/admin/users?kycStatus=submitted&limit=1"),
        ]);
        const custData = custRes.ok ? await custRes.json() : { total: 0 };
        const modData = modRes.ok ? await modRes.json() : { total: 0 };
        const pendingData = pendingRes.ok ? await pendingRes.json() : { total: 0 };

        setStats({
          totalUsers: usersData.total,
          totalCustomers: custData.total,
          totalModerators: modData.total,
          pendingKyc: pendingData.total,
          totalFlags: flagsData.total,
        });
      } catch { setStats(null); }
    })();
  }, []);

  if (!stats) return <Loading />;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: "group", color: "from-blue-500 to-blue-600" },
    { label: "Customers", value: stats.totalCustomers, icon: "person", color: "from-green-500 to-green-600" },
    { label: "Moderators", value: stats.totalModerators, icon: "shield_person", color: "from-purple-500 to-purple-600" },
    { label: "Pending KYC", value: stats.pendingKyc, icon: "pending_actions", color: "from-amber-500 to-amber-600" },
    { label: "Open Flags", value: stats.totalFlags, icon: "flag", color: "from-red-500 to-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="glass-card p-6 rounded-xl gold-border-subtle">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
            <span className="material-symbols-outlined text-white text-lg">{c.icon}</span>
          </div>
          <p className="text-3xl font-black text-luxury-cream">{c.value}</p>
          <p className="text-luxury-gold/40 text-[10px] font-bold uppercase tracking-widest mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   USERS & KYC TAB
   ══════════════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [kycDetail, setKycDetail] = useState(null); // expanded user KYC
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchUsers = useCallback(async () => {
    let url = `/api/admin/users?page=${page}&limit=15`;
    if (filter === "pending-kyc") url += "&kycStatus=submitted";
    else if (filter === "verified") url += "&kycStatus=verified";
    else if (filter === "customers") url += "&role=customer";
    try {
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { setUsers([]); }
  }, [page, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const viewKyc = async (userId) => {
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`);
      const data = await res.json();
      setKycDetail(data.kyc);
    } catch { toast.error("Failed to load KYC"); }
  };

  const handleVerify = async (userId, action) => {
    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
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
      fetchUsers();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const filterOptions = [
    { key: "all", label: "All Users" },
    { key: "pending-kyc", label: "Pending KYC" },
    { key: "verified", label: "Verified" },
    { key: "customers", label: "Customers" },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((f) => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filter === f.key
                ? "bg-luxury-crimson/20 text-luxury-cream border border-luxury-crimson/30"
                : "bg-white/5 text-luxury-gold/40 hover:bg-white/10"
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-luxury-gold/40 text-xs self-center">{total} users</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-luxury-gold/60 text-[10px] font-bold uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">KYC Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full premium-gradient flex items-center justify-center text-white text-[10px] font-black">
                      {u.fullName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-luxury-cream text-sm font-bold">{u.fullName}</p>
                      <p className="text-luxury-gold/40 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    u.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                    u.role === "moderator" ? "bg-blue-500/20 text-blue-400" :
                    "bg-white/5 text-white/50"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    u.kycStatus === "verified" ? "bg-green-500/20 text-green-400" :
                    u.kycStatus === "submitted" ? "bg-amber-500/20 text-amber-400" :
                    u.kycStatus === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-white/5 text-white/30"
                  }`}>{u.kycStatus}</span>
                </td>
                <td className="px-4 py-3">
                  {u.isVerified ? (
                    <span className="material-symbols-outlined text-green-400 text-lg">verified</span>
                  ) : (
                    <span className="material-symbols-outlined text-white/20 text-lg">cancel</span>
                  )}
                </td>
                <td className="px-4 py-3 text-luxury-gold/40 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {u.kycStatus === "submitted" && !u.isVerified && (
                    <button onClick={() => viewKyc(u.id)}
                      className="text-luxury-gold text-xs font-bold hover:underline">
                      Review KYC
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 bg-white/5 rounded text-luxury-cream text-xs disabled:opacity-30">Prev</button>
          <span className="px-4 py-2 text-luxury-gold/60 text-xs">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 15}
            className="px-4 py-2 bg-white/5 rounded text-luxury-cream text-xs disabled:opacity-30">Next</button>
        </div>
      )}

      {/* KYC Detail Modal */}
      {kycDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setKycDetail(null)}>
          <div className="bg-[#13121A] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/8 sticky top-0 bg-[#13121A] z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-luxury-crimson/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-luxury-crimson">person_search</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-luxury-cream tracking-tight">KYC Review</h2>
                  <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">Identity Verification</p>
                </div>
              </div>
              <button onClick={() => setKycDetail(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">

              {/* Identity Banner */}
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/8">
                <div className="w-14 h-14 rounded-full bg-luxury-crimson/20 flex items-center justify-center text-2xl font-black text-luxury-crimson border border-luxury-crimson/20">
                  {kycDetail.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-luxury-cream text-lg font-black truncate">{kycDetail.fullName}</p>
                  <p className="text-luxury-gold/50 text-sm">{kycDetail.email}</p>
                  {kycDetail.phone && <p className="text-luxury-gold/40 text-xs mt-0.5">{kycDetail.phone}</p>}
                </div>
                {kycDetail.walletAddress ? (
                  <div className="text-right">
                    <p className="text-luxury-gold/40 text-[9px] uppercase tracking-widest mb-1">Wallet</p>
                    <p className="text-emerald-400 font-mono text-xs">{kycDetail.walletAddress.slice(0,6)}…{kycDetail.walletAddress.slice(-4)}</p>
                  </div>
                ) : (
                  <span className="text-amber-400/70 text-[10px] font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">No Wallet</span>
                )}
              </div>

              {/* Personal Details */}
              <div>
                <p className="text-luxury-gold/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person</span> Personal
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Date of Birth", kycDetail.dateOfBirth ? new Date(kycDetail.dateOfBirth).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric"}) : "—"],
                    ["Gender", kycDetail.gender ? kycDetail.gender.charAt(0).toUpperCase() + kycDetail.gender.slice(1) : "—"],
                    ["Pincode", kycDetail.pincode || "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                      <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
                      <p className="text-luxury-cream text-sm font-bold">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-white/[0.03] border border-white/6 rounded-xl p-4">
                  <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">Address</p>
                  <p className="text-luxury-cream text-sm font-bold">{[kycDetail.addressLine, kycDetail.city, kycDetail.state].filter(Boolean).join(", ") || "—"}</p>
                </div>
              </div>

              {/* Identity Documents */}
              <div>
                <p className="text-luxury-gold/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">badge</span> Identity Documents
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                    <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">Aadhaar Number</p>
                    <p className="text-luxury-cream font-mono text-sm font-bold tracking-widest">
                      {kycDetail.aadhaarNumber ? `XXXX XXXX ${kycDetail.aadhaarNumber.slice(-4)}` : "—"}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                    <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">PAN Number</p>
                    <p className="text-luxury-cream font-mono text-sm font-bold tracking-widest uppercase">
                      {kycDetail.panNumber ? `${kycDetail.panNumber.slice(0,3)}XXXXXXX` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nominee */}
              {(kycDetail.nomineeName || kycDetail.nomineeRelation) && (
                <div>
                  <p className="text-luxury-gold/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">family_restroom</span> Nominee
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                      <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">Name</p>
                      <p className="text-luxury-cream text-sm font-bold">{kycDetail.nomineeName || "—"}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                      <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest mb-1.5">Relationship</p>
                      <p className="text-luxury-cream text-sm font-bold capitalize">{kycDetail.nomineeRelation || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Actions */}
              <div className="pt-2 space-y-4 border-t border-white/8">
                <div>
                  <label className="text-luxury-gold/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">
                    Rejection Reason <span className="text-luxury-crimson/60">(required if rejecting)</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Aadhaar number mismatch, documents unclear..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-luxury-cream text-sm placeholder-white/20 outline-none focus:border-luxury-crimson resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(kycDetail.userId, "verify")}
                    disabled={actionLoading === kycDetail.userId}
                    className="flex-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest py-3.5 rounded-xl text-xs hover:bg-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {actionLoading === kycDetail.userId ? "Processing…" : "Approve & Verify"}
                  </button>
                  <button
                    onClick={() => handleVerify(kycDetail.userId, "reject")}
                    disabled={actionLoading === kycDetail.userId}
                    className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 font-black uppercase tracking-widest py-3.5 rounded-xl text-xs hover:bg-red-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    {actionLoading === kycDetail.userId ? "Processing…" : "Reject"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODERATORS TAB — Create moderator accounts
   ══════════════════════════════════════════════════════════════════════════ */
function ModeratorsTab() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [mods, setMods] = useState([]);

  const fetchMods = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?role=moderator&limit=100");
      const data = await res.json();
      setMods(data.users || []);
    } catch { setMods([]); }
  }, []);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Name, email, and password required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/moderator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Moderator ${data.moderator.fullName} created!`);
      setForm({ fullName: "", email: "", phone: "", password: "" });
      fetchMods();
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Create Form */}
      <div className="glass-card rounded-xl p-8 gold-border-subtle">
        <h3 className="text-xl font-serif font-black text-luxury-cream mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-luxury-gold">person_add</span>
          Create Moderator
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { name: "fullName", label: "Full Name", type: "text", icon: "badge" },
            { name: "email", label: "Email", type: "email", icon: "mail" },
            { name: "phone", label: "Phone (optional)", type: "tel", icon: "phone" },
            { name: "password", label: "Password", type: "password", icon: "lock" },
          ].map((f) => (
            <div key={f.name}>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-1.5 block">{f.label}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-luxury-gold/30 text-base">{f.icon}</span>
                <input
                  type={f.type}
                  value={form[f.name]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-luxury-cream text-sm placeholder-white/20 outline-none focus:border-luxury-crimson"
                />
              </div>
            </div>
          ))}
          <button type="submit" disabled={creating}
            className="w-full premium-gradient text-white font-bold uppercase tracking-widest py-3.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {creating ? "Creating…" : "Create Moderator"}
          </button>
        </form>
      </div>

      {/* Existing Moderators */}
      <div className="glass-card rounded-xl p-8 gold-border-subtle">
        <h3 className="text-xl font-serif font-black text-luxury-cream mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-luxury-gold">shield_person</span>
          Active Moderators ({mods.length})
        </h3>
        <div className="space-y-3">
          {mods.map((m) => (
            <div key={m.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-black">
                {m.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-luxury-cream text-sm font-bold">{m.fullName}</p>
                <p className="text-luxury-gold/40 text-xs">{m.email}</p>
              </div>
              <span className="text-luxury-gold/30 text-xs">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {mods.length === 0 && (
            <p className="text-luxury-gold/30 text-sm text-center py-8">No moderators yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FLAGS TAB
   ══════════════════════════════════════════════════════════════════════════ */
function FlagsTab() {
  const [flags, setFlags] = useState([]);
  const [filter, setFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFlags = useCallback(async () => {
    let url = "/api/flags?limit=50";
    if (filter) url += `&status=${filter}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setFlags(data.flags || []);
    } catch { setFlags([]); }
  }, [filter]);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const handleResolve = async (flagId, action) => {
    setActionLoading(flagId);
    try {
      const res = await fetch(`/api/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Flag ${action}`);
      fetchFlags();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const severityColors = {
    info: "bg-blue-500/20 text-blue-400",
    warning: "bg-amber-500/20 text-amber-400",
    critical: "bg-red-500/20 text-red-400",
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "open", "acknowledged", "resolved", "dismissed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filter === s ? "bg-luxury-crimson/20 text-luxury-cream border border-luxury-crimson/30" : "bg-white/5 text-luxury-gold/40"
            }`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {flags.map((f) => (
          <div key={f.id} className="glass-card rounded-xl p-5 gold-border-subtle flex items-start gap-4">
            <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${severityColors[f.severity]}`}>
              {f.severity}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-luxury-cream text-sm font-bold">Pool #{f.poolId}</p>
              <p className="text-luxury-gold/60 text-xs mt-1">{f.reason}</p>
              <p className="text-luxury-gold/30 text-[10px] mt-2">
                Raised by {f.raisedByName} · {new Date(f.createdAt).toLocaleString()}
                {f.resolvedByName && ` · ${f.status} by ${f.resolvedByName}`}
              </p>
            </div>
            {f.status === "open" && (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleResolve(f.id, "acknowledged")} disabled={actionLoading === f.id}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-500/20 disabled:opacity-50">ACK</button>
                <button onClick={() => handleResolve(f.id, "resolved")} disabled={actionLoading === f.id}
                  className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold uppercase hover:bg-green-500/20 disabled:opacity-50">Resolve</button>
                <button onClick={() => handleResolve(f.id, "dismissed")} disabled={actionLoading === f.id}
                  className="px-3 py-1.5 bg-white/5 text-white/40 rounded-lg text-[10px] font-bold uppercase hover:bg-white/10 disabled:opacity-50">Dismiss</button>
              </div>
            )}
            {f.status === "acknowledged" && (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleResolve(f.id, "resolved")} disabled={actionLoading === f.id}
                  className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold uppercase hover:bg-green-500/20 disabled:opacity-50">Resolve</button>
              </div>
            )}
          </div>
        ))}
        {flags.length === 0 && (
          <p className="text-luxury-gold/30 text-sm text-center py-12">No flags found</p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AUDIT LOG TAB
   ══════════════════════════════════════════════════════════════════════════ */
function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/audit?page=${page}&limit=30`);
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } catch { setLogs([]); }
    })();
  }, [page]);

  const actionIcons = {
    create_moderator: "person_add",
    verify_customer: "verified",
    reject_customer: "cancel",
    raise_flag: "flag",
    flag_acknowledged: "visibility",
    flag_resolved: "check_circle",
    flag_dismissed: "delete",
  };

  return (
    <div>
      <div className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-4 bg-white/[0.02] rounded-lg p-4 hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-luxury-gold text-base">{actionIcons[l.action] || "info"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-luxury-cream text-sm">
                <strong>{l.actorName}</strong>{" "}
                <span className="text-luxury-gold/60">{l.action.replace(/_/g, " ")}</span>
                {l.targetType && <span className="text-luxury-gold/40"> → {l.targetType} #{l.targetId}</span>}
              </span>
            </div>
            <span className="text-luxury-gold/30 text-xs shrink-0">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-luxury-gold/30 text-sm text-center py-12">No audit entries yet</p>
        )}
      </div>
      {total > 30 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 bg-white/5 rounded text-luxury-cream text-xs disabled:opacity-30">Prev</button>
          <span className="px-4 py-2 text-luxury-gold/60 text-xs">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < 30}
            className="px-4 py-2 bg-white/5 rounded text-luxury-cream text-xs disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CREATE CIRCLE TAB
   ══════════════════════════════════════════════════════════════════════════ */
function CreateCircleTab() {
  const { address, isAdmin: isContractAdmin, wrongNetwork, connect, connecting } = useWeb3();
  const { createGroup, loading } = useContract();

  const [contribution, setContribution] = useState("");
  const [maxMembers, setMaxMembers]     = useState("4");
  const [poolType, setPoolType]         = useState("0");

  // Duration fields
  const [durValue, setDurValue] = useState("4");
  const [durUnit,  setDurUnit]  = useState("months"); // minutes|hours|days|months|years

  // Bidding window fields
  const [bidValue, setBidValue] = useState("5");
  const [bidUnit,  setBidUnit]  = useState("minutes");

  const UNIT_SECONDS = { minutes: 60, hours: 3600, days: 86400, months: 30 * 86400, years: 365 * 86400 };

  const toSeconds = (val, unit) => Math.floor(parseFloat(val || 0) * (UNIT_SECONDS[unit] || 1));

  const totalDurSec  = toSeconds(durValue, durUnit);
  const biddingWinSec = toSeconds(bidValue, bidUnit);
  const roundInterval = totalDurSec && maxMembers ? Math.floor(totalDurSec / parseInt(maxMembers || 1)) : 0;

  const fmtDuration = (sec) => {
    if (!sec) return "—";
    if (sec < 120)      return `${sec}s`;
    if (sec < 7200)     return `${Math.round(sec/60)}m`;
    if (sec < 172800)   return `${Math.round(sec/3600)}h`;
    if (sec < 60*86400) return `${Math.round(sec/86400)}d`;
    return `${Math.round(sec/(30*86400))} months`;
  };

  // Validation
  const biddingTooLong = biddingWinSec > 0 && roundInterval > 0 && biddingWinSec > roundInterval;

  // Auto-connect MetaMask when this tab is opened
  useEffect(() => { if (!address) connect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contribution || !maxMembers) return;
    if (wrongNetwork) { toast.error("Switch to Anvil (Chain ID 31337)"); return; }
    if (biddingTooLong) { toast.error("Bidding window exceeds round interval"); return; }
    const contribWei = parseEther(contribution);
    await createGroup(contribWei, Number(maxMembers), Number(poolType), totalDurSec, biddingWinSec, () => {
      toast.success("Circle deployed on-chain!");
      setContribution(""); setMaxMembers("4"); setPoolType("0");
      setDurValue("4"); setDurUnit("months"); setBidValue("5"); setBidUnit("minutes");
    });
  };

  const grossPool = contribution && maxMembers
    ? (parseFloat(contribution) * parseInt(maxMembers || 0)).toFixed(4) : null;

  // Wallet status banner
  const walletStatus = () => {
    if (connecting) return { icon: "progress_activity", text: "Connecting wallet…", color: "bg-blue-500/10 border-blue-500/20 text-blue-400", spin: true };
    if (!address) return { icon: "account_balance_wallet", text: "MetaMask not connected — click to connect", color: "bg-amber-500/10 border-amber-500/20 text-amber-400", action: connect };
    if (wrongNetwork) return { icon: "warning", text: "Wrong network — switch to Anvil (Chain ID 31337)", color: "bg-red-500/10 border-red-500/20 text-red-400" };
    if (!isContractAdmin) return { icon: "lock", text: `Connected (${address.slice(0,6)}…${address.slice(-4)}) — not contract owner`, color: "bg-red-500/10 border-red-500/20 text-red-400" };
    return { icon: "verified", text: `Wallet ready · ${address.slice(0,6)}…${address.slice(-4)}`, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
  };
  const ws = walletStatus();
  const canDeploy = address && isContractAdmin && !wrongNetwork && !biddingTooLong;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-luxury-cream placeholder:text-luxury-gold/20 focus:ring-2 focus:ring-luxury-crimson focus:border-transparent transition-all outline-none";
  const selectCls = "bg-white/5 border border-white/10 rounded-lg px-3 py-4 text-luxury-cream focus:ring-2 focus:ring-luxury-crimson focus:border-transparent outline-none text-sm shrink-0";

  return (
    <div className="max-w-2xl">
      <div className="glass-card rounded-xl p-8 gold-border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-9xl text-luxury-gold">group_add</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-luxury-crimson to-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">add_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-luxury-cream">Deploy New Circle</h2>
              <p className="text-luxury-gold/40 text-[10px] font-bold uppercase tracking-widest">On-chain group setup</p>
            </div>
          </div>

          {/* Wallet status bar */}
          <button type="button" onClick={ws.action} disabled={!ws.action}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold mb-6 transition-all ${ws.color} ${ws.action ? "hover:brightness-110 cursor-pointer" : "cursor-default"}`}
          >
            <span className={`material-symbols-outlined text-base ${ws.spin ? "animate-spin" : ""}`}>{ws.icon}</span>
            {ws.text}
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contribution Amount */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">Contribution Amount (ETH)</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-luxury-gold/50">payments</span>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-16 py-4 text-luxury-cream placeholder:text-luxury-gold/20 focus:ring-2 focus:ring-luxury-crimson focus:border-transparent transition-all outline-none"
                  placeholder="0.01" type="number" step="0.001" min="0.001"
                  value={contribution} onChange={(e) => setContribution(e.target.value)} required />
                <span className="absolute right-4 text-luxury-gold/50 font-bold text-sm">ETH</span>
              </div>
              <p className="text-luxury-gold/30 text-[10px]">Each member pays this amount as <strong className="text-luxury-gold/50">security deposit</strong> on join, and again as <strong className="text-luxury-gold/50">pool deposit</strong> each round.</p>
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">Number of Members</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-luxury-gold/50">group</span>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-luxury-cream placeholder:text-luxury-gold/20 focus:ring-2 focus:ring-luxury-crimson focus:border-transparent transition-all outline-none"
                  placeholder="4" type="number" min="2" max="20"
                  value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} required />
              </div>
              <p className="text-luxury-gold/30 text-[10px]">Number of members = number of rounds. Each member wins exactly once.</p>
            </div>

            {/* Scheme Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">Scheme Duration (Total Lifetime)</label>
              <div className="flex gap-3">
                <input className={inputCls} placeholder="4" type="number" min="1"
                  value={durValue} onChange={(e) => setDurValue(e.target.value)} required />
                <select className={selectCls} value={durUnit} onChange={(e) => setDurUnit(e.target.value)}>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {totalDurSec > 0 && maxMembers && (
                <p className="text-luxury-gold/40 text-[10px]">
                  Round frequency: <strong className="text-luxury-gold/60">1 round every {fmtDuration(roundInterval)}</strong>
                </p>
              )}
            </div>

            {/* Bidding Window */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">
                {poolType === "0" ? "Bidding Window per Round" : "Draw Window per Round"}
              </label>
              <div className="flex gap-3">
                <input className={`${inputCls} ${biddingTooLong ? "border-red-500/50 focus:ring-red-500" : ""}`}
                  placeholder="5" type="number" min="1"
                  value={bidValue} onChange={(e) => setBidValue(e.target.value)} required />
                <select className={selectCls} value={bidUnit} onChange={(e) => setBidUnit(e.target.value)}>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
              {biddingTooLong ? (
                <p className="text-red-400 text-[10px] font-bold">⚠ Bidding window ({fmtDuration(biddingWinSec)}) exceeds round interval ({fmtDuration(roundInterval)}). Reduce it.</p>
              ) : biddingWinSec > 0 && (
                <p className="text-luxury-gold/40 text-[10px]">
                  Window closes <strong className="text-luxury-gold/60">{fmtDuration(biddingWinSec)}</strong> after round opens. After that, anyone can call Settle Round.
                </p>
              )}
            </div>

            {/* Pool Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">Pool Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setPoolType("0")}
                  className={`p-5 rounded-xl border transition-all text-left ${poolType === "0" ? "bg-luxury-crimson/20 border-luxury-crimson text-luxury-cream" : "bg-white/5 border-white/10 text-luxury-gold/50 hover:border-white/20"}`}>
                  <span className="material-symbols-outlined text-2xl mb-2 block">gavel</span>
                  <span className="font-bold text-sm block">Auction</span>
                  <span className="text-xs opacity-60">Lowest bid wins; surplus split equally</span>
                </button>
                <button type="button" onClick={() => setPoolType("1")}
                  className={`p-5 rounded-xl border transition-all text-left ${poolType === "1" ? "bg-luxury-crimson/20 border-luxury-crimson text-luxury-cream" : "bg-white/5 border-white/10 text-luxury-gold/50 hover:border-white/20"}`}>
                  <span className="material-symbols-outlined text-2xl mb-2 block">casino</span>
                  <span className="font-bold text-sm block">Lucky Draw</span>
                  <span className="text-xs opacity-60">Random winner gets full net pool</span>
                </button>
              </div>
            </div>

            {/* Economic Preview */}
            {grossPool && totalDurSec > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-luxury-gold mb-3">Economic Preview</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-luxury-gold/50">Scheme Lifetime</span>
                  <span className="text-luxury-cream font-bold">{fmtDuration(totalDurSec)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-luxury-gold/50">Round Interval</span>
                  <span className="text-luxury-cream font-bold">{fmtDuration(roundInterval)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-luxury-gold/50">Bidding Window</span>
                  <span className="text-luxury-cream font-bold">{fmtDuration(biddingWinSec)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-luxury-gold/50">Gross Pool (per round)</span>
                    <span className="text-luxury-cream font-bold">{grossPool} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-luxury-gold/50">Platform Fee (10%)</span>
                    <span className="text-red-400 font-bold">-{(parseFloat(grossPool)*0.1).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-luxury-cream font-bold">Net Payout</span>
                    <span className="text-emerald-400 font-bold">{(parseFloat(grossPool)*0.9).toFixed(4)} ETH</span>
                  </div>
                </div>
                {poolType === "0" && (
                  <p className="text-luxury-gold/30 text-[10px] pt-1">Auction: winner receives their bid amount; leftover split equally among all members.</p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading || !canDeploy}
              className="w-full bg-gradient-to-r from-luxury-crimson to-rose-700 hover:brightness-110 text-white font-black uppercase text-sm tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-luxury-crimson/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>Deploying…</>
                : <><span className="material-symbols-outlined text-lg">rocket_launch</span>Deploy Circle</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MANAGE CIRCLES TAB
   ══════════════════════════════════════════════════════════════════════════ */
function ManageCirclesTab() {
  const { address, isAdmin: isContractAdmin, wrongNetwork, connect, connecting } = useWeb3();
  const {
    loading,
    getGroupCount, getGroupInfo, getGroupTiming, getGroupMembers, getMemberData, getMemberBid,
    settleRound, issueLoan, liquidateMember, withdrawPlatformFees, getPlatformBalance,
  } = useContract();

  const [circles, setCircles]           = useState([]);
  const [fetching, setFetching]         = useState(true);
  const [expanded, setExpanded]         = useState(null);
  const [members, setMembers]           = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [platformBal, setPlatformBal]   = useState(0n);
  const [now, setNow]                   = useState(Math.floor(Date.now() / 1000));

  // Loan form
  const [loanTarget, setLoanTarget]   = useState(null);
  const [loanAmount, setLoanAmount]   = useState("");
  const [loanInterest, setLoanInterest] = useState("");

  // Live clock for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtCountdown = (deadline) => {
    const diff = deadline - now;
    if (diff <= 0) return "Expired";
    if (diff < 60)   return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ${diff%60}s`;
    return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}m`;
  };

  const fmtDuration = (sec) => {
    if (!sec) return "—";
    if (sec < 120)       return `${sec}s`;
    if (sec < 7200)      return `${Math.round(sec/60)}m`;
    if (sec < 172800)    return `${Math.round(sec/3600)}h`;
    if (sec < 60*86400)  return `${Math.round(sec/86400)}d`;
    return `${Math.round(sec/(30*86400))} months`;
  };

  const phase = (info) => {
    if (info.memberCount === 0) return { label: "START", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    if (info.memberCount < info.maxMembers) return { label: "ENROLLING", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { label: "LIVE", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  };

  // Auto-connect wallet
  useEffect(() => { if (!address) connect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── fetch all circles ──
  const fetchCircles = useCallback(async () => {
    setFetching(true);
    try {
      const count = await getGroupCount();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const info   = await getGroupInfo(i);
        const timing = await getGroupTiming(i);
        list.push({ id: i, ...info, ...timing });
      }
      setCircles(list);
      const bal = await getPlatformBalance();
      setPlatformBal(bal);
    } catch (e) {
      console.error("Fetch circles failed:", e);
    } finally {
      setFetching(false);
    }
  }, [getGroupCount, getGroupInfo, getGroupTiming, getPlatformBalance]);

  useEffect(() => { if (address) fetchCircles(); }, [address, fetchCircles]);

  // ── fetch members for expanded circle ──
  const expandCircle = useCallback(async (groupId) => {
    if (expanded === groupId) { setExpanded(null); return; }
    setExpanded(groupId);
    setMembersLoading(true);
    try {
      const addrs = await getGroupMembers(groupId);
      const details = await Promise.all(addrs.map(async (addr) => {
        const d = await getMemberData(groupId, addr);
        const bid = await getMemberBid(groupId, addr);
        return { addr, ...d, bid };
      }));
      setMembers(details);
    } catch (e) {
      console.error("Fetch members failed:", e);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [expanded, getGroupMembers, getMemberData, getMemberBid]);

  // ── actions ──
  const handleSettleRound = async (groupId) => {
    await settleRound(groupId, () => {
      toast.success("Round settled for Circle #" + groupId);
      fetchCircles();
      if (expanded === groupId) expandCircle(groupId);
    });
  };

  const handleIssueLoan = async () => {
    if (!loanTarget || !loanAmount || !loanInterest) return;
    const lWei = parseEther(loanAmount);
    const iWei = parseEther(loanInterest);
    await issueLoan(loanTarget.groupId, loanTarget.addr, lWei, iWei, () => {
      toast.success("Loan issued!");
      setLoanTarget(null); setLoanAmount(""); setLoanInterest("");
      if (expanded === loanTarget.groupId) expandCircle(loanTarget.groupId);
    });
  };

  const handleLiquidate = async (groupId, addr) => {
    await liquidateMember(groupId, addr, () => {
      toast.success("Member liquidated");
      if (expanded === groupId) expandCircle(groupId);
      fetchCircles();
    });
  };

  const handleWithdrawFees = async () => {
    await withdrawPlatformFees(() => {
      toast.success("Platform fees withdrawn");
      fetchCircles();
    });
  };

  // ── wallet banner (same pattern as CreateCircleTab) ──
  const walletStatus = () => {
    if (connecting) return { icon: "progress_activity", text: "Connecting wallet…", color: "bg-blue-500/10 border-blue-500/20 text-blue-400", spin: true };
    if (!address) return { icon: "account_balance_wallet", text: "MetaMask not connected — click to connect", color: "bg-amber-500/10 border-amber-500/20 text-amber-400", action: connect };
    if (wrongNetwork) return { icon: "warning", text: "Wrong network — switch to Anvil (Chain ID 31337)", color: "bg-red-500/10 border-red-500/20 text-red-400" };
    if (!isContractAdmin) return { icon: "lock", text: `Connected (${shortenAddress(address)}) — not contract owner`, color: "bg-red-500/10 border-red-500/20 text-red-400" };
    return { icon: "verified", text: `Wallet ready · ${shortenAddress(address)}`, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
  };
  const ws = walletStatus();

  // ── RENDER ──
  return (
    <div className="space-y-6">
      {/* Wallet status bar */}
      <button
        type="button" onClick={ws.action} disabled={!ws.action}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all ${ws.color} ${ws.action ? "hover:brightness-110 cursor-pointer" : "cursor-default"}`}
      >
        <span className={`material-symbols-outlined text-base ${ws.spin ? "animate-spin" : ""}`}>{ws.icon}</span>
        {ws.text}
      </button>

      {/* Platform Fees Row */}
      <div className="glass-card rounded-xl p-5 gold-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-luxury-gold text-xl">account_balance</span>
          <div>
            <p className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest">Platform Fees Balance</p>
            <p className="text-xl font-black text-luxury-cream">{fmtEthSymbol(platformBal)}</p>
          </div>
        </div>
        <button
          onClick={handleWithdrawFees}
          disabled={loading || platformBal === 0n}
          className="bg-gradient-to-r from-luxury-crimson to-rose-700 hover:brightness-110 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Withdraw
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Circles", value: circles.length, icon: "target", color: "text-luxury-gold" },
          { label: "Active", value: circles.filter(c => c.isActive).length, icon: "radio_button_checked", color: "text-emerald-400" },
          { label: "Inactive", value: circles.filter(c => !c.isActive).length, icon: "radio_button_unchecked", color: "text-gray-400" },
          { label: "Live", value: circles.filter(c => c.memberCount === c.maxMembers).length, icon: "stream", color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 gold-border-subtle text-center">
            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <p className="text-2xl font-black text-luxury-cream mt-1">{s.value}</p>
            <p className="text-[10px] font-bold text-luxury-gold/40 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Loading / Empty / Circle list */}
      {fetching ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-luxury-gold text-3xl">progress_activity</span>
        </div>
      ) : circles.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center gold-border-subtle">
          <span className="material-symbols-outlined text-5xl text-luxury-gold/20 mb-3 block">deployed_code</span>
          <h3 className="text-luxury-cream font-black text-lg">No Circles Yet</h3>
          <p className="text-luxury-gold/40 text-sm mt-1">Deploy your first circle from the <strong>Create Circle</strong> tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {circles.map((c) => {
            const ph = phase(c);
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} className="glass-card rounded-xl gold-border-subtle overflow-hidden">
                {/* Circle header row */}
                <button
                  type="button"
                  onClick={() => expandCircle(c.id)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-luxury-crimson/60 to-rose-700/60 flex items-center justify-center">
                      <span className="text-white font-black text-sm">#{c.id}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-luxury-cream font-bold text-sm">Circle #{c.id}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ph.color}`}>{ph.label}</span>
                        <span className="text-[10px] font-bold text-luxury-gold/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {poolTypeName(c.poolType)}
                        </span>
                        {!c.isActive && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">CLOSED</span>
                        )}
                      </div>
                      <p className="text-luxury-gold/40 text-xs mt-0.5">
                        {fmtEthSymbol(c.contributionAmount)} · {c.memberCount}/{c.maxMembers} members · Round {c.currentRound}/{c.maxMembers}
                        {c.roundOpen && c.roundDeadline > 0 && (
                          <span className={`ml-2 font-bold ${c.roundDeadline > now ? "text-amber-400" : "text-emerald-400"}`}>
                            · {c.roundDeadline > now ? `⏱ ${fmtCountdown(c.roundDeadline)}` : "✓ Ready to settle"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-luxury-cream font-bold text-sm">{fmtEthSymbol(c.poolAmount)}</p>
                      <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">Pool</p>
                    </div>
                    <span className={`material-symbols-outlined text-luxury-gold/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-6 py-5 space-y-5 bg-white/[0.01]">
                    {/* Circle detail grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      {[
                        { label: "Type", value: poolTypeName(c.poolType) },
                        { label: "Contribution", value: fmtEthSymbol(c.contributionAmount) },
                        { label: "Members", value: `${c.memberCount} / ${c.maxMembers}` },
                        { label: "Round", value: `${c.currentRound} / ${c.maxMembers}` },
                        { label: "Pool", value: fmtEthSymbol(c.poolAmount) },
                        { label: "Active", value: c.isActive ? "Yes" : "No" },
                        { label: "Scheme Duration", value: fmtDuration(c.totalDuration) },
                        { label: "Bidding Window", value: fmtDuration(c.biddingWindow) },
                      ].map((d) => (
                        <div key={d.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                          <p className="text-[10px] font-bold text-luxury-gold/40 uppercase tracking-widest">{d.label}</p>
                          <p className="text-luxury-cream font-bold text-sm mt-1">{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Round status + Settle button */}
                    {c.isActive && c.roundOpen && (
                      <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-5 py-4 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-amber-400 text-xl">timer</span>
                          <div>
                            <p className="text-luxury-cream font-bold text-sm">Round {c.currentRound} bidding window</p>
                            {c.roundDeadline > now ? (
                              <p className="text-amber-400 text-xs font-bold">{fmtCountdown(c.roundDeadline)} remaining</p>
                            ) : (
                              <p className="text-emerald-400 text-xs font-bold">Window expired — ready to settle</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSettleRound(c.id)}
                          disabled={loading || c.roundDeadline > now}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          Settle Round
                        </button>
                      </div>
                    )}

                    {/* Member list */}
                    <div>
                      <h4 className="text-xs font-black text-luxury-gold/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">group</span>
                        Members ({c.memberCount})
                      </h4>
                      {membersLoading ? (
                        <div className="flex justify-center py-6">
                          <span className="material-symbols-outlined animate-spin text-luxury-gold text-xl">progress_activity</span>
                        </div>
                      ) : members.length === 0 ? (
                        <p className="text-luxury-gold/30 text-sm text-center py-4">No members enrolled yet</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map((m) => (
                            <div key={m.addr} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-luxury-crimson/20 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-luxury-crimson text-sm">person</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-luxury-cream font-bold text-xs font-mono">{shortenAddress(m.addr)}</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {m.isActive && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Active</span>}
                                    {!m.isActive && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Inactive</span>}
                                    {m.hasWon && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Won</span>}
                                    {m.hasActiveLoan && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Loan Active</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {/* Stats */}
                                <div className="hidden md:flex gap-4 text-right">
                                  <div>
                                    <p className="text-[9px] font-bold text-luxury-gold/40 uppercase">Contributed</p>
                                    <p className="text-luxury-cream font-bold text-xs">{fmtEthSymbol(m.totalContributed)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-luxury-gold/40 uppercase">Deposit</p>
                                    <p className="text-luxury-cream font-bold text-xs">{fmtEthSymbol(m.securityDeposit)}</p>
                                  </div>
                                  {m.bid > 0n && (
                                    <div>
                                      <p className="text-[9px] font-bold text-luxury-gold/40 uppercase">Bid</p>
                                      <p className="text-luxury-cream font-bold text-xs">{fmtEthSymbol(m.bid)}</p>
                                    </div>
                                  )}
                                  {m.hasActiveLoan && (
                                    <div>
                                      <p className="text-[9px] font-bold text-luxury-gold/40 uppercase">Loan</p>
                                      <p className="text-luxury-cream font-bold text-xs">{fmtEthSymbol(m.loanAmount)} + {fmtEthSymbol(m.loanInterest)}</p>
                                    </div>
                                  )}
                                </div>
                                {/* Actions */}
                                <div className="flex gap-1">
                                  <button
                                    title="Issue Loan"
                                    onClick={() => setLoanTarget({ groupId: c.id, addr: m.addr })}
                                    disabled={loading || !m.isActive}
                                    className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <span className="material-symbols-outlined text-sm">request_quote</span>
                                  </button>
                                  <button
                                    title="Liquidate Member"
                                    onClick={() => handleLiquidate(c.id, m.addr)}
                                    disabled={loading || !m.isActive}
                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <span className="material-symbols-outlined text-sm">person_remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Loan Modal ── */}
      {loanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setLoanTarget(null)}>
          <div className="glass-card rounded-2xl p-8 w-full max-w-md gold-border-subtle relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLoanTarget(null)} className="absolute top-4 right-4 text-luxury-gold/40 hover:text-luxury-cream transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400">request_quote</span>
              </div>
              <div>
                <h3 className="text-luxury-cream font-black text-lg">Issue Loan</h3>
                <p className="text-luxury-gold/40 text-xs">Circle #{loanTarget.groupId} · {shortenAddress(loanTarget.addr)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest block mb-1">Loan Amount (ETH)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-luxury-cream placeholder:text-luxury-gold/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.01"
                  type="number" step="0.001" min="0.001"
                  value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-luxury-gold/60 uppercase tracking-widest block mb-1">Interest (ETH)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-luxury-cream placeholder:text-luxury-gold/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.001"
                  type="number" step="0.0001" min="0"
                  value={loanInterest} onChange={(e) => setLoanInterest(e.target.value)}
                />
              </div>
              <button
                onClick={handleIssueLoan}
                disabled={loading || !loanAmount || !loanInterest}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-110 text-white font-black uppercase text-sm tracking-widest px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>Processing…</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">send</span>Issue Loan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared ────────────────────────────────────────────────────────────── */
function Loading() {
  return (
    <div className="flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-luxury-gold text-3xl">progress_activity</span>
    </div>
  );
}
