import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";
import { format } from "date-fns";
import { Client } from '@/contexts/ClientContext';
import * as XLSX from 'xlsx';

export const useExportClients = (clients: Client[]) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (
    startDate?: Date,
    endDate?: Date,
    customClientList?: Client[]
  ) => {
    try {
      setIsExporting(true);
      
      // استخدام القائمة المخصصة إذا تم توفيرها، وإلا فلتر حسب التاريخ
      const filteredData = customClientList || (startDate && endDate 
        ? clients.filter(client => {
            const clientDate = new Date(client.uploadDate);
            return clientDate >= startDate && clientDate <= endDate;
          }) 
        : clients);
      
      if (filteredData.length === 0) {
        toast.warning(t('database.noDataToExport'));
        setIsExporting(false);
        return;
      }
      
      // تحضير البيانات للتصدير بتنسيق Excel
      const workbook = XLSX.utils.book_new();
      
      // تحويل بيانات العملاء إلى تنسيق مناسب للإكسل
      const excelData = filteredData.map(client => {
        // استخراج تفاصيل الحالة حسب نوع الحالة
        let statusDetails = '';
        
        if (client.status === 'rejected' && client.rejectionReason) {
          statusDetails = `سبب الرفض: ${client.rejectionReason}`;
        } else if (client.status === 'approved') {
          let details = [];
          
          if (client.acqaraApproved && client.mawaraApproved) {
            details.push('مقبول في أكوارا وموارا');
          } else if (client.acqaraApproved) {
            details.push('مقبول في أكوارا فقط');
          } else if (client.mawaraApproved) {
            details.push('مقبول في موارا فقط');
          }
          
          if (client.completedService === true) {
            details.push('لم يتمم الخدمة');
            if (client.incompleteReason) {
              details.push(`السبب: ${client.incompleteReason}`);
            }
          }
          
          statusDetails = details.join(' - ');
        } else if (client.status === 'tammam' && client.completionDate) {
          const today = new Date();
          const compDate = new Date(client.completionDate);
          const diffTime = compDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const remainingDays = diffDays >= 0 
            ? `متبقي: ${diffDays} يوم` 
            : `انتهى منذ ${Math.abs(diffDays)} يوم`;
            
          statusDetails = `تاريخ الإكمال: ${client.completionDate} - ${remainingDays}`;
          
          // إضافة ملاحظات التقسيط إذا كانت موجودة
          if (client.installmentNotes) {
            statusDetails += ` - ملاحظات التقسيط: ${client.installmentNotes}`;
          }
        } else if (client.status === 'pending' && client.pendingReason) {
          statusDetails = `سبب التعليق: ${client.pendingReason}`;
        }
        
        // ترجمة حالة العميل إلى العربية
        let translatedStatus = '';
        switch (client.status) {
          case 'approved':
            translatedStatus = 'مقبول';
            break;
          case 'rejected':
            translatedStatus = 'مرفوض';
            break;
          case 'pending':
            translatedStatus = 'قيد الانتظار';
            break;
          case 'tammam':
            translatedStatus = 'تمم';
            break;
          default:
            translatedStatus = client.status;
        }
        
        return {
          'الاسم': client.name,
          'رقم الهاتف': client.phone,
          'رقم الهوية': client.identityNumber || client.idNumber,
          'الحالة': translatedStatus,
          'تفاصيل الحالة': statusDetails,
          'تاريخ الرفع': client.uploadDate,
          'أضيف بواسطة': client.addedBy || '',
          'ملاحظات التقسيط': client.status === 'tammam' ? client.installmentNotes || '' : ''
        };
      });
      
      // إنشاء ورقة عمل بالبيانات
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // ضبط عرض الأعمدة ليناسب المحتوى
      const columnsWidth = [
        { wch: 25 }, // الاسم
        { wch: 15 }, // رقم الهاتف
        { wch: 15 }, // رقم الهوية
        { wch: 12 }, // الحالة
        { wch: 40 }, // تفاصيل الحالة
        { wch: 15 }, // تاريخ الرفع
        { wch: 15 }, // أضيف بواسطة
        { wch: 30 }, // ملاحظات التقسيط
      ];
      
      worksheet['!cols'] = columnsWidth;
      
      // إضافة ورقة العمل إلى المصنف
      const fileName = customClientList
        ? `clients_export_filtered_${format(new Date(), 'yyyy-MM-dd')}`
        : startDate && endDate 
          ? `clients_export_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
          : `clients_export_all_${format(new Date(), 'yyyy-MM-dd')}`;
          
      XLSX.utils.book_append_sheet(workbook, worksheet, "بيانات العملاء");
      
      // تصدير الملف
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      
      toast.success('تم تصدير بيانات العملاء بنجاح');
      
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('database.exportError'));
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
};
