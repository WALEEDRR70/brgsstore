import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Client } from '@/contexts/ClientContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface ClientsTableProps {
  clients: Client[];
  onViewDetails: (client: Client) => void;
  onDelete: (id: number, name?: string) => void;
}

const ClientsTable = ({ clients, onViewDetails, onDelete }: ClientsTableProps) => {
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
    <div className="bg-white rounded-lg shadow animate-fade-in-up">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('client.name')}</TableHead>
            <TableHead>{t('client.phone')}</TableHead>
            <TableHead>{t('client.id')}</TableHead>
            <TableHead>{t('client.status')}</TableHead>
            <TableHead>{t('client.uploadDate')}</TableHead>
            <TableHead className="text-center">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? (
            clients.map((client, idx) => (
              <TableRow key={client.id} className="transition-transform duration-300 hover:scale-[1.015] hover:bg-blue-50/50 group animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <TableCell>{client.name}</TableCell>
                <TableCell dir="ltr" className="flex items-center gap-2">
                  {client.phone}
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
                </TableCell>
                <TableCell dir="ltr">{client.identityNumber || client.idNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(client.status) + ' animate-pop'}>
                    {client.status === 'approved' && t('client.status.approved')}
                    {client.status === 'rejected' && t('client.status.rejected')}
                    {client.status === 'pending' && t('client.status.pending')}
                    {client.status === 'tammam' && 'تمم'}
                  </Badge>
                  {/* تاريخ إكمال الخدمة */}
                  {client.serviceCompletionDate && (
                    <div className="text-xs mt-1 text-green-700 font-medium animate-fade-in">
                      <span>تاريخ إكمال الخدمة: {client.serviceCompletionDate}</span>
                      <br />
                      <span>
                        متبقي:
                        {
                          (() => {
                            const today = new Date();
                            const compDate = new Date(client.serviceCompletionDate);
                            const diffTime = compDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays >= 0 ? ` ${diffDays} يوم` : ` انتهى منذ ${Math.abs(diffDays)} يوم`;
                          })()
                        }
                      </span>
                    </div>
                  )}
                  {/* تاريخ إكمال الأقساط وعدد الأيام المتبقية */}
                  {client.status === 'tammam' && client.completionDate && (
                    <div className="text-xs mt-1 text-blue-700 font-medium animate-fade-in">
                      <span>تاريخ الإكمال: {client.completionDate}</span>
                      <br />
                      <span>
                        متبقي:
                        {
                          (() => {
                            const today = new Date();
                            const compDate = new Date(client.completionDate);
                            const diffTime = compDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays >= 0 ? ` ${diffDays} يوم` : ` انتهى منذ ${Math.abs(diffDays)} يوم`;
                          })()
                        }
                      </span>
                      {/* إضافة ملاحظات التقسيط */}
                      {client.installmentNotes && (
                        <>
                          <br />
                          <span className="text-blue-800">ملاحظات الاقساط: {client.installmentNotes}</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* تفاصيل إضافية حسب الحالة */}
                  {client.status === 'rejected' && client.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1 animate-fade-in">سبب الرفض: {client.rejectionReason}</div>
                  )}
                  {client.status === 'approved' && (
                    <div className="text-xs text-green-700 mt-1 animate-fade-in">
                      {/* مقبول في أكوارا أو موارا */}
                      {client.acqaraApproved && client.mawaraApproved && 'مقبول في أكوارا وموارا'}
                      {client.acqaraApproved && !client.mawaraApproved && 'مقبول في أكوارا فقط'}
                      {!client.acqaraApproved && client.mawaraApproved && 'مقبول في موارا فقط'}
                      {/* لم يتمم الخدمة مع ذكر السبب */}
                      {client.completedService === true && (
                        <>
                          {' - لم يتمم الخدمة'}
                          {client.incompleteReason && ` (السبب: ${client.incompleteReason})`}
                        </>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell dir="ltr">{client.uploadDate}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onViewDetails(client)}
                      title={t('client.details')}
                      aria-label={t('client.details')}
                      className="transition-transform duration-200 hover:scale-110 active:scale-95"
                    >
                      <FileText size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild
                      title={t('client.edit')}
                      className="transition-transform duration-200 hover:scale-110 active:scale-95"
                    >
                      <Link to={`/add-client?edit=${client.id}`}>
                        <Edit size={18} className="text-blue-600 hover:text-blue-700" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDelete(client.id, client.name)}
                      title={t('client.delete')}
                      aria-label={t('client.delete')}
                      className="transition-transform duration-200 hover:scale-110 active:scale-95"
                    >
                      <Trash size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 animate-fade-in">
                {t('client.noClients')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
