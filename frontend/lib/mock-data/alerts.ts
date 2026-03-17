export interface Alert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  sourceIp: string;
  status: 'active' | 'investigating' | 'resolved';
}

export const mockAlerts: Alert[] = [
  {
    id: 'ALT-9042',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    severity: 'critical',
    title: 'Anomalous Data Exfiltration Detected',
    description: 'Outbound traffic spike of 45GB detected from Database Subnet to an unknown Russian IP block. Pattern matches signature APT-29.',
    sourceIp: '192.168.10.45',
    status: 'active',
  },
  {
    id: 'ALT-9043',
    timestamp: new Date(Date.now() - 450000).toISOString(),
    severity: 'high',
    title: 'Multiple Failed Login Attempts',
    description: '145 failed SSH login attempts on primary gateway from 5 different geographic locations within 60 seconds.',
    sourceIp: 'Multiple (5)',
    status: 'investigating',
  },
  {
    id: 'ALT-9044',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: 'medium',
    title: 'Unexpected Configuration Change',
    description: 'Security group rules modified on production cluster terminating TLS without authorized change ticket.',
    sourceIp: '10.0.4.12',
    status: 'resolved',
  }
];
