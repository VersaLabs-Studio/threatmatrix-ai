#!/usr/bin/env python3
"""
ThreatMatrix AI — PCAP Demo Scenario Generator
================================================

Generates synthetic PCAP files representing distinct attack patterns
for offline demo backup. Uses Scapy to craft realistic bidirectional
network traffic that the ML models classify as anomalous.

Key design: Models were trained on NSL-KDD which expects bidirectional
flows with byte exchange, completed handshakes, and distinctive traffic
patterns. Single SYN packets score as "normal" — we must create full
flow patterns that trigger anomaly detection.

Usage:
    python3 generate_demo_pcaps.py [--output-dir pcaps/demo]

Output:
    - ddos_scenario.pcap    — SYN flood with response packets
    - port_scan.pcap        — Multi-port probe with handshake completion
    - dns_tunnel.pcap       — High-entropy DNS queries with responses
    - brute_force.pcap      — Repeated failed SSH connection attempts
    - normal_traffic.pcap   — Clean HTTP/DNS baseline

Requires: scapy (pip install scapy)
"""

import os
import sys
import random
import base64
import argparse
from pathlib import Path

try:
    from scapy.all import (
        IP, TCP, UDP, DNS, DNSQR, DNSRR, Ether, Raw, wrpcap, conf
    )
    conf.verb = 0
except ImportError:
    print("[ERROR] scapy not found. Install with: pip install scapy")
    sys.exit(1)


# Configuration
DST_IP = "10.0.0.1"         # Fictional target
SRC_NET = "192.168.1"       # Source network prefix


def _make_handshake(src_ip, dst_ip, sport, dport, seq_start=1000):
    """Create SYN → SYN-ACK → ACK handshake packets."""
    srv_seq = 5000 + sport  # Server-side sequence (safe, won't overflow)
    syn = (Ether() / IP(src=src_ip, dst=dst_ip) /
           TCP(sport=sport, dport=dport, flags="S", seq=seq_start))
    synack = (Ether() / IP(src=dst_ip, dst=src_ip) /
              TCP(sport=dport, dport=sport, flags="SA", seq=srv_seq, ack=seq_start + 1))
    ack = (Ether() / IP(src=src_ip, dst=dst_ip) /
           TCP(sport=sport, dport=dport, flags="A", seq=seq_start + 1, ack=srv_seq + 1))
    return [syn, synack, ack]


def _make_data_exchange(src_ip, dst_ip, sport, dport, payload_data, seq_start=1001, ack_start=2001):
    """Create data packets with payload (PSH+ACK) and response."""
    # Client sends data
    psh = (Ether() / IP(src=src_ip, dst=dst_ip) /
           TCP(sport=sport, dport=dport, flags="PA", seq=seq_start, ack=ack_start) /
           Raw(load=payload_data))
    # Server acknowledges
    srv_ack = (Ether() / IP(src=dst_ip, dst=src_ip) /
               TCP(sport=dport, dport=sport, flags="A", seq=ack_start,
                   ack=seq_start + len(payload_data)))
    # Server sends response data
    response = b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n"
    srv_data = (Ether() / IP(src=dst_ip, dst=src_ip) /
                TCP(sport=dport, dport=sport, flags="PA", seq=ack_start,
                    ack=seq_start + len(payload_data)) /
                Raw(load=response))
    # Client acknowledges
    client_ack = (Ether() / IP(src=src_ip, dst=dst_ip) /
                  TCP(sport=sport, dport=dport, flags="A",
                      seq=seq_start + len(payload_data),
                      ack=ack_start + len(response)))
    return [psh, srv_ack, srv_data, client_ack]


def _make_fin(src_ip, dst_ip, sport, dport, seq, ack):
    """Create FIN handshake to close connection."""
    fin = (Ether() / IP(src=src_ip, dst=dst_ip) /
           TCP(sport=sport, dport=dport, flags="FA", seq=seq, ack=ack))
    fin_ack = (Ether() / IP(src=dst_ip, dst=src_ip) /
               TCP(sport=dport, dport=sport, flags="A", seq=ack, ack=seq + 1))
    return [fin, fin_ack]


def generate_ddos_pcap(output_path: str, num_sources: int = 50):
    """
    DDoS attack: 50 source IPs each sending SYN packets to port 80.
    SYN-only (no responses) so each source creates exactly 1 flow.
    The ML sees: many flows to same target from different sources,
    flag="S0" — characteristic of DDoS volumetric attack.
    """
    print(f"  [1/5] Generating DDoS scenario ({num_sources} sources flooding port 80)...")
    packets = []

    src_ips = [f"10.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
               for _ in range(num_sources)]

    # Each source sends 5 SYN packets to port 80 (same sport → 1 flow per source)
    for src_ip in src_ips:
        sport = random.randint(1024, 65535)
        for j in range(5):
            pkt = (Ether() / IP(src=src_ip, dst=DST_IP) /
                   TCP(sport=sport, dport=80, flags="S",
                       seq=random.randint(1000, 4000000)))
            packets.append(pkt)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, {num_sources} sources)")

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, {num_sources} sources)")


def generate_port_scan_pcap(output_path: str, num_ports: int = 200):
    """
    Port scan: one source IP probes 200 different ports with SYN.
    Only generates scanner→target SYN packets (no responses)
    so the PCAP processor groups them into flows by destination port.
    The ML sees: same src_ip hitting many dst_ports, flag="S0",
    serror_rate=1.0 — characteristic of probe/scan.
    """
    print(f"  [2/5] Generating port scan scenario ({num_ports} ports probed)...")
    packets = []
    src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
    sport = random.randint(1024, 65535)

    for port in range(1, num_ports + 1):
        # Only SYN packets — no responses to avoid flow merge issues
        syn = (Ether() / IP(src=src_ip, dst=DST_IP) /
               TCP(sport=sport, dport=port, flags="S",
                   seq=port * 1000))
        packets.append(syn)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, {num_ports} probes)")


def generate_dns_tunnel_pcap(output_path: str, num_queries: int = 40):
    """
    DNS tunneling: high-entropy DNS queries with responses.
    Each query-response pair creates a bidirectional UDP flow.
    The ML sees: unusual payload_entropy, high bytes_per_packet,
    dst_port=53 with anomalous query patterns.
    """
    print(f"  [3/5] Generating DNS tunnel scenario ({num_queries} query-response pairs)...")
    packets = []

    for i in range(num_queries):
        src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
        sport = random.randint(1024, 65535)

        # High-entropy subdomain (simulating exfiltrated data)
        raw = os.urandom(35)
        encoded = base64.b64encode(raw).decode().rstrip("=")
        qname = f"{encoded}.exfil-tunnel-data.net"

        # Client sends DNS query
        query = (Ether() / IP(src=src_ip, dst=DST_IP) /
                 UDP(sport=sport, dport=53) /
                 DNS(rd=1, qd=DNSQR(qname=qname)))
        packets.append(query)

        # Server sends DNS response (with fake answer to create bidirectional flow)
        response = (Ether() / IP(src=DST_IP, dst=src_ip) /
                    UDP(sport=53, dport=sport) /
                    DNS(qr=1, rd=1, qd=DNSQR(qname=qname),
                        an=DNSRR(rrname=qname, ttl=300, rdata="10.0.0.99")))
        packets.append(response)

        # Second query with different data (tunneling pattern: rapid sequential queries)
        raw2 = os.urandom(25)
        encoded2 = base64.b64encode(raw2).decode().rstrip("=")
        qname2 = f"{encoded2}.exfil-tunnel-data.net"

        query2 = (Ether() / IP(src=src_ip, dst=DST_IP) /
                  UDP(sport=sport + 1, dport=53) /
                  DNS(rd=1, qd=DNSQR(qname=qname2)))
        packets.append(query2)

        response2 = (Ether() / IP(src=DST_IP, dst=src_ip) /
                     UDP(sport=53, dport=sport + 1) /
                     DNS(qr=1, rd=1, qd=DNSQR(qname=qname2),
                         an=DNSRR(rrname=qname2, ttl=300, rdata="10.0.0.99")))
        packets.append(response2)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets)")


def generate_brute_force_pcap(output_path: str, num_attempts: int = 50):
    """
    SSH brute force: repeated connection attempts to port 22.
    Each attempt: SYN → SYN-ACK → ACK → SSH banner exchange → RST (failed auth).
    The ML sees: many flows to same service (ssh), high count, repeated patterns.
    """
    print(f"  [4/5] Generating brute force scenario ({num_attempts} SSH attempts)...")
    packets = []
    src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
    passwords = [b"root", b"admin", b"password", b"123456", b"test",
                 b"login", b"pass", b"qwerty", b"letmein", b"welcome"]

    for i in range(num_attempts):
        sport = random.randint(1024, 65535)
        seq = 1000 * (i + 1)
        srv_seq = 5000 + sport  # Match _make_handshake server seq

        # SYN → SYN-ACK → ACK
        packets.extend(_make_handshake(src_ip, DST_IP, sport, 22, seq))

        # Server sends SSH banner
        ssh_banner = b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6\r\n"
        srv_banner = (Ether() / IP(src=DST_IP, dst=src_ip) /
                      TCP(sport=22, dport=sport, flags="PA", seq=srv_seq + 1, ack=seq + 1) /
                      Raw(load=ssh_banner))
        packets.append(srv_banner)

        # Client responds with SSH banner + password attempt
        client_banner = b"SSH-2.0-OpenSSH_Client\r\n"
        pw_attempt = passwords[i % len(passwords)]
        client_data = (Ether() / IP(src=src_ip, dst=DST_IP) /
                       TCP(sport=sport, dport=22, flags="PA",
                           seq=seq + 1, ack=srv_seq + 1 + len(ssh_banner)) /
                       Raw(load=client_banner + pw_attempt))
        packets.append(client_data)

        # Server rejects (RST — failed authentication)
        rst = (Ether() / IP(src=DST_IP, dst=src_ip) /
               TCP(sport=22, dport=sport, flags="RA",
                   seq=srv_seq + 1 + len(ssh_banner),
                   ack=seq + 1 + len(client_banner) + len(pw_attempt)))
        packets.append(rst)

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets, {num_attempts} attempts)")


def generate_normal_traffic_pcap(output_path: str, num_flows: int = 20):
    """
    Normal HTTP traffic: complete request-response cycles.
    Clean baseline with no anomalies (false positive check).
    """
    print(f"  [5/5] Generating normal traffic scenario ({num_flows} HTTP flows)...")
    packets = []

    http_paths = [b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n",
                  b"GET /api/v1/status HTTP/1.1\r\nHost: api.local\r\n\r\n",
                  b"POST /login HTTP/1.1\r\nHost: app.local\r\nContent-Length: 0\r\n\r\n",
                  b"GET /index.html HTTP/1.1\r\nHost: www.local\r\n\r\n",
                  b"GET /health HTTP/1.1\r\nHost: monitor.local\r\n\r\n"]

    for i in range(num_flows):
        src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
        sport = random.randint(49152, 65535)
        seq = 1000 * (i + 1)
        srv_seq = 5000 + sport

        # Full handshake
        packets.extend(_make_handshake(src_ip, DST_IP, sport, 80, seq))

        # HTTP request + response
        payload = http_paths[i % len(http_paths)]
        packets.extend(_make_data_exchange(src_ip, DST_IP, sport, 80, payload,
                                           seq + 1, srv_seq + 1))

        # Close connection
        packets.extend(_make_fin(src_ip, DST_IP, sport, 80,
                                 seq + 1 + len(payload), srv_seq + 1 + 40))

    # Add DNS lookups
    for _ in range(10):
        domains = ["google.com", "github.com", "api.local", "cdn.jsdelivr.net", "pypi.org"]
        src_ip = f"{SRC_NET}.{random.randint(10, 250)}"
        sport = random.randint(1024, 65535)
        qname = random.choice(domains)

        query = (Ether() / IP(src=src_ip, dst=DST_IP) /
                 UDP(sport=sport, dport=53) /
                 DNS(rd=1, qd=DNSQR(qname=qname)))
        response = (Ether() / IP(src=DST_IP, dst=src_ip) /
                    UDP(sport=53, dport=sport) /
                    DNS(qr=1, rd=1, qd=DNSQR(qname=qname),
                        an=DNSRR(rrname=qname, ttl=300, rdata="142.250.80.46")))
        packets.extend([query, response])

    wrpcap(output_path, packets)
    print(f"      Written: {output_path} ({len(packets)} packets)")


def main():
    parser = argparse.ArgumentParser(description="Generate demo PCAP scenarios for ThreatMatrix AI")
    parser.add_argument("--output-dir", default="pcaps/demo",
                        help="Output directory (default: pcaps/demo)")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — PCAP Demo Scenario Generator              ║
╚══════════════════════════════════════════════════════════════╝

Output directory: {output_dir.resolve()}
Target IP: {DST_IP}
""")

    generate_ddos_pcap(str(output_dir / "ddos_scenario.pcap"))
    generate_port_scan_pcap(str(output_dir / "port_scan.pcap"))
    generate_dns_tunnel_pcap(str(output_dir / "dns_tunnel.pcap"))
    generate_brute_force_pcap(str(output_dir / "brute_force.pcap"))
    generate_normal_traffic_pcap(str(output_dir / "normal_traffic.pcap"))

    print(f"""
{GREEN}[✓] All 5 PCAP demo scenarios generated!{NC}

Files:
""")

    for pcap_file in sorted(output_dir.glob("*.pcap")):
        size = pcap_file.stat().st_size
        print(f"  {pcap_file.name:30s}  {size:>10,} bytes")

    print(f"""
Upload:
  curl -X POST http://localhost:8000/api/v1/capture/upload-pcap \\
    -F "file=@{output_dir}/ddos_scenario.pcap"
""")


GREEN = "\033[0;32m"
NC = "\033[0m"

if __name__ == "__main__":
    main()
