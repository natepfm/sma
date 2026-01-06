import type { PageServerLoad } from './$types';
import { getClientInfo } from '$lib/utils/cloudflareClientInfo';


export const load: PageServerLoad = async ({ request, platform }) => {
    
    const client = getClientInfo(request, platform);

  return {
    country: client.geo.country,
    region: client.geo.region,
    city: client.geo.city,
    zipcode: client.geo.postalCode || client.geo.postal_code || ''
  };
};

