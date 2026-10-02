import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NextPrompt } from '@/components/workshop/NextPrompt';
import { DEFAULT_VAULT_NAME } from '@/config/workshop';
import { DepositForm } from './DepositForm';
import { VaultBrowser } from './VaultBrowser';
import { useVaults } from './vaults';
import { WithdrawForm } from './WithdrawForm';
import { YourPosition } from './YourPosition';

export function LeverageYieldPage() {
  const vaults = useVaults();
  const [vaultName, setVaultName] = useState(DEFAULT_VAULT_NAME);
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const formRef = useRef<HTMLDivElement>(null);

  const vault = vaults.find(v => v.name === vaultName) ?? vaults[0];
  const selectedName = vault?.name ?? vaultName;

  const handleDepositClick = (name: string) => {
    setVaultName(name);
    setTab('deposit');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (vaults.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <NextPrompt next="done" />
        <p className="text-center text-sm text-muted-foreground">No leverage-yield vaults are registered in the SDK.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <NextPrompt next="done" />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Vaults</h2>
        <VaultBrowser vaults={vaults} selectedVaultName={selectedName} onDeposit={handleDepositClick} />
      </section>

      <section
        ref={formRef}
        className="grid scroll-mt-6 grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_minmax(280px,360px)]"
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 self-start rounded-full bg-secondary p-1" role="tablist" aria-label="Action">
            <Button
              role="tab"
              aria-selected={tab === 'deposit'}
              size="sm"
              variant={tab === 'deposit' ? 'default' : 'ghost'}
              onClick={() => setTab('deposit')}
            >
              Deposit
            </Button>
            <Button
              role="tab"
              aria-selected={tab === 'withdraw'}
              size="sm"
              variant={tab === 'withdraw' ? 'default' : 'ghost'}
              onClick={() => setTab('withdraw')}
            >
              Withdraw
            </Button>
          </div>
          {tab === 'deposit' ? (
            <DepositForm vaults={vaults} vaultName={selectedName} onVaultChange={setVaultName} />
          ) : (
            <WithdrawForm vaults={vaults} vaultName={selectedName} onVaultChange={setVaultName} />
          )}
        </div>
        <YourPosition vault={vault} />
      </section>
    </div>
  );
}
