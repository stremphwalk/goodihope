import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { WidgetWrapper } from './WidgetWrapper';
import '@/lib/registerWidgets';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

export const WidgetTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testWidgets, setTestWidgets] = useState<Map<string, any>>(new Map());

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Widget Registry Available Types
    try {
      const availableTypes = widgetRegistry.getAvailableTypes();
      const expectedTypes = ['medication', 'allergies', 'pmh', 'impression'];
      const hasAllTypes = expectedTypes.every(type => availableTypes.includes(type));
      
      results.push({
        test: 'Widget Registry - Available Types',
        passed: hasAllTypes,
        message: hasAllTypes 
          ? `All expected types available: ${availableTypes.join(', ')}`
          : `Missing types. Expected: ${expectedTypes.join(', ')}, Got: ${availableTypes.join(', ')}`
      });
    } catch (error) {
      results.push({
        test: 'Widget Registry - Available Types',
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 2: Widget Creation
    const widgetTypes = ['medication', 'allergies', 'pmh', 'impression'];
    for (const type of widgetTypes) {
      try {
        const widget = widgetRegistry.createWidget(type);
        const passed = widget !== null && widget.type === type && widget.id.includes(type);
        
        results.push({
          test: `Widget Creation - ${type}`,
          passed,
          message: passed 
            ? `Successfully created ${type} widget with ID: ${widget?.id}`
            : `Failed to create ${type} widget`
        });

        if (widget) {
          setTestWidgets(prev => new Map(prev.set(widget.id, widget)));
        }
      } catch (error) {
        results.push({
          test: `Widget Creation - ${type}`,
          passed: false,
          message: `Error creating ${type} widget: ${error}`
        });
      }
    }

    // Test 3: Widget Configuration
    for (const type of widgetTypes) {
      try {
        const config = widgetRegistry.get(type)?.config;
        const passed = config !== undefined && config.label !== undefined;
        
        results.push({
          test: `Widget Configuration - ${type}`,
          passed,
          message: passed 
            ? `Config loaded: ${config?.label} - ${config?.description}`
            : `Missing configuration for ${type}`
        });
      } catch (error) {
        results.push({
          test: `Widget Configuration - ${type}`,
          passed: false,
          message: `Error loading config for ${type}: ${error}`
        });
      }
    }

    // Test 4: Widget Data Validation
    for (const type of widgetTypes) {
      try {
        const widget = widgetRegistry.createWidget(type);
        const passed = widget !== null && widgetRegistry.validateData(type, widget!.data);
        
        results.push({
          test: `Widget Data Validation - ${type}`,
          passed,
          message: passed 
            ? `Data validation passed for ${type}`
            : `Data validation failed for ${type}`
        });
      } catch (error) {
        results.push({
          test: `Widget Data Validation - ${type}`,
          passed: false,
          message: `Error validating ${type} data: ${error}`
        });
      }
    }

    // Test 5: Widget Text Generation
    for (const type of widgetTypes) {
      try {
        const widget = widgetRegistry.createWidget(type);
        const text = widgetRegistry.generateText(type, widget!.data);
        const passed = typeof text === 'string' && text.length > 0;
        
        results.push({
          test: `Widget Text Generation - ${type}`,
          passed,
          message: passed 
            ? `Generated text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
            : `Failed to generate text for ${type}`
        });
      } catch (error) {
        results.push({
          test: `Widget Text Generation - ${type}`,
          passed: false,
          message: `Error generating text for ${type}: ${error}`
        });
      }
    }

    // Test 6: Widget Syntax Parsing
    try {
      const { parseWidgetSyntax } = await import('@/lib/widgetRegistry');
      const testText = '[[WIDGET:medication:test-1]] and [[WIDGET:allergies:test-2]]';
      const matches = parseWidgetSyntax(testText);
      const passed = matches.length === 2 && 
                    matches[0].type === 'medication' && 
                    matches[1].type === 'allergies';
      
      results.push({
        test: 'Widget Syntax Parsing',
        passed,
        message: passed 
          ? `Parsed 2 widgets correctly`
          : `Failed to parse widget syntax. Got ${matches.length} matches`
      });
    } catch (error) {
      results.push({
        test: 'Widget Syntax Parsing',
        passed: false,
        message: `Error parsing widget syntax: ${error}`
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
            Widget Test Suite
            <Button onClick={runTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length > 0 && (
            <div className="mb-4">
              <div className={`text-lg font-semibold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                {passedTests}/{totalTests} Tests Passed
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

      {testWidgets.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Widget Instances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(testWidgets.entries()).map(([id, widget]) => (
                <WidgetWrapper
                  key={id}
                  widget={widget}
                  onDataChange={(data) => {
                    widget.data = data;
                    setTestWidgets(prev => new Map(prev.set(id, widget)));
                  }}
                  mode="interactive"
                  showControls={true}
                  className="border border-blue-200 bg-blue-50"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};