resource "aws_apigatewayv2_api" "this" {
  name          = "gameshow-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]            
    allow_methods = ["GET","POST","PUT","DELETE","OPTIONS","PATCH"]
    allow_headers = ["*"]
  }
}

# Find all instances with the tag and running state
data "aws_instances" "gameshow_ec2" {
  filter {
    name   = "tag:Name"
    values = ["GameshowECSInstance"]
  }
  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

# Pick the first running instance and read its details (DNS/IP)
data "aws_instance" "gameshow_ec2_primary" {
  instance_id = data.aws_instances.gameshow_ec2.ids[0]
}


resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = "http://${data.aws_instance.gameshow_ec2_primary.public_dns}:5004/{proxy}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "prod"
  auto_deploy = true

  # Simple CORS; tighten later
  access_log_settings {}
  default_route_settings {}
}

output "api_execute_domain" {
  value = aws_apigatewayv2_api.this.api_endpoint
}
