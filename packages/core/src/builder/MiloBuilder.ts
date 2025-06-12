import { BuilderConfig, MiloPage, BuildResult, ComponentDefinition, MiloComponent } from '../types';

export class MiloBuilder {
  private config: BuilderConfig;
  private pages: Map<string, MiloPage>;
  private components: Map<string, ComponentDefinition>;

  constructor(config: BuilderConfig = {}) {
    this.config = {
      output: 'dist',
      minify: true,
      sourcemaps: false,
      ...config
    };
    this.pages = new Map();
    this.components = new Map();
  }

  // Register a component definition
  registerComponent(component: ComponentDefinition): void {
    this.components.set(component.name, component);
  }

  // Add a page to the builder
  addPage(page: MiloPage): void {
    this.pages.set(page.name, page);
  }

  // Get a page by name
  getPage(name: string): MiloPage | undefined {
    return this.pages.get(name);
  }

  // Get all registered components
  getComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  // Validate a component instance
  validateComponent(component: MiloComponent): boolean {
    const definition = this.components.get(component.type);
    if (!definition) {
      return false;
    }

    // Basic prop validation
    for (const [propName, propDef] of Object.entries(definition.props)) {
      const value = component.props[propName];
      
      if (propDef.required && (value === undefined || value === null)) {
        return false;
      }

      if (value !== undefined && !this.validatePropType(value, propDef.type)) {
        return false;
      }
    }

    return true;
  }

  private validatePropType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  // Build all pages
  async build(): Promise<BuildResult> {
    const errors: string[] = [];
    const builtPages = [];

    for (const [name, page] of this.pages) {
      try {
        // Validate all components in the page
        for (const component of page.components) {
          if (!this.validateComponent(component)) {
            errors.push(`Invalid component ${component.type} in page ${name}`);
          }
        }

        // For now, create a simple HTML structure
        const html = this.generatePageHTML(page);
        const css = this.generatePageCSS(page);
        const js = this.generatePageJS(page);

        builtPages.push({
          path: page.path,
          html,
          css,
          js
        });
      } catch (error) {
        errors.push(`Error building page ${name}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      pages: builtPages,
      assets: [],
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private generatePageHTML(page: MiloPage): string {
    const title = page.meta?.title || page.name;
    const description = page.meta?.description || '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root">
    ${this.renderComponents(page.components)}
  </div>
  <script src="script.js"></script>
</body>
</html>`;
  }

  private renderComponents(components: MiloComponent[]): string {
    return components.map(component => {
      const definition = this.components.get(component.type);
      if (!definition) {
        return `<!-- Unknown component: ${component.type} -->`;
      }

      // Apply default props
      const props = {
        ...definition.defaultProps,
        ...component.props
      };

      // Render the component
      const rendered = definition.render(props);
      return typeof rendered === 'string' ? rendered : '';
    }).join('\n');
  }

  private generatePageCSS(page: MiloPage): string {
    // Basic CSS generation - can be extended
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      
      #root {
        min-height: 100vh;
      }
    `;
  }

  private generatePageJS(page: MiloPage): string {
    // Basic JS for interactivity - can be extended
    return `
      console.log('Milo page loaded: ${page.name}');
      
      // Add any dynamic functionality here
    `;
  }
}