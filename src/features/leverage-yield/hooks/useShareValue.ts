import type { Address } from '@sodax/types';
import { ONE_SHARE } from '@/lib/format';
import { useSharePrice } from '../api/useTransportReads';

export { useSharePrice };

/**
 * Value of `shares` in the vault's underlying asset. Derived from the share price (ERC-4626 conversion is
 * linear), so every caller shares one cached query instead of one per share amount.
 */
export function useShareValue(vault: Address, shares: bigint | undefined): bigint | undefined {
  const price = useSharePrice(vault);
  return shares !== undefined && price !== undefined ? (shares * price) / ONE_SHARE : undefined;
}
