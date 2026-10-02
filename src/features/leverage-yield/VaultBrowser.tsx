import {
  useLeverageYieldEffectiveApr,
  useLeverageYieldPosition,
  useLeverageYieldPreviewRedeem,
  useLeverageYieldShareBalances,
  useLeverageYieldTotalAssets,
} from '@sodax/dapp-kit';
import type { LeverageYieldVault } from '@sodax/sdk';
import { useMemo } from 'react';
import { maxUint256 } from 'viem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { SOURCE_CHAINS } from '@/config/workshop';
import { formatBps, formatRayPercent, formatTokenAmount, formatWad, ONE_SHARE } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useEvmWallet } from '@/wallet';
import { SHARE_DECIMALS } from './shared';
import { vaultDescription, vaultUnderlyingSymbol } from './vaults';

function StatRow({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  const row = (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
  return title ? <Tooltip content={title}>{row}</Tooltip> : row;
}

function VaultCard({
  vault,
  selected,
  onDeposit,
}: {
  vault: LeverageYieldVault;
  selected: boolean;
  onDeposit: (name: string) => void;
}) {
  const wallet = useEvmWallet();

  // Default hook intervals (60s APR/TVL/share price, 30s position, 15s shares) — a grid of
  // cards multiplies every read, so never shorten them.
  const { data: apr } = useLeverageYieldEffectiveApr({ params: { vault: vault.vault } });
  const { data: tvl } = useLeverageYieldTotalAssets({ params: { vault: vault.vault } });
  const { data: sharePrice } = useLeverageYieldPreviewRedeem({ params: { vault: vault.vault, shares: ONE_SHARE } });
  const { data: position } = useLeverageYieldPosition({ params: { vault: vault.vault } });

  const holders = useMemo(
    () =>
      wallet.address ? SOURCE_CHAINS.map(chainKey => ({ chainKey, address: wallet.address as string })) : undefined,
    [wallet.address],
  );
  const holdings = useLeverageYieldShareBalances({ params: { vault: vault.vault, holders } });
  const myShares = holdings.reduce((acc, query) => acc + (query.data?.shares ?? 0n), 0n);

  const underlying = vaultUnderlyingSymbol(vault.name);
  const negativeApr = apr !== undefined && apr.effectiveNetAprRay < 0n;

  return (
    <Card className={cn('flex flex-col', selected && 'ring-2 ring-primary')}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{vault.name}</CardTitle>
          <Badge>{underlying}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{vaultDescription(vault.name)}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Net APR</p>
          {apr === undefined ? (
            <Skeleton className="mt-1 h-7 w-20" />
          ) : (
            <p className={cn('text-2xl font-bold', negativeApr ? 'text-destructive' : 'text-success')}>
              {formatRayPercent(apr.effectiveNetAprRay)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-2">
          <StatRow label="TVL" value={tvl === undefined ? '–' : `${formatTokenAmount(tvl, 18)} ${underlying}`} />
          <StatRow
            label="Share price"
            value={sharePrice === undefined ? '–' : `${formatTokenAmount(sharePrice, 18, 6)} ${underlying}`}
            title="Underlying assets you'd get for 1 share right now"
          />
          <StatRow
            label="Leverage"
            value={apr === undefined ? '–' : `${formatWad(apr.leverageMultiplierWad + ONE_SHARE)}×`}
            title="Your total exposure: 1 (your deposit) + the borrowed multiple"
          />
          <StatRow
            label="LTV (target)"
            value={
              position === undefined || apr === undefined
                ? '–'
                : `${formatBps(position.ltv)} (${formatBps(apr.targetLtvBps)})`
            }
          />
          <StatRow
            label="Health factor"
            value={
              position === undefined
                ? '–'
                : position.healthFactor === maxUint256
                  ? '∞'
                  : formatWad(position.healthFactor)
            }
            title="Below 1.00 the position can be liquidated"
          />
          {wallet.isConnected && <StatRow label="Your shares" value={formatTokenAmount(myShares, SHARE_DECIMALS)} />}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant={selected ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => onDeposit(vault.name)}
        >
          Deposit
        </Button>
      </CardFooter>
    </Card>
  );
}

export function VaultBrowser({
  vaults,
  selectedVaultName,
  onDeposit,
}: {
  vaults: LeverageYieldVault[];
  selectedVaultName: string;
  onDeposit: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {vaults.map(vault => (
        <VaultCard key={vault.name} vault={vault} selected={vault.name === selectedVaultName} onDeposit={onDeposit} />
      ))}
    </div>
  );
}
