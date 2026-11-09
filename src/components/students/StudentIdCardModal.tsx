import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';

interface Props { isOpen: boolean; onClose: () => void; student: Student | null; rawToken?: string; }
export const StudentIdCardModal: React.FC<Props> = ({ isOpen, onClose, student, rawToken }) => {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let alive = true; const token = rawToken || student?.rawQrToken;
    if (isOpen && token) generateQrDataUrl(token).then(value => { if (alive) setQr(value); }).catch(console.error);
    else setQr('');
    return () => { alive = false; };
  }, [isOpen, student, rawToken]);
  if (!student) return null;
  return <Modal isOpen={isOpen} onClose={onClose} title="Student ID & QR" description="Student identification card" maxWidth="md">
    <div className="text-center space-y-3"><h3 className="font-bold">{student.firstName} {student.lastName}</h3><p>{student.studentId} · {student.gradeLevel} · {student.section}</p>
    {qr ? <img src={qr} alt="Student QR code" className="w-40 h-40 mx-auto"/> : <p role="alert">QR token is not available. Regenerate the QR to issue a new scannable card.</p>}
    <button disabled={!qr} onClick={() => downloadDataUrl(qr, `QR_${student.studentId}.png`)}>Download QR</button><button onClick={() => window.print()}>Print</button></div>
  </Modal>;
};
