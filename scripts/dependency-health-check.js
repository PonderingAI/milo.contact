#!/usr/bin/env node

/**
 * Dependency Management System Health Check
 * 
 * This script validates the dependency management system setup
 * and provides recommendations for optimal configuration.
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class DependencyHealthCheck {
  constructor() {
    this.results = {
      packageJson: false,
      svixInstalled: false,
      testFramework: false,
      buildScript: false,
      environmentVars: false,
      recommendations: []
    }
  }

  async run() {
    console.log('🔍 Running Dependency Management System Health Check...\n')
    
    await this.checkPackageJson()
    await this.checkSvixInstallation()
    await this.checkTestFramework()
    await this.checkBuildScript()
    await this.checkEnvironmentVars()
    
    this.generateReport()
  }

  async checkPackageJson() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      this.results.packageJson = true
      console.log('✅ package.json found and readable')
      
      // Check for required dependencies
      const requiredDeps = ['@clerk/nextjs', '@supabase/supabase-js', 'next']
      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      )
      
      if (missingDeps.length > 0) {
        this.results.recommendations.push(
          `Missing required dependencies: ${missingDeps.join(', ')}`
        )
      }
      
      // Check dependency count
      const totalDeps = Object.keys(packageJson.dependencies || {}).length + 
                       Object.keys(packageJson.devDependencies || {}).length
      console.log(`📦 Found ${totalDeps} total dependencies`)
      
    } catch (error) {
      console.log('❌ package.json not found or invalid')
      this.results.recommendations.push('Create a valid package.json file')
    }
  }

  async checkSvixInstallation() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      if (packageJson.dependencies?.svix || packageJson.devDependencies?.svix) {
        this.results.svixInstalled = true
        console.log('✅ svix package installed for webhook security')
      } else {
        console.log('⚠️  svix package not found')
        this.results.recommendations.push('Install svix package: npm install svix')
      }
    } catch (error) {
      console.log('❌ Could not check svix installation')
    }
  }

  async checkTestFramework() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      const testFrameworks = ['jest', 'vitest', 'mocha', '@testing-library/react']
      const hasTestFramework = testFrameworks.some(framework => 
        packageJson.dependencies?.[framework] || packageJson.devDependencies?.[framework]
      )
      
      if (hasTestFramework) {
        this.results.testFramework = true
        console.log('✅ Testing framework detected')
        
        // Check for test script
        if (packageJson.scripts?.test) {
          console.log('✅ Test script configured')
        } else {
          this.results.recommendations.push('Add test script to package.json')
        }
      } else {
        console.log('⚠️  No testing framework found')
        this.results.recommendations.push('Install a testing framework (recommended: jest)')
      }
    } catch (error) {
      console.log('❌ Could not check test framework')
    }
  }

  async checkBuildScript() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      if (packageJson.scripts?.build) {
        this.results.buildScript = true
        console.log('✅ Build script configured')
        
        // Test if build script works
        try {
          console.log('🔄 Testing build script...')
          await execAsync('npm run build --dry-run', { timeout: 10000 })
          console.log('✅ Build script appears functional')
        } catch (error) {
          if (!error.message.includes('dry-run')) {
            console.log('⚠️  Build script may have issues')
            this.results.recommendations.push('Verify build script works correctly')
          }
        }
      } else {
        console.log('❌ No build script found')
        this.results.recommendations.push('Add build script to package.json')
      }
    } catch (error) {
      console.log('❌ Could not check build script')
    }
  }

  async checkEnvironmentVars() {
    const requiredVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
    
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length === 0) {
      this.results.environmentVars = true
      console.log('✅ Required environment variables configured')
    } else {
      console.log('⚠️  Missing environment variables')
      this.results.recommendations.push(
        `Configure missing environment variables: ${missingVars.join(', ')}`
      )
    }
    
    // Check for optional but recommended vars
    const optionalVars = ['GITHUB_TOKEN', 'CLERK_WEBHOOK_SECRET']
    const missingOptional = optionalVars.filter(varName => !process.env[varName])
    
    if (missingOptional.length > 0) {
      this.results.recommendations.push(
        `Optional variables for enhanced features: ${missingOptional.join(', ')}`
      )
    }
  }

  generateReport() {
    console.log('\n📋 Health Check Summary')
    console.log('=' .repeat(50))
    
    const checks = [
      ['Package.json', this.results.packageJson],
      ['Svix Security', this.results.svixInstalled],
      ['Test Framework', this.results.testFramework],
      ['Build Script', this.results.buildScript],
      ['Environment Vars', this.results.environmentVars]
    ]
    
    checks.forEach(([name, status]) => {
      const icon = status ? '✅' : '❌'
      console.log(`${icon} ${name}`)
    })
    
    const score = checks.filter(([_, status]) => status).length
    const total = checks.length
    const percentage = Math.round((score / total) * 100)
    
    console.log(`\n🎯 Overall Score: ${score}/${total} (${percentage}%)`)
    
    if (percentage >= 80) {
      console.log('🎉 Great! Your dependency management system is well configured.')
    } else if (percentage >= 60) {
      console.log('👍 Good setup, but there are some improvements to make.')
    } else {
      console.log('⚠️  Your setup needs attention for optimal dependency management.')
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    console.log('\n📖 For detailed setup instructions, see docs/DEPENDENCY-MANAGEMENT-GUIDE.md')
  }
}

// Run the health check if this script is executed directly
if (require.main === module) {
  const healthCheck = new DependencyHealthCheck()
  healthCheck.run().catch(error => {
    console.error('❌ Health check failed:', error.message)
    process.exit(1)
  })
}

module.exports = DependencyHealthCheck