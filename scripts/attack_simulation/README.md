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
| No alerts generated | Capture engine on wrong interface | Check `CAPTURE_INTERFACE` in docker-compose.yml |
| No alerts from localhost | Capture on `eth0`, not `lo` | Target the VPS public IP instead |
| Scripts timeout | API not reachable | Verify `docker-compose ps` shows all 5 services |
| hping3 not found | Not installed | `apt install hping3` |
| DNS tunnel needs root | Raw sockets require privilege | `sudo python3 03_dns_tunnel.py` |

## Capture Interface Note

The capture engine runs in `network_mode: host` and defaults to `CAPTURE_INTERFACE=eth0`. When running scripts on the VPS:

- **Option A (recommended):** Target `127.0.0.1` and set `CAPTURE_INTERFACE=lo` in docker-compose.yml for the capture service
- **Option B:** Target the VPS's public IP (`187.124.45.161`) — traffic routes through `eth0` which is the default capture interface

Test which approach works:
```bash
# Check current capture interface
curl http://localhost:8000/api/v1/capture/status

# Check what interface the VPS IP routes through
ip route get 187.124.45.161
```
