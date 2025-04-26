import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useClients } from '@/contexts/ClientContext';
import { logEmployeeActivity } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RotateCcw, Clock, ArrowLeft, ArrowRight, FileText, AlertTriangle, CheckCircle2, User, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Client } from '@/contexts/ClientContext';

interface ActivityLogDetailsDialogProps {
  activityLog: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUndoOperation?: () => Promise<void>;
  refreshLogs?: () => void;
}

const ActivityLogDetailsDialog = ({ 
  activityLog, 
  isOpen, 
  onOpenChange, 
  refreshLogs
}: ActivityLogDetailsDialogProps) => {
  const { updateClient } = useClients();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  if (!activityLog) return null;

  // التحقق ما إذا كانت العملية قابلة للتراجع عنها
  const isUndoable = () => {
    if (!activityLog) return false;

    // حالياً، يمكن التراجع عن تعديل العميل فقط
    const recentTimestamp = new Date().getTime() - 24 * 60 * 60 * 1000; // 24 ساعة
    const logTimestamp = activityLog.createdAt?.toDate?.() 
      ? activityLog.createdAt.toDate().getTime() 
      : new Date(activityLog.createdAt).getTime();

    // فقط السماح بالتراجع عن العمليات في آخر 24 ساعة
    const isRecent = logTimestamp > recentTimestamp;
    
    return isRecent && (
      (activityLog.actionType === 'تعديل عميل' && activityLog.extra?.التعديلات) ||
      (activityLog.actionType === 'حذف عميل' && activityLog.affectedId) ||
      (activityLog.actionType === 'تعديل حالة عميل' && activityLog.extra?.الحالة_السابقة)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'مقبول':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
      case 'مرفوض':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'pending':
      case 'معلق':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'tammam':
      case 'تمم':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // استخراج تفاصيل التغييرات السابقة
  const extractChanges = () => {
    if (!activityLog.extra?.التعديلات) return [];

    return activityLog.extra.التعديلات.map((change: string) => {
      // محاولة استخراج الحقل والقيم
      const match = change.match(/([^:]+): "([^"]+)" ← "([^"]+)"/);
      if (match) {
        return {
          field: match[1].trim(),
          oldValue: match[2],
          newValue: match[3]
        };
      }
      
      // نمط آخر محتمل
      const statusMatch = change.match(/حالة العميل: من "([^"]+)" إلى "([^"]+)"/);
      if (statusMatch) {
        return {
          field: 'status',
          oldValue: statusMatch[1],
          newValue: statusMatch[2]
        };
      }

      return { field: '', oldValue: '', newValue: change };
    });
  };

  // التراجع عن عملية التعديل
  const handleUndo = async () => {
    if (!activityLog || !isUndoable() || !activityLog.affectedId) {
      toast.error('لا يمكن التراجع عن هذه العملية');
      return;
    }

    try {
      setIsLoading(true);
      
      // جلب بيانات العميل الحالية
      const q = query(collection(db, 'clients'), where('id', '==', Number(activityLog.affectedId)));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('لم يتم العثور على بيانات العميل');
        setIsLoading(false);
        return;
      }

      const clientDoc = querySnapshot.docs[0];
      const currentClientData = clientDoc.data();
      
      if (activityLog.actionType === 'تعديل عميل') {
        const changes = extractChanges();
        
        // تطبيق التراجع
        const updatedClientData = { ...currentClientData };
        
        // استعادة القيم القديمة
        changes.forEach(change => {
          if (change.field === 'status') {
            updatedClientData.status = change.oldValue;
          } else if (change.field) {
            updatedClientData[change.field] = change.oldValue;
          }
        });
        
        // تحديث بيانات العميل
        await updateDoc(doc(db, 'clients', clientDoc.id), updatedClientData);
        
        // تحديث العميل في الحالة المحلية - مع التأكد من أنه يحتوي على جميع الحقول المطلوبة
        const updatedClient: Client = {
          id: Number(activityLog.affectedId),
          name: updatedClientData.name || '',
          phone: updatedClientData.phone || '',
          uploadDate: updatedClientData.uploadDate || '',
          status: updatedClientData.status as 'approved' | 'rejected' | 'pending' | 'tammam',
          addedBy: updatedClientData.addedBy || '',
          // إضافة أي حقول أخرى ضرورية
          ...updatedClientData
        };
        
        updateClient(updatedClient);
        
        // تسجيل نشاط التراجع
        if (typeof window !== 'undefined') {
          const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
          await logEmployeeActivity({
            actionType: 'التراجع عن عملية',
            userId: sessionUser?.id || user?.id || '',
            username: sessionUser?.username || user?.username || '',
            details: `تم التراجع عن عملية تعديل العميل (${currentClientData.name})`,
            affectedId: activityLog.affectedId,
            affectedType: 'عميل',
            extra: { 
              العملية_الأصلية: activityLog.id,
              نوع_العملية_الأصلية: activityLog.actionType
            }
          });
        }
        
        toast.success('تم التراجع عن عملية التعديل بنجاح');
      } else if (activityLog.actionType === 'حذف عميل') {
        // استعادة العميل المحذوف
        await updateDoc(doc(db, 'clients', clientDoc.id), { 
          deleted: false,
          deleteDate: null
        });
        
        // تسجيل نشاط التراجع
        if (typeof window !== 'undefined') {
          const sessionUser = JSON.parse(localStorage.getItem('clientPortalUser') || '{}');
          await logEmployeeActivity({
            actionType: 'التراجع عن عملية',
            userId: sessionUser?.id || user?.id || '',
            username: sessionUser?.username || user?.username || '',
            details: `تم التراجع عن عملية حذف العميل (${currentClientData.name})`,
            affectedId: activityLog.affectedId,
            affectedType: 'عميل',
            extra: { 
              العملية_الأصلية: activityLog.id,
              نوع_العملية_الأصلية: activityLog.actionType
            }
          });
        }
        
        toast.success('تم التراجع عن عملية الحذف بنجاح');
      }
      
      // تحديث سجلات النشاط
      if (refreshLogs) {
        refreshLogs();
      }
      
      setIsLoading(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error undoing operation:', error);
      toast.error('حدث خطأ أثناء التراجع عن العملية');
      setIsLoading(false);
    }
  };

  // الحصول على لون الخلفية لنوع العملية
  const getActionTypeColor = () => {
    const actionType = activityLog.actionType;
    
    if (actionType.includes('إضافة') || actionType.includes('تسجيل دخول')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (actionType.includes('تعديل') || actionType.includes('تحديث')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (actionType.includes('حذف')) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (actionType.includes('استعادة') || actionType.includes('التراجع')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // تنسيق تاريخ من Firestore timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'غير معروف';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'yyyy/MM/dd HH:mm:ss');
    } catch (e) {
      return 'تنسيق غير صالح';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Badge className={`px-2 py-1 ${getActionTypeColor()}`}>
              {activityLog.actionType}
            </Badge>
            <DialogTitle className="flex-1">تفاصيل العملية</DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 px-6 py-2 bg-gray-50">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>التفاصيل الأساسية</span>
            </TabsTrigger>
            {activityLog.actionType === 'تعديل عميل' && (
              <TabsTrigger value="changes" className="flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                <ArrowRight className="w-4 h-4" />
                <span>التغييرات</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="meta" className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>بيانات إضافية</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-6">
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse">
                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="mb-2">
                        <User className="h-10 w-10 text-blue-500" />
                      </div>
                      <div className="text-sm font-medium text-gray-500">المستخدم</div>
                      <div className="font-semibold mt-1">{activityLog.username || 'غير معروف'}</div>
                    </div>

                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="mb-2">
                        <CalendarClock className="h-10 w-10 text-green-500" />
                      </div>
                      <div className="text-sm font-medium text-gray-500">وقت العملية</div>
                      <div className="font-semibold mt-1 whitespace-nowrap">
                        {formatDate(activityLog.createdAt)}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="mb-2">
                        <Clock className="h-10 w-10 text-purple-500" />
                      </div>
                      <div className="text-sm font-medium text-gray-500">نوع العنصر</div>
                      <div className="font-semibold mt-1">
                        {activityLog.affectedType || 'غير محدد'}
                        {activityLog.affectedId && (
                          <span className="block mt-1 text-xs bg-gray-100 rounded-full px-2 py-1">
                            المعرف: {activityLog.affectedId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">تفاصيل العملية</h3>
                <div className="bg-gray-50 p-4 rounded-lg border whitespace-pre-line">
                  {activityLog.details || 'لا توجد تفاصيل'}
                </div>
              </div>

              {activityLog.actionType === 'إضافة عميل' && activityLog.extra?.الحالة && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">حالة العميل عند الإضافة</h3>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(activityLog.extra.الحالة)}`}>
                      {activityLog.extra.الحالة}
                    </Badge>
                  </div>
                </div>
              )}

              {(activityLog.actionType === 'حذف عميل' || activityLog.actionType === 'استعادة عميل') && 
               (activityLog.extra?.الحالة_السابقة || activityLog.extra?.الحالة_الحالية) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {activityLog.actionType === 'حذف عميل' ? 'حالة العميل قبل الحذف' : 'حالة العميل بعد الاستعادة'}
                  </h3>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(
                      activityLog.extra.الحالة_السابقة || activityLog.extra.الحالة_الحالية
                    )}`}>
                      {activityLog.extra.الحالة_السابقة || activityLog.extra.الحالة_الحالية}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {activityLog.actionType === 'تعديل عميل' && (
            <TabsContent value="changes" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">تفاصيل التغييرات</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {extractChanges().length} تغيير
                  </Badge>
                </div>

                {extractChanges().length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <p className="text-gray-600">لم يتم العثور على تفاصيل التغييرات</p>
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {extractChanges().map((change, idx) => (
                      <div key={idx} className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{change.field || `تغيير ${idx + 1}`}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-1">
                            <div className="text-xs text-red-600 font-medium flex items-center">
                              <ArrowLeft className="h-3 w-3 mr-1" />
                              القيمة القديمة
                            </div>
                            <div className="py-1">
                              {change.field === 'status' ? (
                                <Badge className={`${getStatusColor(change.oldValue)}`}>
                                  {change.oldValue}
                                </Badge>
                              ) : (
                                <span className="text-gray-800">{change.oldValue || 'فارغ'}</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 space-y-1">
                            <div className="text-xs text-green-600 font-medium flex items-center">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              القيمة الجديدة
                            </div>
                            <div className="py-1">
                              {change.field === 'status' ? (
                                <Badge className={`${getStatusColor(change.newValue)}`}>
                                  {change.newValue}
                                </Badge>
                              ) : (
                                <span className="text-gray-800">{change.newValue || 'فارغ'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="meta" className="p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">بيانات فنية إضافية</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">معرف العملية</div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                    {activityLog.id || 'غير متوفر'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">معرف المستخدم</div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                    {activityLog.userId || 'غير متوفر'}
                  </div>
                </div>
              </div>
              
              {activityLog.extra && Object.keys(activityLog.extra).length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">بيانات إضافية خام</div>
                  <div className="font-mono text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                    <pre>{JSON.stringify(activityLog.extra, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-gray-50">
          <div className="w-full flex items-center justify-between">
            <div>
              {isUndoable() ? (
                <div className="flex items-center text-green-600 gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">يمكن التراجع عن هذه العملية</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600 gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">لا يمكن التراجع عن هذه العملية</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {isUndoable() && (
                <Button 
                  onClick={handleUndo} 
                  variant="destructive" 
                  className="gap-2"
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4" />
                  {isLoading ? 'جاري التراجع...' : 'التراجع عن العملية'}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogDetailsDialog;
