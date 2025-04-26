
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

const Trash = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { deletedClients, restoreClient, permanentDeleteClient } = useClients();
  
  // حساب الأيام المتبقية للعملاء المحذوفين قبل الحذف النهائي (30 يوم)
  const clientsWithDays = deletedClients.map(client => {
    // إذا كان تاريخ الحذف غير موجود، نستخدم تاريخ الإضافة
    const deleteDate = client.deleteDate ? new Date(client.deleteDate) : new Date(client.uploadDate);
    const expiryDate = new Date(deleteDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    return { ...client, daysRemaining };
  });

  const handleRestore = (id: number) => {
    restoreClient(id);
    toast.success('تم استعادة العميل بنجاح');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من الحذف النهائي للعميل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      permanentDeleteClient(id);
      toast.success('تم حذف العميل نهائيًا');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('sidebar.trash')}</h1>

      <Card>
        <CardContent className="p-6">
          {clientsWithDays.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('client.name')}</TableHead>
                  <TableHead>تاريخ الحذف</TableHead>
                  <TableHead>الأيام المتبقية للحذف النهائي</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithDays.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell dir="ltr">{client.deleteDate || client.uploadDate}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      {client.daysRemaining <= 5 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {client.daysRemaining} يوم
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(client.id)}
                        >
                          <RotateCcw className="h-4 w-4 ml-1" />
                          استعادة
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف نهائي
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد عملاء محذوفين
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Trash;
