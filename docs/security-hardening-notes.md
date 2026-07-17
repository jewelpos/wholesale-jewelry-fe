# Security Hardening — Owner & Admin Notes

**Applied:** 2026-07-13  
**Scope:** All environments (DEV → UAT → PRD)

These notes explain every security change that affects how staff use the system, what to expect if something behaves differently, and what no action is required for. Technical details are included for reference — you do not need to act on anything unless noted **[ACTION]**.

---

## 1 — Login Session Duration (Keep Me Signed In)

### What Changed
The **"Keep me signed in"** checkbox on the login page now correctly gives you a **30-day session** instead of always expiring in 7 days. This was a regression from an earlier fix and is now corrected.

### How It Works
| Checkbox State | Session Length |
|---|---|
| Unchecked (default) | 7 days — you will be asked to log in again after a week of inactivity |
| Checked | 30 days — stays signed in across weekends, short vacations, etc. |

Sessions end immediately when you click **Logout**, regardless of this setting.

> **Note for owners:** The 7-day default is intentional. Shared store computers should leave this unchecked so sessions expire automatically.

---

## 2 — OTP Verification Code — Lockout After Failed Attempts

### What Changed
The OTP (one-time password) phone verification screen now enforces a **rate limit**. After **5 wrong codes** from the same email address, the system locks that address for **10 minutes** and returns a `429 Too Many Requests` error.

### What Staff Will See
If a user enters the wrong code 5 times they will see:
> "Too many attempts. Please wait 10 minutes before trying again."

After 10 minutes they can try again normally.

### Why This Matters
A 6-digit OTP has 1,000,000 combinations. Without this limit, an attacker who knows a staff member's email could try all codes automatically in minutes. The lockout stops this entirely.

---

## 3 — Permission Enforcement Is Now Active

### What Changed (Potential Impact on Operations)

**Before this fix:** If a cashier or manager navigated directly to a URL they did not have permission for (e.g. `/jw/1/1/settings`), the system let them in anyway. Permission checking was effectively turned off for all users.

**After this fix:** If a user navigates to a page not in their assigned menu/permission list, they are redirected to a **404 page** immediately.

### **[ACTION REQUIRED — Owner/Admin]**

Before deploying to production, verify that every user role has the correct menus assigned in **System Settings → Users → Roles** (or wherever menu permissions are managed). Staff may start seeing 404s on pages they previously accessed if their role permissions are incomplete.

> **How to check:** Log in as a cashier/manager test account and navigate through all the pages they normally use. If any redirect to 404, add that menu to their role's permission list.

---

## 4 — Financial Summary Panels — Admin-Only

### What Changed
The **summary panels** at the top of list pages (showing totals like Total Sales, Outstanding Balance, etc.) are now visible **only to Admin users and the store Owner**.

**Before:** Every logged-in user, including cashiers, could see these financial summary panels.  
**After:** Only users with **role = Admin** or the store owner account see these panels. Managers and cashiers see the list without the summary bar.

### No Action Required
This is intentional. Cashiers do not need to see aggregate financial totals. If a manager needs to see summary data, promote their role to Admin in **System Settings → Users**.

---

## 5 — OTP Email No Longer in Browser URL

### What Changed
During phone verification, the email address is no longer visible in the browser URL bar. It was previously:
```
/jw/verify?email=john@company.com&codes=MOBILE_OTP_VERIFICATION_PENDING
```

It is now:
```
/jw/verify?codes=MOBILE_OTP_VERIFICATION_PENDING
```

The email is passed securely through browser session storage instead.

### Why This Matters
URLs are stored in browser history, server logs, and any intermediate CDN or analytics service. An employee's email appearing in those logs was a minor privacy risk. This closes it.

> **For staff:** No change in behavior. The verification page works exactly the same.

---

## 6 — Security Response Headers (Transparent)

All pages and API responses now include the following browser security headers. These are invisible to users but protect against a class of web attacks:

| Header | What It Prevents |
|---|---|
| `X-Content-Type-Options: nosniff` | Browser sniffing a file type and running a malicious script |
| `X-Frame-Options: DENY` | The app being embedded in an iframe on another site (clickjacking) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Your store URL leaking to third-party links |
| `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Malicious code silently accessing hardware |

No action required. These are automatic.

---

## 7 — Camera Proxy — Internal Network Blocked

### What Changed
The IP camera snapshot proxy (used in Product Image Capture) now blocks a wider range of internal network addresses, including short-form IPs, IPv6 variants, and zero-address formats.

This prevents an attacker from tricking the proxy into fetching data from inside your network (a Server-Side Request Forgery attack).

No action required. Legitimate camera URLs (e.g. `http://192.168.1.200/snapshot`) from your IP cameras will still work normally — only loopback and reserved addresses are blocked.

---

## 8 — Backend Error Messages Hidden in Production

GraphQL internal error details (which can expose database table names and field names) are now suppressed in production logs and never sent to the browser. Errors in development mode still show full details for debugging.

No action required.

---

## 9 — API Proxy Hardened (Technical — No User Impact)

- Routes starting with `admin/`, `internal/`, `debug/`, `health/`, or `sys/` are now blocked at the proxy level, in addition to any backend-side guards.
- All proxy responses are forced to `application/json` content type so the browser never interprets a backend error page as renderable HTML.
- Backend hostname is no longer included in `502 Service Unavailable` error messages.

---

## Summary Table

| Change | Visible to Staff? | Action Required? |
|---|---|---|
| keepSignedIn 30-day session fix | Yes | No |
| OTP rate limiting (5 attempts/10 min) | Only on repeated failures | No |
| Permission enforcement active | Yes — 404 on unauthorised pages | **Yes — verify role menus** |
| Financial panels admin-only | Yes — cashiers no longer see panels | No (inform cashiers if needed) |
| Email removed from OTP URL | No visible change | No |
| Security response headers | No | No |
| Camera proxy SSRF hardening | No | No |
| Error message suppression | No | No |
| API proxy blocklist | No | No |
