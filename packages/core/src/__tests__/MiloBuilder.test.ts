import { MiloBuilder, HeroComponent, AboutComponent, createComponent, createPage } from '../index';

describe('MiloBuilder', () => {
  let builder: MiloBuilder;

  beforeEach(() => {
    builder = new MiloBuilder();
  });

  test('should create a new builder instance', () => {
    expect(builder).toBeInstanceOf(MiloBuilder);
  });

  test('should register components', () => {
    builder.registerComponent(HeroComponent);
    const components = builder.getComponents();
    expect(components).toHaveLength(1);
    expect(components[0].name).toBe('hero');
  });

  test('should add and retrieve pages', () => {
    const page = createPage('test', '/test', []);
    builder.addPage(page);
    
    const retrievedPage = builder.getPage('test');
    expect(retrievedPage).toBeDefined();
    expect(retrievedPage?.name).toBe('test');
    expect(retrievedPage?.path).toBe('/test');
  });

  test('should validate components', () => {
    builder.registerComponent(HeroComponent);
    
    const validComponent = createComponent('hero', {
      title: 'Test Title'
    });
    
    expect(builder.validateComponent(validComponent)).toBe(true);
  });

  test('should build a simple site', async () => {
    builder.registerComponent(HeroComponent);
    builder.registerComponent(AboutComponent);
    
    const hero = createComponent('hero', {
      title: 'Test Site',
      subtitle: 'Built with Milo'
    });
    
    const about = createComponent('about', {
      title: 'About',
      content: 'This is a test site.'
    });
    
    const page = createPage('home', '/', [hero, about]);
    builder.addPage(page);
    
    const result = await builder.build();
    
    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].path).toBe('/');
    expect(result.pages[0].html).toContain('Test Site');
    expect(result.pages[0].html).toContain('About');
  });

  test('should handle build errors gracefully', async () => {
    // Create a component without registering it
    const invalidComponent = createComponent('nonexistent', {});
    const page = createPage('test', '/test', [invalidComponent]);
    builder.addPage(page);
    
    const result = await builder.build();
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});

describe('Built-in Components', () => {
  test('HeroComponent should have correct structure', () => {
    expect(HeroComponent.name).toBe('hero');
    expect(HeroComponent.displayName).toBe('Hero Section');
    expect(HeroComponent.category).toBe('layout');
    expect(HeroComponent.props.title).toBeDefined();
    expect(HeroComponent.props.title.type).toBe('string');
    expect(HeroComponent.props.title.required).toBe(true);
  });

  test('AboutComponent should have correct structure', () => {
    expect(AboutComponent.name).toBe('about');
    expect(AboutComponent.displayName).toBe('About Section');
    expect(AboutComponent.category).toBe('content');
    expect(AboutComponent.props.title).toBeDefined();
    expect(AboutComponent.props.layout).toBeDefined();
    expect(AboutComponent.props.layout.type).toBe('select');
  });

  test('Components should render HTML', () => {
    const heroProps = {
      title: 'Test Hero',
      subtitle: 'Test Subtitle',
      backgroundType: 'gradient'
    };
    
    const heroHtml = HeroComponent.render(heroProps);
    expect(typeof heroHtml).toBe('string');
    expect(heroHtml).toContain('Test Hero');
    expect(heroHtml).toContain('Test Subtitle');
  });
});

describe('Utility Functions', () => {
  test('createComponent should generate valid component instances', () => {
    const component = createComponent('hero', { title: 'Test' });
    
    expect(component.id).toBeDefined();
    expect(component.type).toBe('hero');
    expect(component.props.title).toBe('Test');
    expect(component.children).toEqual([]);
  });

  test('createPage should generate valid page instances', () => {
    const page = createPage('test', '/test');
    
    expect(page.name).toBe('test');
    expect(page.path).toBe('/test');
    expect(page.components).toEqual([]);
    expect(page.meta?.title).toBe('test');
  });
});