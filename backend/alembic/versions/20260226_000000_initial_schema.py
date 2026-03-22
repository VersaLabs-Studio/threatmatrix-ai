"""initial_schema

Revision ID: 20260226_000000
Revises: 
Create Date: 2026-02-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260226_000000'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all initial tables for ThreatMatrix AI."""
    
    # ── Users Table ──────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='viewer'),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── Network Flows Table ──────────────────────────────────────
    op.create_table(
        'network_flows',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('src_ip', postgresql.INET, nullable=False, index=True),
        sa.Column('dst_ip', postgresql.INET, nullable=False, index=True),
        sa.Column('src_port', sa.Integer(), nullable=True),
        sa.Column('dst_port', sa.Integer(), nullable=True),
        sa.Column('protocol', sa.SmallInteger(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('total_bytes', sa.BigInteger(), nullable=True),
        sa.Column('total_packets', sa.Integer(), nullable=True),
        sa.Column('src_bytes', sa.BigInteger(), nullable=True),
        sa.Column('dst_bytes', sa.BigInteger(), nullable=True),
        sa.Column('features', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('anomaly_score', sa.Float(), nullable=True, index=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=False, server_default='false', index=True),
        sa.Column('ml_model', sa.String(50), nullable=True),
        sa.Column('label', sa.String(50), nullable=True),
        sa.Column('source', sa.String(20), nullable=False, server_default='live'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create indexes for network_flows
    op.create_index('idx_flows_timestamp', 'network_flows', ['timestamp'], postgresql_ops={'timestamp': 'DESC'})
    op.create_index('idx_flows_anomaly', 'network_flows', ['is_anomaly'], postgresql_where=sa.text('is_anomaly = true'))
    op.create_index('idx_flows_score', 'network_flows', ['anomaly_score'], postgresql_ops={'anomaly_score': 'DESC'})
    
    # ── Alerts Table ─────────────────────────────────────────────
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('alert_id', sa.String(20), unique=True, nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, index=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True, index=True),
        sa.Column('source_ip', postgresql.INET, nullable=True, index=True),
        sa.Column('dest_ip', postgresql.INET, nullable=True, index=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='open', index=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('flow_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('ml_model', sa.String(50), nullable=True),
        sa.Column('ai_narrative', sa.Text(), nullable=True),
        sa.Column('ai_playbook', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolution_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── Threat Intel IOCs Table ──────────────────────────────────
    op.create_table(
        'threat_intel_iocs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ioc_type', sa.String(20), nullable=False, index=True),
        sa.Column('ioc_value', sa.String(500), nullable=False, index=True),
        sa.Column('threat_type', sa.String(100), nullable=True),
        sa.Column('severity', sa.String(20), nullable=True),
        sa.Column('source', sa.String(100), nullable=False),
        sa.Column('source_ref', sa.String(500), nullable=True),
        sa.Column('first_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('raw_data', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('ioc_type', 'ioc_value', 'source', name='uq_ioc_type_value_source'),
    )
    
    op.create_index('idx_iocs_value', 'threat_intel_iocs', ['ioc_value'])
    op.create_index('idx_iocs_type', 'threat_intel_iocs', ['ioc_type'])
    
    # ── ML Models Registry Table ─────────────────────────────────
    op.create_table(
        'ml_models',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('model_type', sa.String(50), nullable=False, index=True),
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='training', index=True),
        sa.Column('dataset', sa.String(100), nullable=True),
        sa.Column('metrics', postgresql.JSONB(), nullable=True),
        sa.Column('hyperparams', postgresql.JSONB(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('training_time', sa.Float(), nullable=True),
        sa.Column('inference_time', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false', index=True),
        sa.Column('trained_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── Capture Sessions Table ───────────────────────────────────
    op.create_table(
        'capture_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('interface', sa.String(50), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='running', index=True),
        sa.Column('packets_total', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('flows_total', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('anomalies_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('stopped_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('config', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── PCAP Uploads Table ───────────────────────────────────────
    op.create_table(
        'pcap_uploads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending', index=True),
        sa.Column('packets_count', sa.Integer(), nullable=True),
        sa.Column('flows_extracted', sa.Integer(), nullable=True),
        sa.Column('anomalies_found', sa.Integer(), nullable=True),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── LLM Conversations Table ──────────────────────────────────
    op.create_table(
        'llm_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('messages', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('context_type', sa.String(50), nullable=True, index=True),
        sa.Column('context_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('cost_usd', sa.Float(), nullable=True),
        sa.Column('provider', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── System Config Table ──────────────────────────────────────
    op.create_table(
        'system_config',
        sa.Column('key', sa.String(100), primary_key=True),
        sa.Column('value', postgresql.JSONB(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # ── Audit Log Table ──────────────────────────────────────────
    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('action', sa.String(100), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', postgresql.INET, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )
    
    op.create_index('idx_audit_created', 'audit_log', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('audit_log')
    op.drop_table('system_config')
    op.drop_table('llm_conversations')
    op.drop_table('pcap_uploads')
    op.drop_table('capture_sessions')
    op.drop_table('ml_models')
    op.drop_table('threat_intel_iocs')
    op.drop_table('alerts')
    op.drop_table('network_flows')
    op.drop_table('users')
