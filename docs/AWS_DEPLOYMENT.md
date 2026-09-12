# CodeGuard AI — AWS EC2 Production Deployment Guide

This guide documents deploying CodeGuard AI to an **AWS EC2 instance** using Docker Compose, Nginx, Let's Encrypt SSL/TLS certificates, and systemd service management.

---

## 1. Architecture on AWS

```text
       Internet
          │ (HTTPS :443)
          ▼
    [AWS EC2 Instance: t3.large or c6i.large]
    ┌──────────────────────────────────────────────┐
    │  Host OS (Ubuntu 22.04 LTS / Amazon Linux)   │
    │                                              │
    │  [Nginx / Certbot] (SSL Termination)         │
    │         │ (proxy_pass :80)                   │
    │         ▼                                    │
    │  [Docker Compose Managed Network]            │
    │  ├── Frontend Container  (Nginx SPA) :80     │
    │  ├── Backend Container   (Node.js)   :5000   │
    │  ├── AI-Service          (FastAPI)   :8000   │
    │  ├── PostgreSQL 16       (Volume)    :5432   │
    │  └── Redis 7             (Volume)    :6379   │
    └──────────────────────────────────────────────┘
```

---

## 2. Prerequisites & EC2 Setup

1. **Provision EC2 Instance**:
   - Instance Type: `t3.large` (2 vCPU, 8 GB RAM) or `t3.medium` minimum.
   - OS: Ubuntu Server 24.04 LTS or 22.04 LTS.
   - Storage: 30 GB gp3 EBS Volume.
2. **Security Group Inbound Rules**:
   - Port 22 (SSH): Restrict to administrative IP.
   - Port 80 (HTTP): `0.0.0.0/0` (Let's Encrypt validation & redirect).
   - Port 443 (HTTPS): `0.0.0.0/0`.
   - All internal container ports (5000, 8000, 5432, 6379) are blocked externally.

---

## 3. Server Provisioning Commands

Run on the EC2 instance via SSH:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose Plugin
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu

# 3. Clone repository
git clone https://github.com/your-org/codeguard-ai.git /opt/codeguard
cd /opt/codeguard

# 4. Configure Production Environment Variables
cp .env.example .env
nano .env
# Set secure JWT_SECRET, POSTGRES_PASSWORD, and optional GEMINI_API_KEY
```

---

## 4. Systemd Automation Service

Create a systemd unit file to ensure CodeGuard starts automatically upon instance reboot:

```bash
sudo nano /etc/systemd/system/codeguard.service
```

Add:
```ini
[Unit]
Description=CodeGuard AI Multi-Container Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/codeguard
ExecStart=/usr/bin/docker compose -f docker-compose.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable codeguard
sudo systemctl start codeguard
```

---

## 5. SSL / TLS Setup with Certbot

To attach a domain name (e.g. `codeguard.yourdomain.com`):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d codeguard.yourdomain.com
```

Mount certificates into `docker/nginx.conf` and update listening directives to port 443 with TLSv1.3 and HSTS enabled.

---

## 6. CloudWatch Logs Integration

To ship container logs to AWS CloudWatch:

1. Attach IAM Role with `CloudWatchLogsFullAccess` to the EC2 instance.
2. Configure Docker daemon `/etc/docker/daemon.json`:
```json
{
  "log-driver": "awslogs",
  "log-opts": {
    "awslogs-region": "us-east-1",
    "awslogs-group": "/aws/ec2/codeguard-ai",
    "awslogs-create-group": "true"
  }
}
```
3. Restart Docker: `sudo systemctl restart docker`.
