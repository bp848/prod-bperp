import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { getEnvValue } from '../utils.ts';
import { SUPABASE_URL as HARDCODED_SUPABASE_URL, SUPABASE_KEY as HARDCODED_SUPABASE_KEY } from '../supabaseCredentials.ts';

// Helper to determine if a URL is valid and not a placeholder
export const isValidSupabaseUrl = (value: string | null | undefined): boolean => {
    const isValid = !!(value && value !== 'YOUR_SUPABASE_URL' && (value.startsWith('http://') || value.startsWith('https://')));
    console.log(`isValidSupabaseUrl(${value ? value.substring(0, 20) + '...' : 'null'}): ${isValid}`);
    return isValid;
};

// Helper to determine if an API key is valid and not a placeholder (simple length heuristic)
export const isValidSupabaseKey = (value: string | null | undefined): boolean => {
    const isValid = !!(value && value !== 'YOUR_SUPABASE_ANON_KEY' && value.length >= 64); // Anon Key should be a long JWT
    console.log(`isValidSupabaseKey(${value ? value.substring(0, 10) + '...' : 'null'}): ${isValid}`);
    return isValid;
};

// Get active credentials from various sources with clear priority
const getActiveCredentials = () => {
    let activeUrl: string | undefined | null = null;
    let activeKey: string | undefined | null = null;

    // Priority 1: localStorage (user-saved via settings)
    const localUrl = localStorage.getItem('supabaseUrl');
    const localKey = localStorage.getItem('supabaseAnonKey');
    if (isValidSupabaseUrl(localUrl) && isValidSupabaseKey(localKey)) {
        activeUrl = localUrl;
        activeKey = localKey;
        console.log('getActiveCredentials - Using LocalStorage credentials.');
    } else {
        console.log('getActiveCredentials - LocalStorage credentials not found or invalid.');
    }

    // Priority 2: Environment variables (Vite/Next or plain)
    if (!isValidSupabaseUrl(activeUrl) || !isValidSupabaseKey(activeKey)) {
        const envUrl = getEnvValue('SUPABASE_URL'); // utils.ts handles VITE_/NEXT_PUBLIC_ prefixes
        const envKey = getEnvValue('SUPABASE_ANON_KEY'); // utils.ts handles VITE_/NEXT_PUBLIC_ prefixes
        if (isValidSupabaseUrl(envUrl) && isValidSupabaseKey(envKey)) {
            activeUrl = envUrl;
            activeKey = envKey;
            console.log('getActiveCredentials - Using Environment Variable credentials.');
        } else {
            console.log('getActiveCredentials - Environment Variable credentials not found or invalid.');
        }
    }

    // Priority 3: Hardcoded fallback from supabaseCredentials.ts
    if (!isValidSupabaseUrl(activeUrl) || !isValidSupabaseKey(activeKey)) {
        if (isValidSupabaseUrl(HARDCODED_SUPABASE_URL) && isValidSupabaseKey(HARDCODED_SUPABASE_KEY)) {
            activeUrl = HARDCODED_SUPABASE_URL;
            activeKey = HARDCODED_SUPABASE_KEY;
            console.log('getActiveCredentials - Using Hardcoded credentials.');
        } else {
            console.log('getActiveCredentials - Hardcoded credentials not found or invalid.');
        }
    }

    console.log('getActiveCredentials - Final Active URL (valid?):', isValidSupabaseUrl(activeUrl));
    console.log('getActiveCredentials - Final Active Key (valid?):', isValidSupabaseKey(activeKey));

    return { url: activeUrl, key: activeKey };
};

// Check if *any* valid credentials are found from any source (env, local, hardcoded)
export const hasSupabaseCredentials = (): boolean => {
    const { url, key } = getActiveCredentials();
    const result = isValidSupabaseUrl(url) && isValidSupabaseKey(key);
    console.log('hasSupabaseCredentials returns:', result);
    return result;
};

// Initialize Supabase Client
const initializeSupabaseClient = (): SupabaseClient => {
    const { url: finalClientUrl, key: finalClientKey } = getActiveCredentials();

    // If no valid credentials are found, use dummy values to prevent app crash,
    // but the app should display the setup modal.
    const clientUrl = finalClientUrl || 'https://dummy.supabase.co';
    const clientKey = finalClientKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdW1teSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4MDY0NDAwLCJleHAiOjE5OTM2MDA4MDB9.dummy_anon_key'; // A dummy valid key format

    const supabaseClientOptions: SupabaseClientOptions<any> = {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
            // providers property is not valid here; providers are specified during signInWithOAuth calls
        },
    };
    return createClient(clientUrl, clientKey, supabaseClientOptions);
};

export const supabase: SupabaseClient = initializeSupabaseClient();

// Existing code for getSupabase, ensures compatibility if other files call it directly,
// though they mostly use `supabase` directly. This will return the same instance.
export const getSupabase = (): SupabaseClient => {
    // For simplicity, we return the singleton. A more complex app might re-create the client
    // if settings are dynamically updated without a full page reload.
    return supabase;
};