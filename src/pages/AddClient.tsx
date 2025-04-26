import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@/contexts/ClientContext';

const AddClient = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { clients, addClient, updateClient } = useClients();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [clientData, setClientData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    identityNumber: '',
    status: 'approved',
    addedBy: user?.username || '',
    completedService: undefined,
    incompleteReason: '',
    pendingReason: '',
    installmentNotes: '',
  });
  
  const [completionDate, setCompletionDate] = useState<Date | undefined>(undefined);
  const [serviceCompletionDate, setServiceCompletionDate] = useState<Date | undefined>(undefined);
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    
    if (editId) {
      const clientToEdit = clients.find(client => client.id === parseInt(editId));
      if (clientToEdit) {
        setIsEditMode(true);
        setClientData({
          ...clientToEdit,
          id: clientToEdit.id,
          name: clientToEdit.name,
          phone: clientToEdit.phone,
          identityNumber: clientToEdit.identityNumber || clientToEdit.idNumber || '',
          status: clientToEdit.status,
          acqaraApproved: clientToEdit.acqaraApproved,
          mawaraApproved: clientToEdit.mawaraApproved,
          incomplete: clientToEdit.incomplete,
          rejectionReason: clientToEdit.rejectionReason,
          addedBy: clientToEdit.addedBy,
          uploadDate: clientToEdit.uploadDate,
          completedService: clientToEdit.completedService,
          incompleteReason: clientToEdit.incompleteReason || '',
          pendingReason: clientToEdit.pendingReason || '',
          installmentNotes: clientToEdit.installmentNotes || '',
        });
        if (clientToEdit.completionDate) {
          setCompletionDate(new Date(clientToEdit.completionDate));
        }
        if (clientToEdit.serviceCompletionDate) {
          setServiceCompletionDate(new Date(clientToEdit.serviceCompletionDate));
        }
        toast.info(t('client.editMode'));
      } else {
        toast.error(t('client.notFound'));
        navigate('/clients');
      }
    }
  }, [clients, location.search, navigate, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientData((prev) => ({ ...prev, [name]: value }));
    
    if (!isEditMode && name === 'identityNumber' && value.length >= 8) {
      const existing = clients.find(client => client.identityNumber === value && client.id !== clientData.id);
      if (existing) {
        setExistingClient(existing);
        setShowExistingDialog(true);
      } else {
        setExistingClient(null);
      }
    }
  };
  
  const handleCheckboxChange = (name: string) => {
    setClientData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleRadioChange = (name: string, value: boolean) => {
    setClientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: 'approved' | 'rejected' | 'pending' | 'tammam') => {
    setClientData((prev) => {
      const newData: Partial<Client> = { 
        ...prev, 
        status: value 
      };
      
      if (value === 'rejected') {
        newData.acqaraApproved = undefined; 
        newData.mawaraApproved = undefined;
        newData.incomplete = undefined;
      } else {
        newData.rejectionReason = undefined;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData.name || !clientData.phone || !clientData.identityNumber) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    if (clientData.status === 'tammam' && !completionDate) {
      toast.error('يرجى تحديد تاريخ إكمال الأقساط');
      return;
    }
    
    if (clientData.status === 'rejected' && !clientData.rejectionReason) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    
    if (clientData.status === 'pending' && !clientData.pendingReason) {
      toast.error('يرجى كتابة سبب الانتظار');
      return;
    }
    
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(clientData.phone)) {
      toast.error('رقم الهاتف غير صحيح. يجب أن يبدأ ب 05 ويتكون من 10 أرقام');
      return;
    }
    
    // تحويل التواريخ إلى نصوص
    const finalClientData: Omit<Client, 'id' | 'uploadDate'> = {
      name: clientData.name || '',
      phone: clientData.phone || '',
      identityNumber: clientData.identityNumber || '',
      status: clientData.status || 'approved',
      acqaraApproved: clientData.acqaraApproved,
      mawaraApproved: clientData.mawaraApproved,
      completionDate: completionDate ? format(completionDate, 'yyyy-MM-dd') : undefined,
      serviceCompletionDate: serviceCompletionDate ? format(serviceCompletionDate, 'yyyy-MM-dd') : undefined,
      rejectionReason: clientData.rejectionReason,
      addedBy: clientData.addedBy || user?.username || '',
      processedBy: user?.username,
      incomplete: clientData.incomplete,
      completedService: clientData.completedService,
      incompleteReason: clientData.incompleteReason,
      pendingReason: clientData.pendingReason,
      installmentNotes: clientData.installmentNotes,
    };
    
    // تنظيف جميع الحقول التي قيمتها undefined قبل الحفظ
    const cleanClientToSave = Object.fromEntries(
      Object.entries(finalClientData).filter(([_, v]) => v !== undefined)
    );
    
    let success = false;
    
    if (isEditMode && clientData.id) {
      // تحديث عميل موجود
      success = await updateClient({
        ...cleanClientToSave as Omit<Client, 'id' | 'uploadDate'>,
        id: clientData.id,
        uploadDate: clientData.uploadDate || new Date().toISOString().split('T')[0]
      } as Client);
    } else {
      // إضافة عميل جديد
      const result = await addClient(cleanClientToSave as Omit<Client, 'id' | 'uploadDate'>);
      success = !!result;
    }
    
    if (success) {
      setClientData({
        name: '',
        phone: '',
        identityNumber: '',
        status: 'approved',
        addedBy: user?.username || '',
        completedService: undefined,
        incompleteReason: '',
        pendingReason: '',
        installmentNotes: '',
      });
      setCompletionDate(undefined);
      setServiceCompletionDate(undefined);
      setIsEditMode(false);
      navigate('/clients');
    } else {
      toast.error('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى');
    }
  };

  const handleEditExisting = () => {
    if (!existingClient) return;
    
    setIsEditMode(true);
    setClientData({
      id: existingClient.id,
      name: existingClient.name,
      phone: existingClient.phone,
      identityNumber: existingClient.identityNumber || existingClient.idNumber || '',
      status: existingClient.status,
      acqaraApproved: existingClient.acqaraApproved,
      mawaraApproved: existingClient.mawaraApproved,
      incomplete: existingClient.incomplete,
      rejectionReason: existingClient.rejectionReason,
      addedBy: existingClient.addedBy,
      uploadDate: existingClient.uploadDate,
      completedService: existingClient.completedService,
      incompleteReason: existingClient.incompleteReason || '',
      pendingReason: existingClient.pendingReason || '',
      installmentNotes: existingClient.installmentNotes || '',
    });
    
    if (existingClient.completionDate) {
      setCompletionDate(new Date(existingClient.completionDate));
    }
    
    if (existingClient.serviceCompletionDate) {
      setServiceCompletionDate(new Date(existingClient.serviceCompletionDate));
    }
    
    setShowExistingDialog(false);
    toast.info(t('client.editMode'));
    navigate(`/add-client?edit=${existingClient.id}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? t('client.edit') : t('client.add')}
      </h1>
      
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>{isEditMode ? t('client.edit') : t('client.add')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('client.name')}</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={clientData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('client.phone')}</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={clientData.phone}
                  onChange={handleInputChange}
                  required 
                  dir="ltr"
                  placeholder="05XXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identityNumber">{t('client.id')}</Label>
                <Input 
                  id="identityNumber" 
                  name="identityNumber" 
                  value={clientData.identityNumber}
                  onChange={handleInputChange}
                  required 
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="status">{t('client.status.label')}</Label>
                <Select
                  value={clientData.status}
                  onValueChange={value => handleStatusChange(value as 'approved' | 'rejected' | 'pending' | 'tammam')}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('client.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">{t('client.status.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('client.status.rejected')}</SelectItem>
                    <SelectItem value="pending">{t('client.status.pending')}</SelectItem>
                    <SelectItem value="tammam">{t('client.status.tammam')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {clientData.status === 'approved' && (
              <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                <h3 className="font-medium">{t('client.status.approved')}</h3>
                
                <div className="space-y-2">
                  <Label className="block">{t('client.acqara')}</Label>
                  <RadioGroup 
                    value={clientData.acqaraApproved ? 'yes' : 'no'} 
                    onValueChange={(value) => handleRadioChange('acqaraApproved', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="yes" id="acqara-yes" />
                      <Label htmlFor="acqara-yes">نعم</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="no" id="acqara-no" />
                      <Label htmlFor="acqara-no">لا</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label className="block">{t('client.mawara')}</Label>
                  <RadioGroup 
                    value={clientData.mawaraApproved ? 'yes' : 'no'} 
                    onValueChange={(value) => handleRadioChange('mawaraApproved', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="yes" id="mawara-yes" />
                      <Label htmlFor="mawara-yes">نعم</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="no" id="mawara-no" />
                      <Label htmlFor="mawara-no">لا</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label className="block">مقبول ولكن لم يتمم الخدمة؟</Label>
                  <RadioGroup
                    value={clientData.completedService === undefined ? '' : clientData.completedService ? 'yes' : 'no'}
                    onValueChange={value => setClientData(prev => ({ ...prev, completedService: value === 'yes' }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="yes" id="incomplete-yes" />
                      <Label htmlFor="incomplete-yes">نعم</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="no" id="incomplete-no" />
                      <Label htmlFor="incomplete-no">لا</Label>
                    </div>
                  </RadioGroup>
                </div>
                {clientData.completedService === true && (
                  <div className="space-y-2">
                    <Label htmlFor="incompleteReason">سبب عدم الإتمام</Label>
                    <Textarea
                      id="incompleteReason"
                      name="incompleteReason"
                      value={clientData.incompleteReason || ''}
                      onChange={e => setClientData(prev => ({ ...prev, incompleteReason: e.target.value }))}
                      placeholder="اكتب سبب عدم الإتمام..."
                      rows={2}
                      required
                    />
                  </div>
                )}
              </div>
            )}
            
            {clientData.status === 'rejected' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">{t('client.rejectionReason')}</Label>
                <Textarea 
                  id="rejectionReason" 
                  name="rejectionReason" 
                  value={clientData.rejectionReason || ''}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
            )}
            
            {clientData.status === 'pending' && (
              <div className="space-y-2">
                <Label htmlFor="pendingReason">سبب الانتظار</Label>
                <Textarea 
                  id="pendingReason" 
                  name="pendingReason" 
                  value={clientData.pendingReason || ''}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
            )}
            
            {/* تاريخ إكمال الخدمة - يظهر فقط إذا لم تكن الحالة تمم */}
            {clientData.status !== 'tammam' && (
              <div className="space-y-2">
                <Label htmlFor="serviceCompletionDate">تاريخ إكمال الخدمة</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right",
                        !serviceCompletionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {serviceCompletionDate ? (
                        format(serviceCompletionDate, "PPP", { locale: language === 'ar' ? ar : enUS })
                      ) : (
                        <span>اختر تاريخاً...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={serviceCompletionDate}
                      onSelect={setServiceCompletionDate}
                      initialFocus
                      locale={language === 'ar' ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {clientData.status === 'tammam' && (
              <div className="space-y-2">
                <Label htmlFor="completionDate">تاريخ إكمال الأقساط</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right",
                        !completionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {completionDate ? (
                        format(completionDate, "PPP", { locale: language === 'ar' ? ar : enUS })
                      ) : (
                        <span>اختر تاريخاً...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={completionDate}
                      onSelect={setCompletionDate}
                      initialFocus
                      locale={language === 'ar' ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
                
                {/* إضافة حقل ملاحظات التقسيط */}
                <div className="mt-4">
                  <Label htmlFor="installmentNotes">{t('client.installmentNotes')}</Label>
                  <Textarea 
                    id="installmentNotes" 
                    name="installmentNotes" 
                    value={clientData.installmentNotes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1"
                    placeholder={t('client.installmentNotesPlaceholder')}
                  />
                </div>
              </div>
            )}
            
            <Button type="submit" className="px-8">
              {isEditMode ? t('client.update') : t('client.save')}
            </Button>
            {isEditMode && (
              <Button 
                type="button" 
                variant="outline" 
                className="px-8 ms-2"
                onClick={() => {
                  setIsEditMode(false);
                  setClientData({
                    name: '',
                    phone: '',
                    identityNumber: '',
                    status: 'approved',
                    addedBy: user?.username || '',
                    completedService: undefined,
                    incompleteReason: '',
                    pendingReason: '',
                    installmentNotes: '',
                  });
                  setCompletionDate(undefined);
                  setServiceCompletionDate(undefined);
                  navigate('/add-client');
                }}
              >
                {t('client.cancel')}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
      
      <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تم العثور على عميل</DialogTitle>
            <DialogDescription>
              هذا العميل مسجل مسبقاً في النظام. هل ترغب في تعديل بياناته؟
            </DialogDescription>
          </DialogHeader>
          
          {existingClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">الاسم:</div>
                <div>{existingClient.name}</div>
                
                <div className="font-medium">رقم الهاتف:</div>
                <div dir="ltr">{existingClient.phone}</div>
                
                <div className="font-medium">رقم الهوية:</div>
                <div dir="ltr">{existingClient.identityNumber}</div>
                
                <div className="font-medium">تاريخ الإضافة:</div>
                <div>{existingClient.uploadDate}</div>
                
                <div className="font-medium">الحالة:</div>
                <div>
                  {existingClient.status === 'approved' 
                    ? t('client.status.approved') 
                    : t('client.status.rejected')}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExistingDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleEditExisting}>
                  تعديل البيانات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddClient;
