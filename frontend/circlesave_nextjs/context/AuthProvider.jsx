"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, fullName, phone, walletAddress, kycStatus }
  const [loading, setLoading] = useState(true);  // initial session check

  /**
   * Fetch current session from /api/auth/me
   */
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Signup → auto-login
   */
  const signup = async ({ email, password, fullName, phone }) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    await fetchUser();
    return data;
  };

  /**
   * Login
   */
  const login = async ({ email, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    await fetchUser();
    return data;
  };

  /**
   * Logout
   */
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  /**
   * Link wallet address to the account
   */
  const linkWallet = async (walletAddress) => {
    const res = await fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to link wallet");
    await fetchUser();
    return data;
  };

  /**
   * Submit KYC
   */
  const submitKyc = async (kycData) => {
    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kycData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "KYC submission failed");
    await fetchUser();
    return data;
  };

  const isAuthenticated = !!user;
  const isKycDone = user?.kycStatus === "submitted" || user?.kycStatus === "verified";

  /* ── Role helpers ─────────────────────────────────────────────────── */
  const role = user?.role || "customer";
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isCustomer = role === "customer";
  const isVerified = !!user?.isVerified; // admin / moderator approved

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isKycDone,
        role,
        isAdmin,
        isModerator,
        isCustomer,
        isVerified,
        signup,
        login,
        logout,
        linkWallet,
        submitKyc,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
