// Core exports
export { MiloBuilder } from './builder/MiloBuilder';

// Type exports
export type {
  ComponentProps,
  ComponentDefinition,
  PropDefinitions,
  PropDefinition,
  BuilderConfig,
  ThemeConfig,
  BuildResult,
  BuiltPage,
  MiloComponent,
  MiloPage,
  PageMeta
} from './types';

// Built-in components
export { HeroComponent, AboutComponent } from './components/BuiltInComponents';

// Utility functions
export const createComponent = (type: string, props: any, children?: any[]): any => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    props: props || {},
    children: children || []
  };
};

export const createPage = (name: string, path: string, components: any[] = []): any => {
  return {
    name,
    path,
    components,
    meta: {
      title: name,
      description: `${name} page`
    }
  };
};