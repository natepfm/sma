export function getClientInfo(request: Request, platform?: App.Platform) {
    
    const cf = (platform as any)?.cf;
    const geo = {
        country: cf.country,
        region: cf.region,
        city: cf.city,
        postalCode: cf.postalCode,
        postal_code: cf.postal_code,
        latitude: cf.latitude,
        longitude: cf.longitude
    };
  
    return {    
      geo
    };
  }