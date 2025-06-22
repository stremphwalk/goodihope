// Mock AWS services for free local development
import { anthropic } from './anthropic';
import { generateWithGemini } from './gemini';

export const mockBedrock = {
  async invokeModel(params: any) {
    // Use existing Anthropic API during development
    const messages = JSON.parse(params.body).messages;
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      messages: messages
    });
    
    return {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: response.content[0].text }]
      }))
    };
  }
};

export const mockTextract = {
  async detectDocumentText(params: any) {
    // Mock response - in development, return placeholder
    return {
      Blocks: [
        {
          BlockType: 'LINE',
          Text: 'Mock extracted text from document'
        }
      ]
    };
  }
};

export const mockComprehendMedical = {
  async detectEntitiesV2(params: any) {
    return {
      Entities: [
        {
          Text: 'aspirin',
          Category: 'MEDICATION',
          Type: 'GENERIC_NAME',
          Score: 0.95,
          BeginOffset: 0,
          EndOffset: 7,
          Attributes: []
        }
      ]
    };
  },
  
  async detectPhi(params: any) {
    return { Entities: [] };
  },
  
  async inferICD10CM(params: any) {
    return { Entities: [] };
  },
  
  async inferRxNorm(params: any) {
    return { Entities: [] };
  }
};

export const mockS3 = {
  async putObject(params: any) {
    console.log('Mock S3 upload:', params.Key);
    return { ETag: 'mock-etag' };
  },
  
  async getObject(params: any) {
    return {
      Body: Buffer.from('Mock file content')
    };
  }
};

// Export the appropriate client based on environment
export const getAWSClients = () => {
  if (process.env.AWS_MOCK_MODE === 'true') {
    return {
      bedrock: mockBedrock,
      textract: mockTextract,
      comprehendMedical: mockComprehendMedical,
      s3: mockS3
    };
  }
  
  // Return real AWS clients for production
  const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
  const { TextractClient } = require('@aws-sdk/client-textract');
  const { ComprehendMedicalClient } = require('@aws-sdk/client-comprehendmedical');
  const { S3Client } = require('@aws-sdk/client-s3');
  
  return {
    bedrock: new BedrockRuntimeClient({ region: process.env.AWS_REGION }),
    textract: new TextractClient({ region: process.env.AWS_REGION }),
    comprehendMedical: new ComprehendMedicalClient({ region: process.env.AWS_REGION }),
    s3: new S3Client({ region: process.env.AWS_REGION })
  };
};