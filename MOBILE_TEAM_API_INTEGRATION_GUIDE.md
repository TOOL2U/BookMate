# 📱 Mobile App Team - API Integration Guide

**Date**: November 4, 2025  
**Status**: ✅ READY FOR INTEGRATION  
**Production URL**: `https://accounting.siamoon.com`

---

## 🎯 TL;DR - What You Need to Know

**Use ONE endpoint for ALL dropdown data**: `/api/options`

- ✅ Single source of truth
- ✅ Always up-to-date from Google Sheets
- ✅ Includes test data ("1", "2", "3", "4") for development
- ✅ Returns both simple strings AND rich analytics data
- ✅ No caching issues (always fresh)

---

## 📡 API Endpoint

### **GET /api/options**

**Full URL**: `https://accounting.siamoon.com/api/options`

**Response Format**:
```json
{
  "ok": true,
  "data": {
    // ========== Simple String Arrays (USE THESE FOR DROPDOWNS) ==========
    "properties": [
      "Sia Moon - Land - General",
      "Alesia House",
      "Lanna House",
      "Parents House",
      "Shaun Ducker - Personal",
      "Maria Ren - Personal",
      "Family",
      "3"  // Test data - will appear in dev/staging
    ],
    
    "typeOfOperation": [
      "Revenue - Commision ",
      "Revenue - Sales ",
      "Revenue - Services",
      "Revenue - Rental Income",
      "1",  // Test revenue
      "EXP - Utilities - Gas",
      "EXP - Utilities - Water",
      // ... 34 total including "2" for test expense
    ],
    
    "typeOfPayment": [
      "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "Bank Transfer - Bangkok Bank - Maria Ren",
      "Bank transfer - Krung Thai Bank - Family Account",
      "Cash - Family",
      "Cash - Alesia",
      "4"  // Test payment
    ],
    
    "revenueCategories": [
      "Revenue - Commision ",
      "Revenue - Sales ",
      "Revenue - Services",
      "Revenue - Rental Income",
      "1"  // Test revenue
    ],
    
    // ========== Rich Objects (FOR FUTURE ANALYTICS) ==========
    "propertiesRich": [
      {
        "name": "Sia Moon - Land - General",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
      // ... one entry per property
    ],
    
    "typeOfOperations": [
      {
        "name": "Revenue - Commision ",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
      // ... one entry per operation
    ],
    
    "typeOfPayments": [
      {
        "name": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
      // ... one entry per payment type
    ],
    
    "revenues": [
      {
        "name": "Revenue - Commision ",
        "monthly": [50000, 60000, 45000, ...],
        "yearTotal": 650000
      }
      // ... one entry per revenue category
    ]
  },
  
  "updatedAt": "2025-11-04T12:34:56.789Z",
  "cached": false,
  "source": "google_sheets_lists+data",
  
  "metadata": {
    "totalProperties": 8,
    "totalOperations": 34,
    "totalPayments": 6,
    "totalRevenues": 5
  }
}
```

---

## 🔧 Implementation Guide

### **Step 1: Fetch Options on App Startup**

```typescript
// TypeScript/React Native Example
interface OptionsData {
  properties: string[];
  typeOfOperation: string[];
  typeOfPayment: string[];
  revenueCategories: string[];
  
  // Optional: For future analytics features
  propertiesRich?: Array<{ name: string; monthly: number[]; yearTotal: number }>;
  typeOfOperations?: Array<{ name: string; monthly: number[]; yearTotal: number }>;
  typeOfPayments?: Array<{ name: string; monthly: number[]; yearTotal: number }>;
  revenues?: Array<{ name: string; monthly: number[]; yearTotal: number }>;
}

interface OptionsResponse {
  ok: boolean;
  data: OptionsData;
  updatedAt: string;
  source: string;
  metadata: {
    totalProperties: number;
    totalOperations: number;
    totalPayments: number;
    totalRevenues: number;
  };
}

async function fetchOptions(): Promise<OptionsData> {
  const response = await fetch('https://accounting.siamoon.com/api/options', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store', // Important: Always get fresh data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch options: ${response.status}`);
  }
  
  const json: OptionsResponse = await response.json();
  
  if (!json.ok) {
    throw new Error('Invalid response from options API');
  }
  
  return json.data;
}
```

### **Step 2: Store in App State**

```typescript
// Redux example
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchOptionsThunk = createAsyncThunk(
  'options/fetch',
  async () => {
    const data = await fetchOptions();
    return data;
  }
);

const optionsSlice = createSlice({
  name: 'options',
  initialState: {
    data: null as OptionsData | null,
    loading: false,
    error: null as string | null,
    lastFetched: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOptionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOptionsThunk.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchOptionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch options';
      });
  },
});

export default optionsSlice.reducer;
```

### **Step 3: Use in Dropdowns**

```typescript
// React Native Picker example
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';

function TransactionForm() {
  const options = useSelector((state) => state.options.data);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  
  if (!options) {
    return <Text>Loading options...</Text>;
  }
  
  return (
    <View>
      {/* Property Picker */}
      <Picker
        selectedValue={selectedProperty}
        onValueChange={(value) => setSelectedProperty(value)}
      >
        <Picker.Item label="Select property..." value="" />
        {options.properties.map((property) => (
          <Picker.Item 
            key={property} 
            label={property} 
            value={property} 
          />
        ))}
      </Picker>
      
      {/* Operation Type Picker */}
      <Picker
        selectedValue={selectedOperation}
        onValueChange={(value) => setSelectedOperation(value)}
      >
        <Picker.Item label="Select category..." value="" />
        {options.typeOfOperation.map((operation) => (
          <Picker.Item 
            key={operation} 
            label={operation} 
            value={operation} 
          />
        ))}
      </Picker>
      
      {/* Payment Type Picker */}
      <Picker
        selectedValue={selectedPayment}
        onValueChange={(value) => setSelectedPayment(value)}
      >
        <Picker.Item label="Select payment type..." value="" />
        {options.typeOfPayment.map((payment) => (
          <Picker.Item 
            key={payment} 
            label={payment} 
            value={payment} 
          />
        ))}
      </Picker>
    </View>
  );
}
```

---

## 🔄 Refresh Strategy

### **Option 1: Cache with TTL (Recommended)**

```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getOptionsWithCache(): Promise<OptionsData> {
  const cached = await AsyncStorage.getItem('options_cache');
  const cacheTime = await AsyncStorage.getItem('options_cache_time');
  
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < CACHE_TTL) {
      return JSON.parse(cached);
    }
  }
  
  // Fetch fresh data
  const data = await fetchOptions();
  
  // Update cache
  await AsyncStorage.setItem('options_cache', JSON.stringify(data));
  await AsyncStorage.setItem('options_cache_time', Date.now().toString());
  
  return data;
}
```

### **Option 2: Pull-to-Refresh**

```typescript
function TransactionScreen() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchOptionsThunk());
    setRefreshing(false);
  };
  
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Your form */}
    </ScrollView>
  );
}
```

### **Option 3: Background Sync**

```typescript
// Fetch on app foreground
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground
      dispatch(fetchOptionsThunk());
    }
  });
  
  return () => subscription.remove();
}, [dispatch]);
```

---

## ⚠️ Important Notes

### **1. DO NOT Hardcode Dropdown Values**

❌ **Wrong**:
```typescript
const paymentTypes = [
  'Cash',
  'Bank Transfer - Bangkok Bank',
  // etc.
];
```

✅ **Correct**:
```typescript
const paymentTypes = options.typeOfPayment; // From API
```

### **2. Filter Out Test Data in Production**

```typescript
// Remove numeric test entries in production builds
function filterTestData(items: string[]): string[] {
  if (__DEV__) {
    return items; // Keep test data in development
  }
  
  // In production, filter out numeric-only entries
  return items.filter(item => !/^\d+$/.test(item));
}

// Usage:
const productionPayments = filterTestData(options.typeOfPayment);
```

### **3. Handle API Errors Gracefully**

```typescript
try {
  const data = await fetchOptions();
  // Success
} catch (error) {
  // Show user-friendly error
  Alert.alert(
    'Connection Error',
    'Unable to load categories. Please check your internet connection.',
    [
      { text: 'Retry', onPress: () => fetchOptions() },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
  
  // Optional: Use cached data as fallback
  const cached = await AsyncStorage.getItem('options_cache');
  if (cached) {
    return JSON.parse(cached);
  }
}
```

### **4. Validate User Input**

```typescript
function validateTransaction(transaction: Transaction, options: OptionsData): boolean {
  // Ensure selected values exist in options
  const validProperty = options.properties.includes(transaction.property);
  const validOperation = options.typeOfOperation.includes(transaction.typeOfOperation);
  const validPayment = options.typeOfPayment.includes(transaction.typeOfPayment);
  
  if (!validProperty || !validOperation || !validPayment) {
    console.error('Invalid dropdown selection detected');
    return false;
  }
  
  return true;
}
```

---

## 🧪 Testing Checklist

- [ ] Fetch options on app startup
- [ ] Display all categories in dropdowns
- [ ] Verify test data appears in development ("1", "2", "3", "4")
- [ ] Filter test data in production builds
- [ ] Handle network errors gracefully
- [ ] Implement cache/refresh strategy
- [ ] Validate user selections before submission
- [ ] Test with airplane mode (use cached data)
- [ ] Test pull-to-refresh functionality
- [ ] Verify dropdown values match webapp dropdowns

---

## 📊 Expected Counts (as of Nov 4, 2025)

```
Properties:       8 (including "3" test)
Operations:      34 (including "1" and "2" test)
Payment Types:    6 (including "4" test)
Revenue Categories: 5 (including "1" test)
```

---

## 🐛 Troubleshooting

### **Issue: Getting 0 items in arrays**

**Cause**: API not deployed yet or wrong endpoint  
**Solution**: Verify URL is `https://accounting.siamoon.com/api/options`

### **Issue: Cached old data**

**Cause**: Using browser/app cache  
**Solution**: Add `cache: 'no-store'` header or `?t=${Date.now()}` query param

### **Issue: Test data in production**

**Cause**: Not filtering numeric entries  
**Solution**: Use `filterTestData()` function for production builds

### **Issue: Dropdown doesn't update**

**Cause**: Not refetching after changes in Google Sheets  
**Solution**: Implement pull-to-refresh or periodic background sync

---

## 🔗 Related Documentation

- Web App Implementation: `/app/balance/page.tsx`, `/app/settings/page.tsx`
- API Route: `/app/api/options/route.ts`
- Utility: `/utils/getOptions.ts`
- Deprecation Guide: `/config/README_DEPRECATION.md`

---

## 💬 Questions?

Contact the PM or check the webapp source code for reference implementations.

**Last Updated**: November 4, 2025  
**API Version**: v2 (dual format)  
**Status**: ✅ Production Ready
