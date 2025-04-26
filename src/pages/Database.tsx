import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/contexts/ClientContext';
import ExportDialog, { ExportOptions } from '@/components/database/ExportDialog';
import ClientsTable from '@/components/database/ClientsTable';
import { useExportClients } from '@/hooks/useExportClients';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Database = () => {
  const { t } = useLanguage();
  const { clients, deleteClient } = useClients();
  const { handleExport, isExporting } = useExportClients(clients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Handler for view details action
  const handleViewDetails = (client) => {
    setSelectedClient(client);
    // In a real implementation, you might want to navigate to a details page or open a modal
    console.log('Viewing details for:', client);
  };

  // Handler for delete action
  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${name}"؟`)) {
      await deleteClient(id);
      toast.success(`تم حذف العميل ${name} بنجاح`);
    }
  };

  // Handler for export action with options
  const handleExportWithOptions = (options: ExportOptions) => {
    // Aplicar filtros según las opciones seleccionadas
    let clientsToExport = [...clients];
    
    if (!options.includeDeleted) {
      clientsToExport = clientsToExport.filter(client => !client.deleted);
    }
    
    if (options.includeProcessedOnly) {
      clientsToExport = clientsToExport.filter(client => client.processedBy);
    }
    
    if (options.includeCompletedOnly) {
      clientsToExport = clientsToExport.filter(client => !client.incomplete);
    }
    
    handleExport(undefined, undefined, clientsToExport);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('sidebar.database')}</h1>
        <button 
          onClick={() => setIsExportDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
        >
          <span>تصدير البيانات</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
      <ClientsTable 
        clients={clients} 
        onViewDetails={handleViewDetails}
        onDelete={handleDelete}
      />
      
      <ExportDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExportWithOptions}
        isExporting={isExporting}
      />
    </div>
  );
};

export default Database;
