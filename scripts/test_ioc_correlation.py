#!/usr/bin/env python3
"""
ThreatMatrix AI — IOC Correlation Test Script

Verifies the complete IOC correlation pipeline:
  1. OTX sync populates threat_intel_iocs table
  2. IOCCorrelator.check_ip() matches known malicious IPs
  3. IOCCorrelator.check_domain() matches known malicious domains
  4. IOCCorrelator.check_hash() matches known malware hashes
  5. correlate_flow() returns correct flags and escalation

Usage:
  docker compose exec backend python scripts/test_ioc_correlation.py

Per MASTER_DOC_PART4 §11.3 — Full compliance verification.
"""

import asyncio
import sys
from typing import Any, Dict

# Add backend to path
sys.path.insert(0, "/app")

from app.services.ioc_correlator import IOCCorrelator
from app.database import async_session
from sqlalchemy import text


async def check_ioc_table_populated() -> bool:
    """Verify threat_intel_iocs table has data."""
    print("\n[1] Checking IOC table population...")
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_type, COUNT(*) FROM threat_intel_iocs WHERE is_active = true GROUP BY ioc_type")
        )
        rows = result.fetchall()
        if not rows:
            print("  ❌ IOC table is empty — run POST /intel/sync first")
            return False
        for ioc_type, count in rows:
            print(f"  ✅ {ioc_type}: {count} IOCs")
        return True


async def test_ip_correlation() -> bool:
    """Test IP matching against IOC database."""
    print("\n[2] Testing IP correlation...")
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'ip' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            print("  ⚠️  No IP IOCs in table — skipping IP test")
            return True

        test_ip = row[0]
        correlator = IOCCorrelator()
        match = await correlator.check_ip(test_ip)
        if match:
            print(f"  ✅ IP {test_ip} matched: severity={match.get('severity')}, source={match.get('source')}")
            return True
        else:
            print(f"  ❌ IP {test_ip} did not match (unexpected)")
            return False


async def test_domain_correlation() -> bool:
    """Test domain matching against IOC database."""
    print("\n[3] Testing domain correlation...")
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'domain' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            print("  ⚠️  No domain IOCs in table — skipping domain test")
            return True

        test_domain = row[0]
        correlator = IOCCorrelator()
        match = await correlator.check_domain(test_domain)
        if match:
            print(f"  ✅ Domain {test_domain} matched: match_type={match.get('match_type')}, severity={match.get('severity')}")
            return True
        else:
            print(f"  ❌ Domain {test_domain} did not match (unexpected)")
            return False


async def test_hash_correlation() -> bool:
    """Test hash matching against IOC database."""
    print("\n[4] Testing hash correlation...")
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'hash' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            print("  ⚠️  No hash IOCs in table — skipping hash test")
            return True

        test_hash = row[0]
        correlator = IOCCorrelator()
        match = await correlator.check_hash(test_hash)
        if match:
            print(f"  ✅ Hash {test_hash} matched: match_type={match.get('match_type')}, severity={match.get('severity')}")
            return True
        else:
            print(f"  ❌ Hash {test_hash} did not match (unexpected)")
            return False


async def test_correlate_flow() -> bool:
    """Test full correlate_flow() with all match types."""
    print("\n[5] Testing correlate_flow() integration...")
    correlator = IOCCorrelator()

    # Test 1: IP match
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'ip' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if row:
            test_ip = row[0]
            flow_data = {"src_ip": "192.168.1.1", "dst_ip": test_ip}
            result = await correlator.correlate_flow(flow_data)
            if result["has_ioc_match"]:
                print(f"  ✅ IP match detected: escalation={result['escalation_severity']}")
            else:
                print(f"  ❌ IP match failed for {test_ip}")
                return False

    # Test 2: Domain match
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'domain' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if row:
            test_domain = row[0]
            flow_data = {"src_ip": "192.168.1.1", "dst_ip": "10.0.0.1", "dst_domain": test_domain}
            result = await correlator.correlate_flow(flow_data)
            if result["has_ioc_match"] and "c2_phishing" in result["flags"]:
                print(f"  ✅ Domain match detected: flags={result['flags']}, escalation={result['escalation_severity']}")
            else:
                print(f"  ❌ Domain match failed for {test_domain}")
                return False

    # Test 3: Hash match
    async with async_session() as session:
        result = await session.execute(
            text("SELECT ioc_value FROM threat_intel_iocs WHERE ioc_type = 'hash' AND is_active = true LIMIT 1")
        )
        row = result.fetchone()
        if row:
            test_hash = row[0]
            flow_data = {"src_ip": "192.168.1.1", "dst_ip": "10.0.0.1", "file_hash": test_hash}
            result = await correlator.correlate_flow(flow_data)
            if result["has_ioc_match"] and "malware" in result["flags"]:
                print(f"  ✅ Hash match detected: flags={result['flags']}, escalation={result['escalation_severity']}")
            else:
                print(f"  ❌ Hash match failed for {test_hash}")
                return False

    # Test 4: No match
    flow_data = {"src_ip": "192.168.1.1", "dst_ip": "10.0.0.1"}
    result = await correlator.correlate_flow(flow_data)
    if not result["has_ioc_match"]:
        print(f"  ✅ No match for clean flow (expected)")
    else:
        print(f"  ❌ Unexpected match for clean flow")
        return False

    return True


async def test_negative_cases() -> bool:
    """Test negative cases (no false positives)."""
    print("\n[6] Testing negative cases...")
    correlator = IOCCorrelator()

    # Test: Unknown IP
    match = await correlator.check_ip("1.2.3.4")
    if match is None:
        print("  ✅ Unknown IP returns None (expected)")
    else:
        print(f"  ❌ Unknown IP returned match (unexpected): {match}")
        return False

    # Test: Unknown domain
    match = await correlator.check_domain("google.com")
    if match is None:
        print("  ✅ Unknown domain returns None (expected)")
    else:
        print(f"  ❌ Unknown domain returned match (unexpected): {match}")
        return False

    # Test: Unknown hash
    match = await correlator.check_hash("d41d8cd98f00b204e9800998ecf8427e")
    if match is None:
        print("  ✅ Unknown hash returns None (expected)")
    else:
        print(f"  ❌ Unknown hash returned match (unexpected): {match}")
        return False

    return True


async def main():
    """Run all IOC correlation tests."""
    print("=" * 60)
    print("ThreatMatrix AI — IOC Correlation Test Suite")
    print("Per MASTER_DOC_PART4 §11.3")
    print("=" * 60)

    results = []

    # Run tests
    results.append(("IOC Table Populated", await check_ioc_table_populated()))
    results.append(("IP Correlation", await test_ip_correlation()))
    results.append(("Domain Correlation", await test_domain_correlation()))
    results.append(("Hash Correlation", await test_hash_correlation()))
    results.append(("Correlate Flow", await test_correlate_flow()))
    results.append(("Negative Cases", await test_negative_cases()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = 0
    failed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
        if result:
            passed += 1
        else:
            failed += 1

    print(f"\nTotal: {passed} passed, {failed} failed")

    if failed == 0:
        print("\n🎉 All tests passed! §11.3 Correlation Engine is fully compliant.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Review output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
