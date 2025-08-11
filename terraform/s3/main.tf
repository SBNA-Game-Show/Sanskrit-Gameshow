terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

locals {
  region        = "us-east-1"
  bucket_prefix = "gameshow-frontend"
}

provider "aws" {
  region = local.region
}

# Unique bucket name: gameshow-frontend-<hex>
resource "random_id" "suffix" {
  byte_length = 2
}

resource "aws_s3_bucket" "site" {
  bucket        = "${local.bucket_prefix}-${random_id.suffix.hex}"
  force_destroy = true                      # let "destroy" work even if objects exist (testing)
  tags = { app = "gameshow", tier = "web" }
}

# Ownership controls (no ACLs; we use a bucket policy)
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

# Relax public-access block just enough to allow a public bucket policy
resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

# Static website hosting (SPA)
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
}

# Public read for site files (testing; remove/replace with CloudFront in prod)
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid: "AllowPublicRead",
      Effect: "Allow",
      Principal = "*",
      Action = "s3:GetObject",
      Resource = "${aws_s3_bucket.site.arn}/*"
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.site]
}

# Handy outputs
output "bucket_name"      { value = aws_s3_bucket.site.bucket }
output "website_endpoint" { value = aws_s3_bucket_website_configuration.site.website_endpoint }
output "website_url"      { value = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}" }
