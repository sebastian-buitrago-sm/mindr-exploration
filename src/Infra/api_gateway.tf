resource "aws_apigatewayv2_api" "http_api" {
  name          = "intoxalock-device-removal-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "https://${aws_cloudfront_distribution.frontend.domain_name}",
      "http://localhost:3000",
    ]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.call_request.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "call_request" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/v1/call-request"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
