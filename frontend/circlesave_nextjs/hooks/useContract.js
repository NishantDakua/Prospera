"use client";

import { useCallback, useState } from "react";
import { parseEther } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import toast from "react-hot-toast";

/**
 * useContract — All smart contract interaction functions.
 * Every write function: try/catch → loading → toast → auto-refresh callback.
 */
export default function useContract() {
  const { contract, address, isAdmin } = useWeb3();
  const [loading, setLoading] = useState(false);

  // ── helper: execute a tx with UX scaffolding ───────────────
  const exec = useCallback(
    async (label, fn, onSuccess) => {
      if (!contract) {
        toast.error("Wallet not connected");
        return null;
      }
      setLoading(true);
      try {
        const tx = await fn(contract);
        toast.loading(`${label} — confirming…`, { id: label });
        const receipt = await tx.wait();
        toast.success(`${label} — confirmed!`, { id: label });
        if (onSuccess) await onSuccess(receipt);
        return receipt;
      } catch (e) {
        const reason =
          e?.reason || e?.revert?.args?.[0] || e?.message || "Transaction failed";
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

  /** Create a new group (admin only) */
  const createGroup = useCallback(
    (contributionWei, maxMembers, poolType, onSuccess) =>
      exec("Create Group", (c) =>
        c.createGroup(contributionWei, maxMembers, poolType), onSuccess),
    [exec]
  );

  /** Join a group (sends contribution as security deposit) */
  const joinGroup = useCallback(
    (groupId, depositWei, onSuccess) =>
      exec("Join Group", (c) =>
        c.joinGroup(groupId, { value: depositWei }), onSuccess),
    [exec]
  );

  /** Contribute to a group's current round */
  const contribute = useCallback(
    (groupId, amountWei, onSuccess) =>
      exec("Contribute", (c) =>
        c.contribute(groupId, { value: amountWei }), onSuccess),
    [exec]
  );

  /** Place a bid (Auction only) */
  const placeBid = useCallback(
    (groupId, bidAmountWei, onSuccess) =>
      exec("Place Bid", (c) =>
        c.placeBid(groupId, bidAmountWei), onSuccess),
    [exec]
  );

  /** Select winner for the current round (admin only) */
  const selectWinner = useCallback(
    (groupId, onSuccess) =>
      exec("Select Winner", (c) =>
        c.selectWinner(groupId), onSuccess),
    [exec]
  );

  /** Issue a loan to a member (admin only) */
  const issueLoan = useCallback(
    (groupId, memberAddr, loanWei, interestWei, onSuccess) =>
      exec("Issue Loan", (c) =>
        c.issueLoan(groupId, memberAddr, loanWei, interestWei), onSuccess),
    [exec]
  );

  /** Liquidate a member (admin only) */
  const liquidateMember = useCallback(
    (groupId, memberAddr, onSuccess) =>
      exec("Liquidate Member", (c) =>
        c.liquidateMember(groupId, memberAddr), onSuccess),
    [exec]
  );

  /** Withdraw platform fees (admin only) */
  const withdrawPlatformFees = useCallback(
    (onSuccess) =>
      exec("Withdraw Fees", (c) =>
        c.withdrawPlatformFees(), onSuccess),
    [exec]
  );

  // ════════════════════════════════════════════════════════════
  // READ FUNCTIONS
  // ════════════════════════════════════════════════════════════

  /** Get group count */
  const getGroupCount = useCallback(async () => {
    if (!contract) return 0;
    const count = await contract.groupCount();
    return Number(count);
  }, [contract]);

  /** Get group info */
  const getGroupInfo = useCallback(
    async (groupId) => {
      if (!contract) return null;
      const info = await contract.getGroupInfo(groupId);
      return {
        poolType: Number(info[0]),
        contributionAmount: info[1],
        maxMembers: Number(info[2]),
        currentRound: Number(info[3]),
        poolAmount: info[4],
        isActive: info[5],
        memberCount: Number(info[6]),
        lowestBidder: info[7],
        lowestBid: info[8],
      };
    },
    [contract]
  );

  /** Get members list */
  const getGroupMembers = useCallback(
    async (groupId) => {
      if (!contract) return [];
      return await contract.getGroupMembers(groupId);
    },
    [contract]
  );

  /** Get member data */
  const getMemberData = useCallback(
    async (groupId, memberAddr) => {
      if (!contract) return null;
      const d = await contract.getMemberData(groupId, memberAddr);
      return {
        isActive: d[0],
        hasWon: d[1],
        totalContributed: d[2],
        securityDeposit: d[3],
        loanAmount: d[4],
        loanInterest: d[5],
        hasActiveLoan: d[6],
      };
    },
    [contract]
  );

  /** Get member's bid in a group */
  const getMemberBid = useCallback(
    async (groupId, memberAddr) => {
      if (!contract) return 0n;
      return await contract.getMemberBid(groupId, memberAddr);
    },
    [contract]
  );

  /** Get platform balance */
  const getPlatformBalance = useCallback(async () => {
    if (!contract) return 0n;
    return await contract.platformBalance();
  }, [contract]);

  /** Get admin address */
  const getAdmin = useCallback(async () => {
    if (!contract) return null;
    return await contract.admin();
  }, [contract]);

  return {
    loading,
    // writes
    createGroup,
    joinGroup,
    contribute,
    placeBid,
    selectWinner,
    issueLoan,
    liquidateMember,
    withdrawPlatformFees,
    // reads
    getGroupCount,
    getGroupInfo,
    getGroupMembers,
    getMemberData,
    getMemberBid,
    getPlatformBalance,
    getAdmin,
  };
}
