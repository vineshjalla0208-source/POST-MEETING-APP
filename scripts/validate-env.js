#!/usr/bin/env node

/**
 * Environment variable validation script
 * Checks that all required environment variables are set and properly formatted
 */

const requiredVars = {
  // Next.js
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'string',
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'string',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'string',
  SUPABASE_SERVICE_ROLE_KEY: 'string',
  
  // OAuth
  GOOGLE_CLIENT_ID: 'string',
  GOOGLE_CLIENT_SECRET: 'string',
  LINKEDIN_CLIENT_ID: 'string',
  LINKEDIN_CLIENT_SECRET: 'string',
  FACEBOOK_CLIENT_ID: 'string',
  FACEBOOK_CLIENT_SECRET: 'string',
  
  // APIs
  OPENAI_API_KEY: 'string',
  RECALL_API_KEY: 'string',
  
  // Cron
  CRON_SECRET: 'string',
}

function validateEnv() {
  const missing = []
  const invalid = []
  
  console.log('🔍 Validating environment variables...\n')
  
  for (const [key, expected] of Object.entries(requiredVars)) {
    const value = process.env[key]
    
    if (!value) {
      missing.push(key)
      continue
    }
    
    // Check for spaces around = sign (common mistake)
    if (value.includes(' = ') || value.startsWith(' ') || value.endsWith(' ')) {
      invalid.push(`${key} has spaces or formatting issues`)
    }
    
    // Check for quotes that shouldn't be there
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      invalid.push(`${key} has quotes that should be removed`)
    }
    
    // Trim and validate
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      invalid.push(`${key} is empty after trimming`)
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:')
    missing.forEach(key => console.error(`   - ${key}`))
    console.error('')
  }
  
  if (invalid.length > 0) {
    console.error('⚠️  Invalid environment variables:')
    invalid.forEach(msg => console.error(`   - ${msg}`))
    console.error('')
  }
  
  if (missing.length === 0 && invalid.length === 0) {
    console.log('✅ All environment variables are valid!\n')
    return true
  }
  
  console.log('💡 Tips:')
  console.log('   - Remove spaces around = signs')
  console.log('   - Remove quotes from values')
  console.log('   - Ensure no trailing spaces')
  console.log('   - Use .env.local for local development\n')
  
  return false
}

if (require.main === module) {
  const isValid = validateEnv()
  process.exit(isValid ? 0 : 1)
}

module.exports = { validateEnv }

