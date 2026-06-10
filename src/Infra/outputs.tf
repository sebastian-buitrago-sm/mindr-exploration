output "api_gateway_url" {
  description = "HTTP API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend artifacts"
  value       = aws_s3_bucket.frontend.bucket
}
