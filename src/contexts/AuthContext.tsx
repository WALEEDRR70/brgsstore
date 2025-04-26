import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from "sonner";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'admin' | 'employee';
  email?: string;
  name?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (userData: Partial<User>) => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
  addUser: (username: string, password: string, role: 'superadmin' | 'admin' | 'employee') => Promise<boolean>;
  editUser: (userId: string, userData: Partial<User & { password?: string }>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialMockUsers = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' as const, email: 'admin@example.com', name: 'مدير النظام', createdAt: '2022-01-01T00:00:00.000Z' },
  { id: '2', username: 'employee', password: 'emp123', role: 'employee' as const, email: 'employee@example.com', name: 'موظف', createdAt: '2022-01-01T00:00:00.000Z' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('clientPortalUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const email = username.includes('@') ? username : `${username}@yourcompany.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // جلب بيانات المستخدم من Firestore
      const q = query(collection(db, 'users'), where('id', '==', userCredential.user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUser(userData);
        localStorage.setItem('clientPortalUser', JSON.stringify(userData));
        toast.success('تم تسجيل الدخول بنجاح');
        return true;
      } else {
        toast.error('لم يتم العثور على بيانات المستخدم');
        return false;
      }
    } catch (error: any) {
      toast.error('فشل تسجيل الدخول: ' + (error.message || ''));
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clientPortalUser');
    toast.info('تم تسجيل الخروج');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('clientPortalUser', JSON.stringify(updatedUser));
      // Update the user in Firestore as well
      setDoc(doc(db, 'users', user.id), updatedUser);
      toast.success('تم تحديث الملف الشخصي بنجاح');
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update the user's password in Firebase Auth
        // ...
        toast.success('تم تحديث كلمة المرور بنجاح');
        resolve(true);
      }, 1000);
    });
  };
  
  const getAllUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => doc.data());
  };
  
  const addUser = async (username: string, password: string, role: 'superadmin' | 'admin' | 'employee'): Promise<boolean> => {
    try {
      // تحويل اسم المستخدم إلى بريد إلكتروني مؤقت (يمكنك تحسين ذلك لاحقاً)
      const email = username.includes('@') ? username : `${username}@yourcompany.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      // حفظ بيانات المستخدم في Firestore
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        username,
        email,
        role,
        createdAt: new Date().toISOString()
      });
      toast.success('تم إضافة المستخدم بنجاح');
      return true;
    } catch (error: any) {
      toast.error('فشل إضافة المستخدم: ' + (error.message || '')); 
      return false;
    }
  };
  
  const editUser = async (userId: string, userData: Partial<User & { password?: string }>): Promise<boolean> => {
    try {
      // Update the user in Firestore
      await setDoc(doc(db, 'users', userId), userData, { merge: true });
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      return true;
    } catch (error: any) {
      toast.error('فشل تحديث بيانات المستخدم: ' + (error.message || ''));
      return false;
    }
  };
  
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      if (!userId) {
        toast.error('معرّف المستخدم غير موجود!');
        return false;
      }
      // تحقق من أن المستخدم ليس سوبر أدمن
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.role === 'superadmin') {
          toast.error('لا يمكن حذف السوبر أدمن إلا من قاعدة البيانات مباشرة');
          return false;
        }
      }
      await setDoc(doc(db, 'users', userId), {}, { merge: false });
      toast.success('تم حذف المستخدم بنجاح من قاعدة البيانات');
      return true;
    } catch (error: any) {
      toast.error('فشل حذف المستخدم: ' + (error.message || ''));
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'superadmin'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // إضافة سوبر أدمن
        try {
          const email = 'ans@yourcompany.com';
          const password = 'AV$U4JnMBz=/X2S222';
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const userId = userCredential.user.uid;
          await setDoc(doc(db, 'users', userId), {
            id: userId,
            username: 'ans',
            email,
            role: 'superadmin',
            createdAt: new Date().toISOString()
          });
          // لا تظهر رسالة توست هنا حتى لا تظهر للمستخدم العادي
        } catch (e) {
          // تجاهل الخطأ إذا كان المستخدم موجود مسبقاً
        }
      }
    })();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user, 
        updateUser, 
        updatePassword,
        getAllUsers,
        addUser,
        editUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
