import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateQrDataUrl, generateQrToken, hashTokenClient, downloadDataUrl } from '../../utils/qr';
import { AlertTriangle, RefreshCw, Download, Printer, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface QrRegenerateModalProps { isOpen: boolean; onClose: () => void; student: Student | null; onRegenerated: (updatedStudent: Student) => void; }
export const QrRegenerateModal: React.FC<QrRegenerateModalProps> = ({ isOpen, onClose, student, onRegenerated }) => {
  const { userProfile } = useAuth(); const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ rawToken: string; qrUrl: string } | null>(null);
  const [error, setError] = useState('');
  if (!student) return null;

  const handleRegenerate = async () => {
    setLoading(true); setError('');
    try {
      const token = generateQrToken();
      const tokenHash = await hashTokenClient(token);
      const timestamp = new Date().toISOString();
      const studentDocId = student.id || `std_${student.studentId}`;
      await setDoc(doc(db, 'students', studentDocId), { qrTokenHash: tokenHash, updatedAt: timestamp }, { merge: true });
      try { await setDoc(doc(db, 'audit_logs', `audit_${Date.now()}`), { actorId: userProfile?.uid || 'admin', action: 'REGENERATE_QR', targetId: student.studentId, details: `Reissued QR credential for ${student.firstName} ${student.lastName}.`, timestamp }); } catch (e) { console.warn(e); }
      const qrUrl = await generateQrDataUrl(token);
      onRegenerated({ ...student, qrTokenHash: tokenHash, rawQrToken: token, updatedAt: timestamp });
      setSuccessData({ rawToken: token, qrUrl });
    } catch (e: any) { setError(e.message || 'QR regeneration failed.'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    if (!successData) return;
    const win = window.open('', '_blank'); if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Replacement QR Card</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh}.card{width:320px;text-align:center;border:2px solid #0f172a;border-radius:16px;overflow:hidden}.header{background:#0f172a;color:#fff;padding:16px}.qr{width:140px;height:140px;margin:20px auto}</style></head><body><div class="card"><div class="header">${settings.schoolName || 'Madapdap Resettlement High School'}<div>REPLACEMENT ID BADGE</div></div><h3>${student.firstName} ${student.lastName}</h3><p>${student.studentId} · ${student.gradeLevel} · ${student.section}</p><img class="qr" src="${successData.qrUrl}" alt="QR"/><p>Previous QR revoked.</p></div><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return <Modal isOpen={isOpen} onClose={onClose} title={successData ? 'New QR Credential Ready' : 'Revoke & Regenerate QR Code'} description={successData ? 'Previous QR is revoked. Download or print the replacement.' : 'The old card stops working after rotation.'} maxWidth="md">
    {error && <p role="alert" className="mb-3 text-xs text-rose-700">{error}</p>}
    {successData ? <div className="py-2 text-center space-y-4"><div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7"/></div><h4 className="text-sm font-bold">{student.firstName} {student.lastName} ({student.studentId})</h4><img src={successData.qrUrl} alt="New QR" className="w-40 h-40 mx-auto"/><div className="grid grid-cols-2 gap-3"><button onClick={() => downloadDataUrl(successData.qrUrl, `QR_${student.studentId}_new.png`)} className="flex justify-center gap-2 p-2 bg-slate-900 text-white rounded-xl text-xs"><Download className="w-4 h-4"/>Download PNG</button><button onClick={handlePrint} className="flex justify-center gap-2 p-2 bg-blue-600 text-white rounded-xl text-xs"><Printer className="w-4 h-4"/>Print Card</button></div></div> : <div className="space-y-4"><div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs"><AlertTriangle className="inline w-4 h-4 mr-2"/>Regenerating will revoke the old QR for {student.firstName} {student.lastName}.</div><div className="flex justify-end gap-3"><button onClick={onClose} disabled={loading} className="px-4 py-2 text-xs">Cancel</button><button onClick={() => void handleRegenerate()} disabled={loading} className="flex gap-2 px-4 py-2 text-xs bg-rose-600 text-white rounded-xl">{loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}Confirm & Regenerate QR</button></div></div>}
  </Modal>;
};
export default QrRegenerateModal;
