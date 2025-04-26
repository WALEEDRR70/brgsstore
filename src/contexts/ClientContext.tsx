import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { logEmployeeActivity } from '../firebase';

export interface Client {
  id: number;
  name: string;
  phone: string;
  idNumber?: string;
  identityNumber?: string;
  uploadDate: string;
  status: 'approved' | 'rejected' | 'pending' | 'tammam';
  completionDate?: string;
  rejectionReason?: string;
  acqaraApproved?: boolean;
  mawaraApproved?: boolean;
  incomplete?: boolean;
  employeeId?: string;
  addedBy: string;
  processedBy?: string; // Added processedBy property
  serviceCompletionDate?: string; // تاريخ إكمال الخدمة
  deleted?: boolean;
  deleteDate?: string;
  completedService?: boolean; // هل أتم الخدمة
  incompleteReason?: string; // سبب عدم الإتمام
  pendingReason?: string; // سبب الانتظار
  installmentNotes?: string; // ملاحضات التقسيط
}

interface ClientContextType {
  clients: Client[];
  deletedClients: Client[];
  addClient: (client: Omit<Client, 'id' | 'uploadDate'>) => Promise<Client | null>;
  updateClient: (client: Client) => Promise<boolean>;
  getClients: () => Client[];
  getDeletedClients: () => Client[];
  deleteClient: (id: number) => Promise<void>;
  restoreClient: (id: number) => void;
  permanentDeleteClient: (id: number) => void;
  searchClients: (term: string) => Client[];
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [deletedClients, setDeletedClients] = useState<Client[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedClients: Client[] = [];
      const fetchedDeleted: Client[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.deleted) {
          fetchedDeleted.push(data as Client);
        } else {
          fetchedClients.push(data as Client);
        }
      });
      setClients(fetchedClients);
      setDeletedClients(fetchedDeleted);
    });
    return () => unsubscribe();
  }, []);

  const addClient = async (clientData: Omit<Client, 'id' | 'uploadDate'>) => {
    if (!clientData.name || !clientData.phone || !clientData.status || !clientData.addedBy) {
      console.error('Missing required client data fields');
      return null;
    }
    const today = new Date();
    const newClient: Client = {
      ...clientData,
      id: Math.floor(Math.random() * 10000),
      uploadDate: today.toISOString().split('T')[0],
    };
    try {
      await addDoc(collection(db, 'clients'), newClient);
      toast.success('تم إضافة العميل إلى قاعدة بيانات فايربيس بنجاح');
      // سجل النشاط
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
        await logEmployeeActivity({
          actionType: 'إضافة عميل',
          userId: sessionUser?.id || '',
          username: sessionUser?.username || '',
          details: `تم إضافة عميل جديد (${newClient.name})`,
          affectedId: newClient.id?.toString() || '',
          affectedType: 'عميل',
          extra: { الحالة: newClient.status }
        });
      }
      return newClient;
    } catch (error: any) {
      console.error('خطأ في إضافة العميل إلى فايربيس:', error);
      toast.error(`حدث خطأ أثناء إضافة العميل: ${error?.message || error?.code || 'غير معروف'}`);
      return null;
    }
  };

  const updateClient = async (client: Client): Promise<boolean> => {
    try {
      // جلب بيانات العميل القديمة قبل التحديث
      const q = query(collection(db, 'clients'), where('id', '==', client.id));
      const querySnapshot = await getDocs(q);
      let oldClient: Client | null = null;
      for (const docSnap of querySnapshot.docs) {
        oldClient = docSnap.data() as Client;
        await updateDoc(doc(db, 'clients', docSnap.id), { ...client });
      }
      toast.success('تم تحديث بيانات العميل بنجاح');
      // تحديد الفروقات بين القديم والجديد
      let changes: string[] = [];
      if (oldClient) {
        if (oldClient.status !== client.status) {
          changes.push(`حالة العميل: من "${oldClient.status}" إلى "${client.status}"`);
        }
        
        // التحقق من تغيير ملاحظات التقسيط بشكل خاص
        const oldInstallmentNotes = oldClient.installmentNotes || '';
        const newInstallmentNotes = client.installmentNotes || '';
        
        if (oldInstallmentNotes !== newInstallmentNotes) {
          // إذا كان الحقل فارغاً سابقاً وتمت إضافة قيمة جديدة
          if (!oldInstallmentNotes && newInstallmentNotes) {
            changes.push(`إضافة ملاحظات التقسيط: "${newInstallmentNotes}"`);
          } 
          // إذا كانت هناك قيمة سابقة وتم حذفها
          else if (oldInstallmentNotes && !newInstallmentNotes) {
            changes.push(`حذف ملاحظات التقسيط. القيمة السابقة: "${oldInstallmentNotes}"`);
          } 
          // إذا تم تعديل القيمة
          else {
            changes.push(`ملاحظات التقسيط: "${oldInstallmentNotes}" ← "${newInstallmentNotes}"`);
          }
        }
        
        // استخراج التعديلات الأخرى
        Object.keys(client).forEach(key => {
          if (
            key !== 'status' && 
            key !== 'installmentNotes' && // استثناء حقل ملاحظات التقسيط لأننا تعاملنا معه بالفعل
            client[key as keyof Client] !== oldClient![key as keyof Client]
          ) {
            changes.push(`${key}: "${oldClient![key as keyof Client] ?? ''}" ← "${client[key as keyof Client] ?? ''}"`);
          }
        });
      }
      
      // تسجيل النشاط في سجل النشاطات
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
        
        // تحديد نوع العملية بناءً على التغييرات
        let actionType = 'تعديل عميل';
        let extraDetails = {};
        
        // إذا كان التغيير الوحيد هو إضافة أو تعديل ملاحظات التقسيط
        const onlyInstallmentNotesChanged = changes.length === 1 && 
          (changes[0].includes('ملاحظات التقسيط') || 
           changes[0].includes('إضافة ملاحظات التقسيط') || 
           changes[0].includes('حذف ملاحظات التقسيط'));
        
        if (onlyInstallmentNotesChanged && client.status === 'tammam') {
          actionType = 'تعديل ملاحظات التقسيط';
          extraDetails = { 
            الحالة: 'تمم',
            الملاحظات_السابقة: oldClient?.installmentNotes || '',
            الملاحظات_الجديدة: client.installmentNotes || '',
          };
        } else {
          extraDetails = { الحالة_السابقة: oldClient?.status, التعديلات: changes };
        }
        
        await logEmployeeActivity({
          actionType: actionType,
          userId: sessionUser?.id || '',
          username: sessionUser?.username || '',
          details: `تم تعديل العميل (${client.name})${changes.length > 0 ? ': ' + changes.join(' | ') : ''}`,
          affectedId: client.id?.toString() || '',
          affectedType: 'عميل',
          extra: changes.length > 0 ? extraDetails : undefined
        });
      }
      return true;
    } catch (error) {
      console.error('خطأ في تحديث العميل في فايربيس:', error);
      toast.error('حدث خطأ أثناء تحديث العميل في قاعدة بيانات فايربيس');
      return false;
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const q = query(collection(db, 'clients'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      const deletedClient = clients.find(client => client.id === id);

      // Actualizar el documento en Firestore
      for (const docSnap of querySnapshot.docs) {
        await updateDoc(doc(db, 'clients', docSnap.id), { 
          deleted: true, 
          deleteDate: new Date().toISOString().split('T')[0] 
        });
      }

      // Actualizar el estado local - primero remover el cliente del arreglo clients
      setClients(prevClients => prevClients.filter(client => client.id !== id));
      
      // Luego agregar el cliente al arreglo deletedClients
      if (deletedClient) {
        setDeletedClients(prevDeleted => [
          ...prevDeleted, 
          { 
            ...deletedClient, 
            deleted: true, 
            deleteDate: new Date().toISOString().split('T')[0] 
          }
        ]);
      }
      
      toast.success('تم حذف العميل بنجاح');
      
      // سجل النشاط
      if (typeof window !== 'undefined' && deletedClient) {
        const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
        await logEmployeeActivity({
          actionType: 'حذف عميل',
          userId: sessionUser?.id || '',
          username: sessionUser?.username || '',
          details: `تم حذف العميل (${deletedClient.name})`,
          affectedId: deletedClient.id?.toString() || '',
          affectedType: 'عميل',
          extra: { الحالة_السابقة: deletedClient.status }
        });
      }
    } catch (error) {
      console.error('خطأ في حذف العميل من فايربيس:', error);
      toast.error('حدث خطأ أثناء حذف العميل من قاعدة بيانات فايربيس');
    }
  };

  const restoreClient = async (id: number) => {
    try {
      const q = query(collection(db, 'clients'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      let restoredClient: Client | null = null;
      for (const docSnap of querySnapshot.docs) {
        restoredClient = docSnap.data() as Client;
        await updateDoc(doc(db, 'clients', docSnap.id), { deleted: false, deleteDate: null });
      }
      toast.success('تم استعادة العميل بنجاح');
      // سجل النشاط
      if (typeof window !== 'undefined' && restoredClient) {
        const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
        await logEmployeeActivity({
          actionType: 'استعادة عميل',
          userId: sessionUser?.id || '',
          username: sessionUser?.username || '',
          details: `تم استعادة العميل (${restoredClient.name})`,
          affectedId: restoredClient.id?.toString() || '',
          affectedType: 'عميل',
          extra: { الحالة_الحالية: restoredClient.status }
        });
      }
    } catch (error) {
      console.error('خطأ في استعادة العميل من فايربيس:', error);
      toast.error('حدث خطأ أثناء استعادة العميل من قاعدة بيانات فايربيس');
    }
  };

  const permanentDeleteClient = async (id: number) => {
    try {
      const q = query(collection(db, 'clients'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, 'clients', docSnap.id));
      }
      toast.success('تم حذف العميل نهائياً');
    } catch (error) {
      console.error('خطأ في الحذف النهائي للعميل من فايربيس:', error);
      toast.error('حدث خطأ أثناء الحذف النهائي للعميل من قاعدة بيانات فايربيس');
    }
  };

  const searchClients = (term: string) => {
    if (!term) return [];
    return clients.filter(client => 
      client.name?.toLowerCase().includes(term.toLowerCase()) ||
      client.phone?.includes(term) ||
      (client.idNumber && client.idNumber.includes(term)) ||
      (client.identityNumber && client.identityNumber.includes(term))
    );
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
      deletedClients, 
      addClient,
      updateClient,
      getClients: () => clients, 
      getDeletedClients: () => deletedClients,
      deleteClient,
      restoreClient,
      permanentDeleteClient,
      searchClients
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};
