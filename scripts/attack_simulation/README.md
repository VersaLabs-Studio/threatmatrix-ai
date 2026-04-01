# ThreatMatrix AI — Attack Simulation Scripts

Demo-ready attack simulation scripts for verifying ThreatMatrix AI's detection pipeline. Each script generates real network traffic that the capture engine, ML Worker, and Alert Engine should detect and classify.

## Prerequisites

```bash
apt install nmap hping3 python3 curl
pip install scapy  # For DNS tunneling script
```

## Scripts

| Script | Attack Type | Tool | Expected Severity | Description |
|--------|-----------|------|-------------------|-------------|
| `01_port_scan.sh` | Port Scan / Probe | nmap | HIGH | SYN scan on ports 1-1024 |
| `02_ddos_simulation.sh` | DDoS SYN Flood | hping3 | CRITICAL | 10-second SYN flood on port 80 |
| `03_dns_tunnel.py` | DNS Tunneling | Scapy | MEDIUM | High-entropy DNS queries simulating exfiltration |
| `04_brute_force.sh` | SSH Brute Force | bash/sshpass/hydra | HIGH | 30 rapid SSH connection attempts |
| `05_normal_traffic.sh` | Normal Baseline | curl | NONE | Legitimate API calls (false positive check) |
| `run_all.sh` | All scenarios | — | — | Runs all 5 scenarios sequentially |

## Usage

### Individual Scripts

```bash
# Port scan (default: localhost)
./01_port_scan.sh

# Port scan (custom target)
./01_port_scan.sh 187.124.45.161

# DDoS simulation
./02_ddos_simulation.sh

# DNS tunneling (requires root)
sudo python3 03_dns_tunnel.py

# SSH brute force
./04_brute_force.sh

# Normal traffic baseline
./05_normal_traffic.sh
```

### Full Suite

```bash
# Run all scenarios with 30s cooldown between each
./run_all.sh

# Run all against specific IP
./run_all.sh 187.124.45.161
```

## How It Works

1. Each script records the current alert count via the API
2. The attack is executed (packets sent, connections attempted)
3. The script waits 30-45 seconds for the pipeline to process:
   - Capture Engine detects packets → Redis `flows:live`
   - ML Worker scores flows → Redis `alerts:live`
   - Alert Engine persists alerts + IOC correlation + LLM narrative
4. The script checks for new alerts and reports results

## Verification

After running any script, verify in the frontend:

- **War Room** (`/war-room`): Live alert feed should show new alerts
- **Alert Console** (`/alerts`): New alerts with severity, category, AI narrative
- **AI Analyst** (`/ai-analyst`): Ask "Explain the latest alert" for LLM analysis

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| No alerts when running on VPS | Linux local routing → `lo`, not `eth0` | Use Option A (external) or Option B (PCAP) below |
| Scripts timeout | API not reachable | Verify `docker-compose ps` shows all 5 services |
| hping3 not found | Not installed | `apt install hping3` |
| DNS tunnel needs root | Raw sockets require privilege | `sudo python3 03_dns_tunnel.py` |

## Network Interface Architecture

The capture engine runs in `network_mode: host` and captures on `CAPTURE_INTERFACE=eth0` (production default). **Linux's local routing table routes traffic to the host's own IP through `lo` (loopback), regardless of whether you target `127.0.0.1` or the public IP.** This means:

- Running attack scripts on the VPS → traffic goes through `lo` → capture engine on `eth0` never sees it
- `ip route get 187.124.45.161` confirms: `local ... dev lo` (kernel shortcut)

**Do NOT change `CAPTURE_INTERFACE`** — this is the correct production config per MASTER_DOC_PART4 §8.1.

### Option A: Run Attacks from External Machine ✅ (Recommended for Demo)

Traffic from an external machine arrives via the internet → hits `eth0` → capture engine detects it.

```bash
# From your local machine (install scapy first: pip install scapy)
python3 scripts/attack_simulation/run_external_attacks.py --target 187.124.45.161

# Or run individual scenarios
python3 scripts/attack_simulation/run_external_attacks.py --target 187.124.45.161 --scenario 1  # Port scan
python3 scripts/attack_simulation/run_external_attacks.py --target 187.124.45.161 --scenario 2  # DDoS
```

For demo day (PART5 §8.1 at 5:30 mark): Run `nmap` from the presenter's laptop targeting the VPS.

### Option B: Use PCAP Upload Endpoint ✅ (Backup / Offline Demo)

PCAP files bypass the capture interface entirely. The PCAP processor reads files directly and feeds them into the ML pipeline.

```bash
# Generate PCAPs (already done — files in pcaps/demo/)
python3 scripts/generate_demo_pcaps.py --output-dir pcaps/demo

# Test full pipeline on VPS
bash scripts/attack_simulation/test_pcap_pipeline.sh

# Or upload individual PCAPs
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@threatmatrix.ai","password":"Demo2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -X POST http://localhost:8000/api/v1/capture/upload-pcap \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@pcaps/demo/ddos_scenario.pcap"
```

### Summary

| Approach | When to Use | Interface |
|----------|------------|-----------|
| **Option A** (external attacks) | Demo day, live testing | `eth0` (production) |
| **Option B** (PCAP upload) | Backup demo, offline testing, quick validation | Bypasses capture |
