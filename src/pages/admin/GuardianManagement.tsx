import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Guardian, Student } from '../../types';
import { apiUrl } from '../../lib/api';

export const GuardianManagement: React.FC = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    const a = onSnapshot(collection(db, 'guardians'), snap => setGuardians(snap.docs.map(d => ({ ...d.data(), guardianId: d.id } as Guardian))), e => setError(e.message));
    const b = onSnapshot(collection(db, 'students'), snap => { const map: Record<string, Student> = {}; snap.docs.forEach(d => { const s = d.data() as Student; map[s.studentId] = s; }); setStudents(map); }, e => setError(e.message));
    return () => { a(); b(); };
  }, []);
  const sendTest = async (g: Guardian) => {
    try {
      const student = g.studentIds?.[0] ? students[g.studentIds[0]] : undefined;
      if (!student?.rawQrToken) throw new Error('Student raw QR token is unavailable; test alert cannot use the hash as a QR token.');
      const response = await fetch(apiUrl('/api/scan'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qrToken: student.rawQrToken, eventType: 'ENTRY', guardId: 'admin_test', guardName: 'Admin test' }) });
      const text = await response.text(); let data: any; try { data = JSON.parse(text); } catch { throw new Error('API returned non-JSON. Check backend URL.'); }
      if (!response.ok) throw new Error(data.error || 'Test alert failed.');
      alert(`Scan test completed for ${g.email}.`);
    } catch (e: any) { alert(e.message); }
  };
  return <section className="p-4 space-y-3"><h2 className="text-xl font-bold">Guardians</h2>{error && <p role="alert">{error}</p>}{guardians.map(g => <article key={g.guardianId} className="border rounded p-3 flex justify-between"><span>{g.fullName} — {g.email}</span><button onClick={() => void sendTest(g)}>Test alert</button><button onClick={() => void setDoc(doc(db, 'guardians', g.guardianId), { notificationsEnabled: g.notificationsEnabled === false }, { merge: true })}>Toggle alerts</button></article>)}</section>;
};
