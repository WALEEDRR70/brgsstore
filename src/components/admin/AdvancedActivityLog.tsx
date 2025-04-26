import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Download, Eye, List, Clock, AlertCircle, Check, AlertTriangle, FileText, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ActivityLogFilters from './ActivityLogFilters';
import ActivityLogDetailsDialog from './ActivityLogDetailsDialog';
import { useExportLogs } from '@/hooks/useExportLogs';

interface ActivityLog {
  id: string;
  username?: string;
  userId?: string;
  actionType: string;
  details: string;
  affectedType?: string;
  affectedId?: string;
  createdAt: any; // Firestore timestamp
  extra?: any;
}

interface AdvancedActivityLogProps {
  logs: ActivityLog[];
  refreshLogs?: () => void;
  onOpenLogDetails?: (log: ActivityLog) => void;
}

const AdvancedActivityLog: React.FC<AdvancedActivityLogProps> = ({ logs, refreshLogs, onOpenLogDetails }) => {
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedAffectedType, setSelectedAffectedType] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof ActivityLog>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Log details dialog
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Export
  const { handleExport, isExporting } = useExportLogs(logs);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedEmployee, selectedActionType, selectedAffectedType, startDate, endDate]);

  // Extract unique values for filter options
  const uniqueEmployees = useMemo(() => {
    const employeeSet = new Set<string>();
    logs.forEach(log => {
      if (log.username) {
        employeeSet.add(log.username);
      }
    });
    return Array.from(employeeSet).sort();
  }, [logs]);

  const uniqueActionTypes = useMemo(() => {
    const actionTypeSet = new Set<string>();
    logs.forEach(log => {
      if (log.actionType) {
        actionTypeSet.add(log.actionType);
      }
    });
    return Array.from(actionTypeSet).sort();
  }, [logs]);

  const uniqueAffectedTypes = useMemo(() => {
    const affectedTypeSet = new Set<string>();
    logs.forEach(log => {
      if (log.affectedType) {
        affectedTypeSet.add(log.affectedType);
      }
    });
    return Array.from(affectedTypeSet).sort();
  }, [logs]);

  // Apply filters and sorting
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      const matchesSearch = 
        searchTerm === '' ||
        (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.affectedType && log.affectedType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.affectedId && log.affectedId.includes(searchTerm));
      
      // Employee filter
      const matchesEmployee = 
        selectedEmployee === 'all' ||
        log.username === selectedEmployee;
      
      // Action type filter
      const matchesActionType = 
        selectedActionType === 'all' ||
        log.actionType === selectedActionType;
      
      // Affected type filter
      const matchesAffectedType = 
        selectedAffectedType === 'all' ||
        log.affectedType === selectedAffectedType;
      
      // Date range filter
      let matchesDateRange = true;
      
      if (startDate || endDate) {
        const logDate = log.createdAt.toDate ? log.createdAt.toDate() : new Date(log.createdAt);
        
        if (startDate && endDate) {
          // Adjust endDate to include full day
          const adjustedEndDate = new Date(endDate);
          adjustedEndDate.setHours(23, 59, 59, 999);
          
          matchesDateRange = logDate >= startDate && logDate <= adjustedEndDate;
        } else if (startDate) {
          matchesDateRange = logDate >= startDate;
        } else if (endDate) {
          // Adjust endDate to include full day
          const adjustedEndDate = new Date(endDate);
          adjustedEndDate.setHours(23, 59, 59, 999);
          
          matchesDateRange = logDate <= adjustedEndDate;
        }
      }
      
      return matchesSearch && matchesEmployee && matchesActionType && matchesAffectedType && matchesDateRange;
    });
  }, [logs, searchTerm, selectedEmployee, selectedActionType, selectedAffectedType, startDate, endDate]);

  // Apply sorting to filtered logs
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Convert timestamps to dates for comparison
      if (sortField === 'createdAt') {
        valueA = valueA.toDate ? valueA.toDate().getTime() : new Date(valueA).getTime();
        valueB = valueB.toDate ? valueB.toDate().getTime() : new Date(valueB).getTime();
      }
      
      // String comparison for text fields
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Numeric comparison
      if (valueA === valueB) return 0;
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [filteredLogs, sortField, sortDirection]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return sortedLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedLogs, page, rowsPerPage]);

  const pageCount = Math.ceil(sortedLogs.length / rowsPerPage);

  // Handle sort click
  const handleSort = (field: keyof ActivityLog) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedActionType('all');
    setSelectedAffectedType('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  // View log details
  const viewLogDetails = (log: ActivityLog) => {
    if (onOpenLogDetails) {
      onOpenLogDetails(log);
    } else {
      setSelectedLog(log);
      setIsDetailsDialogOpen(true);
    }
  };

  // Export filtered logs
  const handleExportFiltered = () => {
    if (filteredLogs.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }
    handleExport(filteredLogs);
  };

  // Get action type badge color
  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('إضافة') || actionType.includes('تسجيل دخول')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (actionType.includes('تعديل') || actionType.includes('تحديث')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (actionType.includes('حذف')) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (actionType.includes('استعادة')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get affected type icon
  const getAffectedTypeIcon = (type?: string) => {
    if (!type) return <FileText className="h-4 w-4" />;
    
    switch (type.toLowerCase()) {
      case 'عميل':
        return <List className="h-4 w-4" />;
      case 'مستخدم':
        return <Clock className="h-4 w-4" />;
      case 'نظام':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">سجل نشاط الموظفين</CardTitle>
              <CardDescription>
                سجل تفصيلي يحتوي على كافة إجراءات المستخدمين في النظام
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleExportFiltered}
                disabled={isExporting || filteredLogs.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'جاري التصدير...' : 'تصدير (XLSX)'}
              </Button>
              {refreshLogs && (
                <Button
                  variant="outline"
                  onClick={refreshLogs}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  تحديث
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-6">
            <ActivityLogFilters
              employees={uniqueEmployees}
              actionTypes={uniqueActionTypes}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={setSelectedEmployee}
              selectedActionType={selectedActionType}
              setSelectedActionType={setSelectedActionType}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              resetFilters={resetFilters}
              affectedTypes={uniqueAffectedTypes}
              selectedAffectedType={selectedAffectedType}
              setSelectedAffectedType={setSelectedAffectedType}
            />
            
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 border rounded-lg bg-gray-50">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertTriangle className="h-10 w-10 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mt-2">لا توجد سجلات نشاط</h3>
                  <p className="text-sm text-gray-500">
                    لم يتم العثور على سجلات نشاط تطابق معايير البحث الحالية
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3" 
                    onClick={resetFilters}
                  >
                    إعادة ضبط الفلاتر
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  يتم عرض {paginatedLogs.length} من أصل {filteredLogs.length} سجل
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('actionType')}
                        >
                          <div className="flex items-center">
                            نوع الإجراء
                            {sortField === 'actionType' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="mr-1 h-4 w-4" /> : 
                                <ChevronDown className="mr-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('username')}
                        >
                          <div className="flex items-center">
                            المستخدم
                            {sortField === 'username' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="mr-1 h-4 w-4" /> : 
                                <ChevronDown className="mr-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">التفاصيل</TableHead>
                        <TableHead
                          className="cursor-pointer hidden md:table-cell"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            التاريخ
                            {sortField === 'createdAt' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="mr-1 h-4 w-4" /> : 
                                <ChevronDown className="mr-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="w-[90px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.map((log, index) => (
                        <TableRow 
                          key={log.id} 
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">
                            {(page - 1) * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Badge className={`font-normal px-2 py-1 ${getActionBadgeColor(log.actionType)}`}>
                              {log.actionType}
                            </Badge>
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              {getAffectedTypeIcon(log.affectedType)}
                              <span>{log.affectedType || 'عام'}</span>
                              {log.affectedId && (
                                <span className="bg-gray-100 px-1 rounded text-[10px]">
                                  {log.affectedId}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{log.username || 'غير معروف'}</TableCell>
                          <TableCell className="max-w-[200px] truncate hidden sm:table-cell">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">{log.details}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-wrap">{log.details}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm hidden md:table-cell">
                            {log.createdAt && log.createdAt.toDate 
                              ? format(log.createdAt.toDate(), 'yyyy/MM/dd HH:mm:ss')
                              : format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm:ss')
                            }
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewLogDetails(log)}
                              className="ml-auto"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {pageCount > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => page > 1 ? setPage(p => Math.max(1, p - 1)) : undefined}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {page > 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(1)}>
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Ellipsis if needed */}
                      {page > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Previous page if not first */}
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(page - 1)}>
                            {page - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Current page */}
                      <PaginationItem>
                        <PaginationLink isActive>{page}</PaginationLink>
                      </PaginationItem>
                      
                      {/* Next page if not last */}
                      {page < pageCount && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(page + 1)}>
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Ellipsis if needed */}
                      {page < pageCount - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Last page */}
                      {page < pageCount - 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setPage(pageCount)}>
                            {pageCount}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => page < pageCount ? setPage(p => Math.min(pageCount, p + 1)) : undefined}
                          className={page === pageCount ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalles */}
      <ActivityLogDetailsDialog
        activityLog={selectedLog}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        refreshLogs={refreshLogs}
      />
    </div>
  );
};

export default AdvancedActivityLog;
