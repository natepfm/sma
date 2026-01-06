# Auto-Form Project - Comprehensive Context

## 📋 Project Overview

This is a **multi-step insurance quote form application** built for SaveMaxAuto, designed to collect user information and submit it to the SaveMaxAuto API for auto insurance quote generation. The project includes both an original form and a modern redesigned version.

### Project Name
- **Repository**: `sma` (SaveMaxAuto)
- **GitHub**: https://github.com/natepfm/sma
- **Branch**: `nrv-multistep-form`

---

## 🏗️ Tech Stack

### Core Framework
- **SvelteKit 2.16.0** - Full-stack meta-framework
- **Svelte 5.0** - Component framework with new runes API
- **TypeScript 5.0** - Strict type checking enabled
- **Vite 6.0** - Build tool and dev server

### Styling
- **Tailwind CSS 4.1.0** - Utility-first CSS framework
- **Custom CSS** - Scoped component styles and global utilities
- **Modern CSS Features**: Gradients, backdrop-filter, transforms, transitions

### Deployment
- **Cloudflare Pages/Workers** - Edge deployment platform
- **Wrangler 4.15.0** - Cloudflare CLI tool
- **Node.js Compatibility** - Enabled in Cloudflare

### Key Dependencies
```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-cloudflare": "^6.0.1",
    "@sveltejs/kit": "^2.16.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@tailwindcss/vite": "^4.1.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "wrangler": "^4.15.0"
  }
}
```

---

## 📁 Project Structure

```
/
├── src/
│   ├── app.html                    # HTML shell template
│   ├── app.css                     # Global styles (Tailwind + custom)
│   │
│   ├── routes/
│   │   ├── +layout.svelte          # Root layout (imports app.css)
│   │   │
│   │   ├── multistep-form/         # ORIGINAL FORM
│   │   │   ├── +page.svelte        # Main form component (3173 lines)
│   │   │   └── +page.server.ts    # Server-side geo data loading
│   │   │
│   │   ├── multistep-form-mdrn/    # MODERN FORM (NEW)
│   │   │   ├── +page.svelte        # Modernized styling version
│   │   │   ├── +page.server.ts    # Same server logic
│   │   │   └── README.md           # Design changes documentation
│   │   │
│   │   └── api/
│   │       └── savemaxauto/
│   │           └── proxy/
│   │               └── +server.ts  # API proxy endpoint
│   │
│   └── lib/                        # Reusable code ($lib alias)
│       ├── components/
│       │   └── google/
│       │       ├── Disclaimer.svelte
│       │       └── GoogleFooter.svelte
│       ├── data/
│       │   └── vehicleMakeLogos.ts # Vehicle brand logo mappings
│       └── utils/
│           ├── cloudflareClientInfo.ts  # Extract geo data
│           ├── getTracking.ts           # Tracking setup
│           ├── isLocalEnv.ts            # Environment detection
│           ├── parseTitle.ts            # Title parsing utility
│           └── pixels.ts                # Pixel tracking
│
├── static/
│   └── fonts/
│       └── TiemposHeadline-Medium.otf  # Custom font
│
├── svelte.config.js                # SvelteKit configuration
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── wrangler.toml                   # Cloudflare deployment config
└── package.json                    # Dependencies and scripts
```

---

## 🎯 Application Purpose & Flow

### Business Goal
Collect comprehensive user and vehicle information to generate auto insurance quotes through the SaveMaxAuto platform.

### User Journey
1. **Landing Page** - User enters zip code
2. **Vehicle Information** - Year, Make, Model, Trim, Ownership
3. **Driver Information** - Personal details, insurance history
4. **Additional Drivers** - Option to add multiple drivers
5. **Insurance Details** - Current coverage, incidents
6. **Contact Information** - Name, email, phone, address
7. **Quote Results** - Display offers from insurance providers

### Form Steps (13 Total)
1. Landing page with zip code entry
2. Vehicle year selection
3. Vehicle make selection
4. Vehicle model selection
5. Vehicle trim selection
6. Vehicle ownership (Own/Lease)
7. Current insurance provider
8. Driver gender and marital status
9. Homeownership and military status
10. Driver incidents (accidents, tickets, DUI)
11. Birthday entry
12. Contact information (name, email, phone, address)
13. Offer wall with insurance quotes

---

## 🔄 Data Flow & Architecture

### State Management (Svelte 5 Runes)
```typescript
// Reactive state
let currentStep = $state(1);
let zipCode = $state('');
let vehicles = $state<any[]>([]);

// Component props
let { data } = $props();

// Computed values
let totalSteps = $derived(13);
```

### Data Persistence
**LocalStorage Keys:**
- `savemaxauto_session_id` - Session identifier
- `savemaxauto_cookies` - API session cookies
- `savemaxauto_incomplete_form` - Form data for resume
- `savemaxauto_affiliate_params` - Tracking parameters
- `savemaxauto_trustedform_cert` - TCPA compliance token
- `savemaxauto_jornaya_id` - Lead verification token
- `savemaxauto_city` - Auto-completed city
- `savemaxauto_state` - Auto-completed state

### API Architecture

#### Proxy Pattern (`/api/savemaxauto/proxy`)
**Purpose**: Proxy requests to SaveMaxAuto API to handle CORS and session management

**Endpoints Proxied:**
- `POST /api/v1/session/create` - Initialize session
- `POST /api/v1/auto-insurance/submit` - Submit form data
- `GET /api/v1/check-status` - Poll for offer results
- `GET /api/v1/offers` - Retrieve insurance offers
- `POST /api/v1/auto-insurance/zip-autocomplete` - Get city/state from zip

**Features:**
- Cookie forwarding and management
- Session ID tracking
- Header spoofing (User-Agent, Referer, Origin)
- Request/response logging
- Error handling

#### Server-Side Data Loading (`+page.server.ts`)
```typescript
export const load: PageServerLoad = async ({ request, platform }) => {
  const client = getClientInfo(request, platform);
  return {
    country: client.geo.country,
    region: client.geo.region,
    city: client.geo.city,
    zipcode: client.geo.postalCode
  };
};
```

---

## 🎨 Two Form Versions

### Original Form (`/multistep-form`)
**Design Characteristics:**
- Blue color scheme (`#124476`, `#46c2e8`)
- White background
- Flat buttons with sharp corners
- Traditional form styling
- Tiempos Headline font for headings

### Modern Form (`/multistep-form-mdrn`)
**Design Improvements:**
- **Purple/Pink Gradient Theme**
  - Primary: `#667eea` → `#764ba2`
  - Accent: `#f093fb` → `#f5576c`
- **Gradient Background** - Full-page purple gradient
- **Glassmorphism Header** - Backdrop blur effect
- **Card-Based Layout** - Elevated white card with rounded corners
- **Modern Buttons** - Gradient fills, rounded corners, hover animations
- **Enhanced Inputs** - Rounded borders, gradient focus states
- **Gradient Text** - Headings use `background-clip: text`
- **Smooth Animations** - Scale transforms, cubic-bezier transitions

**Identical Functionality** - Only styling differs, all logic remains the same.

---

## 🔐 Compliance & Tracking

### TCPA Compliance (TrustedForm)
- **Purpose**: Legal proof of consent for TCPA regulations
- **Implementation**: Script loaded in `onMount()`, token captured early
- **Token Storage**: `localStorage` and passed with form submission
- **Form Requirement**: Hidden inputs inside `<form>` element

### Lead Verification (Jornaya LeadiD)
- **Purpose**: Lead quality verification and fraud prevention
- **Implementation**: Script loaded in `onMount()`, token polled
- **Token Storage**: `localStorage` and passed with form submission
- **Polling**: Checks every second for up to 30 seconds

### Affiliate Tracking
**URL Parameters:**
- `c` - Campaign ID (default: `22949`)
- `source` - Traffic source (default: `728557771083`)
- `pcid` - Publisher Click ID
- `pmclid` - Publisher Marketing Click ID

**Implementation:**
```typescript
// Captured from URL on mount
const urlC = queryParams.get('c');
if (urlC) affiliateParams.c = urlC;

// Stored in localStorage
localStorage.setItem('savemaxauto_affiliate_params', JSON.stringify(affiliateParams));

// Included in referer URL for API
const refererUrl = `https://policysidekick.com/auto/?c=${affiliateParams.c}&source=${affiliateParams.source}...`;
```

---

## 🚀 Key Features

### 1. Multi-Vehicle Support
- Add up to 3 vehicles
- Each vehicle has: Year, Make, Model, Trim, Ownership
- Vehicle data fetched from SaveMaxAuto API

### 2. Multi-Driver Support
- Primary driver + additional drivers
- Each driver has: Name, Gender, Birthday, Marital Status, Homeownership, Military Status, Incidents

### 3. Welcome Back Functionality
- Detects incomplete forms in localStorage
- Shows "Welcome Back" screen with saved data
- Allows editing saved information before continuing
- Inline editing for vehicles, drivers, and contact info

### 4. Progress Tracking
- Visual progress bar with percentage
- URL query parameter tracking (`?step=N`)
- Progress bar freezes during vehicle/driver additions
- Browser back/forward button support

### 5. Auto-Complete Features
- **Zip Code**: Auto-fetches city and state
- **Vehicle Make**: Fetches available makes for selected year
- **Vehicle Model**: Fetches models for selected make
- **Vehicle Trim**: Fetches trims for selected model

### 6. Form Validation
- Required field checking
- Email format validation
- Phone number formatting (XXX-XXX-XXXX)
- Birthday validation (age 16+)
- Zip code validation (5 digits)

### 7. Offer Wall
- Displays insurance quotes from multiple providers
- Clickable cards with provider logos
- Tracks offer clicks
- Polls API for offer availability

---

## 🔧 Configuration Files

### `svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    alias: {
      '$lib': './src/lib'
    },
    adapter: adapter({
      platformProxy: {
        configPath: undefined,
        environment: undefined,
        persist: undefined
      }
    })
  }
};
```

### `vite.config.ts`
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

### `wrangler.toml`
```toml
name = "nrv-multistep-form"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".svelte-kit/cloudflare"
```

---

## 💻 Development Workflow

### Commands
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run check    # Type checking with svelte-check
```

### Environment
- **Dev Server**: Vite with HMR
- **Port**: 5173
- **Hot Reload**: Enabled for `.svelte`, `.ts`, `.css` files

---

## 🔌 External Integrations

### SaveMaxAuto API
**Base URL**: `https://savemaxauto.com`

**Key Endpoints:**
- `POST /api/v1/session/create` - Create session
- `POST /api/v1/auto-insurance/submit` - Submit form
- `GET /api/v1/check-status?leadId={id}` - Check submission status
- `GET /api/v1/offers?leadId={id}` - Get offers
- `POST /api/v1/auto-insurance/zip-autocomplete` - Zip lookup
- `GET /api/v1/auto-insurance/makes?year={year}` - Get makes
- `GET /api/v1/auto-insurance/models?makeId={id}` - Get models
- `GET /api/v1/auto-insurance/trims?modelId={id}` - Get trims

**Authentication**: Cookie-based session management

### Google Fonts
- **Roboto**: Weights 400, 500, 600, 700
- **Poppins**: Weights 400, 500, 600, 700

### Custom Fonts
- **Tiempos Headline Medium**: Local font file in `/static/fonts/`

---

## 🎨 Styling Approach

### Hybrid Strategy
1. **Tailwind Utilities** - Layout, spacing, responsive design
2. **Scoped CSS** - Component-specific styles in `<style>` blocks
3. **Inline Styles** - Dynamic values (gradients, transforms)

### Responsive Design
- Mobile-first approach
- Breakpoints: 576px, 768px, 1024px, 1440px
- Grid layouts adapt to screen size
- Touch-friendly button sizes

### Modern CSS Features
- CSS Gradients (`linear-gradient`)
- Backdrop Filters (`backdrop-blur`)
- CSS Transforms (`scale`, `translateY`)
- CSS Transitions (cubic-bezier easing)
- Background-clip (gradient text effect)

---

## 🐛 Known Issues & Solutions

### Issue: Compliance Tokens Not Captured
**Problem**: TrustedForm/Jornaya scripts don't execute when loaded via `{@html}`

**Solution**: Load scripts dynamically in `onMount()`:
```typescript
const trustedFormScript = document.createElement('script');
trustedFormScript.src = 'https://api.trustedform.com/trustedform.js?...';
document.head.appendChild(trustedFormScript);
```

### Issue: City/State Not Persisting
**Problem**: Auto-completed city/state lost on page refresh

**Solution**: Store in localStorage and reload on mount:
```typescript
localStorage.setItem('savemaxauto_city', city);
localStorage.setItem('savemaxauto_state', state);
```

### Issue: Affiliate Params Lost
**Problem**: URL parameters not persisted across sessions

**Solution**: Capture on mount and store in localStorage:
```typescript
const urlC = queryParams.get('c');
if (urlC) affiliateParams.c = urlC;
localStorage.setItem('savemaxauto_affiliate_params', JSON.stringify(affiliateParams));
```

---

## 📊 Data Models

### Vehicle Object
```typescript
{
  year: string;           // "2024"
  make: {
    id: number;
    name: string;         // "Toyota"
  };
  model: {
    id: number;
    name: string;         // "Camry"
  };
  trim: {
    id: number;
    name: string;         // "LE"
    vin: string;          // VIN prefix
  };
  ownership: string;      // "yes" | "no" (own vs lease)
}
```

### Driver Object
```typescript
{
  firstName: string;
  lastName: string;
  gender: string;         // "male" | "female"
  birthdayMonth: string;  // "01" - "12"
  birthdayDay: string;    // "01" - "31"
  birthdayYear: string;   // "1990"
  married: string;        // "yes" | "no"
  homeowner: string;      // "yes" | "no"
  military: string;       // "yes" | "no"
  hadAccident: string;    // "yes" | "no"
  hadTicket: string;      // "yes" | "no"
  hadDUI: string;         // "yes" | "no"
  relationship: string;   // "SELF" | "SPOUSE" | "CHILD" | "OTHER"
}
```

### Form Submission Payload
```typescript
{
  hint: "noRoot",
  jornayaId: string,
  trustedFormCertUrl: string,
  customer: {
    firstName: string,
    lastName: string,
    email: string,
    phone: string,        // Format: XXX-XXX-XXXX
    address: string,
    city: string,
    state: string,
    zip: string
  },
  vehicles: [{
    year: number,
    make: { id: number, name: string },
    model: { id: number, name: string },
    trim: { id: number, name: string, vin: string },
    ownership: "OWN" | "LEASE",
    annualMiles: 12000,
    currentMileage: 50000,
    usedFor: "COMMUTE_WORK",
    collisionDeductible: "1000",
    comprehensiveDeductible: "1000"
  }],
  drivers: [{
    firstName: string,
    lastName: string,
    gender: "MALE" | "FEMALE",
    birthDate: string,    // ISO format
    maritalStatus: "MARRIED" | "SINGLE",
    relationship: string,
    homeAutoBundle: boolean,
    residenceType: "OWN" | "RENT",
    isMilitary: boolean,
    ageLicensed: 16,
    licenseState: string,
    licenseStatus: "ACTIVE",
    creditRating: "GOOD",
    education: "ASSOCIATE",
    sr22: false,
    incidents: []
  }],
  insurance: {
    currentInsuranceCompany: string,
    insuredSince: string,  // ISO date
    expirationDate: string, // ISO date
    currentCoverageType: "STANDARD",
    requestedCoverageType: "PREMIUM",
    requestedBodilyInjuryPerPerson: "100000",
    requestedBodilyInjuryPerIncident: "300000",
    requestedPropertyDamage: 50000
  },
  mainConsent: { consent: true },
  smsConsent: { consent: true },
  fccConsent: { consent: false },
  browserTime: string     // ISO timestamp
}
```

---

## 🔒 Security Considerations

### CORS Handling
- Proxy server handles CORS by acting as intermediary
- Spoofs origin to appear as `savemaxauto.com`

### Cookie Management
- Session cookies stored in localStorage (client-side)
- Forwarded with each API request
- Cleared on session expiration

### Data Privacy
- No sensitive data stored permanently
- LocalStorage cleared on form completion
- TCPA compliance tokens prove consent

---

## 📈 Future Enhancements

### Potential Improvements
1. **Form Analytics** - Track drop-off rates per step
2. **A/B Testing** - Compare original vs modern form performance
3. **Email Verification** - Send verification code
4. **SMS Verification** - Verify phone numbers
5. **Real-time Validation** - API validation as user types
6. **Save & Email** - Email form link to continue later
7. **Multi-language Support** - Spanish translation
8. **Accessibility** - WCAG 2.1 AA compliance
9. **Progressive Web App** - Offline support
10. **Performance Monitoring** - Real user metrics

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] All 13 steps complete successfully
- [ ] Welcome back functionality works
- [ ] Multiple vehicles can be added
- [ ] Multiple drivers can be added
- [ ] Form data persists on refresh
- [ ] Compliance tokens captured
- [ ] Affiliate params tracked
- [ ] Offer wall displays results
- [ ] Mobile responsive design
- [ ] Browser back/forward works

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ⚠️ IE11 (not supported - uses modern CSS)

---

## 📝 Important Notes

### Svelte 5 Migration
This project uses **Svelte 5 runes** (new reactivity system):
- `$state()` - Reactive state
- `$props()` - Component props
- `$derived()` - Computed values
- `$effect()` - Side effects

**Old Svelte syntax NOT used:**
- ~~`let x = 0`~~ → `let x = $state(0)`
- ~~`export let prop`~~ → `let { prop } = $props()`
- ~~`$: computed = x * 2`~~ → `let computed = $derived(x * 2)`

### Cloudflare Platform Access
Server-side code has access to Cloudflare platform APIs:
```typescript
export const load = async ({ request, platform }) => {
  // platform.env - Environment variables
  // platform.context - Request context
  // platform.caches - Cache API
  // platform.cf - Cloudflare request properties
};
```

### File-Based Routing
- `+page.svelte` - Page component
- `+page.server.ts` - Server-side data loading
- `+server.ts` - API endpoint
- `+layout.svelte` - Layout wrapper
- `+error.svelte` - Error page

---

## 🎯 Project Goals

### Primary Objectives
1. ✅ Collect comprehensive user/vehicle data
2. ✅ Submit to SaveMaxAuto API successfully
3. ✅ Display insurance quotes to users
4. ✅ Maintain TCPA compliance
5. ✅ Track affiliate conversions
6. ✅ Provide modern, user-friendly experience

### Success Metrics
- Form completion rate
- Quote generation success rate
- User time-on-page
- Mobile vs desktop usage
- Affiliate conversion tracking

---

## 📞 Support & Resources

### Documentation
- **SvelteKit**: https://kit.svelte.dev/docs
- **Svelte 5**: https://svelte.dev/docs/svelte/overview
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Cloudflare Pages**: https://developers.cloudflare.com/pages

### Repository
- **GitHub**: https://github.com/natepfm/sma
- **Branch**: `nrv-multistep-form`

---

## 🏁 Quick Start for New Developers

### Setup
```bash
# Clone repository
git clone https://github.com/natepfm/sma.git
cd sma

# Checkout correct branch
git checkout nrv-multistep-form

# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
open http://localhost:5173/multistep-form
```

### Key Files to Understand
1. `src/routes/multistep-form/+page.svelte` - Main form logic
2. `src/routes/api/savemaxauto/proxy/+server.ts` - API proxy
3. `src/lib/utils/cloudflareClientInfo.ts` - Geo data extraction
4. `svelte.config.js` - Framework configuration

### Making Changes
1. **Styling**: Edit `<style>` blocks in `.svelte` files or use Tailwind classes
2. **Logic**: Edit `<script>` blocks in `.svelte` files
3. **API**: Modify `+server.ts` files
4. **Config**: Update `svelte.config.js`, `vite.config.ts`, or `wrangler.toml`

---

## 📅 Project Timeline

### Completed Work
- ✅ Original form implementation
- ✅ API proxy setup
- ✅ Multi-vehicle support
- ✅ Multi-driver support
- ✅ Welcome back functionality
- ✅ Compliance tracking (TrustedForm, Jornaya)
- ✅ Affiliate tracking implementation
- ✅ Modern form redesign (`/multistep-form-mdrn`)
- ✅ GitHub repository migration
- ✅ Cloudflare deployment configuration

### Current Status
**Production Ready** - Both form versions are fully functional and deployed.

---

*Last Updated: January 2026*
*Project Version: 1.0.0*
*Tech Stack Version: SvelteKit 2.16.0 + Svelte 5.0*

