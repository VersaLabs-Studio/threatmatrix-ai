#!/usr/bin/env python3
"""
ThreatMatrix AI — PCAP Demo Scenario Generator
================================================

Generates synthetic PCAP files representing distinct attack patterns
for offline demo backup. Uses Scapy to craft realistic network traffic.

Usage:
    python3 generate_demo_pcaps.py [--output-dir pcaps/demo]

Output:
    - ddos_scenario.pcap    — SYN flood from multiple sources
    - port_scan.pcap        — Port sweep from single source
    - dns_tunnel.pcap       — High-entropy DNS queries
    - brute_force.pcap      — Repeated SSH connection attempts
    - normal_traffic.pcap   — Clean HTTP/DNS baseline

Requires: scapy (pip install scapy)
"""

import os
import sys
import random
import string
import base64
import argparse
from pathlib import Path

try:
    from scapy.all import (
        IP, TCP, UDP, DNS, DNSQR, Ether, RandShort, wrpcap, conf
    )
    conf.verb = 0
except ImportError:
    print("[ERROR] scapy not found. Install with: pip install scapy")
    sys.exit(1)


# Configuration
DST_IP = "10.0.0.1"  # Fictional target for PCAP scenarios
SRC_NET = "192.168.1"  # Source network prefix


def generate_ddos_pcap(output_path: str, num_packets: int = 1200):
    """
    SYN flood from 25 source IPs targeting port 80.
    Each source IP reuses the same source port so packets aggregate
    into 25 multi-packet flows (not 800 single-packet flows).
    Simulates volumetric DDoS attack.
    """
    print(f"  [1/5] Generating DDoS scenario ({num_packets} packets, 25 sources)...")
    packets = []
    # Each source IP gets a fixed source port → 25 flows, ~48 packets each
    src_ips = {}
    for _ in range(25):
        ip = f"10.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
        src_ips[ip] = random.randint(1024, 65535)

    for i in range(num_packets):
        src_ip = random.choice(list(src_ips.keys()))
        sport = src_ips[src_ip]
        pkt = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(
            sport=sport, dport=80, flags="S",
            seq=random.randint(0, 4294967295)
        )
        packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, 25 flows)")


def generate_port_scan_pcap(output_path: str, port_range: range = range(1, 513)):
    """
    Sequential SYN scan from one IP across many ports.
    Uses a single source port so packets aggregate into flows by destination.
    Simulates nmap-style port reconnaissance.
    """
    print(f"  [2/5] Generating port scan scenario ({len(port_range)} ports)...")
    packets = []
    src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
    sport = random.randint(1024, 65535)  # Single source port for all probes

    for port in port_range:
        pkt = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(
            sport=sport, dport=port, flags="S",
            seq=random.randint(0, 4294967295)
        )
        packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, scan from {src_ip})")


def generate_dns_tunnel_pcap(output_path: str, num_queries: int = 60):
    """
    DNS queries with high-entropy subdomains (base64-encoded data).
    Simulates DNS tunneling / data exfiltration.
    """
    print(f"  [3/5] Generating DNS tunnel scenario ({num_queries} queries)...")
    packets = []

    for _ in range(num_queries):
        # High-entropy subdomain (simulating exfiltrated data)
        raw = os.urandom(30)
        encoded = base64.b64encode(raw).decode().rstrip("=")
        qname = f"{encoded}.exfil-tunnel-data.net"

        pkt = Ether() / IP(src=f"{SRC_NET}.{random.randint(10,250)}", dst=DST_IP) / \
              UDP(sport=random.randint(1024, 65535), dport=53) / \
              DNS(rd=1, qd=DNSQR(qname=qname))
        packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets)")


def generate_brute_force_pcap(output_path: str, num_attempts: int = 60):
    """
    Repeated SYN packets to port 22 from same source IP.
    Simulates SSH brute force attack.
    """
    print(f"  [4/5] Generating brute force scenario ({num_attempts} attempts)...")
    packets = []
    src_ip = f"{SRC_NET}.{random.randint(10, 250)}"

    for _ in range(num_attempts):
        sport = random.randint(1024, 65535)
        pkt = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(sport=sport, dport=22, flags="S")
        packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets)")


def generate_normal_traffic_pcap(output_path: str, num_flows: int = 30):
    """
    Normal HTTP requests and DNS lookups.
    Baseline traffic with no anomalies (false positive check).
    """
    print(f"  [5/5] Generating normal traffic scenario ({num_flows} flows)...")
    packets = []

    for i in range(num_flows):
        src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
        sport = random.randint(49152, 65535)

        # HTTP GET request (SYN → SYN-ACK → ACK → Data → FIN)
        pkt_syn = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(sport=sport, dport=80, flags="S", seq=1000*i)
        pkt_synack = Ether() / IP(src=DST_IP, dst=src_ip) / TCP(sport=80, dport=sport, flags="SA", seq=2000*i, ack=1000*i+1)
        pkt_ack = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(sport=sport, dport=80, flags="A", seq=1000*i+1, ack=2000*i+1)

        # Simulated HTTP GET
        http_payload = f"GET /api/v1/flows HTTP/1.1\r\nHost: {DST_IP}\r\n\r\n".encode()
        pkt_data = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(sport=sport, dport=80, flags="PA", seq=1000*i+1, ack=2000*i+1) / http_payload

        pkt_fin = Ether() / IP(src=src_ip, dst=DST_IP) / TCP(sport=sport, dport=80, flags="FA", seq=1000*i+1+len(http_payload), ack=2000*i+1)

        packets.extend([pkt_syn, pkt_synack, pkt_ack, pkt_data, pkt_fin])

    # Add some DNS lookups
    for _ in range(10):
        domains = ["google.com", "github.com", "api.threatmatrix.local", "cdn.jsdelivr.net",
                    "registry.npmjs.com", "pypi.org", "docs.python.org"]
        qname = random.choice(domains)
        pkt = Ether() / IP(src=f"{SRC_NET}.{random.randint(10,250)}", dst=DST_IP) / \
              UDP(sport=random.randint(1024, 65535), dport=53) / \
              DNS(rd=1, qd=DNSQR(qname=qname))
        packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets)")


def main():
    parser = argparse.ArgumentParser(description="Generate demo PCAP scenarios for ThreatMatrix AI")
    parser.add_argument(
        "--output-dir",
        default="pcaps/demo",
        help="Output directory for PCAP files (default: pcaps/demo)"
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — PCAP Demo Scenario Generator              ║
╚══════════════════════════════════════════════════════════════╝

Output directory: {output_dir.resolve()}
Target IP (fictional): {DST_IP}
""")

    generate_ddos_pcap(str(output_dir / "ddos_scenario.pcap"))
    generate_port_scan_pcap(str(output_dir / "port_scan.pcap"))
    generate_dns_tunnel_pcap(str(output_dir / "dns_tunnel.pcap"))
    generate_brute_force_pcap(str(output_dir / "brute_force.pcap"))
    generate_normal_traffic_pcap(str(output_dir / "normal_traffic.pcap"))

    print(f"""
{GREEN}[✓] All 5 PCAP demo scenarios generated successfully!{NC}

Files:
""")

    for pcap_file in sorted(output_dir.glob("*.pcap")):
        size = pcap_file.stat().st_size
        print(f"  {pcap_file.name:30s}  {size:>10,} bytes")

    print(f"""
Upload via:
  curl -X POST http://localhost:8000/api/v1/capture/upload-pcap \\
    -H "Authorization: Bearer <token>" \\
    -F "file=@{output_dir}/ddos_scenario.pcap"
""")


# ANSI colors for standalone output
GREEN = "\033[0;32m"
NC = "\033[0m"

if __name__ == "__main__":
    main()
