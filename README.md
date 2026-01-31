# 🏠 DormDesk

> A modern campus management platform for student hostels and dormitories. Streamline issue reporting, community feed, lost & found, complaints, and announcements in one interface.

[![Version](https://img.shields.io/badge/version-0.0.0-blue)](https://github.com/Suraj-driod/DormDesk)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-Private-red)](./README.md)

**Repo:** [github.com/Suraj-driod/DormDesk](https://github.com/Suraj-driod/DormDesk)

**🎬 Hackathon presentation & videos:** [Google Drive folder](https://drive.google.com/drive/folders/1tlF3N-Vh7N6ixCUy81RHYKHczhhAJVF-?usp=sharing) — *Presentation video and materials. Use the `readme.txt` file in the folder for test login email to try out the website.*

---

## ✨ Features

### Core

- **Dashboard** — Slideshow of trending issues, announcements; quick-access cards; status indicators
- **Issue reporting** — Public/private issues, status flow (Reported → Assigned → In Progress → Resolved), image/video upload
- **Community feed** — Public issues, announcements, lost items, complaints; upvote & comment; filters & real-time updates
- **Complaints** — Against caretakers/admins/students; media proof; optional anonymous; incident date/time
- **Lost & found** — Report lost / post found items; image upload; community-driven recovery
- **Profile** — Personal dashboard, issue history, profile settings
- **Auth & roles** — Login/register, session handling, Admin / User (and Caretaker) access

### Design

- Cyan/blue theme, glassmorphism, Framer Motion animations, responsive layout
- WCAG contrast, keyboard nav, screen-reader friendly

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- **Firebase** project ([console](https://console.firebase.google.com/))

### Install & run

1. **Clone**
   ```bash
   git clone https://github.com/Suraj-driod/DormDesk.git
   cd DormDesk
   ```

2. **Dependencies**
   ```bash
   npm install
   ```

3. **Environment**
   
   Copy `.env.example` to `.env` and fill in Firebase config from your project settings:
   ```env
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
   
   Optional (for full feature set):
   - `VITE_IMGBB_API_KEY` — image uploads via ImgBB
   - `VITE_GEMINI_API_KEY` — similarity / OCR (e.g. lost & found)

4. **Dev server**
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. `http://localhost:5173`).

### Build & preview

```bash
npm run build    # output in dist/
npm run preview  # local preview of production build
```

---

## 🛠 Tech stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion, React Hook Form, Lucide React |
| **Backend** | **Firebase** — Auth, Firestore, Storage |
| **Tooling** | ESLint |

---

## 📁 Structure

| Path | Purpose |
|------|---------|
| `src/components/core/` | Reusable UI (Button, Inputs, PostBase, etc.) |
| `src/pages/` | Routes & pages; `Wrapper/` = Navbar, Sidebar, Footer |
| `src/management/` | Admin & caretaker views (announcements, cases, lost, issues, responses) |
| `src/auth/` | Auth context, RequireAuth / RequireAdmin / RequireCaretaker |
| `src/services/` | Firebase/API services (issues, complaints, announcements, lost items, etc.) |
| `src/Lib/` | Lib/config and utilities |





## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 👥 Authors

- **Suraj Pednekar** (Team Lead)
- **Sarvesh Saste**
- **Omkar Shendge**

---

## 📄 License

Private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Framer Motion](https://www.framer.com/motion/)
- Backend: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)

---

**Made with ❤️ for better campus management**
