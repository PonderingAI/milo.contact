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
                ${props.content.split('\n').map(p => `<p style="margin-bottom: 1rem;">${p}</p>`).join('')}
              </div>
            </div>
          ` : `
            <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 3rem; text-align: center; color: #1f2937;">${props.title}</h2>
            <div class="about-content" style="display: flex; flex-direction: ${flexDirection}; align-items: center; gap: 3rem;">
              ${imageElement}
              <div class="about-text" style="flex: 1; padding: 1rem;">
                <div style="font-size: 1.125rem; line-height: 1.7; color: #4b5563;">
                  ${props.content.split('\n').map(p => `<p style="margin-bottom: 1rem;">${p}</p>`).join('')}
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