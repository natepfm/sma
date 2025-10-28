import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const { endpoint, method = 'GET', payload, sessionId, cookies: clientCookies = [] } = body;
  
  try {
    // Get or create session ID
    const sid = sessionId || cookies.get('savemaxauto_sid') || crypto.randomUUID();
    
    // Override refererUrl for create-session to mask localhost
    if (endpoint === '/api/v1/create-session' && payload) {
      payload.refererUrl = 'https://savemaxauto.com/form/';
    }
    
    // Build request to SaveMaxAuto API
    const apiUrl = `https://savemaxauto.com${endpoint}`;
    const fetchOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://savemaxauto.com/form/',
        'Origin': 'https://savemaxauto.com',
        'Host': 'savemaxauto.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        // Include cookies from client
        ...(clientCookies.length > 0 ? { 'Cookie': clientCookies.join('; ') } : {})
      },
      ...(payload ? { body: JSON.stringify(payload) } : {})
    };
    
    console.log('POST Proxy calling:', apiUrl);
    console.log('With cookies:', clientCookies);
    console.log('Payload keys:', payload ? Object.keys(payload) : 'none');
    
    // Make request to SaveMaxAuto
    const response = await fetch(apiUrl, fetchOptions);
    const responseText = await response.text();
    
    console.log('POST Response status:', response.status);
    console.log('POST Response body:', responseText.substring(0, 500));
    
    // Extract cookies from response to return to client
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const responseCookies = setCookieHeaders.length > 0 
      ? setCookieHeaders.map(cookie => cookie.split(';')[0])
      : clientCookies; // Return existing cookies if no new ones
    
    // Set our own session cookie
    cookies.set('savemaxauto_sid', sid, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    // Parse response data
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse POST response as JSON:', e);
      return json({
        success: false,
        data: {},
        error: responseText,
        sessionId: sid,
        cookies: responseCookies,
        status: response.status
      });
    }
    
    return json({
      success: response.ok,
      data,
      sessionId: sid,
      cookies: responseCookies,
      status: response.status
    });
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    return json({
      success: false,
      error: error.message,
      endpoint
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ request, url, cookies }) => {
  const endpoint = url.searchParams.get('endpoint');
  const sessionId = url.searchParams.get('sessionId') || cookies.get('savemaxauto_sid');
  const cookiesParam = url.searchParams.get('cookies');
  const clientCookies = cookiesParam ? JSON.parse(cookiesParam) : [];
  
  if (!endpoint) {
    return json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }
  
  try {
    
    // Build request to SaveMaxAuto API - endpoint already includes query params
    const apiUrl = `https://savemaxauto.com${endpoint}`;
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://savemaxauto.com/form/',
        'Origin': 'https://savemaxauto.com',
        'Host': 'savemaxauto.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        // Include cookies from client
        ...(clientCookies.length > 0 ? { 'Cookie': clientCookies.join('; ') } : {})
      }
    };
    
    console.log('GET Proxy calling:', apiUrl);
    console.log('With cookies:', clientCookies);
    
    // Make request to SaveMaxAuto
    const response = await fetch(apiUrl, fetchOptions);
    const responseText = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response body:', responseText.substring(0, 200));
    
    // Extract cookies from response to return to client
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const responseCookies = setCookieHeaders.length > 0
      ? setCookieHeaders.map(cookie => cookie.split(';')[0])
      : clientCookies; // Return existing cookies if no new ones
    
    let data = {};
    
    // Handle non-200 responses
    if (!response.ok) {
      console.error('API Error:', response.status, responseText);
      return json({
        success: false,
        data: {},
        error: responseText,
        sessionId,
        cookies: responseCookies,
        status: response.status
      });
    }
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      // Return text response as error
      return json({
        success: false,
        data: {},
        error: responseText,
        sessionId,
        cookies: clientCookies,
        status: response.status
      });
    }
    
    return json({
      success: true,
      data,
      sessionId,
      cookies: responseCookies,
      status: response.status
    });
    
  } catch (error: any) {
    console.error('Proxy GET error:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

