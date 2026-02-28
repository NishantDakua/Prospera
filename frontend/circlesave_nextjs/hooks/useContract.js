"use client";

import { useCallback, useState } from "react";
import { parseEther, formatEther } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import toast from "react-hot-toast";

/**
 * useContract — All smart contract interaction functions for ChitFundProtocol v2.
 * Every write function: try/catch → loading → toast → auto-refresh callback.
 */
export default function useContract() {
  const { contract, address, isAdmin } = useWeb3();
  const [loading, setLoading] = useState(false);

  // ── helper: execute a tx with UX scaffolding ──────────────────
  const exec = useCallback(
    async (label, fn, onSuccess) => {
      if (!contract) { toast.error("Wallet not connected"); return null; }
      setLoading(true);
      try {
        console.log(`[exec] Starting: ${label}`);
        const tx = await fn(contract);
        console.log(`[exec] TX sent:`, tx.hash);
        toast.loading(`${label} — confirming…`, { id: label });
        const receipt = await tx.wait();
        console.log(`[exec] TX confirmed:`, receipt.hash, "status:", receipt.status);
        toast.success(`${label} — confirmed!`, { id: label });
        if (onSuccess) await onSuccess(receipt);
        return receipt;
      } catch (e) {
        console.error(`[exec] ${label} FAILED:`, e);
        // Handle user rejection specifically
        if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
          toast.error(`${label}: Transaction rejected by user`, { id: label });
          return null;
        }
        const reason = e?.reason || e?.revert?.args?.[0] || e?.message || "Transaction failed";
        toast.error(`${label}: ${reason}`, { id: label });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [contract]
  );

  // ════════════════════════════════════════════════════════════
  // WRITE FUNCTIONS
  // ════════════════════════════════════════════════════════════

  /**
   * Create a new circle (admin only)
   * @param {bigint}  contributionWei   Per-member per-round deposit
   * @param {number}  maxMembers        Number of members (= number of rounds)
   * @param {number}  poolType          0 = Auction, 1 = LuckyDraw
   * @param {number}  totalDuration     Entire scheme duration in seconds
   * @param {number}  biddingWindow     Bidding/draw open window per round in seconds
   */
  const createGroup = useCallback(
    (contributionWei, maxMembers, poolType, totalDuration, biddingWindow, onSuccess) =>
      exec("Create Circle", (c) =>
        c.createGroup(contributionWei, maxMembers, poolType, totalDuration, biddingWindow),
        onSuccess),
    [exec]
  );

  /** Join a group — sends contributionAmount as security deposit */
  const joinGroup = useCallback(
    (groupId, depositWei, onSuccess) =>
      exec("Join Circle", (c) =>
        c.joinGroup(groupId, { value: depositWei }), onSuccess),
    [exec]
  );

  /** Contribute pool deposit for the current round */
  const contribute = useCallback(
    (groupId, amountWei, onSuccess) =>
      exec("Contribute", (c) =>
        c.contribute(groupId, { value: amountWei }), onSuccess),
    [exec]
  );

  /** Place a bid (Auction only — within bidding window) */
  const placeBid = useCallback(
    (groupId, bidAmountWei, onSuccess) =>
      exec("Place Bid", (c) =>
        c.placeBid(groupId, bidAmountWei), onSuccess),
    [exec]
  );

  /**
   * Settle the current round — callable by anyone after bidding window closes.
   * Covers missed deposits, selects winner, distributes payouts.
   */
  const settleRound = useCallback(
    (groupId, onSuccess) =>
      exec("Settle Round", async (c) => {
        const est = await c.settleRound.estimateGas(groupId);
        return c.settleRound(groupId, { gasLimit: est * 150n / 100n });
      }, onSuccess),
    [exec]
  );

  /** Issue a loan to a member (admin only) */
  const issueLoan = useCallback(
    (groupId, memberAddr, loanWei, interestWei, onSuccess) =>
      exec("Issue Loan", (c) =>
        c.issueLoan(groupId, memberAddr, loanWei, interestWei), onSuccess),
    [exec]
  );

  /** Liquidate a member (admin only) — forfeits their security deposit */
  const liquidateMember = useCallback(
    (groupId, memberAddr, onSuccess) =>
      exec("Liquidate Member", (c) =>
        c.liquidateMember(groupId, memberAddr), onSuccess),
    [exec]
  );

  /** Withdraw accumulated platform fees (admin only) */
  const withdrawPlatformFees = useCallback(
    (onSuccess) =>
      exec("Withdraw Fees", (c) =>
        c.withdrawPlatformFees(), onSuccess),
    [exec]
  );

  /** Withdraw all credited funds (winnings, surplus, deposit refunds) */
  const withdrawBalance = useCallback(
    async (onSuccess) => {
      if (!contract) { toast.error("Wallet not connected"); return null; }

      // Pre-check: show the user how much they're about to withdraw
      try {
        const bal = await contract.getWithdrawableBalance(address);
        console.log("[withdraw] Withdrawable balance for", address, ":", bal.toString());
        if (bal === 0n || bal === BigInt(0)) {
          toast.error("Nothing to withdraw — your withdrawable balance is 0");
          return null;
        }
        const ethAmt = Number(bal) / 1e18;
        toast.loading(`Withdrawing ${ethAmt.toFixed(4)} ETH…`, { id: "Withdraw Funds" });
      } catch (preErr) {
        console.error("[withdraw] Pre-check failed:", preErr);
      }

      // Estimate gas with buffer
      return exec("Withdraw Funds", async (c) => {
        const gasEst = await c.withdraw.estimateGas();
        return c.withdraw({ gasLimit: gasEst * 150n / 100n });
      }, onSuccess);
    },
    [exec, contract, address]
  );

  // ════════════════════════════════════════════════════════════
  // READ FUNCTIONS
  // ════════════════════════════════════════════════════════════

  /** Get total number of groups created */
  const getGroupCount = useCallback(async () => {
    if (!contract) return 0;
    const count = await contract.groupCount();
    return Number(count);
  }, [contract]);

  /**
   * Get core group info (no timing).
   * Returns: { poolType, contributionAmount, maxMembers, currentRound,
   *            poolAmount, isActive, memberCount }
   */
  const getGroupInfo = useCallback(async (groupId) => {
    if (!contract) return null;
    const info = await contract.getGroupInfo(groupId);
    return {
      poolType:           Number(info[0]),
      contributionAmount: info[1],
      maxMembers:         Number(info[2]),
      currentRound:       Number(info[3]),
      poolAmount:         info[4],
      isActive:           info[5],
      memberCount:        Number(info[6]),
    };
  }, [contract]);

  /**
   * Get timing info for a group.
   * Returns: { totalDuration, biddingWindow, schemeStartTime,
   *            roundStartTime, roundOpen, roundDeadline }
   */
  const getGroupTiming = useCallback(async (groupId) => {
    if (!contract) return null;
    const t = await contract.getGroupTiming(groupId);
    return {
      totalDuration:   Number(t[0]),
      biddingWindow:   Number(t[1]),
      schemeStartTime: Number(t[2]),
      roundStartTime:  Number(t[3]),
      roundOpen:       t[4],
      roundDeadline:   Number(t[5]),
    };
  }, [contract]);

  /** Get all member addresses for a group */
  const getGroupMembers = useCallback(async (groupId) => {
    if (!contract) return [];
    return await contract.getGroupMembers(groupId);
  }, [contract]);

  /**
   * Get a member's data.
   * Returns: { isActive, hasWon, hasActiveLoan, depositUsed,
   *            contributedThisRound, totalContributed, securityDeposit,
   *            loanAmount, loanInterest }
   */
  const getMemberData = useCallback(async (groupId, memberAddr) => {
    if (!contract) return null;
    const d = await contract.getMemberData(groupId, memberAddr);
    return {
      isActive:             d[0],
      hasWon:               d[1],
      hasActiveLoan:        d[2],
      depositUsed:          d[3],
      contributedThisRound: d[4],
      totalContributed:     d[5],
      securityDeposit:      d[6],
      loanAmount:           d[7],
      loanInterest:         d[8],
    };
  }, [contract]);

  /** Get a member's current bid for a group */
  const getMemberBid = useCallback(async (groupId, memberAddr) => {
    if (!contract) return 0n;
    return await contract.getMemberBid(groupId, memberAddr);
  }, [contract]);

  /** Get lowest bidder and lowest bid for a group */
  const getLowestBid = useCallback(async (groupId) => {
    if (!contract) return { bidder: null, amount: 0n };
    const r = await contract.getLowestBid(groupId);
    return { bidder: r[0], amount: r[1] };
  }, [contract]);

  /** Get platform accumulated balance */
  const getPlatformBalance = useCallback(async () => {
    if (!contract) return 0n;
    return await contract.platformBalance();
  }, [contract]);

  /** Get admin address */
  const getAdmin = useCallback(async () => {
    if (!contract) return null;
    return await contract.admin();
  }, [contract]);

  /** Get round interval in seconds (totalDuration / maxMembers) */
  const getRoundInterval = useCallback(async (groupId) => {
    if (!contract) return 0;
    const v = await contract.getRoundInterval(groupId);
    return Number(v);
  }, [contract]);

  /** Get the withdrawable balance for any address */
  const getWithdrawableBalance = useCallback(async (userAddr) => {
    if (!contract) return 0n;
    return await contract.getWithdrawableBalance(userAddr || address);
  }, [contract, address]);

  /**
   * Get full transaction history for a user by querying on-chain events.
   * Returns sorted array of { type, groupId, amount, timestamp, txHash, extra }.
   */
  const getTransactionHistory = useCallback(async (userAddr) => {
    if (!contract) return [];
    const addr = userAddr || address;
    if (!addr) return [];

    const fromBlock = 0;
    const txs = [];

    try {
      const addrLower = addr.toLowerCase();

      // 1. MemberJoined — NOT indexed on member, so fetch all & filter client-side
      const joinLogs = await contract.queryFilter(contract.filters.MemberJoined(), fromBlock);
      for (const log of joinLogs) {
        if (log.args[1]?.toLowerCase() !== addrLower) continue;
        const block = await log.getBlock();
        const groupId = Number(log.args[0]);
        let depositAmt = 0n;
        try { const info = await contract.getGroupInfo(groupId); depositAmt = info[1]; } catch {}
        txs.push({
          type: "join", groupId,
          amount: depositAmt, timestamp: block.timestamp,
          txHash: log.transactionHash,
        });
      }

      // 2. ContributionMade — NOT indexed on member, fetch all & filter
      const contribLogs = await contract.queryFilter(contract.filters.ContributionMade(), fromBlock);
      for (const log of contribLogs) {
        if (log.args[1]?.toLowerCase() !== addrLower) continue;
        const block = await log.getBlock();
        const groupId = Number(log.args[0]);
        let contribAmt = 0n;
        try { const info = await contract.getGroupInfo(groupId); contribAmt = info[1]; } catch {}
        txs.push({
          type: "contribute", groupId,
          round: Number(log.args[2]),
          amount: contribAmt, timestamp: block.timestamp,
          txHash: log.transactionHash,
        });
      }

      // 3. BidPlaced — NOT indexed on member, fetch all & filter
      const bidLogs = await contract.queryFilter(contract.filters.BidPlaced(), fromBlock);
      for (const log of bidLogs) {
        if (log.args[1]?.toLowerCase() !== addrLower) continue;
        const block = await log.getBlock();
        txs.push({
          type: "bid", groupId: Number(log.args[0]),
          amount: log.args[2], timestamp: block.timestamp,
          txHash: log.transactionHash,
        });
      }

      // 4. BalanceCredited — indexed on user, can filter directly
      const creditLogs = await contract.queryFilter(contract.filters.BalanceCredited(addr), fromBlock);
      for (const log of creditLogs) {
        const block = await log.getBlock();
        txs.push({
          type: "credit", amount: log.args[1],
          reason: log.args[2], timestamp: block.timestamp,
          txHash: log.transactionHash,
        });
      }

      // 5. Withdrawal — indexed on user, can filter directly
      const withdrawLogs = await contract.queryFilter(contract.filters.Withdrawal(addr), fromBlock);
      for (const log of withdrawLogs) {
        const block = await log.getBlock();
        txs.push({
          type: "withdraw", amount: log.args[1],
          timestamp: block.timestamp, txHash: log.transactionHash,
        });
      }

      // 6. RoundSettled — enrich credit entries with round/group info
      const settleLogs = await contract.queryFilter(contract.filters.RoundSettled(), fromBlock);
      const settleMap = {};
      for (const log of settleLogs) {
        if (log.args[2]?.toLowerCase() === addrLower) {
          settleMap[log.transactionHash] = { groupId: Number(log.args[0]), round: Number(log.args[1]) };
        }
      }
      for (const tx of txs) {
        if (tx.type === "credit" && tx.reason === "round_winner" && settleMap[tx.txHash]) {
          tx.groupId = settleMap[tx.txHash].groupId;
          tx.round = settleMap[tx.txHash].round;
        }
      }
    } catch (e) {
      console.error("Error fetching tx history:", e);
    }

    // Sort newest first
    txs.sort((a, b) => b.timestamp - a.timestamp);
    return txs;
  }, [contract, address]);

  return {
    loading,
    // writes
    createGroup,
    joinGroup,
    contribute,
    placeBid,
    settleRound,
    issueLoan,
    liquidateMember,
    withdrawPlatformFees,
    withdrawBalance,
    // reads
    getGroupCount,
    getGroupInfo,
    getGroupTiming,
    getGroupMembers,
    getMemberData,
    getMemberBid,
    getLowestBid,
    getPlatformBalance,
    getAdmin,
    getRoundInterval,
    getWithdrawableBalance,
    getTransactionHistory,
  };
}
