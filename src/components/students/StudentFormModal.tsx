import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Guardian, Student } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { generateQrDataUrl, generateQrToken, hashTokenClient, downloadDataUrl } from '../../utils/qr';
import { useAuth } from '../../context/AuthContext';

interface StudentFormModalProps { isOpen: boolean; onClose: () => void; onSaved: (student: Student, rawToken?: string) => void; studentToEdit?: Student | null; }
export const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSaved, studentToEdit }) => {
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
  const [qrUrl, setQrUrl] = useState('');
  const [savedStudent, setSavedStudent] = useState<Student | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const cleanStudentId = studentId.trim();
      if (!cleanStudentId || !firstName.trim() || !lastName.trim() || !section.trim()) throw new Error('Complete all required student details.');
      let token = studentToEdit?.rawQrToken || '';
      let tokenHash = studentToEdit?.qrTokenHash || '';
      if (!studentToEdit || !tokenHash) {
        token = generateQrToken();
        tokenHash = await hashTokenClient(token);
      }
      if (!studentToEdit) {
        const dup = await getDocs(query(collection(db, 'students'), where('studentId', '==', cleanStudentId)));
        if (!dup.empty) throw new Error('Student ID already exists.');
      }
      const payload = { studentId: cleanStudentId, firstName: firstName.trim(), lastName: lastName.trim(), gradeLevel, section: section.trim(), status: studentToEdit?.status || 'ACTIVE', qrTokenHash: tokenHash, guardianIds: studentToEdit?.guardianIds || [], createdAt: studentToEdit?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Student;
      if (guardianName.trim() && guardianEmail.trim()) {
        const gid = `guard_${cleanStudentId}_${Date.now()}`;
        await setDoc(doc(db, 'guardians', gid), { guardianId: gid, fullName: guardianName.trim(), email: guardianEmail.trim().toLowerCase(), studentIds: [cleanStudentId], emailVerified: true, notificationsEnabled: true, createdAt: new Date().toISOString() } as Guardian, { merge: true });
        payload.guardianIds = [...payload.guardianIds, gid];
      }
      const studentDocId = studentToEdit?.id || `std_${cleanStudentId}`;
      await setDoc(doc(db, 'students', studentDocId), payload, { merge: true });
      const finalStudent = { ...payload, id: studentDocId } as Student;
      onSaved(finalStudent, token || undefined);
      if (token) { setSavedStudent(finalStudent); setQrUrl(await generateQrDataUrl(token)); }
      else onClose();
      try { await setDoc(doc(db, 'audit_logs', `audit_${Date.now()}`), { actorId: userProfile?.uid || 'admin', action: studentToEdit ? 'UPDATE_STUDENT' : 'REGISTER_STUDENT', targetId: payload.studentId, timestamp: new Date().toISOString() }); } catch (auditError) { console.warn(auditError); }
    } catch (e: any) { setError(e.message || 'Could not save student.'); }
    finally { setBusy(false); }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title={studentToEdit ? 'Edit Student' : 'Register Student'} description="Student and guardian details" maxWidth="2xl">
    {error && <p role="alert" className="text-red-700 text-xs mb-3">{error}</p>}
    {savedStudent && qrUrl ? <div className="text-center space-y-4"><h3 className="text-base font-bold">{savedStudent.firstName} {savedStudent.lastName}</h3><img src={qrUrl} alt="Student QR" className="w-48 h-48 mx-auto"/><div className="flex gap-3 justify-center"><button onClick={() => downloadDataUrl(qrUrl, `QR_${savedStudent.studentId}.png`)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Download QR</button><button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Done</button></div></div> : <form onSubmit={submit} className="space-y-4"><div className="grid md:grid-cols-2 gap-3"><input required placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={!!studentToEdit} className="w-full border rounded-xl px-3 py-2 text-xs"/><input required placeholder="Grade level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/><input required placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/><input required placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/></div><input required placeholder="Section" value={section} onChange={e => setSection(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/><div className="grid md:grid-cols-2 gap-3 border-t pt-4"><input placeholder="Guardian name (optional)" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/><input type="email" placeholder="Guardian email (optional)" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs"/></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 text-xs">Cancel</button><button type="submit" disabled={busy} className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl disabled:opacity-50">{busy ? 'Saving...' : 'Save & Generate QR'}</button></div></form>}
  </Modal>;
};
export default StudentFormModal;
