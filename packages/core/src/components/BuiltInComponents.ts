import { ComponentDefinition } from '../types';

export const HeroComponent: ComponentDefinition = {
  name: 'hero',
  displayName: 'Hero Section',
  category: 'layout',
  props: {
    title: {
      type: 'string',
      default: 'Welcome to Our Website',
      required: true
    },
    subtitle: {
      type: 'string',
      default: 'Create amazing experiences with our website builder'
    },
    backgroundType: {
      type: 'select',
      options: ['image', 'video', 'gradient'],
      default: 'gradient'
    },
    backgroundImage: {
      type: 'string',
      default: ''
    },
    backgroundVideo: {
      type: 'string',
      default: ''
    },
    textAlign: {
      type: 'select',
      options: ['left', 'center', 'right'],
      default: 'center'
    },
    showCTA: {
      type: 'boolean',
      default: true
    },
    ctaText: {
      type: 'string',
      default: 'Get Started'
    },
    ctaLink: {
      type: 'string',
      default: '#'
    }
  },
  render: (props) => {
    const backgroundStyle = props.backgroundType === 'image' && props.backgroundImage
      ? `background-image: url('${props.backgroundImage}'); background-size: cover; background-position: center;`
      : props.backgroundType === 'gradient'
      ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
      : '';

    const videoElement = props.backgroundType === 'video' && props.backgroundVideo
      ? `<video autoplay muted loop style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1;">
           <source src="${props.backgroundVideo}" type="video/mp4">
         </video>`
      : '';

    const ctaButton = props.showCTA
      ? `<a href="${props.ctaLink}" class="hero-cta">${props.ctaText}</a>`
      : '';

    return `
      <section class="hero-section" style="position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; ${backgroundStyle}">
        ${videoElement}
        <div class="hero-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.3); z-index: 1;"></div>
        <div class="hero-content" style="position: relative; z-index: 2; text-align: ${props.textAlign}; color: white; padding: 2rem; max-width: 800px;">
          <h1 class="hero-title" style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            ${props.title}
          </h1>
          ${props.subtitle ? `
            <p class="hero-subtitle" style="font-size: 1.25rem; margin-bottom: 2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
              ${props.subtitle}
            </p>
          ` : ''}
          ${ctaButton}
        </div>
      </section>
      <style>
        .hero-cta {
          display: inline-block;
          padding: 1rem 2rem;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background 0.3s ease;
        }
        .hero-cta:hover {
          background: #2563eb;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem !important;
          }
          .hero-subtitle {
            font-size: 1rem !important;
          }
        }
      </style>
    `;
  }
};

export const AboutComponent: ComponentDefinition = {
  name: 'about',
  displayName: 'About Section',
  category: 'content',
  props: {
    title: {
      type: 'string',
      default: 'About Us',
      required: true
    },
    content: {
      type: 'string',
      default: 'Tell your story here. Share what makes you unique and why visitors should choose you.'
    },
    image: {
      type: 'string',
      default: ''
    },
    layout: {
      type: 'select',
      options: ['image-left', 'image-right', 'centered'],
      default: 'image-left'
    }
  },
  render: (props) => {
    const flexDirection = props.layout === 'image-right' ? 'row-reverse' : 'row';
    const textAlign = props.layout === 'centered' ? 'center' : 'left';
    
    const imageElement = props.image && props.layout !== 'centered'
      ? `<div class="about-image" style="flex: 1; padding: 1rem;">
           <img src="${props.image}" alt="About" style="width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
         </div>`
      : '';

    const centeredImage = props.image && props.layout === 'centered'
      ? `<div class="about-image-centered" style="margin-bottom: 2rem;">
           <img src="${props.image}" alt="About" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; margin: 0 auto; display: block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
         </div>`
      : '';

    return `
      <section class="about-section" style="padding: 4rem 2rem; background: #f8fafc;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          ${props.layout === 'centered' ? `
            <div class="about-content-centered" style="text-align: ${textAlign};">
              <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; color: #1f2937;">${props.title}</h2>
              ${centeredImage}
              <div class="about-text" style="font-size: 1.125rem; line-height: 1.7; color: #4b5563; max-width: 800px; margin: 0 auto;">
                ${props.content.split('\n').map((p: string) => `<p style="margin-bottom: 1rem;">${p}</p>`).join('')}
              </div>
            </div>
          ` : `
            <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 3rem; text-align: center; color: #1f2937;">${props.title}</h2>
            <div class="about-content" style="display: flex; flex-direction: ${flexDirection}; align-items: center; gap: 3rem;">
              ${imageElement}
              <div class="about-text" style="flex: 1; padding: 1rem;">
                <div style="font-size: 1.125rem; line-height: 1.7; color: #4b5563;">
                  ${props.content.split('\n').map((p: string) => `<p style="margin-bottom: 1rem;">${p}</p>`).join('')}
                </div>
              </div>
            </div>
          `}
        </div>
      </section>
      <style>
        @media (max-width: 768px) {
          .about-content {
            flex-direction: column !important;
          }
          .about-section h2 {
            font-size: 2rem !important;
          }
        }
      </style>
    `;
  }
};

export const FeaturesComponent: ComponentDefinition = {
  name: 'features',
  displayName: 'Features Grid',
  category: 'content',
  props: {
    title: {
      type: 'string',
      default: 'Our Features',
      required: true
    },
    subtitle: {
      type: 'string',
      default: 'Discover what makes us unique'
    },
    columns: {
      type: 'number',
      default: 3,
      min: 1,
      max: 4
    },
    features: {
      type: 'array',
      default: [
        { title: 'Fast Performance', description: 'Optimized for speed and efficiency', icon: '⚡' },
        { title: 'Modern Design', description: 'Clean and contemporary aesthetics', icon: '🎨' },
        { title: 'Responsive Layout', description: 'Works perfectly on all devices', icon: '📱' }
      ]
    }
  },
  render: (props) => {
    const features = Array.isArray(props.features) ? props.features : [
      { title: 'Feature 1', description: 'Description', icon: '🔥' },
      { title: 'Feature 2', description: 'Description', icon: '✨' },
      { title: 'Feature 3', description: 'Description', icon: '🚀' }
    ];

    const featuresHtml = features.map(feature => `
      <div class="feature-card" style="background: white; border-radius: 0.75rem; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
        <div class="feature-icon" style="font-size: 3rem; margin-bottom: 1rem;">${feature.icon || '⭐'}</div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">${feature.title}</h3>
        <p style="color: #6b7280; line-height: 1.6;">${feature.description}</p>
      </div>
    `).join('');

    return `
      <section class="features-section" style="padding: 4rem 2rem; background: #f9fafb;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div class="features-header" style="text-align: center; margin-bottom: 3rem;">
            <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">${props.title}</h2>
            ${props.subtitle ? `<p style="font-size: 1.125rem; color: #6b7280; max-width: 600px; margin: 0 auto;">${props.subtitle}</p>` : ''}
          </div>
          <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; max-width: ${props.columns * 300}px; margin: 0 auto;">
            ${featuresHtml}
          </div>
        </div>
      </section>
      <style>
        .feature-card:hover {
          transform: translateY(-4px);
        }
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .features-section h2 {
            font-size: 2rem !important;
          }
        }
      </style>
    `;
  }
};

export const ContactComponent: ComponentDefinition = {
  name: 'contact',
  displayName: 'Contact Section',
  category: 'forms',
  props: {
    title: {
      type: 'string',
      default: 'Get in Touch',
      required: true
    },
    subtitle: {
      type: 'string',
      default: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'
    },
    email: {
      type: 'string',
      default: 'contact@example.com'
    },
    phone: {
      type: 'string',
      default: '+1 (555) 123-4567'
    },
    showForm: {
      type: 'boolean',
      default: true
    },
    showContactInfo: {
      type: 'boolean',
      default: true
    }
  },
  render: (props) => {
    const contactForm = props.showForm ? `
      <div class="contact-form" style="background: white; border-radius: 0.75rem; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <form id="contact-form">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Name</label>
            <input type="text" name="name" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Email</label>
            <input type="email" name="email" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Message</label>
            <textarea name="message" rows="4" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; resize: vertical;"></textarea>
          </div>
          <button type="submit" style="width: 100%; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-weight: 600; cursor: pointer; transition: background 0.3s ease;">
            Send Message
          </button>
        </form>
      </div>
    ` : '';

    const contactInfo = props.showContactInfo ? `
      <div class="contact-info" style="background: #1f2937; color: white; border-radius: 0.75rem; padding: 2rem;">
        <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem;">Contact Information</h3>
        <div class="contact-details">
          ${props.email ? `
            <div style="margin-bottom: 1rem; display: flex; align-items: center;">
              <span style="margin-right: 0.75rem;">📧</span>
              <a href="mailto:${props.email}" style="color: #93c5fd; text-decoration: none;">${props.email}</a>
            </div>
          ` : ''}
          ${props.phone ? `
            <div style="margin-bottom: 1rem; display: flex; align-items: center;">
              <span style="margin-right: 0.75rem;">📞</span>
              <a href="tel:${props.phone}" style="color: #93c5fd; text-decoration: none;">${props.phone}</a>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    return `
      <section class="contact-section" style="padding: 4rem 2rem; background: #f3f4f6;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div class="contact-header" style="text-align: center; margin-bottom: 3rem;">
            <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">${props.title}</h2>
            ${props.subtitle ? `<p style="font-size: 1.125rem; color: #6b7280; max-width: 600px; margin: 0 auto;">${props.subtitle}</p>` : ''}
          </div>
          <div class="contact-content" style="display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 800px; margin: 0 auto;">
            ${props.showForm && props.showContactInfo ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                ${contactForm}
                ${contactInfo}
              </div>
            ` : `
              ${contactForm}
              ${contactInfo}
            `}
          </div>
        </div>
      </section>
      <style>
        #contact-form button:hover {
          background: #2563eb;
        }
        #contact-form input:focus,
        #contact-form textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        @media (max-width: 768px) {
          .contact-content > div {
            grid-template-columns: 1fr !important;
          }
          .contact-section h2 {
            font-size: 2rem !important;
          }
        }
      </style>
      <script>
        document.getElementById('contact-form')?.addEventListener('submit', function(e) {
          e.preventDefault();
          alert('Thank you for your message! We will get back to you soon.');
          this.reset();
        });
      </script>
    `;
  }
};