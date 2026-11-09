import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  ScanLine, 
  Camera, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Keyboard 
} from 'lucide-react';
import { ScanResult, EventType } from '../../types';
import { apiUrl } from '../../lib/api';

export const GuardScanner: React.FC = () => {
