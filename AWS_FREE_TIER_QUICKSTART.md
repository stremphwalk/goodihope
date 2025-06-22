# 🆓 AWS Free Tier Quick Start - AriNote

## Prerequisites (5 minutes)

1. **AWS Account** - [Create free account](https://aws.amazon.com/free/)
2. **AWS CLI** - [Install guide](https://aws.amazon.com/cli/)
3. **Terraform** - [Download](https://terraform.io/downloads)
4. **Docker** - [Install](https://docker.com/get-started)

## Configure AWS CLI (2 minutes)
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key  
# Default region: us-east-1
# Default output format: json
```

## Deploy to AWS Free Tier (10 minutes)
```bash
# Run the automated setup
./aws-free-tier-setup.sh

# Enter your email for alerts
# Enter a secure database password
# Wait for deployment...
```

## What Gets Deployed (FREE for 12 months)

### Infrastructure
- **RDS PostgreSQL** (db.t3.micro) - 750 hours/month FREE
- **ECS Fargate** (256 CPU, 512 MB) - 400 vCPU hours/month FREE  
- **ECR Repository** - 500 MB storage FREE
- **CloudWatch Logs** - 5 GB ingestion FREE
- **VPC & Networking** - Always FREE

### Estimated Monthly Cost
- **Months 1-12**: $0 (Free Tier)
- **Month 13+**: ~$25-50/month

## Access Your App
After deployment completes:
```bash
# Get your app URL
aws ecs list-tasks --cluster arinote-cluster --service arinote-service
# Your app will be at: http://[PUBLIC-IP]:5000
```

## Monitor Usage
```bash
# Check free tier usage
aws support describe-trusted-advisor-checks --language en
```

## Next Steps
1. Test your app on AWS
2. Add custom domain (optional)
3. Enable HTTPS with ACM (free)
4. Scale up when ready to pay

## Troubleshooting
```bash
# Check ECS service status
aws ecs describe-services --cluster arinote-cluster --services arinote-service

# View logs
aws logs tail /ecs/arinote --follow
```

**Total setup time: ~15 minutes**
**Cost: $0 for first 12 months** 🎉