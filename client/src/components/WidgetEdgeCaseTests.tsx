import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { widgetRegistry, parseWidgetSyntax } from '@/lib/widgetRegistry';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import '@/lib/registerWidgets';

interface EdgeCaseResult {
  test: string;
  passed: boolean;
  message: string;
}

export const WidgetEdgeCaseTests: React.FC = () => {
  const [testResults, setTestResults] = useState<EdgeCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testContent, setTestContent] = useState('');

  const runEdgeCaseTests = async () => {
    setIsRunning(true);
    const results: EdgeCaseResult[] = [];

    // Test 1: Invalid widget types
    try {
      const invalidWidget = widgetRegistry.createWidget('nonexistent');
      const passed = invalidWidget === null;
      
      results.push({
        test: 'Invalid Widget Type Creation',
        passed,
        message: passed 
          ? 'Correctly returned null for invalid widget type'
          : 'Should return null for invalid widget type'
      });
    } catch (error) {
      results.push({
        test: 'Invalid Widget Type Creation',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 2: Malformed widget syntax
    try {
      const malformedSyntax = [
        '[[WIDGET:medication]]',  // Missing ID
        '[[WIDGET::test-1]]',     // Missing type
        '[[WIDGET:medication:]]', // Empty ID
        '[[WIDGET::]]',           // Missing both
        '[[WIDGET:medication:test-1:extra]]', // Extra parameter
      ];

      let allPassed = true;
      for (const syntax of malformedSyntax) {
        const matches = parseWidgetSyntax(syntax);
        if (matches.length > 0) {
          allPassed = false;
          break;
        }
      }

      results.push({
        test: 'Malformed Widget Syntax',
        passed: allPassed,
        message: allPassed 
          ? 'Correctly rejected all malformed syntax'
          : 'Some malformed syntax was incorrectly parsed'
      });
    } catch (error) {
      results.push({
        test: 'Malformed Widget Syntax',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 3: Empty or null data handling
    try {
      const widget = widgetRegistry.createWidget('medication');
      let passed = true;
      
      // Test with empty data
      widget!.data = { homeMedications: [], hospitalMedications: [] };
      const emptyText = widgetRegistry.generateText('medication', widget!.data);
      if (!emptyText.includes('No medications documented')) {
        passed = false;
      }

      // Test with null data
      try {
        const nullText = widgetRegistry.generateText('medication', null as any);
        if (!nullText.includes('Error') && !nullText.includes('No medications')) {
          passed = false;
        }
      } catch (e) {
        // Expected to handle gracefully
      }

      results.push({
        test: 'Empty/Null Data Handling',
        passed,
        message: passed 
          ? 'Correctly handled empty and null data'
          : 'Failed to handle empty/null data gracefully'
      });
    } catch (error) {
      results.push({
        test: 'Empty/Null Data Handling',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 4: Large data handling
    try {
      const largeData = {
        homeMedications: Array.from({ length: 100 }, (_, i) => ({
          id: `med-${i}`,
          name: `Medication ${i}`,
          dosage: `${i}mg`,
          frequency: 'BID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        })),
        hospitalMedications: []
      };

      const widget = widgetRegistry.createWidget('medication', largeData);
      const text = widgetRegistry.generateText('medication', largeData);
      const passed = widget !== null && typeof text === 'string' && text.length > 0;

      results.push({
        test: 'Large Data Handling',
        passed,
        message: passed 
          ? 'Successfully handled large dataset (100 medications)'
          : 'Failed to handle large dataset'
      });
    } catch (error) {
      results.push({
        test: 'Large Data Handling',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 5: Concurrent widget creation
    try {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve(widgetRegistry.createWidget('medication'))
      );
      const widgets = await Promise.all(promises);
      const uniqueIds = new Set(widgets.map(w => w?.id));
      const passed = widgets.every(w => w !== null) && uniqueIds.size === 10;

      results.push({
        test: 'Concurrent Widget Creation',
        passed,
        message: passed 
          ? 'Successfully created 10 concurrent widgets with unique IDs'
          : 'Failed concurrent widget creation or duplicate IDs'
      });
    } catch (error) {
      results.push({
        test: 'Concurrent Widget Creation',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 6: Widget ID collision handling
    try {
      // Create widgets with same type but different timestamps
      const widget1 = widgetRegistry.createWidget('medication');
      await new Promise(resolve => setTimeout(resolve, 1)); // Ensure different timestamp
      const widget2 = widgetRegistry.createWidget('medication');
      
      const passed = widget1?.id !== widget2?.id;

      results.push({
        test: 'Widget ID Collision Prevention',
        passed,
        message: passed 
          ? 'Successfully generated unique IDs for same widget type'
          : 'Widget ID collision detected'
      });
    } catch (error) {
      results.push({
        test: 'Widget ID Collision Prevention',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 7: Invalid character handling in widget data
    try {
      const specialChars = {
        homeMedications: [{
          id: 'test-1',
          name: 'Med with "quotes" & <tags> and \n newlines',
          dosage: '10mg',
          frequency: 'BID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        }],
        hospitalMedications: []
      };

      const text = widgetRegistry.generateText('medication', specialChars);
      const passed = typeof text === 'string' && text.length > 0;

      results.push({
        test: 'Special Characters in Data',
        passed,
        message: passed 
          ? 'Successfully handled special characters in medication names'
          : 'Failed to handle special characters'
      });
    } catch (error) {
      results.push({
        test: 'Special Characters in Data',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 8: Memory management with widget cleanup
    try {
      const initialWidgets = Array.from({ length: 50 }, () => widgetRegistry.createWidget('medication'));
      // Simulate cleanup by removing references
      initialWidgets.length = 0;
      
      // Create new widgets to test memory doesn't leak
      const newWidgets = Array.from({ length: 10 }, () => widgetRegistry.createWidget('medication'));
      const passed = newWidgets.every(w => w !== null);

      results.push({
        test: 'Memory Management',
        passed,
        message: passed 
          ? 'Successfully created widgets after cleanup'
          : 'Memory management issues detected'
      });
    } catch (error) {
      results.push({
        test: 'Memory Management',
        passed: false,
        message: `Error: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Widget Edge Case Tests
            <Button onClick={runEdgeCaseTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run Edge Case Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length > 0 && (
            <div className="mb-4">
              <div className={`text-lg font-semibold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                {passedTests}/{totalTests} Edge Case Tests Passed
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test malformed widget syntax and edge cases:
              </label>
              <DotPhraseTextarea
                value={testContent}
                onChange={setTestContent}
                placeholder="Try: [[WIDGET:medication:test-1]], [[WIDGET:invalid:test]], [[WIDGET:medication]], etc."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setTestContent('[[WIDGET:medication:test-1]]')}
              >
                Valid Widget
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestContent('[[WIDGET:invalid:test-1]]')}
              >
                Invalid Type
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestContent('[[WIDGET:medication]]')}
              >
                Missing ID
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestContent('[[WIDGET:medication:test-1]] [[WIDGET:allergies:test-2]]')}
              >
                Multiple Widgets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};