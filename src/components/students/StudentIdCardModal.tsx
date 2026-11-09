import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { Download, Printer, RefreshCw } from 'lucide-react';

interface StudentIdCardModalProps { isOpen: boolean; onClose: () => void; student: Student | null; rawToken?: string; }
export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({ isOpen, onClose, student, rawToken }) => {
  const { settings } = useSettings();
  const [qrUrl, setQrUrl] = useState(''); const [loading, setLoading] = useState(true); const [qrError, setQrError] = useState('');
  useEffect(() => {
    let mounted = true;
    const token = rawToken || student?.rawQrToken;
    setQrUrl(''); setQrError('');
    if (student && isOpen && token) {
      setLoading(true);
      generateQrDataUrl(token).then(url => { if (mounted) { setQrUrl(url); setLoading(false); } }).catch((e: any) => { if (mounted) { setQrError(e.message || 'QR generation failed.'); setLoading(false); } });
    } else { setLoading(false); }
    return () => { mounted = false; };
  }, [student, rawToken, isOpen]);
  if (!student) return null;
  const print = () => {
    if (!qrUrl) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Student ID - ${student.firstName} ${student.lastName}</title><style>body{font-family:sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:320px;text-align:center;border:2px solid #0f172a;border-radius:16px;overflow:hidden}.header{background:#0f172a;color:white;padding:16px}.qr{width:140px;height:140px;margin:16px auto}</style></head><body><div class="card"><div class="header">${settings.schoolName || 'Madapdap Resettlement High School'}</div><h3>${student.firstName} ${student.lastName}</h3><p>${student.studentId} · ${student.gradeLevel} · ${student.section}</p><img class="qr" src="${qrUrl}"/><p>Student Attendance ID</p></div><script>window.onload=()=>window.print()</script></body></html>`); w.document.close();
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Student ID & QR Badge" description="Printable student identification card" maxWidth="md"><div className="space-y-5"><div className="mx-auto w-[290px] min-h-[430px] bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden flex flex-col text-center"><div className="bg-slate-900 text-white p-3"><img src="/school-logo.png" alt="School logo" className="w-8 h-8 mx-auto rounded-full"/><h4 className="text-xs font-black uppercase mt-1">{settings.schoolName || 'Madapdap Resettlement High School'}</h4><p className="text-[9px] text-amber-300">STUDENT IDENTIFICATION CARD</p></div><div className="p-4"><h3 className="font-black">{student.firstName} {student.lastName}</h3><p className="text-xs text-blue-700">ID: {student.studentId}</p><p className="text-xs text-slate-600">{student.gradeLevel} · {student.section}</p></div><div className="m-auto p-2">{loading ? <RefreshCw className="animate-spin"/> : qrUrl ? <img src={qrUrl} alt="Student QR" className="w-40 h-40"/> : <p className="max-w-[220px] text-xs text-rose-700">{qrError || 'Original QR token is unavailable. Regenerate the QR to create a scannable replacement card.'}</p>}</div><div className="bg-slate-50 border-t p-2 text-[9px]">Scan at gate for attendance logging</div></div><div className="grid grid-cols-2 gap-3"><button disabled={!qrUrl || loading} onClick={() => downloadDataUrl(qrUrl, `QR_${student.studentId}.png`)} className="flex justify-center gap-2 p-2 bg-slate-900 text-white rounded-xl text-xs disabled:opacity-50"><Download className="w-4 h-4"/>Download PNG</button><button disabled={!qrUrl || loading} onClick={print} className="flex justify-center gap-2 p-2 bg-blue-600 text-white rounded-xl text-xs disabled:opacity-50"><Printer className="w-4 h-4"/>Print ID Card</button></div></div></Modal>;
};
export default StudentIdCardModal;
