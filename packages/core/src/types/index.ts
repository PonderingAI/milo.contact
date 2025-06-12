export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentDefinition {
  name: string;
  displayName: string;
  category: string;
  props: PropDefinitions;
  defaultProps?: Partial<ComponentProps>;
  render: (props: ComponentProps) => string | React.ReactElement;
}

export interface PropDefinitions {
  [key: string]: PropDefinition;
}

export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object';
  default?: any;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface BuilderConfig {
  theme?: ThemeConfig;
  plugins?: string[];
  output?: string;
  minify?: boolean;
  sourcemaps?: boolean;
}

export interface ThemeConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    [key: string]: string | undefined;
  };
  fonts?: {
    heading?: string;
    body?: string;
    [key: string]: string | undefined;
  };
}

export interface BuildResult {
  success: boolean;
  pages: BuiltPage[];
  assets: string[];
  errors?: string[];
}

export interface BuiltPage {
  path: string;
  html: string;
  css: string;
  js: string;
}

export interface MiloComponent {
  id: string;
  type: string;
  props: ComponentProps;
  children?: MiloComponent[];
}

export interface MiloPage {
  name: string;
  path: string;
  components: MiloComponent[];
  meta?: PageMeta;
}

export interface PageMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}