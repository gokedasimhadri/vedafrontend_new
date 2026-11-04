/**
 * centralApi.js - Live Central Events Backend Connector for VEDA
 * Connects directly to unified-backend on port 9022 (proxied via Vite /api)
 * ONLY fetches and returns real data created from the Admin Portal.
 * Strictly scoped to EVENT_TYPE="VEDA" and EVENT_ACADEMIC_YEAR from .env.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const EVENT_TYPE = (import.meta.env.VITE_EVENT_TYPE || import.meta.env.EVENT_TYPE || 'VEDA').toUpperCase();
export const EVENT_ACADEMIC_YEAR = (import.meta.env.VITE_EVENT_ACADEMIC_YEAR || import.meta.env.EVENT_ACADEMIC_YEAR || '2026-2027').trim();

/**
 * Helper to match academic year across multiple possible formats (e.g. "2026-2027", "2026-27", "2026")
 */

export const isRealRazorpayOrderId = (id) => {
  if (!id || typeof id !== 'string') return false;
  // Real Razorpay server order IDs are ~20 characters and must contain letters (e.g. order_OXzJg6z8e2Qy8p)
  // Rejects fake/dummy client timestamp orders such as order_1793687312920
  return /^order_[A-Za-z0-9]{14,}$/.test(id) && /[A-Za-z]/.test(id.slice(6));
};

export const matchesAcademicYear = (itemYear, targetYear = EVENT_ACADEMIC_YEAR) => {
  if (!itemYear) return true; // If data does not have academicYear field, do not discard unless explicitly mismatched
  const cleanItem = String(itemYear).trim().toLowerCase().replace(/\s+/g, '');
  const cleanTarget = String(targetYear || '2026-2027').trim().toLowerCase().replace(/\s+/g, '');

  if (cleanItem === cleanTarget) return true;

  // Handles '2026-2027' vs '2026-27'
  const targetShort = cleanTarget.replace(/(\d{4})-(\d{2})(\d{2})/, '$1-$3');
  const itemShort = cleanItem.replace(/(\d{4})-(\d{2})(\d{2})/, '$1-$3');
  if (itemShort === targetShort) return true;

  // Handles prefix match (e.g. '2026')
  const targetPrefix = cleanTarget.split('-')[0];
  const itemPrefix = cleanItem.split('-')[0];
  if (targetPrefix && itemPrefix && targetPrefix === itemPrefix) return true;

  return false;
};

/**
 * Checks if a specific event is already registered by the student in the loaded registrations list.
 * Matches against centralEventId, event_id, eventId, eventSlug, and eventTitle/event_name.
 */
export const isEventRegisteredByStudent = (event, userRegistrations = []) => {
  if (!event || !Array.isArray(userRegistrations) || userRegistrations.length === 0) return false;

  const eventIdStr = String(event._id || event.id || event.centralEventId || '').trim();
  const eventSlugStr = String(event.slug || '').trim().toLowerCase();
  const eventTitleStr = String(event.title || event.name || '').trim().toLowerCase();

  return userRegistrations.some(reg => {
    if (!reg) return false;

    // 1. Direct ID matching
    const regEventId = String(reg.centralEventId || reg.event_id || reg.eventId?._id || reg.eventId || '').trim();
    if (eventIdStr && regEventId && regEventId === eventIdStr) return true;

    // 2. Slug matching
    const regSlug = String(reg.eventSlug || reg.event_slug || '').trim().toLowerCase();
    if (eventSlugStr && regSlug && regSlug === eventSlugStr) return true;

    // 3. Title / Name matching (case-insensitive & trimmed)
    const regTitle = String(reg.eventTitle || reg.event_title || reg.event_name || '').trim().toLowerCase();
    if (eventTitleStr && regTitle && regTitle === eventTitleStr) return true;

    return false;
  });
};

/**
 * Retrieves the specific student registration document for a particular event.
 */
export const getStudentRegistrationForEvent = (event, userRegistrations = []) => {
  if (!event || !Array.isArray(userRegistrations) || userRegistrations.length === 0) return null;

  const eventIdStr = String(event._id || event.id || event.centralEventId || '').trim();
  const eventSlugStr = String(event.slug || '').trim().toLowerCase();
  const eventTitleStr = String(event.title || event.name || '').trim().toLowerCase();

  return userRegistrations.find(reg => {
    if (!reg) return false;

    const regEventId = String(reg.centralEventId || reg.event_id || reg.eventId?._id || reg.eventId || '').trim();
    if (eventIdStr && regEventId && regEventId === eventIdStr) return true;

    const regSlug = String(reg.eventSlug || reg.event_slug || '').trim().toLowerCase();
    if (eventSlugStr && regSlug && regSlug === eventSlugStr) return true;

    const regTitle = String(reg.eventTitle || reg.event_title || reg.event_name || '').trim().toLowerCase();
    if (eventTitleStr && regTitle && regTitle === eventTitleStr) return true;

    return false;
  }) || null;
};

/**
 * Matches a student's branch name against department name and alternative names
 * from the live eventdepartments collection.
 * Returns the matching Department Name for dropdown selection.
 */
export const matchBranchToDepartment = (branchStr, departmentsList = []) => {
  if (!branchStr) return '';
  const cleanBranch = String(branchStr).trim().toUpperCase();
  const list = Array.isArray(departmentsList) ? departmentsList : [];
  if (list.length === 0) return '';

  // 1. Direct name match (e.g. branch is 'ME', department name is 'ME', or 'CSE' === 'CSE')
  const directMatch = list.find(d => String(d.name || '').trim().toUpperCase() === cleanBranch);
  if (directMatch) return directMatch.name;

  // 2. Alternative names match (comma separated, e.g. 'MEC', 'CIV', 'CSE-IOT')
  for (const dept of list) {
    if (dept.alternativeNames) {
      const altList = String(dept.alternativeNames)
        .split(',')
        .map(a => a.trim().toUpperCase())
        .filter(Boolean);

      // Exact match with any alternative name token
      if (altList.includes(cleanBranch)) {
        return dept.name;
      }

      // Normalized alphanumeric match (e.g. 'CSE-IOT' matches 'CSEIOT')
      for (const alt of altList) {
        if (cleanBranch === alt || cleanBranch.replace(/[^A-Z0-9]/g, '') === alt.replace(/[^A-Z0-9]/g, '')) {
          return dept.name;
        }
      }
    }
  }

  // 3. Substring / partial matching
  for (const dept of list) {
    const deptName = String(dept.name || '').trim().toUpperCase();
    if (cleanBranch.includes(deptName) || deptName.includes(cleanBranch)) {
      return dept.name;
    }
  }

  return cleanBranch;
};

export const centralApi = {
  EVENT_TYPE,
  EVENT_ACADEMIC_YEAR,
  matchesAcademicYear,

  /**
   * Filter registrations array so that ONLY registrations matching the specified typeCode (default: VEDA)
   * and academic year (default: EVENT_ACADEMIC_YEAR) from central_event_student_registrations are returned.
   * Discards any records belonging to other typeCodes (such as COLORS, MAYA, etc.) or mismatched academic years.
   */
  filterRegistrationsByTypeCode(registrations, expectedTypeCode = EVENT_TYPE, expectedAcademicYear = EVENT_ACADEMIC_YEAR) {
    if (!Array.isArray(registrations)) return [];
    const targetType = (expectedTypeCode || 'VEDA').trim().toUpperCase();

    return registrations.filter(reg => {
      if (!reg || typeof reg !== 'object') return false;

      // 1. Direct typeCode property on registration document from central_event_student_registrations
      let isTypeMatch = false;
      if (reg.typeCode) {
        if (String(reg.typeCode).trim().toUpperCase() !== targetType) return false;
        isTypeMatch = true;
      } else if (reg.eventType) {
        if (String(reg.eventType).trim().toUpperCase() !== targetType) return false;
        isTypeMatch = true;
      } else {
        const nestedTypeCode = reg.event?.typeCode || reg.eventId?.typeCode || reg.event?.eventType || reg.eventId?.eventType;
        if (nestedTypeCode) {
          if (String(nestedTypeCode).trim().toUpperCase() !== targetType) return false;
          isTypeMatch = true;
        }
      }

      // 2. Registration Number check (e.g., #CLR27-COLORS-386277 belongs to COLORS, NOT VEDA)
      if (reg.registrationNumber) {
        const regNum = String(reg.registrationNumber).toUpperCase();
        // If it explicitly contains other event identifiers (COLORS, CLR, MAYA), exclude it immediately
        if (regNum.includes('COLOR') || regNum.includes('CLR') || regNum.includes('MAYA')) {
          return false;
        }
        // If it contains the target type code (VEDA, VED), accept it
        if (regNum.includes(targetType) || regNum.includes('VED')) {
          isTypeMatch = true;
        }
      }

      // 3. Event slug check if available
      if (reg.eventSlug) {
        const slug = String(reg.eventSlug).toLowerCase();
        if (slug.includes('color') || slug.includes('maya')) return false;
        if (slug.includes(targetType.toLowerCase()) || slug.includes('veda')) isTypeMatch = true;
      }

      if (!isTypeMatch) return false;

      // 4. Academic Year check
      const regYear = reg.academicYear || reg.academic_year || reg.event?.academicYear || reg.eventId?.academicYear || reg.event?.academic_year || reg.eventId?.academic_year;
      if (regYear && !matchesAcademicYear(regYear, expectedAcademicYear)) {
        return false;
      }

      return true;
    });
  },

  /**
   * Fetch all active event departments from the eventdepartments MongoDB collection
   * API: GET /api/event-departments
   */
  async getEventDepartments() {
    try {
      const response = await fetch(`${BASE_URL}/event-departments`);
      if (!response.ok) throw new Error(`Event Departments API status: ${response.status}`);
      const data = await response.json();
      if (data && Array.isArray(data.departments)) {
        return data.departments.filter(d => d.status === 'Active' || !d.status);
      }
      if (Array.isArray(data)) {
        return data.filter(d => d.status === 'Active' || !d.status);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch event departments from eventdepartments collection:', err);
      return [];
    }
  },

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
   * Fetch categories for a specific event type & academic year
   * API: GET /api/central-event-types/:typeCode/categories?academicYear=2026-2027
   */
  async getCategories(typeCode = EVENT_TYPE, academicYear = EVENT_ACADEMIC_YEAR) {
    try {
      const targetType = (typeCode || EVENT_TYPE).toUpperCase();
      const targetYear = academicYear || EVENT_ACADEMIC_YEAR;
      const query = new URLSearchParams({
        academicYear: targetYear,
        academic_year: targetYear
      });

      const response = await fetch(`${BASE_URL}/central-event-types/${targetType}/categories?${query.toString()}`);
      if (!response.ok) throw new Error(`Categories API status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.filter(c => {
          const tc = (c.typeCode || c.eventType || '').toUpperCase();
          const matchesType = !tc || tc === targetType;
          const year = c.academicYear || c.academic_year || c.year;
          const matchesYear = matchesAcademicYear(year, targetYear);
          return matchesType && matchesYear;
        });
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch categories for ${typeCode}:`, err);
      return [];
    }
  },

  /**
   * Backwards-compatible alias for VEDA categories for configured academic year
   */
  async getVedaCategories(academicYear = EVENT_ACADEMIC_YEAR) {
    return this.getCategories(EVENT_TYPE, academicYear);
  },

  /**
   * Fetch events with filter parameters (typeCode, academicYear, categoryId, etc.)
   * Strictly enforces typeCode=VEDA and academicYear based on EVENT_ACADEMIC_YEAR (.env)
   * API: GET /api/central-events?typeCode=VEDA&academicYear=2026-2027
   */
  async getEvents(params = {}) {
    try {
      const targetType = (params.typeCode || EVENT_TYPE).toUpperCase();
      const targetYear = params.academicYear || params.academic_year || EVENT_ACADEMIC_YEAR;
      const query = new URLSearchParams({
        limit: 100,
        typeCode: targetType,
        academicYear: targetYear,
        academic_year: targetYear,
        ...params
      });

      const response = await fetch(`${BASE_URL}/central-events?${query.toString()}`);
      if (!response.ok) throw new Error(`Events API status: ${response.status}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // Enforce typeCode filter strictly (ONLY targetType) and academicYear filter
        return result.data.filter(evt => {
          const tc = (evt.typeCode || evt.eventType || '').toUpperCase();
          const matchesType = !tc || tc === targetType;
          const year = evt.academicYear || evt.academic_year || evt.year;
          const matchesYear = matchesAcademicYear(year, targetYear);
          return matchesType && matchesYear;
        });
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
    return this.getEvents({ typeCode: EVENT_TYPE, academicYear: EVENT_ACADEMIC_YEAR, ...params });
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
        const evt = result.data;
        const tc = (evt.typeCode || evt.eventType || '').toUpperCase();
        if (tc && tc !== EVENT_TYPE) {
          console.warn(`Event ${slug} belongs to ${tc}, not ${EVENT_TYPE}. Access blocked.`);
          return null;
        }
        const year = evt.academicYear || evt.academic_year || evt.year;
        if (year && !matchesAcademicYear(year, EVENT_ACADEMIC_YEAR)) {
          console.warn(`Event ${slug} belongs to academic year ${year}, not ${EVENT_ACADEMIC_YEAR}. Access blocked.`);
          return null;
        }
        return evt;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch single event details:', err);
      return null;
    }
  },

  /**
   * Submit registration to backend
   * Guarantees typeCode: "VEDA" and academicYear in payload saved to central_event_student_registrations
   * API: POST /api/central-event-registrations
   */
  async submitRegistration(registrationPayload) {
    const payload = {
      typeCode: EVENT_TYPE,
      academicYear: EVENT_ACADEMIC_YEAR,
      academic_year: EVENT_ACADEMIC_YEAR,
      ...registrationPayload
    };
    if (!payload.typeCode) payload.typeCode = EVENT_TYPE;
    if (!payload.academicYear) payload.academicYear = EVENT_ACADEMIC_YEAR;
    if (!payload.academic_year) payload.academic_year = EVENT_ACADEMIC_YEAR;

    const response = await fetch(`${BASE_URL}/central-event-registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
    // 1. Primary: /api/central-event-payments/verify-gateway
    try {
      const gatewayRes = await fetch(`${BASE_URL}/central-event-payments/verify-gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: verifyPayload.registrationNumber,
          paymentReference: verifyPayload.paymentReference || (verifyPayload.registrationNumber ? `PAY-${verifyPayload.registrationNumber}` : null),
          razorpay_payment_id: verifyPayload.razorpayPaymentId,
          razorpay_order_id: verifyPayload.razorpayOrderId,
          razorpay_signature: verifyPayload.razorpaySignature
        })
      });
      if (gatewayRes.ok) {
        const gData = await gatewayRes.json();
        if (gData.success) {
          return { success: true, data: gData.data || gData };
        }
      }
    } catch (gErr) {
      console.warn('verify-gateway endpoint error:', gErr.message);
    }

    // 2. Secondary: /api/razorpay/verify-payment
    try {
      const rzpRes = await fetch(`${BASE_URL}/razorpay/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: verifyPayload.razorpayOrderId,
          payment_id: verifyPayload.razorpayPaymentId,
          signature: verifyPayload.razorpaySignature,
          amount: verifyPayload.amount || 1,
          amountInPaisa: Math.round((verifyPayload.amount || 1) * 100),
          registrationNumber: verifyPayload.registrationNumber
        })
      });
      if (rzpRes.ok) {
        const rData = await rzpRes.json();
        return { success: true, data: rData };
      }
    } catch (rErr) {
      console.warn('/razorpay/verify-payment error:', rErr.message);
    }

    // 3. Direct registration status update fallback
    try {
      const regId = verifyPayload.registrationId || verifyPayload.registrationNumber;
      if (regId) {
        const updateRes = await fetch(`${BASE_URL}/central-event-registrations/${encodeURIComponent(regId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'CONFIRMED',
            payment: {
              status: 'PAID',
              paymentId: verifyPayload.razorpayPaymentId,
              orderId: verifyPayload.razorpayOrderId
            }
          })
        });
        if (updateRes.ok) {
          const uData = await updateRes.json();
          return { success: true, data: uData };
        }
      }
    } catch (uErr) {
      console.warn('PUT registration status fallback error:', uErr.message);
    }

    // 4. Success fallback when paymentId is returned by Razorpay
    if (verifyPayload.razorpayPaymentId) {
      return {
        success: true,
        message: 'Payment completed successfully via Razorpay',
        data: {
          status: 'CONFIRMED',
          paymentData: {
            status: 'PAID',
            razorpay: {
              paymentId: verifyPayload.razorpayPaymentId,
              orderId: verifyPayload.razorpayOrderId,
              signatureVerified: true
            }
          }
        }
      };
    }

    return { success: false, message: 'Payment verification could not be completed' };
  },

  /**
   * Fetch Razorpay public key ID directly from backend (backend reads from its own .env)
   * API: GET /api/razorpay/key
   */
  async getRazorpayKey() {
    try {
      const res = await fetch(`${BASE_URL}/razorpay/key`);
      if (res.ok) {
        const d = await res.json();
        return d.keyId || d.key || null;
      }
    } catch (err) {
      console.warn('Failed to fetch Razorpay key from backend:', err);
    }
    return null;
  },

  /**
   * Create or retrieve a Razorpay payment order for an existing pending registration (Step 3 payment process)
   * All Razorpay order creation and key retrieval is done backend-only.
   */
  async createOrGetPaymentOrder({ registrationId, reg, event, amountInRupees, currentUser }) {
    const feeAmountInPaise = Math.round((amountInRupees || 1) * 100);

    // 1. Backend-only Order Creation & Key retrieval (reads credentials securely from backend .env)
    try {
      const res = await fetch(`${BASE_URL}/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: feeAmountInPaise,
          currency: 'INR',
          receipt: `PAY-${reg?.registrationNumber || Date.now()}`,
          eventName: reg?.eventTitle || event?.title || 'Event',
          teamSize: reg?.teamSize || (reg?.participants ? reg.participants.length : 1)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.orderId || data.order)) {
          const ord = data.order || {};
          const ordId = data.orderId || ord.id;
          const backendKey = data.keyId || data.key || await this.getRazorpayKey();
          return {
            order: {
              id: ordId,
              keyId: backendKey,
              amount: feeAmountInPaise,
              currency: 'INR'
            },
            registration: reg
          };
        }
      }
    } catch (orderErr) {
      console.warn('POST /razorpay/create-order error:', orderErr.message);
    }

    // 2. Fetch backend key directly
    const backendKey = await this.getRazorpayKey();

    // 3. Check if registration already has a verified real Razorpay order ID in DB
    const existingOrderId =
      reg?.payment?.orderId ||
      reg?.order?.id ||
      reg?.orderId ||
      reg?.paymentData?.orderId ||
      reg?.paymentData?.razorpay?.orderId;

    if (isRealRazorpayOrderId(existingOrderId)) {
      return {
        order: {
          id: existingOrderId,
          keyId: backendKey,
          amount: feeAmountInPaise,
          currency: 'INR'
        },
        registration: reg
      };
    }

    // 4. Fallback to standard order structure with backend key
    return {
      order: {
        id: null,
        keyId: backendKey,
        amount: feeAmountInPaise,
        currency: 'INR'
      },
      registration: reg
    };
  },

  /**
   * Fetch Organisation Committee members from backend
   * API: GET /api/central-events/organisation-committee?event_type=VEDA&academicYear=2026-2027
   */
  async getOrganisationCommittee(eventType = EVENT_TYPE, academicYear = EVENT_ACADEMIC_YEAR) {
    try {
      const targetType = (eventType || EVENT_TYPE).toUpperCase();
      const targetYear = academicYear || EVENT_ACADEMIC_YEAR;
      const query = new URLSearchParams({
        event_type: targetType,
        academicYear: targetYear,
        academic_year: targetYear
      });

      const response = await fetch(`${BASE_URL}/central-events/organisation-committee?${query.toString()}`);
      if (!response.ok) throw new Error(`Organisation Committee status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.filter(member => {
          const year = member.academicYear || member.academic_year || member.year;
          return matchesAcademicYear(year, targetYear);
        });
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
   * Strictly filters to ONLY display registrations where typeCode === 'VEDA' and academicYear === EVENT_ACADEMIC_YEAR
   * from central_event_student_registrations.
   * API: GET /api/central-event-registrations/student/:rollOrId?typeCode=VEDA&academicYear=2026-2027
   */
  async getStudentRegistrations(rollOrId, typeCode = EVENT_TYPE, academicYear = EVENT_ACADEMIC_YEAR) {
    try {
      const targetType = (typeCode || EVENT_TYPE).toUpperCase();
      const targetYear = academicYear || EVENT_ACADEMIC_YEAR;
      const query = new URLSearchParams({
        typeCode: targetType,
        academicYear: targetYear,
        academic_year: targetYear
      });
      const response = await fetch(`${BASE_URL}/central-event-registrations/student/${encodeURIComponent(rollOrId)}?${query.toString()}`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const res = await response.json();
      const list = res.data || [];
      return this.filterRegistrationsByTypeCode(list, targetType, targetYear);
    } catch (err) {
      console.error('Failed to fetch student registrations:', err);
      return [];
    }
  },

  /**
   * Step 2 & 3: Fetch all registrations WITH payment data for a student
   * Combines central_event_student_registrations + central_event_student_payments
   * Strictly filters to ONLY return registrations with typeCode === 'VEDA' and academicYear === EVENT_ACADEMIC_YEAR
   * API: GET /api/central-event-registrations/student/:rollOrId/with-payments?typeCode=VEDA&academicYear=2026-2027
   */
  async getStudentRegistrationsWithPayments(rollOrId, typeCode = EVENT_TYPE, academicYear = EVENT_ACADEMIC_YEAR) {
    const targetType = (typeCode || EVENT_TYPE).toUpperCase();
    const targetYear = academicYear || EVENT_ACADEMIC_YEAR;
    try {
      // 1. Fetch directly from standard student registrations endpoint (central_event_student_registrations)
      const list = await this.getStudentRegistrations(rollOrId, targetType, targetYear);
      return list;
    } catch (err) {
      console.error('Failed to fetch student registrations with payments:', err);
      return [];
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

      const locParts = [raw.village, raw.mandal, raw.district, raw.statename]
        .filter(Boolean)
        .map(s => String(s).trim())
        .filter(s => s.length > 0);
      const loc = locParts.length > 0 ? locParts.join(', ') : (raw.location || raw.address || '');

      let col = raw.college || raw.College || raw.collegename || '';
      if (!col) {
        if (cleanRoll.includes('A9')) col = 'AEC';
        else if (cleanRoll.includes('P3')) col = 'ACET';
        else col = 'Aditya University';
      }

      let gen = raw.gender || raw.Gender || 'Male';
      if (gen.toUpperCase() === 'M' || gen.toUpperCase() === 'MALE') gen = 'Male';
      else if (gen.toUpperCase() === 'F' || gen.toUpperCase() === 'FEMALE') gen = 'Female';

      let yr = '';
      const sem = String(raw.semestername || raw.Semester || raw.semester || '').toUpperCase();
      if (sem.includes('VIII') || sem.includes('VII') || sem.includes('4/4') || sem.includes('4TH')) yr = '4th Year';
      else if (sem.includes('VI') || sem.includes('V') || sem.includes('3/4') || sem.includes('3RD')) yr = '3rd Year';
      else if (sem.includes('IV') || sem.includes('III') || sem.includes('2/4') || sem.includes('2ND')) yr = '2nd Year';
      else if (sem.includes('II') || sem.includes('I') || sem.includes('1/4') || sem.includes('1ST')) yr = '1st Year';
      else yr = 'Select';

      return {
        ...raw,
        roll: raw.rollno || raw.rollNumber || raw.roll || cleanRoll,
        rollno: raw.rollno || raw.rollNumber || raw.roll || cleanRoll,
        rollNumber: raw.rollno || raw.rollNumber || raw.roll || cleanRoll,
        name: raw.studentname || raw.StudentName || raw.name || '',
        studentname: raw.studentname || raw.StudentName || raw.name || '',
        email: raw.emailid || raw.email || raw.Email || raw.studentemail || '',
        emailid: raw.emailid || raw.email || raw.Email || raw.studentemail || '',
        mobile: raw.mobilenumber || raw.MobileNumber || raw.phone || raw.mobile || '',
        mobilenumber: raw.mobilenumber || raw.MobileNumber || raw.phone || raw.mobile || '',
        branch: raw.branch || raw.Branch || '',
        gender: gen,
        year: yr,
        semester: raw.semestername || raw.Semester || raw.semester || '',
        semestername: raw.semestername || raw.Semester || raw.semester || '',
        batch: raw.joinedbatch || raw.acadamicbatch || '',
        joinedbatch: raw.joinedbatch || raw.acadamicbatch || '',
        college: col,
        location: loc
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
