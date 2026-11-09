import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Student } from '../../types';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { apiUrl } from '../../lib/api';

interface Props { onSelectStudentForCard: (student: Student) => void; onSelectStudentForRegenerate: (student: Student) => void; }
export const QRCodes: React.FC<Props> = ({ onSelectStudentForCard, onSelectStudentForRegenerate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  useEffect(() => onSnapshot(collection(db, 'students'), snap => setStudents(snap.docs.map(d => ({ ...d.data(), id: d.id } as Student))), e => setError(e.message)), []);
  const printAll = async () => {
    try {
      for (const student of students) {
        const token = student.rawQrToken;
        if (!token) continue;
        const url = await generateQrDataUrl(token);
        downloadDataUrl(url, `QR_${student.studentId}.png`);
      }
    } catch (e: any) { setError(e.message); }
  };
  return <section className="max-w-6xl mx-auto p-4 space-y-4">
    <h2 className="text-xl font-bold">QR Codes & Student ID Cards</h2>
    <button onClick={() => void printAll()} className="p-2 bg-blue-600 text-white rounded">Download available QR codes</button>
    {error && <p role="alert">{error}</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{students.map(s => <article key={s.studentId} className="p-4 border rounded-xl">
      <h3 className="font-bold">{s.firstName} {s.lastName}</h3><p>{s.studentId} · {s.gradeLevel} · {s.section}</p>
      <div className="flex gap-2 mt-3"><button onClick={() => onSelectStudentForCard(s)} className="p-2 border rounded">Print ID</button><button onClick={() => onSelectStudentForRegenerate(s)} className="p-2 border rounded">Regenerate QR</button></div>
    </article>)}</div>
  </section>;
};
