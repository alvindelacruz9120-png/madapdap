import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student, Guardian } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

interface Props { isOpen: boolean; onClose: () => void; onSaved: (student: Student, rawToken?: string) => void; studentToEdit?: Student | null; }
export const StudentFormModal: React.FC<Props> = ({ isOpen, onClose, onSaved, studentToEdit }) => {
  const { userProfile } = useAuth();
  const [studentId, setStudentId] = useState(studentToEdit?.studentId || '');
  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [gradeLevel, setGradeLevel] = useState(studentToEdit?.gradeLevel || 'Grade 10');
  const [section, setSection] = useState(studentToEdit?.section || '');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');
  const [savedStudent, setSavedStudent] = useState<Student | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      let token = studentToEdit?.rawQrToken || '';
      let tokenHash = studentToEdit?.qrTokenHash || '';
      if (!studentToEdit || !tokenHash) {
        const response = await fetch(apiUrl('/api/qr/generate-token'), { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const text = await response.text(); let data: any;
        try { data = JSON.parse(text); } catch { throw new Error('QR API is unavailable. Configure and deploy the backend first.'); }
        if (!response.ok || !data.token) throw new Error(data.error || 'Token generation failed.');
        token = data.token; tokenHash = data.tokenHash;
      }
      const id = studentToEdit?.id || `std_${studentId.trim()}`;
      const payload = { studentId: studentId.trim(), firstName: firstName.trim(), lastName: lastName.trim(), gradeLevel, section: section.trim(), status: studentToEdit?.status || 'ACTIVE', qrTokenHash: tokenHash, guardianIds: studentToEdit?.guardianIds || [], createdAt: studentToEdit?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Student;
      if (!studentToEdit) {
        const dup = await getDocs(query(collection(db, 'students'), where('studentId', '==', payload.studentId)));
        if (!dup.empty) throw new Error('Student ID already exists.');
      }
      if (guardianName.trim() && guardianEmail.trim()) {
        const gid = `guard_${payload.studentId}_${Date.now()}`;
        await setDoc(doc(db, 'guardians', gid), { guardianId: gid, fullName: guardianName.trim(), email: guardianEmail.trim().toLowerCase(), studentIds: [payload.studentId], notificationsEnabled: true, createdAt: new Date().toISOString() } as Guardian);
        payload.guardianIds = [...(payload.guardianIds || []), gid];
      }
      await setDoc(doc(db, 'students', id), payload, { merge: true });
      const result = { ...payload, id } as Student; onSaved(result, token); setSavedStudent(result);
      if (token) setQr(await generateQrDataUrl(token)); else onClose();
      try { await setDoc(doc(db, 'audit_logs', `audit_${Date.now()}`), { actorId: userProfile?.uid || 'admin', action: studentToEdit ? 'UPDATE_STUDENT' : 'REGISTER_STUDENT', targetId: payload.studentId, timestamp: new Date().toISOString() }); } catch (e) { console.warn(e); }
    } catch (e: any) { setError(e.message || 'Could not save student.'); } finally { setBusy(false); }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={studentToEdit ? 'Edit Student' : 'Register Student'} description="Student and parent details" maxWidth="2xl">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {savedStudent && qr ? <div className="text-center space-y-3"><p>Registered {savedStudent.firstName} {savedStudent.lastName}</p><img src={qr} alt="Student QR" className="w-48 h-48 mx-auto"/><button onClick={() => downloadDataUrl(qr, `QR_${savedStudent.studentId}.png`)}>Download QR</button><button onClick={onClose}>Done</button></div> : <form onSubmit={submit} className="space-y-3">
      <input required placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={!!studentToEdit}/><input required placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)}/><input required placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)}/><input required placeholder="Grade level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}/><input required placeholder="Section" value={section} onChange={e => setSection(e.target.value)}/><input placeholder="Guardian name (optional)" value={guardianName} onChange={e => setGuardianName(e.target.value)}/><input type="email" placeholder="Guardian email (optional)" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)}/><button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save and generate QR'}</button>
    </form>}
  </Modal>;
};
