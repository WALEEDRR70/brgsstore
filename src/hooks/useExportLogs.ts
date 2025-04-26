import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface ActivityLog {
  id: string;
  username?: string;
  actionType: string;
  details: string;
  affectedType?: string;
  affectedId?: string;
  createdAt: any; // Firestore timestamp
  extra?: any;
}

export const useExportLogs = (logs: ActivityLog[]) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  // دالة لترجمة النصوص الإنجليزية إلى العربية
  const translateToArabic = (text: string): string => {
    if (!text) return '';
    
    // قاموس للترجمات الشائعة في التطبيق
    const translations: Record<string, string> = {
      // حالات العملاء
      'pending': 'معلق',
      'approved': 'مقبول',
      'rejected': 'مرفوض',
      // أنواع العمليات
      'user': 'مستخدم',
      'client': 'عميل',
      'employee': 'موظف',
      'admin': 'مسؤول',
      'superadmin': 'سوبر أدمن',
      // الحقول
      'status': 'الحالة',
      'name': 'الاسم',
      'email': 'البريد الإلكتروني',
      'phone': 'رقم الهاتف',
      'id': 'المعرف',
      'idNumber': 'رقم الهوية',
      'identityNumber': 'رقم الهوية',
      'createdAt': 'تاريخ الإنشاء',
      'uploadDate': 'تاريخ الرفع',
      'completionDate': 'تاريخ الإكمال',
      'pendingReason': 'سبب التعليق',
      'rejectionReason': 'سبب الرفض',
      'notes': 'ملاحظات',
      'addedBy': 'أضيف بواسطة',
      'processedBy': 'عولج بواسطة',
      'from': 'من',
      'to': 'إلى',
      'incompleteReason': 'سبب عدم الاكتمال',
      // التحويلات اللغوية
      'password': 'كلمة المرور',
      'role': 'صلاحية',
    };

    // ترجمة حالة العميل
    let result = text;
    
    // ترجمة الكلمات الفردية
    Object.entries(translations).forEach(([en, ar]) => {
      // استبدال الكلمة الإنجليزية بالعربية مع مراعاة أن تكون كلمة كاملة أو جزء من نمط معين
      result = result.replace(new RegExp(`\\b${en}\\b`, 'gi'), ar);
      
      // ترجمة الحالات مع علامات اقتباس
      result = result.replace(new RegExp(`"${en}"`, 'gi'), `"${ar}"`);
      
      // ترجمة أسماء الحقول في تنسيق JSON
      result = result.replace(new RegExp(`${en}:`, 'g'), `${ar}:`);
    });

    // ترجمة أنماط محددة في النص
    result = result.replace(/status changed from "(.+?)" to "(.+?)"/gi, 'تم تغيير الحالة من "$1" إلى "$2"');
    result = result.replace(/تم تعديل العميل \((.+?)\):/g, 'تم تعديل العميل ($1):');
    
    // ترجمة أنماط خاصة للتغييرات والتحديثات
    result = result.replace(/([a-zA-Z]+): "(.+?)" ← "(.+?)"/g, (match, field, oldVal, newVal) => {
      const fieldAr = translations[field] || field;
      const oldValAr = translations[oldVal] || oldVal;
      const newValAr = translations[newVal] || newVal;
      return `${fieldAr}: "${oldValAr}" ← "${newValAr}"`;
    });
    
    return result;
  };

  const handleExport = async (filteredLogs?: ActivityLog[]) => {
    try {
      setIsExporting(true);
      
      // استخدام القائمة المخصصة إذا تم توفيرها
      const dataToExport = filteredLogs || logs;
      
      if (dataToExport.length === 0) {
        toast.warning('لا توجد بيانات للتصدير');
        setIsExporting(false);
        return;
      }
      
      // إعداد البيانات للتصدير بتنسيق Excel
      const exportData = dataToExport.map(log => {
        // استخراج بيانات إضافية إذا كانت موجودة
        let extraInfo = '';
        if (log.extra) {
          try {
            if (typeof log.extra === 'object') {
              if (log.actionType === 'تعديل عميل' && log.extra.التعديلات) {
                extraInfo = log.extra.التعديلات.map((change: string) => translateToArabic(change)).join(', ');
              } else if (log.actionType === 'حذف عميل' && log.extra.الحالة_السابقة) {
                extraInfo = `الحالة قبل الحذف: ${log.extra.الحالة_السابقة}`;
              } else if (log.actionType === 'استعادة عميل' && log.extra.الحالة_الحالية) {
                extraInfo = `الحالة بعد الاستعادة: ${log.extra.الحالة_الحالية}`;
              } else if (log.actionType === 'إضافة عميل' && log.extra.الحالة) {
                extraInfo = `الحالة عند الإضافة: ${log.extra.الحالة}`;
              } else {
                extraInfo = translateToArabic(JSON.stringify(log.extra));
              }
            } else {
              extraInfo = translateToArabic(String(log.extra));
            }
          } catch (e) {
            extraInfo = 'غير قابل للعرض';
          }
        }

        // إرجاع كائن بيانات للصف
        return {
          'الموظف': log.username || 'غير معروف',
          'نوع العملية': log.actionType,
          'التفاصيل': translateToArabic(log.details || ''),
          'نوع العنصر': log.affectedType || '',
          'المعرف': log.affectedId || '',
          'تاريخ ووقت التنفيذ': log.createdAt && log.createdAt.toDate ? format(log.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
          'معلومات إضافية': extraInfo || ''
        };
      });
      
      // إنشاء ورقة عمل Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // تعديل عرض الأعمدة
      const columnWidths = [
        { wch: 15 }, // الموظف
        { wch: 15 }, // نوع العملية
        { wch: 30 }, // التفاصيل
        { wch: 15 }, // نوع العنصر
        { wch: 10 }, // المعرف
        { wch: 20 }, // تاريخ ووقت التنفيذ
        { wch: 40 }  // معلومات إضافية
      ];
      worksheet['!cols'] = columnWidths;
      
      // إنشاء المصنف
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النشاط');
      
      // تصدير إلى ملف
      const fileName = `سجل_نشاط_الموظفين_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('تم تصدير البيانات بنجاح');
      
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء تصدير البيانات');
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
};
