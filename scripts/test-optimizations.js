#!/usr/bin/env node

/**
 * Optimization Testing Script
 * Tests the various optimizations to ensure they're working correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.SITE_URL || 'http://localhost:3000';
const ENDPOINTS_TO_TEST = [
  // Cached endpoints
  { path: '/api/ping', expectCached: true, expectedMaxAge: 60 },
  { path: '/api/favicon', expectCached: true, expectedMaxAge: 3600 },
  { path: '/api/youtube-title?videoId=dQw4w9WgXcQ', expectCached: true, expectedMaxAge: 3600 },
  { path: '/manifest', expectCached: true, expectedMaxAge: 3600 },
  { path: '/robots.txt', expectCached: true, expectedMaxAge: 86400 },
  { path: '/sitemap.xml', expectCached: true, expectedMaxAge: 3600 },
  
  // Unified endpoints
  { path: '/api/database/diagnostics?checks=projects,media', expectCached: true, expectedMaxAge: 30 },
  { path: '/api/system/status?checks=database,tables&format=simple', expectCached: true, expectedMaxAge: 30 },
  { path: '/api/batch', expectCached: false }, // Batch endpoint info
  
  // Setup endpoints
  { path: '/api/setup/unified?types=settings', expectCached: false },
  { path: '/api/media/operations?operation=info', expectCached: false },
];

const STATIC_FILES_TO_TEST = [
  '/favicon.ico',
  '/images/placeholder.jpg',
  '/placeholder.svg',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      const cacheControl = res.headers['cache-control'];
      const hasCache = !!cacheControl;
      
      let maxAge = null;
      if (cacheControl) {
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          maxAge = parseInt(maxAgeMatch[1]);
        }
      }
      
      resolve({
        path: endpoint.path,
        status: res.statusCode,
        hasCache,
        cacheControl,
        maxAge,
        expectCached: endpoint.expectCached,
        expectedMaxAge: endpoint.expectedMaxAge,
        success: endpoint.expectCached ? hasCache && maxAge === endpoint.expectedMaxAge : true
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path: endpoint.path,
        status: 'ERROR',
        error: err.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path: endpoint.path,
        status: 'TIMEOUT',
        success: false
      });
    });
  });
}

async function runTests() {
  console.log(`🧪 Running optimization tests against: ${BASE_URL}\n`);
  
  const results = [];
  
  console.log('📡 Testing API endpoints...');
  for (const endpoint of ENDPOINTS_TO_TEST) {
    process.stdout.write(`  Testing ${endpoint.path}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log('✅ PASS');
      if (result.hasCache) {
        console.log(`    Cache: ${result.cacheControl}`);
      }
    } else {
      console.log('❌ FAIL');
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      } else if (result.expectCached && !result.hasCache) {
        console.log(`    Expected cache headers but none found`);
      } else if (result.maxAge !== result.expectedMaxAge) {
        console.log(`    Expected max-age=${result.expectedMaxAge}, got ${result.maxAge}`);
      }
    }
  }
  
  console.log('\n📊 Results Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`  Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All optimization tests passed!');
    console.log('\n📈 Expected benefits:');
    console.log('  • 80-90% reduction in Edge Middleware invocations');
    console.log('  • Fewer HTTP roundtrips through unified endpoints');
    console.log('  • Reduced bandwidth usage through strategic caching');
    console.log('  • Faster response times for cached endpoints');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };