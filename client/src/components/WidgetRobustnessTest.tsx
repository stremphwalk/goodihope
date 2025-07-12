import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { widgetRegistry, parseWidgetSyntax } from '@/lib/widgetRegistry';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import '@/lib/registerWidgets';

interface RobustnessTestResult {
  category: string;
  tests: {
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
  }[];
}

export const WidgetRobustnessTest: React.FC = () => {
  const [testResults, setTestResults] = useState<RobustnessTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stressTestContent, setStressTestContent] = useState('');

  const runRobustnessTests = async () => {
    setIsRunning(true);
    const results: RobustnessTestResult[] = [];

    // Performance Tests
    const performanceTests = {
      category: 'Performance',
      tests: [] as any[]
    };

    // Test 1: Large number of widgets
    try {
      const startTime = performance.now();
      const widgets = Array.from({ length: 100 }, (_, i) => 
        widgetRegistry.createWidget('medication')
      );
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceTests.tests.push({
        name: 'Large Widget Creation (100 widgets)',
        passed: duration < 1000 && widgets.every(w => w !== null),
        message: `Created 100 widgets in ${duration.toFixed(2)}ms`,
        critical: true
      });
    } catch (error) {
      performanceTests.tests.push({
        name: 'Large Widget Creation',
        passed: false,
        message: `Error: ${error}`,
        critical: true
      });
    }

    // Test 2: Widget parsing performance
    try {
      const largeText = Array.from({ length: 50 }, (_, i) => 
        `[[WIDGET:medication:test-${i}]]`
      ).join(' ');
      
      const startTime = performance.now();
      const matches = parseWidgetSyntax(largeText);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceTests.tests.push({
        name: 'Widget Parsing Performance (50 widgets)',
        passed: duration < 100 && matches.length === 50,
        message: `Parsed 50 widgets in ${duration.toFixed(2)}ms`,
        critical: false
      });
    } catch (error) {
      performanceTests.tests.push({
        name: 'Widget Parsing Performance',
        passed: false,
        message: `Error: ${error}`,
        critical: false
      });
    }

    results.push(performanceTests);

    // Error Handling Tests
    const errorHandlingTests = {
      category: 'Error Handling',
      tests: [] as any[]
    };

    // Test 3: Malformed widget syntax
    const malformedSyntax = [
      '[[WIDGET:medication]]',
      '[[WIDGET::test]]',
      '[[WIDGET:medication:]]',
      '[[WIDGET]]',
      '[[WIDGET:medication:test:extra]]',
      '[[WIDGET:medication:test',
      'WIDGET:medication:test]]',
      '[[WIDGET:medication:test-1]] [[WIDGET:invalid:test-2]]'
    ];

    try {
      let errorHandlingPassed = true;
      let errorMessages = [];

      for (const syntax of malformedSyntax) {
        try {
          const matches = parseWidgetSyntax(syntax);
          // Should either return empty array or handle gracefully
          if (matches.some(m => !m.type || !m.id)) {
            errorHandlingPassed = false;
            errorMessages.push(`Invalid match found for: ${syntax}`);
          }
        } catch (error) {
          // Caught errors are acceptable for malformed syntax
        }
      }

      errorHandlingTests.tests.push({
        name: 'Malformed Syntax Handling',
        passed: errorHandlingPassed,
        message: errorHandlingPassed 
          ? 'All malformed syntax handled gracefully'
          : errorMessages.join('; '),
        critical: true
      });
    } catch (error) {
      errorHandlingTests.tests.push({
        name: 'Malformed Syntax Handling',
        passed: false,
        message: `Error: ${error}`,
        critical: true
      });
    }

    // Test 4: Invalid widget type handling
    try {
      const invalidWidget = widgetRegistry.createWidget('nonexistent-type');
      const textGeneration = widgetRegistry.generateText('nonexistent-type', {});
      
      errorHandlingTests.tests.push({
        name: 'Invalid Widget Type Handling',
        passed: invalidWidget === null && textGeneration.includes('not found'),
        message: 'Invalid widget types handled gracefully',
        critical: true
      });
    } catch (error) {
      errorHandlingTests.tests.push({
        name: 'Invalid Widget Type Handling',
        passed: false,
        message: `Error: ${error}`,
        critical: true
      });
    }

    results.push(errorHandlingTests);

    // Data Integrity Tests
    const dataIntegrityTests = {
      category: 'Data Integrity',
      tests: [] as any[]
    };

    // Test 5: Widget data mutation safety
    try {
      const widget = widgetRegistry.createWidget('medication');
      const originalData = JSON.parse(JSON.stringify(widget!.data));
      
      // Attempt to mutate data
      widget!.data.homeMedications = [{
        id: 'test-1',
        name: 'Test Med',
        dosage: '10mg',
        frequency: 'BID',
        isCustom: false,
        category: 'test',
        addedAt: Date.now(),
        isDiscontinued: false
      }];

      const dataChanged = JSON.stringify(widget!.data) !== JSON.stringify(originalData);
      
      dataIntegrityTests.tests.push({
        name: 'Widget Data Mutation',
        passed: dataChanged,
        message: 'Widget data can be updated as expected',
        critical: false
      });
    } catch (error) {
      dataIntegrityTests.tests.push({
        name: 'Widget Data Mutation',
        passed: false,
        message: `Error: ${error}`,
        critical: false
      });
    }

    // Test 6: Widget ID uniqueness
    try {
      const widgets = Array.from({ length: 1000 }, () => widgetRegistry.createWidget('medication'));
      const ids = widgets.map(w => w?.id).filter(Boolean);
      const uniqueIds = new Set(ids);
      
      dataIntegrityTests.tests.push({
        name: 'Widget ID Uniqueness (1000 widgets)',
        passed: ids.length === uniqueIds.size,
        message: `Generated ${uniqueIds.size} unique IDs out of ${ids.length}`,
        critical: true
      });
    } catch (error) {
      dataIntegrityTests.tests.push({
        name: 'Widget ID Uniqueness',
        passed: false,
        message: `Error: ${error}`,
        critical: true
      });
    }

    results.push(dataIntegrityTests);

    // Stress Tests
    const stressTests = {
      category: 'Stress Tests',
      tests: [] as any[]
    };

    // Test 7: Rapid widget creation and destruction
    try {
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const widget = widgetRegistry.createWidget('medication');
        if (widget) {
          // Simulate data updates
          widget.data.homeMedications.push({
            id: `stress-test-${i}`,
            name: `Stress Test Med ${i}`,
            dosage: '10mg',
            frequency: 'BID',
            isCustom: false,
            category: 'test',
            addedAt: Date.now(),
            isDiscontinued: false
          });
          
          // Generate text
          widgetRegistry.generateText('medication', widget.data);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      stressTests.tests.push({
        name: 'Rapid Widget Operations',
        passed: duration < 5000,
        message: `Completed ${iterations} operations in ${duration.toFixed(2)}ms`,
        critical: false
      });
    } catch (error) {
      stressTests.tests.push({
        name: 'Rapid Widget Operations',
        passed: false,
        message: `Error: ${error}`,
        critical: false
      });
    }

    // Test 8: Large text generation
    try {
      const largeData = {
        homeMedications: Array.from({ length: 100 }, (_, i) => ({
          id: `large-test-${i}`,
          name: `Medication ${i}`,
          dosage: `${i}mg`,
          frequency: 'BID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        })),
        hospitalMedications: Array.from({ length: 100 }, (_, i) => ({
          id: `large-hosp-${i}`,
          name: `Hospital Med ${i}`,
          dosage: `${i}mg`,
          frequency: 'TID',
          isCustom: false,
          category: 'test',
          addedAt: Date.now(),
          isDiscontinued: false
        }))
      };

      const startTime = performance.now();
      const text = widgetRegistry.generateText('medication', largeData);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      stressTests.tests.push({
        name: 'Large Text Generation (200 medications)',
        passed: duration < 1000 && text.length > 0,
        message: `Generated ${text.length} characters in ${duration.toFixed(2)}ms`,
        critical: false
      });
    } catch (error) {
      stressTests.tests.push({
        name: 'Large Text Generation',
        passed: false,
        message: `Error: ${error}`,
        critical: false
      });
    }

    results.push(stressTests);

    setTestResults(results);
    setIsRunning(false);
  };

  const generateStressTestContent = () => {
    const widgets = Array.from({ length: 20 }, (_, i) => 
      `[[WIDGET:medication:stress-${i}]]`
    ).join(' ');
    setStressTestContent(`Stress test with multiple widgets: ${widgets}`);
  };

  const totalTests = testResults.reduce((sum, category) => sum + category.tests.length, 0);
  const passedTests = testResults.reduce((sum, category) => 
    sum + category.tests.filter(t => t.passed).length, 0
  );
  const criticalFailures = testResults.reduce((sum, category) => 
    sum + category.tests.filter(t => !t.passed && t.critical).length, 0
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Widget Robustness Test Suite
            <Button onClick={runRobustnessTests} disabled={isRunning}>
              {isRunning ? 'Running Robustness Tests...' : 'Run Robustness Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={`p-4 rounded-lg border ${passedTests === totalTests ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="text-sm font-medium text-gray-700">Overall Status</div>
                  <div className={`text-lg font-bold ${passedTests === totalTests ? 'text-green-600' : 'text-yellow-600'}`}>
                    {passedTests}/{totalTests} Passed
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${criticalFailures === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-sm font-medium text-gray-700">Critical Failures</div>
                  <div className={`text-lg font-bold ${criticalFailures === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {criticalFailures}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-gray-700">Test Categories</div>
                  <div className="text-lg font-bold text-blue-600">
                    {testResults.length}
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(passedTests / totalTests) * 100}%` }}
                />
              </div>
            </div>
          )}

          {testResults.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{category.category}</h3>
              <div className="space-y-2">
                {category.tests.map((test, testIndex) => (
                  <div 
                    key={testIndex}
                    className={`p-3 rounded border ${
                      test.passed 
                        ? 'bg-green-50 border-green-200' 
                        : test.critical 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{test.name}</span>
                      <div className="flex items-center gap-2">
                        {test.critical && !test.passed && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            CRITICAL
                          </span>
                        )}
                        <span className={`text-sm ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {test.passed ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{test.message}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Stress Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Stress Test Content (multiple widgets):
            </label>
            <DotPhraseTextarea
              value={stressTestContent}
              onChange={setStressTestContent}
              placeholder="Generate stress test content or manually enter multiple widgets..."
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={generateStressTestContent}>
              Generate Stress Test (20 widgets)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setStressTestContent('')}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};