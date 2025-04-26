
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, ShieldCheck, Mail, Lock } from 'lucide-react';

const Profile = () => {
  const { user, updateUser, updatePassword } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateUser(formData);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    const success = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
    if (success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 rounded-t-xl shadow-lg text-white">
        <div className="flex items-center gap-6">
          <div className="bg-white p-6 rounded-full shadow-md">
            <User className="h-12 w-12 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
            <div className="flex items-center mt-2 text-blue-100">
              <ShieldCheck className="h-4 w-4 mr-2" />
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Card className="border-t-0 rounded-t-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-700">بيانات الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  اسم المستخدم
                </label>
                <Input 
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full ${!isEditing ? 'bg-gray-50' : 'border-blue-300'}`}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  البريد الإلكتروني
                </label>
                <Input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full ${!isEditing ? 'bg-gray-50' : 'border-blue-300'}`}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
                  الدور
                </label>
                <Input 
                  type="text" 
                  value={user.role}
                  readOnly
                  className="w-full bg-gray-50"
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit"
                  className={`px-6 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isEditing ? 'حفظ التغييرات' : 'تعديل البيانات'}
                </Button>
                
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user?.username || '',
                        email: user?.email || '',
                        name: user?.name || '',
                      });
                    }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </form>

            {/* Password Change Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-500" />
                تغيير كلمة المرور
              </h3>
              
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  تغيير كلمة المرور
                </Button>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كلمة المرور الحالية</label>
                    <Input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تأكيد كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      حفظ كلمة المرور الجديدة
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
