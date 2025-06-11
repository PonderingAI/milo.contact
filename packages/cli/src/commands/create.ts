import fs from 'fs';
import path from 'path';

export async function createCommand(projectName: string, options: any) {
  console.log(`Creating new Milo project: ${projectName}`);
  console.log(`Using template: ${options.template}`);

  const projectDir = path.resolve(projectName);
  
  // Create project directory
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Create basic project structure
  const directories = ['src', 'public', 'components'];
  directories.forEach(dir => {
    fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
  });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `A Milo website project`,
    scripts: {
      dev: 'milo dev',
      build: 'milo build'
    },
    dependencies: {
      '@milo/core': '^0.1.0'
    }
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create basic milo.config.js
  const config = `
export default {
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981'
    }
  },
  plugins: [],
  build: {
    output: 'dist'
  }
};
`;

  fs.writeFileSync(path.join(projectDir, 'milo.config.js'), config);

  // Create basic index.js
  const indexContent = `
import { MiloBuilder, HeroComponent, AboutComponent, FeaturesComponent, ContactComponent, createComponent, createPage } from '@milo/core';

const builder = new MiloBuilder();

// Register components
builder.registerComponent(HeroComponent);
builder.registerComponent(AboutComponent);
builder.registerComponent(FeaturesComponent);
builder.registerComponent(ContactComponent);

// Create a home page
const heroSection = createComponent('hero', {
  title: 'Welcome to ${projectName}',
  subtitle: 'Built with Milo Website Builder',
  backgroundType: 'gradient'
});

const featuresSection = createComponent('features', {
  title: 'Why Choose Us',
  subtitle: 'Discover what makes us special',
  features: [
    { title: 'Easy to Use', description: 'Simple and intuitive interface', icon: '🚀' },
    { title: 'Fast Performance', description: 'Optimized for speed and efficiency', icon: '⚡' },
    { title: 'Responsive Design', description: 'Looks great on all devices', icon: '📱' }
  ]
});

const aboutSection = createComponent('about', {
  title: 'About Us',
  content: 'We are passionate about creating amazing web experiences using modern technology and thoughtful design.',
  layout: 'centered'
});

const contactSection = createComponent('contact', {
  title: 'Get in Touch',
  subtitle: 'Have a question or want to work together? We\\'d love to hear from you.',
  email: 'hello@${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com',
  phone: '+1 (555) 123-4567'
});

const homePage = createPage('home', '/', [heroSection, featuresSection, aboutSection, contactSection]);
builder.addPage(homePage);

// Build the site
builder.build().then(result => {
  if (result.success) {
    console.log('Site built successfully!');
    console.log('Pages:', result.pages.map(p => p.path));
  } else {
    console.error('Build failed:', result.errors);
  }
});
`;

  fs.writeFileSync(path.join(projectDir, 'src', 'index.js'), indexContent);

  console.log(`✅ Created ${projectName} successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  milo dev`);
}