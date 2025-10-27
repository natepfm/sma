export function getTrackingDomain(trackingPrefix:string, hostname: string) {
    const parts = hostname.split('.').filter(Boolean);
  
    if (parts.length <= 2) {
      // Already root domain like "example.com"
      return `${trackingPrefix ? trackingPrefix + "." : ""}${hostname}`;
    }
  
    // Replace first subdomain with 't'
    return [trackingPrefix, ...parts.slice(-2)].join('.');
  }
  