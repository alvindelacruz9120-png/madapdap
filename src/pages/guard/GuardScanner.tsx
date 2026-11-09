import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, doc, getDocs, increment, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { hashTokenClient } from '../../utils/qr';
import { ScanResult, Student, EventType } from '../../types';
import { AlertTriangle, Camera, CheckCircle2, Clock, Keyboard, LogIn, LogOut, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

export const GuardScanner: React.FC = () => {
  const { userProfile } = useAuth();
  const [mode, setMode] = useState<EventType>('ENTRY');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const cooldownRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    const current = scannerRef.current;
    if (current?.isScanning) void current.stop().catch(console.warn);
  }, []);

  const processToken = async (rawToken: string) => {
    if (busyRef.current || cooldownRef.current) return;
    busyRef.current = true;
    cooldownRef.current = true;
    setBusy(true);
    setError('');
    setResult(null);

    try {
      if (!userProfile?.uid || userProfile.uid === 'guard_demo_session_01') {
        throw new Error('Use a Google or email account with an active Guard/Admin role. Demo scanner sessions cannot write attendance to the database.');
      }
      const tokenHash = await hashTokenClient(rawToken);
      const matches = await getDocs(query(collection(db, 'students'), where('qrTokenHash', '==', tokenHash)));
      if (matches.empty) throw new Error('This QR code is invalid or has been replaced. Ask the administrator to issue a new QR.');

      const studentDoc = matches.docs[0];
      const student = { ...studentDoc.data(), id: studentDoc.id } as Student;
      if (student.status !== 'ACTIVE') throw new Error(`Student ${student.firstName} ${student.lastName} is ${student.status}. Access denied.`);

      const timezone = 'Asia/Manila';
      const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const part = (type: string) => dateParts.find((p) => p.type === type)?.value || '';
      const date = `${part('year')}-${part('month')}-${part('day')}`;
      const timestamp = new Date().toISOString();

      const prior = await getDocs(query(collection(db, 'attendance_events'), where('studentId', '==', student.studentId), where('date', '==', date)));
      const lastTimestamp = prior.docs.map((d) => String(d.data().timestamp || '')).sort().at(-1);
      if (lastTimestamp && Date.now() - new Date(lastTimestamp).getTime() < 60_000) {
        const wait = Math.ceil((60_000 - (Date.now() - new Date(lastTimestamp).getTime())) / 1000);
        throw new Error(`Duplicate scan. Please wait ${wait} seconds before scanning this student again.`);
      }

      const time = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(new Date());
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      const minute = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, minute: '2-digit' }).format(new Date()));
      const lateCutoff = 7 * 60 + 30;
      const status = mode === 'ENTRY' ? (hour * 60 + minute > lateCutoff ? 'LATE' : 'PRESENT') : 'N/A';
      const eventId = `evt_${Date.now()}_${globalThis.crypto.getRandomValues(new Uint32Array(1))[0].toString(16)}`;
      const event = {
        eventId, studentId: student.studentId, studentName: `${student.firstName} ${student.lastName}`,
        eventType: mode, timestamp, guardId: userProfile.uid, guardName: userProfile.fullName || 'Duty Guard',
        date, status, idempotencyKey: `${student.studentId}_${mode}_${date}_${timestamp}`, createdAt: timestamp,
      };
      await setDoc(doc(db, 'attendance_events', eventId), event);

      const attendanceRef = doc(db, 'attendance', `${student.studentId}_${date}`);
      const attendanceData = {
        studentId: student.studentId, studentName: `${student.firstName} ${student.lastName}`,
        gradeLevel: student.gradeLevel, section: student.section, date,
        status: mode === 'ENTRY' ? status : 'PRESENT',
        firstEntryAt: mode === 'ENTRY' ? timestamp : null,
        lastExitAt: mode === 'EXIT' ? timestamp : null,
        entryCount: mode === 'ENTRY' ? increment(1) : increment(0),
        exitCount: mode === 'EXIT' ? increment(1) : increment(0),
        updatedAt: timestamp,
      };
      await setDoc(attendanceRef, attendanceData, { merge: true });

      const fullName = `${student.firstName} ${student.middleName ? `${student.middleName} ` : ''}${student.lastName}`;
      setResult({
        success: true,
        student: { studentId: student.studentId, firstName: student.firstName, middleName: student.middleName, lastName: student.lastName, fullName, gradeLevel: student.gradeLevel, section: student.section, status: student.status },
        attendance: { eventId, eventType: mode, date, time, status },
        notifications: { totalTargeted: 0, dispatched: [] },
      });
    } catch (e: any) {
      console.error('QR attendance scan failed:', e);
      setError(e?.code === 'permission-denied' ? 'Firestore denied this scan. Sign in with an active Guard/Admin account and verify deployed Firestore rules.' : (e.message || 'Could not verify QR.'));
    } finally {
      busyRef.current = false;
      setBusy(false);
      window.setTimeout(() => { cooldownRef.current = false; }, 2500);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 }, (text) => void processToken(text), () => {});
      setScanning(true);
    } catch (e: any) {
      setCameraError(e.message || 'Camera permission is required. Open this site over HTTPS and allow camera access.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      await scannerRef.current?.clear();
    } catch (e) { console.warn('Stopping QR scanner failed:', e); }
    scannerRef.current = null;
    setScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-base font-extrabold text-slate-900">Gate Attendance Terminal</h2><p className="text-xs text-slate-500">{userProfile?.fullName || 'Guard on Duty'} · {now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' })}</p></div>
          <span className={`text-xs font-bold ${scanning ? 'text-emerald-700' : 'text-slate-500'}`}>{scanning ? 'Camera Live' : 'Camera Standby'}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button type="button" onClick={() => setMode('ENTRY')} className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${mode === 'ENTRY' ? 'bg-emerald-600 text-white' : 'bg-slate-50 border text-slate-600'}`}><LogIn className="w-5 h-5"/> STUDENT ENTRY</button>
          <button type="button" onClick={() => setMode('EXIT')} className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${mode === 'EXIT' ? 'bg-blue-600 text-white' : 'bg-slate-50 border text-slate-600'}`}><LogOut className="w-5 h-5"/> STUDENT EXIT</button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
        <div id="qr-reader-container" className="w-full min-h-[280px] bg-slate-950 rounded-xl overflow-hidden" />
        <div className="flex gap-2"><button onClick={() => void startCamera()} className="flex-1 p-2.5 bg-blue-600 rounded-xl text-sm font-bold"><Camera className="inline w-4 h-4 mr-2"/>Start camera</button><button onClick={() => void stopCamera()} className="p-2.5 border border-slate-600 rounded-xl text-sm">Stop</button></div>
        <button type="button" onClick={() => setShowManual(!showManual)} className="text-xs text-slate-300 flex items-center gap-2"><Keyboard className="w-4 h-4"/>Manual token entry</button>
      </div>
      {cameraError && <p role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs"><AlertTriangle className="inline w-4 h-4 mr-2"/>{cameraError}</p>}
      {showManual && <form onSubmit={(e) => { e.preventDefault(); void processToken(manualCode); setManualCode(''); }} className="flex gap-2 p-3 bg-white border rounded-xl"><input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Scan token" className="flex-1 p-2 border rounded-lg text-xs"/><button disabled={busy || !manualCode.trim()} className="px-4 bg-slate-900 text-white rounded-lg text-xs">Verify</button></form>}
      {busy && <p className="text-sm text-slate-600 flex gap-2"><RefreshCw className="w-4 h-4 animate-spin"/>Verifying QR...</p>}
      {error && <div role="alert" className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-800 text-sm flex gap-2"><XCircle className="w-5 h-5 shrink-0"/>{error}</div>}
      {result && <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-900"><div className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/>Student {result.attendance.eventType} successful</div><div className="mt-2 font-semibold">{result.student.fullName} · {result.student.studentId}</div><div className="text-sm flex items-center gap-2"><Clock className="w-4 h-4"/>{result.attendance.date} {result.attendance.time} · {result.attendance.status}</div><p className="text-xs mt-2">Attendance recorded. Parent email alerts require the backend email service.</p></div>}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-slate-500 text-xs flex items-center gap-2"><ShieldCheck className="w-5 h-5"/>QR tokens are verified against the signed-in user's Firestore permissions.</div>
    </div>
  );
};

export default GuardScanner;
