import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Client } from '@/contexts/ClientContext';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Ícono de WhatsApp personalizado para mejor representación visual
const WhatsAppIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="white" 
    stroke="currentColor" 
    strokeWidth="0" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12.001 2C6.478 2 2.001 6.477 2.001 12c0 1.432.3 2.795.84 4.032l-1.038 3.866c-.128.477.285.89.762.762l3.865-1.038c1.238.54 2.6.838 4.032.838 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
  </svg>
);

interface ClientDetailsDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientDetailsDialog = ({ client, isOpen, onOpenChange }: ClientDetailsDialogProps) => {
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'tammam':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">تفاصيل العميل</DialogTitle>
          <DialogDescription>
            معلومات كاملة عن العميل
          </DialogDescription>
        </DialogHeader>
        {client && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('client.name')}</h3>
              <p>{client.name}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('client.phone')}</h3>
              <div className="flex items-center gap-2">
                <p dir="ltr">{client.phone}</p>
                <a 
                  href={`https://wa.me/${client.phone.startsWith('0') ? '966' + client.phone.substring(1) : client.phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="تواصل عبر واتساب"
                  className="p-2 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
                  aria-label="تواصل عبر واتساب"
                >
                  <WhatsAppIcon />
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('client.id')}</h3>
              <p dir="ltr">{client.identityNumber || client.idNumber}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('client.status')}</h3>
              <Badge className={getStatusColor(client.status)}>
                {client.status === 'approved' && t('client.status.approved')}
                {client.status === 'rejected' && t('client.status.rejected')}
                {client.status === 'pending' && t('client.status.pending')}
                {client.status === 'tammam' && 'تمم'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('client.uploadDate')}</h3>
              <p dir="ltr">{client.uploadDate}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">أضيف بواسطة</h3>
              <p>{client.addedBy}</p>
            </div>
            {client.completionDate && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">تاريخ الإنجاز</h3>
                <p dir="ltr">{client.completionDate}</p>
              </div>
            )}
            {client.serviceCompletionDate && (
              <div className="text-sm text-green-700 font-medium mt-2">
                <span>تاريخ إكمال الخدمة: {client.serviceCompletionDate}</span>
              </div>
            )}
            {client.status === 'tammam' && client.installmentNotes && (
              <div className="space-y-2 col-span-2">
                <h3 className="font-semibold text-sm">ملاحظات الاقساط</h3>
                <p className="text-blue-800">{client.installmentNotes}</p>
              </div>
            )}
            {client.rejectionReason && (
              <div className="space-y-2 col-span-2">
                <h3 className="font-semibold text-sm">سبب الرفض</h3>
                <p>{client.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {client && (
            <Button asChild className="flex items-center gap-2">
              <Link to={`/add-client?edit=${client.id}`}>
                <Edit size={16} />
                تعديل
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailsDialog;
