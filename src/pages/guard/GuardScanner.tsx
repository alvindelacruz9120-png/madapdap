import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';

export const GuardScanner: React.FC = () => {
  const { userProfile } = useAuth();
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventType, setEventType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const scanner = useRef<Html5Qrcode | null>(null);
  const cooldown = useRef(false);

  useEffect(() => {
    return () => {
      const active = scanner.current;
      if (active?.isScanning) {
        void active.stop().catch(console.warn);
      }
    };
  }, []);

  const processToken = async (token: string) => {
    if (busy || cooldown.current) return;
    cooldown.current = true;
    setBusy(true);
    setResult('');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: token.trim(),
          eventType,
          guardId: userProfile?.uid || 'gate-guard-1',
          guardName: userProfile?.fullName || 'Duty Guard',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process student QR.');
      }

      setResult(
        `Successful: ${data.student?.fullName || data.student?.studentId || 'Student'} — ${data.attendance?.eventType || eventType}`
      );
    } catch (error: any) {
      setResult(error.message || 'Scan failed.');
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        cooldown.current = false;
      }, 2500);
    }
  };

  const start = async () => {
    setCameraError('');
    try {
      const instance = new Html5Qrcode('qr-reader-container');
      scanner.current = instance;
      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (token) => void processToken(token),
        () => {}
      );
    } catch (error: any) {
      setCameraError(error.message || 'Unable to start camera. Allow camera permission and use HTTPS.');
    }
  };

  const stop = async () => {
    if (scanner.current?.isScanning) {
      await scanner.current.stop();
    }
    scanner.current = null;
  };

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Gate QR Scanner</h2>
        <p className="text-xs text-slate-500 mt-1">Scan student QR codes for entry and exit verification</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setEventType('ENTRY')}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border ${
              eventType === 'ENTRY'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            ENTRY
          </button>
          <button
            onClick={() => setEventType('EXIT')}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border ${
              eventType === 'EXIT'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            EXIT
          </button>
        </div>

        <div id="qr-reader-container" className="w-full min-h-[260px] rounded-xl bg-slate-100 overflow-hidden border border-slate-200" />

        <div className="flex gap-2">
          <button onClick={() => void start()} className="flex-1 p-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Start camera
          </button>
          <button onClick={() => void stop()} className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            Stop
          </button>
        </div>

        {cameraError && <p role="alert" className="text-red-700 text-xs">{cameraError}</p>}
        {busy && <p className="text-xs text-slate-600">Checking QR...</p>}
        {result && <p className="text-xs text-slate-700">{result}</p>}
      </div>
    </main>
  );
};

export default GuardScanner;
