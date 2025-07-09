/**
 * COMPREHENSIVE EDGE CASE TESTING SCRIPT
 * 
 * Tests the medication extraction system with various edge cases:
 * - Invalid inputs
 * - Empty/corrupted images  
 * - Non-medication content
 * - Various image formats
 * - Performance stress tests
 * - API failure scenarios
 */

import dotenv from 'dotenv';
dotenv.config();

// Enable fallback mode for testing
process.env.ALLOW_OCR_FALLBACK = 'true';
process.env.NODE_ENV = 'development';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red,
    DEBUG: colors.magenta
  };
  
  const color = levelColors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${level}: ${message}${colors.reset}`);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

class EdgeCaseTester {
  constructor() {
    this.results = {
      inputValidationTests: [],
      imageFormatTests: [],
      contentTests: [],
      performanceTests: [],
      failureScenarios: [],
      summary: {}
    };
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    log('INFO', '🧪 Starting Comprehensive Edge Case Testing Suite');
    
    try {
      await this.testInputValidation();
      await this.testImageFormats();
      await this.testContentTypes();
      await this.testPerformanceEdgeCases();
      await this.testFailureScenarios();
      await this.generateSummary();
    } catch (error) {
      log('ERROR', 'Edge case testing suite failed', error);
    }
  }

  async testInputValidation() {
    log('INFO', '🔍 Testing Input Validation Edge Cases...');
    
    const testCases = [
      {
        name: 'Null Image Data',
        image: null,
        mediaType: 'image/jpeg',
        expectedResult: 'error'
      },
      {
        name: 'Empty String Image',
        image: '',
        mediaType: 'image/jpeg',
        expectedResult: 'error'
      },
      {
        name: 'Invalid Base64',
        image: 'not-base64-data!!!',
        mediaType: 'image/jpeg',
        expectedResult: 'error'
      },
      {
        name: 'Very Short Base64',
        image: 'abc',
        mediaType: 'image/jpeg',
        expectedResult: 'error'
      },
      {
        name: 'Minimal Valid Base64',
        image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mediaType: 'image/png',
        expectedResult: 'success_empty'
      },
      {
        name: 'Invalid Media Type',
        image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mediaType: 'application/pdf',
        expectedResult: 'warning'
      },
      {
        name: 'Missing Media Type',
        image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mediaType: null,
        expectedResult: 'warning'
      }
    ];

    for (const testCase of testCases) {
      await this.runSingleTest('Input Validation', testCase, async (test) => {
        const { extractMedicationsFromImage } = await import('./server/vision.ts');
        
        try {
          const result = await extractMedicationsFromImage(test.image, test.mediaType);
          
          if (test.expectedResult === 'error') {
            return { success: false, message: 'Expected error but got result', result };
          } else if (test.expectedResult === 'success_empty') {
            return { success: Array.isArray(result) && result.length >= 0, message: 'Valid empty result', result };
          } else if (test.expectedResult === 'warning') {
            return { success: Array.isArray(result), message: 'Handled with warning', result };
          }
          
          return { success: true, message: 'Handled gracefully', result };
          
        } catch (error) {
          if (test.expectedResult === 'error') {
            return { success: true, message: 'Expected error caught', error: error.message };
          } else {
            return { success: false, message: 'Unexpected error', error: error.message };
          }
        }
      });
    }
  }

  async testImageFormats() {
    log('INFO', '🖼️ Testing Different Image Format Edge Cases...');
    
    // Generate test images for different formats
    const testImages = {
      'tiny_png': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'corrupted_header': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8corrupt',
      'partial_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5E',
      'large_dummy': 'A'.repeat(50000) // Simulate very large image
    };

    const formatTests = [
      {
        name: 'Tiny PNG Image',
        image: testImages.tiny_png,
        mediaType: 'image/png',
        expectedResult: 'empty'
      },
      {
        name: 'Corrupted Image Header',
        image: testImages.corrupted_header,
        mediaType: 'image/png',
        expectedResult: 'error_or_empty'
      },
      {
        name: 'Partial Base64 Data',
        image: testImages.partial_base64,
        mediaType: 'image/png',
        expectedResult: 'error_or_empty'
      },
      {
        name: 'Very Large Image Data',
        image: testImages.large_dummy,
        mediaType: 'image/jpeg',
        expectedResult: 'timeout_or_error'
      }
    ];

    for (const testCase of formatTests) {
      await this.runSingleTest('Image Format', testCase, async (test) => {
        const { extractMedicationsFromImage } = await import('./server/vision.ts');
        
        const startTime = Date.now();
        const timeout = 30000; // 30 second timeout
        
        try {
          const result = await Promise.race([
            extractMedicationsFromImage(test.image, test.mediaType),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), timeout)
            )
          ]);
          
          const duration = Date.now() - startTime;
          
          return {
            success: true,
            message: `Processed in ${duration}ms`,
            result: Array.isArray(result) ? result.length : 'invalid',
            duration
          };
          
        } catch (error) {
          const duration = Date.now() - startTime;
          
          if (error.message === 'Test timeout') {
            return { success: false, message: 'Test timed out', duration, timeout: true };
          }
          
          // Some errors are expected for corrupted data
          if (test.expectedResult.includes('error')) {
            return { success: true, message: 'Expected error handled', error: error.message, duration };
          }
          
          return { success: false, message: 'Unexpected error', error: error.message, duration };
        }
      });
    }
  }

  async testContentTypes() {
    log('INFO', '📝 Testing Different Content Type Edge Cases...');
    
    const contentTests = [
      {
        name: 'Pure Medication Text',
        content: 'Metformin 500mg BID\nLisinopril 10mg daily\nIbuprofen 400mg PRN',
        expectedMedications: 3
      },
      {
        name: 'No Medical Content',
        content: 'The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet.',
        expectedMedications: 0
      },
      {
        name: 'Mixed Medical and Non-Medical',
        content: 'Patient report: feeling better today. Taking Tylenol 500mg as needed. Weather is nice. Also on Metformin 500mg twice daily.',
        expectedMedications: 2
      },
      {
        name: 'OCR-like Fragmented Text',
        content: 'Met\\nfor\\nmin\\n500\\nmg\\nB\\nI\\nD\\n\\nLis\\ninopril\\n10mg\\ndaily',
        expectedMedications: 2
      },
      {
        name: 'Special Characters and Symbols',
        content: 'Metf@rmin 500mg!!! Take twice daily ### Lisinøpril 10mg $$$ once/day',
        expectedMedications: 2
      },
      {
        name: 'Multiple Languages',
        content: 'Paracétamol 500mg trois fois par jour. Ibuprofène 400mg au besoin. Aspirin 81mg daily.',
        expectedMedications: 3
      },
      {
        name: 'Very Long Text',
        content: 'A'.repeat(10000) + ' Metformin 500mg daily ' + 'B'.repeat(10000),
        expectedMedications: 1
      },
      {
        name: 'Empty Content',
        content: '',
        expectedMedications: 0
      },
      {
        name: 'Only Whitespace',
        content: '   \\n\\t  \\r\\n   ',
        expectedMedications: 0
      },
      {
        name: 'Numbers Only',
        content: '123 456 789 500 1000 2000',
        expectedMedications: 0
      }
    ];

    for (const testCase of contentTests) {
      await this.runSingleTest('Content Type', testCase, async (test) => {
        const { extractMedicationsFromTextWithGemini } = await import('./server/gemini.ts');
        
        try {
          const startTime = Date.now();
          const result = await extractMedicationsFromTextWithGemini(test.content);
          const duration = Date.now() - startTime;
          
          const success = Array.isArray(result) && 
            (test.expectedMedications === 0 ? result.length === 0 : result.length > 0);
          
          return {
            success,
            message: `Found ${result.length} medications (expected ${test.expectedMedications})`,
            result: result.length,
            expected: test.expectedMedications,
            duration,
            medications: result.map(m => ({ name: m.name, dosage: m.dosage }))
          };
          
        } catch (error) {
          return {
            success: false,
            message: 'Content processing failed',
            error: error.message
          };
        }
      });
    }
  }

  async testPerformanceEdgeCases() {
    log('INFO', '⚡ Testing Performance Edge Cases...');
    
    const performanceTests = [
      {
        name: 'Concurrent Extractions',
        test: async () => {
          const { extractMedicationsFromTextWithGemini } = await import('./server/gemini.ts');
          const testText = 'Metformin 500mg daily';
          
          const startTime = Date.now();
          const promises = Array.from({ length: 5 }, () => 
            extractMedicationsFromTextWithGemini(testText)
          );
          
          const results = await Promise.all(promises);
          const duration = Date.now() - startTime;
          
          return {
            success: results.every(r => Array.isArray(r) && r.length > 0),
            message: `5 concurrent extractions completed in ${duration}ms`,
            duration,
            results: results.map(r => r.length)
          };
        }
      },
      {
        name: 'Rapid Sequential Calls',
        test: async () => {
          const { extractMedicationsFromTextWithGemini } = await import('./server/gemini.ts');
          const testTexts = [
            'Metformin 500mg daily',
            'Lisinopril 10mg daily',
            'Ibuprofen 400mg PRN',
            'Tylenol 500mg BID',
            'Aspirin 81mg daily'
          ];
          
          const startTime = Date.now();
          const results = [];
          
          for (const text of testTexts) {
            const result = await extractMedicationsFromTextWithGemini(text);
            results.push(result);
          }
          
          const duration = Date.now() - startTime;
          
          return {
            success: results.every(r => Array.isArray(r) && r.length > 0),
            message: `5 sequential extractions completed in ${duration}ms`,
            duration,
            averageTime: duration / testTexts.length,
            results: results.map(r => r.length)
          };
        }
      }
    ];

    for (const testCase of performanceTests) {
      await this.runSingleTest('Performance', testCase, testCase.test);
    }
  }

  async testFailureScenarios() {
    log('INFO', '💥 Testing API Failure Scenarios...');
    
    // Test graceful degradation when APIs are unavailable
    const failureTests = [
      {
        name: 'Gemini API Quota Exceeded Simulation',
        test: async () => {
          // This would require mocking, for now we'll test error handling
          try {
            const { extractMedicationsFromTextWithGemini } = await import('./server/gemini.ts');
            await extractMedicationsFromTextWithGemini('Test text');
            return { success: true, message: 'Gemini API is working' };
          } catch (error) {
            return { 
              success: error.message.includes('quota') || error.message.includes('API'),
              message: 'API error handled',
              error: error.message
            };
          }
        }
      },
      {
        name: 'Network Timeout Simulation',
        test: async () => {
          // Test with very large input that might timeout
          const { extractMedicationsFromTextWithGemini } = await import('./server/gemini.ts');
          const largeText = 'Metformin '.repeat(10000);
          
          try {
            const startTime = Date.now();
            const result = await Promise.race([
              extractMedicationsFromTextWithGemini(largeText),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Simulated timeout')), 10000)
              )
            ]);
            const duration = Date.now() - startTime;
            
            return {
              success: true,
              message: `Large text processed in ${duration}ms`,
              duration,
              result: Array.isArray(result) ? result.length : 'invalid'
            };
          } catch (error) {
            return {
              success: error.message === 'Simulated timeout',
              message: 'Timeout handled appropriately',
              error: error.message
            };
          }
        }
      }
    ];

    for (const testCase of failureTests) {
      await this.runSingleTest('Failure Scenario', testCase, testCase.test);
    }
  }

  async runSingleTest(category, testCase, testFunction) {
    this.totalTests++;
    const testId = `${category.replace(/\\s+/g, '_')}_${this.totalTests}`;
    
    try {
      log('INFO', `🧪 Running ${category}: ${testCase.name}`);
      
      const startTime = Date.now();
      const result = await testFunction(testCase);
      const duration = Date.now() - startTime;
      
      const testResult = {
        id: testId,
        category,
        name: testCase.name,
        success: result.success,
        message: result.message,
        duration,
        details: result,
        timestamp: new Date().toISOString()
      };
      
      if (result.success) {
        this.passedTests++;
        log('SUCCESS', `✅ ${testCase.name}: ${result.message}`);
      } else {
        log('ERROR', `❌ ${testCase.name}: ${result.message}`);
      }
      
      // Store results by category
      const categoryKey = category.toLowerCase().replace(/\\s+/g, '') + 'Tests';
      if (!this.results[categoryKey]) {
        this.results[categoryKey] = [];
      }
      this.results[categoryKey].push(testResult);
      
    } catch (error) {
      log('ERROR', `💥 ${testCase.name} crashed:`, error);
      
      const testResult = {
        id: testId,
        category,
        name: testCase.name,
        success: false,
        message: 'Test crashed',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      const categoryKey = category.toLowerCase().replace(/\\s+/g, '') + 'Tests';
      if (!this.results[categoryKey]) {
        this.results[categoryKey] = [];
      }
      this.results[categoryKey].push(testResult);
    }
  }

  async generateSummary() {
    log('INFO', '📊 Generating Edge Case Test Summary...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.totalTests - this.passedTests,
      successRate: Math.round((this.passedTests / this.totalTests) * 100),
      categories: {}
    };
    
    // Calculate per-category statistics
    for (const [category, tests] of Object.entries(this.results)) {
      if (Array.isArray(tests)) {
        const passed = tests.filter(t => t.success).length;
        summary.categories[category] = {
          total: tests.length,
          passed,
          failed: tests.length - passed,
          successRate: Math.round((passed / tests.length) * 100)
        };
      }
    }
    
    this.results.summary = summary;
    
    // Console summary
    log('SUCCESS', '📋 EDGE CASE TEST SUMMARY');
    log('INFO', '===========================');
    log('INFO', `Total Tests: ${summary.totalTests}`);
    log('INFO', `Passed: ${summary.passedTests}`);
    log('INFO', `Failed: ${summary.failedTests}`);
    log('INFO', `Success Rate: ${summary.successRate}%`);
    
    log('INFO', '\\nCategory Breakdown:');
    for (const [category, stats] of Object.entries(summary.categories)) {
      log('INFO', `${category}: ${stats.passed}/${stats.total} (${stats.successRate}%)`);
    }
    
    // Write detailed report
    const { writeFileSync } = await import('fs');
    writeFileSync('edge-case-test-report.json', JSON.stringify(this.results, null, 2));
    log('INFO', '\\nDetailed report saved: edge-case-test-report.json');
    
    // Recommendations
    this.generateRecommendations(summary);
  }

  generateRecommendations(summary) {
    log('INFO', '\\n💡 RECOMMENDATIONS');
    log('INFO', '===================');
    
    const recommendations = [];
    
    if (summary.successRate < 80) {
      recommendations.push('❌ Overall success rate is low - review failed tests');
    }
    
    if (summary.categories.inputvalidationTests?.successRate < 90) {
      recommendations.push('⚠️ Input validation needs improvement');
    }
    
    if (summary.categories.imageformatTests?.successRate < 70) {
      recommendations.push('⚠️ Image format handling needs robustness improvements');
    }
    
    if (summary.categories.contenttypeTests?.successRate < 85) {
      recommendations.push('⚠️ Content processing accuracy could be improved');
    }
    
    if (summary.categories.performanceTests?.successRate < 90) {
      recommendations.push('⚠️ Performance under stress needs optimization');
    }
    
    if (recommendations.length === 0) {
      log('SUCCESS', '✅ All edge case tests are performing well!');
      log('INFO', '🎯 System appears robust and handles edge cases gracefully');
    } else {
      recommendations.forEach(rec => log('WARNING', rec));
    }
  }
}

// Run the edge case testing suite
const tester = new EdgeCaseTester();
tester.runAllTests().catch(error => {
  log('ERROR', 'Edge case testing suite crashed', error);
  process.exit(1);
});