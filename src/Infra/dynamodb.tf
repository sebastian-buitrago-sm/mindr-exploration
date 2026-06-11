resource "aws_dynamodb_table" "removal_requests" {
  name         = "intoxalock-removal-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "callId"
  range_key    = "submittedAt"

  attribute {
    name = "callId"
    type = "S"
  }

  attribute {
    name = "submittedAt"
    type = "S"
  }
}
