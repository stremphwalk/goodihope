import json
import boto3
import logging
from typing import Dict, List, Any
import uuid
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
textract = boto3.client('textract')
comprehend_medical = boto3.client('comprehendmedical')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Environment variables
PROCESSING_TABLE = 'arinote-document-processing'
RESULTS_QUEUE = 'arinote-document-processing-results'

def lambda_handler(event, context):
    """
    Lambda function to process medical documents using Textract and Comprehend Medical
    """
    try:
        # Parse S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f"Processing document: {bucket}/{key}")
            
            # Generate unique document ID
            document_id = str(uuid.uuid4())
            
            # Extract user ID from S3 key (assuming format: uploads/{user_id}/filename)
            user_id = key.split('/')[1] if len(key.split('/')) > 1 else 'unknown'
            
            # Update processing status
            update_processing_status(document_id, user_id, 'PROCESSING', {
                'bucket': bucket,
                'key': key,
                'started_at': datetime.utcnow().isoformat()
            })
            
            # Process document
            result = process_medical_document(bucket, key, document_id)
            
            # Update completion status
            update_processing_status(document_id, user_id, 'COMPLETED', {
                'bucket': bucket,
                'key': key,
                'completed_at': datetime.utcnow().isoformat(),
                'result': result
            })
            
            # Send result to SQS for application processing
            send_processing_result(document_id, user_id, result)
            
        return {
            'statusCode': 200,
            'body': json.dumps('Documents processed successfully')
        }
        
    except Exception as e:
        logger.error(f"Error processing documents: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def process_medical_document(bucket: str, key: str, document_id: str) -> Dict[str, Any]:
    """
    Process a medical document using Textract and Comprehend Medical
    """
    try:
        # Step 1: Extract text using Textract
        logger.info(f"Extracting text from {bucket}/{key}")
        
        textract_response = textract.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )
        
        # Extract text content
        extracted_text = ""
        for block in textract_response['Blocks']:
            if block['BlockType'] == 'LINE':
                extracted_text += block['Text'] + "\n"
        
        logger.info(f"Extracted {len(extracted_text)} characters of text")
        
        # Step 2: Analyze medical entities using Comprehend Medical
        medical_entities = analyze_medical_entities(extracted_text)
        
        # Step 3: Detect PHI (Personal Health Information)
        phi_entities = detect_phi(extracted_text)
        
        # Step 4: Infer medical codes
        medical_codes = infer_medical_codes(extracted_text)
        
        # Compile results
        result = {
            'document_id': document_id,
            'extracted_text': extracted_text,
            'medical_entities': medical_entities,
            'phi_entities': phi_entities,
            'medical_codes': medical_codes,
            'processing_timestamp': datetime.utcnow().isoformat()
        }
        
        # Store processed result in S3
        store_processed_result(bucket, key, document_id, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing medical document: {str(e)}")
        raise

def analyze_medical_entities(text: str) -> List[Dict[str, Any]]:
    """
    Analyze medical entities using Comprehend Medical
    """
    try:
        # Split text into chunks if too long (max 20,000 UTF-8 bytes)
        max_chunk_size = 15000  # Conservative limit
        chunks = [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
        
        all_entities = []
        
        for chunk in chunks:
            if not chunk.strip():
                continue
                
            response = comprehend_medical.detect_entities_v2(Text=chunk)
            
            for entity in response['Entities']:
                all_entities.append({
                    'text': entity['Text'],
                    'category': entity['Category'],
                    'type': entity['Type'],
                    'score': entity['Score'],
                    'begin_offset': entity['BeginOffset'],
                    'end_offset': entity['EndOffset'],
                    'attributes': entity.get('Attributes', [])
                })
        
        logger.info(f"Found {len(all_entities)} medical entities")
        return all_entities
        
    except Exception as e:
        logger.error(f"Error analyzing medical entities: {str(e)}")
        return []

def detect_phi(text: str) -> List[Dict[str, Any]]:
    """
    Detect PHI (Personal Health Information) using Comprehend Medical
    """
    try:
        max_chunk_size = 15000
        chunks = [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
        
        all_phi = []
        
        for chunk in chunks:
            if not chunk.strip():
                continue
                
            response = comprehend_medical.detect_phi(Text=chunk)
            
            for entity in response['Entities']:
                all_phi.append({
                    'text': entity['Text'],
                    'category': entity['Category'],
                    'type': entity['Type'],
                    'score': entity['Score'],
                    'begin_offset': entity['BeginOffset'],
                    'end_offset': entity['EndOffset']
                })
        
        logger.info(f"Found {len(all_phi)} PHI entities")
        return all_phi
        
    except Exception as e:
        logger.error(f"Error detecting PHI: {str(e)}")
        return []

def infer_medical_codes(text: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Infer medical codes (ICD-10-CM, RxNorm, SNOMED-CT) using Comprehend Medical
    """
    try:
        max_chunk_size = 15000
        chunks = [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
        
        all_codes = {
            'icd10cm': [],
            'rxnorm': [],
            'snomedct': []
        }
        
        for chunk in chunks:
            if not chunk.strip():
                continue
            
            # ICD-10-CM codes
            try:
                icd_response = comprehend_medical.infer_icd10_cm(Text=chunk)
                for entity in icd_response['Entities']:
                    all_codes['icd10cm'].append({
                        'text': entity['Text'],
                        'category': entity['Category'],
                        'type': entity['Type'],
                        'score': entity['Score'],
                        'icd10cm_concepts': entity.get('ICD10CMConcepts', [])
                    })
            except Exception as e:
                logger.warning(f"Error inferring ICD-10-CM codes: {str(e)}")
            
            # RxNorm codes
            try:
                rx_response = comprehend_medical.infer_rx_norm(Text=chunk)
                for entity in rx_response['Entities']:
                    all_codes['rxnorm'].append({
                        'text': entity['Text'],
                        'category': entity['Category'],
                        'type': entity['Type'],
                        'score': entity['Score'],
                        'rxnorm_concepts': entity.get('RxNormConcepts', [])
                    })
            except Exception as e:
                logger.warning(f"Error inferring RxNorm codes: {str(e)}")
            
            # SNOMED-CT codes
            try:
                snomed_response = comprehend_medical.infer_snomed_ct(Text=chunk)
                for entity in snomed_response['Entities']:
                    all_codes['snomedct'].append({
                        'text': entity['Text'],
                        'category': entity['Category'],
                        'type': entity['Type'],
                        'score': entity['Score'],
                        'snomed_concepts': entity.get('SNOMEDCTConcepts', [])
                    })
            except Exception as e:
                logger.warning(f"Error inferring SNOMED-CT codes: {str(e)}")
        
        logger.info(f"Inferred medical codes: ICD-10-CM: {len(all_codes['icd10cm'])}, RxNorm: {len(all_codes['rxnorm'])}, SNOMED-CT: {len(all_codes['snomedct'])}")
        return all_codes
        
    except Exception as e:
        logger.error(f"Error inferring medical codes: {str(e)}")
        return {'icd10cm': [], 'rxnorm': [], 'snomedct': []}

def update_processing_status(document_id: str, user_id: str, status: str, metadata: Dict[str, Any]):
    """
    Update document processing status in DynamoDB
    """
    try:
        table = dynamodb.Table(PROCESSING_TABLE)
        
        table.put_item(
            Item={
                'document_id': document_id,
                'user_id': user_id,
                'processing_status': status,
                'metadata': metadata,
                'updated_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Updated processing status for {document_id}: {status}")
        
    except Exception as e:
        logger.error(f"Error updating processing status: {str(e)}")

def store_processed_result(bucket: str, original_key: str, document_id: str, result: Dict[str, Any]):
    """
    Store processed result in S3
    """
    try:
        result_key = f"processed/{document_id}/result.json"
        
        s3.put_object(
            Bucket=bucket,
            Key=result_key,
            Body=json.dumps(result, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Stored processed result at {bucket}/{result_key}")
        
    except Exception as e:
        logger.error(f"Error storing processed result: {str(e)}")

def send_processing_result(document_id: str, user_id: str, result: Dict[str, Any]):
    """
    Send processing result to SQS queue for application consumption
    """
    try:
        # Get queue URL
        queue_response = sqs.get_queue_url(QueueName=RESULTS_QUEUE)
        queue_url = queue_response['QueueUrl']
        
        # Send message
        message = {
            'document_id': document_id,
            'user_id': user_id,
            'status': 'COMPLETED',
            'result_summary': {
                'entities_count': len(result.get('medical_entities', [])),
                'phi_count': len(result.get('phi_entities', [])),
                'codes_count': sum(len(codes) for codes in result.get('medical_codes', {}).values())
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )
        
        logger.info(f"Sent processing result to SQS for document {document_id}")
        
    except Exception as e:
        logger.error(f"Error sending processing result to SQS: {str(e)}")