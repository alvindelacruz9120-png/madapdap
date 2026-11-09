import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qr';
import { Download, Printer, Shield, School, RefreshCw } from 'lucide-react';
import { apiUrl } from '../../lib/api';

interface StudentIdCardModalProps {
