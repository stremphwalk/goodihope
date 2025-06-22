#!/bin/bash
# AWS Free Tier Setup Script for AriNote

set -e

echo "🚀 Setting up AriNote on AWS Free Tier..."

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "AWS CLI required. Install: https://aws.amazon.com/cli/"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Terraform required. Install: https://terraform.io/downloads"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install: https://docker.com/get-started"; exit 1; }

# Get user inputs
read -p "Enter your email for alerts: " ALERT_EMAIL
read -s -p "Enter database password: " DB_PASSWORD
echo

# Create terraform.tfvars
cat > aws-infrastructure/terraform.tfvars << EOF
aws_region = "us-east-1"
db_password = "$DB_PASSWORD"
alert_email = "$ALERT_EMAIL"
EOF

echo "✅ Created terraform.tfvars"

# Initialize and deploy infrastructure
cd aws-infrastructure
echo "🏗️ Initializing Terraform..."
terraform init

echo "📋 Planning deployment..."
terraform plan -var-file="terraform.tfvars" -out=tfplan

echo "🚀 Deploying to AWS Free Tier..."
terraform apply tfplan

# Get outputs
ECR_URL=$(terraform output -raw ecr_repository_url)
DB_ENDPOINT=$(terraform output -raw database_endpoint)

echo "✅ Infrastructure deployed!"
echo "📦 ECR Repository: $ECR_URL"
echo "🗄️ Database: $DB_ENDPOINT"

# Build and push Docker image
cd ..
echo "🐳 Building Docker image..."
docker build -f Dockerfile.aws -t arinote .

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# Tag and push
docker tag arinote:latest $ECR_URL:latest
echo "📤 Pushing to ECR..."
docker push $ECR_URL:latest

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service --cluster arinote-cluster --service arinote-service --force-new-deployment --region us-east-1

echo "🎉 Deployment complete!"
echo "⏳ Your app will be available in 2-3 minutes"
echo "💰 Running on AWS Free Tier - $0 cost for 12 months!"

# Get service URL
TASK_ARN=$(aws ecs list-tasks --cluster arinote-cluster --service arinote-service --query 'taskArns[0]' --output text --region us-east-1)
if [ "$TASK_ARN" != "None" ]; then
    PUBLIC_IP=$(aws ecs describe-tasks --cluster arinote-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region us-east-1 | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1)
    echo "🌐 Your app: http://$PUBLIC_IP:5000"
fi