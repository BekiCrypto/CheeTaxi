# CheeTaxi — Terraform skeleton for production AWS deployment
# Usage:
#   cd infra/terraform
#   terraform init
#   terraform plan -var-file=production.tfvars
#   terraform apply -var-file=production.tfvars

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.30"
    }
  }

  backend "s3" {
    bucket         = "cheetaxi-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    dynamodb_table = "cheetaxi-terraform-locks"
  }
}

# ─── Variables ──────────────────────────────────────────────────────────────

variable "aws_region" { type = string; default = "eu-central-1" }
variable "environment" { type = string; default = "production" }
variable "domain" { type = string; default = "cheetaxi.africa" }
variable "cloudflare_zone_id" { type = string }
variable "db_instance_class" { type = string; default = "db.r6g.large" }
variable "redis_node_type" { type = string; default = "cache.r6g.large" }
variable "eks_node_count" { type = number; default = 3 }
variable "eks_node_instance_type" { type = string; default = "m6i.large" }

provider "aws" {
  region = var.aws_region
}

# ─── Network ────────────────────────────────────────────────────────────────

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name                 = "cheetaxi-${var.environment}"
  cidr                 = "10.0.0.0/16"
  azs                  = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets      = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets       = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_dns_hostnames = true
}

# ─── RDS PostgreSQL ─────────────────────────────────────────────────────────

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_security_group" "rds" {
  name        = "cheetaxi-rds"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_security_group_rule" "rds_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.rds.id
  cidr_blocks       = [module.vpc.vpc_cidr_block]
}

resource "aws_db_subnet_group" "cheetaxi" {
  name       = "cheetaxi"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "cheetaxi-${var.environment}"
  engine                  = "aurora-postgresql"
  engine_version          = "16.3"
  database_name           = "cheetaxi"
  master_username         = "cheetaxi"
  master_password         = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.cheetaxi.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  storage_encrypted       = true
  backup_retention_period = 14
  preferred_backup_window = "03:00-05:00"
  deletion_protection     = var.environment == "production"
}

resource "aws_rds_cluster_instance" "postgres" {
  count              = 2
  identifier         = "cheetaxi-${var.environment}-${count.index}"
  cluster_identifier = aws_rds_cluster.postgres.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.postgres.engine
  engine_version     = aws_rds_cluster.postgres.engine_version
}

# ─── ElastiCache Redis ──────────────────────────────────────────────────────

resource "aws_security_group" "redis" {
  name        = "cheetaxi-redis"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_security_group_rule" "redis_ingress" {
  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  security_group_id = aws_security_group.redis.id
  cidr_blocks       = [module.vpc.vpc_cidr_block]
}

resource "aws_elasticache_subnet_group" "cheetaxi" {
  name       = "cheetaxi"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "cheetaxi" {
  replication_group_id       = "cheetaxi-${var.environment}"
  description                = "CheeTaxi Redis cluster"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 3
  subnet_group_name          = aws_elasticache_subnet_group.cheetaxi.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# ─── EKS Cluster ────────────────────────────────────────────────────────────

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.20"

  cluster_name    = "cheetaxi-${var.environment}"
  cluster_version = "1.30"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    main = {
      min_size       = var.eks_node_count
      max_size       = var.eks_node_count * 3
      desired_size   = var.eks_node_count
      instance_types = [var.eks_node_instance_type]
    }
  }

  enable_irsa = true
}

# ─── Outputs ────────────────────────────────────────────────────────────────

output "postgres_endpoint" {
  value     = aws_rds_cluster.postgres.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_replication_group.cheetaxi.primary_endpoint_address
  sensitive = true
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
