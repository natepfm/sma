<script lang="ts">
  import { onMount } from 'svelte';
  import { parseTitle } from '$lib/utils/parseTitle';
  import { setupTracking } from '$lib/utils/pixels';
  import Disclaimer from '$lib/components/google/Disclaimer.svelte';
  import GoogleFooter from '$lib/components/google/GoogleFooter.svelte';
  
  // Get server-side data
  let { data } = $props();
  
  let title = $state<string>("");
  let url = $state<string>("");
  let currentStep = $state(1);
  
  // Store tracking parameters to preserve across steps
  let trackingParams = $state<string>("");
  
  // Session data
  let sessionData = $state<any>(null);
  let sessionId = $state<string>('');
  let leadId = $state<string>('');
  let offerAds = $state<any[]>([]);
  let sessionCookies = $state<string[]>([]);
  
  // Single incomplete form data support
  let savedFormData = $state<any>(null);
  let showWelcomeBack = $state<boolean>(false);
  let showSavedInfo = $state<boolean>(false);

  // Load session and incomplete form from localStorage on client
  if (typeof window !== 'undefined') {
    const storedSessionId = localStorage.getItem('savemaxauto_session_id');
    if (storedSessionId) {
      sessionId = storedSessionId;
    }

    const storedCookies = localStorage.getItem('savemaxauto_cookies');
    if (storedCookies) {
      try {
        sessionCookies = JSON.parse(storedCookies);
      } catch (e) {
        sessionCookies = [];
      }
    }

    const storedFormData = localStorage.getItem('savemaxauto_incomplete_form');
    if (storedFormData) {
      try {
        const parsedData = JSON.parse(storedFormData);
        // Only show welcome back if form is incomplete (not at step 11 or beyond)
        if (parsedData && parsedData.currentStep < 11 && parsedData.currentStep > 1) {
          savedFormData = parsedData;
          showWelcomeBack = true;
        }
      } catch (e) {
        savedFormData = null;
      }
    }
  }
  
  // Form data - matching SaveMaxAuto exactly
  let zipCode = $state(''); // Start empty, only show placeholder
  let city = $state<string>('');
  let state = $state<string>('');
  let vehicleYear = $state<string>('');
  let vehicleMake = $state<any>(null); // {id, name}
  let vehicleModel = $state<any>(null); // {id, name}
  let vehicleTrim = $state<any>(null); // {id, name, vin}
  let ownsVehicle = $state<string>('yes'); // Default to YES
  let currentInsurance = $state<string>('ALLSTATE INSURANCE'); // Default to first option
  let gender = $state<string>('male'); // Default to MALE
  let married = $state<string>('yes'); // Default to YES
  let homeowner = $state<string>('yes'); // Default to YES
  let military = $state<string>('no'); // Default to NO
  let hadAccident = $state<string>('no'); // Default to NO
  let hadTicket = $state<string>('no'); // Default to NO
  let hadDUI = $state<string>('no'); // Default to NO
  let birthdayMonth = $state<string>('');
  let birthdayDay = $state<string>('');
  let birthdayYear = $state<string>('');
  let monthFocused = $state<boolean>(false);
  let dayFocused = $state<boolean>(false);
  let yearFocused = $state<boolean>(false);
  let firstName = $state<string>('');
  let lastName = $state<string>('');
  let email = $state<string>('');
  let phone = $state<string>('');
  let address = $state<string>('');
  
  // Input focus states for Step 10
  let firstNameFocused = $state<boolean>(false);
  let lastNameFocused = $state<boolean>(false);
  
  // Input focus states for Step 11 (Contact Info)
  let addressFocused = $state<boolean>(false);
  let emailFocused = $state<boolean>(false);
  let phoneFocused = $state<boolean>(false);
  
  // Add another driver question
  let addAnotherDriver = $state<string>('no');
  
  // Multi-driver support
  let drivers = $state<any[]>([]); // Array to store all drivers
  let currentDriverIndex = $state<number>(0); // 0 = first driver, 1 = second, etc.
  let relationship = $state<string>('PARENT'); // Default relationship for additional drivers
  let progressBarFrozen = $state<boolean>(false); // Freeze progress when adding additional drivers
  let frozenProgressStep = $state<number>(0); // Step number where progress was frozen
  let primaryDriverName = $state<string>(''); // Store first driver's name for contact info heading
  
  // Multi-vehicle support
  let vehicles = $state<any[]>([]); // Array to store all vehicles
  let currentVehicleIndex = $state<number>(0); // 0 = first vehicle, 1 = second, etc.
  let addAnotherVehicle = $state<string>('no'); // Add another vehicle question
  let vehicleProgressFrozen = $state<boolean>(false); // Freeze progress when adding additional vehicles
  let frozenVehicleProgressStep = $state<number>(0); // Step number where vehicle progress was frozen
  
  // API-loaded vehicle data
  let vehicleYears = $state<number[]>([]);
  let vehicleMakes = $state<any[]>([]);
  let vehicleModels = $state<any[]>([]);
  let vehicleTrims = $state<any[]>([]);
  
  const insuranceCompanies = ['AAA INSURANCE CO', 'ALLSTATE INSURANCE', 'FARM BUREAU/FARM FAMILY/RURAL', 'FARMERS INSURANCE', 'GEICO', 'HART ACCIDENT AND INDEMNITY', 'NATIONWIDE GENERAL INSURANCE', 'PROGRESSIVE', 'SAFECO', 'STATE FARM COUNTY', 'USAA', 'OTHER', 'NOT INSURED'];
  
  // Total steps in form:
  // 1: ZIP Code
  // 2: Vehicle Year
  // 3: Vehicle Make
  // 4: Vehicle Model
  // 5: Own Vehicle
  // 5.5: Add Another Vehicle? (NEW - matches external form at 27% progress)
  // 6: Insurance Company
  // 7: Personal Info (Gender, Married, Homeowner, Military)
  // 8: Driving History (Accident, Ticket, DUI)
  // 9: Birthday
  // 10: Name
  // 11: Add Another Driver?
  // 12: Contact Info (Address, Email, Phone) [if No to add driver]
  // 13: Offer Wall
  const totalSteps = 13;

  // ZIP code validation
  let zipCodeError = $state<string>('');

  // List of valid US ZIP code ranges (simplified - first digit ranges)
  // US ZIP codes range from 00501 to 99950
  function isValidUSZipCode(zip: string): boolean {
    // Must be exactly 5 digits
    if (!/^\d{5}$/.test(zip)) {
      return false;
    }

    const zipNum = parseInt(zip);

    // Valid US ZIP code ranges (00501 to 99950)
    // Exclude invalid ranges
    if (zipNum < 501 || zipNum > 99950) {
      return false;
    }

    // Additional validation: check against known invalid prefixes
    const prefix = zip.substring(0, 3);
    const firstTwo = zip.substring(0, 2);

    // Known invalid or non-existent ZIP code prefixes
    const invalidPrefixes = ['095', '096', '097', '098', '099', '213', '269', '343', '348', '353', '419', '429', '517', '518', '519', '529', '533', '536', '552', '568', '578', '579', '589', '621', '632', '642', '643', '659', '663', '682', '694', '695', '696', '697', '698', '699'];

    if (invalidPrefixes.includes(prefix)) {
      return false;
    }

    return true;
  }

  function validateZipCode(zip: string): string {
    // Only allow numeric input
    const numericValue = zip.replace(/\D/g, '');

    // Limit to 5 digits
    if (numericValue.length > 5) {
      return zipCode; // Don't update if trying to enter more than 5 digits
    }

    // Clear error while typing (user is correcting)
    if (zipCodeError && numericValue.length < 5) {
      zipCodeError = '';
    }

    // Validate when 5 digits are entered
    if (numericValue.length === 5) {
      if (!isValidUSZipCode(numericValue)) {
        zipCodeError = 'Please enter a valid US ZIP code';
      } else {
        zipCodeError = '';
      }
    }

    return numericValue;
  }

  // Date validation functions
  function validateMonth(value: string) {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';

    const num = parseInt(numericValue);
    // Auto-correct to valid range (1-12)
    if (num > 12) {
      return '12';
    } else if (num < 1 && numericValue.length >= 2) {
      return '01';
    }
    return numericValue;
  }

  function validateDay(value: string) {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';

    const num = parseInt(numericValue);
    // Auto-correct to valid range (1-31)
    if (num > 31) {
      return '31';
    } else if (num < 1 && numericValue.length >= 2) {
      return '01';
    }
    return numericValue;
  }

  function validateYear(value: string) {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';

    const currentYear = new Date().getFullYear();

    // If 4 digits entered, validate range
    if (numericValue.length === 4) {
      const num = parseInt(numericValue);
      // Auto-correct to reasonable range (1900 - current year)
      if (num > currentYear) {
        return currentYear.toString();
      } else if (num < 1900) {
        return '1900';
      }
    }
    return numericValue;
  }

  // API Functions - Using our proxy to handle SaveMaxAuto API calls
  async function createSession() {
    try {
      const response = await fetch('/api/savemaxauto/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/v1/create-session',
          method: 'POST',
          payload: {
            redirectOrigin: 'https://s.civilcarcoverage.com/',
            refererUrl: 'https://savemaxauto.com/form/',
            supportsCookies: true
          },
          sessionId: sessionId || undefined,
          cookies: sessionCookies
        })
      });
      const result = await response.json();
      
      if (result.success && result.sessionId) {
        sessionId = result.sessionId;
        // Store in localStorage
        localStorage.setItem('savemaxauto_session_id', sessionId);
        localStorage.setItem('savemaxauto_session_data', JSON.stringify(result.data));
      }
      
      // Store cookies from response
      if (result.cookies) {
        sessionCookies = result.cookies;
        localStorage.setItem('savemaxauto_cookies', JSON.stringify(sessionCookies));
      }
      
      return result.data;
    } catch (error) {
      console.error('Session creation error:', error);
      return null;
    }
  }
  
  async function getSession() {
    try {
      const endpointUrl = `/api/v1/session`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data?.session) {
        sessionData = result.data.session;
        localStorage.setItem('savemaxauto_session_data', JSON.stringify(sessionData));
      }
      
      return result.data;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
  
  async function autoCompleteZip(zip: string) {
    try {
      const response = await fetch('/api/savemaxauto/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/v1/auto-complete-zip',
          method: 'POST',
          payload: { zip },
          sessionId,
          cookies: sessionCookies
        })
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        city = result.data.city || '';
        state = result.data.state || '';
        // Store in localStorage
        localStorage.setItem('savemaxauto_city', city);
        localStorage.setItem('savemaxauto_state', state);
      }
      
      // Store cookies from response
      if (result.cookies) {
        sessionCookies = result.cookies;
        localStorage.setItem('savemaxauto_cookies', JSON.stringify(sessionCookies));
      }
      
      return result.data;
    } catch (error) {
      console.error('Zip lookup error:', error);
      return null;
    }
  }
  
  async function fetchVehicleYears() {
    try {
      const endpointUrl = `/api/v1/auto-insurance/lookup/year`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data?.years) {
        vehicleYears = result.data.years;
        localStorage.setItem('savemaxauto_years', JSON.stringify(vehicleYears));
      } else {
        vehicleYears = Array.from({ length: 36 }, (_, i) => 2025 - i);
      }
      
      return result.data;
    } catch (error) {
      console.error('Year lookup error:', error);
      vehicleYears = Array.from({ length: 36 }, (_, i) => 2025 - i);
      return null;
    }
  }
  
  async function fetchVehicleMakes(year: string) {
    try {
      const endpointUrl = `/api/v1/auto-insurance/lookup/make?year=${year}`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data?.makes) {
        vehicleMakes = result.data.makes;
        localStorage.setItem('savemaxauto_makes', JSON.stringify(vehicleMakes));
      }
      
      return result.data;
    } catch (error) {
      console.error('Make lookup error:', error);
      return null;
    }
  }
  
  async function fetchVehicleModels(year: string, makeId: number) {
    try {
      const endpointUrl = `/api/v1/auto-insurance/lookup/model?year=${year}&makeId=${makeId}`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      console.log('Models API response:', result);
      console.log('Result.data keys:', result.data ? Object.keys(result.data) : 'no data');
      console.log('Result.data:', result.data);
      
      // Check multiple possible response structures
      if (result.success) {
        // Try result.data.models first
        if (result.data?.models && Array.isArray(result.data.models)) {
          vehicleModels = result.data.models;
          console.log('Found at result.data.models');
        }
        // Try result.data directly (if it's an array)
        else if (Array.isArray(result.data)) {
          vehicleModels = result.data;
          console.log('Found at result.data (is array)');
        }
        // Maybe it's at result.data.data.models?
        else if (result.data?.data?.models) {
          vehicleModels = result.data.data.models;
          console.log('Found at result.data.data.models');
        }
        // Last resort: check all properties
        else if (result.data && typeof result.data === 'object') {
          console.log('Checking all properties of result.data:', Object.entries(result.data));
          vehicleModels = [];
        }
        
        console.log('Loaded models:', vehicleModels.length, vehicleModels.slice(0, 3));
        if (vehicleModels.length > 0) {
          localStorage.setItem('savemaxauto_models', JSON.stringify(vehicleModels));
        }
      }
      
      return result.data;
    } catch (error) {
      console.error('Model lookup error:', error);
      return null;
    }
  }
  
  async function fetchVehicleTrims(modelId: number) {
    try {
      const endpointUrl = `/api/v1/auto-insurance/lookup/trim?modelId=${modelId}`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data?.trims) {
        vehicleTrims = result.data.trims;
        localStorage.setItem('savemaxauto_trims', JSON.stringify(vehicleTrims));
      }
      
      return result.data;
    } catch (error) {
      console.error('Trim lookup error:', error);
      return null;
    }
  }
  
  async function submitForm() {
    try {
      // Build payload matching SaveMaxAuto structure
      // Fix phone format: remove all non-digits
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Fix insurance company name: replace spaces with underscores
      const cleanInsuranceCompany = currentInsurance.replace(/ /g, '_');
      
      // Calculate dates
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setFullYear(today.getFullYear() + 1);
      const insuredDate = new Date(today);
      insuredDate.setMonth(today.getMonth() - 6);
      
      // Get compliance tokens from hidden inputs (TrustedForm and Jornaya)
      const trustedFormCertUrl = (typeof document !== 'undefined' && document.getElementById('xxTrustedFormCertUrl')) 
        ? (document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement)?.value || '' 
        : '';
      const jornayaId = (typeof window !== 'undefined' && (window as any).LeadiD?.token) 
        ? (window as any).LeadiD.token 
        : '';
      
      // Build vehicles array from saved vehicles
      // If no vehicles saved yet, use current vehicle fields (backward compatibility)
      let vehiclesArray = [];
      if (vehicles.length > 0) {
        // Use saved vehicles array
        vehiclesArray = vehicles.map(vehicle => {
          const trim = vehicle.trim || {
            id: 0,
            name: "Not Sure",
            vin: "XXXXXXXXXXXXXXXXX"
          };
          return {
            annualMiles: 12000,
            collisionDeductible: "1000",
            comprehensiveDeductible: "1000",
            currentMileage: 50000,
            make: vehicle.make ? { id: vehicle.make.id, name: vehicle.make.name } : null,
            model: vehicle.model ? { id: vehicle.model.id, name: vehicle.model.name } : null,
            ownership: vehicle.ownership === 'yes' ? 'OWN' : 'LEASE',
            trim: trim ? { id: trim.id, name: trim.name, vin: trim.vin } : null,
            usedFor: "COMMUTE_WORK",
            year: parseInt(vehicle.year)
          };
        });
      } else {
        // Fallback to current vehicle fields (backward compatibility)
        const selectedTrim = vehicleTrim || (vehicleTrims.length > 0 ? vehicleTrims[0] : {
          id: 0,
          name: "Not Sure",
          vin: "XXXXXXXXXXXXXXXXX"
        });
        vehiclesArray = [{
          annualMiles: 12000,
          collisionDeductible: "1000",
          comprehensiveDeductible: "1000",
          currentMileage: 50000,
          make: vehicleMake ? { id: vehicleMake.id, name: vehicleMake.name } : null,
          model: vehicleModel ? { id: vehicleModel.id, name: vehicleModel.name } : null,
          ownership: ownsVehicle === 'yes' ? 'OWN' : 'LEASE',
          trim: selectedTrim ? { id: selectedTrim.id, name: selectedTrim.name, vin: selectedTrim.vin } : null,
          usedFor: "COMMUTE_WORK",
          year: parseInt(vehicleYear)
        }];
      }
      
      const payload = {
        hint: "noRoot",
        jornayaId: jornayaId,
        trustedFormCertUrl: trustedFormCertUrl,
        customer: {
          firstName,
          lastName,
          email,
          phone: cleanPhone,
          address,
          city,
          state,
          zip: zipCode
        },
        vehicles: vehiclesArray,
        drivers: drivers.map((driver, index) => ({
          homeAutoBundle: driver.homeowner === 'yes',
          ageLicensed: 16,
          birthDate: `${driver.birthdayYear}-${driver.birthdayMonth.padStart(2, '0')}-${driver.birthdayDay.padStart(2, '0')}T00:00:00.000Z`,
          creditRating: "GOOD",
          education: "ASSOCIATE",
          firstName: driver.firstName,
          gender: (driver.gender || 'male').toUpperCase(),
          incidents: driver.hadAccident === 'yes' ? [{type: 'ACCIDENT', date: new Date().toISOString(), description: 'OTHER'}] : [],
          lastName: driver.lastName,
          licenseState: state,
          licenseStatus: "ACTIVE",
          maritalStatus: driver.married === 'yes' ? 'MARRIED' : 'SINGLE',
          relationship: driver.relationship || 'SELF',
          residenceType: driver.homeowner === 'yes' ? 'OWN' : 'RENT',
          sr22: false,
          isMilitary: driver.military === 'yes'
        })),
        insurance: {
          requestedCoverageType: "PREMIUM",
          requestedBodilyInjuryPerPerson: "100000",
          requestedBodilyInjuryPerIncident: "300000",
          requestedPropertyDamage: 50000,
          currentInsuranceCompany: cleanInsuranceCompany,
          expirationDate: futureDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
          insuredSince: insuredDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
          currentCoverageType: "STANDARD"
        },
        mainConsent: { consent: true },
        smsConsent: { consent: true },
        fccConsent: { consent: false },
        browserTime: new Date().toISOString()
      };
      
      const response = await fetch('/api/savemaxauto/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/api/v1/auto-insurance/submit',
          method: 'POST',
          payload,
          sessionId,
          cookies: sessionCookies
        })
      });
      
      const result = await response.json();
      
      console.log('Submit response:', result);
      console.log('Submit payload sent:', payload);
      
      if (result.success && result.data?.leadId) {
        leadId = result.data.leadId;
        localStorage.setItem('savemaxauto_leadId', leadId);
        console.log('LeadId received:', leadId);
      } else {
        console.error('Submit failed or no leadId:', result);
      }
      
      // Store cookies from response
      if (result.cookies) {
        sessionCookies = result.cookies;
        localStorage.setItem('savemaxauto_cookies', JSON.stringify(sessionCookies));
      }
      
      return result.data;
    } catch (error) {
      console.error('Submit error:', error);
      return null;
    }
  }
  
  async function checkStatus(checkLeadId: string) {
    try {
      const endpointUrl = `/api/v1/check-status?leadId=${checkLeadId}`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Check status error:', error);
      return null;
    }
  }
  
  async function pollLeadStatus(checkLeadId: string, maxAttempts = 10, intervalMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const statusData = await checkStatus(checkLeadId);
      
      if (statusData) {
        const status = statusData.status;
        
        if (status === 'ACCEPTED' || status === 'REJECTED') {
          return statusData;
        }
      }
      
      // Wait before next poll (except on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // Timeout - return last status or null
    return { status: 'TIMEOUT' };
  }
  
  async function fetchOfferWall() {
    try {
      const endpointUrl = `/api/v1/lp/ads?leadId=${leadId}`;
      const cookiesParam = encodeURIComponent(JSON.stringify(sessionCookies));
      const response = await fetch(`/api/savemaxauto/proxy?endpoint=${encodeURIComponent(endpointUrl)}&sessionId=${sessionId}&cookies=${cookiesParam}`);
      const result = await response.json();
      
      if (result.success && result.data?.ads) {
        offerAds = result.data.ads;
        localStorage.setItem('savemaxauto_offers', JSON.stringify(offerAds));
      }
      
      return result.data;
    } catch (error) {
      console.error('Offer wall error:', error);
      return null;
    }
  }
  
  // Save current form data (single incomplete form)
  function saveCurrentDriver() {
    const formData = {
      zipCode,
      city,
      state,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleTrim,
      ownsVehicle,
      currentInsurance,
      gender,
      married,
      homeowner,
      military,
      hadAccident,
      hadTicket,
      hadDUI,
      birthdayMonth,
      birthdayDay,
      birthdayYear,
      firstName,
      lastName,
      email,
      phone,
      address,
      currentStep,
      vehicles,
      currentVehicleIndex,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('savemaxauto_incomplete_form', JSON.stringify(formData));
  }
  
  // Save current vehicle to vehicles array
  function saveCurrentVehicle() {
    const currentVehicle = {
      year: vehicleYear,
      make: vehicleMake,
      model: vehicleModel,
      trim: vehicleTrim,
      ownership: ownsVehicle
    };
    
    // Add or update current vehicle in array
    if (vehicles[currentVehicleIndex]) {
      vehicles[currentVehicleIndex] = currentVehicle;
    } else {
      vehicles.push(currentVehicle);
    }
    
    // Save to localStorage
    localStorage.setItem('savemaxauto_vehicles', JSON.stringify(vehicles));
  }
  
  // Reset vehicle fields for next vehicle entry
  function resetVehicleFields() {
    vehicleYear = '';
    vehicleMake = null;
    vehicleModel = null;
    vehicleTrim = null;
    ownsVehicle = 'yes';
    vehicleMakes = [];
    vehicleModels = [];
    vehicleTrims = [];
  }
  
  // Load saved form data when user returns
  function loadSavedData() {
    if (savedFormData) {
      zipCode = savedFormData.zipCode || '';
      city = savedFormData.city || '';
      state = savedFormData.state || '';
      vehicleYear = savedFormData.vehicleYear || '';
      vehicleMake = savedFormData.vehicleMake || null;
      vehicleModel = savedFormData.vehicleModel || null;
      vehicleTrim = savedFormData.vehicleTrim || null;
      ownsVehicle = savedFormData.ownsVehicle || '';
      currentInsurance = savedFormData.currentInsurance || '';
      gender = savedFormData.gender || '';
      married = savedFormData.married || '';
      homeowner = savedFormData.homeowner || '';
      military = savedFormData.military || '';
      hadAccident = savedFormData.hadAccident || '';
      hadTicket = savedFormData.hadTicket || '';
      hadDUI = savedFormData.hadDUI || '';
      birthdayMonth = savedFormData.birthdayMonth || '';
      birthdayDay = savedFormData.birthdayDay || '';
      birthdayYear = savedFormData.birthdayYear || '';
      firstName = savedFormData.firstName || '';
      lastName = savedFormData.lastName || '';
      email = savedFormData.email || '';
      phone = savedFormData.phone || '';
      address = savedFormData.address || '';
      currentStep = savedFormData.currentStep || 1;
      vehicles = savedFormData.vehicles || [];
      currentVehicleIndex = savedFormData.currentVehicleIndex || 0;
      showWelcomeBack = false;
    }
  }

  // Start new quote (clear saved data)
  function startNewQuote() {
    localStorage.removeItem('savemaxauto_incomplete_form');
    localStorage.removeItem('savemaxauto_drivers');
    savedFormData = null;
    showWelcomeBack = false;
    currentStep = 1;
    // Reset all form fields with defaults
    zipCode = '';
    zipCodeError = '';
    city = '';
    state = '';
    vehicleYear = '';
    vehicleMake = null;
    vehicleModel = null;
    vehicleTrim = null;
    ownsVehicle = 'yes';
    currentInsurance = 'ALLSTATE INSURANCE';
    gender = 'male';
    married = 'yes';
    homeowner = 'yes';
    military = 'no';
    hadAccident = 'no';
    hadTicket = 'no';
    hadDUI = 'no';
    birthdayMonth = '';
    birthdayDay = '';
    birthdayYear = '';
    relationship = 'PARENT';
    addAnotherDriver = 'no';
    drivers = [];
    currentDriverIndex = 0;
    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    address = '';
  }
  
  onMount(async () => {
    url = await Promise.resolve(setupTracking("drivepolicypro.com"));
    const queryParams = new URLSearchParams(window.location.search);
    const titleQuery = queryParams.get("t") ?? "";
    title = parseTitle(titleQuery).join(" ");
    
    // Capture all tracking parameters to preserve across steps
    const params = new URLSearchParams(window.location.search);
    params.delete('step'); // Remove step param as we'll manage it separately
    trackingParams = params.toString();
    
    // Check if step is in URL, default to 1 (landing page)
    const stepParam = queryParams.get("step");
    if (stepParam && !isNaN(parseInt(stepParam))) {
      currentStep = parseInt(stepParam);
    } else {
      currentStep = 1; // Landing page
    }
    
    // DON'T create session on mount - wait for user to click GET STARTED
    // Load vehicle years for when they get to step 2
    vehicleYears = Array.from({ length: 36 }, (_, i) => 2025 - i);
  });
  
  async function nextStep() {
    // Validation for Step 1: ZIP Code
    if (currentStep === 1) {
      if (!zipCode || zipCode.length !== 5) {
        zipCodeError = 'Please enter a valid ZIP code';
        return;
      }
      if (!isValidUSZipCode(zipCode)) {
        zipCodeError = 'Please enter a valid ZIP code';
        return;
      }
      // Clear error if validation passes
      zipCodeError = '';
    }

    // Validation for required fields
    if (currentStep === 10) {
      if (!firstName || !lastName || firstName.trim() === '' || lastName.trim() === '') {
        alert('Please enter your first and last name');
        return;
      }
      // For additional drivers, relationship is required
      if (currentDriverIndex > 0 && !relationship) {
        alert('Please select your relationship to the primary driver');
        return;
      }
    }

    if (currentStep === 9 && (!birthdayMonth || !birthdayDay || !birthdayYear || birthdayMonth.length !== 2 || birthdayDay.length !== 2 || birthdayYear.length !== 4)) {
      alert('Please enter a complete birthday');
      return;
    }
    
    if (currentStep === 12 && (!address || !email || !phone || address.trim() === '' || email.trim() === '' || phone.trim() === '')) {
      alert('Please enter your address, email, and phone number');
      return;
    }
    
    // Save current driver data after each step
    saveCurrentDriver();
    
    // Special handling for step 1: ZIP code entry - create session and get city/state
    if (currentStep === 1) {
      await createSession();
      await getSession();
      await autoCompleteZip(zipCode);
      await fetchVehicleYears(); // Load years after session is created
    }
    
    // Step 5: After "Own Vehicle", save current vehicle before proceeding
    if (currentStep === 5) {
      saveCurrentVehicle();
    }
    
    // Step 5.5: Handle "Add another vehicle?" logic (NEW - matches external form)
    if (currentStep === 5.5) {
      if (addAnotherVehicle === 'yes') {
        // Current vehicle already saved at step 5
        
        // Freeze progress bar at 27% (step 5.5)
        if (!vehicleProgressFrozen) {
          vehicleProgressFrozen = true;
          frozenVehicleProgressStep = currentStep;
        }
        
        // Increment vehicle index
        currentVehicleIndex++;
        
        // Reset vehicle fields for next vehicle
        resetVehicleFields();
        
        // Go to Step 2 (Vehicle Year) for additional vehicles
        currentStep = 2;
        const newUrl = trackingParams ? `?${trackingParams}&step=2` : `?step=2`;
        window.history.pushState({}, '', newUrl);
        
        // Save to localStorage
        localStorage.setItem('savemaxauto_vehicles', JSON.stringify(vehicles));
        return;
      } else {
        // If No, unfreeze progress bar and continue to Insurance Company (Step 6)
        vehicleProgressFrozen = false;
      }
    }
    
    // Step 11: Handle "Add another driver?" logic
    if (currentStep === 11) {
      if (addAnotherDriver === 'yes') {
        // Save current driver to drivers array before starting next driver
        const currentDriver = {
          gender,
          married,
          homeowner,
          military,
          hadAccident,
          hadTicket,
          hadDUI,
          birthdayMonth,
          birthdayDay,
          birthdayYear,
          firstName,
          lastName,
          relationship: currentDriverIndex === 0 ? 'SELF' : relationship
        };
        
        // Add or update current driver in array
        if (drivers[currentDriverIndex]) {
          drivers[currentDriverIndex] = currentDriver;
        } else {
          drivers.push(currentDriver);
        }
        
        // Save primary driver's name (first driver only)
        if (currentDriverIndex === 0) {
          primaryDriverName = firstName;
        }
        
        // Freeze progress bar at current step
        if (!progressBarFrozen) {
          progressBarFrozen = true;
          frozenProgressStep = currentStep;
        }
        
        // Increment driver index
        currentDriverIndex++;
        
        // Reset driver-specific fields for next driver
        gender = 'male';
        married = 'yes';
        homeowner = 'yes';
        military = 'no';
        hadAccident = 'no';
        hadTicket = 'no';
        hadDUI = 'no';
        birthdayMonth = '';
        birthdayDay = '';
        birthdayYear = '';
        firstName = '';
        lastName = '';
        relationship = 'PARENT';
        
        // Go to Step 7 (Gender) for additional drivers (skip vehicle questions)
        currentStep = 7;
        const newUrl = trackingParams ? `?${trackingParams}&step=7` : `?step=7`;
        window.history.pushState({}, '', newUrl);
        
        // Save to localStorage
        localStorage.setItem('savemaxauto_drivers', JSON.stringify(drivers));
        return;
      } else {
        // If No, save final driver and continue to contact info (Step 12)
        const currentDriver = {
          gender,
          married,
          homeowner,
          military,
          hadAccident,
          hadTicket,
          hadDUI,
          birthdayMonth,
          birthdayDay,
          birthdayYear,
          firstName,
          lastName,
          relationship: currentDriverIndex === 0 ? 'SELF' : relationship
        };
        
        // Add or update current driver in array
        if (drivers[currentDriverIndex]) {
          drivers[currentDriverIndex] = currentDriver;
        } else {
          drivers.push(currentDriver);
        }
        
        // Save primary driver's name if this is the first (and only) driver
        if (currentDriverIndex === 0) {
          primaryDriverName = firstName;
        }
        
        // Unfreeze progress bar (we're moving to contact info now)
        progressBarFrozen = false;
        
        localStorage.setItem('savemaxauto_drivers', JSON.stringify(drivers));
      }
    }
    
    // Step 12: Submit form and get leadId (before offer wall)
    if (currentStep === 12) {
      // Validate required fields before submission
      if (!city || !state) {
        console.log('City/state missing, re-running ZIP lookup');
        await autoCompleteZip(zipCode);
      }
      
      // If still empty after retry, show error and don't proceed
      if (!city || !state) {
        console.error('Cannot submit: city/state are required');
        alert('Unable to determine your city and state from ZIP code. Please try again.');
        return;
      }
      
      await submitForm();
      
      // Only proceed if we have a leadId
      if (leadId) {
        // Poll for lead status
        const finalStatus = await pollLeadStatus(leadId);
        
        // Fetch offer wall after status is determined
        await fetchOfferWall();
      } else {
        console.error('Form submission failed - no leadId received');
        alert('There was an error submitting your form. Please try again.');
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      // Special handling: After step 5, go to step 5.5 (Add Another Vehicle)
      if (currentStep === 5) {
        currentStep = 5.5;
      } else if (currentStep === 5.5) {
        // After step 5.5, go to step 6
        currentStep = 6;
      } else {
        currentStep++;
      }
      const newUrl = trackingParams ? `?${trackingParams}&step=${currentStep}` : `?step=${currentStep}`;
      window.history.pushState({}, '', newUrl);
    } else {
      // Final step - mark as completed and save
      saveCurrentDriver();
      // Redirect to tracking URL
      window.location.href = url;
    }
  }
  
  async function selectOption(value: any, field: string) {
    switch(field) {
      case 'zipCode':
        zipCode = value;
        await autoCompleteZip(value);
        break;
      case 'vehicleYear':
        vehicleYear = value;
        await fetchVehicleMakes(value);
        break;
      case 'vehicleMake':
        console.log('vehicleMake selected:', value, 'year:', vehicleYear);
        vehicleMake = value; // {id, name}
        vehicleModel = null;
        vehicleModels = [];
        if (value && value.id) {
          console.log('Fetching models for makeId:', value.id);
          await fetchVehicleModels(vehicleYear, value.id);
        } else {
          console.error('Make value missing id:', value);
        }
        break;
      case 'vehicleModel':
        vehicleModel = value; // {id, name}
        vehicleTrim = null;
        vehicleTrims = [];
        if (value && value.id) {
          await fetchVehicleTrims(value.id);
        }
        break;
      case 'vehicleTrim':
        vehicleTrim = value; // {id, name, vin}
        break;
      case 'ownsVehicle':
        ownsVehicle = value;
        break;
      case 'currentInsurance':
        currentInsurance = value;
        break;
      case 'gender':
        gender = value;
        break;
      case 'married':
        married = value;
        break;
      case 'homeowner':
        homeowner = value;
        break;
      case 'military':
        military = value;
        break;
      case 'hadAccident':
        hadAccident = value;
        break;
      case 'hadTicket':
        hadTicket = value;
        break;
      case 'hadDUI':
        hadDUI = value;
        break;
      case 'addAnotherDriver':
        addAnotherDriver = value;
        break;
      case 'relationship':
        relationship = value;
        break;
    }
    // Auto-advance after async operations complete (except for landing page, multi-part pages, add driver question, and relationship)
    if (field !== 'zipCode' && field !== 'relationship' && currentStep !== 7 && currentStep !== 8 && currentStep !== 11) {
      // Wait a bit for UI feedback, then advance
      await new Promise(resolve => setTimeout(resolve, 200));
      await nextStep();
    }
  }
</script>

<svelte:head>
  <title>{title || 'Quick Auto Insurance Quote Form | SaveMaxAuto'}</title>
  <meta name="description" content="Complete the SaveMaxAuto form to compare free, no-obligation auto insurance quotes." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- TrustedForm Integration for TCPA Compliance -->
  {@html `
    <script type="text/javascript">
      (function() {
        var tf = document.createElement('script');
        tf.type = 'text/javascript'; 
        tf.async = true;
        tf.src = ("https:" == document.location.protocol ? 'https' : 'http') + 
                 "://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&ping_field=xxTrustedFormPingUrl&l=" + 
                 new Date().getTime() + Math.random();
        var s = document.getElementsByTagName('script')[0]; 
        s.parentNode.insertBefore(tf, s);
      })();
    </script>
  `}
  
  <!-- Jornaya LeadID Integration - TODO: Replace with actual campaign ID -->
  {@html `
    <script id="LeadiDscript_campaign" type="text/javascript" 
            src="https://create.lidstatic.com/campaign/YOUR_CAMPAIGN_ID_HERE.js?snippet_version=2" 
            async>
    </script>
  `}
</svelte:head>

<div class="min-h-screen bg-white font-['Roboto',sans-serif]">
  <!-- Header with Logo and Progress -->
  {#if currentStep > 1}
    <header class="bg-white">
      <div class="container mx-auto px-[15px]">
        <!-- Logo and Free Call Button Row -->
        <div class="flex items-center justify-between pt-[48px] pb-[30px]">
          <!-- Logo -->
          <div class="flex items-center w-[205px]">
            <span class="text-[#01366b] font-bold text-[28px]">SaveMax<span class="text-[#47c2e8]">Auto</span></span>
          </div>
          
          <div class="flex-1"></div>
          
          <!-- Free Call Button -->
          <button class="flex items-center gap-2 px-[18px] py-[10px] rounded-[4px] text-[#257eba] font-medium text-[18px] leading-6 cursor-pointer border-none min-w-[100px] outline-none" style="background: linear-gradient(-180deg, #fff, #d6e3f2); box-shadow: 0 0 0 1px #2f9ee9; transition: color .2s; font-family: Poppins, Helvetica Neue, sans-serif;">
            <svg class="" width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(0deg);" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fill-rule="evenodd">
                <path d="M7.464 2.393l2.993 5.558-2.601 1.562a1 1 0 0 0-.101.069l-.092.081a1 1 0 0 0 0 1.414h0l5.26 5.26a1 1 0 0 0 1.564-.193h0l1.561-2.602 5.559 2.994-2.829 2.828a6 6 0 0 1-8.485 0l-5.657-5.657a6 6 0 0 1 0-8.485l2.828-2.829z" stroke="#257eba" stroke-width="2"></path>
              </g>
            </svg>
            Free call
          </button>
        </div>
        
        <!-- Progress Bar Row (with spacing on left and right) -->
        <div class="flex justify-center">
          <div class="w-full max-w-[90%]">
            <div class="relative mt-5">
              <div class="h-[4px] bg-[#dcdcdc] rounded-[0px]"></div>
              <div 
                class="absolute top-0 left-0 h-[4px] bg-[#00c484] rounded-[5px] transition-all duration-[600ms]"
                style="width: {((vehicleProgressFrozen ? frozenVehicleProgressStep : (progressBarFrozen ? frozenProgressStep : currentStep)) - 1) / (totalSteps - 1) * 100}%"
              ></div>
              <div 
                class="absolute top-1/2 -translate-y-1/2 transition-all duration-500 -ml-[31px]"
                style="left: {((vehicleProgressFrozen ? frozenVehicleProgressStep : (progressBarFrozen ? frozenProgressStep : currentStep)) - 1) / (totalSteps - 1) * 100}%"
              >
                <div class="bg-[#124476] text-white text-[16px] leading-[20px] font-semibold px-[16px] py-[8px] rounded-[20px] min-w-[62px] text-center">
                  {Math.round(((vehicleProgressFrozen ? frozenVehicleProgressStep : (progressBarFrozen ? frozenProgressStep : currentStep)) - 1) / (totalSteps - 1) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  {:else}
    <!-- Simple Logo for Step 1 -->
    <div class="flex justify-center pt-8 pb-4">
      <span class="text-[#01366b] font-bold text-2xl">SaveMax<span class="text-[#47c2e8]">Auto</span> LLC</span>
    </div>
  {/if}

  <!-- Form Container -->
  <div class="max-w-[1240px] mx-auto px-4 sm:px-8 pb-12">
    <div class="mt-12 sm:mt-16">
      
      <!-- Back Button (for steps > 1) -->
      {#if currentStep > 1}
        <button
          type="button"
          onclick={() => {
            currentStep--;
            const newUrl = trackingParams ? `?${trackingParams}&step=${currentStep}` : `?step=${currentStep}`;
            window.history.pushState({}, '', newUrl);
          }}
          class="flex items-center gap-2 text-[#01366b] font-medium mb-8 hover:text-[#47c2e8] transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      {/if}

      <!-- All Steps -->
      {#if currentStep >= 1}

      <!-- Welcome Back Screen -->
      {#if showWelcomeBack && currentStep === 1}
        <div class="max-w-[450px] w-full mx-auto text-center py-12">
          <h1 class="text-[36px] font-bold text-[#000e1b] mb-4">WELCOME BACK!</h1>
          <p class="text-[18px] text-[#666] mb-8">Your Auto Quotes Are Almost Ready For You!</p>

          <button
            type="button"
            onclick={loadSavedData}
            class="bg-[#124476] hover:bg-[#46c2e8] text-white py-[18px] px-[19px] rounded-[50px] font-semibold text-[18px] transition-all w-full max-w-[450px] mx-auto mb-6"
            style="box-shadow: 0 8px 16px 0 rgba(18, 68, 118, 0.1);"
          >
            Continue to Quotes
          </button>

          <button
            type="button"
            onclick={() => showSavedInfo = !showSavedInfo}
            class="text-[#124476] text-[16px] underline mb-6 bg-transparent border-none cursor-pointer"
          >
            {showSavedInfo ? 'Hide' : 'See your information'}
          </button>

          {#if showSavedInfo && savedFormData}
            <div class="bg-white border border-[#dde0e4] rounded-lg p-6 text-left mb-6">
              <div class="mb-4">
                <p class="text-[14px] text-[#666] mb-1">Vehicle</p>
                <p class="text-[16px] font-medium text-[#000e1b]">
                  {savedFormData.vehicleYear || ''} {savedFormData.vehicleMake?.name || ''} {savedFormData.vehicleModel?.name || ''}
                </p>
              </div>

              <div class="mb-4 flex justify-between items-center">
                <div>
                  <p class="text-[14px] text-[#666] mb-1">Insured</p>
                  <p class="text-[16px] font-medium text-[#000e1b]">{savedFormData.ownsVehicle === 'yes' ? 'Yes' : 'No'}</p>
                </div>
                <button class="text-[#124476] text-[14px] font-medium underline bg-transparent border-none cursor-pointer">EDIT</button>
              </div>

              <div class="flex justify-between items-center">
                <div>
                  <p class="text-[14px] text-[#666] mb-1">Current Insurance</p>
                  <p class="text-[16px] font-medium text-[#000e1b]">{savedFormData.currentInsurance || ''}</p>
                </div>
                <button class="text-[#124476] text-[14px] font-medium underline bg-transparent border-none cursor-pointer">EDIT</button>
              </div>
            </div>
          {/if}

          <div class="mt-8 pt-6 border-t border-[#dde0e4]">
            <p class="text-[16px] text-[#666] mb-2">Call an expert</p>
            <a href="tel:8663068446" class="text-[24px] font-bold text-[#124476]">1-866-306-8446</a>
          </div>

          <button
            type="button"
            onclick={startNewQuote}
            class="text-[#666] text-[14px] mt-6 bg-transparent border-none cursor-pointer underline"
          >
            Start a new quote
          </button>
        </div>

      <!-- Landing Page: ZIP Code Entry or Saved Drivers -->
      {:else if currentStep === 1}
        <!-- Hero Section with #fafafa background -->
        <div class="bg-[#fafafa] min-h-[800px] pt-[76px] pb-0 text-center">
          <div class="max-w-[1170px] mx-auto px-4">
            <!-- Main Heading -->
            <h1 class="text-[46px] font-bold text-[#036] leading-[1.36] mb-0 font-['Roboto',sans-serif]">
              Let's Drop Your Auto Rates Today!
            </h1>
            
            <!-- Form Wrapper with white background and border -->
            <div class="bg-white border border-[#d1d1d1] pt-[40px] pb-[105px] px-0 mt-[30px] relative">
              <!-- Map Icon -->
              <div class="mb-5 mt-[30px]">
                <svg class="w-[35px] h-[35px] text-[#036] mx-auto" fill="currentColor" viewBox="0 0 384 512">
                  <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path>
                </svg>
              </div>
              
              <!-- Enter Your Zip Code Heading -->
              <h2 class="text-[30px] font-bold text-[#036] leading-[0.8] mb-[50px] font-['Roboto',sans-serif]">
                Enter Your Zip Code
              </h2>
              
              <!-- Blue Arrow (Desktop only) -->
              <div class="hidden md:block absolute top-[180px] left-1/2 -translate-x-1/2 translate-x-[236px]">
                <svg class="w-[38px] h-[69px]" viewBox="0 0 38 69" fill="none">
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" fill="#47c2e8" transform="rotate(90 19 34.5)"/>
                </svg>
              </div>
              
              <!-- Form -->
              <form onsubmit={(e) => { e.preventDefault(); nextStep(); }} class="max-w-[350px] mx-auto px-4">
                <!-- Hidden inputs for TrustedForm compliance -->
                <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />
                <input type="hidden" name="xxTrustedFormPingUrl" id="xxTrustedFormPingUrl" />
                
                <div class="flex flex-col gap-[6px]">
                  <input
                    type="tel"
                    inputmode="numeric"
                    value={zipCode}
                    oninput={(e) => {
                      const target = e.target as HTMLInputElement;
                      zipCode = validateZipCode(target.value);
                    }}
                    placeholder="Zip Code"
                    minlength="5"
                    maxlength="5"
                    required
                    class="text-[25px] px-[15px] py-[6px] border rounded-[2px] h-[65px] text-center focus:outline-none shadow-[0_1px_4px_0_rgba(0,0,0,0.25)] font-['Roboto',sans-serif] {zipCodeError ? 'border-red-500 focus:border-red-500' : 'border-[#d5d5d5] focus:border-[#47c2e8]'}"
                    style="font-weight: 400; line-height: 21px;"
                  />
                  {#if zipCodeError}
                    <p class="text-red-500 text-sm text-center mt-1">{zipCodeError}</p>
                  {/if}
                  <button
                    type="submit"
                    disabled={!zipCode || zipCode.length !== 5}
                    class="text-[25px] font-normal h-[65px] bg-[#46c2e8] hover:bg-[#3bb5d9] text-white rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none relative w-full font-['Roboto',sans-serif]"
                  >
                    GET STARTED
                  </button>
                </div>
              </form>
            </div>

            <!-- Benefit List Section -->
            <div class="pt-[79px] pb-[120px] px-[10px] text-center">
              <h2 class="text-[30px] font-bold text-[#036] mb-[72px] mt-0 p-0 text-center font-['Roboto',sans-serif]">
                Claim your savings online, today!
              </h2>
              
              <!-- Three Benefit Cards -->
              <div class="flex flex-col md:flex-row gap-0 justify-center px-[15px] md:px-0">
                <!-- Card 1 -->
                <div class="border border-[#dbdbdb] max-w-[370px] w-full p-5 text-center mb-5 md:mb-0">
                  <div class="flex justify-center">
                    <img src="https://savemaxauto.com/images/banner1img.png" alt="Banner 1 image" class="w-[57px] h-[57px]" loading="lazy" />
                  </div>
                  <h4 class="text-[#4a90e2] text-[20px] font-medium mt-[18px] mb-[14px] p-0 font-['Roboto',sans-serif]">
                    Fill out our secure form
                  </h4>
                  <p class="text-[#091a36] text-base m-0 p-0 font-['Roboto',sans-serif]">
                    Tell us a little about yourself and your car coverage needs.
                  </p>
                </div>

                <!-- Card 2 -->
                <div class="border border-[#dbdbdb] max-w-[370px] w-full p-5 text-center mb-5 md:mb-0 md:ml-[30px]">
                  <div class="flex justify-center">
                    <img src="https://savemaxauto.com/images/banner2img.png" alt="Banner 2 image" class="w-[57px] h-[57px]" loading="lazy" />
                  </div>
                  <h4 class="text-[#4a90e2] text-[20px] font-medium mt-[18px] mb-[14px] p-0 font-['Roboto',sans-serif]">
                    Connect with an agent
                  </h4>
                  <p class="text-[#091a36] text-base m-0 p-0 font-['Roboto',sans-serif]">
                    Our unbiased professionals show you side-by-side quotes from top providers for free.
                  </p>
                </div>

                <!-- Card 3 -->
                <div class="border border-[#dbdbdb] max-w-[370px] w-full p-5 text-center mb-5 md:mb-0 md:ml-[30px]">
                  <div class="flex justify-center">
                    <img src="https://savemaxauto.com/images/banner3img.png" alt="Banner 3 image" class="w-[57px] h-[57px]" loading="lazy" />
                  </div>
                  <h4 class="text-[#4a90e2] text-[20px] font-medium mt-[18px] mb-[14px] p-0 font-['Roboto',sans-serif]">
                    Start saving money
                  </h4>
                  <p class="text-[#091a36] text-base m-0 p-0 font-['Roboto',sans-serif]">
                    Get your plan, get paid for unused coverage, save money for the important things in life.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        <!-- Footer Section (Landing Page Only) -->
        <footer class="bg-white text-center py-12">
          <div class="max-w-[1170px] mx-auto px-4">
            <!-- Top Illustration -->
            <img src="https://savemaxauto.com/images/footer/top-illustration.png" alt="Illustration" class="mx-auto mb-8 max-w-[200px]" loading="lazy" />
            
            <!-- Heading -->
            <h2 class="text-[30px] font-bold text-[#036] mb-4 font-['Roboto',sans-serif]">
              The service you expect, partners you can trust.
            </h2>
            
            <!-- Subtext -->
            <p class="text-[#666] text-base mb-8 font-['Roboto',sans-serif]">
              We carefully vet our partners to ensure you get best experience and the most value.
            </p>
            
            <!-- Insurance Company Logos -->
            <div class="flex justify-center gap-4 flex-wrap mb-8">
              <img src="https://savemaxauto.com/images/footer/icon-1.svg" alt="Liberty Mutual" class="h-12" loading="lazy" />
              <img src="https://savemaxauto.com/images/footer/icon-2.svg" alt="Safeco" class="h-12" loading="lazy" />
              <img src="https://savemaxauto.com/images/footer/icon-4.svg" alt="Farmers Insurance" class="h-12" loading="lazy" />
              <img src="https://savemaxauto.com/images/footer/icon-5.svg" alt="All State" class="h-12" loading="lazy" />
            </div>
            
            <!-- Disclaimer Text -->
            <div class="text-[#666] text-sm leading-relaxed mb-6 max-w-[900px] mx-auto">
              <p class="font-['Roboto',sans-serif]">
                Savemaxauto.com is an online insurance referral site. We match and directly connect consumers with insurance companies and agents across the US. Our site does not provide quotes directly to consumers and is not in any way affiliated with any of the insurance carriers. We do not provide insurance and we do not represent any specific insurance provider or automobile company. All trademarks and copyrights are the property of their respective owners. All articles on this website are for information purposes only. This website contains affiliate marketing links and phone numbers which means that the operators of this site may get paid commission on sales of the products or services advertised. Savemaxauto.com provides access to independent auto insurance services and acts as an affiliate to these services. Your access to this website is subject to its <a href="../../terms/" class="text-[#666] underline">Terms and Conditions</a>. California residents only: <a href="../../privacy/#doNotSellMyInfo" class="text-[#666] underline">Do not sell my info.</a>
              </p>
            </div>
            
            <!-- Footer Links -->
            <div class="flex justify-center gap-3 text-sm mb-6 flex-wrap">
              <a href="../../privacy/" class="text-[#666] hover:text-[#47c2e8]">Privacy Policy</a>
              <span class="text-[#666]">•</span>
              <a href="../../ccpa/" class="text-[#666] hover:text-[#47c2e8]">CCPA</a>
              <span class="text-[#666]">•</span>
              <a href="../../terms/" class="text-[#666] hover:text-[#47c2e8]">Terms & Conditions</a>
              <span class="text-[#666]">•</span>
              <a href="../../contact/" class="text-[#666] hover:text-[#47c2e8]">Contact Us</a>
              <span class="text-[#666]">•</span>
              <a href="../../sms/" class="text-[#666] hover:text-[#47c2e8]">SMS Terms</a>
              <span class="text-[#666]">•</span>
              <a href="../../disclaimer/" class="text-[#666] hover:text-[#47c2e8]">Disclaimer</a>
              <span class="text-[#666]">•</span>
              <a href="../../unsubscribe/" class="text-[#666] hover:text-[#47c2e8]">Unsubscribe</a>
            </div>
            
            <!-- Social Icons -->
            <div class="flex justify-center gap-4 mb-6">
              <a href="https://www.linkedin.com/company/savemaxauto/?viewAsMember=true" target="_blank" rel="noreferrer" class="text-[#666] hover:text-[#47c2e8]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M100.3 448l-92.9 0 0-299.1 92.9 0 0 299.1zM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 39.5 5.7 25.9 15.8 15.8s23.8-15.8 38-15.8 27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3zM447.9 448l-92.7 0 0-145.6c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7l0 148.1-92.8 0 0-299.1 89.1 0 0 40.8 1.3 0c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3l0 164.3-.1 0z"/></svg>
              </a>
              <a href="https://www.instagram.com/savemaxauto/" target="_blank" rel="noreferrer" class="text-[#666] hover:text-[#47c2e8]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M224.3 141a115 115 0 1 0 -.6 230 115 115 0 1 0 .6-230zm-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1 -.6-149.2zm93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1 -53.6 0zm129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
              </a>
              <a href="https://www.facebook.com/SaveMaxAuto/" target="_blank" rel="noreferrer" class="text-[#666] hover:text-[#47c2e8]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 320 512"><path d="M80 299.3l0 212.7 116 0 0-212.7 86.5 0 18-97.8-104.5 0 0-34.6c0-51.7 20.3-71.5 72.7-71.5 16.3 0 29.4 .4 37 1.2l0-88.7C291.4 4 256.4 0 236.2 0 129.3 0 80 50.5 80 159.4l0 42.1-66 0 0 97.8 66 0z"/></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCUfn3-z0F_smY74fM8svnyg" target="_blank" rel="noreferrer" class="text-[#666] hover:text-[#47c2e8]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 576 512"><path d="M549.7 124.1C543.5 100.4 524.9 81.8 501.4 75.5 458.9 64 288.1 64 288.1 64S117.3 64 74.7 75.5C51.2 81.8 32.7 100.4 26.4 124.1 15 167 15 256.4 15 256.4s0 89.4 11.4 132.3c6.3 23.6 24.8 41.5 48.3 47.8 42.6 11.5 213.4 11.5 213.4 11.5s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zM232.2 337.6l0-162.4 142.7 81.2-142.7 81.2z"/></svg>
              </a>
              <a href="https://www.snapchat.com/@savemaxauto" target="_blank" rel="noreferrer" class="text-[#666] hover:text-[#47c2e8]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 512 512"><path d="M497.1 366.6c-3.4-9.2-9.8-14.1-17.1-18.2-1.4-.8-2.6-1.5-3.7-1.9-2.2-1.1-4.4-2.2-6.6-3.4-22.8-12.1-40.6-27.3-53-45.4-3.5-5.1-6.6-10.5-9.1-16.1-1.1-3-1-4.7-.2-6.3 .8-1.2 1.7-2.2 2.9-3 3.9-2.6 8-5.2 10.7-7 4.9-3.2 8.8-5.7 11.2-7.4 9.4-6.5 15.9-13.5 20-21.3 2.9-5.4 4.5-11.3 4.9-17.4s-.6-12.2-2.8-17.8c-6.2-16.3-21.6-26.4-40.3-26.4-3.9 0-7.9 .4-11.7 1.2-1 .2-2.1 .5-3.1 .7 .2-11.2-.1-22.9-1.1-34.5-3.5-40.8-17.8-62.1-32.7-79.2-9.5-10.7-20.7-19.7-33.2-26.7-22.6-12.9-48.2-19.4-76.1-19.4s-53.4 6.5-76 19.4c-12.5 7-23.7 16.1-33.3 26.8-14.9 17-29.2 38.4-32.7 79.2-1 11.6-1.2 23.4-1.1 34.5-1-.3-2-.5-3.1-.7-3.9-.8-7.8-1.2-11.7-1.2-18.7 0-34.1 10.1-40.3 26.4-2.2 5.7-3.2 11.8-2.8 17.8s2 12 4.9 17.4c4.1 7.8 10.7 14.7 20 21.3 2.5 1.7 6.4 4.2 11.2 7.4 2.6 1.7 6.5 4.2 10.3 6.7 1.3 .9 2.4 2 3.3 3.3 .8 1.6 .8 3.4-.4 6.6-2.5 5.5-5.5 10.8-8.9 15.8-12.1 17.7-29.4 32.6-51.4 44.6-11.7 6.2-23.9 10.3-29 24.3-3.9 10.5-1.3 22.5 8.5 32.6 3.6 3.8 7.8 6.9 12.4 9.4 9.6 5.3 19.8 9.3 30.3 12.1 2.2 .6 4.3 1.5 6.1 2.7 3.6 3.1 3.1 7.9 7.8 14.8 2.4 3.6 5.4 6.7 9 9.1 10 6.9 21.3 7.4 33.2 7.8 10.8 .4 23 .9 36.9 5.5 5.8 1.9 11.8 5.6 18.7 9.9 16.7 10.3 39.6 24.3 77.8 24.3s61.3-14.1 78.1-24.4c6.9-4.2 12.9-7.9 18.5-9.8 13.9-4.6 26.2-5.1 36.9-5.5 11.9-.5 23.2-.9 33.2-7.8 4.2-2.9 7.7-6.7 10.2-11.2 3.4-5.8 3.4-9.9 6.6-12.8 1.8-1.2 3.7-2.1 5.8-2.6 10.7-2.8 21-6.9 30.8-12.2 4.9-2.6 9.3-6.1 13-10.2l.1-.2c9.2-9.9 11.5-21.5 7.8-31.8zm-34 18.3c-20.7 11.5-34.5 10.2-45.3 17.1-9.1 5.9-3.7 18.5-10.3 23.1-8.1 5.6-32.2-.4-63.2 9.9-25.6 8.5-42 32.8-88 32.8s-62-24.3-88.1-32.9c-31-10.3-55.1-4.2-63.2-9.9-6.6-4.6-1.2-17.2-10.3-23.1-10.7-6.9-24.5-5.7-45.3-17.1-13.2-7.3-5.7-11.8-1.3-13.9 75.1-36.4 87.1-92.6 87.7-96.7 .6-5 1.4-9-4.2-14.1-5.4-5-29.2-19.7-35.8-24.3-10.9-7.6-15.7-15.3-12.2-24.6 2.5-6.5 8.5-8.9 14.9-8.9 2 0 4 .2 6 .7 12 2.6 23.7 8.6 30.4 10.2 .8 .2 1.6 .3 2.5 .3 3.6 0 4.9-1.8 4.6-5.9-.8-13.1-2.6-38.7-.6-62.6 2.8-32.9 13.4-49.2 26-63.6 6.1-6.9 34.5-37 88.9-37S339 74.2 345 81.1c12.6 14.4 23.2 30.7 26 63.6 2.1 23.9 .3 49.5-.6 62.6-.3 4.3 1 5.9 4.6 5.9 .8 0 1.7-.1 2.5-.3 6.7-1.6 18.4-7.6 30.4-10.2 2-.4 4-.7 6-.7 6.4 0 12.4 2.5 14.9 8.9 3.5 9.4-1.2 17-12.2 24.6-6.6 4.6-30.4 19.3-35.8 24.3-5.6 5.1-4.8 9.1-4.2 14.2 .5 4.2 12.5 60.4 87.7 96.7 4.4 2.2 11.9 6.7-1.3 14.1z"/></svg>
              </a>
            </div>
            
            <!-- Copyright -->
            <p class="text-[#000] text-sm pb-5 font-['Roboto',sans-serif]">
              © 2025 SaveMaxAuto LLC. All rights reserved. 8635 W Sahara Ave #3363 Las Vegas, NV 89117-5858
            </p>
          </div>
        </footer>

      <!-- Step 2: Vehicle Year -->
      {:else if currentStep === 2}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Vehicle Label (for 2nd, 3rd vehicle, etc.) -->
          {#if currentVehicleIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentVehicleIndex === 1 ? '2ND VEHICLE' : currentVehicleIndex === 2 ? '3RD VEHICLE' : `${currentVehicleIndex + 1}TH VEHICLE`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">Vehicle Year</h1>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-[450px] mx-auto">
            {#each vehicleYears as year}
              <button
                type="button"
                onclick={() => selectOption(year.toString(), 'vehicleYear')}
                class="simple-option {vehicleYear === year.toString() ? 'active-simple' : ''}"
              >
                {year}
              </button>
            {/each}
          </div>
        </div>

      <!-- Step 3: Vehicle Make -->
      {:else if currentStep === 3}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Vehicle Label (for 2nd, 3rd vehicle, etc.) -->
          {#if currentVehicleIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentVehicleIndex === 1 ? '2ND VEHICLE' : currentVehicleIndex === 2 ? '3RD VEHICLE' : `${currentVehicleIndex + 1}TH VEHICLE`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">Vehicle Make</h1>
          </div>
          
          {#if vehicleMakes.length > 0}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-[450px] mx-auto">
              {#each vehicleMakes as make}
                <button
                  type="button"
                  onclick={() => selectOption(make, 'vehicleMake')}
                  class="simple-option {vehicleMake?.id === make.id ? 'active-simple' : ''}"
                >
                  {make.name}
                </button>
              {/each}
            </div>
          {:else}
            <p class="text-center text-[#858f97]">Loading vehicle makes...</p>
          {/if}
        </div>

      <!-- Step 4: Vehicle Model -->
      {:else if currentStep === 4}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Vehicle Label (for 2nd, 3rd vehicle, etc.) -->
          {#if currentVehicleIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentVehicleIndex === 1 ? '2ND VEHICLE' : currentVehicleIndex === 2 ? '3RD VEHICLE' : `${currentVehicleIndex + 1}TH VEHICLE`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">Vehicle Model</h1>
          </div>
          
          {#if vehicleModels.length > 0}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-[450px] mx-auto">
              {#each vehicleModels as model}
                <button
                  type="button"
                  onclick={() => selectOption(model, 'vehicleModel')}
                  class="simple-option {vehicleModel?.id === model.id ? 'active-simple' : ''}"
                >
                  {model.name}
                </button>
              {/each}
            </div>
          {:else}
            <p class="text-center text-[#858f97]">Please select a vehicle make first</p>
          {/if}
        </div>

      <!-- Step 5: Own This Vehicle -->
      {:else if currentStep === 5}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Vehicle Label (for 2nd, 3rd vehicle, etc.) -->
          {#if currentVehicleIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentVehicleIndex === 1 ? '2ND VEHICLE' : currentVehicleIndex === 2 ? '3RD VEHICLE' : `${currentVehicleIndex + 1}TH VEHICLE`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">Do You Own This Vehicle?</h1>
          </div>
          
          <div class="flex gap-4 max-w-[450px] mx-auto">
            <button
              type="button"
              onclick={() => selectOption('yes', 'ownsVehicle')}
              class="simple-option {ownsVehicle === 'yes' ? 'active-simple' : ''}"
            >
              YES
            </button>
            <button
              type="button"
              onclick={() => selectOption('no', 'ownsVehicle')}
              class="simple-option-gray {ownsVehicle === 'no' ? 'active-simple-gray' : ''}"
            >
              NO
            </button>
          </div>
          
          <!-- Continue button -->
          <div class="flex justify-center mt-[65px]">
            <button
              type="button"
              onclick={nextStep}
              class="bg-[#124476] hover:bg-[#46c2e8] text-white px-8 py-3 rounded-full font-medium transition-colors w-full max-w-[450px]"
            >
              Continue
            </button>
          </div>
        </div>

      <!-- Step 5.5: Add Another Vehicle? (NEW - matches external form at 27% progress) -->
      {:else if currentStep === 5.5}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Vehicle Label (for 2nd, 3rd vehicle, etc.) -->
          {#if currentVehicleIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentVehicleIndex === 1 ? '2ND VEHICLE' : currentVehicleIndex === 2 ? '3RD VEHICLE' : `${currentVehicleIndex + 1}TH VEHICLE`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">
              Save an Additional 20% by Adding a {currentVehicleIndex === 0 ? '2nd' : currentVehicleIndex === 1 ? '3rd' : `${currentVehicleIndex + 2}th`} Vehicle
            </h1>
          </div>
          
          <div class="flex gap-4 max-w-[450px] mx-auto">
            <button
              type="button"
              onclick={() => { addAnotherVehicle = 'yes'; nextStep(); }}
              class="simple-option"
            >
              ADD ANOTHER VEHICLE
            </button>
            <button
              type="button"
              onclick={() => { addAnotherVehicle = 'no'; nextStep(); }}
              class="simple-option-gray"
            >
              No thanks!
            </button>
          </div>
        </div>

      <!-- Step 6: Current Insurance Company -->
      {:else if currentStep === 6}
        <div class="max-w-[860px] mx-auto px-4">
          <div class="text-center mb-[28px]">
            <h1 class="text-[36px] font-bold text-[#000e1b]">Current Insurance Company</h1>
          </div>
          
          <div class="flex flex-col gap-4 max-w-[450px] mx-auto">
            {#each insuranceCompanies as company}
              <button
                type="button"
                onclick={() => selectOption(company, 'currentInsurance')}
                class="simple-option {currentInsurance === company ? 'active-simple' : ''}"
              >
                {company}
              </button>
            {/each}
          </div>
        </div>

      <!-- Step 7: Personal Information (Gender, Marital Status, Homeowner, Military) -->
      {:else if currentStep === 7}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Driver Label (for 2nd, 3rd driver, etc.) -->
          {#if currentDriverIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentDriverIndex === 1 ? '2ND DRIVER' : currentDriverIndex === 2 ? '3RD DRIVER' : `${currentDriverIndex + 1}TH DRIVER`}
              </p>
            </div>
          {/if}
          
          <div class="space-y-[28px]">
            <!-- Gender -->
            <div class="text-center">
              <h2 class="mb-0">Gender</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('male', 'gender')}
                  class="simple-option {gender === 'male' ? 'active-simple' : ''}"
                >
                  MALE
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('female', 'gender')}
                  class="simple-option-gray {gender === 'female' ? 'active-simple-gray' : ''}"
                >
                  FEMALE
                </button>
              </div>
            </div>

            <!-- Marital Status -->
            <div class="text-center">
              <h2 class="mb-0">Are you currently married?</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'married')}
                  class="simple-option {married === 'yes' ? 'active-simple' : ''}"
                >
                  YES
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'married')}
                  class="simple-option-gray {married === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO
                </button>
              </div>
            </div>

            <!-- Homeowner -->
            <div class="text-center">
              <h2 class="mb-0">Are you a homeowner?</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'homeowner')}
                  class="simple-option {homeowner === 'yes' ? 'active-simple' : ''}"
                >
                  YES, I OWN MY HOME
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'homeowner')}
                  class="simple-option-gray {homeowner === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO, I DO NOT OWN MY HOME
                </button>
              </div>
            </div>

            <!-- Military Service -->
            <div class="text-center">
              <h2 class="mb-0">Have you ever honorably served in the U.S. military?</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'military')}
                  class="simple-option {military === 'yes' ? 'active-simple' : ''}"
                >
                  YES
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'military')}
                  class="simple-option-gray {military === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO
                </button>
              </div>
            </div>

            <!-- Continue Button - Full Width -->
            <div class="mt-12">
              <button
                type="button"
                onclick={nextStep}
                class="w-full max-w-[450px] mx-auto block bg-[#124476] hover:bg-[#46c2e8] text-white px-[19px] py-[18px] rounded-[50px] font-semibold transition-colors text-[18px] h-[62px]"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

      <!-- Step 8: Driving History -->
      {:else if currentStep === 8}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Driver Label (for 2nd, 3rd driver, etc.) -->
          {#if currentDriverIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentDriverIndex === 1 ? '2ND DRIVER' : currentDriverIndex === 2 ? '3RD DRIVER' : `${currentDriverIndex + 1}TH DRIVER`}
              </p>
            </div>
          {/if}
          
          <div class="space-y-[28px]">
            <!-- Had Accident -->
            <div class="text-center">
              <h2 class="mb-0">Had an accident</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'hadAccident')}
                  class="simple-option {hadAccident === 'yes' ? 'active-simple' : ''}"
                >
                  YES
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'hadAccident')}
                  class="simple-option-gray {hadAccident === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO
                </button>
              </div>
            </div>

            <!-- Had Ticket -->
            <div class="text-center">
              <h2 class="mb-0">Received a ticket</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'hadTicket')}
                  class="simple-option {hadTicket === 'yes' ? 'active-simple' : ''}"
                >
                  YES
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'hadTicket')}
                  class="simple-option-gray {hadTicket === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO
                </button>
              </div>
            </div>

            <!-- Had DUI -->
            <div class="text-center">
              <h2 class="mb-0">Received a DUI</h2>
              <div class="flex gap-4 max-w-[450px] mx-auto">
                <button
                  type="button"
                  onclick={() => selectOption('yes', 'hadDUI')}
                  class="simple-option {hadDUI === 'yes' ? 'active-simple' : ''}"
                >
                  YES
                </button>
                <button
                  type="button"
                  onclick={() => selectOption('no', 'hadDUI')}
                  class="simple-option-gray {hadDUI === 'no' ? 'active-simple-gray' : ''}"
                >
                  NO
                </button>
              </div>
            </div>

            <!-- Continue Button -->
            <div class="mt-12">
              <button
                type="button"
                onclick={nextStep}
                class="w-full max-w-[450px] mx-auto block bg-[#124476] hover:bg-[#46c2e8] text-white px-[19px] py-[18px] rounded-[50px] font-semibold transition-colors text-[18px] h-[62px]"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      <!-- Step 9: Birthday -->
      {:else if currentStep === 9}
        <div class="max-w-[450px] w-full mx-auto text-center relative">
          <!-- Driver Label (for 2nd, 3rd driver, etc.) -->
          {#if currentDriverIndex > 0}
            <div class="text-center mb-4">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentDriverIndex === 1 ? '2ND DRIVER' : currentDriverIndex === 2 ? '3RD DRIVER' : `${currentDriverIndex + 1}TH DRIVER`}
              </p>
            </div>
          {/if}
          
          <h1 class="text-[36px] font-bold text-[#000e1b] mb-8">
            Birthday
          </h1>

          <div class="max-w-[300px] mx-auto mb-[48px] relative">
            <div class="flex items-stretch gap-0 border border-[#002e5b] px-4 py-3 min-h-[60px]">
                <div class="flex-1 relative flex items-center">
                  <div class="w-full">
                    <label
                      class="absolute left-0 transition-all duration-200 pointer-events-none {monthFocused || birthdayMonth ? 'text-[10px] top-1 text-[#8b95a1] uppercase tracking-wider font-medium' : 'top-1/2 -translate-y-1/2 text-base text-[#a0aab5]'}"
                    >
                      {monthFocused || birthdayMonth ? 'MONTH' : 'MM'}
                    </label>
                    <input
                      type="text"
                      maxlength="2"
                      bind:value={birthdayMonth}
                      onfocus={() => monthFocused = true}
                      onblur={() => monthFocused = false}
                      oninput={(e) => {
                        const target = e.target as HTMLInputElement;
                        birthdayMonth = validateMonth(target.value);
                      }}
                      class="w-full text-left text-base font-medium text-[#000e1b] border-none outline-none focus:outline-none bg-transparent pt-5 pb-0"
                    />
                  </div>
                </div>
                <div class="flex items-center justify-center px-3 self-center">
                  <div class="w-[2px] h-[30px] bg-[#002e5b]"></div>
                </div>
                <div class="flex-1 relative flex items-center">
                  <div class="w-full">
                    <label
                      class="absolute left-0 transition-all duration-200 pointer-events-none {dayFocused || birthdayDay ? 'text-[10px] top-1 text-[#8b95a1] uppercase tracking-wider font-medium' : 'top-1/2 -translate-y-1/2 text-base text-[#a0aab5]'}"
                    >
                      {dayFocused || birthdayDay ? 'DAY' : 'DD'}
                    </label>
                    <input
                      type="text"
                      maxlength="2"
                      bind:value={birthdayDay}
                      onfocus={() => dayFocused = true}
                      onblur={() => dayFocused = false}
                      oninput={(e) => {
                        const target = e.target as HTMLInputElement;
                        birthdayDay = validateDay(target.value);
                      }}
                      class="w-full text-left text-base font-medium text-[#000e1b] border-none outline-none focus:outline-none bg-transparent pt-5 pb-0"
                    />
                  </div>
                </div>
                <div class="flex items-center justify-center px-3 self-center">
                  <div class="w-[2px] h-[30px] bg-[#002e5b]"></div>
                </div>
                <div class="flex-1 relative flex items-center">
                  <div class="w-full">
                    <label
                      class="absolute left-0 transition-all duration-200 pointer-events-none {yearFocused || birthdayYear ? 'text-[10px] top-1 text-[#8b95a1] uppercase tracking-wider font-medium' : 'top-1/2 -translate-y-1/2 text-base text-[#a0aab5]'}"
                    >
                      {yearFocused || birthdayYear ? 'YEAR' : 'YYYY'}
                    </label>
                    <input
                      type="text"
                      maxlength="4"
                      bind:value={birthdayYear}
                      onfocus={() => yearFocused = true}
                      onblur={() => yearFocused = false}
                      oninput={(e) => {
                        const target = e.target as HTMLInputElement;
                        birthdayYear = validateYear(target.value);
                      }}
                      class="w-full text-left text-base font-medium text-[#000e1b] border-none outline-none focus:outline-none bg-transparent pt-5 pb-0"
                    />
                  </div>
                </div>
            </div>
          </div>

          <div class="flex flex-col">
            <button
              type="button"
              onclick={nextStep}
              class="bg-[#124476] hover:bg-[#46c2e8] text-white py-[18px] px-[19px] rounded-[50px] font-semibold text-[18px] transition-all w-full max-w-[450px] mx-auto flex items-center justify-center gap-2"
              style="box-shadow: 0 8px 16px 0 rgba(18, 68, 118, 0.1);"
            >
              Continue
              <svg class="" width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(0deg);" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fill-rule="evenodd">
                  <path stroke="#FFF" stroke-width="2" d="M14 20.485L22.485 12h0L14 3.515"></path>
                  <path stroke="#FFF" stroke-width="2" stroke-linecap="square" d="M1 12.5h20"></path>
                </g>
              </svg>
            </button>
          </div>
        </div>
      <!-- Step 10: Name (with Relationship dropdown for additional drivers) -->
      {:else if currentStep === 10}
        <div class="max-w-[860px] mx-auto px-4">
          <!-- Driver Label (for 2nd, 3rd driver, etc.) -->
          {#if currentDriverIndex > 0}
            <div class="text-center mb-6">
              <p class="text-[#47c2e8] text-[14px] font-semibold uppercase tracking-wider">
                {currentDriverIndex === 1 ? '2ND DRIVER' : currentDriverIndex === 2 ? '3RD DRIVER' : `${currentDriverIndex + 1}TH DRIVER`}
              </p>
            </div>
          {/if}
          
          <div class="text-center mb-[28px]">
            <h1>Name</h1>
          </div>
          
          <div class="max-w-[450px] mx-auto space-y-6">
            <!-- Relationship Dropdown (only for additional drivers) -->
            {#if currentDriverIndex > 0}
              <div class="relative mb-6">
                <select
                  bind:value={relationship}
                  required
                  class="w-full h-[64px] px-5 pt-[28px] pb-3 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif] bg-white cursor-pointer"
                  style="box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 45px 12px 20px;"
                  onfocus={(e) => (e.target as HTMLSelectElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)'}
                  onblur={(e) => (e.target as HTMLSelectElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)'}
                >
                  <option value="" disabled selected>Select relationship</option>
                  <option value="CHILD">Child</option>
                  <option value="DOMESTIC_PARTNER">Domestic Partner</option>
                  <option value="GRANDCHILD">Grandchild</option>
                  <option value="GRANDPARENT">Grandparent</option>
                  <option value="OTHER">Other</option>
                  <option value="PARENT">Parent</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="SPOUSE">Spouse</option>
                </select>
                <label 
                  class="absolute left-5 top-3 pointer-events-none text-[12px] leading-4"
                  style="color: rgba(18,68,118,0.5);"
                >
                  Relationship to you
                </label>
                <!-- Dropdown arrow -->
                <svg class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <g fill="none" fill-rule="evenodd">
                    <path stroke="rgba(18,68,118,0.5)" stroke-width="2" d="M7 9.5l5 5 5-5"></path>
                  </g>
                </svg>
              </div>
            {/if}
            

            <!-- First Name Input -->
            <div class="relative input-container mb-6">
              <input 
                type="text"
                bind:value={firstName}
                placeholder="e.g. John"
                required
                class="name-input w-full h-[64px] px-5 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif]"
                style="background: #fff; box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 20px 12px;"
                onfocus={(e) => { 
                  firstNameFocused = true;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)';
                }}
                onblur={(e) => { 
                  firstNameFocused = false;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                }}
                onmouseenter={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #666, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
                onmouseleave={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
              />
              <label 
                class="absolute left-5 pointer-events-none transition-all duration-150 ease-in-out"
                class:label-float={firstNameFocused || firstName}
                class:label-center={!firstNameFocused && !firstName}
              >
                Legal First Name
              </label>
            </div>
            
            <!-- Last Name Input -->
            <div class="relative input-container mb-6">
              <input 
                type="text"
                bind:value={lastName}
                placeholder="e.g. Smith"
                required
                class="name-input w-full h-[64px] px-5 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif]"
                style="background: #fff; box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 20px 12px;"
                onfocus={(e) => { 
                  lastNameFocused = true;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)';
                }}
                onblur={(e) => { 
                  lastNameFocused = false;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                }}
                onmouseenter={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #666, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
                onmouseleave={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
              />
              <label 
                class="absolute left-5 pointer-events-none transition-all duration-150 ease-in-out"
                class:label-float={lastNameFocused || lastName}
                class:label-center={!lastNameFocused && !lastName}
              >
                Legal Last Name
              </label>
            </div>
            
            <!-- Continue Button -->
            <div class="mt-12">
              <button
                type="button"
                onclick={nextStep}
                class="w-full max-w-[450px] mx-auto block bg-[#124476] hover:bg-[#46c2e8] text-white px-[19px] py-[18px] rounded-[50px] font-semibold transition-colors text-[18px] h-[62px]"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

      <!-- Step 11: Add Another Driver? -->
      {:else if currentStep === 11}
        <div class="max-w-[860px] mx-auto px-4">
          <div class="text-center mb-[28px]">
            <h1>Add another driver?</h1>
            <p class="text-[#47c2e8] text-[18px] font-semibold mt-2">(Save Additional 20%)</p>
          </div>
          
          <div class="flex gap-4 max-w-[450px] mx-auto">
            <button
              type="button"
              onclick={async () => { 
                addAnotherDriver = 'yes';
                // Auto-advance immediately when YES is clicked
                await new Promise(resolve => setTimeout(resolve, 200));
                await nextStep();
              }}
              class="simple-option {addAnotherDriver === 'yes' ? 'active-simple' : ''}"
            >
              YES
            </button>
            <button
              type="button"
              onclick={() => { addAnotherDriver = 'no'; }}
              class="simple-option-gray {addAnotherDriver === 'no' ? 'active-simple-gray' : ''}"
            >
              NO
            </button>
          </div>
          
          <!-- Continue button (only shows when NO is selected) -->
          {#if addAnotherDriver === 'no'}
            <div class="flex justify-center mt-[65px]">
              <button
                type="button"
                onclick={nextStep}
                class="bg-[#124476] hover:bg-[#46c2e8] text-white px-8 py-3 rounded-full font-medium transition-colors w-full max-w-[450px]"
              >
                Continue
              </button>
            </div>
          {/if}
        </div>

      <!-- Step 12: Contact Info (Address, Email, Phone) -->
      {:else if currentStep === 12}
        <div class="max-w-[860px] mx-auto px-4">
          <div class="text-center mb-[28px]">
            <h1>{primaryDriverName || firstName}, you could QUALIFY for BIG savings!</h1>
          </div>
          
          <div class="max-w-[450px] mx-auto space-y-6">
            <!-- Street Address Input -->
            <div class="relative input-container mb-6">
              <input 
                type="text"
                bind:value={address}
                placeholder=""
                required
                class="name-input w-full h-[64px] px-5 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif]"
                style="background: #fff; box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 20px 12px;"
                onfocus={(e) => { 
                  addressFocused = true;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)';
                }}
                onblur={(e) => { 
                  addressFocused = false;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                }}
                onmouseenter={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #666, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
                onmouseleave={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
              />
              <label 
                class="absolute left-5 pointer-events-none transition-all duration-150 ease-in-out"
                class:label-float={addressFocused || address}
                class:label-center={!addressFocused && !address}
              >
                Street Address
              </label>
            </div>
            
            <!-- Email Address Input -->
            <div class="relative input-container mb-6">
              <input 
                type="email"
                bind:value={email}
                placeholder=""
                required
                class="name-input w-full h-[64px] px-5 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif]"
                style="background: #fff; box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 20px 12px;"
                onfocus={(e) => { 
                  emailFocused = true;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)';
                }}
                onblur={(e) => { 
                  emailFocused = false;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                }}
                onmouseenter={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #666, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
                onmouseleave={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
              />
              <label 
                class="absolute left-5 pointer-events-none transition-all duration-150 ease-in-out"
                class:label-float={emailFocused || email}
                class:label-center={!emailFocused && !email}
              >
                Email Address
              </label>
            </div>
            
            <!-- Phone Number Input -->
            <div class="relative input-container mb-6">
              <input 
                type="tel"
                bind:value={phone}
                placeholder=""
                required
                class="name-input w-full h-[64px] px-5 text-[16px] leading-6 border-none rounded-[2px] outline-none appearance-none text-[#124476] font-['Poppins',sans-serif]"
                style="background: #fff; box-shadow: inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1); margin: 0; padding: 28px 20px 12px;"
                onfocus={(e) => { 
                  phoneFocused = true;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #124476, 0 4px 8px 0 rgba(18,68,118,0.1)';
                }}
                onblur={(e) => { 
                  phoneFocused = false;
                  (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                }}
                onmouseenter={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #666, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
                onmouseleave={(e) => {
                  if (document.activeElement !== e.target) {
                    (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1px #dcdcdc, 0 1px 2px 0 rgba(18,68,118,0.1)';
                  }
                }}
              />
              <label 
                class="absolute left-5 pointer-events-none transition-all duration-150 ease-in-out"
                class:label-float={phoneFocused || phone}
                class:label-center={!phoneFocused && !phone}
              >
                Phone Number
              </label>
            </div>
            
            <!-- Continue Button -->
            <div class="mt-12">
              <button
                type="button"
                onclick={nextStep}
                class="w-full max-w-[450px] mx-auto block bg-[#124476] hover:bg-[#46c2e8] text-white px-[19px] py-[18px] rounded-[50px] font-semibold transition-colors text-[18px] h-[62px]"
              >
                Get My Quotes →
              </button>
            </div>
          </div>
        </div>

      <!-- Step 13: Offer Wall -->
      {:else if currentStep === 13}
        <div class="max-w-[1140px] mx-auto px-4">
          <div class="text-center mb-12">
            <h1 class="text-[36px] font-bold text-[#000e1b] mb-4">
              Click at least TWO quotes to compare and save!
            </h1>
            <p class="text-lg text-[#858f97] mb-8">
              {firstName}, be sure to shop around below to find your lowest rate.
            </p>
          </div>
          
          {#if offerAds.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[924px] mx-auto">
              {#each offerAds as ad}
                <a 
                  href={ad.clickUrl}
                  target="_blank"
                  class="bg-white border-2 border-[#dde0e4] rounded-lg p-6 hover:border-[#47c2e8] hover:shadow-lg transition-all no-underline"
                >
                  <!-- Insurance Company Logo -->
                  <div class="flex items-center justify-center mb-4 h-16">
                    <img src={ad.logoUrl} alt={ad.company} class="max-h-full max-w-full" />
                  </div>
                  
                  <!-- Title -->
                  <h3 class="text-[#01366b] text-lg font-bold mb-4 text-center">
                    {ad.title}
                  </h3>
                  
                  <!-- Description Points -->
                  <ul class="space-y-2 mb-4">
                    {#each ad.description as desc}
                      <li class="text-[#666] text-sm flex items-start">
                        <svg class="w-5 h-5 text-[#47c2e8] mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        {desc}
                      </li>
                    {/each}
                  </ul>
                  
                  <!-- CTA Button -->
                  <div class="text-center">
                    <span class="inline-block bg-[#47c2e8] text-white px-8 py-3 rounded-lg font-semibold">
                      View Quote
                    </span>
                  </div>
                </a>
              {/each}
            </div>
          {:else}
            <div class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#47c2e8]"></div>
              <p class="text-[#858f97] mt-4">Loading your personalized quotes...</p>
            </div>
          {/if}
        </div>
      {/if}
      
      {/if}

  </div>
  </div>


  <!-- Footer -->
  <Disclaimer />
  <GoogleFooter ClassName="py-4 bg-gray-100" />
</div>

<style>
  /* Tiempos Headline Font */
  @font-face {
    font-family: 'Tiempos Headline';
    src: url('/fonts/TiemposHeadline-Medium.otf') format('opentype');
    font-weight: 300;
    font-style: normal;
  }
  
  /* Bootstrap Container */
  .container {
    margin-left: auto;
    margin-right: auto;
    padding-left: 15px;
    padding-right: 15px;
    width: 100%;
  }
  
  @media (min-width: 576px) {
    .container {
      max-width: 540px;
    }
  }
  
  @media (min-width: 768px) {
    .container {
      max-width: 720px;
    }
  }
  
  @media (min-width: 1024px) {
    .container {
      max-width: 960px;
    }
  }
  
  @media (min-width: 1440px) {
    .container {
      max-width: 1140px;
    }
  }
  
  /* Question Headings */
  h1 {
    font-family: 'Tiempos Headline', Georgia, serif;
    font-weight: 300;
    font-size: 36px;
    color: #124476;
    text-align: center;
  }

  h2 {
    font-family: 'Tiempos Headline', Georgia, serif;
    font-weight: 300;
    font-size: 27px;
    color: #124476;
    text-align: center;
  }
  
  /* Simple Full-Width Buttons */
  .simple-option {
    width: 100%;
    padding: 15px 30px;
    background-color: #e7e7e7;
    color: #124476;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none;
  }
  
  .simple-option:hover {
    background-color: #46c2e8;
    color: white;
  }
  
  .simple-option.active-simple {
    background-color: #46c2e8;
    color: white;
  }
  
  .simple-option-gray {
    width: 100%;
    padding: 15px 30px;
    background-color: #e7e7e7;
    color: #124476;
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none;
  }
  
  .simple-option-gray:hover {
    background-color: #46c2e8;
    color: white;
  }
  
  .simple-option-gray.active-simple-gray {
    background-color: #46c2e8;
    color: white;
  }
  
  /* Grid Card Options (Year, Make, Model) */
  .option-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    min-width: 100px;
    height: 72px;
    border: none;
    border-radius: 0;
    background-color: #e7e7e7;
    color: #124476;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: none;
  }
  
  .option-card:hover {
    background-color: #46c2e8;
    color: white;
  }
  
  .option-card.active {
    background-color: #46c2e8;
    color: white;
  }
  
  @media (max-width: 575px) {
    .option-card {
      width: 100%;
    }
  }
  
  /* Step 10 Input Field Styles */
  .input-container input:focus::placeholder {
    color: rgba(18,68,118,0.2);
  }
  
  .input-container input::placeholder {
    color: transparent;
  }
  
  .input-container label {
    transition: all 0.15s ease;
  }
  
  /* Label animation states */
  .label-center {
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    line-height: 24px;
    color: rgba(18,68,118,0.5);
  }
  
  .label-float {
    top: 12px;
    transform: translateY(0);
    font-size: 12px;
    line-height: 16px;
    color: rgba(18,68,118,0.5);
  }
</style>

