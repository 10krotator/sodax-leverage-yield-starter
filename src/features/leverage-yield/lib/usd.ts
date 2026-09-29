import { formatUnits } from 'viem';

/**
 * USD display helpers. USD is for display only: it never feeds amounts or minimums, and a missing price shows
 * nothing rather than "$0".
 */

/** USD per whole token, keyed by lowercase money-market reserve address (see `useUsdPrices`). */
export type UsdPrices = ReadonlyMap<string, number>;

/** Price of a vault's asset (`vault.asset`) or of a deposit/withdraw token (`xToken.vault`, not `hubAsset`). */
export function priceFor(prices: UsdPrices, address: string | undefined): number | undefined {
  return address ? prices.get(address.toLowerCase()) : undefined;
}

/** USD value of `amount` (smallest units), or undefined when the amount or the price is unknown. */
export function toUsd(amount: bigint | undefined, decimals: number, price: number | undefined): number | undefined {
  if (amount === undefined || price === undefined) return undefined;
  return Number(formatUnits(amount, decimals)) * price;
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** e.g. 4.931 → "$4.93", 0.004 → "< $0.01", undefined → "". */
export function formatUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '';
  if (value !== 0 && Math.abs(value) < 0.01) return value > 0 ? '< $0.01' : '> -$0.01';
  return usd.format(value);
}

/** For big round numbers such as TVL: 2130 → "$2.1K", 632.04 → "$632.04". */
export function formatCompactUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '';
  return Math.abs(value) < 1000 ? formatUsd(value) : compactUsd.format(value);
}
