"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatEther } from "ethers";

/**
 * Export transaction history to a professional PDF statement.
 *
 * @param {Object}   opts
 * @param {Array}    opts.transactions   – sorted tx array from getTransactionHistory
 * @param {string}   opts.address        – wallet address
 * @param {string}   opts.userName       – display name / email
 * @param {bigint}   opts.totalContributed
 * @param {bigint}   opts.totalWinnings
 * @param {bigint}   opts.withdrawable
 * @param {number}   opts.circleCount
 */
export function exportTransactionsPDF({
  transactions = [],
  address = "",
  userName = "",
  totalContributed = 0n,
  totalWinnings = 0n,
  withdrawable = 0n,
  circleCount = 0,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 16;

  // ── Helpers ──────────────────────────────────────────────
  const fmtEth = (wei) => {
    if (!wei) return "0";
    const v = parseFloat(formatEther(wei));
    return v === 0 ? "0" : v % 1 === 0 ? v.toFixed(0) : v.toFixed(4);
  };

  const txLabel = (tx) => {
    const labels = {
      join: "Joined Circle (Deposit)",
      contribute: `Contribution — Rd ${tx.round ?? "?"}`,
      bid: "Auction Bid",
      credit: { round_winner: "Round Won — Payout", auction_surplus: "Auction Surplus", deposit_refund: "Deposit Refund", loan: "Loan Issued" }[tx.reason] || "Balance Credited",
      withdraw: "Withdrawal to Wallet",
      won_round: `Won Round ${tx.round ?? "?"}`,
    };
    return labels[tx.type] || "Transaction";
  };

  // ── Header Bar ───────────────────────────────────────────
  doc.setFillColor(26, 26, 34);        // luxury-dark
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFillColor(168, 38, 50);       // luxury-crimson accent line
  doc.rect(0, 38, pageW, 1.2, "F");

  doc.setTextColor(241, 240, 204);     // luxury-cream
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PROSPERA", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(213, 191, 134);     // luxury-gold
  doc.text("On-Chain Transaction Statement", margin, 26);
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 33);

  y = 46;

  // ── Account Info ─────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("ACCOUNT DETAILS", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  if (userName) { doc.text(`Name / Email:   ${userName}`, margin, y); y += 5; }
  doc.text(`Wallet Address:   ${address}`, margin, y); y += 5;
  doc.text(`Circles Joined:   ${circleCount}`, margin, y); y += 5;

  // ── Summary Box ──────────────────────────────────────────
  y += 3;
  const boxY = y;
  const boxH = 22;
  doc.setFillColor(245, 245, 240);
  doc.roundedRect(margin, boxY, pageW - margin * 2, boxH, 3, 3, "F");

  const cols = [
    { label: "Total Contributed", value: `${fmtEth(totalContributed)} ETH`, color: [180, 60, 60] },
    { label: "Total Winnings", value: `${fmtEth(totalWinnings)} ETH`, color: [16, 185, 129] },
    { label: "Withdrawable", value: `${fmtEth(withdrawable)} ETH`, color: [59, 130, 246] },
  ];
  const colW = (pageW - margin * 2) / cols.length;
  cols.forEach((c, i) => {
    const cx = margin + colW * i + colW / 2;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(c.label.toUpperCase(), cx, boxY + 8, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c.color);
    doc.text(c.value, cx, boxY + 16, { align: "center" });
  });

  y = boxY + boxH + 10;

  // ── Transactions Table ───────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text(`TRANSACTION HISTORY  (${transactions.length} records)`, margin, y);
  y += 4;

  if (transactions.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("No on-chain transactions found for this account.", margin, y + 6);
  } else {
    const tableRows = transactions.map((tx) => {
      const isIncoming = ["credit", "won_round", "withdraw"].includes(tx.type);
      const isOutgoing = ["join", "contribute"].includes(tx.type);
      const sign = isIncoming ? "+" : isOutgoing ? "-" : "";
      const amount = tx.amount > 0n ? `${sign}${fmtEth(tx.amount)} ETH` : "—";
      const date = new Date(tx.timestamp * 1000);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        txLabel(tx),
        tx.groupId != null ? `#${tx.groupId}` : "—",
        amount,
        tx.txHash ? `${tx.txHash.slice(0, 10)}…` : "—",
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Time", "Description", "Circle", "Amount", "Tx Hash"]],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [50, 50, 50],
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [26, 26, 34],
        textColor: [241, 240, 204],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 24, fontStyle: "normal", fontSize: 6.5, textColor: [140, 140, 140] },
      },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      didParseCell: (data) => {
        // Color amounts green/red
        if (data.section === "body" && data.column.index === 4) {
          const val = data.cell.raw;
          if (val.startsWith("+")) data.cell.styles.textColor = [16, 185, 129];
          else if (val.startsWith("-")) data.cell.styles.textColor = [220, 60, 60];
        }
      },
    });
  }

  // ── Footer on every page ─────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();
    doc.setFillColor(26, 26, 34);
    doc.rect(0, pH - 12, pageW, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Prospera — On-Chain Collaborative Savings Protocol", margin, pH - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pH - 5, { align: "right" });
  }

  // ── Download ─────────────────────────────────────────────
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "unknown";
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`Prospera_Transactions_${shortAddr}_${dateStr}.pdf`);
}
