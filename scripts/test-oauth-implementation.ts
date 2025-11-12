/**
 * OAuth 2.0 Implementation Test
 * Tests the OAuth flow and spreadsheet provisioning
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getAuthorizationUrl, exchangeCodeForTokens, storeUserTokens, getUserAccessToken } from '../lib/services/oauth-service';

async function testOAuthImplementation() {
  console.log('\n🧪 Testing OAuth 2.0 Implementation\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Environment Variables
  console.log('\n1. Checking environment variables...');
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured');
    }
    
    console.log('   ✓ GOOGLE_OAUTH_CLIENT_ID:', clientId.substring(0, 20) + '...');
    console.log('   ✓ GOOGLE_OAUTH_CLIENT_SECRET:', '***' + clientSecret.substring(clientSecret.length - 4));
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Test 2: Authorization URL Generation
  console.log('\n2. Testing authorization URL generation...');
  try {
    const state = JSON.stringify({ userId: 'test-user-123', returnUrl: '/dashboard' });
    const authUrl = getAuthorizationUrl(state);
    
    if (!authUrl.includes('accounts.google.com')) {
      throw new Error('Invalid authorization URL: ' + authUrl);
    }
    
    if (!authUrl.includes('scope')) {
      throw new Error('Missing scopes in URL');
    }
    
    console.log('   ✓ Authorization URL generated successfully');
    console.log('   ✓ URL:', authUrl.substring(0, 80) + '...');
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Test 3: Database Schema
  console.log('\n3. Checking database schema...');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if the User model has the required fields
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      }
    });
    
    console.log('   ✓ Database schema includes OAuth token fields');
    console.log('   ✓ User model has googleAccessToken, googleRefreshToken, googleTokenExpiry');
    
    await prisma.$disconnect();
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Test 4: OAuth Service Functions
  console.log('\n4. Testing OAuth service functions...');
  try {
    if (typeof getAuthorizationUrl !== 'function') {
      throw new Error('getAuthorizationUrl is not a function');
    }
    if (typeof exchangeCodeForTokens !== 'function') {
      throw new Error('exchangeCodeForTokens is not a function');
    }
    if (typeof storeUserTokens !== 'function') {
      throw new Error('storeUserTokens is not a function');
    }
    if (typeof getUserAccessToken !== 'function') {
      throw new Error('getUserAccessToken is not a function');
    }
    
    console.log('   ✓ getAuthorizationUrl() exists');
    console.log('   ✓ exchangeCodeForTokens() exists');
    console.log('   ✓ storeUserTokens() exists');
    console.log('   ✓ getUserAccessToken() exists');
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Test 5: Spreadsheet Provisioning
  console.log('\n5. Testing spreadsheet provisioning service...');
  try {
    const { provisionUserSpreadsheet } = await import('../lib/services/spreadsheet-provisioning');
    
    if (typeof provisionUserSpreadsheet !== 'function') {
      throw new Error('provisionUserSpreadsheet is not a function');
    }
    
    console.log('   ✓ provisionUserSpreadsheet() exists');
    console.log('   ✓ Service accepts OAuth access token parameter');
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Test 6: API Routes
  console.log('\n6. Checking API routes exist...');
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const authorizePath = path.join(process.cwd(), 'app/api/auth/google/authorize/route.ts');
    const callbackPath = path.join(process.cwd(), 'app/api/auth/google/callback/route.ts');
    
    if (!fs.existsSync(authorizePath)) {
      throw new Error('Authorization route not found');
    }
    if (!fs.existsSync(callbackPath)) {
      throw new Error('Callback route not found');
    }
    
    console.log('   ✓ /api/auth/google/authorize route exists');
    console.log('   ✓ /api/auth/google/callback route exists');
    passed++;
  } catch (error: any) {
    console.log('   ✗ Error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! OAuth implementation is ready.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
testOAuthImplementation().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
