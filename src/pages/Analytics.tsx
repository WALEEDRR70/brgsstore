import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/contexts/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

const Analytics = () => {
  const { t } = useLanguage();
  const { clients } = useClients();
  const { user } = useAuth();

  // فلترة الموظفين والتواريخ والعملاء
  const [employeeFilter, setEmployeeFilter] = useState(user?.role === 'employee' ? user.username : 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [allEmployees, setAllEmployees] = useState<{id: string, username: string}[]>([]);

  // جلب قائمة جميع الموظفين من قاعدة البيانات
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // جلب الموظفين من قاعدة البيانات
        const q = query(collection(db, 'users'), where('role', '==', 'employee'));
        const snapshot = await getDocs(q);
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username,
        }));
        setAllEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  // استخراج قائمة الموظفين المتوفرين
  const employeeList = useMemo(() => {
    // دمج الموظفين من قاعدة البيانات وأيضًا الموظفين الموجودين في بيانات العملاء
    const set = new Set<string>();
    
    // إضافة جميع الموظفين من قاعدة البيانات
    allEmployees.forEach(emp => set.add(emp.username));
    
    // إضافة الموظفين المرتبطين بالعملاء (لضمان شمولية القائمة)
    clients.forEach(c => c.processedBy && set.add(c.processedBy));
    
    return Array.from(set);
  }, [clients, allEmployees]);

  // فلترة العملاء حسب المدخلات
  const filteredClients = useMemo(() => {
    // إذا كان المستخدم موظف، فقط عرض العملاء الخاصين به
    if (user?.role === 'employee') {
      return clients.filter(client => {
        let match = client.processedBy === user.username;
        if (statusFilter !== 'all') match = match && client.status === statusFilter;
        
        // تصفية حسب التاريخ (من .. إلى)
        if (fromDate && client.uploadDate) {
          const uploadDate = new Date(client.uploadDate);
          const from = new Date(fromDate);
          match = match && uploadDate >= from;
        }
        if (toDate && client.uploadDate) {
          const uploadDate = new Date(client.uploadDate);
          const to = new Date(toDate);
          // تعيين وقت نهاية اليوم
          to.setHours(23, 59, 59, 999);
          match = match && uploadDate <= to;
        }
        
        return match;
      });
    } else {
      // إذا كان المستخدم أدمن أو سوبر أدمن، يمكنه تصفية جميع العملاء
      return clients.filter(client => {
        let match = true;
        if (employeeFilter !== 'all') match = match && client.processedBy === employeeFilter;
        if (statusFilter !== 'all') match = match && client.status === statusFilter;
        
        // تصفية حسب التاريخ (من .. إلى)
        if (fromDate && client.uploadDate) {
          const uploadDate = new Date(client.uploadDate);
          const from = new Date(fromDate);
          match = match && uploadDate >= from;
        }
        if (toDate && client.uploadDate) {
          const uploadDate = new Date(client.uploadDate);
          const to = new Date(toDate);
          // تعيين وقت نهاية اليوم
          to.setHours(23, 59, 59, 999);
          match = match && uploadDate <= to;
        }
        
        return match;
      });
    }
  }, [clients, employeeFilter, statusFilter, fromDate, toDate, user]);

  // إحصائيات الموظفين بعد الفلترة
  const employeeStats = useMemo(() => {
    const employeeMap = new Map();
    
    // إذا كان المستخدم موظف عادي
    if (user?.role === 'employee') {
      // إضافة الموظف الحالي فقط للإحصائيات
      const userClients = filteredClients.filter(client => client.processedBy === user.username);
      const approved = userClients.filter(c => c.status === 'approved').length;
      const rejected = userClients.filter(c => c.status === 'rejected').length;
      const pending = userClients.filter(c => c.status === 'pending').length;
      
      return [{
        name: user.username,
        total: userClients.length,
        approved: approved,
        rejected: rejected,
        pending: pending
      }];
    } else {
      // للمسؤولين: إحصاء جميع الموظفين
      
      // أضف جميع الموظفين المسجلين في النظام، حتى لو لم يكن لديهم عملاء
      employeeList.forEach(emp => {
        if (!employeeMap.has(emp)) {
          employeeMap.set(emp, {
            name: emp,
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0
          });
        }
      });
      
      // ثم أضف إحصائيات العملاء لكل موظف
      filteredClients.forEach(client => {
        if (client.processedBy && employeeMap.has(client.processedBy)) {
          const employeeData = employeeMap.get(client.processedBy);
          employeeData.total += 1;
          if (client.status === 'approved') employeeData.approved += 1;
          else if (client.status === 'rejected') employeeData.rejected += 1;
          else if (client.status === 'pending') employeeData.pending += 1;
        }
      });
      
      // إذا لم يكن هناك بيانات موظفين على الإطلاق في النظام
      if (employeeMap.size === 0) {
        return [{
          name: 'لا يوجد موظفين',
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        }];
      }
      
      return Array.from(employeeMap.values());
    }
  }, [filteredClients, user, employeeList]);

  // إحصائيات العملاء شهرياً بعد الفلترة
  const monthlyData = useMemo(() => {
    const monthsMap = new Map();
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('ar-SA', { month: 'long', year: '2-digit' });
      monthsMap.set(monthKey, { month: monthName, clients: 0 });
    }
    filteredClients.forEach(client => {
      if (client.uploadDate) {
        const uploadDate = new Date(client.uploadDate);
        const monthKey = `${uploadDate.getFullYear()}-${uploadDate.getMonth()}`;
        if (monthsMap.has(monthKey)) {
          monthsMap.get(monthKey).clients += 1;
        }
      }
    });
    return Array.from(monthsMap.values());
  }, [filteredClients]);

  // توزيع الحالات بعد الفلترة
  const statusDistribution = useMemo(() => {
    const total = filteredClients.length || 1;
    const approved = filteredClients.filter(c => c.status === 'approved').length;
    const rejected = filteredClients.filter(c => c.status === 'rejected').length;
    const pending = filteredClients.filter(c => c.status === 'pending').length;
    return [
      { name: 'مقبول', value: approved, color: '#22c55e', percent: Math.round((approved/total)*100) },
      { name: 'مرفوض', value: rejected, color: '#ef4444', percent: Math.round((rejected/total)*100) },
      { name: 'بانتظار الموافقة', value: pending, color: '#f59e0b', percent: Math.round((pending/total)*100) }
    ];
  }, [filteredClients]);

  // ملخص إحصائي أعلى الصفحة
  const totalClients = filteredClients.length;
  const approvedClients = filteredClients.filter(c => c.status === 'approved').length;
  const rejectedClients = filteredClients.filter(c => c.status === 'rejected').length;
  const pendingClients = filteredClients.filter(c => c.status === 'pending').length;
  const incompleteClients = filteredClients.filter(c => c.incomplete).length;
  const completedClients = filteredClients.filter(c => !c.incomplete).length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ملخص إحصائي أعلى الصفحة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-blue-700">{totalClients}</div>
          <div className="text-sm text-blue-900 font-medium">إجمالي العملاء</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-green-700">{approvedClients}</div>
          <div className="text-sm text-green-900 font-medium">المقبولون</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-red-700">{rejectedClients}</div>
          <div className="text-sm text-red-900 font-medium">المرفوضون</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-yellow-700">{pendingClients}</div>
          <div className="text-sm text-yellow-900 font-medium">بانتظار الموافقة</div>
        </div>
      </div>

      {/* إضافة ملخص لحالة الاكتمال */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-emerald-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-emerald-700">{completedClients}</div>
          <div className="text-sm text-emerald-900 font-medium">المكتملون</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 shadow text-center animate-pop">
          <div className="text-2xl font-bold text-orange-700">{incompleteClients}</div>
          <div className="text-sm text-orange-900 font-medium">غير المكتملين</div>
        </div>
      </div>

      <h1 className="text-3xl font-bold">{t('sidebar.analytics')}</h1>

      {/* فلاتر متقدمة */}
      <Card className="mb-6 animate-fade-in">
        <CardHeader>
          <CardTitle>تصفية وعرض البيانات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 pb-4 items-start">
          {/* حقل الموظف - يظهر فقط للإدمن والسوبر أدمن */}
          {user?.role !== 'employee' && (
            <div className="w-56">
              <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر موظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الموظفين</SelectItem>
                  {employeeList.map(emp => (
                    <SelectItem key={emp as string} value={emp as string}>{String(emp)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">حالة العميل</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="pending">بانتظار الموافقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>إحصائيات الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    const translations = {
                      approved: 'مقبول',
                      rejected: 'مرفوض',
                      pending: 'بانتظار الموافقة'
                    };
                    return [value, translations[name] || name];
                  }} />
                  <Legend formatter={(value) => {
                    const translations = {
                      approved: 'مقبول',
                      rejected: 'مرفوض',
                      pending: 'بانتظار الموافقة'
                    };
                    return translations[value] || value;
                  }} />
                  <Bar dataKey="approved" name="approved" fill="#22c55e" stackId="a" />
                  <Bar dataKey="rejected" name="rejected" fill="#ef4444" stackId="a" />
                  <Bar dataKey="pending" name="pending" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>العملاء الشهريين (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(item => item.clients > 0) ? (
              <ChartContainer className="h-[300px] animate-pop" config={{
                clients: { label: 'العملاء', color: '#6366f1' }
              }}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="clients" name="العملاء" fill="#6366f1" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>توزيع حالات العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <ChartContainer className="h-[300px] animate-pop" config={{
              approved: { label: 'مقبول', color: '#22c55e' },
              rejected: { label: 'مرفوض', color: '#ef4444' },
              pending: { label: 'بانتظار الموافقة', color: '#f59e0b' }
            }}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${percent}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
