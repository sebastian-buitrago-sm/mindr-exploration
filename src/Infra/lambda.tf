resource "aws_iam_role" "lambda_exec" {
  name = "intoxalock-device-removal-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "intoxalock-dynamodb-removal-requests"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:Scan"
      ]
      Resource = aws_dynamodb_table.removal_requests.arn
    }]
  })
}

resource "aws_lambda_function" "call_request" {
  filename         = var.lambda_zip_path
  function_name    = "intoxalock-device-removal-call-request"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "dist/presentation/handlers/callRequestHandler.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      ELEVENLABS_API_KEY               = var.elevenlabs_api_key
      ELEVENLABS_AGENT_ID              = var.elevenlabs_agent_id
      ELEVENLABS_AGENT_PHONE_NUMBER_ID = var.elevenlabs_agent_phone_number_id
    }
  }
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.call_request.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_function" "call_webhook" {
  filename         = var.lambda_zip_path
  function_name    = "intoxalock-call-webhook"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "dist/presentation/handlers/webhookHandler.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      ELEVENLABS_API_KEY               = var.elevenlabs_api_key
      ELEVENLABS_AGENT_ID              = var.elevenlabs_agent_id
      ELEVENLABS_AGENT_PHONE_NUMBER_ID = var.elevenlabs_agent_phone_number_id
      DYNAMODB_TABLE_NAME              = var.dynamodb_table_name
    }
  }
}

resource "aws_lambda_permission" "apigw_invoke_webhook" {
  statement_id  = "AllowAPIGatewayInvokeWebhook"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.call_webhook.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_function" "removal_requests" {
  filename         = var.lambda_zip_path
  function_name    = "intoxalock-removal-requests"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "dist/presentation/handlers/removalRequestsHandler.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      ELEVENLABS_API_KEY               = var.elevenlabs_api_key
      ELEVENLABS_AGENT_ID              = var.elevenlabs_agent_id
      ELEVENLABS_AGENT_PHONE_NUMBER_ID = var.elevenlabs_agent_phone_number_id
      DYNAMODB_TABLE_NAME              = var.dynamodb_table_name
    }
  }
}

resource "aws_lambda_permission" "apigw_invoke_removal_requests" {
  statement_id  = "AllowAPIGatewayInvokeRemovalRequests"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.removal_requests.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
