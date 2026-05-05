// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Mock LLM Response Simulator
// Pre-written cybersecurity responses with streaming simulation
// ═══════════════════════════════════════════════════════

const RESPONSES: Record<string, string> = {
  // Daily briefing
  'briefing': `## Daily Cyber Threat Briefing — April 29, 2026

**Threat Level: ELEVATED** | **Report Period:** Last 24 Hours

### Executive Summary
Your network processed **2,847 flows** in the last 24 hours. The ML ensemble detected **142 anomalous flows** (4.98% anomaly rate) and generated **5,748 alerts** across all severity levels.

### Key Findings

**1. Volumetric DDoS Attack (CRITICAL)**
A SYN flood attack from \`103.45.67.89\` targeted your web server with 14,800 packets in 45 seconds. All three ML models flagged this with unanimous agreement (composite score: 0.94). The attack was mitigated by rate limiting.

**2. C2 Beacon Communication (CRITICAL)**
Internal host \`10.0.1.47\` exhibited Cobalt Strike beacon patterns with 60-second periodic connections to \`185.220.101.34\`. This indicates a compromised endpoint. **Immediate isolation recommended.**

**3. SSH Brute Force Campaign (HIGH)**
847 failed SSH login attempts from \`91.134.200.55\` within 5 minutes. Dictionary attack tooling detected. Fail2ban has been triggered.

### Threat Intelligence Update
- **1,367 IOCs** synced from OTX (including Silver Fox APT indicators)
- **3 new threat actors** identified in recent OTX pulses
- Ethiopian banking phishing campaign indicators added to IOC database

### Recommendations
1. **Urgent:** Isolate host 10.0.1.47 and perform memory forensics
2. **Today:** Review and harden SSH configuration (key-only auth)
3. **This Week:** Update firewall rules with latest IOC blocklist`,

  // Alert analysis
  'alert': `## Threat Analysis — DDoS SYN Flood

**Severity:** CRITICAL | **Confidence:** 94% | **Alert ID:** TM-20260429-001

### What Happened
The ML ensemble detected a volumetric SYN flood attack targeting your web server at \`196.188.1.10\`. Source IP \`103.45.67.89\` (China) sent 14,800 SYN packets within a 45-second window, overwhelming the TCP connection table.

**ML Model Breakdown:**
| Model | Score | Interpretation |
|-------|-------|---------------|
| Isolation Forest | 0.91 | Strong anomaly signal |
| Random Forest | 0.96 | DDoS classification (96% confidence) |
| Autoencoder | 0.95 | Maximum reconstruction error |
| **Composite** | **0.94** | **CRITICAL threshold exceeded** |

### Why This Is Dangerous
SYN floods exhaust server resources by filling the connection queue with half-open connections. This causes complete service unavailability for legitimate users. The attack volume suggests automated botnet tooling (likely hping3 or LOIC).

### Recommended Actions
1. **Immediate:** Block source IP \`103.45.67.89\` at the perimeter firewall
2. **Short-term:** Enable SYN cookies on the affected server
3. **Long-term:** Deploy DDoS mitigation service or rate limiting on SYN packets per source IP
4. **Investigation:** Check if this IP is part of a larger botnet (cross-reference with OTX)`,

  // Network health
  'network': `## Network Health Assessment

**Overall Status:** 🟡 ELEVATED — Active threats detected

### Traffic Overview
- **Total Flows (24h):** 2,847
- **Total Bytes:** 12.85 GB
- **Active Flows:** ~342 concurrent
- **Anomaly Rate:** 4.98% (142 anomalous flows)

### Protocol Distribution
| Protocol | Count | Percentage | Status |
|----------|-------|------------|--------|
| TCP | 1,765 | 62% | Normal |
| UDP | 683 | 24% | Normal |
| ICMP | 228 | 8% | Elevated |
| Other | 171 | 6% | Normal |

### Top Concerns
1. **Compromised host 10.0.1.47** — C2 beaconing + lateral movement
2. **External attack surface** — 3 active brute force campaigns
3. **DNS anomalies** — Possible tunneling from 10.0.1.23

### Health Score: 72/100
Deductions: Active C2 (-15), Brute force campaigns (-8), DNS anomalies (-5)`,

  // Generic chat responses
  'default': `Based on my analysis of the current network state:

### Observations
The network is operating at **ELEVATED** threat level with multiple active incidents requiring attention. The ML ensemble has been performing well with 80.73% accuracy and 0.9312 AUC-ROC on the NSL-KDD benchmark.

### Current Priority Actions
1. **Investigate** the C2 beacon from host 10.0.1.47 — this is the highest risk item
2. **Block** the SSH brute force source IP 91.134.200.55
3. **Monitor** the DNS tunneling suspect on 10.0.1.23

### System Health
All 5 Docker containers are operational. Capture engine processing ~30 packets/second. ML worker averaging 165ms inference latency per flow. LLM gateway connected via OpenRouter with 3 active models.

Is there a specific threat or indicator you'd like me to investigate further?`,

  // Translation (Amharic)
  'translate': `## የአውታረ መረብ ደህንነት ማንቂያ — ተርጉም

**ከፍተኛ አደጋ** — DDoS ጥቃት ተለይቷል

### የተከሰተው
ML ስርዓታችን ከቻይና የመጣ የ14,800 SYN ፓኬት ጥቃት አግኝቷል። ጥቃቱ ወደ \`196.188.1.10\` የድር አገልጋይ ነው ያመጣው።

### ምርመራ
- **ምንጭ IP:** \`103.45.67.89\` (ቻይና)
- **ጥቃት ዓይነት:** SYN Flood (DDoS)
- **የML ተስፋፍፎ:** 94%

### የሚያስፈልጉ እርምጃዎች
1. የጥቃት ምንጭ IP በፋየርዎል ይገድቡ
2. SYN cookies ያንቁ
3. የDDoS ማስወገጃ አገልግሎት ይጠቀሙ

**ማሳሰቢያ:** ቴክኒካዊ ቃላት በእንግሊዝኛ ተተውተዋል።`,
};

function findResponse(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('briefing') || lower.includes('daily') || lower.includes('summary')) return RESPONSES.briefing;
  if (lower.includes('alert') || lower.includes('attack') || lower.includes('ddos') || lower.includes('scan')) return RESPONSES.alert;
  if (lower.includes('network') || lower.includes('health') || lower.includes('status')) return RESPONSES.network;
  if (lower.includes('amharic') || lower.includes('translate') || lower.includes('ተርጉም')) return RESPONSES.translate;
  return RESPONSES.default;
}

export function getMockStreamResponse(content: string): {
  tokens: string[];
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
} {
  const response = findResponse(content);
  // Split into tokens (words + spaces + markdown)
  const tokens: string[] = [];
  let i = 0;
  while (i < response.length) {
    // Stream 1-3 characters at a time for realistic typing effect
    const chunkSize = Math.random() < 0.1 ? 1 : Math.random() < 0.3 ? 2 : Math.min(3, response.length - i);
    tokens.push(response.slice(i, i + chunkSize));
    i += chunkSize;
  }

  return {
    tokens,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    usage: {
      prompt_tokens: Math.ceil(content.length / 4) + 200,
      completion_tokens: tokens.length,
    },
  };
}
