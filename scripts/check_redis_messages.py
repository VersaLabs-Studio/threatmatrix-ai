#!/usr/bin/env python3
"""Quick diagnostic: check if worker is receiving Redis messages."""
import redis
import json
import sys

r = redis.from_url("redis://localhost:6379", decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe("flows:live")

print("[diag] Subscribed to flows:live, waiting 10s for messages...")
import time
start = time.time()
count = 0
while time.time() - start < 10:
    msg = pubsub.get_message(timeout=1)
    if msg and msg["type"] == "message":
        count += 1
        data = json.loads(msg["data"])
        print(f"[diag] Got message #{count}: event={data.get('event')}, payload keys={list(data.get('payload', {}).keys())[:5]}")

print(f"[diag] Total messages received: {count} in 10s")
pubsub.unsubscribe()
r.close()
