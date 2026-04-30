#!/bin/bash
# StrainSense Lambda Deployment Script
# Run after AWS credentials are configured:
#   export AWS_ACCESS_KEY_ID=...
#   export AWS_SECRET_ACCESS_KEY=...
#   export AWS_REGION=us-east-2
#
# Or configure via: aws configure --profile resonantlabs-engineering
#
# Prerequisites:
#   - AWS CLI installed: brew install awscli
#   - Credentials for IAM user 'resonantlabs-engineering' (not root)
#   - ANTHROPIC_API_KEY and OCR_SPACE_API_KEY available in environment
#
# Usage:
#   chmod +x deploy.sh
#   AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx ./deploy.sh

set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ROLE_NAME="strainsense-lambda-role"
OCR_FUNCTION_NAME="strainsense-ocr"
ANALYZE_FUNCTION_NAME="strainsense-analyze"
API_NAME="strainsense-api"

echo "=== StrainSense Lambda Deployment ==="
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# ── Step 1: Store API keys in SSM Parameter Store ────────────────────────────
echo "--- Storing API keys in SSM Parameter Store ---"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set. Run: source ~/.zshrc first."
  exit 1
fi

aws ssm put-parameter \
  --name "/strainsense/ANTHROPIC_API_KEY" \
  --value "$ANTHROPIC_API_KEY" \
  --type "SecureString" \
  --overwrite \
  --region "$REGION"
echo "✓ ANTHROPIC_API_KEY stored in SSM"

# OCR_SPACE_API_KEY is optional — falls back to free public key
if [ -n "${OCR_SPACE_API_KEY:-}" ]; then
  aws ssm put-parameter \
    --name "/strainsense/OCR_SPACE_API_KEY" \
    --value "$OCR_SPACE_API_KEY" \
    --type "SecureString" \
    --overwrite \
    --region "$REGION"
  echo "✓ OCR_SPACE_API_KEY stored in SSM"
else
  echo "⚠ OCR_SPACE_API_KEY not set — Lambda will use public test key (500 req/day limit)"
fi

# ── Step 2: Create IAM execution role for Lambda ─────────────────────────────
echo ""
echo "--- Creating Lambda execution role ---"

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

# Create role (ignore error if already exists)
aws iam create-role \
  --role-name "$LAMBDA_ROLE_NAME" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --region "$REGION" 2>/dev/null || echo "Role already exists, continuing..."

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Attach SSM read policy
aws iam put-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-name "SSMParameterRead" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ssm:GetParameter"],
      "Resource": "arn:aws:ssm:'"$REGION"':'"$ACCOUNT_ID"':parameter/strainsense/*"
    }]
  }'

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}"
echo "✓ Lambda role ready: $ROLE_ARN"

# Wait for role to propagate
echo "Waiting 10s for IAM role propagation..."
sleep 10

# ── Step 3: Package and deploy strainsense-ocr ───────────────────────────────
echo ""
echo "--- Packaging strainsense-ocr ---"
cd "$(dirname "$0")/strainsense-ocr"
npm install --omit=dev --quiet
zip -r ../strainsense-ocr.zip . -x "*.zip"
cd ..

echo "--- Deploying strainsense-ocr ---"
if aws lambda get-function --function-name "$OCR_FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
  aws lambda update-function-code \
    --function-name "$OCR_FUNCTION_NAME" \
    --zip-file "fileb://strainsense-ocr.zip" \
    --region "$REGION"
  echo "✓ strainsense-ocr updated"
else
  aws lambda create-function \
    --function-name "$OCR_FUNCTION_NAME" \
    --runtime "nodejs22.x" \
    --role "$ROLE_ARN" \
    --handler "index.handler" \
    --zip-file "fileb://strainsense-ocr.zip" \
    --timeout 30 \
    --memory-size 256 \
    --region "$REGION"
  echo "✓ strainsense-ocr created"
fi

# ── Step 4: Package and deploy strainsense-analyze ───────────────────────────
echo ""
echo "--- Packaging strainsense-analyze ---"
cd "$(dirname "$0")/strainsense-analyze"
npm install --omit=dev --quiet
zip -r ../strainsense-analyze.zip . -x "*.zip"
cd ..

echo "--- Deploying strainsense-analyze ---"
if aws lambda get-function --function-name "$ANALYZE_FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
  aws lambda update-function-code \
    --function-name "$ANALYZE_FUNCTION_NAME" \
    --zip-file "fileb://strainsense-analyze.zip" \
    --region "$REGION"
  echo "✓ strainsense-analyze updated"
else
  aws lambda create-function \
    --function-name "$ANALYZE_FUNCTION_NAME" \
    --runtime "nodejs22.x" \
    --role "$ROLE_ARN" \
    --handler "index.handler" \
    --zip-file "fileb://strainsense-analyze.zip" \
    --timeout 30 \
    --memory-size 256 \
    --region "$REGION"
  echo "✓ strainsense-analyze created"
fi

# ── Step 5: Create API Gateway HTTP API ──────────────────────────────────────
echo ""
echo "--- Creating API Gateway HTTP API ---"

API_ID=$(aws apigatewayv2 list-apis --region "$REGION" \
  --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  API_ID=$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type "HTTP" \
    --cors-configuration \
      AllowOrigins='["*"]',AllowMethods='["POST","OPTIONS"]',AllowHeaders='["Content-Type"]' \
    --region "$REGION" \
    --query "ApiId" --output text)
  echo "✓ API Gateway created: $API_ID"
else
  echo "✓ API Gateway already exists: $API_ID"
fi

# Create Lambda integrations
OCR_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${OCR_FUNCTION_NAME}"
ANALYZE_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${ANALYZE_FUNCTION_NAME}"

OCR_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type "AWS_PROXY" \
  --integration-uri "$OCR_LAMBDA_ARN" \
  --payload-format-version "2.0" \
  --region "$REGION" \
  --query "IntegrationId" --output text)

ANALYZE_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type "AWS_PROXY" \
  --integration-uri "$ANALYZE_LAMBDA_ARN" \
  --payload-format-version "2.0" \
  --region "$REGION" \
  --query "IntegrationId" --output text)

# Create routes
aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key "POST /ocr" \
  --target "integrations/${OCR_INTEGRATION_ID}" \
  --region "$REGION" > /dev/null

aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key "POST /analyze" \
  --target "integrations/${ANALYZE_INTEGRATION_ID}" \
  --region "$REGION" > /dev/null

# Create default stage with auto-deploy
aws apigatewayv2 create-stage \
  --api-id "$API_ID" \
  --stage-name '$default' \
  --auto-deploy \
  --region "$REGION" > /dev/null 2>&1 || true

# Grant API Gateway permission to invoke Lambda functions
aws lambda add-permission \
  --function-name "$OCR_FUNCTION_NAME" \
  --statement-id "apigateway-ocr" \
  --action "lambda:InvokeFunction" \
  --principal "apigateway.amazonaws.com" \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
  --region "$REGION" 2>/dev/null || true

aws lambda add-permission \
  --function-name "$ANALYZE_FUNCTION_NAME" \
  --statement-id "apigateway-analyze" \
  --action "lambda:InvokeFunction" \
  --principal "apigateway.amazonaws.com" \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
  --region "$REGION" 2>/dev/null || true

API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com"
echo "✓ API Gateway configured"
echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "API Endpoint: $API_ENDPOINT"
echo "  OCR:     POST $API_ENDPOINT/ocr"
echo "  Analyze: POST $API_ENDPOINT/analyze"
echo ""
echo "--- Testing endpoints ---"

# Quick smoke test — OCR with minimal payload
echo "Testing /ocr..."
curl -s -X POST "$API_ENDPOINT/ocr" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}' \
  | python3 -m json.tool 2>/dev/null || echo "(test response above)"

echo ""
echo "--- Update VITE_API_URL ---"
echo "Set the following in your .env.production or Vercel/build config:"
echo "  VITE_API_URL=$API_ENDPOINT"
echo ""
echo "Or run:"
echo "  echo 'VITE_API_URL=$API_ENDPOINT' >> /Users/openclaw/projects/strain-sense/.env.production"
