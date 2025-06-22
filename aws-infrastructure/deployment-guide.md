# AWS Deployment Guide for AriNote

## Overview
This guide walks you through deploying AriNote to AWS using the provided Terraform infrastructure and enhanced features.

## Prerequisites

### 1. AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Terraform installed (version >= 1.0)
- Docker installed for container builds

### 2. Required AWS Services Access
Ensure your AWS account has access to:
- Amazon ECS (Fargate)
- Amazon RDS (PostgreSQL)
- Amazon S3
- Amazon CloudFront
- Amazon Bedrock
- Amazon Textract
- Amazon Comprehend Medical
- AWS Secrets Manager
- Amazon CloudWatch

## Phase 1: Infrastructure Deployment

### Step 1: Configure Variables
Create a `terraform.tfvars` file:

```hcl
aws_region = "us-east-1"
environment = "production"
db_password = "your-secure-database-password"
alert_email = "your-email@domain.com"
domain_name = "your-domain.com"  # Optional
```

### Step 2: Initialize and Deploy Infrastructure
```bash
cd aws-infrastructure
terraform init
terraform plan
terraform apply
```

### Step 3: Store API Keys in Secrets Manager
```bash
# Store Anthropic API Key
aws secretsmanager put-secret-value \
  --secret-id arinote/anthropic-api-key \
  --secret-string "your-anthropic-api-key"

# Store Gemini API Key
aws secretsmanager put-secret-value \
  --secret-id arinote/gemini-api-key \
  --secret-string "your-gemini-api-key"
```

## Phase 2: Application Deployment

### Step 1: Build and Push Docker Image
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t arinote .

# Tag image
docker tag arinote:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/arinote:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/arinote:latest
```

### Step 2: Update Database Schema
```bash
# Connect to RDS instance and run migrations
npm run db:push
```

### Step 3: Deploy ECS Service
The ECS service will automatically pull the latest image and deploy your application.

## Phase 3: Enhanced Features Setup

### 1. Amazon Bedrock Integration

#### Enable Bedrock Models
```bash
# Request access to Claude models in AWS Console
# Navigate to Amazon Bedrock > Model access
# Request access to:
# - Claude 3 Sonnet
# - Claude 3 Haiku
# - Titan Text Express
```

#### Update Application Code
Add Bedrock integration to your server:

```typescript
// server/bedrock.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export async function generateMedicalNote(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    }),
    contentType: "application/json",
    accept: "application/json"
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
```

### 2. Document Processing with Textract & Comprehend Medical

#### Deploy Lambda Function
```bash
cd lambda-functions
zip -r document-processor.zip document-processor.py
aws lambda update-function-code \
  --function-name arinote-document-processor \
  --zip-file fileb://document-processor.zip
```

#### Add Document Upload Endpoint
```typescript
// server/routes.ts
app.post("/api/documents/upload", async (req, res) => {
  const { file, userId } = req.body;
  
  // Upload to S3 (triggers Lambda processing)
  const key = `uploads/${userId}/${Date.now()}-${file.name}`;
  await s3.putObject({
    Bucket: process.env.MEDICAL_DOCS_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
  
  res.json({ documentId: key, status: 'processing' });
});
```

### 3. Real-time Processing Updates

#### Add SQS Polling
```typescript
// server/sqs-processor.ts
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION });

export async function pollProcessingResults() {
  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.RESULTS_QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20
  });

  const response = await sqs.send(command);
  
  for (const message of response.Messages || []) {
    const result = JSON.parse(message.Body);
    
    // Process result and notify user
    await notifyUserOfProcessingComplete(result);
    
    // Delete message from queue
    await sqs.send(new DeleteMessageCommand({
      QueueUrl: process.env.RESULTS_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle
    }));
  }
}
```

## Phase 4: Advanced Features

### 1. AI-Powered Clinical Decision Support

#### Implement Clinical Guidelines API
```typescript
// server/clinical-decision-support.ts
export async function getClinicalRecommendations(patientData: any) {
  const prompt = `
    Based on the following patient data, provide clinical recommendations:
    ${JSON.stringify(patientData)}
    
    Consider:
    - Drug interactions
    - Contraindications
    - Best practice guidelines
    - Risk factors
  `;

  return await generateMedicalNote(prompt);
}
```

### 2. Medical Coding Assistance

#### Add ICD-10 and CPT Code Suggestions
```typescript
// server/medical-coding.ts
export async function suggestMedicalCodes(noteText: string) {
  // Use Comprehend Medical results from document processing
  const entities = await comprehendMedical.detectEntitiesV2({ Text: noteText });
  
  const icdCodes = await comprehendMedical.inferICD10CM({ Text: noteText });
  const rxNormCodes = await comprehendMedical.inferRxNorm({ Text: noteText });
  
  return {
    entities: entities.Entities,
    icdCodes: icdCodes.Entities,
    medications: rxNormCodes.Entities
  };
}
```

### 3. Voice-to-Text Integration

#### Add Amazon Transcribe Medical
```typescript
// server/transcribe.ts
import { TranscribeClient, StartMedicalTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

export async function transcribeMedicalAudio(audioS3Uri: string) {
  const client = new TranscribeClient({ region: process.env.AWS_REGION });
  
  const command = new StartMedicalTranscriptionJobCommand({
    MedicalTranscriptionJobName: `medical-${Date.now()}`,
    LanguageCode: "en-US",
    MediaFormat: "mp3",
    Media: { MediaFileUri: audioS3Uri },
    OutputBucketName: process.env.TRANSCRIPTION_BUCKET,
    Specialty: "PRIMARYCARE",
    Type: "CONVERSATION"
  });

  return await client.send(command);
}
```

## Phase 5: Security & Compliance

### 1. HIPAA Compliance Setup

#### Enable CloudTrail
```bash
aws cloudtrail create-trail \
  --name arinote-audit-trail \
  --s3-bucket-name arinote-audit-logs \
  --include-global-service-events \
  --is-multi-region-trail
```

#### Configure VPC Flow Logs
```hcl
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

### 2. Data Encryption

#### Enable S3 Bucket Encryption
All medical documents are automatically encrypted using KMS keys as configured in the Terraform files.

#### Database Encryption
RDS encryption at rest is enabled by default in the configuration.

## Phase 6: Monitoring & Optimization

### 1. Performance Monitoring

#### Custom CloudWatch Metrics
```typescript
// server/metrics.ts
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

export async function recordCustomMetric(metricName: string, value: number) {
  const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });
  
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: "AriNote/Application",
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: "Count",
      Timestamp: new Date()
    }]
  }));
}
```

### 2. Cost Optimization

#### Implement Auto-Scaling
The ECS service is configured with auto-scaling based on CPU utilization.

#### Use Spot Instances (Optional)
For non-critical workloads, consider using Spot instances to reduce costs.

## Deployment Checklist

- [ ] AWS account setup and permissions configured
- [ ] Terraform infrastructure deployed
- [ ] API keys stored in Secrets Manager
- [ ] Docker image built and pushed to ECR
- [ ] Database schema updated
- [ ] ECS service deployed and running
- [ ] Bedrock model access requested and approved
- [ ] Lambda functions deployed
- [ ] SQS processing implemented
- [ ] CloudWatch monitoring configured
- [ ] Security and compliance measures implemented
- [ ] Performance testing completed
- [ ] Backup and disaster recovery tested

## Cost Estimation

### Monthly AWS Costs (Approximate)
- **ECS Fargate**: $50-150 (2-4 tasks)
- **RDS PostgreSQL**: $25-75 (db.t3.micro to db.t3.small)
- **S3 Storage**: $10-30 (depending on document volume)
- **CloudFront**: $5-20 (depending on traffic)
- **Bedrock**: $20-100 (depending on usage)
- **Textract/Comprehend**: $10-50 (depending on document processing)
- **Other services**: $20-50

**Total estimated monthly cost: $140-475**

Use the [AWS Pricing Calculator](https://calculator.aws) for more precise estimates based on your expected usage.

## Support and Troubleshooting

### Common Issues

1. **ECS Task Fails to Start**
   - Check CloudWatch logs for error messages
   - Verify Secrets Manager permissions
   - Ensure Docker image is properly built

2. **Database Connection Issues**
   - Verify security group rules
   - Check database credentials in Secrets Manager
   - Ensure VPC configuration is correct

3. **Bedrock Access Denied**
   - Request model access in AWS Console
   - Verify IAM permissions for Bedrock

### Getting Help
- Check CloudWatch logs for detailed error messages
- Use AWS Support for infrastructure issues
- Review Terraform state for configuration problems

This deployment guide provides a comprehensive path to migrate your AriNote application to AWS with enhanced AI capabilities and enterprise-grade infrastructure.