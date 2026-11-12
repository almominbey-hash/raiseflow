import { useRef, useState } from 'react';
import { submitDonation, donationErrorMessage } from './wallet-flow.mjs';
import { parseEthAmount } from './amount.mjs';

/** React UI sample. The caller supplies an injected wallet and contract adapter. */
export function DonationForm({ ethereum, campaignId, sendDonation }) {
  const locked = useRef(false);
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('idle');
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');
  const busy = ['connecting', 'switching', 'confirming', 'pending'].includes(stage);

  async function handleSubmit(event) {
    event.preventDefault();
    // A ref guards double submissions before React has committed its next render.
    if (locked.current) return;
    setError('');
    setHash('');
    try { parseEthAmount(amount); }
    catch (validationError) { setError(validationError.message); return; }
    locked.current = true;
    try {
      const receipt = await submitDonation({
        ethereum, campaignId, amount, sendDonation, onStage: setStage,
      });
      setHash(receipt.transactionHash || receipt.hash || '');
      setAmount('');
    } catch (transactionError) {
      setStage('error');
      setError(donationErrorMessage(transactionError));
    } finally {
      locked.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy}>
      <label htmlFor="donation-amount">Amount in Sepolia ETH</label>
      <input id="donation-amount" inputMode="decimal" value={amount}
        onChange={event => setAmount(event.target.value)} disabled={busy} required
        aria-describedby={error ? 'donation-error' : undefined} />
      <button disabled={busy} type="submit">{busy ? 'Processing…' : 'Contribute'}</button>
      <p role="status" aria-live="polite">{stage === 'idle' ? '' : stage}</p>
      {error && <p role="alert" id="donation-error">{error}</p>}
      {stage === 'success' && <p>Confirmed{hash ? `: ${hash}` : ''}</p>}
    </form>
  );
}
