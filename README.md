# Vedant Mittal Portfolio - Technical Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture & File Structure](#architecture--file-structure)
- [Key Features](#key-features)
- [Pages & Routing](#pages--routing)
- [Database Schema](#database-schema)
- [Components Architecture](#components-architecture)
- [Styling & Theming](#styling--theming)
- [Environment Setup](#environment-setup)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)

---

## 🎯 Project Overview

This is a modern, full-stack portfolio and educational platform built for Vedant Mittal. The application serves as both a personal portfolio showcasing design work and websites, and an educational platform featuring investment courses and finance content.

**Primary Features:**
- Personal portfolio with design galleries and project showcases
- Educational course platform with video lectures
- Blog integration with Substack
- Admin panel for content management
- User authentication system
- YouTube video integration
- Contact form with Web3Forms integration

---

## 🛠 Technology Stack

### **Frontend Core**
- **React 18** - UI library with hooks and modern features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM v6** - Client-side routing

### **UI Framework & Styling**
- **shadcn/ui** - Re-usable component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **Lucide React** - Icon library

### **State Management & Data Fetching**
- **TanStack Query (React Query v5)** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (OTP-based email auth)
  - Storage (image/file uploads)
  - Row Level Security (RLS)

### **Serverless Functions**
- **Vercel Serverless Functions** - API routes for YouTube data fetching

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **Sharp** - Image optimization

---

## 📁 Architecture & File Structure

```
investel-platform/
│
├── api/                          # Serverless API routes (Vercel)
│   └── latest-videos.ts         # YouTube video fetcher (no API key required)
│
├── public/                       # Static assets
│   ├── logo.png
│   ├── og-image.png
│   └── [images, fonts, etc.]
│
├── src/
│   ├── assets/                   # Image assets (optimized .webp versions)
│   │   ├── finance-hero-bg.webp
│   │   ├── profile.webp
│   │   └── trading-chart-bg.webp
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (50+ reusable UI components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── [all shadcn components]
│   │   │
│   │   ├── admin/                # Admin-specific components
│   │   │   ├── CourseEditor.tsx  # Course CRUD interface
│   │   │   ├── LectureManager.tsx # Lecture CRUD interface
│   │   │   └── PortfolioEditor.tsx # Portfolio content editor
│   │   │
│   │   ├── About.tsx             # About section component
│   │   ├── Articles.tsx          # Substack blog integration
│   │   ├── CanonicalUpdater.tsx  # SEO canonical URL manager
│   │   ├── Contact.tsx           # Contact form component
│   │   ├── Courses.tsx           # Course listing component
│   │   ├── DesignsGallery.tsx    # Design portfolio gallery
│   │   ├── DomeGallery.tsx       # Dome-shaped gallery layout
│   │   ├── Footer.tsx            # Main footer
│   │   ├── Hero.tsx              # Hero section
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── PortfolioFooter.tsx   # Portfolio-specific footer
│   │   └── Videos.tsx            # YouTube video grid
│   │
│   ├── data/
│   │   └── courseData.js         # Static course data
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   ├── use-toast.ts          # Toast notification hook
│   │   ├── useAuth.tsx           # Authentication hook & context
│   │   ├── useCourses.tsx        # Course data fetching hook
│   │   ├── useCoursesWithCache.tsx # Cached course fetching
│   │   └── useLatestVideos.tsx   # YouTube video fetching hook
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client initialization
│   │       └── types.ts          # Auto-generated TypeScript types from DB
│   │
│   ├── lib/
│   │   └── utils.ts              # Utility functions (cn, etc.)
│   │
│   ├── pages/                    # Route-level page components
│   │   ├── AdminPage.tsx         # Admin dashboard
│   │   ├── AdminPortfolio.tsx    # Portfolio editor page
│   │   ├── AuthPage.tsx          # Login/signup with OTP
│   │   ├── CoursePage.tsx        # Individual course view (removed from app)
│   │   ├── Index.tsx             # Original home page (removed from app)
│   │   ├── NotFound.tsx          # 404 page
│   │   └── Portfolio.tsx         # Main portfolio page (1000+ lines)
│   │
│   ├── App.tsx                   # Main app component with routing
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global styles & CSS variables
│   └── vite-env.d.ts            # Vite TypeScript definitions
│
├── supabase/
│   ├── migrations/               # Database migration files
│   │   ├── [timestamp]_*.sql    # SQL migration scripts
│   │   └── [9 migration files]
│   └── config.toml              # Supabase configuration
│
├── scripts/
│   └── convert-to-webp.mjs      # Image optimization script
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── eslint.config.js             # ESLint configuration
├── index.html                    # HTML entry point with SEO meta tags
├── package.json                  # Dependencies & scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vercel.json                  # Vercel deployment config
├── vite.config.ts               # Vite build configuration
└── README.md                    # This file
```

---

## 🌟 Key Features

### **1. Portfolio Showcase**
- **Design Gallery**: Displays visual design work with single images and multi-image carousels
- **Website Projects**: Grid of built websites with screenshots, descriptions, and tech stacks
- **AI-Generated Designs**: Separate section for AI-assisted creative work
- **Smooth Animations**: Framer Motion for parallax effects, scroll-triggered animations, and hover states

### **2. Educational Platform**
- **Course Management**: Full CRUD for courses and lectures
- **Video Integration**: YouTube video embedding and latest video fetching
- **User Progress Tracking**: Database-backed progress monitoring
- **Content Sections**: Dynamic content management system

### **3. Authentication System**
- **OTP-based Email Auth**: Passwordless login via Supabase
- **Role-based Access Control**: Admin, editor, and viewer roles
- **Protected Routes**: Admin pages require authentication
- **Session Management**: Persistent sessions with auto-refresh

### **4. Admin Panel**
- **Course Editor**: Create/edit courses, lectures, and chapters
- **Portfolio Editor**: Manage design gallery and website showcases
- **Media Library**: Image upload to Supabase Storage
- **Content Sections**: Dynamic page content editing

### **5. Integrations**
- **Supabase Storage**: Image and file uploads with public URLs
- **Web3Forms**: Contact form submissions
- **RSS2JSON**: Substack blog integration
- **YouTube RSS**: Video fetching without API key requirements

---

## 🛣 Pages & Routing

The application uses **React Router v6** for client-side routing:

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/` | Portfolio | Main portfolio landing page | No |
| `/portfolio` | Portfolio | Alternative portfolio route | No |
| `/course/:courseId` | CoursePage | Individual course view with lectures | Removed |
| `/admin` | AdminPage | Admin dashboard for content management | Yes |
| `/admin/portfolio` | AdminPortfolio | Portfolio content editor | Yes |
| `/auth` | AuthPage | Login/signup with OTP verification | No |
| `/*` | NotFound | 404 error page | No |

### **Route Implementation Details**

**App.tsx Structure:**
```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <BrowserRouter>
        <CanonicalUpdater />
        <Routes>
          <Route path="/" element={<Portfolio />} />
          {/* Course routes removed */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/portfolio" element={<AdminPortfolio />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

---

## 🗄 Database Schema

The application uses **Supabase PostgreSQL** with the following tables:

### **Core Tables**

#### **1. profiles**
User profile information linked to Supabase auth users.
```sql
- id: uuid (references auth.users)
- email: text
- full_name: text
- avatar_url: text
- created_at: timestamp
```

#### **2. user_roles**
Role-based access control.
```sql
- id: uuid
- user_id: uuid (references profiles)
- role: app_role (enum: admin, editor, viewer)
- created_at: timestamp
```

#### **3. courses**
Educational course content.
```sql
- id: uuid
- title: text
- description: text
- instructor_name: text
- instructor_bio: text
- thumbnail_url: text
- category: text
- level: text (Beginner, Intermediate, Advanced)
- duration_hours: integer
- is_published: boolean
- created_at: timestamp
```

#### **4. lectures**
Individual lecture content within courses.
```sql
- id: uuid
- course_id: uuid (references courses)
- chapter_title: text
- title: text
- youtube_video_id: text
- order_index: integer
- duration_minutes: integer
- created_at: timestamp
```

#### **5. user_progress**
Track user course completion.
```sql
- id: uuid
- user_id: uuid (references profiles)
- course_id: uuid (references courses)
- lecture_id: uuid (references lectures)
- completed: boolean
- last_position: integer
- created_at: timestamp
- updated_at: timestamp
```

#### **6. content_sections**
Dynamic page content management.
```sql
- id: uuid
- page_path: text
- section_identifier: text
- name: text
- content: jsonb
- content_type_id: uuid (references content_types)
- is_active: boolean
- created_at: timestamp
```

#### **7. content_types**
Schema definitions for content sections.
```sql
- id: uuid
- name: text
- schema: jsonb
- description: text
```

### **Supporting Tables**
- **posts**: Blog posts content
- **categories**: Content categorization
- **media_library**: Media asset management
- **templates**: Reusable content templates

### **Database Functions**
- `has_role(role_name)`: Check if current user has specific role
- `is_admin()`: Check if current user is admin

### **Row Level Security (RLS)**
All tables have RLS policies:
- **Public read access** for published content
- **Authenticated write access** for content creation
- **Admin-only access** for sensitive operations

---

## 🧩 Components Architecture

### **Component Hierarchy**

#### **1. Layout Components**
- **Navbar**: Responsive navigation with mobile menu
- **Footer/PortfolioFooter**: Site-wide footers
- **CanonicalUpdater**: Dynamic SEO canonical URLs

#### **2. Feature Components**

**Portfolio Components:**
- **DesignsGallery**: Multi-category design showcase
- **DomeGallery**: Dome-shaped visual layout
- **About**: Personal bio and skills section
- **Contact**: Web3Forms integration

**Education Components:**
- **Courses**: Course grid with filtering
- **Videos**: YouTube video grid with latest videos API
- **Articles**: Substack blog integration via RSS

**Admin Components:**
- **CourseEditor**: Full course CRUD with form validation
- **LectureManager**: Lecture management with chapter organization
- **PortfolioEditor**: Gallery and website project editor

#### **3. UI Components (shadcn/ui)**

50+ reusable components including:
- **Forms**: Input, Textarea, Select, Checkbox, Radio, etc.
- **Feedback**: Toast, Alert, Dialog, Sheet
- **Navigation**: Tabs, Accordion, Breadcrumb, Menubar
- **Display**: Card, Badge, Avatar, Separator
- **Overlays**: Dialog, Popover, Tooltip, Drawer
- **Data**: Table, Carousel, Pagination

### **State Management Patterns**

**1. Server State (TanStack Query)**
```tsx
// Example: Fetching courses
const { data: courses, isLoading } = useQuery({
  queryKey: ['/api/courses'],
  // Default fetcher configured globally
});
```

**2. Form State (React Hook Form + Zod)**
```tsx
// Example: Course form with validation
const form = useForm({
  resolver: zodResolver(courseSchema),
  defaultValues: { title: '', description: '' }
});
```

**3. Global State (React Context)**
```tsx
// Authentication context
const { user, session, signOut } = useAuth();
```

---

## 🎨 Styling & Theming

### **Tailwind CSS Configuration**

**Custom Theme Extensions:**
- **Colors**: HSL-based design tokens for dark mode support
- **Animations**: Custom keyframes (slide-up, scale-in, glow-pulse)
- **Container**: Centered container with responsive padding
- **Border Radius**: Consistent radius variables

**Color System:**
```css
:root {
  --primary: [HSL value]
  --secondary: [HSL value]
  --accent: [HSL value]
  --destructive: [HSL value]
  --muted: [HSL value]
  --border: [HSL value]
  /* ... more tokens */
}
```

### **Animation System**

**Framer Motion Patterns:**
1. **Scroll-triggered animations** with `whileInView`
2. **Parallax effects** using `useScroll` and `useTransform`
3. **Hover states** with `whileHover` and `whileTap`
4. **Page transitions** with `AnimatePresence`

**Example:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### **Responsive Design**

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- 2XL: > 1400px

**Mobile-First Approach:**
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

---

## 🔧 Environment Setup

### **Required Environment Variables**

Create a `.env` file based on `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Web3Forms Configuration
VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_access_key

# Blog URL (Optional)
VITE_BLOG_URL=https://investel.substack.com/
```

### **Getting API Keys**

**1. Supabase Setup:**
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Get URL and anon key from Settings > API
- Run database migrations from `/supabase/migrations`

**2. Web3Forms Setup:**
- Go to [web3forms.com](https://web3forms.com)
- Sign up and get your access key
- Add to environment variables

**3. Supabase Storage Setup:**
- Create a storage bucket named "storage"
- Set it to public
- Configure RLS policies (see `SUPABASE_STORAGE_SETUP.md`)

---

## 💻 Development Guide

### **Installation**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Convert images to WebP
npm run images:webp
```

### **Development Server**

The Vite dev server runs on:
- **Host**: 0.0.0.0 (accessible from network)
- **Port**: 5000
- **Allowed Hosts**: All (for Replit iframe proxy support)

### **Project Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| dev | `vite` | Start dev server on port 5000 |
| build | `vite build` | Production build to `/dist` |
| build:dev | `vite build --mode development` | Dev mode build |
| preview | `vite preview` | Preview production build |
| lint | `eslint .` | Lint TypeScript/React code |
| images:webp | `node scripts/convert-to-webp.mjs` | Optimize images to WebP |

### **Code Organization Best Practices**

1. **Component Files**: One component per file
2. **Type Definitions**: Co-located with components
3. **Hooks**: Custom hooks in `/hooks` directory
4. **Utils**: Utility functions in `/lib/utils.ts`
5. **Styles**: Tailwind classes, no CSS modules
6. **Assets**: WebP optimized images in `/src/assets`

---

## 🚀 Deployment

### **Vercel Deployment (Recommended)**

**Method 1: GitHub Integration**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [your-repo-url]
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

3. **Configure Build Settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`
   - Apply to Production, Preview, and Development

5. **Deploy:**
   - Click "Deploy"
   - Get live URL: `https://[project-name].vercel.app`

**Method 2: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### **Build Configuration**

**vite.config.ts:**
```ts
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### **Post-Deployment Checklist**

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Check Supabase Storage bucket permissions
- [ ] Verify API routes work (`/api/latest-videos`)
- [ ] Test contact form submission
- [ ] Validate SEO meta tags and Open Graph
- [ ] Test on mobile devices
- [ ] Check browser console for errors

---

## 🔒 Security Considerations

### **Environment Variables**

⚠️ **IMPORTANT**: Variables prefixed with `VITE_` are **exposed to the client-side bundle**.

**Current Exposure:**
- ✅ `VITE_SUPABASE_URL` - Safe (public)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` - Safe (public)
- ⚠️ `VITE_WEB3FORMS_ACCESS_KEY` - **Exposed** (consider backend proxy)

### **Security Best Practices**

1. **Row Level Security (RLS)**:
   - All Supabase tables have RLS enabled
   - Policies enforce authenticated/admin access

2. **Authentication**:
   - OTP-based email authentication (no passwords)
   - JWT tokens with auto-refresh
   - Session persistence in localStorage

3. **API Protection**:
   - CORS headers configured in serverless functions
   - No sensitive data in client-side code

4. **Input Validation**:
   - Zod schema validation on all forms
   - React Hook Form client-side validation
   - Supabase server-side validation

5. **File Uploads**:
   - Restricted to authenticated users
   - File type validation (images only)
   - Size limits enforced

### **Recommended Improvements**

1. **Move Web3Forms to Backend**: Create an API route to proxy form submissions
2. **Add Rate Limiting**: Prevent API abuse on contact form
3. **Implement CSRF Tokens**: For form submissions
4. **Use Content Security Policy**: Add CSP headers

---

## 📝 Key Implementation Details

### **1. YouTube Integration (No API Key)**

The `/api/latest-videos.ts` serverless function fetches YouTube videos without requiring an API key:

**How it works:**
1. Fetches YouTube channel HTML to extract channel ID
2. Accesses YouTube RSS feed: `https://www.youtube.com/feeds/videos.xml?channel_id=[ID]`
3. Parses XML to extract video metadata
4. Returns latest 3 videos with thumbnails

### **2. Image Optimization**

**WebP Conversion:**
- Script: `/scripts/convert-to-webp.mjs`
- Uses Sharp library for optimization
- Automatically generates `.webp` versions
- Fallback to original format on error

**Usage:**
```tsx
const toWebpUrl = (url: string) => 
  url.replace(/\.(png|jpe?g)(\?.*)?$/i, '.webp');
```

### **3. Form Handling Pattern**

All forms use:
1. **React Hook Form** for state management
2. **Zod** for schema validation
3. **zodResolver** to connect them
4. **Toast notifications** for feedback

**Example:**
```tsx
const form = useForm({
  resolver: zodResolver(insertCourseSchema),
  defaultValues: { title: '', description: '' }
});

const onSubmit = async (data) => {
  // TanStack Query mutation
  await mutation.mutateAsync(data);
};
```

### **4. Protected Routes**

Admin routes check authentication:
```tsx
const { user, session } = useAuth();

useEffect(() => {
  if (!session) {
    navigate('/auth');
  }
}, [session]);
```

### **5. Supabase Storage Integration**

**Upload Pattern:**
```tsx
const uploadImage = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('storage')
    .upload(fileName, file);
    
  const { data: { publicUrl } } = supabase.storage
    .from('storage')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
```

---

## 📚 Additional Resources

- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **React Documentation**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **TanStack Query**: [tanstack.com/query](https://tanstack.com/query)
- **Framer Motion**: [framer.com/motion](https://www.framer.com/motion)

---

## 🤝 Contributing

This is a personal portfolio project. For questions or suggestions:
- Review the codebase structure outlined above
- Check `/replit.md` for project-specific notes
- Refer to migration files in `/supabase/migrations` for database schema

---

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ using React, TypeScript, Vite, and Supabase**

---

## 📦 Static Media Migration (Supabase Storage ➜ Git/Vercel)

To reduce Supabase egress, you can serve images from this repo via Vercel's CDN. This project includes scripts to export files from Supabase Storage into `public/media` and update database content to use site-relative paths.

### 1) Prerequisites
- Environment variables (locally):
  - `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
  - `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`
  - Optional: `SUPABASE_BUCKET` (default `storage`)
  - Optional: `EXPORT_FOLDERS` comma-separated (default `designs,ai-designs,websites`)

Set them before running scripts, for example:

```bash
export SUPABASE_URL=YOUR_URL
export SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE
export SUPABASE_BUCKET=storage
export EXPORT_FOLDERS=designs,ai-designs,websites
```

### 2) Export Storage → public/media

```bash
npm run storage:export
```

This downloads objects from the configured bucket and folders to `public/media/<folder>/<filename>`.

Optional optimization (convert JPEG/PNG to WebP):

```bash
npm run images:webp
```

### 3) Rewrite content image URLs in the database

```bash
npm run content:rewrite-urls
```

- Rewrites `content_sections` items so any Supabase public URLs become site-relative paths like `/media/designs/foo.webp`.
- Targets sections: `designs, websites, ai_designs`. Override with `SECTIONS` env var if needed.

### 4) Commit and deploy

```bash
git add public/media
git commit -m "migrate images to public/media"
git push
```

Vercel will serve `public/` with CDN caching. If you replace an image, prefer renaming (hashes) to bust caches.

### 5) Admin UI note

The portfolio editor now supports two ways to add images:
- Paste a site-relative path (e.g., `/media/...`) from the repo
- Or upload directly via the admin; files are committed to GitHub (`public/media/...`) using the `/api/upload-media` endpoint

Deployment env required for Git uploads:
- `GITHUB_TOKEN` (repo write)
- Optional overrides: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`
