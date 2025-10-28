# SaveMaxAuto Multistep Form Clone

## Overview
A faithful recreation of the SaveMaxAuto.com multistep insurance quote form, built with SvelteKit and following company standards.

## Features
- **7-Step Form Flow**: Progressive data collection for better conversion
- **Auto-advance**: Automatically moves to next step after selection
- **Server-Side Geolocation**: Auto-fills ZIP code from Cloudflare geo data
- **Progress Indicator**: Visual progress bar showing current step
- **URL State Management**: Step number in URL for back button support
- **Responsive Design**: Mobile-first, works on all screen sizes
- **SaveMaxAuto Styling**: Matches original design with blue/cyan theme

## Form Steps

### Step 1: ZIP Code Entry
- Auto-filled from server-side geolocation
- Map icon visual
- 5-digit validation
- Arrow indicator

### Step 2: Currently Insured
- Binary choice: Yes / No
- Large card-style buttons
- Radio button visual indicators

### Step 3: Homeowner Status
- Binary choice: Own / Rent
- Same card styling

### Step 4: Gender
- Binary choice: Male / Female
- Same card styling

### Step 5: Marital Status
- Binary choice: Single / Married
- Same card styling

### Step 6: Credit Rating
- 4 options: Excellent / Good / Fair / Poor
- 2-column grid layout
- Same card styling

### Step 7: Number of Vehicles
- 5 options: 1 / 2 / 3 / 4 / 5+
- 3-column grid on desktop, 2-column on mobile
- Same card styling

## Design Specifications

### Colors
- **Primary Blue**: `#01366b` (SaveMaxAuto brand color)
- **Accent Blue**: `#164fe0` (hover/active states)
- **Cyan**: `#47c2e8` (progress bar, buttons)
- **Background**: `#fbfbfb` (light gray)
- **Text Dark**: `#000e1b` (headlines)
- **Text Light**: `#858f97` (secondary text)
- **Border**: `#dde0e4` (card borders)

### Typography
- **Font Family**: Rubik (Google Fonts)
- **Headline**: 32px mobile, 48px desktop, bold
- **Body**: 18px, regular/semibold
- **Progress**: 14px mobile, 14px desktop

### Layout
- **Max Width**: 1240px (main container)
- **Form Width**: 740px (content max-width)
- **Card Width**: 452px (single column)
- **Grid**: 924px (two-column max-width)

### Interactions
- **Auto-advance**: 300ms delay after selection
- **Hover State**: Blue background, white text, shadow
- **Active State**: Same as hover, persists
- **Transitions**: 300ms ease for all state changes

## Technical Implementation

### Company Standards Applied
- ✅ 4-line onMount pattern
- ✅ Title as string (not array)
- ✅ Server-side geo detection
- ✅ setupTracking() for URL generation
- ✅ GoogleFooter + Disclaimer components
- ✅ No console.log statements
- ✅ HTML5 validation
- ✅ Tracking domain: drivepolicypro.com

### State Management
```typescript
let currentStep = $state(1);
let zipCode = $state(data.zipcode || '');
let currentlyInsured = $state<string>('');
let homeowner = $state<string>('');
// ... etc
```

### URL State
- Steps tracked in URL: `?step=1`, `?step=2`, etc.
- Browser back button support
- Deep linking support

### Auto-Advance Logic
```typescript
function selectOption(value: string, field: string) {
  // Update state
  // Auto-advance after 300ms
  setTimeout(() => nextStep(), 300);
}
```

## URL Parameters

### Standard Parameters (Handled by setupTracking)
- `cid` - Campaign ID
- `lid` - Lead ID
- `fid` - Flow ID

### Custom Parameters
- `t` - Custom title override
- `step` - Current step (1-7)

## Tracking Domain
- **Primary**: `drivepolicypro.com`

## Test URLs

**Base URL (Step 1):**
```
http://localhost:5174/nrv/multistep-form
```

**Specific Step:**
```
http://localhost:5174/nrv/multistep-form?step=3
```

**With Custom Title:**
```
http://localhost:5174/nrv/multistep-form?t=Get+Lower+Rates
```

**With Tracking Params:**
```
http://localhost:5174/nrv/multistep-form?cid=123&lid=456&fid=789
```

## Form Flow Diagram

```
Step 1: ZIP Code Entry
    ↓
Step 2: Currently Insured? (Yes/No)
    ↓
Step 3: Own or Rent? (Own/Rent)
    ↓
Step 4: Gender? (Male/Female)
    ↓
Step 5: Marital Status? (Single/Married)
    ↓
Step 6: Credit Rating? (Excellent/Good/Fair/Poor)
    ↓
Step 7: Number of Vehicles? (1/2/3/4/5+)
    ↓
Submit → Redirect to tracking URL
```

## Components Used
- `setupTracking` - Tracking URL generation
- `parseTitle` - Title parsing utility
- `Disclaimer` - Standard disclaimer component
- `GoogleFooter` - Standard footer component
- `getClientInfo` - Server-side geo detection

## Browser Compatibility
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS 14+)
- Mobile Chrome (Android 10+)

## Performance
- Server-side rendering (SSR)
- Auto-filled ZIP from geo detection
- Smooth transitions and animations
- Minimal JavaScript
- Fast page loads

## Future Enhancements
- [ ] Add education level step
- [ ] Add vehicle details steps
- [ ] Add driver information steps
- [ ] Add insurance history steps
- [ ] Progress save/restore functionality
- [ ] Analytics tracking per step
- [ ] A/B testing variants

## Original Source
Cloned from: https://savemaxauto.com/form/?step=prefill

## Last Updated
October 21, 2025

