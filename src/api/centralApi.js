/**
 * centralApi.js - Live Central Events Backend Connector for VEDA
 * Connects directly to unified-backend on port 9022 (proxied via Vite /api)
 * ONLY fetches and returns real data created from the Admin Portal.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const centralApi = {
  /**
   * Fetch all Central Event Types (VEDA, COLORS, etc.)
   * API: GET /api/central-event-types
   */
  async getEventTypes() {
    try {
      const response = await fetch(`${BASE_URL}/central-event-types`);
      if (!response.ok) throw new Error(`Event Types API status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch central event types:', err);
      return [];
    }
  },

  /**
   * Fetch categories for a specific event type (default VEDA)
   * API: GET /api/central-event-types/:typeCode/categories
   */
  async getCategories(typeCode = 'VEDA') {
    try {
      const response = await fetch(`${BASE_URL}/central-event-types/${typeCode}/categories`);
      if (!response.ok) throw new Error(`Categories API status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch categories for ${typeCode}:`, err);
      return [];
    }
  },

  /**
   * Backwards-compatible alias for VEDA categories
   */
  async getVedaCategories() {
    return this.getCategories('VEDA');
  },

  /**
   * Fetch events with filter parameters (typeCode, categoryId, etc.)
   * API: GET /api/central-events
   */
  async getEvents(params = {}) {
    try {
      const query = new URLSearchParams({
        limit: 100,
        ...params
      });

      const response = await fetch(`${BASE_URL}/central-events?${query.toString()}`);
      if (!response.ok) throw new Error(`Events API status: ${response.status}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch events from backend:', err);
      return [];
    }
  },

  /**
   * Backwards-compatible alias for VEDA events
   */
  async getVedaEvents(params = {}) {
    return this.getEvents({ typeCode: 'VEDA', ...params });
  },

  /**
   * Fetch single event full details by slug or ID
   * API: GET /api/central-events/:slug
   */
  async getEventBySlug(slug) {
    try {
      const response = await fetch(`${BASE_URL}/central-events/${slug}`);
      if (!response.ok) {
        throw new Error(`Event API returned status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch single event details:', err);
      return null;
    }
  },

  /**
   * Submit registration to backend
   * API: POST /api/central-event-registrations
   */
  async submitRegistration(registrationPayload) {
    const response = await fetch(`${BASE_URL}/central-event-registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  /**
   * Verify Razorpay payment for registration
   * API: POST /api/central-event-registrations/verify-payment
   */
  async verifyRegistrationPayment(verifyPayload) {
    const response = await fetch(`${BASE_URL}/central-event-registrations/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed');
    }
    return data;
  },

  /**
   * Fetch Organisation Committee members from backend
   * API: GET /api/central-events/organisation-committee?event_type=VEDA
   */
  async getOrganisationCommittee(eventType = 'VEDA') {
    try {
      const response = await fetch(`${BASE_URL}/central-events/organisation-committee?event_type=${eventType}`);
      if (!response.ok) throw new Error(`Organisation Committee status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch organisation committee:', err);
      return [];
    }
  },

  /**
   * Student Login
   * API: POST /api/event-students/login
   */
  async studentLogin(email, password) {
    const response = await fetch(`${BASE_URL}/event-students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    return data;
  },

  /**
   * Student Register / Sign Up
   * API: POST /api/event-students/register
   */
  async studentRegister(studentData) {
    const response = await fetch(`${BASE_URL}/event-students/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Registration failed');
    }
    return data;
  },

  /**
   * Auto-populate Student Details from Aditya ECAP API
   * Endpoint: https://info.aec.edu.in/adityaapi/api/studentdata/{rollNo}
   * Fetches API Key from .env (VITE_STUDENT_API_KEY)
   */
  async lookupStudentByRoll(rollNo) {
    if (!rollNo) return null;
    const cleanRoll = String(rollNo).trim().toUpperCase();
    if (cleanRoll.length < 5) return null;

    const apiKey = import.meta.env.VITE_STUDENT_API_KEY || '4T4K65HWxqKD90AEZoCZLqA+m3nq6JvwDRDHIJUBFc4=';
    const apiUrl = import.meta.env.VITE_STUDENT_DATA_API_URL || 'https://info.aec.edu.in/adityaapi/api/studentdata';

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['apiKey'] = apiKey;
      headers['X-API-Key'] = apiKey;
      headers['x-api-key'] = apiKey;
    }

    // Attempt 1: Proxied request via Vite dev server
    try {
      const proxiedUrl = `/adityaapi/api/studentdata/${encodeURIComponent(cleanRoll)}`;
      const response = await fetch(proxiedUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        if (data && typeof data === 'object' && !data.error) {
          return data;
        }
      }
    } catch (err) {
      // fallback
    }

    // Attempt 2: Direct call to full apiUrl configured in .env
    try {
      const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/${encodeURIComponent(cleanRoll)}`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        if (data && typeof data === 'object' && !data.error) {
          return data;
        }
      }
    } catch (err) {
      // fallback
    }

    // Attempt 3: Backend proxy fallback
    try {
      const response = await fetch(`${BASE_URL}/payments/registrations/branch/${encodeURIComponent(cleanRoll)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
      }
    } catch (err) {
      console.error('All student lookup attempts failed:', err);
    }

    return null;
  }
};


