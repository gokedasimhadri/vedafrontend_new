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
  }
};
