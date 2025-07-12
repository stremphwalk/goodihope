import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetDemo } from './WidgetDemo';
import { WidgetTestSuite } from './WidgetTestSuite';
import { WidgetEdgeCaseTests } from './WidgetEdgeCaseTests';
import { WidgetIntegrationTest } from './WidgetIntegrationTest';

export const WidgetTestApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('demo');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Widget-Enhanced Dot Phrase System
            </CardTitle>
            <p className="text-center text-gray-600">
              Comprehensive testing and demonstration suite for the integrated template builder
            </p>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="tests">Unit Tests</TabsTrigger>
            <TabsTrigger value="edge-cases">Edge Cases</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Demo</CardTitle>
                <p className="text-sm text-gray-600">
                  Try the widget-enhanced dot phrase system with full functionality
                </p>
              </CardHeader>
              <CardContent>
                <WidgetDemo />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Unit Tests</CardTitle>
                <p className="text-sm text-gray-600">
                  Core functionality tests for widget registry, creation, and validation
                </p>
              </CardHeader>
              <CardContent>
                <WidgetTestSuite />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edge-cases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Edge Case Tests</CardTitle>
                <p className="text-sm text-gray-600">
                  Test error handling, malformed data, and boundary conditions
                </p>
              </CardHeader>
              <CardContent>
                <WidgetEdgeCaseTests />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Tests</CardTitle>
                <p className="text-sm text-gray-600">
                  End-to-end testing of widget system integration with existing components
                </p>
              </CardHeader>
              <CardContent>
                <WidgetIntegrationTest />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800">Widget Registry</div>
                <div className="text-lg font-bold text-green-600">✓ Active</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">Smart Function Builder</div>
                <div className="text-lg font-bold text-blue-600">✓ Enhanced</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-purple-800">DotPhraseTextarea</div>
                <div className="text-lg font-bold text-purple-600">✓ Widget Support</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm font-medium text-orange-800">Widget Types</div>
                <div className="text-lg font-bold text-orange-600">4 Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};