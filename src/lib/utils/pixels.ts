import { isLocalEnv } from "./isLocalEnv";
import { getTrackingDomain } from "./getTracking";
export function setupTracking(defaultValue: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const domain = isLocalEnv() ? defaultValue : window.location.hostname;
  searchParams.delete("t");
  const url = getTrackingDomain("t", domain);

  let redirectLink;
  try {
    redirectLink = new URL(`https://${url}/lc`);
    redirectLink.search = searchParams.toString();
  } catch (error) {
    console.error("Error creating redirect URL:", error);
    // Fallback URL
    return `https://${domain}/lc`;
  }

  // Handle pixel creation after a small delay
  setTimeout(() => {
    try {
      const cid = searchParams.get("cid");
      const lid = searchParams.get("lid");
      const fid = searchParams.get("fid");

      if (cid && lid && fid) {
        const pixel = document.createElement("img");
        pixel.src = `https://${url}/lv?cid=${cid}&lid=${lid}&fid=${fid}`;
        pixel.alt = "pixel";
        pixel.style.display = "none";
        document.body.appendChild(pixel);
      }
    } catch (error) {
      console.error("Error creating tracking pixel:", error);
    }
  }, 100);

  return redirectLink.toString();
}

export const getRootDomain = (hostname:string ) => {
  const parts = hostname.split(".");
  // if it’s something like “a.b.c.d”, take the last two segments
  if (parts.length > 2) {
    return parts.slice(parts.length - 2).join(".");
  }
  // otherwise just return as‐is
  return hostname;
};

export function getControlledLink(defaultValue: string, offerHash: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const cid = searchParams.get("cid");
  const lid = searchParams.get("lid");
  const fid = searchParams.get("fid");
  const domain = isLocalEnv()
    ? defaultValue
    : getRootDomain(window.location.hostname);
  if (cid && lid && fid) {
    return `https://t.${domain}/lto/${offerHash}?cid=${cid}&lid=${lid}&fid=${fid}`;
  } else {
    return `https://google.com/`;
  }
}
