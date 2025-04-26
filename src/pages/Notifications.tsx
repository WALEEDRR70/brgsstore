import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/contexts/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, UserPlus, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Notifications = () => {
  const { t } = useLanguage();
  const { clients } = useClients();
  const { user } = useAuth();
  const [dialogClient, setDialogClient] = React.useState<any>(null);
  const [notificationType, setNotificationType] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<string>('all');

  // حساب إشعارات انتهاء الخدمة (يجب أن تعتمد على serviceCompletionDate)
  const expiryNotifications = useMemo(() => {
    return clients
      .filter(client => client.serviceCompletionDate)
      .map(client => {
        const today = new Date();
        const serviceCompletionDate = new Date(client.serviceCompletionDate!);
        const daysRemaining = Math.ceil((serviceCompletionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...client, daysRemaining };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [clients]);

  // العملاء الجدد الذين تمت إضافتهم في آخر 3 أيام
  const recentlyAddedClients = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return clients
      .filter(client => {
        const uploadDate = new Date(client.uploadDate);
        return uploadDate >= threeDaysAgo;
      })
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5); // أظهر أحدث 5 عملاء فقط
  }, [clients]);

  // إشعارات العملاء الذين اقترب أو انتهى تاريخ إكمال الأقساط (من 10 أيام قبل حتى شهرين بعد)
  const completionNotifications = useMemo(() => {
    const today = new Date();
    return clients
      .filter(client => client.completionDate)
      .map(client => {
        const completionDate = new Date(client.completionDate!);
        const diffTime = completionDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const afterEnd = Math.ceil((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...client, daysToComplete: diffDays, afterEnd };
      })
      .filter(client => client.daysToComplete <= 10 && client.daysToComplete >= -60)
      .sort((a, b) => a.daysToComplete - b.daysToComplete);
  }, [clients]);

  // فلترة حسب النوع
  const filteredNotifications = useMemo(() => {
    let filtered = [];
    if (notificationType === 'expiry') {
      filtered = expiryNotifications;
    } else if (notificationType === 'completion') {
      filtered = completionNotifications;
    } else if (notificationType === 'new') {
      filtered = recentlyAddedClients;
    } else {
      filtered = [...expiryNotifications, ...completionNotifications, ...recentlyAddedClients];
    }
    // فلترة حسب الأيام
    if (daysFilter !== 'all') {
      const days = parseInt(daysFilter, 10);
      filtered = filtered.filter(n => (n.daysRemaining !== undefined ? Math.abs(n.daysRemaining) <= days : true));
    }
    return filtered;
  }, [notificationType, daysFilter, expiryNotifications, completionNotifications, recentlyAddedClients]);

  function formatPhoneForWhatsapp(phone?: string) {
    if (!phone) return '';
    // حذف أي مسافات أو شرطات أو رموز
    let cleaned = phone.replace(/[^\d]/g, '');
    // إذا يبدأ بـ 0، احذفها وضع 966
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.slice(1);
    }
    return cleaned;
  }

  // دالة مساعدة لتحديد اللون والأيقونة حسب نوع الإشعار
  function getNotificationStyle(notification: any) {
    if (notification.serviceCompletionDate !== undefined) {
      return {
        color: 'amber',
        icon: Bell,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        btnBorder: 'border-amber-200',
        btnText: 'text-amber-700',
        btnHover: 'hover:bg-amber-50',
        waBg: 'bg-green-50',
        waText: 'text-green-700',
      };
    } else if (notification.completionDate !== undefined) {
      return {
        color: 'blue',
        icon: CheckCircle,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-500',
        btnBorder: 'border-blue-200',
        btnText: 'text-blue-700',
        btnHover: 'hover:bg-blue-50',
        waBg: 'bg-green-50',
        waText: 'text-green-700',
      };
    } else {
      return {
        color: 'teal',
        icon: UserPlus,
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-700',
        btnBorder: 'border-teal-200',
        btnText: 'text-teal-700',
        btnHover: 'hover:bg-teal-50',
        waBg: 'bg-green-50',
        waText: 'text-green-700',
      };
    }
  }

  const [showIncompleteReason, setShowIncompleteReason] = React.useState(false);
  const [incompleteReason, setIncompleteReason] = React.useState('');

  function handleSaveIncompleteReason() {
    // TODO: send incompleteReason to backend for dialogClient.id
    alert('تم حفظ السبب: ' + incompleteReason);
    setShowIncompleteReason(false);
    setIncompleteReason('');
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('notifications.title')}</h1>
        <div className="text-sm font-medium bg-blue-50 py-2 px-4 rounded-lg shadow-sm flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          آخر تحديث: {new Date().toLocaleString('ar-SA')}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="w-44">
          <Select value={notificationType} onValueChange={setNotificationType}>
            <SelectTrigger>
              <SelectValue placeholder="نوع الإشعار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="expiry">انتهاء الخدمة</SelectItem>
              <SelectItem value="completion">إكمال الأقساط</SelectItem>
              <SelectItem value="new">عملاء جدد</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger>
              <SelectValue placeholder="كل الأيام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأيام</SelectItem>
              <SelectItem value="3">آخر 3 أيام</SelectItem>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="10">آخر 10 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const style = getNotificationStyle(notification);
            const Icon = style.icon;
            return (
              <Card key={notification.id + (notification.daysRemaining ?? notification.daysToComplete ?? '')} className={`border-${style.color}-100 shadow-md hover:shadow-lg transition-all duration-300 w-full animate-fade-in`}>
                <CardContent className={`notification-card-content pt-6 w-full`}>
                  <div
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full"
                  >
                    <div className={`${style.iconBg} p-3 sm:p-4 rounded-full shrink-0 flex items-center justify-center animate-pop`}>
                      <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:flex-nowrap items-start sm:items-center gap-1 sm:gap-2 w-full">
                        <p className="font-bold text-base sm:text-lg truncate max-w-xs mb-0">{notification.name}</p>
                        <span className={`flex items-center font-bold ${style.iconColor} text-sm sm:text-base mb-0`}>
                          <Clock className="mr-1 h-4 w-4" />
                          {notification.daysRemaining !== undefined
                            ? notification.daysRemaining > 0
                              ? `متبقي ${notification.daysRemaining} ${notification.daysRemaining === 1 ? 'يوم' : 'أيام'}`
                              : notification.daysRemaining === 0
                                ? 'ينتهي اليوم'
                                : `انتهى منذ ${Math.abs(notification.daysRemaining)} يوم`
                            : notification.daysToComplete !== undefined
                              ? notification.daysToComplete >= 0
                                ? `متبقي ${notification.daysToComplete} ${notification.daysToComplete === 1 ? 'يوم' : 'أيام'} حتى إكمال الأقساط`
                                : `انتهى منذ ${Math.abs(notification.daysToComplete)} يوم (ضمن فترة المتابعة)`
                              : ''}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 mb-0">رقم الهاتف: {notification.phone}</span>
                        <span className="text-xs text-gray-400 mb-0">ID: {notification.id}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${style.btnBorder} ${style.btnText} ${style.btnHover} mb-0 animate-pop`}
                            onClick={() => setDialogClient(notification)}
                          >
                            عرض تفاصيل العميل
                          </Button>
                          <a
                            href={`https://wa.me/${formatPhoneForWhatsapp(notification.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className={`${style.btnBorder} ${style.waText} ${style.waBg} hover:opacity-90 mb-0 ml-2 flex items-center gap-1 animate-pop`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="inline mr-1" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12a11.94 11.94 0 0 0 1.64 6L0 24l6.39-1.68A12.08 12.08 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.38-.22-3.79 1 1-3.68-.25-.39A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.47-7.13c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.23-.24-.58-.48-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.53.07-.8.38-.27.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.13 3.27 5.16 4.46.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.41-.07-.11-.27-.18-.57-.33z"/></svg>
                              تواصل عبر واتساب
                            </Button>
                          </a>
                        </div>
                      </div>
                      {notification.completionDate && (
                        <div className="text-xs text-gray-600 mt-1">تاريخ الإكمال: {notification.completionDate}</div>
                      )}
                      {notification.serviceCompletionDate && (
                        <div className="text-xs text-green-700 mt-1">تاريخ إكمال الخدمة: {notification.serviceCompletionDate}</div>
                      )}
                      {notification.uploadDate && (
                        <div className="text-xs text-gray-600 mt-1">تاريخ الإضافة: {notification.uploadDate}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-2">
            <Card className="border-gray-100 bg-gray-50">
              <CardContent className="py-10 text-center">
                <p className="text-gray-500">لا توجد إشعارات مطابقة للفلترة الحالية</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* نافذة تفاصيل العميل المنبثقة */}
      <Dialog open={!!dialogClient} onOpenChange={() => setDialogClient(null)}>
        <DialogContent className="max-w-lg w-full animate-fade-in-up">
          <DialogHeader>
            <DialogTitle>تفاصيل العميل</DialogTitle>
          </DialogHeader>
          {dialogClient && (
            <div className="space-y-2">
              <div className="font-bold text-xl text-center mb-2">{dialogClient.name}</div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span>رقم الهاتف: <span dir="ltr">{dialogClient.phone}</span></span>
                <span>رقم الهوية: <span dir="ltr">{dialogClient.identityNumber}</span></span>
                <span>رقم الهوية الوطنية: <span dir="ltr">{dialogClient.idNumber}</span></span>
                <span>الحالة: {dialogClient.status === 'approved' ? 'مقبول' : dialogClient.status === 'rejected' ? 'مرفوض' : dialogClient.status === 'pending' ? 'قيد الانتظار' : 'تمم'}</span>
                {dialogClient.completionDate && <span>تاريخ إكمال الأقساط: {dialogClient.completionDate}</span>}
                {dialogClient.serviceCompletionDate && <span>تاريخ إكمال الخدمة: {dialogClient.serviceCompletionDate}</span>}
                {dialogClient.uploadDate && <span>تاريخ الإضافة: {dialogClient.uploadDate}</span>}
                {dialogClient.rejectionReason && <span>سبب الرفض: {dialogClient.rejectionReason}</span>}
                {dialogClient.acqaraApproved !== undefined && <span>مقبول في أكوارا: {dialogClient.acqaraApproved ? 'نعم' : 'لا'}</span>}
                {dialogClient.mawaraApproved !== undefined && <span>مقبول في موارا: {dialogClient.mawaraApproved ? 'نعم' : 'لا'}</span>}
                {dialogClient.completedService !== undefined && <span>لم يتمم الخدمة: {dialogClient.completedService ? 'نعم' : 'لا'}</span>}
                {dialogClient.incompleteReason && <span>سبب عدم الإتمام: {dialogClient.incompleteReason}</span>}
                {dialogClient.pendingReason && <span>سبب الانتظار: {dialogClient.pendingReason}</span>}
                {dialogClient.employeeId && <span>معرف الموظف: {dialogClient.employeeId}</span>}
                {dialogClient.addedBy && <span>أضيف بواسطة: {dialogClient.addedBy}</span>}
                {dialogClient.processedBy && <span>عالج بواسطة: {dialogClient.processedBy}</span>}
                {dialogClient.deleted !== undefined && <span>محذوف: {dialogClient.deleted ? 'نعم' : 'لا'}</span>}
                {dialogClient.deleteDate && <span>تاريخ الحذف: {dialogClient.deleteDate}</span>}
              </div>
              {/* شرط: إذا كان العميل مقبول (approved) ولم يتمم (status !== 'tammam')، أضف سؤال: هل تمم؟ */}
              {dialogClient.status === 'approved' && dialogClient.status !== 'tammam' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">هل أتم العميل الخدمة؟</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 text-green-700 font-semibold">
                      <input type="radio" name="completed" value="yes" onChange={() => setShowIncompleteReason(true)} />
                      نعم
                    </label>
                    <label className="flex items-center gap-1 text-red-700 font-semibold">
                      <input type="radio" name="completed" value="no" onChange={() => setShowIncompleteReason(false)} />
                      لا
                    </label>
                  </div>
                </div>
              )}
              {/* إذا اخترنا نعم (لم يتمم)، أظهر نموذج سبب عدم الإتمام */}
              {showIncompleteReason && (
                <div className="mt-4">
                  <label htmlFor="incomplete-reason" className="block text-sm font-medium mb-1">سبب عدم الإتمام</label>
                  <textarea id="incomplete-reason" className="w-full border rounded p-2" rows={2} value={incompleteReason} onChange={e => setIncompleteReason(e.target.value)} placeholder="اكتب سبب عدم الإتمام..." />
                  <Button className="mt-2" onClick={handleSaveIncompleteReason}>حفظ السبب</Button>
                </div>
              )}
              {/* إذا كانت الحالة قيد الانتظار، أظهر نموذج سبب الانتظار */}
              {dialogClient.status === 'pending' && (
                <div className="mt-4">
                  <label htmlFor="pending-reason" className="block text-sm font-medium mb-1">سبب الانتظار</label>
                  <textarea
                    id="pending-reason"
                    className="w-full border rounded p-2"
                    rows={2}
                    value={dialogClient.pendingReason || ''}
                    readOnly
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <a
                  href={`https://wa.me/${formatPhoneForWhatsapp(dialogClient?.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white animate-pop">
                    تواصل عبر واتساب
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // دالة مساعدة لحساب الوقت المنقضي منذ تاريخ معين
  function getTimeSince(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'منذ دقائق';
      }
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays === 1) {
      return 'منذ يوم واحد';
    } else if (diffDays < 30) {
      return `منذ ${diffDays} يوم`;
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  }
};

export default Notifications;
