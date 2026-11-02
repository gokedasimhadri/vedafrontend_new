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
   * Step 1: Student Login (Queries central_event_student_account collection)
   * API: POST /api/central-event-student-account/login or /api/event-students/login
   */
  async studentLogin(identifierOrEmail, password) {
    let response;
    try {
      response = await fetch(`${BASE_URL}/central-event-student-account/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifierOrEmail, email: identifierOrEmail, password })
      });
    } catch {
      // network fallback
    }

    // Only fallback if route was 404 (not mounted) or network error
    if (!response || response.status === 404) {
      response = await fetch(`${BASE_URL}/event-students/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifierOrEmail, identifier: identifierOrEmail, password })
      });
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    return data;
  },

  /**
   * Step 1: Student Register / Sign Up (Stores into central_event_student_account collection)
   * API: POST /api/central-event-student-account/register or /api/event-students/register
   */
  async studentRegister(studentData) {
    let response;
    try {
      response = await fetch(`${BASE_URL}/central-event-student-account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
    } catch {
      // network fallback
    }

    // Only fallback if route was 404 (not mounted) or network error
    if (!response || response.status === 404) {
      response = await fetch(`${BASE_URL}/event-students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Registration failed');
    }
    return data;
  },

  /**
   * Step 2 & 3: Fetch all registrations for a student
   * API: GET /api/central-event-registrations/student/:rollOrId
   */
  async getStudentRegistrations(rollOrId) {
    try {
      const response = await fetch(`${BASE_URL}/central-event-registrations/student/${encodeURIComponent(rollOrId)}`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const res = await response.json();
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch student registrations:', err);
      return [];
    }
  },

  /**
   * Step 2 & 3: Fetch all registrations WITH payment data for a student
   * Combines central_event_student_registrations + central_event_student_payments
   * API: GET /api/central-event-registrations/student/:rollOrId/with-payments
   */
  async getStudentRegistrationsWithPayments(rollOrId) {
    try {
      const response = await fetch(`${BASE_URL}/central-event-registrations/student/${encodeURIComponent(rollOrId)}/with-payments`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const res = await response.json();
      return res.data || [];
    } catch (err) {
      // Fallback: just get registrations without payment info
      console.warn('Falling back to standard registrations fetch:', err.message);
      return this.getStudentRegistrations(rollOrId);
    }
  },

  /**
   * Step 3: Fetch payment status for a specific registration ID
   * API: GET /api/central-event-registrations/:id/payment-status
   */
  async getRegistrationPaymentStatus(registrationId) {
    try {
      const response = await fetch(`${BASE_URL}/central-event-registrations/${encodeURIComponent(registrationId)}/payment-status`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const res = await response.json();
      return res.data || null;
    } catch (err) {
      console.error('Failed to fetch registration payment status:', err);
      return null;
    }
  },

  /**
   * Auto-populate Student Details from Aditya ECAP API
   * Endpoint: https://info.aec.edu.in/adityaapi/api/studentdata/{rollNo}
   * Uses VITE_ECAP_API_KEY / VITE_STUDENT_API_KEY from .env
   */
  async lookupStudentByRoll(rollNo) {
    if (!rollNo) return null;
    const cleanRoll = String(rollNo).trim().toUpperCase();
    if (cleanRoll.length < 5) return null;

    const apiKey = import.meta.env.VITE_ECAP_API_KEY || import.meta.env.VITE_STUDENT_API_KEY;
    const apiUrl = import.meta.env.VITE_STUDENT_DATA_URL || import.meta.env.VITE_STUDENT_DATA_API_URL;

    const headers = {
      'Accept': 'application/json'
    };
    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    }

    const normalizeStudent = (raw) => {
      if (!raw || typeof raw !== 'object') return null;
      if (raw.Message || raw.error) return null;
      return {
        ...raw,
        roll: raw.rollno || raw.rollNumber || raw.roll || cleanRoll,
        rollno: raw.rollno || raw.rollNumber || raw.roll || cleanRoll,
        name: raw.studentname || raw.StudentName || raw.name || '',
        studentname: raw.studentname || raw.StudentName || raw.name || '',
        email: raw.emailid || raw.email || raw.Email || raw.studentemail || '',
        emailid: raw.emailid || raw.email || raw.Email || raw.studentemail || '',
        mobile: raw.mobilenumber || raw.MobileNumber || raw.phone || raw.mobile || '',
        mobilenumber: raw.mobilenumber || raw.MobileNumber || raw.phone || raw.mobile || '',
        branch: raw.branch || raw.Branch || raw.department || '',
        gender: raw.gender || raw.Gender || '',
        semester: raw.semestername || raw.Semester || raw.semester || '',
        semestername: raw.semestername || raw.Semester || raw.semester || '',
        batch: raw.joinedbatch || raw.acadamicbatch || '',
        joinedbatch: raw.joinedbatch || raw.acadamicbatch || '',
        college: raw.college || raw.College || raw.collegename || ''
      };
    };

    // Attempt 1: Proxied request via Vite dev server
    try {
      const proxiedUrl = `/adityaapi/api/studentdata/${encodeURIComponent(cleanRoll)}`;
      const response = await fetch(proxiedUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const norm = normalizeStudent(data[0]);
          if (norm) return norm;
        } else if (data && typeof data === 'object') {
          const norm = normalizeStudent(data);
          if (norm) return norm;
        }
      }
    } catch (err) {
      console.warn('Proxy student lookup attempt failed:', err.message);
    }

    // Attempt 2: Direct call to full apiUrl configured in .env
    try {
      const directUrl = `${apiUrl.replace(/\/+$/, '')}/${encodeURIComponent(cleanRoll)}`;
      const response = await fetch(directUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const norm = normalizeStudent(data[0]);
          if (norm) return norm;
        } else if (data && typeof data === 'object') {
          const norm = normalizeStudent(data);
          if (norm) return norm;
        }
      }
    } catch (err) {
      // CORS might block in browser, handled by fallback
    }

    // Attempt 3: Backend proxy fallback
    try {
      const response = await fetch(`${BASE_URL}/payments/registrations/branch/${encodeURIComponent(cleanRoll)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return normalizeStudent(data[0]);
        }
      }
    } catch (err) {
      console.error('All student lookup attempts failed:', err);
    }

    return null;
  }
};


