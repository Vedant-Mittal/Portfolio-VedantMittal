# Investel - Investment Platform

## Project Overview
This is a React-based investment platform application called "Investel" built with modern web technologies. The application appears to be focused on investment education and market analysis, with user authentication and content management features.

## Current State
- **Status**: Successfully imported and configured for Replit environment
- **Frontend**: Running on port 5000 with proper host configuration
- **Backend**: Uses Supabase for authentication and data storage
- **Database**: PostgreSQL via Supabase integration

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure
```
├── api/                 # Serverless functions (Vercel API routes)
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   └── admin/     # Admin-specific components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # External service integrations
│   ├── lib/           # Utility functions
│   └── data/          # Static data files
├── supabase/          # Database migrations and config
└── ...config files
```

## Key Features
- User authentication system
- Coming soon landing page
- Course management system
- Admin interface
- Video content integration
- Responsive design with dark/light mode support

## Environment Configuration
- **Development Server**: Configured for Replit environment
  - Host: 0.0.0.0:5000
  - Allowed hosts: All (for iframe proxy support)
- **Supabase Integration**: Pre-configured with client setup
  - Storage bucket name: "storage" (for image uploads in portfolio editor)
- **TypeScript**: Fully typed with proper configurations

## Recent Changes
- **2025-10-04** (Latest):
  - **Security Enhancement: Moved Credentials to Environment Variables**
    - Removed all hardcoded API keys and credentials from source code
    - Updated `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from environment variables
    - Updated `src/pages/Portfolio.tsx` to use `VITE_WEB3FORMS_ACCESS_KEY` from environment variables
    - Created `.gitignore` to prevent accidental exposure of sensitive files
    - Created `.env.example` as a template for required environment variables
    - All environment variables now securely managed via Replit Secrets
    - Added proper error handling when environment variables are missing
    - **For Vercel Deployment**: Add the same environment variables in Vercel dashboard under Project Settings → Environment Variables

- **2025-10-03**:
  - **Fixed Mobile UX Issues on Portfolio Page**
    - Fixed icon and text vertical alignment issues on mobile across all sections
      - Made icon containers responsive (h-8 w-8 on mobile, h-9 w-9 on desktop)
      - Made icons themselves responsive to match text size at each breakpoint
      - Added `leading-none` to headings to remove extra line height
      - Added `flex-shrink-0` to icon containers to prevent shrinking
      - Reduced gap from 3 to 2 on mobile for better spacing
      - Applied consistently to: AI Design section, My Visual Work section, and No-Code Projects section
    - Fixed swipe navigation for galleries on mobile devices
      - Implemented improved touch event handling with `__isDragging` flag
      - Only prevents default scroll when user is actively swiping horizontally
      - Detects horizontal intent when deltaX > deltaY and > 5px
      - Maintains 50px threshold for triggering navigation
      - Fixed both My Visual Work gallery and AI Designs slider
      - Now properly allows vertical page scrolling while capturing horizontal swipes for navigation
    - Removed Brain icon from AI Generated section heading on mobile for cleaner look
    - Made "Human-Directed" text wrap to next line on mobile in AI Generated heading for better readability

- **2025-10-01**:
  - **Web3Forms Contact Form Integration**
    - Integrated Web3Forms API into portfolio page contact form
    - Added form submission with async/await handling
    - Implemented loading state with "Sending..." button text
    - Added proper error handling with toast notifications
    - Made all form fields required (name, email, message)
    - Added data-testid attributes for testing
    - **Known Issue**: Web3Forms blocks submissions from Replit development domains by default
      - Error: "Form submissions from this domain TLD is blocked by default"
      - **Solution**: Contact Web3Forms support to allow *.replit.dev domains OR deploy to production with custom domain
      - Form will work correctly once deployed or after domain whitelisting
  - **Enhanced Portfolio Page Visual Design**
    - Reduced hero section overlay opacity from 60% to 40% for better background visibility
    - Added floating decorative elements (animated gradient orbs) throughout the page for visual interest
    - Completely redesigned the "Websites Built" section with premium UI enhancements:
      - Added gradient background glow effects on card hover
      - Implemented shine animation sweep effect on website screenshots
      - Enhanced cards with backdrop blur and improved shadows
      - Added gradient buttons with smooth hover transitions
      - Implemented corner accent dots that appear on hover
      - Added smooth lift animation (-translate-y-2) on card hover
      - Improved section header with centered layout and descriptive subtitle
      - Added staggered animation delays for cards as they enter viewport
      - Enhanced tech stack badges with gradient styling
    - All animations use Framer Motion for smooth, performant transitions
    - Floating elements are non-interactive (pointer-events-none) to avoid blocking content
    
- **2025-09-30**: 
  - **Fixed Design Gallery Editor file type handling and PDF upload support**
    - Carousel designs now ONLY accept PDF files (strict validation enforced)
    - Single image designs now ONLY accept image files (strict validation enforced)
    - Added file type validation in upload handler to prevent incorrect file types
    - Implemented PDF rendering in DesignsGallery component using <object> tag
    - Added PDF preview icon in the editor for uploaded PDF files
    - Added clear error messages when wrong file type is selected
    - Fixed PDF upload to Supabase storage bucket
    
  - Enhanced Design Gallery editor file upload options
    - Carousel designs now support both image and PDF uploads
    - Single image designs accept image files only
    - Updated UI labels and buttons to clearly indicate supported file types
  - Fixed hover animation issues in "Websites Built" section of Portfolio page
    - Removed grid-span change on hover that was causing continuous animation loops
    - Changed from fixed heights to aspect-video class to maintain 16:9 (1920/1080) aspect ratio
    - Optimized transitions from 500ms to 300ms for smoother animations
    - Simplified hover scale effects to prevent conflicts
  - Fixed Supabase storage bucket configuration for image uploads
  - Updated all storage bucket references from 'portfolio' to 'storage' to match existing Supabase setup
  - Updated PortfolioEditor to correctly use the 'storage' bucket for image uploads
  - Fixed error messages and UI guidance to reference the correct bucket name
  
- **2025-09-27**: 
  - Imported from GitHub repository
  - Configured Vite server for Replit environment (port 5000, host 0.0.0.0)
  - Set up workflow for development server
  - Configured deployment settings for autoscale deployment
  - Verified application runs successfully

## User Preferences
- No specific preferences recorded yet

## Project Architecture
- **Frontend-focused**: Most logic in React components
- **Supabase Backend**: Authentication and data persistence
- **Component Library**: Extensive use of shadcn/ui for consistent UI
- **Type Safety**: Full TypeScript implementation
- **Modern React Patterns**: Hooks, functional components, React Query for data fetching