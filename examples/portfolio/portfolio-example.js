import { 
  MiloBuilder, 
  HeroComponent, 
  AboutComponent, 
  FeaturesComponent, 
  ContactComponent,
  createComponent, 
  createPage 
} from '@milo/core';

// Create builder instance
const builder = new MiloBuilder({
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981'
    },
    fonts: {
      heading: 'Inter',
      body: 'system-ui'
    }
  }
});

// Register components
builder.registerComponent(HeroComponent);
builder.registerComponent(AboutComponent);
builder.registerComponent(FeaturesComponent);
builder.registerComponent(ContactComponent);

// Create homepage sections
const heroSection = createComponent('hero', {
  title: 'Creative Professional',
  subtitle: 'Photographer & Visual Artist specializing in stunning imagery and creative direction',
  backgroundType: 'gradient',
  showCTA: true,
  ctaText: 'View Portfolio',
  ctaLink: '#portfolio'
});

const aboutSection = createComponent('about', {
  title: 'About Me',
  content: `I'm a passionate visual artist with over 5 years of experience in photography and creative direction. 
  
  My work spans across portrait photography, commercial projects, and artistic collaborations. I believe in capturing authentic moments and creating images that tell compelling stories.
  
  When I'm not behind the camera, you can find me exploring new techniques, traveling to unique locations, or collaborating with other creative professionals.`,
  layout: 'centered'
});

const servicesSection = createComponent('features', {
  title: 'Services',
  subtitle: 'Professional photography and creative services',
  columns: 3,
  features: [
    {
      title: 'Portrait Photography',
      description: 'Professional headshots and personal branding photography that captures your unique personality.',
      icon: '📸'
    },
    {
      title: 'Commercial Projects',
      description: 'High-quality commercial photography for businesses, products, and marketing campaigns.',
      icon: '💼'
    },
    {
      title: 'Creative Direction',
      description: 'Art direction and creative consulting for visual projects and brand development.',
      icon: '🎨'
    },
    {
      title: 'Event Photography',
      description: 'Capturing special moments and milestones with a documentary-style approach.',
      icon: '🎉'
    },
    {
      title: 'Digital Retouching',
      description: 'Professional photo editing and retouching services to perfect your images.',
      icon: '✨'
    },
    {
      title: 'Workshops',
      description: 'Photography workshops and mentoring for aspiring photographers.',
      icon: '🎓'
    }
  ]
});

const contactSection = createComponent('contact', {
  title: 'Let\'s Work Together',
  subtitle: 'Ready to create something amazing? Get in touch to discuss your project.',
  email: 'hello@creativeportfolio.com',
  phone: '+1 (555) 123-4567',
  showForm: true,
  showContactInfo: true
});

// Create the homepage
const homePage = createPage('Home', '/', [
  heroSection, 
  aboutSection, 
  servicesSection, 
  contactSection
]);

// Add page to builder
builder.addPage(homePage);

// Build the site
async function buildPortfolio() {
  console.log('Building portfolio website...');
  
  const result = await builder.build();
  
  if (result.success) {
    console.log('✅ Portfolio built successfully!');
    console.log(`📄 Generated ${result.pages.length} page(s)`);
    
    // Output the generated HTML for preview
    result.pages.forEach(page => {
      console.log(`\n📁 Page: ${page.path}`);
      console.log(`📏 HTML size: ${page.html.length} characters`);
      console.log(`🎨 CSS size: ${page.css.length} characters`);
    });
    
    // In a real implementation, you would write these files to disk
    // For demo purposes, we just log the success
    console.log('\n🚀 Portfolio website ready to deploy!');
  } else {
    console.error('❌ Build failed:');
    result.errors?.forEach(error => console.error(`  - ${error}`));
  }
}

// Run the build
buildPortfolio().catch(console.error);