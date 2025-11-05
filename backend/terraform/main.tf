terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # local backend for now
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "demo_bucket" {
  bucket = var.bucket_name

  tags = {
    Project = "CapstoneDemo"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.demo_bucket.bucket
}
