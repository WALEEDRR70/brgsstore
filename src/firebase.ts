import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVePkvAEhyNPQhPD77TQuzkp9xsduIXWk",
  authDomain: "unified-client-portal.firebaseapp.com",
  projectId: "unified-client-portal",
  storageBucket: "unified-client-portal.firebasestorage.app",
  messagingSenderId: "1090479421245",
  appId: "1:1090479421245:web:071365946d61a74315b754"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- دالة تسجيل نشاط الموظفين ---
export async function logEmployeeActivity({
  actionType,
  userId,
  username,
  details,
  affectedId,
  affectedType,
  extra
}: {
  actionType: string; // مثال: إضافة، حذف، تعديل، تغيير حالة
  userId: string;
  username: string;
  details: string;
  affectedId?: string;
  affectedType?: string; // مثال: عميل، مستخدم
  extra?: any;
}) {
  try {
    const log = {
      actionType,
      userId,
      username,
      details,
      affectedId: affectedId || '',
      affectedType: affectedType || '',
      extra: extra || null,
      createdAt: Timestamp.now()
    };
    await addDoc(collection(db, 'activityLogs'), log);
  } catch (error) {
    console.error('فشل تسجيل النشاط:', error);
  }
}

export { app, auth, db };
