variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-2"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "online-judge"
}

variable "environment" {
  description = "Deployment environment: staging or production"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be either \"staging\" or \"production\"."
  }
}

variable "instance_type" {
  description = "EC2 instance type override. Leave null to use the per-environment default (t3.micro for staging, t3.small for production)."
  type        = string
  default     = null
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

variable "ssh_public_key_path" {
  description = "Path to your local SSH public key file"
  type        = string
}

variable "my_ip_cidr" {
  description = "Your IP address in CIDR form, e.g. 203.0.113.5/32, for SSH access"
  type        = string
}

# Per-environment defaults. instance_type var above overrides this if set.
locals {
  env_instance_type_defaults = {
    staging    = "t3.micro"
    production = "t3.small"
  }

  resolved_instance_type = coalesce(var.instance_type, local.env_instance_type_defaults[var.environment])

  # production keeps the ORIGINAL unsuffixed names (online-judge-sg, online-judge-key, ...)
  # so applying this refactor against the existing production state causes zero replacements.
  # staging gets a distinct suffix (online-judge-staging-sg, ...) so it can coexist in the same AWS account.
  name_prefix = var.environment == "production" ? var.project_name : "${var.project_name}-${var.environment}"
}