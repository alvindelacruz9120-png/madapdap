import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { 
  QrCode, 
  Printer, 
  Download, 
  RefreshCw, 
  Search, 
  Layers, 
  School, 
  ShieldCheck, 
  FileCheck 
} from 'lucide-react';
import { apiUrl } from '../../lib/api';

interface QRCodesProps {
