import React, { createContext, useContext, useState, ReactNode } from 'react';

type LanguageContextType = {
  language: 'ar' | 'en';
  setLanguage: (language: 'ar' | 'en') => void;
  t: (key: string) => string;
};

const translations = {
  ar: {
    'app.title': 'بوابة العملاء الموحدة',
    'sidebar.dashboard': 'لوحة القيادة',
    'sidebar.clients': 'العملاء',
    'sidebar.addClient': 'إضافة عميل',
    'sidebar.search': 'البحث',
    'sidebar.database': 'قاعدة البيانات',
    'sidebar.trash': 'المحذوفات',
    'sidebar.notifications': 'الإشعارات',
    'sidebar.analytics': 'التحليلات',
    'sidebar.admin': 'الإدارة',
    'dashboard.welcome': 'مرحبًا بك في بوابة العملاء الموحدة',
    'dashboard.clients': 'العملاء',
    'dashboard.pendingApproval': 'بانتظار الموافقة',
    'dashboard.approved': 'تمت الموافقة',
    'dashboard.rejected': 'مرفوض',
    'dashboard.notifications': 'الإشعارات',
    'dashboard.recentClients': 'العملاء الجدد',
    'login.title': 'تسجيل الدخول',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.submit': 'تسجيل الدخول',
    'client.name': 'الاسم',
    'client.phone': 'رقم الهاتف',
    'client.id': 'رقم الهوية',
    'client.uploadDate': 'تاريخ الرفع',
    'client.status': 'الحالة',
    'client.status.label': 'الحالة',
    'client.status.approved': 'مقبول',
    'client.status.rejected': 'مرفوض',
    'client.status.pending': 'قيد الانتظار',
    'client.status.tammam': 'تمم',
    'client.acqara': 'مقبول في أكوارا',
    'client.mawara': 'مقبول في موارا',
    'client.incomplete': 'مقبول ولكن لم يتمم',
    'client.rejectionReason': 'سبب الرفض',
    'client.completionDate': 'تاريخ إكمال الخدمة',
    'client.installmentNotes': 'ملاحظات التقسيط',
    'client.installmentNotesPlaceholder': 'أدخل ملاحظات حول التقسيط...',
    'client.pendingReason': 'سبب الانتظار',
    'client.incompleteReason': 'سبب عدم الإتمام',
    'client.save': 'حفظ',
    'client.update': 'تحديث',
    'client.cancel': 'إلغاء',
    'client.edit': 'تعديل',
    'client.delete': 'حذف',
    'client.add': 'إضافة عميل',
    'client.export': 'تصدير',
    'client.exportSuccess': 'تم تصدير البيانات بنجاح',
    'client.allStatuses': 'جميع الحالات',
    'client.filterByStatus': 'تصفية حسب الحالة',
    'client.totalClients': 'إجمالي العملاء',
    'client.showing': 'العملاء المعروضين',
    'client.notFound': 'لم يتم العثور على العميل',
    'client.editMode': 'أنت في وضع التعديل',
    'search.placeholder': 'البحث بالاسم أو رقم الهاتف أو رقم الهوية',
    'notifications.title': 'الإشعارات',
    'notifications.daysRemaining': 'الأيام المتبقية',
    'database.export': 'تصدير إلى Excel',
    'language': 'English',
    'actions': 'الإجراءات',
  },
  en: {
    'app.title': 'Unified Client Portal',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.clients': 'Clients',
    'sidebar.addClient': 'Add Client',
    'sidebar.search': 'Search',
    'sidebar.database': 'Database',
    'sidebar.trash': 'Trash',
    'sidebar.notifications': 'Notifications',
    'sidebar.analytics': 'Analytics',
    'sidebar.admin': 'Administration',
    'dashboard.welcome': 'Welcome to Unified Client Portal',
    'dashboard.clients': 'Clients',
    'dashboard.pendingApproval': 'Pending Approval',
    'dashboard.approved': 'Approved',
    'dashboard.rejected': 'Rejected',
    'dashboard.notifications': 'Notifications',
    'dashboard.recentClients': 'Recent Clients',
    'login.title': 'Login',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Login',
    'client.name': 'Name',
    'client.phone': 'Phone Number',
    'client.id': 'ID Number',
    'client.uploadDate': 'Upload Date',
    'client.status': 'Status',
    'client.status.label': 'Status',
    'client.status.approved': 'Approved',
    'client.status.rejected': 'Rejected',
    'client.status.pending': 'Pending',
    'client.status.tammam': 'Completed',
    'client.acqara': 'Approved in Acqara',
    'client.mawara': 'Approved in Mawara',
    'client.incomplete': 'Approved but Incomplete',
    'client.rejectionReason': 'Rejection Reason',
    'client.completionDate': 'Service Completion Date',
    'client.installmentNotes': 'Installment Notes',
    'client.installmentNotesPlaceholder': 'Enter notes about installments...',
    'client.pendingReason': 'Pending Reason',
    'client.incompleteReason': 'Incomplete Reason',
    'client.save': 'Save',
    'client.update': 'Update',
    'client.cancel': 'Cancel',
    'client.edit': 'Edit',
    'client.delete': 'Delete',
    'client.add': 'Add Client',
    'client.export': 'Export',
    'client.exportSuccess': 'Data exported successfully',
    'client.allStatuses': 'All Statuses',
    'client.filterByStatus': 'Filter by Status',
    'client.totalClients': 'Total Clients',
    'client.showing': 'Showing Clients',
    'client.notFound': 'Client not found',
    'client.editMode': 'You are in edit mode',
    'search.placeholder': 'Search by name, phone, or ID',
    'notifications.title': 'Notifications',
    'notifications.daysRemaining': 'Days Remaining',
    'database.export': 'Export to Excel',
    'language': 'العربية',
    'actions': 'Actions',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    setLanguage(newLanguage);
    document.body.className = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
