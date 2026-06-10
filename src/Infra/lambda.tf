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
