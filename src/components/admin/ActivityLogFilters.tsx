import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ar } from 'date-fns/locale';
import { format } from 'date-fns';
import { Filter, X, Calendar as CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogFiltersProps {
  employees: string[];
  actionTypes: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  selectedActionType: string;
  setSelectedActionType: (actionType: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  resetFilters: () => void;
  affectedTypes: string[];
  selectedAffectedType: string;
  setSelectedAffectedType: (type: string) => void;
  onSaveFilterPreset?: () => void;
}

const ActivityLogFilters: React.FC<ActivityLogFiltersProps> = ({
  employees,
  actionTypes,
  searchTerm,
  setSearchTerm,
  selectedEmployee,
  setSelectedEmployee,
  selectedActionType,
  setSelectedActionType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  affectedTypes,
  selectedAffectedType,
  setSelectedAffectedType,
  onSaveFilterPreset,
}) => {
  const filtersActive = 
    searchTerm.trim() !== '' || 
    selectedEmployee !== 'all' || 
    selectedActionType !== 'all' || 
    startDate !== undefined || 
    endDate !== undefined ||
    selectedAffectedType !== 'all';

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-white p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">تصفية سجل النشاط</h3>
        </div>

        <div className="space-y-4">
          {/* البحث في كل الحقول */}
          <div>
            <Label htmlFor="search-activity" className="text-xs text-gray-500 block mb-1">
              البحث في جميع الحقول
            </Label>
            <Input
              id="search-activity"
              placeholder="ابحث في الاسم، التفاصيل، النوع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* تصفية حسب الموظف */}
            <div>
              <Label htmlFor="employee-filter" className="text-xs text-gray-500 block mb-1">
                الموظف
              </Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger id="employee-filter" className="w-full">
                  <SelectValue placeholder="جميع الموظفين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee} value={employee}>
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تصفية حسب نوع الإجراء */}
            <div>
              <Label htmlFor="action-type-filter" className="text-xs text-gray-500 block mb-1">
                نوع الإجراء
              </Label>
              <Select
                value={selectedActionType}
                onValueChange={setSelectedActionType}
              >
                <SelectTrigger id="action-type-filter" className="w-full">
                  <SelectValue placeholder="جميع الإجراءات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الإجراءات</SelectItem>
                  {actionTypes.map((actionType) => (
                    <SelectItem key={actionType} value={actionType}>
                      {actionType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تصفية حسب نوع العنصر المتأثر */}
            <div>
              <Label htmlFor="affected-type-filter" className="text-xs text-gray-500 block mb-1">
                نوع العنصر
              </Label>
              <Select
                value={selectedAffectedType}
                onValueChange={setSelectedAffectedType}
              >
                <SelectTrigger id="affected-type-filter" className="w-full">
                  <SelectValue placeholder="جميع العناصر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العناصر</SelectItem>
                  {affectedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حقول التاريخ من-إلى */}
            <div className="grid grid-cols-2 gap-2">
              {/* تاريخ البداية */}
              <div>
                <Label htmlFor="date-from" className="text-xs text-gray-500 block mb-1">
                  من تاريخ
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, 'yyyy/MM/dd')
                      ) : (
                        <span>اختر التاريخ</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={ar}
                    />
                    {startDate && (
                      <div className="p-2 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => setStartDate(undefined)}
                        >
                          <X className="h-3 w-3" />
                          مسح التاريخ
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* تاريخ النهاية */}
              <div>
                <Label htmlFor="date-to" className="text-xs text-gray-500 block mb-1">
                  إلى تاريخ
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, 'yyyy/MM/dd')
                      ) : (
                        <span>اختر التاريخ</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ar}
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                    />
                    {endDate && (
                      <div className="p-2 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => setEndDate(undefined)}
                        >
                          <X className="h-3 w-3" />
                          مسح التاريخ
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط أزرار الإجراءات */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            disabled={!filtersActive}
          >
            <X className="h-4 w-4 ml-1" />
            إعادة ضبط الفلاتر
          </Button>
          
          {onSaveFilterPreset && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-800"
              onClick={onSaveFilterPreset}
              disabled={!filtersActive}
            >
              <Save className="h-4 w-4 ml-1" />
              حفظ هذه الفلاتر
            </Button>
          )}
        </div>
        
        {filtersActive && (
          <span className="text-sm text-gray-500">تم تطبيق الفلاتر</span>
        )}
      </div>
    </div>
  );
};

export default ActivityLogFilters;
