# Apex Customer App

A production-ready React + TypeScript frontend for the Apex waste oil collection platform. Built with Vite for optimal performance and developer experience.

## Features

- **Authentication**: Supabase email/password + magic link authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, minimal interface with professional icons
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Performance**: Optimized bundle with code splitting
- **Mock Mode**: Fully functional without backend dependencies

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Routing**: React Router DOM v6
- **Database**: Supabase (PostgreSQL + Auth)
- **Icons**: React Icons (Feather)
- **Utilities**: date-fns, clsx
- **Styling**: CSS-in-CSS (no Tailwind or CSS-in-JS)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project (optional - app works in mock mode)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd apex-customer-app
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_USE_MOCK=0
   ```

3. **Development server:**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

4. **Production build:**
   ```bash
   npm run build
   npm run preview
   ```

## Mock Mode

The app automatically enters **Mock Mode** when:
- No Supabase credentials are provided
- `VITE_USE_MOCK=1` is set in environment
- Supabase connection fails

### Mock Mode Features:
- ✅ Full navigation and UI functionality
- ✅ Sample data for all pages and components
- ✅ Form interactions and state management
- ✅ Simulated authentication (bypassed)
- ✅ Loading states and error handling
- ⚠️ Shows \"Mock Mode\" banner in topbar
- ❌ No real data persistence

### Mock Data Includes:
- Locations (3 sample locations)
- Collections (recent waste oil collections)
- Certificates (blockchain-verified certificates)
- Pickup requests with status tracking
- KPI dashboard with environmental metrics
- User profile and organization data

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── AppLayout.tsx      # Main app shell
│   │   ├── Topbar.tsx         # Header with user menu
│   │   └── Sidebar.tsx        # Navigation sidebar
│   └── UI/
│       ├── Button.tsx         # Button component
│       ├── Input.tsx          # Form input
│       ├── Select.tsx         # Dropdown select
│       ├── Card.tsx           # Content cards
│       ├── Table.tsx          # Data tables
│       ├── Empty.tsx          # Empty states
│       ├── Spinner.tsx        # Loading spinner
│       ├── StatusPill.tsx     # Status indicators
│       ├── DateRange.tsx      # Date range picker
│       └── FileDownload.tsx   # Download links
├── lib/
│   ├── types.ts               # TypeScript definitions
│   ├── supabase.ts            # Database client & auth
│   └── format.ts              # Utility functions
├── pages/
│   ├── Login.tsx              # Authentication page
│   ├── Home.tsx               # Dashboard with KPIs
│   ├── Locations.tsx          # Location management
│   ├── LocationDetail.tsx     # Single location view
│   ├── Collections.tsx        # Collection history
│   ├── CollectionDetail.tsx   # Collection details
│   ├── Reports.tsx            # ESG reporting
│   ├── Certificates.tsx       # Certificate management
│   ├── Requests.tsx           # Pickup requests
│   └── Account.tsx            # User profile
├── routes/
│   ├── Router.tsx             # Route definitions
│   └── AuthGuard.tsx          # Protected route wrapper
├── styles/
│   ├── global.css             # CSS variables & reset
│   ├── layout.css             # Layout components
│   ├── forms.css              # Form styling
│   ├── table.css              # Table components
│   └── utilities.css          # Utility classes
└── assets/
    └── logo-apex.svg          # Company logo
```

## Key Pages

### 🏠 Home Dashboard
- Monthly CO₂e avoided metrics
- Collection counts and certificates ready
- Recent collections table
- Quick navigation to all sections

### 📍 Locations
- List of all collection locations
- Search and filter capabilities
- Bins count and last collection dates
- Individual location detail pages

### 🗂️ Collections
- Complete collection history
- Filter by location, date, status
- Contamination flags and volumes
- Links to certificates and POCs

### 📊 Reports
- ESG impact reporting
- Period selection (month/quarter/year)
- CO₂e savings calculations
- Volume breakdown by location
- PDF export capabilities

### 🛡️ Certificates
- Blockchain-verified certificates
- Download and verification links
- Search by certificate number
- Hash verification for authenticity

### 🚛 Requests
- Create new pickup requests
- Track request status
- Upload photos and documentation
- Estimated volume tracking

### ⚙️ Account
- User profile management
- Organization information
- Role and permissions display
- Sign out functionality

## Authentication

### Supabase Auth Integration
- Email/password authentication
- Magic link sign-in
- Session management
- Protected routes
- Automatic token refresh

### Mock Authentication
When in mock mode:
- Login form is functional but bypassed
- User session is simulated
- All protected routes are accessible
- No actual authentication occurs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | No* |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | No* |
| `VITE_USE_MOCK` | Force mock mode (1 = enabled) | No |

*Required for production, optional for development (falls back to mock mode)

## CSS Architecture

The app uses a **CSS-in-CSS** approach with:

- **CSS Variables**: Consistent theming and dark mode support
- **BEM-style Classes**: Organized, maintainable component styles
- **Responsive Design**: Mobile-first approach with breakpoints
- **No External CSS**: Pure CSS without frameworks like Tailwind

### CSS Organization:
- `global.css`: Variables, reset, typography, accessibility
- `layout.css`: Layout components (sidebar, topbar, grid)
- `forms.css`: Form controls, buttons, inputs
- `table.css`: Data table styling and responsive behavior
- `utilities.css`: Helper classes, cards, status indicators

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management and visible focus styles
- Screen reader friendly
- High contrast color scheme

## Performance

- **Code Splitting**: Lazy-loaded routes
- **Tree Shaking**: Optimized bundle size
- **Image Optimization**: Efficient asset loading
- **Bundle Analysis**: Use `npm run build` to analyze

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Code Quality
- TypeScript strict mode enabled
- ESLint with React and TypeScript rules
- No `any` types allowed
- Comprehensive error handling

## Deployment

### Build Output
```bash
npm run build
# Outputs to dist/ directory
```

### Static Hosting
The app is a static SPA suitable for:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting provider

### Environment Setup
1. Set production environment variables
2. Configure Supabase for production domain
3. Update CORS settings if needed

## Troubleshooting

### Common Issues

**App shows \"Mock Mode\" banner:**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is accessible
- Check network connectivity

**TypeScript errors:**
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` settings
- Verify import paths are correct

**Build fails:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`
- Verify all imports resolve correctly

### Support

For technical support or feature requests, please contact the Apex development team.

## License

Copyright © 2024 Apex. All rights reserved.