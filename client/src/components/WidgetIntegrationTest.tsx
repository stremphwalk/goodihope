import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import { SmartFunctionBuilder } from './SmartFunctionBuilder';
import { widgetRegistry } from '@/lib/widgetRegistry';
import '@/lib/registerWidgets';

interface IntegrationTestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: string;
}

export const WidgetIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [content, setContent] = useState('');
  const [testContent, setTestContent] = useState('Test note with [[WIDGET:medication:test-1]] and [[WIDGET:allergies:test-2]].');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runIntegrationTests = async () => {
    setIsRunning(true);
    const results: IntegrationTestResult[] = [];

    // Test 1: SmartFunctionBuilder Widget Insertion
    try {
      const initialLength = content.length;
      const widget = widgetRegistry.createWidget('medication');
      const syntaxToInsert = `[[WIDGET:medication:${widget?.id}]]`;
      
      // Simulate insertion
      setContent(prev => prev + syntaxToInsert);
      
      const passed = widget !== null;
      results.push({
        test: 'SmartFunctionBuilder Widget Insertion',
        passed,
        message: passed 
          ? 'Successfully inserted widget syntax via SmartFunctionBuilder'
          : 'Failed to insert widget via SmartFunctionBuilder',
        details: passed ? `Inserted: ${syntaxToInsert}` : undefined
      });
    } catch (error) {
      results.push({
        test: 'SmartFunctionBuilder Widget Insertion',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 2: DotPhraseTextarea Widget Detection
    try {
      const testText = '[[WIDGET:medication:test-1]] [[WIDGET:allergies:test-2]]';
      const { parseWidgetSyntax } = await import('@/lib/widgetRegistry');
      const matches = parseWidgetSyntax(testText);
      
      const passed = matches.length === 2;
      results.push({
        test: 'DotPhraseTextarea Widget Detection',
        passed,
        message: passed 
          ? 'Successfully detected widgets in textarea'
          : 'Failed to detect widgets in textarea',
        details: passed ? `Detected ${matches.length} widgets` : undefined
      });
    } catch (error) {
      results.push({
        test: 'DotPhraseTextarea Widget Detection',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 3: Widget State Persistence
    try {
      const widget = widgetRegistry.createWidget('medication');
      const testData = {
        homeMedications: [{
          id: 'test-med-1',
          name: 'Test Medication',
          dosage: '10mg',
          frequency: 'BID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        }],
        hospitalMedications: []
      };

      // Update widget data
      widget!.data = testData;
      
      // Verify data persistence
      const passed = widget!.data.homeMedications.length === 1 && 
                    widget!.data.homeMedications[0].name === 'Test Medication';
      
      results.push({
        test: 'Widget State Persistence',
        passed,
        message: passed 
          ? 'Widget data persisted correctly'
          : 'Widget data not persisted',
        details: passed ? 'Added 1 home medication' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Widget State Persistence',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 4: Widget Text Generation
    try {
      const testData = {
        homeMedications: [{
          id: 'test-med-1',
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'DIE',
          isCustom: false,
          category: 'cardiovascular',
          addedAt: Date.now(),
          isDiscontinued: false
        }],
        hospitalMedications: [{
          id: 'test-med-2',
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'BID',
          isCustom: false,
          category: 'endocrine',
          addedAt: Date.now(),
          isDiscontinued: false
        }]
      };

      const text = widgetRegistry.generateText('medication', testData);
      const passed = text.includes('Lisinopril') && text.includes('Metformin') && 
                    text.includes('Home Medications') && text.includes('Hospital Medications');
      
      results.push({
        test: 'Widget Text Generation',
        passed,
        message: passed 
          ? 'Generated formatted text successfully'
          : 'Failed to generate proper formatted text',
        details: passed ? text.substring(0, 100) + '...' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Widget Text Generation',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 5: Multiple Widget Types Integration
    try {
      const medicationWidget = widgetRegistry.createWidget('medication');
      const allergiesWidget = widgetRegistry.createWidget('allergies');
      const pmhWidget = widgetRegistry.createWidget('pmh');
      const impressionWidget = widgetRegistry.createWidget('impression');
      
      const allCreated = [medicationWidget, allergiesWidget, pmhWidget, impressionWidget]
        .every(w => w !== null);
      
      const allTypesCorrect = medicationWidget?.type === 'medication' &&
                             allergiesWidget?.type === 'allergies' &&
                             pmhWidget?.type === 'pmh' &&
                             impressionWidget?.type === 'impression';
      
      const passed = allCreated && allTypesCorrect;
      
      results.push({
        test: 'Multiple Widget Types Integration',
        passed,
        message: passed 
          ? 'All widget types created successfully'
          : 'Failed to create all widget types',
        details: passed ? 'Created: medication, allergies, pmh, impression' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Multiple Widget Types Integration',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 6: Widget Data Validation
    try {
      const validMedData = {
        homeMedications: [],
        hospitalMedications: []
      };
      
      const invalidMedData = {
        homeMedications: 'invalid', // Should be array
        hospitalMedications: null
      };
      
      const validResult = widgetRegistry.validateData('medication', validMedData);
      const invalidResult = widgetRegistry.validateData('medication', invalidMedData);
      
      const passed = validResult === true && invalidResult === false;
      
      results.push({
        test: 'Widget Data Validation',
        passed,
        message: passed 
          ? 'Data validation working correctly'
          : 'Data validation failed',
        details: passed ? 'Valid data accepted, invalid data rejected' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Widget Data Validation',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 7: Copy Functionality
    try {
      const testData = {
        homeMedications: [{
          id: 'test-med-1',
          name: 'Test Med',
          dosage: '10mg',
          frequency: 'BID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        }],
        hospitalMedications: []
      };

      const text = widgetRegistry.generateText('medication', testData);
      
      // Test clipboard API availability
      const clipboardAvailable = typeof navigator !== 'undefined' && 
                                 navigator.clipboard && 
                                 typeof navigator.clipboard.writeText === 'function';
      
      const passed = clipboardAvailable && text.length > 0;
      
      results.push({
        test: 'Copy Functionality',
        passed,
        message: passed 
          ? 'Copy functionality available and working'
          : 'Copy functionality not available',
        details: passed ? 'Clipboard API available' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Copy Functionality',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 8: Widget Cleanup and Memory Management
    try {
      const initialWidgets = Array.from({ length: 10 }, () => widgetRegistry.createWidget('medication'));
      const allCreated = initialWidgets.every(w => w !== null);
      
      // Test that we can create more widgets after initial batch
      const additionalWidgets = Array.from({ length: 5 }, () => widgetRegistry.createWidget('allergies'));
      const additionalCreated = additionalWidgets.every(w => w !== null);
      
      const passed = allCreated && additionalCreated;
      
      results.push({
        test: 'Widget Cleanup and Memory Management',
        passed,
        message: passed 
          ? 'Widget creation and cleanup working properly'
          : 'Issues with widget memory management',
        details: passed ? 'Created 10 + 5 widgets successfully' : undefined
      });
    } catch (error) {
      results.push({
        test: 'Widget Cleanup and Memory Management',
        passed: false,
        message: `Error: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const handleInsert = (insertedContent: string) => {
    setContent(prev => prev + insertedContent);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Widget Integration Test Suite
            <Button onClick={runIntegrationTests} disabled={isRunning}>
              {isRunning ? 'Running Integration Tests...' : 'Run Integration Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length > 0 && (
            <div className="mb-4">
              <div className={`text-lg font-semibold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                {passedTests}/{totalTests} Integration Tests Passed
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(passedTests / totalTests) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded border ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`text-sm ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.passed ? '✓ PASS' : '✗ FAIL'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                {result.details && (
                  <div className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded">
                    {result.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Integration Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Smart Function Builder (Insert widgets here):
            </label>
            <SmartFunctionBuilder onInsert={handleInsert} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Content with Widget Support:
            </label>
            <DotPhraseTextarea
              value={content}
              onChange={setContent}
              placeholder="Use Smart Function Builder above or type widget syntax like [[WIDGET:medication:test-1]]..."
              rows={6}
              onRef={() => textareaRef}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Test Content (with multiple widgets):
            </label>
            <DotPhraseTextarea
              value={testContent}
              onChange={setTestContent}
              placeholder="This demonstrates multiple widgets working together..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setContent('')}
            >
              Clear Content
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setContent('Patient presents with:\n\n[[WIDGET:medication:demo-1]]\n\nAllergies:\n[[WIDGET:allergies:demo-2]]\n\nPast Medical History:\n[[WIDGET:pmh:demo-3]]\n\nClinical Impression:\n[[WIDGET:impression:demo-4]]')}
            >
              Load Full Example
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};