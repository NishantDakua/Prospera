"use client";

import { useState, useEffect } from "react";
import SimCard from "./ui/Card";
import SimButton from "./ui/Button";
import FloatingXP, { useXPTrigger } from "./ui/FloatingXP";

const MEMBERS = [
  { id: 1, name: "You", avatar: "👤", isUser: true },
  { id: 2, name: "Rahul", avatar: "👨🏽" },
  { id: 3, name: "Priya", avatar: "👩🏽" },
  { id: 4, name: "Amit", avatar: "👨🏻" },
];

export default function BiddingLevel({ onNext, onUpdateState, onAction }) {
  const [bidAmount, setBidAmount] = useState(500);
  const [highestBid, setHighestBid] = useState({ amount: 0, member: null });
  const [biddingActive, setBiddingActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15);
  const [bids, setBids] = useState([]);
  const { showXP, triggerXP } = useXPTrigger();

  // Simulate bot bids
  useEffect(() => {
    if (!biddingActive) return;

    const interval = setInterval(() => {
      const randomMember = MEMBERS[Math.floor(Math.random() * (MEMBERS.length - 1)) + 1];
      const randomBid = Math.floor(Math.random() * 10) * 100 + 100; // 100 to 1000

      setBids((prev) => {
        const newBids = [{ member: randomMember, amount: randomBid }, ...prev].slice(0, 5);
        const currentHighest = newBids.reduce((max, bid) => (bid.amount > max.amount ? bid : max), { amount: 0 });
        setHighestBid(currentHighest);
        return newBids;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [biddingActive]);

  // Timer
  useEffect(() => {
    if (!biddingActive) return;
    if (timeLeft <= 0) {
      setBiddingActive(false);
      const poolTotal = 50000;
      const winner = highestBid.member;
      const payout = poolTotal - highestBid.amount;
      onUpdateState({
        bid: highestBid.amount,
        biddingWinner: winner?.name ?? "—",
        biddingPayout: payout,
        userWon: winner?.isUser ?? false,
        winningDiscount: highestBid.amount,
      });
      triggerXP();
      onAction?.(100);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, biddingActive, highestBid, onUpdateState, triggerXP, onAction]);

  const handlePlaceBid = () => {
    if (!biddingActive || bidAmount <= highestBid.amount) return;

    const newBid = { member: MEMBERS[0], amount: bidAmount };
    setBids((prev) => [newBid, ...prev].slice(0, 5));
    setHighestBid(newBid);
    setBidAmount(bidAmount + 100);
    onAction?.(10); // Small XP for participating
  };

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
          Need the money early? Bid the highest discount to win the pot this month. The discount is distributed among other members as profit!
        </p>
      </div>

      {/* Educational callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
        <span className="text-xl mt-0.5">💡</span>
        <div className="flex flex-col gap-1">
          <p className="text-[#F59E0B] text-xs font-extrabold uppercase tracking-widest">How Auctions Work</p>
          <p className="text-luxury-cream/60 text-xs leading-relaxed">
            Each month, the pool collects <span className="text-luxury-gold font-bold">₹50,000</span> (10 members × ₹5,000). Members who need money urgently bid a <span className="text-[#F59E0B] font-bold">discount</span> — the member willing to accept the biggest discount wins the pot. The discount amount is shared among the remaining members as profit. Higher bid = you get less money, but others earn more.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auction Status Card */}
        <SimCard highlight>
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Time Remaining</span>
              <span className={`text-3xl font-extrabold font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-luxury-gold'}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Highest Discount Bid</span>
              <span className="text-2xl font-extrabold text-[#10B981]">₹{highestBid.amount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs text-luxury-cream/40 uppercase tracking-widest font-bold mb-2">Recent Bids</h3>
            {bids.length === 0 ? (
              <p className="text-luxury-cream/20 text-sm text-center py-4 italic">Waiting for bids...</p>
            ) : (
              bids.map((bid, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${bid.member.isUser ? 'bg-luxury-gold/10 border-luxury-gold/30' : 'bg-white/5 border-white/10'} transition-all`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bid.member.avatar}</span>
                    <span className={`font-bold text-sm ${bid.member.isUser ? 'text-luxury-gold' : 'text-luxury-cream'}`}>
                      {bid.member.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#10B981]">₹{bid.amount}</span>
                </div>
              ))
            )}
          </div>
        </SimCard>

        {/* Bidding Controls */}
        <div className="flex flex-col gap-4">
          <SimCard>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-luxury-cream/40 uppercase tracking-widest font-bold">Your Bid Amount</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setBidAmount(Math.max(100, bidAmount - 100))}
                    disabled={!biddingActive}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-luxury-cream font-bold disabled:opacity-50"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center text-3xl font-extrabold text-luxury-cream">
                    ₹{bidAmount}
                  </div>
                  <button 
                    onClick={() => setBidAmount(bidAmount + 100)}
                    disabled={!biddingActive}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-luxury-cream font-bold disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <SimButton 
                onClick={handlePlaceBid} 
                disabled={!biddingActive || bidAmount <= highestBid.amount}
                variant="primary"
                className="w-full py-4 text-lg"
              >
                {biddingActive ? (bidAmount <= highestBid.amount ? "Bid Too Low" : "Place Bid") : "Auction Ended"}
              </SimButton>
            </div>
          </SimCard>

          {!biddingActive && (
            <SimCard className="animate-fade-in border-[#10B981]/30 bg-[#10B981]/5">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <span className="text-4xl mb-2">🏆</span>
                <h3 className="text-lg font-extrabold text-luxury-cream">
                  {highestBid.member?.isUser ? "You Won the Pot!" : `${highestBid.member?.name} Won the Pot!`}
                </h3>
                <p className="text-luxury-cream/60 text-sm">
                  Winning discount: <span className="text-[#10B981] font-bold">₹{highestBid.amount}</span>
                </p>
                <p className="text-luxury-cream/40 text-xs">
                  Payout: ₹{(50000 - highestBid.amount).toLocaleString()} (Pool ₹50,000 − Discount ₹{highestBid.amount})
                </p>
                <div className="mt-4 w-full flex items-center justify-between">
                  <FloatingXP xp={100} show={showXP} />
                  <SimButton onClick={onNext} variant="primary">
                    Next Level →
                  </SimButton>
                </div>
              </div>
            </SimCard>
          )}
        </div>
      </div>
    </div>
  );
}
