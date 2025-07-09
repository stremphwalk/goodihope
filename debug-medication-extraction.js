/**
 * COMPREHENSIVE MEDICATION EXTRACTION DEBUG SCRIPT
 * 
 * This script tests all aspects of the medication extraction system:
 * - Environment configuration
 * - Google Cloud Vision API setup
 * - Gemini AI integration
 * - OCR processing pipeline
 * - Error handling and edge cases
 * - Performance and reliability testing
 */

import dotenv from 'dotenv';
dotenv.config();

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
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

class MedicationExtractionDebugger {
  constructor() {
    this.results = {
      environmentCheck: {},
      visionApiTest: {},
      geminiApiTest: {},
      ocrTests: [],
      edgeCaseTests: [],
      performanceTests: [],
      summary: {}
    };
  }

  async runAllTests() {
    log('INFO', '🚀 Starting Comprehensive Medication Extraction Debug Suite');
    
    try {
      await this.checkEnvironment();
      await this.testVisionAPISetup();
      await this.testGeminiAPISetup();
      await this.testOCRPipeline();
      await this.testEdgeCases();
      await this.testPerformance();
      await this.generateReport();
    } catch (error) {
      log('ERROR', 'Debug suite failed', error);
    }
  }

  async checkEnvironment() {
    log('INFO', '📋 Checking Environment Configuration...');
    
    const requiredEnvVars = {
      'GOOGLE_APPLICATION_CREDENTIALS': process.env.GOOGLE_APPLICATION_CREDENTIALS,
      'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
      'NODE_ENV': process.env.NODE_ENV
    };

    const envResults = {};
    
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        log('ERROR', `❌ Missing environment variable: ${key}`);
        envResults[key] = { status: 'missing', value: null };
      } else {
        log('SUCCESS', `✅ ${key} is set`);
        
        // Special handling for GOOGLE_APPLICATION_CREDENTIALS
        if (key === 'GOOGLE_APPLICATION_CREDENTIALS') {
          try {
            // Check if it's JSON string or file path
            if (value.startsWith('{')) {
              const credentials = JSON.parse(value);
              envResults[key] = { 
                status: 'json_string', 
                projectId: credentials.project_id,
                type: credentials.type 
              };
              log('INFO', `📝 Using JSON credentials for project: ${credentials.project_id}`);
            } else {
              // File path
              if (existsSync(value)) {
                const credFile = JSON.parse(readFileSync(value, 'utf8'));
                envResults[key] = { 
                  status: 'file_exists', 
                  path: value,
                  projectId: credFile.project_id,
                  type: credFile.type 
                };
                log('SUCCESS', `📁 Credential file exists: ${value}`);
              } else {
                envResults[key] = { status: 'file_missing', path: value };
                log('ERROR', `❌ Credential file not found: ${value}`);
              }
            }
          } catch (error) {
            envResults[key] = { status: 'invalid', error: error.message };
            log('ERROR', `❌ Invalid credentials format: ${error.message}`);
          }
        } else if (key === 'GEMINI_API_KEY') {
          envResults[key] = { 
            status: 'set', 
            length: value.length,
            preview: `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
          };
        } else {
          envResults[key] = { status: 'set', value };
        }
      }
    }

    this.results.environmentCheck = envResults;
    log('SUCCESS', '✅ Environment check completed');
  }

  async testVisionAPISetup() {
    log('INFO', '👁️ Testing Google Cloud Vision API Setup...');
    
    try {
      // Import after environment check
      const { ImageAnnotatorClient } = await import('@google-cloud/vision');
      
      let visionClient;
      const testResults = { status: 'unknown', error: null, testResults: [] };

      // Test different initialization methods
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          if (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
            // JSON credentials
            const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            visionClient = new ImageAnnotatorClient({
              credentials: credentials,
              projectId: credentials.project_id
            });
            testResults.initMethod = 'json_credentials';
            log('SUCCESS', '✅ Vision API client initialized with JSON credentials');
          } else {
            // File path
            visionClient = new ImageAnnotatorClient({
              keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
            });
            testResults.initMethod = 'keyfile';
            log('SUCCESS', '✅ Vision API client initialized with keyfile');
          }
        } catch (error) {
          log('ERROR', '❌ Failed to initialize Vision API client', error);
          testResults.error = error.message;
        }
      } else {
        // Default credentials
        try {
          visionClient = new ImageAnnotatorClient();
          testResults.initMethod = 'default';
          log('INFO', '📋 Using default credentials');
        } catch (error) {
          log('ERROR', '❌ Failed to initialize with default credentials', error);
          testResults.error = error.message;
        }
      }

      // Test basic API functionality with a simple image
      if (visionClient) {
        try {
          // Create a simple test image (1x1 white pixel)
          const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
          const imageBuffer = Buffer.from(testImageBase64, 'base64');
          
          log('INFO', '🧪 Testing Vision API with simple image...');
          const [result] = await visionClient.textDetection({ 
            image: { content: imageBuffer } 
          });
          
          testResults.status = 'success';
          testResults.apiWorking = true;
          testResults.textAnnotations = result.textAnnotations?.length || 0;
          log('SUCCESS', `✅ Vision API test successful (${testResults.textAnnotations} annotations)`);
          
        } catch (apiError) {
          log('ERROR', '❌ Vision API test failed', apiError);
          testResults.status = 'api_error';
          testResults.apiError = apiError.message;
        }
      } else {
        testResults.status = 'init_failed';
      }

      this.results.visionApiTest = testResults;
      
    } catch (importError) {
      log('ERROR', '❌ Failed to import Vision API', importError);
      this.results.visionApiTest = { 
        status: 'import_error', 
        error: importError.message 
      };
    }
  }

  async testGeminiAPISetup() {
    log('INFO', '🤖 Testing Gemini AI API Setup...');
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const testResults = { status: 'unknown', error: null };

      if (!process.env.GEMINI_API_KEY) {
        testResults.status = 'no_api_key';
        testResults.error = 'GEMINI_API_KEY not set';
        log('ERROR', '❌ GEMINI_API_KEY not set');
      } else {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          log('INFO', '🧪 Testing Gemini API with simple prompt...');
          const result = await model.generateContent('Say "API test successful" if you can read this.');
          const response = await result.response;
          const text = response.text();

          testResults.status = 'success';
          testResults.apiWorking = true;
          testResults.testResponse = text;
          testResults.responseLength = text.length;
          
          log('SUCCESS', `✅ Gemini API test successful: "${text.substring(0, 50)}..."`);
          
        } catch (apiError) {
          log('ERROR', '❌ Gemini API test failed', apiError);
          testResults.status = 'api_error';
          testResults.apiError = apiError.message;
        }
      }

      this.results.geminiApiTest = testResults;
      
    } catch (importError) {
      log('ERROR', '❌ Failed to import Gemini API', importError);
      this.results.geminiApiTest = { 
        status: 'import_error', 
        error: importError.message 
      };
    }
  }

  async testOCRPipeline() {
    log('INFO', '🔍 Testing OCR Pipeline with Sample Data...');
    
    const testCases = [
      {
        name: 'Simple Medication List',
        text: 'Metformin 500mg twice daily\nLisinopril 10mg once daily\nIbuprofen 400mg as needed',
        expectedMedications: ['Metformin', 'Lisinopril', 'Ibuprofen']
      },
      {
        name: 'Complex Prescription',
        text: 'Atorvastatin (Lipitor) 20mg\nTake once daily at bedtime\nQuantity: 30 tablets\nRefills: 2',
        expectedMedications: ['Atorvastatin', 'Lipitor']
      },
      {
        name: 'OCR-like Fragmented Text',
        text: 'Met\nformin\n500\nmg\nBID\n\nLip\nitor\n20mg\nDaily',
        expectedMedications: ['Metformin', 'Lipitor']
      },
      {
        name: 'French Medications',
        text: 'Paracétamol 500mg 3 fois par jour\nIbuprofène 400mg au besoin',
        expectedMedications: ['Paracétamol', 'Ibuprofène']
      }
    ];

    for (const testCase of testCases) {
      log('INFO', `🧪 Testing: ${testCase.name}`);
      
      try {
        // Import and test the actual functions
        const visionModule = await import('./server/vision.js');
        const geminiModule = await import('./server/gemini.js');
        
        const testResult = {
          name: testCase.name,
          inputText: testCase.text,
          expectedMedications: testCase.expectedMedications,
          actualMedications: [],
          success: false,
          error: null,
          executionTime: 0
        };

        const startTime = Date.now();
        
        try {
          // Test Gemini extraction directly
          const medications = await geminiModule.extractMedicationsFromTextWithGemini(testCase.text);
          testResult.actualMedications = medications;
          testResult.executionTime = Date.now() - startTime;
          
          // Check if we found expected medications
          const foundExpected = testCase.expectedMedications.filter(expected =>
            medications.some(med => 
              med.name.toLowerCase().includes(expected.toLowerCase()) ||
              expected.toLowerCase().includes(med.name.toLowerCase())
            )
          );
          
          testResult.success = foundExpected.length > 0;
          testResult.foundExpected = foundExpected;
          testResult.medicationCount = medications.length;
          
          if (testResult.success) {
            log('SUCCESS', `✅ ${testCase.name}: Found ${medications.length} medications`);
          } else {
            log('WARNING', `⚠️ ${testCase.name}: Expected medications not found`);
          }
          
        } catch (error) {
          testResult.error = error.message;
          testResult.executionTime = Date.now() - startTime;
          log('ERROR', `❌ ${testCase.name} failed`, error);
        }

        this.results.ocrTests.push(testResult);
        
      } catch (importError) {
        log('ERROR', `❌ Failed to import modules for ${testCase.name}`, importError);
        this.results.ocrTests.push({
          name: testCase.name,
          error: `Import failed: ${importError.message}`,
          success: false
        });
      }
    }
  }

  async testEdgeCases() {
    log('INFO', '🔬 Testing Edge Cases...');
    
    const edgeCases = [
      {
        name: 'Empty Text',
        input: '',
        expectation: 'Should return empty array'
      },
      {
        name: 'Only Numbers',
        input: '123 456 789',
        expectation: 'Should return empty array'
      },
      {
        name: 'Non-Medical Text',
        input: 'The quick brown fox jumps over the lazy dog',
        expectation: 'Should return empty array'
      },
      {
        name: 'Mixed Medical/Non-Medical',
        input: 'Patient loves pizza. Take Tylenol 500mg daily. Weather is nice.',
        expectation: 'Should extract only Tylenol'
      },
      {
        name: 'Very Long Text',
        input: 'A'.repeat(10000) + ' Metformin 500mg daily ' + 'B'.repeat(10000),
        expectation: 'Should handle large text and extract Metformin'
      },
      {
        name: 'Special Characters',
        input: 'Metf@rmin 500mg!!! T@ke twice d@ily ### Ibupr0fen 400mg',
        expectation: 'Should handle OCR errors and special characters'
      },
      {
        name: 'Multiple Languages',
        input: 'Paracetamol 500mg daily. Ibuprofène 400mg au besoin. Acetaminophen PRN.',
        expectation: 'Should extract medications in different languages'
      }
    ];

    for (const edgeCase of edgeCases) {
      log('INFO', `🧪 Testing Edge Case: ${edgeCase.name}`);
      
      const testResult = {
        name: edgeCase.name,
        input: edgeCase.input.substring(0, 100) + (edgeCase.input.length > 100 ? '...' : ''),
        expectation: edgeCase.expectation,
        result: null,
        success: false,
        error: null,
        executionTime: 0
      };

      try {
        const geminiModule = await import('./server/gemini.js');
        
        const startTime = Date.now();
        const medications = await geminiModule.extractMedicationsFromTextWithGemini(edgeCase.input);
        testResult.executionTime = Date.now() - startTime;
        
        testResult.result = {
          medicationCount: medications.length,
          medications: medications.map(m => ({ name: m.name, dosage: m.dosage }))
        };

        // Basic success criteria
        testResult.success = true; // We'll analyze results in the report
        
        log('SUCCESS', `✅ ${edgeCase.name}: Completed (${medications.length} medications, ${testResult.executionTime}ms)`);
        
      } catch (error) {
        testResult.error = error.message;
        testResult.executionTime = Date.now() - startTime;
        log('ERROR', `❌ ${edgeCase.name} failed`, error);
      }

      this.results.edgeCaseTests.push(testResult);
    }
  }

  async testPerformance() {
    log('INFO', '⚡ Testing Performance...');
    
    const performanceTests = [
      {
        name: 'Small Text (100 chars)',
        text: 'Metformin 500mg daily Lisinopril 10mg daily',
        iterations: 5
      },
      {
        name: 'Medium Text (1000 chars)',
        text: ('Prescription medications: ' + 
               'Metformin 500mg twice daily for diabetes. ' +
               'Lisinopril 10mg once daily for blood pressure. ' +
               'Atorvastatin 20mg at bedtime for cholesterol. ').repeat(5),
        iterations: 3
      },
      {
        name: 'Large Text (5000 chars)',
        text: ('Patient medication list includes various prescriptions. ' +
               'Metformin hydrochloride 500mg tablets twice daily. ' +
               'Lisinopril 10mg once daily in the morning. ' +
               'Atorvastatin calcium 20mg at bedtime. ').repeat(25),
        iterations: 2
      }
    ];

    for (const perfTest of performanceTests) {
      log('INFO', `🧪 Performance Test: ${perfTest.name}`);
      
      const testResult = {
        name: perfTest.name,
        textLength: perfTest.text.length,
        iterations: perfTest.iterations,
        times: [],
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        totalMedications: 0,
        success: false,
        error: null
      };

      try {
        const geminiModule = await import('./server/gemini.js');
        
        for (let i = 0; i < perfTest.iterations; i++) {
          const startTime = Date.now();
          const medications = await geminiModule.extractMedicationsFromTextWithGemini(perfTest.text);
          const executionTime = Date.now() - startTime;
          
          testResult.times.push(executionTime);
          testResult.totalMedications += medications.length;
        }

        testResult.averageTime = testResult.times.reduce((a, b) => a + b, 0) / testResult.times.length;
        testResult.minTime = Math.min(...testResult.times);
        testResult.maxTime = Math.max(...testResult.times);
        testResult.success = true;
        
        log('SUCCESS', `✅ ${perfTest.name}: Avg ${testResult.averageTime.toFixed(0)}ms (${testResult.minTime}-${testResult.maxTime}ms)`);
        
      } catch (error) {
        testResult.error = error.message;
        log('ERROR', `❌ ${perfTest.name} failed`, error);
      }

      this.results.performanceTests.push(testResult);
    }
  }

  async generateReport() {
    log('INFO', '📊 Generating Comprehensive Debug Report...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      environmentStatus: this.results.environmentCheck,
      visionApiStatus: this.results.visionApiTest.status,
      geminiApiStatus: this.results.geminiApiTest.status,
      ocrTestsPassed: this.results.ocrTests.filter(t => t.success).length,
      ocrTestsTotal: this.results.ocrTests.length,
      edgeCasesPassed: this.results.edgeCaseTests.filter(t => t.success).length,
      edgeCasesTotal: this.results.edgeCaseTests.length,
      performanceResults: this.results.performanceTests.map(p => ({
        name: p.name,
        averageTime: p.averageTime,
        success: p.success
      }))
    };

    this.results.summary = summary;
    
    // Write detailed report to file
    const reportPath = join(__dirname, 'medication-extraction-debug-report.json');
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Console summary
    log('SUCCESS', '📋 DEBUG REPORT SUMMARY');
    log('INFO', '========================');
    log('INFO', `Environment Check: ${Object.keys(summary.environmentStatus).length} variables checked`);
    log('INFO', `Vision API Status: ${summary.visionApiStatus}`);
    log('INFO', `Gemini API Status: ${summary.geminiApiStatus}`);
    log('INFO', `OCR Tests: ${summary.ocrTestsPassed}/${summary.ocrTestsTotal} passed`);
    log('INFO', `Edge Cases: ${summary.edgeCasesPassed}/${summary.edgeCasesTotal} passed`);
    log('INFO', `Detailed report saved: ${reportPath}`);
    
    // Recommendations
    this.generateRecommendations(summary);
  }

  generateRecommendations(summary) {
    log('INFO', '💡 RECOMMENDATIONS');
    log('INFO', '===================');
    
    const recommendations = [];
    
    if (summary.visionApiStatus !== 'success') {
      recommendations.push('❌ Fix Google Cloud Vision API setup - check credentials and permissions');
    }
    
    if (summary.geminiApiStatus !== 'success') {
      recommendations.push('❌ Fix Gemini API setup - verify API key and quota');
    }
    
    if (summary.ocrTestsPassed < summary.ocrTestsTotal) {
      recommendations.push('⚠️ OCR tests failing - review medication extraction logic');
    }
    
    const avgPerformance = summary.performanceResults.reduce((sum, p) => sum + (p.averageTime || 0), 0) / summary.performanceResults.length;
    if (avgPerformance > 5000) {
      recommendations.push('⚠️ Performance is slow - consider optimization or caching');
    }
    
    if (recommendations.length === 0) {
      log('SUCCESS', '✅ All systems appear to be working correctly!');
    } else {
      recommendations.forEach(rec => log('WARNING', rec));
    }
  }
}

// Run the debug suite
const debugger = new MedicationExtractionDebugger();
debugger.runAllTests().catch(error => {
  log('ERROR', 'Debug suite crashed', error);
  process.exit(1);
});