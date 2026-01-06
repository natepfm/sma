---
name: Fix Affiliate Tracking
overview: ""
todos:
  - id: add-affiliate-state
    content: Add affiliateParams state with test defaults (c=22949, source, pcid, pmclid)
    status: completed
  - id: capture-url-params
    content: In onMount(), capture c/source/pcid/pmclid from URL to override defaults
    status: completed
  - id: update-create-session
    content: Build refererUrl as https://policysidekick.com/auto/?... with affiliate params
    status: completed
  - id: remove-proxy-override
    content: Remove lines 12-15 in proxy that override refererUrl
    status: completed
---

# Fix Affiliate/User Tracking Parameters

## Problem

The proxy server **overrides** the `refererUrl` payload with a hardcoded value, stripping affiliate tracking parameters. Leads are not attributed to affiliates in Leadpier.

## Root Cause

In [`src/routes/api/savemaxauto/proxy/+server.ts`](src/routes/api/savemaxauto/proxy/+server.ts) lines 13-15:

```javascript
if (endpoint === '/api/v1/create-session' && payload) {
  payload.refererUrl = 'https://savemaxauto.com/form/';  // Overwrites tracking params!
}
```



## What Stays the Same

- **API Base URL**: Keep `https://savemaxauto.com` - this is the actual API endpoint
- **HTTP Headers** (`Referer`, `Origin`): Keep as `savemaxauto.com` - these are for CORS/security

## What Changes

- **Payload `refererUrl`**: Change from hardcoded `savemaxauto.com/form/` to `policysidekick.com/auto/?c=22949&source=...&pcid=...&pmclid=...`

## Test Values

| Parameter | Value ||-----------|-------|| c | 22949 || source | 728557771083 || pcid | ea12e953-e6a0-4428-bd3d-a9de684c5e4f\|\| || pmclid | ea12e953-e6a0-4428-bd3d-a9de684c5e4f |

## Implementation

### Step 1: Update Form - Build refererUrl with tracking params

In [`src/routes/multistep-form/+page.svelte`](src/routes/multistep-form/+page.svelte):

1. Add affiliate params state with test defaults near line 24:
```javascript
let affiliateParams = $state({
  c: '22949',
  source: '728557771083', 
  pcid: 'ea12e953-e6a0-4428-bd3d-a9de684c5e4f||',
  pmclid: 'ea12e953-e6a0-4428-bd3d-a9de684c5e4f'
});
```




2. In `onMount()` (around line 1052), capture URL params if present (override defaults)
3. Update `createSession()` (line 275) to build refererUrl:
```javascript
const refererUrl = `https://policysidekick.com/auto/?c=${affiliateParams.c}&source=${affiliateParams.source}&pcid=${encodeURIComponent(affiliateParams.pcid)}&pmclid=${affiliateParams.pmclid}`;
```




### Step 2: Update Proxy - Remove refererUrl override

In [`src/routes/api/savemaxauto/proxy/+server.ts`](src/routes/api/savemaxauto/proxy/+server.ts):Remove lines 12-15 (the hardcoded override):

```javascript
// DELETE THIS:
if (endpoint === '/api/v1/create-session' && payload) {
  payload.refererUrl = 'https://savemaxauto.com/form/';
}
```



## Expected Result

After fix, `create-session` API receives:

```json
{
  "redirectOrigin": "https://s.civilcarcoverage.com/",
  "refererUrl": "https://policysidekick.com/auto/?c=22949&source=728557771083&pcid=ea12e953-e6a0-4428-bd3d-a9de684c5e4f%7C%7C&pmclid=ea12e953-e6a0-4428-bd3d-a9de684c5e4f",
  "supportsCookies": true
}
```

Session response should include:

```json
{
  "affiliate": {
    "clientPublicKey": "22949",
    "source": "728557771083",
    "publisherClickId": "ea12e953-e6a0-4428-bd3d-a9de684c5e4f||"
  }
}



```