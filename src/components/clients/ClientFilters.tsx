import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Search, Filter, CalendarIcon, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ar, enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface ClientFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  employeeFilter: string;
  setEmployeeFilter: (value: string) => void;
  employees: string[];
  resetFilters: () => void;
}

const ClientFilters = ({ 
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
  resetFilters
}: ClientFiltersProps) => {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            className="pl-10"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-gray-400" />
          <Select 
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('client.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('client.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('client.status.pending')}</SelectItem>
              <SelectItem value="approved">{t('client.status.approved')}</SelectItem>
              <SelectItem value="rejected">{t('client.status.rejected')}</SelectItem>
              <SelectItem value="tammam">تمم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-filters">
          <AccordionTrigger className="text-sm">فلترة متقدمة</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* فلتر تاريخ الرفع (من) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">تاريخ الرفع (من)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP", { locale: language === 'ar' ? ar : enUS })
                      ) : (
                        <span>اختر تاريخاً...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={language === 'ar' ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* فلتر تاريخ الرفع (إلى) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">تاريخ الرفع (إلى)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP", { locale: language === 'ar' ? ar : enUS })
                      ) : (
                        <span>اختر تاريخاً...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={language === 'ar' ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* فلتر الموظف الذي أضاف العميل */}
              <div className="space-y-2">
                <label className="text-sm font-medium">الموظف الذي أضاف العميل</label>
                <div className="flex items-center gap-2 w-full">
                  <User className="h-5 w-5 text-gray-400" />
                  <Select 
                    value={employeeFilter}
                    onValueChange={setEmployeeFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر موظفاً..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الموظفين</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee} value={employee}>{employee}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* زر إعادة تعيين الفلاتر */}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs"
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ClientFilters;
