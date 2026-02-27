import { formatEther, parseEther } from "ethers";

/**
 * Format wei → human-readable ETH string
 */
export function fmtEth(wei) {
  if (!wei) return "0";
  const val = formatEther(wei);
  const num = parseFloat(val);
  if (num === 0) return "0";
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(4);
}

/**
 * Format ETH string with Ξ symbol
 */
export function fmtEthSymbol(wei) {
  return `Ξ ${fmtEth(wei)}`;
}

/**
 * Parse ETH string → wei
 */
export function toWei(ethString) {
  return parseEther(ethString);
}

/**
 * Shorten address: 0x1234...abcd
 */
export function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Pool type enum mapping
 */
export const POOL_TYPES = {
  0: "Auction",
  1: "Lucky Draw",
};

export function poolTypeName(typeIndex) {
  return POOL_TYPES[typeIndex] ?? "Unknown";
}
