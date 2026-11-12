import { parseEthAmount } from './amount.mjs';
export const SEPOLIA_CHAIN_ID = '0xaa36a7';

/**
 * EIP-1193 wallet orchestration. sendDonation is supplied by the application:
 * ({account, campaignId, value}) => contract.donateToCampaign(campaignId, {value})
 * Use an ethers signer bound to the returned account. No private keys are handled.
 */
export async function submitDonation({ ethereum, campaignId, amount, sendDonation, onStage = () => {} }) {
  if (!ethereum?.request) throw new Error('An Ethereum wallet is required.');
  if (typeof campaignId !== 'string' || !/^(0|[1-9]\d{0,19})$/.test(campaignId)) {
    throw new Error('Invalid campaign ID.');
  }
  const value = parseEthAmount(amount).toString();
  onStage('connecting');
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts?.[0];
  if (!/^0x[0-9a-fA-F]{40}$/.test(account || '')) throw new Error('No wallet account selected.');

  const chain = await ethereum.request({ method: 'eth_chainId' });
  if (chain.toLowerCase() !== SEPOLIA_CHAIN_ID) {
    onStage('switching');
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
  }
  // Recheck after switching: the user may reject, switch accounts, or change networks.
  const currentChain = await ethereum.request({ method: 'eth_chainId' });
  const currentAccounts = await ethereum.request({ method: 'eth_accounts' });
  if (currentChain.toLowerCase() !== SEPOLIA_CHAIN_ID) throw new Error('Select Sepolia before continuing.');
  if (currentAccounts?.[0]?.toLowerCase() !== account.toLowerCase()) {
    throw new Error('Wallet account changed. Please submit again.');
  }

  onStage('confirming');
  const transaction = await sendDonation({ account, campaignId, value });
  onStage('pending');
  const receipt = await transaction.wait();
  if (receipt?.status !== 1) throw new Error('The transaction did not succeed.');
  onStage('success');
  return receipt;
}

export function donationErrorMessage(error) {
  const code = error?.code ?? error?.error?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Request cancelled in your wallet.';
  if (code === 4902) return 'Add the Sepolia network to your wallet, then try again.';
  if (code === 'INSUFFICIENT_FUNDS') return 'Insufficient test ETH for the donation and gas.';
  if (code === 'TRANSACTION_REPLACED') return 'Transaction replaced. Check your wallet before submitting again.';
  return 'Donation could not be completed. Check your wallet and try again.';
}
