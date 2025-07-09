import React, { useState } from 'react';
import { ImprovedLabInterface } from './ImprovedLabInterface';
import { processLabValues, LabValue, ProcessedLabValue } from '@/lib/labUtils';

/**
 * Example integration component showing how to use the new ImprovedLabInterface
 * This demonstrates the complete workflow from lab entry to note generation
 */
export function LabIntegrationExample() {
  const [rawLabValues, setRawLabValues] = useState<LabValue[]>([]);
  const [processedLabs, setProcessedLabs] = useState<ProcessedLabValue[]>([]);

  const handleLabAdd = (labValues: LabValue[]) => {
    const updatedRawLabs = [...rawLabValues, ...labValues];
    setRawLabValues(updatedRawLabs);
    
    // Reprocess all lab values when new ones are added
    const newProcessedLabs = processLabValues(updatedRawLabs);
    setProcessedLabs(newProcessedLabs);
  };

  const handleLabsChange = (updatedLabs: ProcessedLabValue[]) => {
    setProcessedLabs(updatedLabs);
  };

  const handleLabRemove = (testName: string) => {
    const updatedRawLabs = rawLabValues.filter(
      lab => lab.testName.toLowerCase() !== testName.toLowerCase()
    );
    setRawLabValues(updatedRawLabs);
    
    const newProcessedLabs = processLabValues(updatedRawLabs);
    setProcessedLabs(newProcessedLabs);
  };

  const selectedLabs = processedLabs.map(lab => lab.testName);

  return (
    <div className="space-y-6">
      <ImprovedLabInterface
        processedLabs={processedLabs}
        onLabsChange={handleLabsChange}
        onLabAdd={handleLabAdd}
        selectedLabs={selectedLabs}
        onLabRemove={handleLabRemove}
      />
      
      {/* Development/Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
          <div className="text-xs space-y-1">
            <div>Raw Lab Values: {rawLabValues.length}</div>
            <div>Processed Labs: {processedLabs.length}</div>
            <div>Visible in Note: {processedLabs.filter(lab => lab.showInNote).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}