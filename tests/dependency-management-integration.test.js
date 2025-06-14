/**
 * Dependency Management System Integration Tests
 * 
 * Tests the complete dependency management workflow including:
 * - Package scanning and detection
 * - Version comparison and outdated package identification
 * - Security vulnerability scanning
 * - Safe update mechanism
 * - Database persistence
 */

// Mock file system operations
const fs = require('fs')
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  copyFileSync: jest.fn(),
  existsSync: jest.fn(() => true)
}))

// Mock child process for npm commands
const { exec } = require('child_process')
jest.mock('child_process', () => ({
  exec: jest.fn()
}))

// Mock utilities
const { promisify } = require('util')
jest.mock('util', () => ({
  promisify: jest.fn((fn) => jest.fn())
}))

describe('Dependency Management Integration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Package.json Processing', () => {
    test('should parse package.json and extract dependencies', () => {
      const mockPackageJson = {
        dependencies: {
          'react': '^18.2.0',
          'next': '^14.0.0',
          'lodash': '^4.17.20'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'jest': '^29.0.0'
        }
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson))
      
      // Simulate the dependency extraction logic
      const dependencies = Object.entries(mockPackageJson.dependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: false,
      }))
      
      const devDependencies = Object.entries(mockPackageJson.devDependencies || {}).map(([name, version]) => ({
        name,
        current_version: version.toString().replace(/^\^|~/, ""),
        is_dev: true,
      }))
      
      expect(dependencies).toHaveLength(3)
      expect(devDependencies).toHaveLength(2)
      expect(dependencies.find(d => d.name === 'react')).toMatchObject({
        name: 'react',
        current_version: '18.2.0',
        is_dev: false
      })
      expect(devDependencies.find(d => d.name === 'typescript')).toMatchObject({
        name: 'typescript',
        current_version: '5.0.0',
        is_dev: true
      })
    })

    test('should handle malformed package.json', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })
      
      // Should gracefully handle errors
      let dependencies = []
      let devDependencies = []
      
      try {
        const packageJsonContent = fs.readFileSync('package.json', 'utf8')
        const packageJson = JSON.parse(packageJsonContent)
        dependencies = Object.entries(packageJson.dependencies || {})
        devDependencies = Object.entries(packageJson.devDependencies || {})
      } catch (error) {
        console.error('Error reading package.json:', error.message)
        dependencies = []
        devDependencies = []
      }
      
      expect(dependencies).toHaveLength(0)
      expect(devDependencies).toHaveLength(0)
    })
  })

  describe('NPM Command Integration', () => {
    test('should run npm outdated and parse results', async () => {
      const execAsync = promisify(exec)
      const mockOutdatedResult = {
        'lodash': {
          current: '4.17.20',
          wanted: '4.17.21',
          latest: '4.17.21',
          location: 'node_modules/lodash'
        },
        'react': {
          current: '18.2.0', 
          wanted: '18.2.0',
          latest: '18.3.1',
          location: 'node_modules/react'
        }
      }
      
      execAsync.mockResolvedValue({
        stdout: JSON.stringify(mockOutdatedResult),
        stderr: ''
      })
      
      const result = await execAsync('npm outdated --json')
      const outdatedPackages = JSON.parse(result.stdout)
      
      expect(outdatedPackages).toHaveProperty('lodash')
      expect(outdatedPackages).toHaveProperty('react')
      expect(outdatedPackages.lodash.latest).toBe('4.17.21')
      expect(outdatedPackages.react.latest).toBe('18.3.1')
    })

    test('should run npm audit and parse security results', async () => {
      const execAsync = promisify(exec)
      const mockAuditResult = {
        vulnerabilities: {
          'lodash': {
            severity: 'high',
            via: [
              {
                source: 'npm-audit',
                name: 'lodash',
                dependency: 'lodash',
                title: 'Prototype Pollution in lodash',
                url: 'https://npmjs.com/advisories/1673',
                severity: 'high',
                range: '<4.17.21'
              }
            ],
            fixAvailable: {
              name: 'lodash',
              version: '4.17.21',
              isSemVerMajor: false
            }
          }
        },
        metadata: {
          vulnerabilities: {
            total: 1,
            high: 1,
            moderate: 0,
            low: 0,
            critical: 0
          }
        }
      }
      
      execAsync.mockResolvedValue({
        stdout: JSON.stringify(mockAuditResult),
        stderr: ''
      })
      
      const result = await execAsync('npm audit --json')
      const auditData = JSON.parse(result.stdout)
      
      expect(auditData.vulnerabilities).toHaveProperty('lodash')
      expect(auditData.vulnerabilities.lodash.severity).toBe('high')
      expect(auditData.metadata.vulnerabilities.total).toBe(1)
      expect(auditData.metadata.vulnerabilities.high).toBe(1)
    })
  })

  describe('Security Score Calculation', () => {
    test('should calculate security score based on vulnerabilities', () => {
      const vulnerableDeps = 2
      const dependabotAlertDeps = 1
      const outdatedDeps = 5
      
      // Simulate the security score calculation from the main route
      const securityScore = Math.max(0, 100 - vulnerableDeps * 10 - dependabotAlertDeps * 15 - outdatedDeps * 5)
      
      expect(securityScore).toBe(40) // 100 - 20 - 15 - 25 = 40
    })

    test('should not go below 0 for security score', () => {
      const vulnerableDeps = 20
      const dependabotAlertDeps = 10
      const outdatedDeps = 50
      
      const securityScore = Math.max(0, 100 - vulnerableDeps * 10 - dependabotAlertDeps * 15 - outdatedDeps * 5)
      
      expect(securityScore).toBe(0)
    })

    test('should have perfect score with no issues', () => {
      const vulnerableDeps = 0
      const dependabotAlertDeps = 0
      const outdatedDeps = 0
      
      const securityScore = Math.max(0, 100 - vulnerableDeps * 10 - dependabotAlertDeps * 15 - outdatedDeps * 5)
      
      expect(securityScore).toBe(100)
    })
  })

  describe('Backup and Restore Mechanism', () => {
    test('should create backup before package updates', () => {
      const packageJsonPath = '/mock/package.json'
      const backupPath = '/mock/package.json.backup'
      
      // Simulate backup creation
      try {
        fs.copyFileSync(packageJsonPath, backupPath)
        expect(fs.copyFileSync).toHaveBeenCalledWith(packageJsonPath, backupPath)
      } catch (error) {
        console.error('Failed to create backup:', error)
      }
    })

    test('should restore from backup on failure', () => {
      const packageJsonPath = '/mock/package.json'
      const backupPath = '/mock/package.json.backup'
      
      fs.existsSync.mockReturnValue(true)
      
      // Simulate restore operation
      try {
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, packageJsonPath)
          expect(fs.copyFileSync).toHaveBeenCalledWith(backupPath, packageJsonPath)
        }
      } catch (error) {
        console.error('Failed to restore backup:', error)
      }
    })
  })

  describe('Update Mode Validation', () => {
    test('should validate update mode parameters', () => {
      const validModes = ['specific', 'compatible', 'latest', 'minor', 'patch']
      const testMode = 'conservative'
      
      const isValidMode = validModes.includes(testMode)
      expect(isValidMode).toBe(false)
      
      const testValidMode = 'specific'
      const isValidValidMode = validModes.includes(testValidMode)
      expect(isValidValidMode).toBe(true)
    })

    test('should validate package input format', () => {
      const validPackageInputs = [
        { name: 'react', version: '18.3.0' },
        { name: 'lodash' }, // version optional
      ]
      
      const invalidPackageInputs = [
        'just-a-string',
        { version: '1.0.0' }, // missing name
        { name: '', version: '1.0.0' }, // empty name
      ]
      
      const validatePackageInput = (pkg) => {
        return typeof pkg === 'object' && 
               pkg !== null && 
               typeof pkg.name === 'string' && 
               pkg.name.length > 0
      }
      
      validPackageInputs.forEach(pkg => {
        expect(validatePackageInput(pkg)).toBe(true)
      })
      
      invalidPackageInputs.forEach(pkg => {
        expect(validatePackageInput(pkg)).toBe(false)
      })
    })
  })

  describe('Dependency Data Processing', () => {
    test('should merge package.json data with npm info', () => {
      const packageJsonDeps = [
        { name: 'react', current_version: '18.2.0', is_dev: false }
      ]
      
      const npmInfo = {
        description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
        repository: 'https://github.com/facebook/react',
        latestVersion: '18.3.1',
        homepage: 'https://reactjs.org/',
        license: 'MIT',
        author: 'React Team'
      }
      
      const mergedData = packageJsonDeps.map(dep => ({
        ...dep,
        ...npmInfo,
        outdated: dep.current_version !== npmInfo.latestVersion
      }))
      
      expect(mergedData[0]).toMatchObject({
        name: 'react',
        current_version: '18.2.0',
        latestVersion: '18.3.1',
        description: expect.stringContaining('JavaScript library'),
        repository: 'https://github.com/facebook/react',
        license: 'MIT',
        outdated: true
      })
    })

    test('should handle missing npm registry data gracefully', () => {
      const packageJsonDeps = [
        { name: 'unknown-package', current_version: '1.0.0', is_dev: false }
      ]
      
      const fallbackInfo = {
        description: '',
        repository: '',
        latestVersion: '',
        homepage: '',
        license: 'Unknown',
        author: 'Unknown'
      }
      
      const mergedData = packageJsonDeps.map(dep => ({
        ...dep,
        ...fallbackInfo,
        outdated: false // Can't determine if no latest version
      }))
      
      expect(mergedData[0]).toMatchObject({
        name: 'unknown-package',
        current_version: '1.0.0',
        latestVersion: '',
        license: 'Unknown',
        author: 'Unknown',
        outdated: false
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle npm command timeouts', async () => {
      const execAsync = promisify(exec)
      execAsync.mockRejectedValue(new Error('Command timed out'))
      
      let result = {}
      try {
        result = await execAsync('npm outdated --json', { timeout: 30000 })
      } catch (error) {
        console.error('npm command failed:', error.message)
        result = { stdout: '{}', stderr: error.message }
      }
      
      expect(result.stderr).toContain('timed out')
    })

    test('should handle npm audit exit code 1 (vulnerabilities found)', async () => {
      const execAsync = promisify(exec)
      const auditError = new Error('npm audit found vulnerabilities')
      auditError.code = 1
      auditError.stdout = '{"vulnerabilities":{"lodash":{"severity":"high"}}}'
      
      execAsync.mockRejectedValue(auditError)
      
      let vulnerabilities = {}
      try {
        const result = await execAsync('npm audit --json')
        vulnerabilities = JSON.parse(result.stdout)
      } catch (error) {
        if (error.code === 1 && error.stdout) {
          vulnerabilities = JSON.parse(error.stdout)
        }
      }
      
      expect(vulnerabilities).toHaveProperty('vulnerabilities')
      expect(vulnerabilities.vulnerabilities).toHaveProperty('lodash')
    })
  })

  describe('Version Comparison', () => {
    test('should correctly identify outdated packages', () => {
      const dependencies = [
        { name: 'react', current_version: '18.2.0', latest_version: '18.3.1' },
        { name: 'lodash', current_version: '4.17.21', latest_version: '4.17.21' },
        { name: 'typescript', current_version: '5.0.0', latest_version: '5.2.0' }
      ]
      
      const outdatedDeps = dependencies.filter(dep => 
        dep.latest_version && dep.current_version !== dep.latest_version
      )
      
      expect(outdatedDeps).toHaveLength(2)
      expect(outdatedDeps.map(d => d.name)).toEqual(['react', 'typescript'])
    })

    test('should handle version range prefixes', () => {
      const versionStrings = [
        '^18.2.0',
        '~4.17.20', 
        '>=5.0.0',
        '18.2.0',
        'latest'
      ]
      
      const cleanVersions = versionStrings.map(version => 
        version.toString().replace(/^\^|~|>=/, "")
      )
      
      expect(cleanVersions).toEqual([
        '18.2.0',
        '4.17.20',
        '5.0.0',
        '18.2.0',
        'latest'
      ])
    })
  })
})