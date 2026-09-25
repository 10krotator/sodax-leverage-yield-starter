import { useState } from 'react';
import { DEFAULT_VAULT_NAME } from '@/config/workshop';
import { useEvmWallet } from '@/wallet';
import { TransportProvider, TransportToggle } from './api/transport';
import { DepositForm } from './components/DepositForm';
import { VaultGrid } from './components/VaultGrid';
import { useVaults } from './hooks/useVaults';

/**
 * Leverage Yield: browse pooled lsoda* ERC-4626 vaults, deposit and withdraw via SODAX intents.
 * The SDK/API toggle switches every read, quote and transaction between @sodax/sdk and the REST API.
 */
export function LeverageYieldPage() {
  return (
    <TransportProvider>
      <LeverageYieldContent />
    </TransportProvider>
  );
}

function LeverageYieldContent() {
  const vaults = useVaults();
  const { address } = useEvmWallet();
  const [vaultName, setVaultName] = useState(DEFAULT_VAULT_NAME);

  const selectVault = (name: string) => {
    setVaultName(name);
    document.getElementById('deposit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="-mb-6 flex items-center justify-end gap-2 text-sm text-muted-foreground">
        Data source <TransportToggle />
      </div>
      <VaultGrid vaults={vaults} address={address} selected={vaultName} onSelect={selectVault} />
      <section id="deposit" className="scroll-mt-20">
        <DepositForm vaultName={vaultName} onVaultChange={setVaultName} />
      </section>
    </div>
  );
}
