variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "elevenlabs_api_key" {
  description = "ElevenLabs API key for the Lambda function"
  type        = string
  sensitive   = true
}

variable "elevenlabs_agent_id" {
  description = "ElevenLabs Conversational AI agent ID"
  type        = string
}

variable "elevenlabs_agent_phone_number_id" {
  description = "ElevenLabs agent Twilio phone number ID"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the zipped Lambda deployment package"
  type        = string
  default     = "../backend/dist/lambda.zip"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for storing removal request records"
  type        = string
  default     = "intoxalock-removal-requests"
}
