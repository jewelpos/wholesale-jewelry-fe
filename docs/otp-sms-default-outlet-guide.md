# OTP SMS Verification & Default Outlet Routing — Owner Guide

---

## OTP SMS Verification

### What It Does

When a new user is created, the system sends a 6-digit OTP code to the user's registered phone number via SMS. The user must enter this code on the verification screen before they can log in. This ensures every account is tied to a real, reachable phone number.

### Requirements

- The user must have a valid phone number on file when their account is created.
- The Twilio account must be registered under **A2P 10DLC** with the **Two-Factor Authentication / OTP** use case approved by US carriers. Without this, OTP messages are silently blocked by carriers even though Twilio reports them as delivered.
- The following environment variables must be set on the backend:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`

### A2P 10DLC Registration (One-Time Setup)

A2P 10DLC is a US carrier requirement for business SMS. To register:

1. Log in to the **Twilio Console**
2. Go to **Messaging → Regulatory Compliance → Brands** and create a Brand (your company)
3. Go to **Messaging → Regulatory Compliance → Campaigns** and create a Campaign with use case **"Two-Factor Authentication"**
4. Assign your `TWILIO_FROM_NUMBER` to the approved campaign

Once approved (Brand SID starts with `BN`), OTP messages from your number are whitelisted by carriers. No code or environment variable change is needed — the approval is linked to your Twilio account automatically.

### Dev / Testing (Non-Production)

In non-production environments, the OTP is also printed to the backend console:

```
>>> [DEV OTP] user=119 phone=+17135824189 otp=123456 <<<
```

This allows testing without SMS delivery.

---

## Default Outlet Routing

### What It Does

When a user logs in, the system automatically redirects them to their default outlet. This avoids the user having to manually navigate to their store and outlet on every login.

### How Default Outlet Is Determined

The system uses a three-level priority:

| Priority | Source | When Used |
|----------|--------|-----------|
| 1 (highest) | `users.defaultoutletid` in the store's tenant database | User has an explicit default outlet set |
| 2 | `isdefaultoutlet` flag in the core database (`institutionstoreusersroles`) | Tenant default is not set |
| 3 (fallback) | Lowest outlet ID the user has access to | Neither of the above is set |

The system always guarantees a redirect — the user will never be left on a blank page because no default is found.

### How to Set a User's Default Outlet

1. Go to **Users** list
2. Click **Edit** on the user
3. In the Outlet section, check **"Make as default outlet"**
4. Click **Save**

The default outlet is stored in the tenant database (`users.defaultoutletid`) and takes priority over all other mechanisms.

### Technical Note — Do Not Change Without Discussion

The three-level logic lives in `getDetailedStoreInfo()` in `store.service.ts` (backend). The outlet order in the SQL query (`getStoreWithOutletMappedToUser`) is sorted by `outletid ASC` to ensure the level-3 fallback is always deterministic (lowest outletid wins). **Do not modify this logic without reviewing the full priority chain.**

---

*Last updated: 2026-07-11*
