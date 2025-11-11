/**
 * Central utility for fetching dropdown options and analytics data
 * 
 * @deprecated DO NOT import from @/config/options.json or @/config/live-dropdowns.json
 * Use this utility instead - it reads from /api/options (Google Sheets single source of truth)
 */

export type OptionName = string;

export interface Rich {
  name: string;
  monthly: number[];
  yearTotal: number;
}

export interface OptionsData {
  // Plain string arrays for dropdowns (backward compatibility)
  properties: OptionName[];
  typeOfOperation: OptionName[];
  typeOfPayment: OptionName[];
  revenueCategories: OptionName[];

  // Rich arrays for P&L/Balance pages with financial data
  propertiesRich: Rich[];
  typeOfOperations: Rich[];
  typeOfPayments: Rich[];
  revenues: Rich[];
}

export interface OptionsResponse {
  ok: boolean;
  data: OptionsData;
  updatedAt: string;
  cached: boolean;
  source: string;
  metadata: {
    totalProperties: number;
    totalOperations: number;
    totalPayments: number;
    totalRevenues: number;
  };
}

/**
 * Fetch all dropdown options and analytics data from /api/options
 * 
 * @param base - Base URL (empty string for same-origin requests, or full URL for cross-origin)
 * @returns OptionsData with both plain string arrays and rich objects
 * @throws Error if API call fails
 * 
 * @example
 * // Server Component
 * const data = await getOptions();
 * const paymentNames = data.typeOfPayment; // string[] for dropdowns
 * const paymentsRich = data.typeOfPayments; // Rich[] for analytics
 * 
 * @example
 * // Client Component
 * const [options, setOptions] = useState<OptionsData | null>(null);
 * useEffect(() => {
 *   getOptions().then(setOptions);
 * }, []);
 */
export async function getOptions(base = ''): Promise<OptionsData> {
  const url = `${base}/api/options?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Options fetch failed: ${res.status} - ${text}`);
  }
  
  const json = (await res.json()) as OptionsResponse;
  
  if (!json.ok || !json.data) {
    throw new Error('Invalid options response format');
  }
  
  return json.data;
}

/**
 * Get options synchronously from a static fallback (DEPRECATED - emergency use only)
 * 
 * @deprecated This should ONLY be used if /api/options is down and FALLBACK_CONFIG_ALLOWED=true
 * Prefer using getOptions() which fetches from Google Sheets
 */
export function getOptionsFromStaticConfig(): OptionsData {
  console.warn('⚠️ [DEPRECATED] Using static config fallback - this should not happen in production!');
  
  // This will be replaced with a minimal emergency fallback if needed
  throw new Error('Static config fallback is deprecated. Use /api/options instead.');
}
