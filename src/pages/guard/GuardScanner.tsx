import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

export const GuardScanner: React.FC = () => {
  const { userProfile } = useAuth();
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventType, setEventType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const scanner = useRef<Html5Qrcode | null>(null);
  const cooldown = useRef(false);

  useEffect(() => () => {
    const active = scanner.current;
    if (active?.isScanning) void active.stop().catch(console.warn);
  }, []);

  const processToken = async (token: string) => {
    if (busy || cooldown.current) return;
    cooldown.current = true;
    setBusy(true);
    setResult('');
    try {
      const response = await fetch(apiUrl('/api/scan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token.trim(), eventType, guardId: userProfile?.uid, guardName: userProfile?.fullName })
      });
      const body = await response.text();
      let data: any;
      try { data = JSON.parse(body); } catch { throw new Error(`Scan API returned non-JSON (HTTP ${response.status}). Check VITE_API_URL/backend deployment.`); }
      if (!response.ok) throw new Error(data.error || `Scan failed (${response.status})`);
      setResult(`Successful: ${data.student?.fullName || data.student?.studentId || 'Student'} — ${data.attendance?.eventType || eventType}`);
    } catch (error: any) {
      setResult(error.message || 'Scan failed.');
    } finally {
      setBusy(false);
      window.setTimeout(() => { cooldown.current = false; }, 2500);
    }
  };

  const start = async () => {
    setCameraError('');
    try {
      const instance = new Html5Qrcode('qr-reader-container');
      scanner.current = instance;
      await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, token => void processToken(token), () => {});
    } catch (error: any) {
      setCameraError(error.message || 'Unable to start camera. Allow camera permission and use HTTPS.');
    }
  };

  const stop = async () => {
    if (scanner.current?.isScanning) await scanner.current.stop();
    scanner.current = null;
  };

  return <main className="max-w-xl mx-auto p-4 space-y-4">
    <h2 className="text-xl font-bold">Gate QR Scanner</h2>
    <div className="flex gap-2"><button onClick={() => setEventType('ENTRY')} className="p-2 border rounded">Entry</button><button onClick={() => setEventType('EXIT')} className="p-2 border rounded">Exit</button></div>
    <div id="qr-reader-container" className="w-full min-h-64" />
    <div className="flex gap-2"><button onClick={() => void start()} className="p-2 bg-blue-600 text-white rounded">Start camera</button><button onClick={() => void stop()} className="p-2 border rounded">Stop</button></div>
    {cameraError && <p role="alert" className="text-red-700">{cameraError}</p>}
    {busy && <p>Checking QR…</p>}{result && <p role="status">{result}</p>}
  </main>;
};
