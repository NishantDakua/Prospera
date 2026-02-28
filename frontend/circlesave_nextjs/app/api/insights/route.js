/**
 * POST /api/insights
 *
 * Generates AI-powered insights for a Prospera savings circle using Gemini.
 *
 * Body: { contributionAmount, maxMembers, poolType, totalDuration,
 *         biddingWindow, currentRound?, poolAmount?, memberCount? }
 *
 * Returns: { insights: string }  — Markdown-formatted AI analysis
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are Prospera AI — an expert financial advisor embedded in the Prospera decentralised savings platform (chit fund / ROSCA protocol on Ethereum).

Your role: Given a circle's parameters, produce concise, actionable insights that help members understand the plan, its economics, risks, and optimal strategy.

Output format — use Markdown with these exact section headers:
## 📊 Plan Overview
A 2-3 sentence plain-English summary of how this circle works.

## 💰 Economics Breakdown
- Gross pool per round, platform fee, net payout.
- Total commitment over the scheme lifetime.
- Effective return comparison.

## 🎯 Strategy Tips
3-4 bullet points of advice specific to the pool type (Auction vs Lucky Draw).

## ⚠️ Risk Assessment
2-3 key risks members should be aware of (missed payments, deposit forfeiture, etc.)

## ❓ FAQ
3-4 common questions a first-time member would ask, with brief answers.

Rules:
- Keep it under 600 words total.
- Use ETH amounts, not USD.
- Be encouraging but honest about risks.
- Never invent on-chain data you weren't given.
- Format numbers nicely (e.g. "0.5 ETH", "3 members").`;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      contributionAmount,
      maxMembers,
      poolType,       // 0 = Auction, 1 = LuckyDraw
      totalDuration,  // seconds
      biddingWindow,  // seconds
      currentRound,
      poolAmount,
      memberCount,
    } = body;

    if (!contributionAmount || !maxMembers) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build a rich prompt with circle data
    const poolTypeName = poolType === 0 ? "Auction (lowest bid wins)" : "Lucky Draw (random winner)";
    const durationDays = (totalDuration / 86400).toFixed(1);
    const roundInterval = totalDuration / maxMembers;
    const roundIntervalHrs = (roundInterval / 3600).toFixed(1);
    const biddingHrs = (biddingWindow / 3600).toFixed(1);
    const grossPool = (contributionAmount * maxMembers).toFixed(4);
    const fee = (contributionAmount * maxMembers * 0.1).toFixed(4);
    const netPayout = (contributionAmount * maxMembers * 0.9).toFixed(4);
    const totalCommitment = (contributionAmount * maxMembers + contributionAmount).toFixed(4);

    let userPrompt = `Analyse this Prospera savings circle and generate insights:

**Circle Parameters:**
- Contribution per round: ${contributionAmount} ETH
- Security deposit (on join): ${contributionAmount} ETH  
- Members: ${maxMembers}
- Pool type: ${poolTypeName}
- Scheme duration: ${durationDays} days (${totalDuration} seconds)
- Round interval: ${roundIntervalHrs} hours
- Bidding window per round: ${biddingHrs} hours
- Gross pool per round: ${grossPool} ETH
- Platform fee (10%): ${fee} ETH
- Net payout per round: ${netPayout} ETH
- Total member commitment (deposit + all rounds): ${totalCommitment} ETH`;

    // Add live data if available (when viewing an active circle)
    if (currentRound !== undefined) {
      userPrompt += `\n\n**Live Circle State:**
- Current round: ${currentRound} of ${maxMembers}
- Members joined: ${memberCount ?? maxMembers} of ${maxMembers}
- Current pool amount: ${poolAmount ?? 0} ETH`;
    }

    // Call Gemini
    if (!GEMINI_KEY) {
      return Response.json(
        { insights: generateFallbackInsights(body) },
        { status: 200 }
      );
    }

    const geminiBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error("[insights] Gemini error:", res.status, err);
      return Response.json(
        { insights: generateFallbackInsights(body) },
        { status: 200 }
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackInsights(body);

    return Response.json({ insights: text });
  } catch (error) {
    console.error("[insights] Exception:", error.message);
    if (error.name === "AbortError") {
      return Response.json(
        { insights: "⏱ AI analysis timed out. Please try again." },
        { status: 200 }
      );
    }
    return Response.json(
      { insights: "Could not generate insights. Please try again later." },
      { status: 500 }
    );
  }
}

/* ─── Fallback when Gemini is unavailable ─── */
function generateFallbackInsights(params) {
  const { contributionAmount, maxMembers, poolType, totalDuration, biddingWindow } = params;
  const poolName = poolType === 0 ? "Auction" : "Lucky Draw";
  const gross = (contributionAmount * maxMembers).toFixed(4);
  const net = (contributionAmount * maxMembers * 0.9).toFixed(4);
  const days = (totalDuration / 86400).toFixed(1);

  return `## 📊 Plan Overview
This is a **${poolName}** circle with **${maxMembers} members**, each contributing **${contributionAmount} ETH** per round. The scheme runs for **${days} days**.

## 💰 Economics Breakdown
- **Gross pool per round:** ${gross} ETH
- **Platform fee (10%):** ${(contributionAmount * maxMembers * 0.1).toFixed(4)} ETH
- **Net payout:** ${net} ETH
- **Total commitment:** ${(contributionAmount * (Number(maxMembers) + 1)).toFixed(4)} ETH (deposit + all rounds)

## 🎯 Strategy Tips
- ${poolType === 0 ? "In Auction mode, bid strategically — a lower bid means less payout but higher chance of winning early." : "In Lucky Draw mode, every eligible member has an equal chance — focus on consistent contributions."}
- Always contribute on time to protect your security deposit.
- Plan your finances to cover all ${maxMembers} rounds of contributions.

## ⚠️ Risk Assessment
- Missing a contribution will consume your security deposit automatically.
- Once your deposit is exhausted, you may miss out on future rounds.
- ${poolType === 0 ? "In Auction, bidding too low means a smaller payout." : "Lucky Draw outcomes are random — you may win early or late."}

## ❓ FAQ
**Q: What happens if I miss a payment?**
Your security deposit (${contributionAmount} ETH) covers one missed round. After that, you simply miss out.

**Q: When do I get my security deposit back?**
At the end of the scheme, if it hasn't been used to cover missed payments.

**Q: Can I leave the circle early?**
No — once joined, you're committed for all ${maxMembers} rounds. An admin can liquidate inactive members.`;
}
