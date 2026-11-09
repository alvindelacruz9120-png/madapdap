import QRCode from 'qrcode';

export async function generateQrDataUrl(token: string): Promise<string> {
  if (!token?.trim()) throw new Error('QR token is empty. Generate a new QR credential first.');
  return QRCode.toDataURL(token, {
    width: 400,
    margin: 3,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

/** Create a 192-bit bearer token using the browser's cryptographic RNG. */
export function generateQrToken(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure QR generation requires HTTPS and a modern browser.');
  }
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function hashTokenClient(token: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure QR verification requires HTTPS and a modern browser.');
  }
  const data = new TextEncoder().encode(token.trim());
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  if (!dataUrl) throw new Error('There is no QR image to download.');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
