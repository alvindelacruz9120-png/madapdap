import React, { useState, useEffect } from 'react';
import { Guardian, Student } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserCheck, RefreshCw, Mail, Shield } from 'lucide-react';
import { apiUrl } from '../../lib/api';

export const GuardianManagement: React.FC = () => {
