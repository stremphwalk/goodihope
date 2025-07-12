import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { WidgetWrapper } from './WidgetWrapper';
import { X } from 'lucide-react';

interface WidgetModalProps {
  isOpen: boolean;
  widgetType: string;
  onClose: () => void;
  onResult: (data: Record<string, any>) => void;
}

export const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  widgetType,
  onClose,
  onResult
}) => {
  const [widgetInstance, setWidgetInstance] = useState<any>(null);

  useEffect(() => {
    if (isOpen && widgetType) {
      const instance = widgetRegistry.createWidget(widgetType);
      if (instance) {
        instance.onDataChange = (data: Record<string, any>) => {
          setWidgetInstance({ ...instance, data });
        };
        setWidgetInstance(instance);
      }
    }
  }, [isOpen, widgetType]);

  const handleConfirm = () => {
    if (widgetInstance && widgetInstance.data) {
      onResult(widgetInstance.data);
    }
    onClose();
  };

  const handleCancel = () => {
    setWidgetInstance(null);
    onClose();
  };

  if (!widgetInstance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-300 shadow-lg">
        <DialogHeader className="bg-white border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="capitalize text-gray-900 font-semibold">
              {widgetType} Widget
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 bg-white p-4">
          <WidgetWrapper
            widget={widgetInstance}
            onDataChange={(data) => {
              setWidgetInstance({ ...widgetInstance, data });
            }}
            mode="interactive"
            isReadOnly={false}
            showControls={false}
            className="bg-white border border-gray-200 rounded-lg p-4"
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 bg-white">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Insert into Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};