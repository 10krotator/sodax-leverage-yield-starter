import {
  type LeverageYieldShareHolder,
  type LeverageYieldShareHolding,
  useLeverageYieldApiEffectiveApr,
  useLeverageYieldApiPosition,
  useLeverageYieldApiPreviewRedeem,
  useLeverageYieldApiTotalAssets,
  useLeverageYieldEffectiveApr,
  useLeverageYieldPosition,
  useLeverageYieldPreviewRedeem,
  useLeverageYieldShareBalances,
  useLeverageYieldTotalAssets,
  useSodaxContext,
} from '@sodax/dapp-kit';
import type { Address } from '@sodax/types';
import { useQueries } from '@tanstack/react-query';
import { ONE_SHARE } from '@/lib/format';
import { useTransport } from './transport';
import { toBigInt } from './wire';

/**
 * Vault reads that follow the SDK/API toggle. Both hooks are always called (rules of hooks); the inactive one
 * gets `undefined` params, which disables its query. The API returns decimal strings; values are normalised
 * to bigint either way.
 */

export function useEffectiveApr(vault: Address) {
  const transport = useTransport();
  const sdk = useLeverageYieldEffectiveApr({ params: { vault: transport === 'sdk' ? vault : undefined } });
  const api = useLeverageYieldApiEffectiveApr({ params: { vault: transport === 'api' ? vault : undefined } });
  const query = transport === 'sdk' ? sdk : api;
  const apr = query.data;
  return {
    data: apr && {
      effectiveNetAprRay: BigInt(apr.effectiveNetAprRay),
      leverageMultiplierWad: BigInt(apr.leverageMultiplierWad),
      stale: apr.lsdApr.stale,
    },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTotalAssets(vault: Address): bigint | undefined {
  const transport = useTransport();
  const sdk = useLeverageYieldTotalAssets({ params: { vault: transport === 'sdk' ? vault : undefined } });
  const api = useLeverageYieldApiTotalAssets({ params: { vault: transport === 'api' ? vault : undefined } });
  return transport === 'sdk' ? sdk.data : toBigInt(api.data?.totalAssets);
}

/** Underlying asset per 1 share (previewRedeem of 1e18). */
export function useSharePrice(vault: Address): bigint | undefined {
  const transport = useTransport();
  const sdk = useLeverageYieldPreviewRedeem({
    params: { vault: transport === 'sdk' ? vault : undefined, shares: ONE_SHARE },
  });
  const api = useLeverageYieldApiPreviewRedeem({
    params: { vault: transport === 'api' ? vault : undefined, shares: ONE_SHARE.toString() },
  });
  return transport === 'sdk' ? sdk.data : toBigInt(api.data?.assets);
}

export function useVaultPosition(vault: Address) {
  const transport = useTransport();
  const sdk = useLeverageYieldPosition({ params: { vault: transport === 'sdk' ? vault : undefined } });
  const api = useLeverageYieldApiPosition({ params: { vault: transport === 'api' ? vault : undefined } });
  const position = (transport === 'sdk' ? sdk : api).data;
  return position && { healthFactor: BigInt(position.healthFactor), ltv: BigInt(position.ltv) };
}

/**
 * Share balances for (chain, address) holders. In API mode the hub wallet is derived with the SDK (there is no
 * API route for it), then `GET /leverage-yield/share-balance?owner=<hub wallet>` reads the balance. Keys sit
 * under ['leverageYield', 'shareBalance'] so one invalidation refreshes both transports.
 */
export function useShareBalances(
  vault: Address,
  holders: LeverageYieldShareHolder[] | undefined,
): (LeverageYieldShareHolding | undefined)[] {
  const transport = useTransport();
  const { sodax } = useSodaxContext();
  const sdk = useLeverageYieldShareBalances({ params: { vault, holders: transport === 'sdk' ? holders : undefined } });
  const api = useQueries({
    queries: (transport === 'api' ? (holders ?? []) : []).map(({ chainKey, address }) => ({
      queryKey: ['leverageYield', 'shareBalance', 'api', vault, chainKey, address],
      queryFn: async (): Promise<LeverageYieldShareHolding> => {
        const holder = await sodax.hubProvider.getUserHubWalletAddress(address, chainKey);
        const result = await sodax.api.leverageYield.getShareBalance({ vault, owner: holder });
        if (!result.ok) throw result.error;
        return { chainKey, holder, shares: BigInt(result.value.balance) };
      },
      refetchInterval: 15_000, // same cadence as the SDK hook
    })),
  });
  return (transport === 'sdk' ? sdk : api).map(query => query.data);
}
