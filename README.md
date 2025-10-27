# NRV Multistep Form - Standalone Project

This is a standalone version of the NRV multistep form, ready for deployment to GitLab and Cloudflare Pages.

## Project Structure

```
nrv-multistep-form-deploy/
├── src/
│   ├── routes/
│   │   └── multistep-form/
│   │       ├── +page.svelte          # Main form page
│   │       └── +page.server.ts       # Server-side data loading
│   ├── lib/
│   │   ├── components/
│   │   │   └── google/
│   │   │       ├── Disclaimer.svelte  # Disclaimer component
│   │   │       └── GoogleFooter.svelte # Footer component
│   │   └── utils/
│   │       ├── parseTitle.ts          # Title parsing utility
│   │       ├── pixels.ts              # Tracking pixel utility
│   │       ├── cloudflareClientInfo.ts # Cloudflare geo info
│   │       ├── isLocalEnv.ts          # Environment detection
│   │       └── getTracking.ts         # Tracking domain utility
│   └── app.html                       # HTML template
├── static/
│   ├── fonts/
│   │   └── TiemposHeadline-Medium.otf # Custom font
│   └── nrv/
│       └── snapchat-landers/          # NRV assets
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── wrangler.toml                      # Cloudflare Pages config

```

## Dependencies

All required dependencies are listed in `package.json`:
- SvelteKit with Cloudflare adapter
- Tailwind CSS v4
- TypeScript
- Wrangler CLI for deployment

## Setup & Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Cloudflare Pages

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy
```

## Key Features

- Multi-step insurance form
- Auto-save to localStorage
- ZIP code validation
- Vehicle information lookup via API
- Tracking pixel integration
- Cloudflare geo-location support
- Google-compliant disclaimer and footer

## API Endpoints

The form interacts with external APIs for:
- Vehicle year/make/model data
- Offer wall integration
- Session tracking
- Lead submission

## Environment

Optimized for Cloudflare Pages with:
- Edge runtime support
- nodejs_compat flag enabled
- Geographic data access via Cloudflare
