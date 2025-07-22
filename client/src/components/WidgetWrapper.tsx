import React, { useState, useCallback, useMemo } from 'react';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { WidgetInstance } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Edit, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WidgetWrapperProps {
  widget: WidgetInstance;
  onDataChange: (data: Record<string, any>) => void;
  onConfigChange?: (config: Record<string, any>) => void;
  onRemove?: () => void;
  mode?: 'interactive' | 'text' | 'preview';
  isReadOnly?: boolean;
  showControls?: boolean;
  className?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  onDataChange,
  onConfigChange,
  onRemove,
  mode = 'interactive',
  isReadOnly = false,
  showControls = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentMode, setCurrentMode] = useState<'interactive' | 'text'>(mode === 'text' ? 'text' : 'interactive');

  const widgetComponent = useMemo(() => {
    return widgetRegistry.get(widget.type);
  }, [widget.type]);

  const handleDataChange = useCallback((newData: Record<string, any>) => {
    onDataChange(newData);
  }, [onDataChange]);

  const handleConfigChange = useCallback((newConfig: Record<string, any>) => {
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  }, [onConfigChange]);

  const handleCopyText = useCallback(() => {
    if (!widgetComponent) return;
    
    const text = widgetComponent.generateText(widget.data, widget.config);
    navigator.clipboard.writeText(text);
    // Could add a toast notification here if needed
  }, [widgetComponent, widget.data, widget.config]);

  const toggleMode = useCallback(() => {
    setCurrentMode(prev => prev === 'interactive' ? 'text' : 'interactive');
  }, []);

  if (!widgetComponent) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Widget type "{widget.type}" not found</p>
      </div>
    );
  }

  const WidgetComponent = widgetComponent.component;
  const widgetConfig = widgetComponent.config;

  if (currentMode === 'text') {
    const textContent = widgetComponent.generateText(widget.data, widget.config);
    return (
      <Card className={`widget-wrapper ${className}`}>
        {showControls && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{widgetConfig.label}</CardTitle>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={toggleMode} className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit widget</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleCopyText} className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
                {onRemove && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove widget</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
            {textContent}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`widget-wrapper ${className}`}>
      {showControls && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{widgetConfig.label}</CardTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isExpanded ? 'Minimize' : 'Expand'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={toggleMode} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleCopyText} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              {onRemove && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRemove}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove widget</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      {isExpanded && (
        <CardContent className="pt-0">
          <WidgetComponent
            {...widget}
            onDataChange={handleDataChange}
            onConfigChange={handleConfigChange}
            mode={currentMode}
            isReadOnly={isReadOnly}
          />
        </CardContent>
      )}
    </Card>
  );
};