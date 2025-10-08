terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}


locals {
  region    = "us-east-1"
  repo_name = "gameshow-backend"
}

provider "aws" {
  region = local.region
}

# ECR repository
resource "aws_ecr_repository" "repo" {
  name                 = local.repo_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true        

}


resource "aws_ecr_lifecycle_policy" "purge_untagged_fast" {
  repository = aws_ecr_repository.repo.name
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged quickly"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1             
        }
        action = { type = "expire" }
      }
    ]
  })
}
