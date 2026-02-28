/**
 * Trust Score Engine — Computes a 0–1000 reputation score for chit fund members
 * based entirely on on-chain behaviour.
 *
 * Model: Everyone starts at 800 ("Excellent"). Good behaviour earns
 * bonuses toward 1000 (S-tier). Bad behaviour deducts from 800.
 *
 * Bonuses (push toward S):
 * ─────────────────────────────────────────────────────────────────
 *  1. On-time contribution rate     (+0 to +100)
 *  2. Deposit integrity             (+0 to +50)
 *  3. Circles completed             (+0 to +50)
 *
 * Penalties (pull down from A):
 * ─────────────────────────────────────────────────────────────────
 *  4. Missed payments               (−50 each)
 *  5. Outstanding loans             (−75 each)
 *  6. Liquidations                  (−150 each)
 * ─────────────────────────────────────────────────────────────────
 *
 * Letter grades:   900+ = S  |  800+ = A  |  650+ = B  |  500+ = C  |  350+ = D  |  <350 = F
 */

// ─── Grade thresholds ────────────────────────────────────
const GRADES = [
  { min: 900, letter: "S",  label: "Exceptional",  color: "text-yellow-400",   bg: "bg-yellow-500/15",  border: "border-yellow-500/30",  ring: "ring-yellow-500/40" },
  { min: 800, letter: "A",  label: "Excellent",    color: "text-emerald-400",  bg: "bg-emerald-500/15", border: "border-emerald-500/30", ring: "ring-emerald-500/40" },
  { min: 650, letter: "B",  label: "Good",         color: "text-blue-400",     bg: "bg-blue-500/15",    border: "border-blue-500/30",    ring: "ring-blue-500/40" },
  { min: 500, letter: "C",  label: "Average",      color: "text-slate-300",    bg: "bg-slate-500/15",   border: "border-slate-500/30",   ring: "ring-slate-500/40" },
  { min: 350, letter: "D",  label: "Below Average", color: "text-orange-400",  bg: "bg-orange-500/15",  border: "border-orange-500/30",  ring: "ring-orange-500/40" },
  { min: 0,   letter: "F",  label: "Poor",         color: "text-red-400",      bg: "bg-red-500/15",     border: "border-red-500/30",     ring: "ring-red-500/40" },
];

export function getGrade(score) {
  return GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
}

/**
 * Compute trust score from on-chain data aggregated across all circles.
 *
 * @param {Object} data
 * @param {number} data.totalContributionsMade   — count of ContributionMade events for this user
 * @param {number} data.totalMissedPayments      — count of DepositUsedForMissedPayment events
 * @param {number} data.circlesJoined            — distinct groups the user is/was a member of
 * @param {number} data.circlesCompleted         — groups where all rounds finished (scheme completed)
 * @param {number} data.depositsIntact           — number of circles where depositUsed == false
 * @param {number} data.depositsUsed             — number of circles where depositUsed == true
 * @param {number} data.activeLoans              — current active loan count
 * @param {number} data.roundsWon                — total rounds won across all circles
 * @param {number} data.liquidations             — count of MemberLiquidated events
 * @param {number} data.expectedContributions    — total contribution slots (sum of currentRound across all groups)
 * @returns {{ score: number, grade: Object, breakdown: Object[] }}
 */
export function computeTrustScore(data) {
  const breakdown = [];

  // ── Base model: everyone starts at 800 ("Excellent") ───
  // Positive actions push toward 1000 (S-tier).
  // Negative actions pull you down from 800.
  const BASE_SCORE = 800;

  breakdown.push({
    label: "Base Score",
    score: BASE_SCORE,
    max: BASE_SCORE,
    detail: "Everyone starts at Excellent (800)",
    icon: "star",
  });

  // 1 ── On-time contribution rate (0 to +100 bonus) ─────
  //      Perfect on-time record earns up to +100 on top of base.
  //      If no contributions yet, you keep full base (benefit of the doubt).
  const totalExpected = data.expectedContributions || 0;
  let contribScore = 100; // default: full marks (no history = clean record)
  if (totalExpected > 0) {
    const onTimeRate = Math.min(data.totalContributionsMade / totalExpected, 1);
    contribScore = Math.round(onTimeRate * 100);
  }
  breakdown.push({
    label: "On-time Contributions",
    score: contribScore,
    max: 100,
    detail: totalExpected > 0
      ? `${data.totalContributionsMade}/${totalExpected} rounds paid on time`
      : "No contributions expected yet — clean record",
    icon: "payments",
  });

  // 2 ── Deposit integrity (0 to +50 bonus) ──────────────
  //      Full points if deposit never used in any circle.
  const totalCirclesWithDeposit = data.depositsIntact + data.depositsUsed;
  let depositScore = 50; // default: clean
  if (totalCirclesWithDeposit > 0) {
    const depositRate = data.depositsIntact / totalCirclesWithDeposit;
    depositScore = Math.round(depositRate * 50);
  }
  breakdown.push({
    label: "Deposit Integrity",
    score: depositScore,
    max: 50,
    detail: totalCirclesWithDeposit > 0
      ? `${data.depositsIntact}/${totalCirclesWithDeposit} circles with deposit intact`
      : "No circles yet — clean record",
    icon: "shield",
  });

  // 3 ── Circles completed (0 to +50 bonus) ──────────────
  //      Rewards finishing full chit fund cycles. Bonus on top of base.
  let completedScore = 0;
  if (data.circlesCompleted >= 1) completedScore += 20;
  if (data.circlesCompleted >= 2) completedScore += 15;
  if (data.circlesCompleted >= 3) completedScore += Math.min((data.circlesCompleted - 2) * 5, 15);
  completedScore = Math.min(completedScore, 50);
  breakdown.push({
    label: "Circles Completed",
    score: completedScore,
    max: 50,
    detail: `${data.circlesCompleted} circle${data.circlesCompleted !== 1 ? "s" : ""} fully completed`,
    icon: "task_alt",
  });

  // 4 ── Missed payments penalty (0 to -200) ─────────────
  //      Each missed payment (deposit used to cover) deducts points.
  const missedPenalty = Math.min(data.totalMissedPayments * -50, 0);
  if (data.totalMissedPayments > 0) {
    breakdown.push({
      label: "Missed Payments",
      score: missedPenalty,
      max: 0,
      detail: `${data.totalMissedPayments} missed payment${data.totalMissedPayments !== 1 ? "s" : ""} (deposit used)`,
      icon: "warning",
    });
  }

  // 5 ── Loan penalty (0 to -150) ────────────────────────
  //      Each active loan deducts points from base.
  const loanPenalty = Math.min(data.activeLoans * -75, 0);
  if (data.activeLoans > 0) {
    breakdown.push({
      label: "Outstanding Loans",
      score: loanPenalty,
      max: 0,
      detail: `${data.activeLoans} active loan${data.activeLoans !== 1 ? "s" : ""}`,
      icon: "account_balance",
    });
  }

  // 6 ── Liquidation penalty (0 to -300) ─────────────────
  //      Each liquidation is a severe negative signal.
  const liquidationPenalty = Math.min(data.liquidations * -150, 0);
  if (data.liquidations > 0) {
    breakdown.push({
      label: "Liquidation Penalty",
      score: liquidationPenalty,
      max: 0,
      detail: `${data.liquidations} liquidation${data.liquidations !== 1 ? "s" : ""} on record`,
      icon: "dangerous",
    });
  }

  // Sum: base + bonuses + penalties, clamp to 0-1000
  const bonuses = contribScore + depositScore + completedScore;
  const penalties = missedPenalty + loanPenalty + liquidationPenalty;
  const rawScore = BASE_SCORE + bonuses + penalties;
  const score = Math.max(0, Math.min(1000, rawScore));
  const grade = getGrade(score);

  return { score, grade, breakdown };
}

/**
 * Gather scoring data from on-chain state for a specific user address.
 * Works entirely from contract read calls + event queries.
 *
 * @param {Object}   contract    — ethers Contract instance
 * @param {string}   userAddr    — address to score
 * @param {Function} getGroupInfo — from useContract hook
 * @param {Function} getMemberData — from useContract hook
 * @returns {Promise<Object>}    — data object suitable for computeTrustScore()
 */
export async function gatherScoreData(contract, userAddr, getGroupInfo, getMemberData) {
  if (!contract || !userAddr) {
    return {
      totalContributionsMade: 0,
      totalMissedPayments: 0,
      circlesJoined: 0,
      circlesCompleted: 0,
      depositsIntact: 0,
      depositsUsed: 0,
      activeLoans: 0,
      roundsWon: 0,
      liquidations: 0,
      expectedContributions: 0,
    };
  }

  const addrLower = userAddr.toLowerCase();

  // Count event occurrences
  let totalContributionsMade = 0;
  let totalMissedPayments = 0;
  let liquidations = 0;

  try {
    // ContributionMade events (not indexed on member — filter client-side)
    const contribLogs = await contract.queryFilter(contract.filters.ContributionMade(), 0);
    totalContributionsMade = contribLogs.filter(
      (l) => l.args[1]?.toLowerCase() === addrLower
    ).length;

    // DepositUsedForMissedPayment events
    const missedLogs = await contract.queryFilter(contract.filters.DepositUsedForMissedPayment(), 0);
    totalMissedPayments = missedLogs.filter(
      (l) => l.args[1]?.toLowerCase() === addrLower
    ).length;

    // MemberLiquidated events
    const liqLogs = await contract.queryFilter(contract.filters.MemberLiquidated(), 0);
    liquidations = liqLogs.filter(
      (l) => l.args[1]?.toLowerCase() === addrLower
    ).length;
  } catch (e) {
    console.error("TrustScore event query error:", e);
  }

  // Per-group stats
  let circlesJoined = 0;
  let circlesCompleted = 0;
  let depositsIntact = 0;
  let depositsUsed = 0;
  let activeLoans = 0;
  let roundsWon = 0;
  let expectedContributions = 0;

  try {
    const count = Number(await contract.groupCount());

    for (let i = 1; i <= count; i++) {
      const members = await contract.getGroupMembers(i);
      const membersLower = members.map((m) => m.toLowerCase());
      if (!membersLower.includes(addrLower)) continue;

      circlesJoined++;

      const memberOnChain = members.find((m) => m.toLowerCase() === addrLower);
      const info = await getGroupInfo(i);
      const md = await getMemberData(i, memberOnChain);

      // Deposit integrity
      if (md.depositUsed) depositsUsed++;
      else depositsIntact++;

      // Active loans
      if (md.hasActiveLoan) activeLoans++;

      // Rounds won
      if (md.hasWon) roundsWon++;

      // Completed circles — when currentRound > maxMembers, all rounds are done
      if (info.currentRound > info.maxMembers || !info.isActive) {
        // If the group finished (round exceeds max or group deactivated)
        if (info.currentRound > info.maxMembers) circlesCompleted++;
      }

      // Expected contributions = min(currentRound, maxMembers) for this member
      // (won members stop contributing after winning, but we still count for simplicity)
      const roundsElapsed = Math.min(info.currentRound, info.maxMembers);
      expectedContributions += roundsElapsed;
    }
  } catch (e) {
    console.error("TrustScore group iteration error:", e);
  }

  return {
    totalContributionsMade,
    totalMissedPayments,
    circlesJoined,
    circlesCompleted,
    depositsIntact,
    depositsUsed,
    activeLoans,
    roundsWon,
    liquidations,
    expectedContributions,
  };
}
