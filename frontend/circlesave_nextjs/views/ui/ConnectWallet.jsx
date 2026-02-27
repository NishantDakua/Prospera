"use client";

import { useWeb3 } from "@/context/Web3Provider";
import { shortenAddress } from "@/lib/utils";

/**
 * Wallet connect button + admin badge + network indicator.
 * Drop this into any header.
 */
export default function ConnectWallet() {
  const { address, isAdmin, connecting, wrongNetwork, connect, CHAIN_NAME } =
    useWeb3();

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-2 premium-gradient text-white font-bold uppercase tracking-widest px-6 py-3 rounded-lg text-xs hover:brightness-110 transition-all shadow-lg shadow-brand-crimson/20 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          account_balance_wallet
        </span>
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Network badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          wrongNetwork
            ? "bg-red-500/10 text-red-400 border-red-500/20"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}
      >
        <span
          className={`size-2 rounded-full ${
            wrongNetwork
              ? "bg-red-500 animate-pulse"
              : "bg-emerald-500"
          }`}
        />
        {wrongNetwork ? "Wrong Network" : CHAIN_NAME}
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-1.5 bg-brand-crimson/10 text-brand-crimson px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-crimson/20">
          <span className="material-symbols-outlined text-xs">
            admin_panel_settings
          </span>
          Admin
        </div>
      )}

      {/* Address pill */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
        <span className="size-2 rounded-full bg-brand-gold" />
        <span className="text-xs font-bold text-brand-ivory">
          {shortenAddress(address)}
        </span>
      </div>
    </div>
  );
}
