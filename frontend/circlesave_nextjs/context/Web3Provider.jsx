"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, CHAIN_NAME, RPC_URL } from "@/lib/contract";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletConflict, setWalletConflict] = useState(false); // wallet taken by another account

  const wrongNetwork = address !== null && chainId !== null && chainId !== CHAIN_ID;

  // ── Connect wallet ─────────────────────────────────────────
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not found. Please install MetaMask.");
      return;
    }
    try {
      setConnecting(true);
      setError(null);

      // Request accounts first
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Check current chain and auto-switch if wrong
      const currentChainHex = await window.ethereum.request({ method: "eth_chainId" });
      const currentChain = parseInt(currentChainHex, 16);
      const targetHex = "0x" + CHAIN_ID.toString(16);

      if (currentChain !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetHex }],
          });
        } catch (switchErr) {
          // Chain doesn't exist in MetaMask — add it
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: targetHex,
                chainName: CHAIN_NAME,
                rpcUrls: [RPC_URL],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }

      // Now create provider after chain is correct
      const bp = new BrowserProvider(window.ethereum);
      const s = await bp.getSigner();
      const network = await bp.getNetwork();
      const cid = Number(BigInt(network.chainId));
      const accounts = await bp.send("eth_accounts", []);

      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);

      setProvider(bp);
      setSigner(s);
      setContract(c);
      setAddress(accounts[0]);
      setChainId(cid);

      // Check admin
      if (cid === CHAIN_ID) {
        try {
          const adminAddr = await c.admin();
          setIsAdmin(adminAddr.toLowerCase() === accounts[0].toLowerCase());
        } catch { setIsAdmin(false); }
      }

      // Auto-bind wallet to current account (one wallet → one account rule)
      try {
        setWalletConflict(false);
        const res = await fetch("/api/auth/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: accounts[0] }),
        });
        if (res.status === 409) {
          // Wallet is taken by another account — flag it but don't disconnect
          setWalletConflict(true);
          setError("This wallet is already linked to a different account.");
        }
        // 401 = not logged in (guest) — silently ignore
      } catch {
        // Network error during bind — non-fatal, ignore
      }
    } catch (e) {
      setError(e?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Listen for account / chain changes ─────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
        setContract(null);
        setIsAdmin(false);
        setWalletConflict(false);
        setError(null);
      } else {
        connect();
      }
    };

    const handleChainChanged = () => {
      connect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect]);

  // Auto-connect if already authorized
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) connect();
    });
  }, [connect]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        address,
        chainId,
        isAdmin,
        connecting,
        error,
        wrongNetwork,
        walletConflict,
        connect,
        CHAIN_NAME,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within <Web3Provider>");
  return ctx;
}
