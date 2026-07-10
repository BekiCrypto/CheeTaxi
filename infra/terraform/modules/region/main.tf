# Reusable module for a single region's infrastructure.
# Called twice from multi-region.tf — once for primary, once for secondary.

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.50" }
  }
}

variable "region_name" { type = string }
variable "environment" { type = string }
variable "cidr_block" { type = string }
variable "db_instance_class" { type = string }
variable "redis_node_type" { type = string }
variable "eks_node_count" { type = number }
variable "eks_node_type" { type = string }
variable "is_primary" { type = bool, default = true }
variable "primary_db_endpoint" { type = string, default = "" }

# ─── VPC ────────────────────────────────────────────────────────────────────

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = "cheetaxi-${var.region_name}"
  cidr = var.cidr_block
  azs  = ["${var.region_name}a", "${var.region_name}b", "${var.region_name}c"]
  private_subnets = ["${cidrsubnet(var.cidr_block, 8, 1)}", "${cidrsubnet(var.cidr_block, 8, 2)}", "${cidrsubnet(var.cidr_block, 8, 3)}"]
  public_subnets  = ["${cidrsubnet(var.cidr_block, 8, 101)}", "${cidrsubnet(var.cidr_block, 8, 102)}", "${cidrsubnet(var.cidr_block, 8, 103)}"]
  enable_nat_gateway = true
  enable_dns_hostnames = true
}

# ─── Aurora PostgreSQL ──────────────────────────────────────────────────────

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_subnet_group" "cheetaxi" {
  name       = "cheetaxi-${var.region_name}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name   = "cheetaxi-rds-${var.region_name}"
  vpc_id = module.vpc.vpc_id
}

resource "aws_security_group_rule" "rds_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.rds.id
  cidr_blocks       = [module.vpc.vpc_cidr_block]
}

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "cheetaxi-${var.region_name}"
  engine                  = "aurora-postgresql"
  engine_version          = "16.3"
  database_name           = "cheetaxi"
  master_username         = "cheetaxi"
  master_password         = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.cheetaxi.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  storage_encrypted       = true
  backup_retention_period = 14
  deletion_protection     = var.environment == "production"
  global_cluster_identifier = var.is_primary ? null : "cheetaxi-global"
  enable_global_write_forwarding = var.is_primary ? false : true
}

resource "aws_rds_cluster_instance" "postgres" {
  count              = 2
  identifier         = "cheetaxi-${var.region_name}-${count.index}"
  cluster_identifier = aws_rds_cluster.postgres.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.postgres.engine
  engine_version     = aws_rds_cluster.postgres.engine_version
}

# ─── ElastiCache Redis ──────────────────────────────────────────────────────

resource "aws_security_group" "redis" {
  name   = "cheetaxi-redis-${var.region_name}"
  vpc_id = module.vpc.vpc_id
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
  name       = "cheetaxi-${var.region_name}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "cheetaxi" {
  replication_group_id       = "cheetaxi-${var.region_name}"
  description                = "CheeTaxi Redis ${var.region_name}"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 3
  subnet_group_name          = aws_elasticache_subnet_group.cheetaxi.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  global_replication_group_id = var.is_primary ? null : "cheetaxi-global"
}

# ─── EKS ────────────────────────────────────────────────────────────────────

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.20"

  cluster_name    = "cheetaxi-${var.region_name}"
  cluster_version = "1.30"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    main = {
      min_size       = var.eks_node_count
      max_size       = var.eks_node_count * 3
      desired_size   = var.eks_node_count
      instance_types = [var.eks_node_type]
    }
  }
}

# ─── NLB ────────────────────────────────────────────────────────────────────

resource "aws_lb" "api" {
  name               = "cheetaxi-api-${var.region_name}"
  internal           = false
  load_balancer_type = "network"
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "api" {
  name     = "cheetaxi-api-${var.region_name}"
  port     = 80
  protocol = "TCP"
  vpc_id   = module.vpc.vpc_id
}

# ─── Outputs ────────────────────────────────────────────────────────────────

output "db_endpoint" {
  value = aws_rds_cluster.postgres.endpoint
}

output "db_cluster_arn" {
  value = aws_rds_cluster.postgres.arn
}

output "redis_replication_group_id" {
  value = aws_elasticache_replication_group.cheetaxi.id
}

output "api_hostname" {
  value = aws_lb.api.dns_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
