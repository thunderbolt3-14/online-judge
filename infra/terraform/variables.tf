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

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
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