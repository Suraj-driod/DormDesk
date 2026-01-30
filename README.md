# 🏠 DormDesk

> A modern, comprehensive campus management platform designed for student hostels and dormitories. Streamline issue reporting, community engagement, and campus communication all in one beautiful interface.

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-Private-red)

---

## 📸 Screenshots

<!-- Add your project screenshots here -->
<!-- 
### Dashboard
![Dashboard Screenshot](./screenshots/dashboard.png)

### Issue Reporting
![Issue Reporting Screenshot](./screenshots/issue-reporting.png)

### Community Feed
![Community Feed Screenshot](./screenshots/community-feed.png)

### Lost & Found
![Lost & Found Screenshot](./screenshots/lost-found.png)
-->

---

## ✨ Features

### 🎯 Core Functionality

- **📊 Interactive Dashboard**
  - Auto-rotating slideshow showcasing trending issues, announcements, and updates
  - Quick access cards for major features
  - Real-time status indicators

- **📝 Issue Reporting System**
  - Report public or private issues
  - Track issue status (Reported → Assigned → In Progress → Resolved)
  - Image/video upload support
  - Detailed issue descriptions

- **📢 Community Feed**
  - Public issues, announcements, lost items, and complaints
  - Upvote and comment system
  - Filtering and sorting options
  - Real-time updates

- **⚠️ Complaint Management**
  - File complaints against caretakers, admins, or students
  - Media proof upload (images/videos)
  - Anonymous complaint option
  - Incident date/time tracking

- **🔍 Lost & Found**
  - Report lost items with descriptions
  - Found items posting
  - Image upload for better identification
  - Community-driven recovery

- **👤 User Profiles**
  - Personal dashboard
  - Issue history tracking
  - Profile customization

- **🔐 Authentication**
  - Secure login/registration
  - User session management
  - Role-based access (Admin/User)

### 🎨 Design Features

- **Modern UI/UX**
  - Clean, minimalist design with cyan/blue color scheme
  - Glassmorphism effects
  - Smooth animations powered by Framer Motion
  - Responsive design for all screen sizes

- **Accessibility**
  - WCAG compliant color contrasts
  - Keyboard navigation support
  - Screen reader friendly

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Supabase Account** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DormDesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
# or
yarn build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

---


### Key Directories Explained

- **`src/components/core/`**: Reusable UI components used throughout the application
- **`src/pages/`**: Main application pages/routes
- **`src/pages/Wrapper/`**: Layout components (Navbar, Sidebar, Footer)
- **`src/Lib/`**: Third-party library configurations and utilities
- **`src/page/`**: Enhanced/specialized page components

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Framer Motion 12.29.2** - Animation library
- **React Hook Form 7.71.1** - Form state management
- **Lucide React** - Icon library

### Backend & Services
- **Supabase** - Backend as a Service (BaaS)
  - Authentication
  - Database
  - Storage

### Development Tools
- **ESLint** - Code linting
- **TypeScript Types** - Type definitions for React

---

## 🎨 Design System

The project follows a comprehensive design system defined in `Design.json`:

### Color Palette
- **Primary Cyan**: `#00D9FF`, `#00BCD4`, `#E0F7FA`, `#F0FEFF`
- **Neutrals**: White, grays, charcoal
- **Semantic Colors**: Success, warning, error, info

### Typography
- Primary font: System font stack (San Francisco/Roboto)
- Scales: Hero, H1-H4, Body, Caption

### Components
- Glassmorphism cards
- Glow effects
- Rounded corners (26px standard)
- Consistent spacing system

---

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainers.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👥 Authors

- Project Team
1. Suraj Pednekar(Team Leader)
2. Sarvesh Saste
3. Omkar Shendge

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)
- Backend services by [Supabase](https://supabase.com/)

---

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

**Made with ❤️ for better campus management**
