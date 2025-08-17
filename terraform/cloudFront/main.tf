terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

provider "aws" {
  region = "us-east-1" 

#The Local Variables
locals {
  frontend_bucket_name = "sanskrit-familyfeud-gameshow-frontend" # The S3 bucket
  api_name             = "gameshow-http-api"                     # The API Gateway
  ec2_tag_name         = "GameshowECSInstance"                   # The backend EC2 Instance
}

# --- S3 frontend bucket lookup ---
data "aws_s3_bucket" "fe" {
  bucket = local.frontend_bucket_name
}

# --- API Gateway lookup (by name) ---
data "aws_apigatewayv2_api" "api" {
  name = local.api_name
}

data "aws_apigatewayv2_stage" "prod" {
  api_id = data.aws_apigatewayv2_api.api.id
  name   = "prod"
}

# Extract the execute-api domain (remove https:// prefix)
locals {
  apigw_domain = regexreplace(data.aws_apigatewayv2_api.api.api_endpoint, "^https?://", "")
}

# --- EC2 lookup for Socket.IO origin ---
data "aws_instances" "gameshow_ec2" {
  filter { name = "tag:Name";            values = [local.ec2_tag_name] }
  filter { name = "instance-state-name"; values = ["running"] }
}
data "aws_instance" "gameshow_ec2_primary" {
  instance_id = data.aws_instances.gameshow_ec2.ids[0]
}

# --- CloudFront managed policies---
data "aws_cloudfront_cache_policy" "caching_optimized" { name = "Managed-CachingOptimized" }
data "aws_cloudfront_cache_policy" "caching_disabled"  { name = "Managed-CachingDisabled" }
data "aws_cloudfront_origin_request_policy" "all_viewer" { name = "Managed-AllViewer" }

# --- OAC for private S3 access ---
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "gameshow-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# --- CloudFront distribution with 3 origins ---
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  # Origin 1: S3 (frontend)
  origins {
    origin_id                = "s3-frontend"
    domain_name              = data.aws_s3_bucket.fe.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }


# Origin 2: API Gateway (REST)
  origins {
    origin_id   = "apigw-backend"
    domain_name = local.apigw_domain                  
    origin_path = "/${data.aws_apigatewayv2_stage.prod.name}"  
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

# Origin 3: EC2 (Socket.IO passthrough over HTTP)
  origins {
    origin_id   = "ec2-realtime"
    domain_name = data.aws_instance.gameshow_ec2_primary.public_dns
    custom_origin_config {
      http_port              = 5004
      https_port             = 443
      origin_protocol_policy = "http-only"  
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

# Default behavior: frontend files
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # Socket.IO via EC2 (preserve upgrade)
  ordered_cache_behavior {
    path_pattern             = "/socket.io/*"
    target_origin_id         = "ec2-realtime"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET","HEAD","OPTIONS","POST"] # polling + upgrade
    cached_methods           = ["GET","HEAD","OPTIONS"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

# Use default CF certificate
  viewer_certificate { cloudfront_default_certificate = true }
}

  tags = {
    Name        = "GameshowCloudFront"
    Environment = "dev"
  }
}

# S3 bucket policy allowing only this CloudFront distribution
resource "aws_s3_bucket_policy" "allow_cf" {
  bucket = data.aws_s3_bucket.fe.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowCloudFrontRead",
      Effect    = "Allow",
      Principal = { Service = "cloudfront.amazonaws.com" },
      Action    = "s3:GetObject",
      Resource  = "arn:aws:s3:::${local.frontend_bucket_name}/*",
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
        }
      }
    }]
  })
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.cdn.domain_name
  description = "Open https://<this>/ and https://<this>/api/health"
}
