# Milo Presedo Portfolio

A modern, responsive portfolio website for showcasing film production and photography work. Built with Next.js, Supabase, and Clerk authentication.

![Portfolio Preview](/public/images/portfolio-preview.jpg)

## 🚀 Features

- **Project Showcase**: Display film, photography, and production projects with detailed pages
- **Media Management**: Unified media library for images and videos
- **Admin Dashboard**: Secure admin area for content management
- **Authentication**: User authentication with role-based access control
- **Responsive Design**: Optimized for all devices with a custom cursor
- **Dynamic Content**: All site content is editable through the admin interface
- **Custom Favicons**: Upload and manage custom favicons

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Vercel

## 📋 Project Structure

\`\`\`
milo-portfolio/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── projects/           # Project pages
│   ├── setup/              # Setup page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── admin/              # Admin-specific components
│   ├── ui/                 # UI components (shadcn)
│   └── ...                 # Other components
├── lib/                    # Utility functions
│   ├── supabase-browser.ts # Browser Supabase client
│   ├── supabase-server.ts  # Server Supabase client
│   ├── supabase.ts         # Compatibility layer
│   └── ...                 # Other utilities
├── public/                 # Static assets
│   └── images/             # Default images
├── setup/                  # Database setup SQL files
└── ...                     # Config files
\`\`\`

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Site URL
NEXT_PUBLIC_SITE_URL=your_site_url
\`\`\`

### Installation

1. Clone the repository
   \`\`\`bash
   git clone https://github.com/yourusername/milo-portfolio.git
   cd milo-portfolio
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Initial Setup

1. Visit `/setup` to initialize the database and storage
2. Create an admin user at `/admin/bootstrap` using the bootstrap secret
3. Log in and start managing your content

## 🔄 Development Workflow

### Adding New Features

1. Create a new branch for your feature
2. Implement your changes
3. Test thoroughly
4. Create a pull request

### Database Changes

All database changes should be made through SQL files in the `setup/` directory and corresponding API routes in `app/api/`.

## 📱 Key Components

### Media Library

The unified media library (`components/admin/unified-media-library.tsx`) provides a central place to manage all media assets. It supports:

- Image uploads
- Vimeo video integration
- Tagging and filtering
- Usage tracking

### Project Management

Projects are managed through the admin interface with:

- Project creation and editing
- Behind-the-scenes (BTS) image management
- Category and role filtering

### Site Settings

All site content is editable through the admin interface:

- Hero section
- About section
- Services section
- Contact information
- Custom favicons

## 🔒 Authentication and Authorization

The site uses Clerk for authentication with custom role-based access control:

- **Public**: Anyone can view the portfolio
- **Admin**: Can manage all content
- **Editor**: Can edit projects but not users

## 🚀 Deployment

The site is deployed on Vercel. To deploy your own instance:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the environment variables
4. Deploy

## 🧩 Extending the Site

### Adding New Project Types

1. Update the project type options in `components/admin/project-form.tsx`
2. Add corresponding filtering in `app/projects/page.tsx`

### Adding New Sections

1. Create a new component in the `components/` directory
2. Add the component to `app/page.tsx`
3. Add corresponding settings in `components/admin/site-information-form.tsx`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

### Now, let's clean up the Supabase client files for better organization:
