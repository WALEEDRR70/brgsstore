import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useClients } from '@/contexts/ClientContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { UserPlus, Users, Trash2, Settings, Shield, PenSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import AdvancedActivityLog from '@/components/admin/AdvancedActivityLog';
import ActivityLogDetailsDialog from '@/components/admin/ActivityLogDetailsDialog';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'employee' | 'superadmin';
  lastActive?: string;
  email?: string;
  name?: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'employee' | 'superadmin';
}

// دالة مساعدة لتحديد صلاحيات المستخدم
const hasAdminPrivileges = (user: User | null) => {
  return user && (user.role === 'admin' || user.role === 'superadmin');
};

const Admin = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { clients, deletedClients } = useClients();
  
  // السماح للسوبر أدمن بجميع صلاحيات الأدمن وما فوق
  if (!hasAdminPrivileges(user)) {
    toast.error('غير مصرح لك بالوصول إلى صفحة الإدارة');
    return <Navigate to="/dashboard" replace />;
  }

  const stats = [
    {
      title: 'إجمالي العملاء',
      value: clients.length,
      icon: <Users className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'العملاء الجدد',
      value: clients.filter(client => {
        const today = new Date();
        const uploadDate = new Date(client.uploadDate);
        const diffTime = today.getTime() - uploadDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length,
      icon: <UserPlus className="h-6 w-6 text-green-500" />
    },
    {
      title: 'العملاء المحذوفين',
      value: deletedClients.length,
      icon: <Trash2 className="h-6 w-6 text-red-500" />
    }
  ];

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [selectedActivityLog, setSelectedActivityLog] = useState<any>(null);
  const [isActivityLogDialogOpen, setIsActivityLogDialogOpen] = useState(false);

  useEffect(() => {
    // جلب جميع سجلات النشاط من Firestore
    fetchActivityLogs();
  }, []);

  // دالة لجلب سجلات النشاط
  const fetchActivityLogs = () => {
    const q = query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  };

  const employeesList = Array.from(new Set(activityLogs.map(log => log.username).filter(Boolean)));
  const actionTypesList = Array.from(new Set(activityLogs.map(log => log.actionType).filter(Boolean)));

  const filteredLogs = activityLogs.filter(log => {
    let employeeMatch = true;
    let dateMatch = true;
    let actionTypeMatch = true;

    if (selectedEmployee) {
      employeeMatch = log.username === selectedEmployee;
    }
    
    if (selectedActionType) {
      actionTypeMatch = log.actionType === selectedActionType;
    }
    
    if (dateFrom || dateTo) {
      if (log.createdAt && log.createdAt.toDate) {
        const logDate = log.createdAt.toDate().toISOString().split('T')[0];
        if (dateFrom && dateTo) {
          dateMatch = logDate >= dateFrom && logDate <= dateTo;
        } else if (dateFrom) {
          dateMatch = logDate >= dateFrom;
        } else if (dateTo) {
          dateMatch = logDate <= dateTo;
        }
      } else {
        dateMatch = false;
      }
    }
    return employeeMatch && dateMatch && actionTypeMatch;
  });

  const openActivityLogDetails = (log: any) => {
    setSelectedActivityLog(log);
    setIsActivityLogDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          {t('sidebar.admin')}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users">المستخدمين</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات العامة</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>
            <TabsContent value="settings">
              <GeneralSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            سجل نشاط الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* فلاتر الموظف ونطاق التاريخ */}
          <div className="flex gap-4 mb-4 flex-wrap items-end">
            <div>
              <label className="block mb-1 text-xs text-gray-600">الموظف</label>
              <select
                aria-label="اختر الموظف"
                className="border rounded px-2 py-1 text-xs"
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
              >
                <option value="">كل الموظفين</option>
                {employeesList.map((emp, idx) => (
                  <option key={idx} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-600">نوع العملية</label>
              <select
                aria-label="اختر نوع العملية"
                className="border rounded px-2 py-1 text-xs"
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value)}
              >
                <option value="">كل العمليات</option>
                {actionTypesList.map((actionType, idx) => (
                  <option key={idx} value={actionType}>{actionType}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-600">من تاريخ</label>
              <input
                aria-label="من تاريخ"
                type="date"
                className="border rounded px-2 py-1 text-xs"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-600">إلى تاريخ</label>
              <input
                aria-label="إلى تاريخ"
                type="date"
                className="border rounded px-2 py-1 text-xs"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <AdvancedActivityLog 
            logs={filteredLogs} 
            refreshLogs={fetchActivityLogs} 
            onOpenLogDetails={openActivityLogDetails}
          />
        </CardContent>
      </Card>

      {/* نافذة عرض تفاصيل سجل النشاط */}
      <ActivityLogDetailsDialog
        activityLog={selectedActivityLog}
        isOpen={isActivityLogDialogOpen}
        onOpenChange={setIsActivityLogDialogOpen}
        refreshLogs={fetchActivityLogs}
      />
    </div>
  );
};

const UsersManagement = () => {
  const { getAllUsers, addUser, editUser, deleteUser, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'employee',
  });

  // دالة مساعدة للتحقق من صلاحيات السوبر أدمن
  const isSuperAdmin = () => {
    return currentUser?.role === 'superadmin';
  };

  useEffect(() => {
    (async () => {
      const allUsers = await getAllUsers();
      // استبعاد المستخدمين الذين ليس لديهم معرف (محذوفين فعلياً)
      setUsers(allUsers.filter(u => !!u.id));
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (value: 'admin' | 'employee' | 'superadmin') => {
    // للتأكد من أن الأدمن العادي لا يستطيع اختيار أدمن أو سوبر أدمن
    if (!isSuperAdmin() && (value === 'admin' || value === 'superadmin')) {
      toast.error('فقط السوبر أدمن يستطيع إضافة مستخدمين بصلاحيات أدمن أو سوبر أدمن');
      return;
    }

    setFormData({
      ...formData,
      role: value,
    });
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.password) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }

    // التحقق من صلاحيات إضافة المستخدم
    if (!isSuperAdmin() && (formData.role === 'admin' || formData.role === 'superadmin')) {
      toast.error('فقط السوبر أدمن يستطيع إضافة مستخدمين بصلاحيات أدمن أو سوبر أدمن');
      return;
    }

    const success = await addUser(formData.username, formData.password, formData.role);
    
    if (success) {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => !!u.id));
      setFormData({ username: '', password: '', role: 'employee' });
      setIsAddUserDialogOpen(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.username) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }

    // التحقق من صلاحيات تعديل صلاحيات المستخدم
    if (!isSuperAdmin() && (formData.role === 'admin' || formData.role === 'superadmin')) {
      toast.error('فقط السوبر أدمن يستطيع تعديل مستخدمين بصلاحيات أدمن أو سوبر أدمن');
      return;
    }

    const userData: Partial<User & { password?: string }> = {
      username: formData.username,
      role: formData.role
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    const success = await editUser(selectedUser.id, userData);
    
    if (success) {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => !!u.id));
      setIsEditUserDialogOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) {
      toast.error('معرّف المستخدم غير موجود!');
      return;
    }
    const success = await deleteUser(userId);
    if (success) {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => !!u.id));
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">المستخدمين المسجلين</h3>
        <Button 
          size="sm"
          onClick={() => setIsAddUserDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus size={16} />
          إضافة مستخدم
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم المستخدم</TableHead>
            <TableHead>الصلاحية</TableHead>
            <TableHead>آخر نشاط</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.role === 'admin' ? 'مسؤول' : user.role === 'superadmin' ? 'سوبر أدمن' : 'موظف'}</TableCell>
              <TableCell dir="ltr">{user.lastActive}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    className="gap-2"
                  >
                    <PenSquare size={16} />
                    تعديل
                  </Button>
                  {user.id !== currentUser?.id && user.role !== 'superadmin' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 gap-2"
                    >
                      <Trash2 size={16} />
                      حذف
                    </Button>
                  )}
                  {user.role === 'superadmin' && (
                    <span className="text-red-500">لا يمكن حذف سوبر أدمن</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username-input" className="block mb-1 text-xs text-gray-600 sr-only">اسم المستخدم</label>
              <Input
                aria-label="اسم المستخدم"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password-input" className="block mb-1 text-xs text-gray-600 sr-only">كلمة المرور</label>
              <Input
                aria-label="كلمة المرور"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block mb-1 text-xs text-gray-600 sr-only">الصلاحية</label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  {isSuperAdmin() && (
                    <>
                      <SelectItem value="admin">مسؤول</SelectItem>
                      <SelectItem value="superadmin">سوبر أدمن</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddUser}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-username-input" className="block mb-1 text-xs text-gray-600 sr-only">اسم المستخدم</label>
              <Input
                aria-label="اسم المستخدم"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-password-input" className="block mb-1 text-xs text-gray-600 sr-only">كلمة المرور الجديدة (اختياري)</label>
              <Input
                aria-label="كلمة المرور الجديدة (اختياري)"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="اترك فارغاً إذا لا تريد التغيير"
              />
            </div>
            <div className="space-y-2">
              <label className="block mb-1 text-xs text-gray-600 sr-only">الصلاحية</label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  {isSuperAdmin() && (
                    <>
                      <SelectItem value="admin">مسؤول</SelectItem>
                      <SelectItem value="superadmin">سوبر أدمن</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditUser}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'شركة الإسكان',
    logo: '',
    systemEmail: 'info@company.com',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="company-name-input" className="block mb-1 text-xs text-gray-600 sr-only">اسم الشركة</label>
        <Input
          aria-label="اسم الشركة"
          name="companyName"
          value={settings.companyName}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="system-email-input" className="block mb-1 text-xs text-gray-600 sr-only">البريد الإلكتروني للنظام</label>
        <Input
          aria-label="البريد الإلكتروني للنظام"
          name="systemEmail"
          type="email"
          value={settings.systemEmail}
          onChange={handleChange}
        />
      </div>
      <Button type="submit">حفظ الإعدادات</Button>
    </form>
  );
};

export default Admin;
