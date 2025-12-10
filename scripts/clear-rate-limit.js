/**
 * Script to clear rate limit for support contact endpoint
 * Usage: node scripts/clear-rate-limit.js [IP_ADDRESS]
 * 
 * Note: This script requires @upstash/redis package
 * Install: npm install @upstash/redis
 */

require('dotenv').config();

async function clearRateLimit(ipAddress) {
  const { Redis } = require('@upstash/redis');
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.error('❌ Redis credentials not found in environment variables');
    console.log('Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file');
    process.exit(1);
  }

  try {
    const redis = new Redis({
      url: url,
      token: token,
    });

    console.log('✅ Connected to Redis');

    // Upstash Redis doesn't support KEYS command, so we'll delete by exact key
    // Key format: ratelimit:api:POST:/support/contact:IP
    if (ipAddress) {
      const exactKey = `ratelimit:api:POST:/support/contact:${ipAddress}`;
      console.log(`🔍 Checking key: ${exactKey}`);
      
      const exists = await redis.exists(exactKey);
      if (exists) {
        await redis.del(exactKey);
        console.log(`✅ Deleted rate limit key: ${exactKey}`);
      } else {
        console.log(`ℹ️  No rate limit key found for IP: ${ipAddress}`);
      }
    } else {
      console.log('⚠️  Without an IP address, we cannot search for keys (Upstash Redis limitation)');
      console.log('💡 Please provide an IP address: node scripts/clear-rate-limit.js 127.0.0.1');
      console.log('\nAlternatively, wait 1 hour for the rate limit to expire automatically.');
    }

    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.log('\n💡 Install required package: npm install @upstash/redis');
    }
    process.exit(1);
  }
}

// Get IP address from command line arguments
const ipAddress = process.argv[2];

if (ipAddress) {
  console.log(`🎯 Clearing rate limit for IP: ${ipAddress}\n`);
} else {
  console.log('⚠️  No IP address provided\n');
}

clearRateLimit(ipAddress);

