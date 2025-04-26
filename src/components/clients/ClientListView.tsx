import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Client } from '@/contexts/ClientContext';
import { Card, CardContent } from '@/components/ui/card';
import ClientFilters from '@/components/clients/ClientFilters';
import ClientsTable from '@/components/database/ClientsTable';

interface ClientListViewProps {
  clients: Client[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  employeeFilter: string;
  setEmployeeFilter: (value: string) => void;
  employees: string[];
  resetFilters: () => void;
  onViewDetails: (client: Client) => void;
  onDelete: (id: number, name: string) => void;
}

const ClientListView = ({
  clients,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  employeeFilter,
  setEmployeeFilter,
  employees,
  resetFilters,
  onViewDetails,
  onDelete,
}: ClientListViewProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="p-4 pt-6">
        <ClientFilters 
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
          employees={employees}
          resetFilters={resetFilters}
        />

        <div className="mt-6 rounded-lg border overflow-hidden">
          <ClientsTable 
            clients={clients} 
            onViewDetails={onViewDetails}
            onDelete={onDelete}
          />
        </div>
        
        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
          <div>{clients.length > 0 ? t('client.totalClients') : 'لا يوجد عملاء'}</div>
          <div>{clients.length > 0 ? t('client.showing') : ''}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientListView;
