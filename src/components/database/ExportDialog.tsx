import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export interface ExportOptions {
  includeDeleted: boolean;
  includeProcessedOnly: boolean;
  includeCompletedOnly: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onOpenChange,
  onExport,
  isExporting
}) => {
  const { t } = useLanguage();
  const [options, setOptions] = useState<ExportOptions>({
    includeDeleted: false,
    includeProcessedOnly: false,
    includeCompletedOnly: false,
  });

  const handleOptionChange = (option: keyof ExportOptions, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }));
  };

  const handleExport = () => {
    onExport(options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تصدير بيانات العملاء</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="includeDeleted"
              checked={options.includeDeleted}
              onCheckedChange={(checked) => handleOptionChange('includeDeleted', checked === true)}
            />
            <Label htmlFor="includeDeleted">تضمين العملاء المحذوفين</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="includeProcessedOnly"
              checked={options.includeProcessedOnly}
              onCheckedChange={(checked) => handleOptionChange('includeProcessedOnly', checked === true)}
            />
            <Label htmlFor="includeProcessedOnly">فقط العملاء الذين تمت معالجتهم</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="includeCompletedOnly"
              checked={options.includeCompletedOnly}
              onCheckedChange={(checked) => handleOptionChange('includeCompletedOnly', checked === true)}
            />
            <Label htmlFor="includeCompletedOnly">فقط العملاء المكتملين</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} variant="outline">
            إلغاء
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? 'جاري التصدير...' : 'تصدير'}
            {!isExporting && <Download className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;