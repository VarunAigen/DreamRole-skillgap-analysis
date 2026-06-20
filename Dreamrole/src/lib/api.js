import { auth } from '../firebase'

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Firebase ID token as a Bearer token
 * to every request made through this function.
 *
 * Usage: Drop-in replacement for fetch()
 *   const res = await authFetch('/api/skills/extract', {
 *       method: 'POST',
 *       body: JSON.stringify({ resume_text })
 *   })
 *
 * Notes:
 * - Sets Content-Type: application/json by default (skipped for FormData bodies)
 * - If the user is not signed in, the request is sent without a token
 *   (the backend will reject it with 401 for protected routes)
 */
export async function authFetch(url, options = {}) {
    const headers = { ...options.headers }

    // Attach Firebase ID token if user is signed in
    try {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken()
            headers['Authorization'] = `Bearer ${token}`
            headers['x-user-uid'] = auth.currentUser.uid
        }
    } catch (err) {
        console.warn('[authFetch] Could not get ID token:', err.message)
    }

    // Auto-set Content-Type for non-FormData bodies
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    const BASE_URL = import.meta.env.VITE_API_URL || '';
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    return fetch(fullUrl, { ...options, headers })
}
