import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import { SmartFunctionBuilder } from './SmartFunctionBuilder';
import '@/lib/registerWidgets';

export const WidgetDemo: React.FC = () => {
  const [content, setContent] = useState('');

  const handleInsert = (insertedContent: string) => {
    setContent(prev => prev + insertedContent);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget-Enhanced Dot Phrase System Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Use the Smart Function Builder below to insert widgets</li>
              <li>Click on any widget button (Medications, Allergies, PMH, or Clinical Impression)</li>
              <li>The widget syntax will be inserted into the textarea</li>
              <li>The interactive widget will appear below the textarea</li>
              <li>You can interact with the widget to add data</li>
              <li>Use "Copy as Text" to get the formatted output</li>
            </ol>
          </div>

          <SmartFunctionBuilder onInsert={handleInsert} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Dot Phrase Content (with Widget Support):
            </label>
            <DotPhraseTextarea
              value={content}
              onChange={setContent}
              placeholder="Type dot phrases like /dm2 or use the Smart Function Builder above to insert widgets..."
              rows={8}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setContent('')}
            >
              Clear
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setContent('Patient presents with [[WIDGET:medication:demo-1]] and [[WIDGET:allergies:demo-2]].\n\nPast Medical History:\n[[WIDGET:pmh:demo-3]]\n\nClinical Impression:\n[[WIDGET:impression:demo-4]]')}
            >
              Load Example
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};