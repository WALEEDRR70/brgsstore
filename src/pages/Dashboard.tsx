import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { clients } = useClients();

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const pendingApproval = clients.filter(client => client.status === 'pending').length;
    const approved = clients.filter(client => client.status === 'approved').length;
    const rejected = clients.filter(client => client.status === 'rejected').length;
    
    const today = new Date();
    const notifications = clients.filter(client => {
      if (!client.completionDate) return false;
      const completionDate = new Date(client.completionDate);
      const diffTime = completionDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 10;
    }).length;

    return {
      totalClients,
      pendingApproval,
      approved,
      rejected,
      notifications
    };
  }, [clients]);

  const recentClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 4)
      .map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        status: client.status === 'approved' ? 'مقبول' : 
                client.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'
      }));
  }, [clients]);

  const recentNotifications = useMemo(() => {
    const notifications = [];
    
    const today = new Date();
    const expiringClients = clients.filter(client => {
      if (!client.completionDate) return false;
      const completionDate = new Date(client.completionDate);
      const diffTime = completionDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 10;
    }).length;
    
    if (expiringClients > 0) {
      notifications.push({
        type: 'warning',
        message: `${expiringClients} عملاء قارب موعد انتهاء خدمتهم`,
        details: 'يرجى التحقق من صفحة الإشعارات'
      });
    }
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentlyApproved = clients.filter(client => {
      if (client.status !== 'approved') return false;
      const uploadDate = new Date(client.uploadDate);
      return uploadDate >= threeDaysAgo;
    }).length;
    
    if (recentlyApproved > 0) {
      notifications.push({
        type: 'info',
        message: `تم قبول ${recentlyApproved} عملاء جدد`,
        details: `خلال آخر 3 أيام`
      });
    }
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedServices = clients.filter(client => {
      if (!client.completionDate) return false;
      const completionDate = new Date(client.completionDate);
      return completionDate >= oneWeekAgo && completionDate <= today;
    }).length;
    
    if (completedServices > 0) {
      notifications.push({
        type: 'success',
        message: `تم اكتمال خدمة ${completedServices} عملاء`,
        details: 'خلال الأسبوع الماضي'
      });
    }
    
    return notifications;
  }, [clients]);

  const percentages = useMemo(() => {
    const totalClients = stats.totalClients || 1;
    return {
      approved: Math.round((stats.approved / totalClients) * 100),
      rejected: Math.round((stats.rejected / totalClients) * 100),
      pending: Math.round((stats.pendingApproval / totalClients) * 100)
    };
  }, [stats]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('dashboard.welcome')}</h1>
        <div className="text-lg font-medium text-gray-600 bg-blue-50 py-2 px-4 rounded-lg shadow-sm">
          مرحباً، {user?.username}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-white border-blue-100 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium">
              {t('dashboard.clients')}
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-50">
              <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-blue-700">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي العملاء في النظام
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-yellow-100 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.pendingApproval')}
            </CardTitle>
            <div className="p-2 rounded-full bg-yellow-50">
              <Bell className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">
              بانتظار المراجعة
            </p>
            <div className="mt-2">
              <Progress value={percentages.pending} className="h-2 bg-yellow-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-green-100 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.approved')}
            </CardTitle>
            <div className="p-2 rounded-full bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {percentages.approved}% من إجمالي العملاء
            </p>
            <div className="mt-2">
              <Progress value={percentages.approved} className="h-2 bg-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.rejected')}
            </CardTitle>
            <div className="p-2 rounded-full bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {percentages.rejected}% من إجمالي العملاء
            </p>
            <div className="mt-2">
              <Progress value={percentages.rejected} className="h-2 bg-red-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-white shadow-md border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white p-4">
            <CardTitle className="text-lg md:text-xl text-blue-800">{t('dashboard.recentClients')}</CardTitle>
            <CardDescription>آخر العملاء المضافين للنظام</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="bg-blue-50 py-3 px-4 grid grid-cols-3 font-medium text-blue-800 text-sm">
                <div>{t('client.name')}</div>
                <div>{t('client.phone')}</div>
                <div>{t('client.status')}</div>
              </div>
              <div className="divide-y divide-blue-50">
                {recentClients.length > 0 ? (
                  recentClients.map((client) => (
                    <div key={client.id} className="grid grid-cols-3 py-3 px-4 hover:bg-blue-50 transition-colors">
                      <div className="font-medium">{client.name}</div>
                      <div dir="ltr" className="text-center">{client.phone}</div>
                      <div className={
                        client.status === 'مقبول' ? 'text-green-600 font-medium' : 
                        client.status === 'مرفوض' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'
                      }>{client.status}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">لا يوجد عملاء حالياً</div>
                )}
              </div>
              <div className="p-4 border-t border-blue-100">
                <Link to="/clients">
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    عرض جميع العملاء
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white p-4">
            <CardTitle className="text-lg md:text-xl text-blue-800">{t('dashboard.notifications')}</CardTitle>
            <CardDescription>إشعارات تحتاج إلى اهتمامك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification, index) => (
                <div key={index} className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md 
                  ${notification.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    notification.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-green-50 text-green-700 border-green-200'}`}>
                  <p className="font-medium">{notification.message}</p>
                  <p className="text-sm mt-1">{notification.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <Bell className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">لا توجد إشعارات جديدة</p>
              </div>
            )}
            
            {recentNotifications.length > 0 && (
              <div className="pt-2">
                <Link to="/notifications">
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    عرض جميع الإشعارات
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
