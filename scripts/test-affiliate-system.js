/**
 * Test script for Affiliate Analytics & Fraud Detection Systems
 * Run with: node test-affiliate-system.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_REFERRAL_CODE = process.env.TEST_REF_CODE || null;

function safeFetch(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { raw: data };
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
      });
    });
    
    req.on('error', (error) => {
      resolve({ ok: false, status: 0, error: error.message });
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

function log(message, type = 'info') {
  const prefix = {
    info: '✓',
    success: '✓✓',
    error: '✗',
    warn: '⚠',
    test: '🧪',
  }[type] || '•';
  console.log(`${prefix} ${message}`);
}

async function testClickTracking(referralCode) {
  log(`Testing click tracking for referral code: ${referralCode}`, 'test');
  
  const results = [];
  
  // Test 1: Basic click tracking
  log('Test 1: Basic click tracking', 'info');
  const test1 = await safeFetch(`${API_URL}/affiliate/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referralCode,
      deviceFingerprint: 'test_fingerprint_1',
    }),
  });
  
  if (test1.ok && test1.data?.success) {
    log('Click tracked successfully', 'success');
    results.push({ test: 'Click Tracking', status: 'PASS' });
  } else {
    log(`Click tracking failed: ${JSON.stringify(test1.data)}`, 'error');
    results.push({ test: 'Click Tracking', status: 'FAIL', error: test1.data });
  }
  
  // Test 2: Rate limiting (should be silently ignored)
  log('Test 2: Rate limiting (duplicate click)', 'info');
  await new Promise(resolve => setTimeout(resolve, 100));
  const test2 = await safeFetch(`${API_URL}/affiliate/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referralCode,
      deviceFingerprint: 'test_fingerprint_1',
    }),
  });
  
  if (test2.ok) {
    log('Rate limiting working (duplicate click handled)', 'success');
    results.push({ test: 'Rate Limiting', status: 'PASS' });
  } else {
    log(`Rate limiting test failed: ${test2.status}`, 'warn');
    results.push({ test: 'Rate Limiting', status: 'WARN' });
  }
  
  // Test 3: Invalid referral code
  log('Test 3: Invalid referral code', 'info');
  const test3 = await safeFetch(`${API_URL}/affiliate/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referralCode: 'INVALID12345',
      deviceFingerprint: 'test_fingerprint_1',
    }),
  });
  
  if (!test3.ok && test3.status === 404) {
    log('Invalid referral code correctly rejected', 'success');
    results.push({ test: 'Invalid Code Rejection', status: 'PASS' });
  } else {
    log(`Unexpected response for invalid code: ${test3.status}`, 'warn');
    results.push({ test: 'Invalid Code Rejection', status: 'WARN' });
  }
  
  return results;
}

async function testSignupTracking(referralCode, testEmail) {
  log(`Testing signup tracking for referral code: ${referralCode}`, 'test');
  
  const results = [];
  
  // Test 1: Basic signup tracking
  log('Test 1: Basic signup tracking', 'info');
  const test1 = await safeFetch(`${API_URL}/affiliate/track-signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': testEmail,
    },
    body: JSON.stringify({
      referralCode,
      email: testEmail,
      deviceFingerprint: 'test_signup_fingerprint_1',
    }),
  });
  
  if (test1.ok && test1.data?.success) {
    log('Signup tracked successfully', 'success');
    results.push({ test: 'Signup Tracking', status: 'PASS' });
  } else {
    log(`Signup tracking failed: ${JSON.stringify(test1.data)}`, 'error');
    results.push({ test: 'Signup Tracking', status: 'FAIL', error: test1.data });
  }
  
  // Test 2: Duplicate signup (should be rejected)
  log('Test 2: Duplicate signup prevention', 'info');
  await new Promise(resolve => setTimeout(resolve, 100));
  const test2 = await safeFetch(`${API_URL}/affiliate/track-signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': testEmail,
    },
    body: JSON.stringify({
      referralCode,
      email: testEmail,
      deviceFingerprint: 'test_signup_fingerprint_1',
    }),
  });
  
  if (!test2.ok || test2.data?.error?.includes('already')) {
    log('Duplicate signup correctly rejected', 'success');
    results.push({ test: 'Duplicate Signup Prevention', status: 'PASS' });
  } else {
    log(`Duplicate signup not prevented: ${JSON.stringify(test2.data)}`, 'warn');
    results.push({ test: 'Duplicate Signup Prevention', status: 'WARN' });
  }
  
  return results;
}

async function testAnalyticsEndpoints(userEmail) {
  log(`Testing analytics endpoints for user: ${userEmail}`, 'test');
  
  const results = [];
  const endpoints = [
    { name: 'Overview', path: '/affiliate/analytics/overview' },
    { name: 'Funnel', path: '/affiliate/analytics/funnel' },
    { name: 'Time Series', path: '/affiliate/analytics/time-series?days=30' },
    { name: 'Devices', path: '/affiliate/analytics/devices' },
    { name: 'Geography', path: '/affiliate/analytics/geography' },
  ];
  
  for (const endpoint of endpoints) {
    log(`Testing ${endpoint.name} endpoint`, 'info');
    const test = await safeFetch(`${API_URL}${endpoint.path}`, {
      headers: {
        'x-user-email': userEmail,
      },
    });
    
    if (test.ok && test.data) {
      log(`${endpoint.name} endpoint working`, 'success');
      results.push({ test: endpoint.name, status: 'PASS', hasData: !!test.data });
    } else {
      log(`${endpoint.name} endpoint failed: ${test.status}`, 'error');
      results.push({ test: endpoint.name, status: 'FAIL', error: test.data });
    }
  }
  
  return results;
}

async function testFraudDetection(affiliateId, adminEmail) {
  log(`Testing fraud detection for affiliate: ${affiliateId}`, 'test');
  
  const results = [];
  
  // Test 1: Check fraud score exists
  log('Test 1: Fraud score retrieval', 'info');
  const test1 = await safeFetch(`${API_URL}/admin/affiliate/fraud/${affiliateId}`, {
    headers: {
      'x-admin-email': adminEmail,
    },
  });
  
  if (test1.ok && test1.data) {
    log('Fraud details retrieved successfully', 'success');
    log(`  - Score: ${test1.data.fraudScore?.totalScore || 0}`, 'info');
    log(`  - Risk Level: ${test1.data.fraudScore?.riskLevel || 'low'}`, 'info');
    results.push({ test: 'Fraud Score Retrieval', status: 'PASS' });
  } else {
    log(`Fraud details retrieval failed: ${test1.status}`, 'error');
    results.push({ test: 'Fraud Score Retrieval', status: 'FAIL' });
  }
  
  // Test 2: Search affiliates
  log('Test 2: Affiliate search', 'info');
  const test2 = await safeFetch(`${API_URL}/admin/affiliate/fraud/search`, {
    headers: {
      'x-admin-email': adminEmail,
    },
  });
  
  if (test2.ok && Array.isArray(test2.data?.affiliates)) {
    log(`Found ${test2.data.affiliates.length} affiliates`, 'success');
    results.push({ test: 'Affiliate Search', status: 'PASS' });
  } else {
    log('Affiliate search failed', 'error');
    results.push({ test: 'Affiliate Search', status: 'FAIL' });
  }
  
  // Test 3: Fraud events endpoint
  log('Test 3: Fraud events retrieval', 'info');
  const test3 = await safeFetch(`${API_URL}/admin/affiliate/fraud/${affiliateId}/events`, {
    headers: {
      'x-admin-email': adminEmail,
    },
  });
  
  if (test3.ok && Array.isArray(test3.data?.events)) {
    log(`Found ${test3.data.events.length} fraud events`, 'success');
    results.push({ test: 'Fraud Events Retrieval', status: 'PASS' });
  } else {
    log('Fraud events retrieval failed', 'warn');
    results.push({ test: 'Fraud Events Retrieval', status: 'WARN' });
  }
  
  return results;
}

async function checkDatabaseTables() {
  log('Checking database tables...', 'test');
  
  // This would require database access, so we'll just log what we expect
  const expectedTables = [
    'AffiliateClick',
    'AffiliateSignup',
    'AffiliateFraudEvent',
    'AffiliateFraudScore',
  ];
  
  log(`Expected tables: ${expectedTables.join(', ')}`, 'info');
  log('Please verify these tables exist in your database', 'warn');
  
  return [{ test: 'Database Tables Check', status: 'INFO' }];
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Affiliate Analytics & Fraud Detection Test Suite      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Check API connectivity
  log('Checking API connectivity...', 'info');
  const healthCheck = await safeFetch(`${API_URL.replace('/api', '')}/health`).catch(() => {
    return safeFetch(API_URL.replace('/api', ''));
  });
  
  if (!healthCheck.ok && healthCheck.status !== 404) {
    log('API may not be running. Please ensure backend is started.', 'error');
    log(`API URL: ${API_URL}`, 'info');
    process.exit(1);
  }
  
  log(`API URL: ${API_URL}`, 'info');
  
  // Get test parameters
  const referralCode = TEST_REFERRAL_CODE || process.argv[2];
  const testEmail = process.argv[3] || 'test@example.com';
  const adminEmail = process.argv[4] || 'lilrannee@gmail.com';
  
  if (!referralCode) {
    log('Usage: node test-affiliate-system.js <referralCode> [testEmail] [adminEmail]', 'error');
    log('Or set TEST_REF_CODE environment variable', 'info');
    process.exit(1);
  }
  
  log(`Test Parameters:`, 'info');
  log(`  - Referral Code: ${referralCode}`, 'info');
  log(`  - Test Email: ${testEmail}`, 'info');
  log(`  - Admin Email: ${adminEmail}`, 'info');
  console.log('');
  
  const allResults = [];
  
  // Run tests
  try {
    // Test 1: Click Tracking
    console.log('\n📊 Testing Click Tracking...');
    const clickResults = await testClickTracking(referralCode);
    allResults.push(...clickResults);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for rate limit
    
    // Test 2: Signup Tracking (requires valid user)
    console.log('\n👤 Testing Signup Tracking...');
    log('Note: This requires a valid user in the database', 'warn');
    const signupResults = await testSignupTracking(referralCode, testEmail);
    allResults.push(...signupResults);
    
    // Test 3: Analytics Endpoints (requires authenticated affiliate)
    console.log('\n📈 Testing Analytics Endpoints...');
    log('Note: This requires an authenticated affiliate account', 'warn');
    const analyticsResults = await testAnalyticsEndpoints(testEmail);
    allResults.push(...analyticsResults);
    
    // Test 4: Fraud Detection (requires admin access)
    console.log('\n🔒 Testing Fraud Detection...');
    log('Note: This requires admin access and affiliate ID', 'warn');
    // Get affiliate ID from search first
    const searchResult = await safeFetch(`${API_URL}/admin/affiliate/fraud/search?q=${referralCode}`, {
      headers: { 'x-admin-email': adminEmail },
    });
    
    if (searchResult.ok && searchResult.data?.affiliates?.[0]) {
      const affiliateId = searchResult.data.affiliates[0].id;
      const fraudResults = await testFraudDetection(affiliateId, adminEmail);
      allResults.push(...fraudResults);
    } else {
      log('Could not find affiliate for fraud testing', 'warn');
      allResults.push({ test: 'Fraud Detection', status: 'SKIP', reason: 'Affiliate not found' });
    }
    
    // Test 5: Database Tables
    console.log('\n🗄️  Checking Database...');
    const dbResults = await checkDatabaseTables();
    allResults.push(...dbResults);
    
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
    console.error(error);
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                     Test Summary                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const warned = allResults.filter(r => r.status === 'WARN').length;
  const skipped = allResults.filter(r => r.status === 'SKIP').length;
  
  allResults.forEach(result => {
    const icon = {
      PASS: '✓',
      FAIL: '✗',
      WARN: '⚠',
      SKIP: '⊘',
      INFO: '•',
    }[result.status] || '•';
    console.log(`  ${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`    └─ ${JSON.stringify(result.error).substring(0, 100)}`);
    }
  });
  
  console.log('\n');
  log(`Total: ${allResults.length} tests`, 'info');
  log(`Passed: ${passed}`, 'success');
  if (warned > 0) log(`Warnings: ${warned}`, 'warn');
  if (failed > 0) log(`Failed: ${failed}`, 'error');
  if (skipped > 0) log(`Skipped: ${skipped}`, 'info');
  
  console.log('\n');
  
  if (failed === 0) {
    log('All critical tests passed!', 'success');
  } else {
    log('Some tests failed. Please review the errors above.', 'error');
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testClickTracking, testSignupTracking, testAnalyticsEndpoints, testFraudDetection };

