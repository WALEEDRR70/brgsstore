import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, FilterX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useExportClients } from '@/hooks/useExportClients';
import ClientListView from '@/components/clients/ClientListView';
import ClientDetailsDialog from '@/components/clients/ClientDetailsDialog';
import { Client } from '@/contexts/ClientContext';

const Clients = () => {
  const { t } = useLanguage();
  const { clients, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Nuevos estados para filtros adicionales
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  
  const { handleExport } = useExportClients(clients);

  // Extraer lista única de empleados que han añadido clientes
  const uniqueEmployees = useMemo(() => {
    const employeeSet = new Set<string>();
    clients.forEach(client => {
      if (client.addedBy) {
        employeeSet.add(client.addedBy);
      }
    });
    return Array.from(employeeSet).sort();
  }, [clients]);

  // Función para resetear todos los filtros
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setEmployeeFilter('all');
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtro de búsqueda por texto
      const matchesSearch = 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        (client.idNumber && client.idNumber.includes(searchTerm)) ||
        (client.identityNumber && client.identityNumber.includes(searchTerm));
      
      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      
      // Filtro por fecha de carga (من - من)
      let matchesDateRange = true;
      if (startDate || endDate) {
        const clientDate = new Date(client.uploadDate);
        
        if (startDate && endDate) {
          // Ajustar endDate para incluir todo el día
          const adjustedEndDate = new Date(endDate);
          adjustedEndDate.setHours(23, 59, 59, 999);
          
          matchesDateRange = clientDate >= startDate && clientDate <= adjustedEndDate;
        } else if (startDate) {
          matchesDateRange = clientDate >= startDate;
        } else if (endDate) {
          // Ajustar endDate para incluir todo el día
          const adjustedEndDate = new Date(endDate);
          adjustedEndDate.setHours(23, 59, 59, 999);
          
          matchesDateRange = clientDate <= adjustedEndDate;
        }
      }
      
      // Filtro por empleado que añadió el cliente
      const matchesEmployee = employeeFilter === 'all' || client.addedBy === employeeFilter;
      
      // Combinar todos los filtros
      return matchesSearch && matchesStatus && matchesDateRange && matchesEmployee;
    });
  }, [clients, searchTerm, statusFilter, startDate, endDate, employeeFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      if (sortField === 'uploadDate') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      
      if (valueA === valueB) return 0;
      
      const compareResult = valueA > valueB ? 1 : -1;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [filteredClients, sortField, sortDirection]);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${name}"؟`)) {
      await deleteClient(id);
      toast.success(`تم حذف العميل ${name} بنجاح`);
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleExportCurrentView = () => {
    handleExport(undefined, undefined, sortedClients);
    toast.success(t('client.exportSuccess'));
  };

  // Mostrar el número de clientes filtrados vs. total
  const filterSummary = useMemo(() => {
    if (filteredClients.length === clients.length) {
      return `${clients.length} عميل`;
    } else {
      return `${filteredClients.length} من ${clients.length} عميل`;
    }
  }, [filteredClients.length, clients.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{t('sidebar.clients')}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleExportCurrentView} variant="outline" className="flex items-center gap-2">
            <Download size={18} />
            {t('client.export')}
          </Button>
          <Button asChild>
            <Link to="/add-client" className="flex items-center gap-2">
              <UserPlus size={18} />
              {t('client.add')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Contador de clientes filtrados */}
      {filteredClients.length !== clients.length && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md flex items-center justify-between">
          <span>يتم عرض {filterSummary}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-xs"
          >
            <FilterX size={14} />
            إعادة تعيين الفلاتر
          </Button>
        </div>
      )}

      <ClientListView
        clients={sortedClients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        employeeFilter={employeeFilter}
        setEmployeeFilter={setEmployeeFilter}
        employees={uniqueEmployees}
        resetFilters={resetFilters}
        onViewDetails={handleViewDetails}
        onDelete={handleDelete}
      />

      <ClientDetailsDialog
        client={selectedClient}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default Clients;
