import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  Printer, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { apiUrl } from '../../lib/api';

interface QrRegenerateModalProps {
