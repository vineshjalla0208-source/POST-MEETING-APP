#!/usr/bin/env node

/**
 * Google OAuth Configuration Validator
 * Validates OAuth client ID, redirect URI, and environment variables
 */

require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]

const errors = []
const warnings = []

console.log('🔍 Validating Google OAuth Configuration...\n')

// 1. Check required environment variables
console.log('1️⃣  Checking environment variables...')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value.trim() === '') {
    errors.push(`❌ Missing: ${varName}`)
  } else {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`)
  }
})

// 2. Validate NEXTAUTH_URL
console.log('\n2️⃣  Validating NEXTAUTH_URL...')
const nextAuthUrl = (process.env.NEXTAUTH_URL || '').trim()
if (nextAuthUrl !== 'http://localhost:3000') {
  warnings.push(`⚠️  NEXTAUTH_URL is "${nextAuthUrl}" but should be "http://localhost:3000" for local development`)
  console.log(`   ⚠️  NEXTAUTH_URL: ${nextAuthUrl} (should be http://localhost:3000)`)
} else {
  console.log(`   ✅ NEXTAUTH_URL: ${nextAuthUrl}`)
}

// 3. Validate NEXTAUTH_SECRET
console.log('\n3️⃣  Validating NEXTAUTH_SECRET...')
const nextAuthSecret = (process.env.NEXTAUTH_SECRET || '').trim()
if (nextAuthSecret.length < 32) {
  errors.push(`❌ NEXTAUTH_SECRET is too short (${nextAuthSecret.length} chars, minimum 32 required)`)
  console.log(`   ❌ NEXTAUTH_SECRET: Too short (${nextAuthSecret.length} chars)`)
} else {
  console.log(`   ✅ NEXTAUTH_SECRET: Valid length (${nextAuthSecret.length} chars)`)
}

// 4. Validate Google Client ID format
console.log('\n4️⃣  Validating GOOGLE_CLIENT_ID format...')
const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim()
if (!googleClientId) {
  errors.push('❌ GOOGLE_CLIENT_ID is missing')
} else if (!googleClientId.includes('.apps.googleusercontent.com')) {
  warnings.push(`⚠️  GOOGLE_CLIENT_ID format may be incorrect: ${googleClientId}`)
  console.log(`   ⚠️  GOOGLE_CLIENT_ID format may be incorrect`)
} else {
  console.log(`   ✅ GOOGLE_CLIENT_ID: Valid format`)
  console.log(`      ${googleClientId}`)
}

// 5. Validate Google Client Secret
console.log('\n5️⃣  Validating GOOGLE_CLIENT_SECRET...')
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim()
if (!googleClientSecret) {
  errors.push('❌ GOOGLE_CLIENT_SECRET is missing')
} else {
  console.log(`   ✅ GOOGLE_CLIENT_SECRET: Present (${googleClientSecret.length} chars)`)
}

// 6. Calculate redirect URI
console.log('\n6️⃣  Calculating redirect URI...')
const redirectUri = `${nextAuthUrl}/api/auth/callback/google`
console.log(`   📍 Redirect URI: ${redirectUri}`)
console.log(`   ⚠️  Make sure this EXACT URI is in Google Cloud Console:`)
console.log(`      Authorized redirect URIs: ${redirectUri}`)

// 7. Summary
console.log('\n' + '='.repeat(60))
console.log('📊 VALIDATION SUMMARY')
console.log('='.repeat(60))

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Verify redirect URI in Google Cloud Console')
  console.log('   2. Run SQL migration to clear old tokens')
  console.log('   3. Revoke app access in Google Account settings')
  console.log('   4. Sign in again with Google')
} else {
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (must fix):')
    errors.forEach(error => console.log(`   ${error}`))
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach(warning => console.log(`   ${warning}`))
  }
}

console.log('\n' + '='.repeat(60))

process.exit(errors.length > 0 ? 1 : 0)

