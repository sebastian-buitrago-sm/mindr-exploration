resource "aws_apigatewayv2_api" "http_api" {
  name          = "intoxalock-device-removal-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "https://d2au2iu1t0n387.cloudfront.net",
      "http://localhost:3000",
      "http://localhost:5173",
    ]
    allow_methods = ["POST", "GET", "OPTIONS"]
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

resource "aws_apigatewayv2_integration" "call_webhook" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.call_webhook.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "call_webhook" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/v1/webhook/call-completed"
  target    = "integrations/${aws_apigatewayv2_integration.call_webhook.id}"
}

resource "aws_apigatewayv2_integration" "removal_requests" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.removal_requests.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "removal_requests" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/v1/removal-requests"
  target    = "integrations/${aws_apigatewayv2_integration.removal_requests.id}"
}
