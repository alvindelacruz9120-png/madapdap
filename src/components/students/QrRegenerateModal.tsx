import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { apiUrl } from '../../lib/api';

interface Props { isOpen: boolean; onClose: () => void; student: Student | null; onRegenerated: (student: Student) => void; }
export const QrRegenerateModal: React.FC<Props> = ({ isOpen, onClose, student, onRegenerated }) => {
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  if (!student) return null;
  const regenerate = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(apiUrl('/api/qr/generate-token'), { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const text = await response.text();
      let data: any; try { data = JSON.parse(text); } catch { throw new Error('QR API is unavailable. Check VITE_API_URL and backend deployment.'); }
      if (!response.ok || !data.token || !data.tokenHash) throw new Error(data.error || 'Could not generate QR token.');
      const id = student.id || `std_${student.studentId}`;
      await setDoc(doc(db, 'students', id), { qrTokenHash: data.tokenHash, updatedAt: new Date().toISOString() }, { merge: true });
      const qrUrl = await generateQrDataUrl(data.token); setQr(qrUrl);
      onRegenerated({ ...student, qrTokenHash: data.tokenHash, rawQrToken: data.token });
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Regenerate student QR" description="The old QR will stop working." maxWidth="md">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {qr ? <div className="space-y-3"><img src={qr} alt="New student QR" className="w-40 h-40"/><button onClick={() => downloadDataUrl(qr, `QR_${student.studentId}.png`)}>Download QR</button></div> : <button disabled={busy} onClick={() => void regenerate()}>{busy ? 'Generating…' : 'Confirm and regenerate QR'}</button>}
  </Modal>;
};
