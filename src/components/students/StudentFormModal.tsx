import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Student, Guardian } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
} from 'firebase/firestore';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { 
  QrCode, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Trash2, 
  Plus, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { apiUrl } from '../../lib/api';

interface StudentFormModalProps {
