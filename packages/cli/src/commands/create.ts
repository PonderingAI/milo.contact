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
import { MiloBuilder, HeroComponent, AboutComponent, createComponent, createPage } from '@milo/core';

const builder = new MiloBuilder();

// Register components
builder.registerComponent(HeroComponent);
builder.registerComponent(AboutComponent);

// Create a home page
const heroSection = createComponent('hero', {
  title: 'Welcome to ${projectName}',
  subtitle: 'Built with Milo Website Builder',
  backgroundType: 'gradient'
});

const aboutSection = createComponent('about', {
  title: 'About Us',
  content: 'This is a sample website built with Milo.',
  layout: 'centered'
});

const homePage = createPage('home', '/', [heroSection, aboutSection]);
builder.addPage(homePage);

// Build the site
builder.build().then(result => {
  if (result.success) {
    console.log('Site built successfully!');
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