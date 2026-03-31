# ThreatMatrix AI — Demo PCAP Scenarios

Pre-built PCAP files for offline demo backup. If live traffic capture fails during the demo, upload these files via the Forensics Lab to demonstrate the ML detection pipeline.

## Generating PCAP Files

```bash
# From project root
python3 scripts/generate_demo_pcaps.py --output-dir pcaps/demo
```

Requires: `pip install scapy`

## PCAP Files

| File | Content | Expected Detection | Severity |
|------|---------|-------------------|----------|
| `ddos_scenario.pcap` | 800 SYN packets, 25 source IPs → port 80 | DDoS / volumetric anomaly | CRITICAL |
| `port_scan.pcap` | 512 SYN packets, 1 source → ports 1-512 | Probe / port sweep | HIGH |
| `dns_tunnel.pcap` | 60 DNS queries with high-entropy subdomains | DNS tunneling / exfiltration | MEDIUM |
| `brute_force.pcap` | 60 SYN packets, 1 source → port 22 | Brute force / unauthorized access | HIGH |
| `normal_traffic.pcap` | 30 HTTP flows + 10 DNS lookups | No alerts (baseline) | NONE |

## Upload Method

### Via API (curl)

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@threatmatrix.ai","password":"Demo2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Upload PCAP
curl -X POST http://localhost:8000/api/v1/capture/upload-pcap \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@pcaps/demo/ddos_scenario.pcap"
```

### Via Frontend

1. Navigate to `/forensics`
2. Drag and drop the PCAP file into the upload zone
3. Wait for processing to complete
4. Check `/alerts` for generated alerts

## Verification

After uploading each PCAP:

1. Check upload status: `GET /capture/status`
2. Check new flows: `GET /flows/?source=pcap&limit=10`
3. Check new alerts: `GET /alerts/?limit=5`
4. Verify anomaly scores are correctly assigned
5. Verify LLM narrative is generated for attack PCAPs

## Expected Results

| PCAP Upload | Flows Created | Alerts Expected | LLM Narrative |
|-------------|---------------|-----------------|---------------|
| `ddos_scenario.pcap` | 25+ | 1+ CRITICAL | Yes |
| `port_scan.pcap` | 1+ | 1+ HIGH | Yes |
| `dns_tunnel.pcap` | 1+ | 1+ MEDIUM | Yes |
| `brute_force.pcap` | 1+ | 1+ HIGH | Yes |
| `normal_traffic.pcap` | 30+ | 0 | N/A |
