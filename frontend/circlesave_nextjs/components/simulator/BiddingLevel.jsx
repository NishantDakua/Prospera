"use client";

import { useState, useCallback } from "react";
import SimCard from "./ui/Card";
import SimButton from "./ui/Button";
import FloatingXP, { useXPTrigger } from "./ui/FloatingXP";

/* ── Members ──────────────────────────────────────────────── */
const MEMBERS = [
  { id: 1, name: "You",    initial: "Y", color: "#D5BF86", isUser: true },
  { id: 2, name: "Rahul",  initial: "R", color: "#60A5FA" },
  { id: 3, name: "Priya",  initial: "P", color: "#F472B6" },
  { id: 4, name: "Amit",   initial: "A", color: "#34D399" },
  { id: 5, name: "Sneha",  initial: "S", color: "#FBBF24" },
];

const POOL_TOTAL = 50000;

/* ── Phases ───────────────────────────────────────────────── */
const PHASE_LABELS = [
  { key: "learn",   label: "Learn",    icon: "menu_book" },
  { key: "watch",   label: "Watch",    icon: "visibility" },
  { key: "bid",     label: "Your Bid", icon: "my_location" },
  { key: "results", label: "Results",  icon: "emoji_events" },
];

/* Bot bids — pre-scripted so user can read through at own pace */
const BOT_BIDS = [
  { member: MEMBERS[1], amount: 2000, reason: "Rahul needs to repair his shop roof this month. He bids ₹2,000." },
  { member: MEMBERS[2], amount: 3500, reason: "Priya wants to pay her daughter's school fees. She outbids Rahul with ₹3,500." },
  { member: MEMBERS[3], amount: 5000, reason: "Amit has a medical emergency. He bids the highest yet — ₹5,000." },
  { member: MEMBERS[4], amount: 4200, reason: "Sneha tries to outbid but stops at ₹4,200. She'll try next month." },
];

/* ── Phase bar ────────────────────────────────────────────── */
function PhaseBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {PHASE_LABELS.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={p.key} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all duration-500 ${
                done
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : active
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30"
                  : "bg-white/[0.02] text-luxury-cream/25 border border-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{done ? "check" : p.icon}</span>
              <span>{p.label}</span>
            </div>
            {i < PHASE_LABELS.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-colors duration-500"
                style={{ backgroundColor: done ? "#10B981" : "#1F2937" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Bid Card (for watch phase) ──────────────────────────── */
function BidCard({ bid, index, isHighest }) {
  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-xl border transition-all duration-500 ${
        isHighest
          ? "bg-[#F59E0B]/8 border-[#F59E0B]/30"
          : "bg-white/[0.02] border-white/8"
      }`}
      style={{ animation: `fadeIn 0.4s ${index * 0.15}s both` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ backgroundColor: `${bid.member.color}20`, color: bid.member.color }}
          >
            {bid.member.initial}
          </div>
          <span className="font-bold text-sm text-luxury-cream">{bid.member.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#F59E0B]">₹{bid.amount.toLocaleString()}</span>
          {isHighest && (
            <span className="text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded-full font-black uppercase">
              Highest
            </span>
          )}
        </div>
      </div>
      <p className="text-luxury-cream/50 text-xs leading-relaxed">{bid.reason}</p>
    </div>
  );
}

export default function BiddingLevel({ onNext, onUpdateState, onAction }) {
  const [phase, setPhase] = useState(0);         // 0=learn, 1=watch, 2=bid, 3=results
  const [visibleBids, setVisibleBids] = useState(0);
  const [userBid, setUserBid] = useState(3000);
  const [bidPlaced, setBidPlaced] = useState(false);
  const { showXP, triggerXP } = useXPTrigger();

  /* Show next bot bid — user clicks "Next Bid" to advance */
  const showNextBid = useCallback(() => {
    if (visibleBids < BOT_BIDS.length) {
      setVisibleBids((v) => v + 1);
      onAction?.(5); // small XP reward for watching
    }
  }, [visibleBids, onAction]);

  /* Highest bid across all visible bot bids */
  const visibleBotBids = BOT_BIDS.slice(0, visibleBids);
  const highestBot = visibleBotBids.reduce(
    (max, b) => (b.amount > max.amount ? b : max),
    { amount: 0, member: null }
  );

  /* Handle user placing bid */
  const handlePlaceBid = () => {
    setBidPlaced(true);
    onAction?.(10);
  };

  /* Finalize auction & move to results */
  const finalizeAuction = () => {
    const allBids = [...BOT_BIDS, { member: MEMBERS[0], amount: userBid }];
    const winner = allBids.reduce((max, b) => (b.amount > max.amount ? b : max));
    const payout = POOL_TOTAL - winner.amount;
    const userWon = winner.member.isUser;

    onUpdateState({
      bid: userBid,
      biddingWinner: winner.member.name,
      biddingPayout: payout,
      userWon,
      winningDiscount: winner.amount,
    });
    triggerXP();
    onAction?.(100);
    setPhase(3);
  };

  /* Determine final winner for results phase */
  const allBids = bidPlaced
    ? [...BOT_BIDS, { member: MEMBERS[0], amount: userBid, reason: "Your bid." }]
    : BOT_BIDS;
  const finalWinner = allBids.reduce((max, b) => (b.amount > max.amount ? b : max), { amount: 0 });
  const finalPayout = POOL_TOTAL - finalWinner.amount;

  return (
    <div className="flex flex-col gap-8">
      {/* Header – arcade style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              background: "#1A2D50",
              border: "2px solid #F59E0B",
              color: "#F59E0B",
              boxShadow: "0 0 10px #F59E0B55, inset 0 0 8px #F59E0B11",
              fontFamily: "monospace",
            }}
          >
            <span>★</span> WORLD 1-2
          </div>
          <span className="text-[#F59E0B] text-xs font-extrabold">+100 XP</span>
        </div>
        <h2 className="text-2xl font-extrabold text-luxury-cream tracking-tight">Level 2: Auction Round</h2>
        <p className="text-luxury-cream/50 text-sm leading-relaxed">
          Understand how pool auctions work. Watch others bid, then place your own — no time pressure!
        </p>
      </div>

      {/* Phase bar */}
      <PhaseBar current={phase} />

      {/* ═══════ PHASE 0 — Learn ═══════════════════════════ */}
      {phase === 0 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
            <span className="material-symbols-outlined text-xl mt-0.5 text-[#F59E0B]">menu_book</span>
            <div className="flex flex-col gap-2">
              <p className="text-[#F59E0B] text-xs font-extrabold uppercase tracking-widest">How Auctions Work</p>
              <p className="text-luxury-cream/60 text-sm leading-relaxed">
                Each month, the pool collects <span className="text-luxury-gold font-bold">₹50,000</span> (10 members × ₹5,000). Members who need money urgently bid a <span className="text-[#F59E0B] font-bold">discount</span> — the member willing to accept the biggest discount wins the pot.
              </p>
            </div>
          </div>

          <SimCard>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest">Understanding the Auction</p>

              <div className="flex flex-col gap-3">
                {[
                  { num: "1", title: "The Pot = ₹50,000", desc: "All 10 members contribute ₹5,000 each. The total pot this month is ₹50,000.", color: "#D5BF86", icon: "payments" },
                  { num: "2", title: "Members Bid a Discount", desc: "If you bid ₹5,000, you're saying \"I'll accept ₹5,000 less\" — you only receive ₹45,000. The higher you bid, the less you get.", color: "#F59E0B", icon: "campaign" },
                  { num: "3", title: "Highest Bidder Wins", desc: "The person willing to take the biggest discount gets the money this month. They need it most urgently.", color: "#EF4444", icon: "emoji_events" },
                  { num: "4", title: "Others Earn the Discount", desc: "The discount amount (e.g., ₹5,000) is split among remaining members as bonus profit. Win-win!", color: "#10B981", icon: "redeem" },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${step.color}18`, border: `2px solid ${step.color}40` }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ color: step.color }}>{step.icon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-luxury-cream text-sm font-extrabold">{step.title}</p>
                      <p className="text-luxury-cream/50 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SimCard>

          {/* Quick comprehension check */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
            <span className="material-symbols-outlined text-base text-[#10B981]">tips_and_updates</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-[#10B981] font-bold">Think of it like this:</span> The auction finds out who needs the money most. That person pays a small "fee" (the discount), which benefits everyone else. It's fairer than picking randomly!
            </p>
          </div>

          <div className="flex justify-end">
            <SimButton onClick={() => setPhase(1)} variant="primary">
              Watch an Auction
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </SimButton>
          </div>
        </div>
      )}

      {/* ═══════ PHASE 1 — Watch ═══════════════════════════ */}
      {phase === 1 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
            <span className="material-symbols-outlined text-base text-[#F59E0B]">visibility</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-[#F59E0B] font-bold">Watch how other members bid.</span> Click "Show Next Bid" to see each member's bid one by one. Read their reasoning — take your time!
            </p>
          </div>

          {/* Auction status */}
          <SimCard highlight>
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Pool Total</span>
                <span className="text-2xl font-extrabold text-luxury-gold">₹{POOL_TOTAL.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Current Highest</span>
                <span className="text-2xl font-extrabold text-[#F59E0B]">
                  {highestBot.amount > 0 ? `₹${highestBot.amount.toLocaleString()}` : "—"}
                </span>
              </div>
            </div>

            {/* Bids feed */}
            <div className="flex flex-col gap-3 mb-4">
              <h3 className="text-xs text-luxury-cream/40 uppercase tracking-widest font-bold">Bids So Far</h3>
              {visibleBids === 0 ? (
                <p className="text-luxury-cream/20 text-sm text-center py-6 italic">
                  No bids yet. Click the button below to see the first bid.
                </p>
              ) : (
                visibleBotBids.map((bid, i) => (
                  <BidCard
                    key={i}
                    bid={bid}
                    index={i}
                    isHighest={bid.amount === highestBot.amount}
                  />
                ))
              )}
            </div>

            {/* Payout preview */}
            {highestBot.amount > 0 && (
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">If auction ended now</p>
                  <p className="text-luxury-cream/50 text-xs mt-1">
                    {highestBot.member?.name} pays ₹{highestBot.amount.toLocaleString()} discount
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Winner Gets</p>
                  <p className="text-luxury-gold font-extrabold">
                    ₹{(POOL_TOTAL - highestBot.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </SimCard>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-luxury-cream/30 text-xs font-semibold">
              <span className="text-[#F59E0B]">{visibleBids}/{BOT_BIDS.length}</span> bids shown
            </p>
            {visibleBids < BOT_BIDS.length ? (
              <SimButton onClick={showNextBid} variant="primary">
                Show Next Bid
                <span className="material-symbols-outlined text-base">visibility</span>
              </SimButton>
            ) : (
              <SimButton onClick={() => setPhase(2)} variant="primary">
                Now It's Your Turn!
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </SimButton>
            )}
          </div>
        </div>
      )}

      {/* ═══════ PHASE 2 — Your Bid ════════════════════════ */}
      {phase === 2 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#D5BF86]/5 border border-[#D5BF86]/15">
            <span className="material-symbols-outlined text-base text-luxury-gold">my_location</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-luxury-gold font-bold">Your turn!</span> Choose how much discount you're willing to accept.
              A higher bid = you win but receive less money. A lower bid = you save more but might not win.
              <span className="text-luxury-gold font-bold"> Take your time — there's no timer!</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bid summary */}
            <SimCard>
              <div className="flex flex-col gap-4">
                <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest">Current Standings</p>
                {BOT_BIDS.map((bid, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ backgroundColor: `${bid.member.color}20`, color: bid.member.color }}
                      >
                        {bid.member.initial}
                      </div>
                      <span className="text-luxury-cream text-sm font-bold">{bid.member.name}</span>
                    </div>
                    <span className="text-[#F59E0B] font-extrabold">₹{bid.amount.toLocaleString()}</span>
                  </div>
                ))}

                {bidPlaced && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black bg-[#D5BF86]/20 text-[#D5BF86]">Y</div>
                      <span className="text-luxury-gold text-sm font-bold">You</span>
                    </div>
                    <span className="text-luxury-gold font-extrabold">₹{userBid.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </SimCard>

            {/* Bidding controls */}
            <div className="flex flex-col gap-4">
              <SimCard highlight>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-luxury-cream/40 uppercase tracking-widest font-bold">
                      Your Discount Bid
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setUserBid(Math.max(500, userBid - 500))}
                        disabled={bidPlaced}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-luxury-cream text-xl font-bold disabled:opacity-30 transition-colors"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-extrabold text-luxury-gold">
                          ₹{userBid.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setUserBid(Math.min(10000, userBid + 500))}
                        disabled={bidPlaced}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-luxury-cream text-xl font-bold disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={500}
                      value={userBid}
                      onChange={(e) => !bidPlaced && setUserBid(Number(e.target.value))}
                      disabled={bidPlaced}
                      className="w-full mt-2 accent-[#F59E0B]"
                    />
                    <div className="flex justify-between text-[10px] text-luxury-cream/30 font-semibold">
                      <span>₹500</span>
                      <span>₹10,000</span>
                    </div>
                  </div>

                  {/* Live calculation */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-luxury-cream/50">Pool Total</span>
                      <span className="text-luxury-cream font-bold">₹{POOL_TOTAL.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-luxury-cream/50">Your Discount</span>
                      <span className="text-[#EF4444] font-bold">− ₹{userBid.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/10 my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-luxury-cream/50">You Would Receive</span>
                      <span className="text-[#10B981] font-extrabold text-lg">₹{(POOL_TOTAL - userBid).toLocaleString()}</span>
                    </div>
                  </div>

                  {!bidPlaced ? (
                    <SimButton onClick={handlePlaceBid} variant="primary" className="w-full">
                      <span className="material-symbols-outlined text-base">gavel</span>
                      Place My Bid — ₹{userBid.toLocaleString()}
                    </SimButton>
                  ) : (
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold text-center justify-center"
                      style={{ background: "#10B98120", border: "2px solid #10B98155", color: "#10B981" }}
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Bid Placed! ₹{userBid.toLocaleString()}
                    </div>
                  )}
                </div>
              </SimCard>

              {bidPlaced && (
                <SimButton onClick={finalizeAuction} variant="primary" className="w-full">
                  See Auction Results
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </SimButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PHASE 3 — Results ═════════════════════════ */}
      {phase === 3 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <SimCard highlight>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#F59E0B]">emoji_events</span>
              <h3 className="text-xl font-extrabold text-luxury-cream">
                {finalWinner.member?.isUser ? "You Won the Pot!" : `${finalWinner.member?.name} Won the Pot!`}
              </h3>
              <p className="text-luxury-cream/50 text-sm max-w-md leading-relaxed">
                {finalWinner.member?.isUser
                  ? `You bid the highest discount of ₹${finalWinner.amount?.toLocaleString()}. You receive ₹${finalPayout.toLocaleString()} from the ₹${POOL_TOTAL.toLocaleString()} pot.`
                  : `${finalWinner.member?.name} bid the highest discount of ₹${finalWinner.amount?.toLocaleString()} and receives ₹${finalPayout.toLocaleString()}.`}
              </p>
            </div>

            {/* Full breakdown */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 mt-2">
              <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest mb-4">Auction Breakdown</p>
              <div className="flex flex-col gap-3">
                {allBids
                  .sort((a, b) => b.amount - a.amount)
                  .map((bid, i) => {
                    const isWinner = bid.amount === finalWinner.amount && bid.member.id === finalWinner.member?.id;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          isWinner
                            ? "bg-[#F59E0B]/10 border-[#F59E0B]/30"
                            : bid.member.isUser
                            ? "bg-luxury-gold/5 border-luxury-gold/15"
                            : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isWinner && <span className="material-symbols-outlined text-sm text-[#F59E0B]">emoji_events</span>}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ backgroundColor: `${bid.member.color}20`, color: bid.member.color }}
                          >
                            {bid.member.initial}
                          </div>
                          <span className={`font-bold text-sm ${bid.member.isUser ? "text-luxury-gold" : "text-luxury-cream"}`}>
                            {bid.member.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#F59E0B] font-extrabold">₹{bid.amount.toLocaleString()}</span>
                          <span className="text-luxury-cream/30 text-xs">→ gets ₹{(POOL_TOTAL - bid.amount).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </SimCard>

          {/* Key insight */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
            <span className="material-symbols-outlined text-base text-[#10B981]">lightbulb</span>
            <div className="flex flex-col gap-1">
              <p className="text-[#10B981] text-xs font-extrabold uppercase tracking-widest">Key Insight</p>
              <p className="text-luxury-cream/60 text-xs leading-relaxed">
                The discount of <span className="text-[#10B981] font-bold">₹{finalWinner.amount?.toLocaleString()}</span> is split among the remaining {POOL_TOTAL / 5000 - 1} members as bonus profit.
                Each non-winner gets roughly <span className="text-[#10B981] font-bold">₹{Math.round(finalWinner.amount / (POOL_TOTAL / 5000 - 1)).toLocaleString()}</span> extra.
                This is why chit funds beat regular savings — you earn returns without any bank!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <FloatingXP xp={100} show={showXP} />
            <SimButton onClick={onNext} variant="primary">
              Next Level
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </SimButton>
          </div>
        </div>
      )}

      {/* Fade-in animation style */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
