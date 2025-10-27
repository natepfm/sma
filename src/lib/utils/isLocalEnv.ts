export function isLocalEnv() {
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.endsWith('.local') ||
      host === '[::1]' // IPv6 loopback
    );
  }