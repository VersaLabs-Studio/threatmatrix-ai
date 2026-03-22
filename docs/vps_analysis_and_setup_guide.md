# ThreatMatrix AI — VPS Purchase Analysis & Setup Guide

> **Date:** March 21, 2026  
> **Context:** Pre-purchase analysis for Hostinger KVM 4 VPS  
> **Purpose:** OS selection, spec validation, setup walkthrough, and payment inquiry  
> **Project Phase:** Day 7 Complete → VPS Purchase & Setup → Day 7 Verification

---

## 📊 SECTION 1: SPEC ANALYSIS — Is KVM 4 Enough for ThreatMatrix AI MVP?

### Your Shortlisted Plan: Hostinger KVM 4

| Resource | KVM 4 Spec | ThreatMatrix AI Requirement | Verdict |
|----------|-----------|---------------------------|---------|
| **vCPU Cores** | 4 vCPU | Scapy capture (1 core), FastAPI + Uvicorn 4 workers (1-2 cores), PostgreSQL (0.5), Redis (0.25), ML Inference (0.5-1) | ✅ **Sufficient for MVP** |
| **RAM** | 16 GB | PostgreSQL (~1-2 GB), Redis (~256 MB), FastAPI backend (~512 MB-1 GB), Capture Engine (~256 MB), ML models in memory (~1-2 GB), Docker overhead (~1 GB), OS (~512 MB) | ✅ **Comfortable** (~6-7 GB used, ~9 GB headroom) |
| **Storage** | 200 GB NVMe | OS (~5 GB), Docker images (~4-6 GB), PostgreSQL data (~2-10 GB for MVP), PCAP files (~5-20 GB), ML datasets (~8 GB NSL-KDD + CICIDS2017), Models (~500 MB), Logs (~2 GB) | ✅ **More than enough** (~30-50 GB used) |
| **Bandwidth** | 16 TB/month | Traffic capture generates minimal storage-bound data; API traffic is lightweight; no streaming video | ✅ **Massively oversized** (you'll use <100 GB) |
| **Virtualization** | KVM | Full virtualization — raw socket access, host network mode for Docker | ✅ **Required & provided** |

### Capacity Verdict

> [!TIP]
> **KVM 4 is an excellent choice for ThreatMatrix AI.** The 16 GB RAM is the key factor — it provides enough headroom to run all Docker services simultaneously plus keep 3 ML models loaded in memory for real-time inference. The 4 vCPU cores are tight but workable, and NVMe storage ensures fast PostgreSQL queries and PCAP processing.

### Why Not KVM 2?

| Resource | KVM 2 | Risk |
|----------|-------|------|
| **vCPU** | 2 cores | ⚠️ Would bottleneck during simultaneous capture + ML inference + API serving |
| **RAM** | 8 GB | ⚠️ Tight — 3 ML models + PostgreSQL + Redis + FastAPI + Capture Engine could exceed 8 GB under load |
| **Storage** | 100 GB | ⚠️ Risky — CICIDS2017 alone is 6.5 GB, plus PCAP accumulation |

> [!IMPORTANT]
> **KVM 2 would work for basic development but would be risky for the demo day.** If all services are running + ML models are loaded + you're running attack simulations + PCAP processing — 8 GB RAM could cause OOM kills. KVM 4 gives you breathing room. Stick with KVM 4.

---

## 📊 SECTION 2: PRICING ANALYSIS

### Cost Comparison

| Plan | 1-Month | 24-Month (Best Deal) | Notes |
|------|---------|---------------------|-------|
| **KVM 4 (1 month)** | **$25.99/mo** | $12.99/mo | Renews at $42.99/mo or $28.99/mo respectively |
| Daily auto-backup add-on | $12.00/mo | — | **NOT recommended** (you have Git + Docker volumes) |

### Budget Impact on Project

Per MASTER_DOC_PART1 §1.3, your total budget is **$100-200**:

| Expense | Cost | Running Total |
|---------|------|---------------|
| VPS (KVM 4, 1 month) | $25.99 | $25.99 |
| LLM APIs (DeepSeek/GLM/Groq) | $100-165 | $126-191 |
| **Total** | | **$126-191** ✅ Within budget |

> [!NOTE]
> **Skip the daily auto-backup ($12/mo).** Your code is in Git, your database can be backed up with `pg_dump` cron jobs (free), and Docker volumes can be snapshotted manually. Save that $12 for LLM API credits.

### Pricing Recommendation

**Buy the 1-month plan at $25.99.** Here's why:
- Your project window is Feb 24 → Apr 20 (~8 weeks remaining from today: ~4 weeks left)
- Demo day is around Apr 20
- You need the VPS for ~4-5 weeks max
- The 24-month deal locks you into a longer commitment you don't need for a senior project
- If you want to continue post-graduation, you can reassess then

---

## 🖥️ SECTION 3: OPERATING SYSTEM SELECTION

### The Recommendation: **Ubuntu 22.04 LTS**

Your master documentation already specifies this in MASTER_DOC_PART2 §3.1:

```
┌─────────────────────────────────────────────────────────────────┐
│                     VPS (High-Spec Server)                       │
│                     Ubuntu 22.04 LTS            ◄── SPECIFIED   │
├─────────────────────────────────────────────────────────────────┤
│  Docker Compose Stack                                            │
```

### Why Ubuntu 22.04 LTS Over Other Options

| OS | Pros | Cons | Verdict |
|----|------|------|---------|
| **Ubuntu 22.04 LTS** ✅ | • **Specified in your master docs** — architectural compliance<br>• Best Docker support & documentation<br>• AppArmor security by default<br>• Huge community (fastest troubleshooting)<br>• Python 3.10+ in default repos<br>• 5-year LTS support<br>• Scapy works out of the box<br>• Most tutorials target Ubuntu | Slightly more resource usage than Debian | **RECOMMENDED** |
| Debian 12 (Bookworm) | Leaner, more stable, smaller attack surface | Fewer default security features, less Docker documentation, older Python in repos | Good alternative |
| AlmaLinux / Rocky Linux | Enterprise RHEL-compatible | Different package manager (dnf), less Docker community support, unfamiliar to you | Not recommended |
| Kali Linux | Pre-installed security tools | Bloated for server use, not designed for production hosting | **NO** — this is an attacker OS, not a server OS |
| CentOS | RHEL-compatible | EOL concerns, fewer docs for Docker | Not recommended |

> [!IMPORTANT]
> **Go with Ubuntu 22.04 LTS.** It's already specified in your architecture blueprint (MASTER_DOC_PART2 §3.1), has the best Docker + Python ecosystem, and gives you the fastest path to a working deployment. Changing the OS would be a deviation from your master documentation — which your own rules strictly prohibit.

---

## 🌍 SECTION 4: SERVER LOCATION

### Your Option: France (100ms latency)

| Factor | Analysis |
|--------|----------|
| **Your location** | Ethiopia (Addis Ababa) |
| **France latency** | ~100ms — acceptable for SSH management and API calls |
| **Alternative consideration** | No East Africa/Middle East options on Hostinger typically |
| **Impact on project** | Latency only matters for your SSH sessions and browser → API. The capture engine, ML inference, Redis pub/sub all happen **locally on the VPS** — zero latency concern |
| **Demo day** | Frontend on Vercel (global CDN) → Backend on France VPS. The ~100ms latency is invisible to the audience |

> [!TIP]
> **France is fine.** The 100ms from Ethiopia is manageable. All real-time processing (capture → Redis → ML → alerts) happens entirely within the VPS. The latency only affects your SSH terminal and the browser's API calls, which is well within the <500ms WebSocket latency target from MASTER_DOC_PART1 §10.1.

---

## 💳 SECTION 5: PAYMENT — Bybi Visa Platinum Virtual Card

### Will Hostinger Accept It?

**Yes, with high confidence.** Here's the breakdown:

| Factor | Status |
|--------|--------|
| **Visa network** | ✅ Hostinger accepts Visa debit/credit cards |
| **Virtual card** | ✅ Hostinger processes virtual cards that operate on Visa/MC networks |
| **International transaction** | ✅ Hostinger is a global platform accepting international payments |
| **Bybi Visa Platinum** | ✅ If it's a **reloadable** virtual Visa card, it should work |

### Potential Issues & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Card declined (insufficient funds) | Low | Ensure the card has at least **$30** loaded (plan cost + potential currency conversion fees) |
| 3D Secure / OTP verification | Medium | Ensure your Bybi app is ready to approve the transaction |
| Non-reloadable prepaid card rejection | Low | Bybi Platinum is reloadable — should not be an issue |
| Currency conversion | Medium | Hostinger charges in USD; Bybi should handle conversion automatically |
| Address verification | Low | Hostinger may require a billing address matching the card — use the address registered with Bybi |

> [!NOTE]
> **Backup payment:** If the Bybi card is rejected, Hostinger also accepts PayPal, Google Pay, and cryptocurrency. Having a backup method ready saves time.

---

## 🚀 SECTION 6: VPS SETUP WALKTHROUGH

### Phase 1: Purchase & Initial Access (15 minutes)

```
Step 1: Purchase
────────────────
1. Go to Hostinger VPS → Select KVM 4
2. Period: 1 month ($25.99)
3. Skip daily auto-backup (save $12)
4. Server location: France
5. OS: Ubuntu 22.04 LTS
6. Pay with Bybi Visa Platinum
7. Wait for provisioning (~2-5 minutes)
```

```
Step 2: Get Your Credentials
────────────────────────────
1. Check Hostinger dashboard → VPS section
2. Note down:
   - VPS IP address (e.g., 51.xxx.xxx.xxx)
   - Root password (or set SSH key)
   - SSH port (default: 22)
```

```
Step 3: First SSH Login
───────────────────────
ssh root@YOUR_VPS_IP

# Immediately change root password
passwd

# Update system
apt update && apt upgrade -y
```

### Phase 2: Security Hardening (20 minutes)

```bash
# 1. Create a non-root user
adduser threatmatrix
usermod -aG sudo threatmatrix

# 2. Set up SSH key authentication (from your Windows machine)
# On your local machine (PowerShell):
ssh-keygen -t ed25519 -C "threatmatrix-vps"
# Copy public key to VPS:
ssh-copy-id -i ~/.ssh/id_ed25519.pub threatmatrix@YOUR_VPS_IP

# 3. Harden SSH (on VPS)
sudo nano /etc/ssh/sshd_config
# Change these settings:
#   PermitRootLogin no
#   PasswordAuthentication no
#   PubkeyAuthentication yes
#   Port 2222  (change from default 22)
sudo systemctl restart sshd

# 4. Set up UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp      # SSH (new port)
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 8000/tcp      # FastAPI (temporary, for development)
sudo ufw enable

# 5. Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### Phase 3: Docker & Dependencies (15 minutes)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker threatmatrix

# 2. Install Docker Compose V2
sudo apt install docker-compose-plugin -y

# 3. Verify
docker --version        # Should show 24.x+
docker compose version  # Should show v2.x+

# 4. Install additional tools
sudo apt install -y \
    git \
    python3-pip \
    python3-venv \
    build-essential \
    libpcap-dev \
    tcpdump \
    htop \
    tmux \
    curl \
    wget \
    net-tools

# 5. Install Scapy system dependency
sudo apt install -y python3-scapy
```

### Phase 4: Clone & Deploy ThreatMatrix AI (20 minutes)

```bash
# 1. Clone your repository
cd /home/threatmatrix
git clone https://github.com/kidusabdula/threatmatrix-ai.git
cd threatmatrix-ai

# 2. Create production .env
cp .env.example .env
nano .env

# Set these values:
# DB_PASSWORD=<generate-strong-password>
# JWT_SECRET=<generate-random-64-char-string>
# DEV_MODE=false
# CAPTURE_INTERFACE=eth0  (check with: ip addr show)
# REDIS_URL=redis://redis:6379

# Generate secure passwords:
# python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 3. Build and start Docker stack
docker compose up -d --build

# 4. Check all services are running
docker compose ps

# Expected output:
# postgres   running  5432
# redis      running  6379
# backend    running  8000
# capture    running  (host network)
# ml-worker  running

# 5. Run database migrations
docker compose exec backend alembic upgrade head

# 6. Create admin user
docker compose exec backend python -m app.scripts.create_admin

# 7. Verify API
curl http://localhost:8000/api/v1/system/health
```

### Phase 5: SSL & Domain Setup (15 minutes)

```bash
# 1. Install Certbot for Let's Encrypt
sudo apt install certbot -y

# 2. If using a domain (optional for MVP):
# Point your domain DNS A record to VPS IP
# Then:
# sudo certbot certonly --standalone -d api.threatmatrix-ai.com

# 3. For MVP without domain — use IP directly:
# Frontend (Vercel): NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:8000
# This works for development/demo

# 4. Nginx reverse proxy (if using domain)
sudo apt install nginx -y
# Copy nginx config from your repo:
sudo cp nginx/nginx.conf /etc/nginx/sites-available/threatmatrix
sudo ln -s /etc/nginx/sites-available/threatmatrix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Phase 6: Start Capturing Traffic! (5 minutes)

```bash
# 1. Check available network interfaces
ip addr show
# Look for the main interface (usually eth0 or ens3)

# 2. Start capture engine
docker compose exec --privileged capture python -m capture.engine

# OR if running outside Docker:
cd backend
sudo python -m capture.engine --interface eth0

# 3. Verify capture is working
# Check Redis for published flows:
docker compose exec redis redis-cli
> SUBSCRIBE flows:live
# You should see flow messages appearing

# 4. Check PostgreSQL for stored flows
docker compose exec postgres psql -U threatmatrix -d threatmatrix
> SELECT COUNT(*) FROM network_flows;
> SELECT * FROM network_flows ORDER BY created_at DESC LIMIT 5;
```

### Phase 7: Generate Test Traffic for Day 7 Verification (10 minutes)

```bash
# 1. Generate normal traffic (from VPS itself)
curl https://google.com
curl https://github.com
ping -c 5 8.8.8.8
dig google.com

# 2. Run attack simulations (against YOUR OWN VPS only!)
# Port scan (from another terminal/machine):
nmap -sS YOUR_VPS_IP

# 3. Seed mock data for visual testing
docker compose exec backend python seed_mock_data.py

# 4. Verify Day 7 implementation
# - Check capture engine is sniffing packets ✅
# - Check flow aggregation is grouping packets ✅
# - Check feature extraction (40+ features) ✅
# - Check Redis pub/sub (flows:live channel) ✅
# - Check PostgreSQL persistence ✅
# - Check capture API endpoints ✅
```

---

## 📋 SECTION 7: COMPLETE SETUP CHECKLIST

### Pre-Purchase
- [ ] Ensure Bybi Visa Platinum has $30+ balance
- [ ] Have backup payment method ready (PayPal)
- [ ] Decide on plan: **KVM 4, 1-month, France, Ubuntu 22.04 LTS**

### Post-Purchase (First Hour)
- [ ] SSH into VPS successfully
- [ ] Change root password
- [ ] Create `threatmatrix` user
- [ ] Set up SSH key authentication
- [ ] Disable root login & password auth
- [ ] Configure UFW firewall
- [ ] Install fail2ban
- [ ] Install Docker & Docker Compose V2
- [ ] Install system dependencies (libpcap-dev, python3, git)
- [ ] Clone ThreatMatrix AI repository
- [ ] Create `.env` with production values
- [ ] Build Docker stack (`docker compose up -d --build`)
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Verify API health check

### Traffic Capture Setup
- [ ] Identify network interface (`ip addr show`)
- [ ] Set `CAPTURE_INTERFACE` in `.env`
- [ ] Start capture engine (privileged mode)
- [ ] Verify flows appearing in Redis (`SUBSCRIBE flows:live`)
- [ ] Verify flows stored in PostgreSQL
- [ ] Generate test traffic
- [ ] Run basic nmap scan against VPS (for anomaly data)

### Day 7 Verification (After VPS Setup)
- [ ] Capture engine sniffing live VPS traffic
- [ ] Flow aggregation creating 5-tuple flows
- [ ] Feature extraction computing 40+ features
- [ ] Redis pub/sub publishing to `flows:live`
- [ ] PostgreSQL storing flow records
- [ ] Capture API endpoints responding
- [ ] Frontend connects to VPS backend (update `NEXT_PUBLIC_API_URL`)

---

## ⏰ SECTION 8: ESTIMATED TIMELINE

| Task | Time | Running Total |
|------|------|---------------|
| Purchase VPS + Provisioning | 10 min | 10 min |
| Initial SSH + System Update | 10 min | 20 min |
| Security Hardening | 20 min | 40 min |
| Docker + Dependencies Install | 15 min | 55 min |
| Clone + Docker Build + Migration | 20 min | 1h 15min |
| SSL/Domain (optional) | 15 min | 1h 30min |
| Start Capture + Verify | 10 min | 1h 40min |
| Generate Test Traffic + Day 7 Verify | 15 min | **~2 hours total** |

> [!TIP]
> **You can have ThreatMatrix AI capturing live VPS traffic within 2 hours of purchase.** This gives you real network data flowing through the system for Day 7 verification and sets you up perfectly for Week 3 (ML Pipeline) where you'll be scoring this live traffic with your trained models.

---

## 🔑 SECTION 9: KEY DECISIONS SUMMARY

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **VPS Plan** | KVM 4 ($25.99/mo) | 16 GB RAM critical for ML models + Docker stack |
| **Duration** | 1 month | Project ends Apr 20; reassess after graduation |
| **OS** | Ubuntu 22.04 LTS | Specified in master docs (PART2 §3.1); best Docker ecosystem |
| **Location** | France | Best available latency (100ms acceptable) |
| **Auto-backup** | Skip ($0) | Git + pg_dump is sufficient; save budget for LLM APIs |
| **Payment** | Bybi Visa Platinum | Hostinger accepts Visa debit/virtual cards |

---

*End of VPS Analysis & Setup Guide*  
*Next: Purchase VPS → Set up per walkthrough → Verify Day 7 implementation*
