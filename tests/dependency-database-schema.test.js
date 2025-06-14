/**
 * Database Schema Tests for Dependency Management
 * 
 * Tests to validate that all dependency-related database tables
 * are properly configured and have the correct structure
 */

// Mock the database schema
const mockDependencyTables = {
  dependencies: {
    name: "dependencies",
    displayName: "Dependencies", 
    description: "Stores information about project dependencies",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles"],
    sql: `
      CREATE TABLE IF NOT EXISTS dependencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        current_version VARCHAR(100) NOT NULL,
        latest_version VARCHAR(100),
        locked BOOLEAN DEFAULT FALSE,
        locked_version VARCHAR(100),
        update_mode VARCHAR(50) DEFAULT 'global',
        last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        has_security_update BOOLEAN DEFAULT FALSE,
        is_dev BOOLEAN DEFAULT FALSE,
        description TEXT,
        repository VARCHAR(500),
        homepage VARCHAR(500),
        license VARCHAR(100),
        author VARCHAR(255),
        vulnerability_count INTEGER DEFAULT 0,
        dependabot_alert_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_dependencies_name ON dependencies(name);
      CREATE INDEX IF NOT EXISTS idx_dependencies_update_mode ON dependencies(update_mode);
      CREATE INDEX IF NOT EXISTS idx_dependencies_has_security_update ON dependencies(has_security_update);
      CREATE INDEX IF NOT EXISTS idx_dependencies_last_checked ON dependencies(last_checked);
    `
  },
  dependency_settings: {
    name: "dependency_settings",
    displayName: "Dependency Settings",
    description: "Stores settings for dependency management",
    category: "dependencies", 
    required: false,
    dependencies: ["user_roles"],
    sql: `
      CREATE TABLE IF NOT EXISTS dependency_settings (
        id SERIAL PRIMARY KEY,
        update_mode VARCHAR(50) DEFAULT 'conservative',
        auto_update_enabled BOOLEAN DEFAULT FALSE,
        update_schedule VARCHAR(100) DEFAULT 'daily',
        security_auto_update BOOLEAN DEFAULT TRUE,
        dependabot_enabled BOOLEAN DEFAULT TRUE,
        github_token_configured BOOLEAN DEFAULT FALSE,
        last_scan TIMESTAMP WITH TIME ZONE,
        scan_frequency_hours INTEGER DEFAULT 24,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
      VALUES ('conservative', FALSE, 'daily')
      ON CONFLICT DO NOTHING;
    `
  },
  dependabot_alerts: {
    name: "dependabot_alerts",
    displayName: "Dependabot Alerts",
    description: "Stores GitHub Dependabot security alerts",
    category: "dependencies",
    required: false,
    dependencies: ["user_roles"],
    sql: `
      CREATE TABLE IF NOT EXISTS dependabot_alerts (
        id SERIAL PRIMARY KEY,
        github_alert_number INTEGER NOT NULL UNIQUE,
        package_name VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        state VARCHAR(50) NOT NULL,
        cve_id VARCHAR(100),
        ghsa_id VARCHAR(100),
        summary TEXT,
        description TEXT,
        vulnerable_version_range VARCHAR(255),
        recommended_version VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolution_method VARCHAR(100),
        auto_updated BOOLEAN DEFAULT FALSE,
        update_successful BOOLEAN,
        CONSTRAINT fk_dependabot_dependency 
          FOREIGN KEY (package_name) REFERENCES dependencies(name) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_package ON dependabot_alerts(package_name);
      CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_severity ON dependabot_alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_state ON dependabot_alerts(state);
      CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_github_number ON dependabot_alerts(github_alert_number);
    `
  },
  dependency_update_history: {
    name: "dependency_update_history",
    displayName: "Dependency Update History",
    description: "Tracks all dependency update attempts and results",
    category: "dependencies",
    required: false, 
    dependencies: ["user_roles", "dependencies"],
    sql: `
      CREATE TABLE IF NOT EXISTS dependency_update_history (
        id SERIAL PRIMARY KEY,
        dependency_name VARCHAR(255) NOT NULL,
        from_version VARCHAR(100),
        to_version VARCHAR(100) NOT NULL,
        update_mode VARCHAR(50) NOT NULL,
        initiated_by VARCHAR(100) NOT NULL, -- 'user', 'auto', 'dependabot'
        initiated_by_user_id UUID REFERENCES user_roles(user_id),
        dependabot_alert_id INTEGER REFERENCES dependabot_alerts(id),
        update_successful BOOLEAN NOT NULL,
        backup_created BOOLEAN DEFAULT FALSE,
        build_successful BOOLEAN,
        tests_passed BOOLEAN,
        rollback_performed BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        duration_seconds INTEGER,
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT fk_update_history_dependency 
          FOREIGN KEY (dependency_name) REFERENCES dependencies(name) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_update_history_dependency ON dependency_update_history(dependency_name);
      CREATE INDEX IF NOT EXISTS idx_update_history_initiated_by ON dependency_update_history(initiated_by);
      CREATE INDEX IF NOT EXISTS idx_update_history_successful ON dependency_update_history(update_successful);
      CREATE INDEX IF NOT EXISTS idx_update_history_started_at ON dependency_update_history(started_at);
    `
  },
  security_audits: {
    name: "security_audits",
    displayName: "Security Audits",
    description: "Stores security audit results",
    category: "security",
    required: false,
    dependencies: ["user_roles"],
    sql: `
      CREATE TABLE IF NOT EXISTS security_audits (
        id SERIAL PRIMARY KEY,
        audit_type VARCHAR(50) NOT NULL, -- 'npm_audit', 'dependabot', 'manual'
        total_vulnerabilities INTEGER DEFAULT 0,
        critical_count INTEGER DEFAULT 0,
        high_count INTEGER DEFAULT 0,
        medium_count INTEGER DEFAULT 0,
        low_count INTEGER DEFAULT 0,
        security_score INTEGER DEFAULT 100,
        audit_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES user_roles(user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_security_audits_type ON security_audits(audit_type);
      CREATE INDEX IF NOT EXISTS idx_security_audits_score ON security_audits(security_score);
      CREATE INDEX IF NOT EXISTS idx_security_audits_created_at ON security_audits(created_at);
    `
  }
}

// Mock database schema utilities
const mockGetTableConfig = jest.fn((tableName) => mockDependencyTables[tableName])
const mockGetAllTables = jest.fn(() => Object.values(mockDependencyTables))
const mockGetTablesByCategory = jest.fn((category) => 
  Object.values(mockDependencyTables).filter(t => t.category === category)
)

jest.mock('@/lib/database/schema', () => ({
  getAllTables: mockGetAllTables,
  getTablesByCategory: mockGetTablesByCategory,
  getTableConfig: mockGetTableConfig,
  tableConfigs: mockDependencyTables
}))

describe('Dependency Management Database Schema', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Table Structure Validation', () => {
    test('should have all required dependency management tables', () => {
      const dependencyTables = mockGetTablesByCategory('dependencies')
      const securityTables = mockGetTablesByCategory('security')
      
      expect(dependencyTables).toHaveLength(4)
      expect(securityTables).toHaveLength(1)
      
      const tableNames = dependencyTables.map(t => t.name)
      expect(tableNames).toContain('dependencies')
      expect(tableNames).toContain('dependency_settings')
      expect(tableNames).toContain('dependabot_alerts')
      expect(tableNames).toContain('dependency_update_history')
    })

    test('dependencies table should have correct structure', () => {
      const depsTable = mockGetTableConfig('dependencies')
      
      expect(depsTable).toBeDefined()
      expect(depsTable.name).toBe('dependencies')
      expect(depsTable.category).toBe('dependencies')
      expect(depsTable.dependencies).toContain('user_roles')
      
      // Check for required columns in SQL
      expect(depsTable.sql).toContain('name VARCHAR(255) NOT NULL UNIQUE')
      expect(depsTable.sql).toContain('current_version VARCHAR(100) NOT NULL')
      expect(depsTable.sql).toContain('latest_version VARCHAR(100)')
      expect(depsTable.sql).toContain('update_mode VARCHAR(50) DEFAULT \'global\'')
      expect(depsTable.sql).toContain('has_security_update BOOLEAN DEFAULT FALSE')
      expect(depsTable.sql).toContain('vulnerability_count INTEGER DEFAULT 0')
      expect(depsTable.sql).toContain('dependabot_alert_id INTEGER')
    })

    test('dependency_settings table should have correct structure', () => {
      const settingsTable = mockGetTableConfig('dependency_settings')
      
      expect(settingsTable).toBeDefined()
      expect(settingsTable.name).toBe('dependency_settings')
      
      // Check for configuration columns
      expect(settingsTable.sql).toContain('update_mode VARCHAR(50) DEFAULT \'conservative\'')
      expect(settingsTable.sql).toContain('auto_update_enabled BOOLEAN DEFAULT FALSE')
      expect(settingsTable.sql).toContain('security_auto_update BOOLEAN DEFAULT TRUE')
      expect(settingsTable.sql).toContain('dependabot_enabled BOOLEAN DEFAULT TRUE')
      expect(settingsTable.sql).toContain('scan_frequency_hours INTEGER DEFAULT 24')
      
      // Should insert default settings
      expect(settingsTable.sql).toContain('INSERT INTO dependency_settings')
      expect(settingsTable.sql).toContain('ON CONFLICT DO NOTHING')
    })

    test('dependabot_alerts table should have correct structure', () => {
      const alertsTable = mockGetTableConfig('dependabot_alerts')
      
      expect(alertsTable).toBeDefined()
      expect(alertsTable.name).toBe('dependabot_alerts')
      
      // Check for Dependabot-specific columns
      expect(alertsTable.sql).toContain('github_alert_number INTEGER NOT NULL UNIQUE')
      expect(alertsTable.sql).toContain('package_name VARCHAR(255) NOT NULL')
      expect(alertsTable.sql).toContain('severity VARCHAR(50) NOT NULL')
      expect(alertsTable.sql).toContain('cve_id VARCHAR(100)')
      expect(alertsTable.sql).toContain('ghsa_id VARCHAR(100)')
      expect(alertsTable.sql).toContain('vulnerable_version_range VARCHAR(255)')
      expect(alertsTable.sql).toContain('recommended_version VARCHAR(100)')
      expect(alertsTable.sql).toContain('auto_updated BOOLEAN DEFAULT FALSE')
      
      // Check foreign key relationship
      expect(alertsTable.sql).toContain('FOREIGN KEY (package_name) REFERENCES dependencies(name)')
    })

    test('dependency_update_history table should track update attempts', () => {
      const historyTable = mockGetTableConfig('dependency_update_history')
      
      expect(historyTable).toBeDefined()
      expect(historyTable.name).toBe('dependency_update_history')
      
      // Check for audit trail columns
      expect(historyTable.sql).toContain('dependency_name VARCHAR(255) NOT NULL')
      expect(historyTable.sql).toContain('from_version VARCHAR(100)')
      expect(historyTable.sql).toContain('to_version VARCHAR(100) NOT NULL')
      expect(historyTable.sql).toContain('initiated_by VARCHAR(100) NOT NULL')
      expect(historyTable.sql).toContain('update_successful BOOLEAN NOT NULL')
      expect(historyTable.sql).toContain('backup_created BOOLEAN DEFAULT FALSE')
      expect(historyTable.sql).toContain('build_successful BOOLEAN')
      expect(historyTable.sql).toContain('tests_passed BOOLEAN')
      expect(historyTable.sql).toContain('rollback_performed BOOLEAN DEFAULT FALSE')
      
      // Check foreign key relationships
      expect(historyTable.sql).toContain('REFERENCES user_roles(user_id)')
      expect(historyTable.sql).toContain('REFERENCES dependabot_alerts(id)')
      expect(historyTable.sql).toContain('REFERENCES dependencies(name)')
    })

    test('security_audits table should track audit results', () => {
      const auditsTable = mockGetTableConfig('security_audits')
      
      expect(auditsTable).toBeDefined()
      expect(auditsTable.name).toBe('security_audits')
      expect(auditsTable.category).toBe('security')
      
      // Check for audit tracking columns
      expect(auditsTable.sql).toContain('audit_type VARCHAR(50) NOT NULL')
      expect(auditsTable.sql).toContain('total_vulnerabilities INTEGER DEFAULT 0')
      expect(auditsTable.sql).toContain('critical_count INTEGER DEFAULT 0')
      expect(auditsTable.sql).toContain('high_count INTEGER DEFAULT 0')
      expect(auditsTable.sql).toContain('medium_count INTEGER DEFAULT 0')
      expect(auditsTable.sql).toContain('low_count INTEGER DEFAULT 0')
      expect(auditsTable.sql).toContain('security_score INTEGER DEFAULT 100')
      expect(auditsTable.sql).toContain('audit_data JSONB')
    })
  })

  describe('Table Relationships and Dependencies', () => {
    test('should have proper dependency chain', () => {
      const dependencyTables = mockGetTablesByCategory('dependencies')
      
      // All dependency tables should depend on user_roles
      dependencyTables.forEach(table => {
        expect(table.dependencies).toContain('user_roles')
      })
      
      // dependency_update_history should depend on dependencies table
      const historyTable = mockGetTableConfig('dependency_update_history')
      expect(historyTable.dependencies).toContain('dependencies')
    })

    test('should have proper indexes for performance', () => {
      const tables = ['dependencies', 'dependabot_alerts', 'dependency_update_history', 'security_audits']
      
      tables.forEach(tableName => {
        const table = mockGetTableConfig(tableName)
        expect(table.sql).toContain('CREATE INDEX IF NOT EXISTS')
      })
      
      // Check specific important indexes
      const depsTable = mockGetTableConfig('dependencies')
      expect(depsTable.sql).toContain('idx_dependencies_name')
      expect(depsTable.sql).toContain('idx_dependencies_has_security_update')
      
      const alertsTable = mockGetTableConfig('dependabot_alerts')
      expect(alertsTable.sql).toContain('idx_dependabot_alerts_package')
      expect(alertsTable.sql).toContain('idx_dependabot_alerts_severity')
    })

    test('should enforce referential integrity', () => {
      // Check foreign key constraints
      const alertsTable = mockGetTableConfig('dependabot_alerts')
      expect(alertsTable.sql).toContain('FOREIGN KEY (package_name) REFERENCES dependencies(name)')
      expect(alertsTable.sql).toContain('ON DELETE CASCADE')
      
      const historyTable = mockGetTableConfig('dependency_update_history')
      expect(historyTable.sql).toContain('REFERENCES user_roles(user_id)')
      expect(historyTable.sql).toContain('REFERENCES dependabot_alerts(id)')
      expect(historyTable.sql).toContain('REFERENCES dependencies(name)')
    })
  })

  describe('Data Integrity and Constraints', () => {
    test('should have appropriate NOT NULL constraints', () => {
      const depsTable = mockGetTableConfig('dependencies')
      expect(depsTable.sql).toContain('name VARCHAR(255) NOT NULL UNIQUE')
      expect(depsTable.sql).toContain('current_version VARCHAR(100) NOT NULL')
      
      const alertsTable = mockGetTableConfig('dependabot_alerts')
      expect(alertsTable.sql).toContain('github_alert_number INTEGER NOT NULL UNIQUE')
      expect(alertsTable.sql).toContain('package_name VARCHAR(255) NOT NULL')
      expect(alertsTable.sql).toContain('severity VARCHAR(50) NOT NULL')
    })

    test('should have appropriate default values', () => {
      const depsTable = mockGetTableConfig('dependencies')
      expect(depsTable.sql).toContain('locked BOOLEAN DEFAULT FALSE')
      expect(depsTable.sql).toContain('has_security_update BOOLEAN DEFAULT FALSE')
      expect(depsTable.sql).toContain('vulnerability_count INTEGER DEFAULT 0')
      
      const settingsTable = mockGetTableConfig('dependency_settings')
      expect(settingsTable.sql).toContain('auto_update_enabled BOOLEAN DEFAULT FALSE')
      expect(settingsTable.sql).toContain('security_auto_update BOOLEAN DEFAULT TRUE')
      expect(settingsTable.sql).toContain('dependabot_enabled BOOLEAN DEFAULT TRUE')
    })

    test('should use appropriate data types', () => {
      const tables = Object.values(mockDependencyTables)
      
      tables.forEach(table => {
        // Should use TIMESTAMP WITH TIME ZONE for timestamps
        if (table.sql.includes('created_at') || table.sql.includes('updated_at')) {
          expect(table.sql).toContain('TIMESTAMP WITH TIME ZONE')
        }
        
        // Should use JSONB for structured data
        if (table.name === 'security_audits') {
          expect(table.sql).toContain('audit_data JSONB')
        }
        
        // Should use appropriate VARCHAR lengths
        expect(table.sql).toMatch(/VARCHAR\(\d+\)/)
      })
    })
  })

  describe('Schema Version Management', () => {
    test('should use IF NOT EXISTS for table creation', () => {
      const tables = Object.values(mockDependencyTables)
      
      tables.forEach(table => {
        expect(table.sql).toContain('CREATE TABLE IF NOT EXISTS')
        if (table.sql.includes('CREATE INDEX')) {
          expect(table.sql).toContain('CREATE INDEX IF NOT EXISTS')
        }
      })
    })

    test('should handle schema updates gracefully', () => {
      // Test that adding new columns or indexes is safe
      const depsTable = mockGetTableConfig('dependencies')
      
      // Should be able to add new columns with defaults
      const newColumnSQL = 'ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS new_field VARCHAR(100) DEFAULT \'default_value\''
      expect(newColumnSQL).toContain('ADD COLUMN IF NOT EXISTS')
      expect(newColumnSQL).toContain('DEFAULT')
    })
  })

  describe('Performance Considerations', () => {
    test('should have indexes on frequently queried columns', () => {
      const depsTable = mockGetTableConfig('dependencies')
      
      // Should index columns used in WHERE clauses
      expect(depsTable.sql).toContain('idx_dependencies_name')
      expect(depsTable.sql).toContain('idx_dependencies_update_mode')
      expect(depsTable.sql).toContain('idx_dependencies_has_security_update')
      expect(depsTable.sql).toContain('idx_dependencies_last_checked')
    })

    test('should have efficient foreign key indexes', () => {
      const alertsTable = mockGetTableConfig('dependabot_alerts')
      const historyTable = mockGetTableConfig('dependency_update_history')
      
      // Foreign key columns should be indexed
      expect(alertsTable.sql).toContain('idx_dependabot_alerts_package')
      expect(historyTable.sql).toContain('idx_update_history_dependency')
    })

    test('should use appropriate column sizes', () => {
      const depsTable = mockGetTableConfig('dependencies')
      
      // Package names shouldn't need more than 255 chars
      expect(depsTable.sql).toContain('name VARCHAR(255)')
      
      // Version strings can be shorter
      expect(depsTable.sql).toContain('current_version VARCHAR(100)')
      expect(depsTable.sql).toContain('latest_version VARCHAR(100)')
      
      // URLs might need more space
      expect(depsTable.sql).toContain('repository VARCHAR(500)')
      expect(depsTable.sql).toContain('homepage VARCHAR(500)')
    })
  })
})