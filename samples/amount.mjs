/** Convert a positive decimal ETH string to wei without floating-point arithmetic. */
export function parseEthAmount(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,11})(\.\d{1,18})?$/.test(value)) {
    throw new Error('Enter a decimal ETH amount with up to 18 decimal places.');
  }
  const [whole, fraction = ''] = value.split('.');
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'));
  if (wei <= 0n) throw new Error('Amount must be greater than zero.');
  return wei;
}
