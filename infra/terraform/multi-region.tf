# CheeTaxi — Multi-Region Active-Active Infrastructure
#
# Deploys the platform across two AWS regions (eu-central-1 primary +
# af-south-1 secondary) with:
#   • Aurora Global Database (write-forwarding for low-latency reads)
#   • ElastiCache Global Datastore (cross-region Redis replication)
#   • EKS clusters in both regions
#   • Cloudflare load balancing with geo-routing
#   • S3 cross-region replication
#
# Architecture:
#
#   Users → Cloudflare (geo-routing) → Region A (eu-central-1) or Region B (af-south-1)
#                                      ↓                        ↓
#                                   EKS cluster              EKS cluster
#                                      ↓                        ↓
#                              Aurora Global Database (write-forwarding)
#                                      ↓                        ↓
#                              ElastiCache Global Datastore (cross-region)
#
# Write strategy: applications write to the nearest region's Aurora writer.
# Aurora Global Database forwards writes to the primary region asynchronously
# (typically < 1 second lag). For true active-active writes, use CockroachDB
# instead (not included here — would require schema changes for CRDB compat).

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
      alias   = "af_south_1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.30"
    }
  }
  backend "s3" {
    bucket         = "cheetaxi-terraform-state"
    key            = "multi-region/terraform.tfstate"
    region         = "eu-central-1"
    encrypt        = true
    dynamodb_table = "cheetaxi-terraform-locks"
  }
}

# ─── Provider Config ────────────────────────────────────────────────────────

provider "aws" {
  region = var.primary_region
}

provider "aws" {
  alias  = "af_south_1"
  region = var.secondary_region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ─── Primary Region (eu-central-1) ──────────────────────────────────────────

module "primary_region" {
  source = "./modules/region"
  providers = {
    aws = aws
  }

  region_name         = var.primary_region
  environment         = "production"
  cidr_block          = "10.0.0.0/16"
  db_instance_class   = var.db_instance_class
  redis_node_type     = var.redis_node_type
  eks_node_count      = 3
  eks_node_type       = "m6i.large"

  is_primary = true
}

# ─── Secondary Region (af-south-1 — Cape Town, closer to East Africa) ──────

module "secondary_region" {
  source = "./modules/region"
  providers = {
    aws = aws.af_south_1
  }

  region_name         = var.secondary_region
  environment         = "production"
  cidr_block          = "10.1.0.0/16"
  db_instance_class   = var.db_instance_class
  redis_node_type     = var.redis_node_type
  eks_node_count      = 2  # smaller in secondary
  eks_node_type       = "m6i.large"

  is_primary          = false
  primary_db_endpoint = module.primary_region.db_endpoint
}

# ─── Aurora Global Database ─────────────────────────────────────────────────

resource "aws_rds_global_cluster" "cheetaxi" {
  global_cluster_identifier    = "cheetaxi-global"
  engine                       = "aurora-postgresql"
  engine_version               = "16.3"
  database_name                = "cheetaxi"
  storage_encrypted            = true
  source_db_cluster_identifier = module.primary_region.db_cluster_arn
}

resource "aws_rds_global_cluster_member" "secondary" {
  global_cluster_identifier    = aws_rds_global_cluster.cheetaxi.id
  db_cluster_arn               = module.secondary_region.db_cluster_arn
  is_writer                    = false
}

# ─── ElastiCache Global Datastore ───────────────────────────────────────────

resource "aws_elasticache_global_replication_group" "cheetaxi" {
  global_replication_group_id_suffix = "cheetaxi"
  global_replication_group_description = "CheeTaxi global Redis"
  primary_replication_group_id        = module.primary_region.redis_replication_group_id
}

resource "aws_elasticache_global_replication_group_member" "secondary" {
  global_replication_group_id = aws_elasticache_global_replication_group.cheetaxi.global_replication_group_id
  member_replication_group_id = module.secondary_region.redis_replication_group_id
}

# ─── Cloudflare Geo-Routing ─────────────────────────────────────────────────

resource "cloudflare_load_balancer" "cheetaxi_api" {
  zone_id = var.cloudflare_zone_id
  name    = "api.cheetaxi.africa"
  steering_policy = "geo"
  default_pool_id = cloudflare_load_balancer_pool.primary.id
  fallback_pool_id = cloudflare_load_balancer_pool.secondary.id

  pop_pools {
    pop      = "JNB"  # Johannesburg
    pool_ids = [cloudflare_load_balancer_pool.secondary.id]
  }
  pop_pools {
    pop      = "NBO"  # Nairobi
    pool_ids = [cloudflare_load_balancer_pool.secondary.id]
  }
  pop_pools {
    pop      = "FRA"  # Frankfurt
    pool_ids = [cloudflare_load_balancer_pool.primary.id]
  }
}

resource "cloudflare_load_balancer_pool" "primary" {
  name    = "cheetaxi-primary-eu"
  enabled = true
  monitor {
    type = "https"
    expected_body = "ok"
    expected_codes = "200"
  }
  origins {
    name    = "primary-api"
    address = module.primary_region.api_hostname
    enabled = true
  }
}

resource "cloudflare_load_balancer_pool" "secondary" {
  name    = "cheetaxi-secondary-af"
  enabled = true
  monitor {
    type = "https"
    expected_body = "ok"
    expected_codes = "200"
  }
  origins {
    name    = "secondary-api"
    address = module.secondary_region.api_hostname
    enabled = true
  }
}

# ─── S3 Cross-Region Replication ────────────────────────────────────────────

resource "aws_s3_bucket" "uploads_primary" {
  bucket = "cheetaxi-uploads-${var.primary_region}"
  provider = aws
}

resource "aws_s3_bucket" "uploads_secondary" {
  bucket = "cheetaxi-uploads-${var.secondary_region}"
  provider = aws.af_south_1
}

resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  bucket = aws_s3_bucket.uploads_primary.id
  role   = aws_iam_role.replication.arn

  rule {
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.uploads_secondary.arn
      storage_class = "STANDARD"
    }
  }
}

resource "aws_iam_role" "replication" {
  name = "cheetaxi-s3-replication"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

# ─── Outputs ────────────────────────────────────────────────────────────────

output "primary_api_url" {
  value = "https://${module.primary_region.api_hostname}"
}

output "secondary_api_url" {
  value = "https://${module.secondary_region.api_hostname}"
}

output "global_db_endpoint" {
  value     = aws_rds_global_cluster.cheetaxi.global_cluster_identifier
  sensitive = true
}

output "global_redis_endpoint" {
  value = aws_elasticache_global_replication_group.cheetaxi.global_replication_group_id
}
