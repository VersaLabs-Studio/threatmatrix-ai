# ThreatMatrix AI — Dev Auth Bypass Documentation

> **Created:** 2026-03-21  
> **Purpose:** Visual verification of mock data without JWT authentication  
> **Status:** ACTIVE (DEV_MODE=True by default)

---

## Overview

A `DEV_MODE` flag has been added to bypass JWT authentication for development and visual verification purposes. When enabled, all protected API endpoints return data using a mock admin user instead of requiring a valid JWT token.

## How It Works

### Configuration

**File:** `backend/app/config.py`

```python
DEV_MODE: bool = Field(
    default=True,
    description="Enable dev auth bypass — disable in production!"
)
```

### Bypass Logic

**File:** `backend/app/dependencies.py`

When `DEV_MODE=True`, the `get_current_user` dependency:

1. Skips JWT token validation entirely
2. Logs a warning to console: `[⚠️  DEV_MODE] Auth bypassed — using mock admin user (dev@threatmatrix.local)`
3. Returns a mock `User` object with admin privileges

```python
# Mock user details
ID:    00000000-0000-0000-0000-000000000001
Email: dev@threatmatrix.local
Name:  Dev Admin
Role:  admin (full access)
```

### Audit Logging

Every request that uses the dev bypass is logged to the backend console:

```
[⚠️  DEV_MODE] Auth bypassed — using mock admin user (dev@threatmatrix.local)
```

This provides an audit trail for when the bypass was active.

---

## When to Use

| Scenario | Use DEV_MODE? |
|----------|---------------|
| Visual verification of mock data | ✅ Yes |
| Frontend development without auth | ✅ Yes |
| API testing with curl/Postman | ✅ Yes |
| Production deployment | ❌ **NO** — set `DEV_MODE=false` |
| Security testing | ❌ No — use real JWT tokens |
| Demo/presentation | ⚠️ Depends — ensure mock data is appropriate |

---

## How to Disable

### Option 1: Environment Variable

Add to `.env` file:

```env
DEV_MODE=false
```

### Option 2: Code Change

In `backend/app/config.py`:

```python
DEV_MODE: bool = Field(
    default=False,  # Changed from True
    description="Enable dev auth bypass — disable in production!"
)
```

### Verification

After disabling, all endpoints will require valid JWT tokens:

```bash
# Should return 401 Unauthorized
curl http://localhost:8000/api/v1/flows/?limit=5
```

---

## Security Implications

| Risk | Mitigation |
|------|------------|
| Unauthorized access in production | `DEV_MODE=False` by default in production `.env` |
| No audit trail of user actions | Console logging of every bypass event |
| Mock user has admin role | Only use in isolated development environments |
| Bypass affects all endpoints | No selective bypass — all or nothing |

---

## Testing the Bypass

### 1. Verify Backend is Running

```bash
curl http://localhost:8000/api/v1/system/health
# Expected: {"status":"operational",...}
```

### 2. Test Protected Endpoint (No Auth)

```bash
curl http://localhost:8000/api/v1/flows/?limit=5
# Expected: 200 OK with flow data (no 401)
```

### 3. Check Console Logs

Look for:
```
[⚠️  DEV_MODE] Auth bypassed — using mock admin user (dev@threatmatrix.local)
```

### 4. Test Frontend

Open `http://localhost:3000/war-room` — all API calls should succeed without login.

---

## Related Files

| File | Change |
|------|--------|
| `backend/app/config.py` | Added `DEV_MODE` setting |
| `backend/app/dependencies.py` | Added bypass logic in `get_current_user` |
| `docs/DEV_AUTH_BYPASS.md` | This documentation |

---

## Future Considerations

- [ ] Add `DEV_MODE` toggle in Admin panel
- [ ] Add per-endpoint bypass option (instead of all-or-nothing)
- [ ] Log bypass events to database audit table (not just console)
- [ ] Add IP allowlist for dev bypass (localhost only)
- [ ] Remove `DEV_MODE` entirely before v1.0.0 production release

---

*This bypass is for development convenience only. Always disable in production environments.*