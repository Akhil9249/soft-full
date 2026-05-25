# Full-Stack LMS Platform

A comprehensive Learning Management System built with the MERN stack, featuring advanced modules for Admin, Faculty, and Interns with fine-grained role-based access control (RBAC).

---

## 🚀 Key Features

### 🏢 Admin & Staff Dashboard
- **Batch Management**: Create, view, update, and delete training batches.
- **Intern Management**: Manage intern profiles, assign batches, and track progress.
- **Faculty Management**: Manage faculty profiles, assignments, and schedule constraints.
- **Reports & Analytics**: Generate detailed insights on batch and intern performance.

### 👨‍🏫 Faculty & Mentor Dashboard
- **My Batches**: View assigned batches and manage interns.
- **Topics Management**: Create and manage training topics.
- **Content Library**: Organize and share learning resources.

### 🎓 Intern Dashboard
- **Course & Batch**: View assigned courses and batches.
- **Progress Tracking**: Monitor overall progress and performance.
- **Weekly Tasks**: Access and complete weekly tasks.
- **Achievements**: View earned badges and certificates.

---

## ✨ Recent Enhancements & Special Features

We have recently integrated several high-performance UX, architectural, and security updates:

### 1. 📅 Weekly Schedule Timeline Grouping & Chronological Sorting
The schedule view now features a fully overhauled chronological timeline card architecture:
- **Chronological Sorting**: Time slots are dynamically parsed (e.g., `08:30 AM - 10:30 AM`, `11:00 AM - 01:00 PM`) and sorted chronologically so the earliest slots are displayed first.
- **Timeline Merging & Deduplication**: If multiple batches or days share the same time slot, they are grouped together inside a single, beautifully organized schedule card to prevent visual clutter.
- **Monday-to-Sunday Day Ordering**: Schedule days are strictly sorted according to standard business-week order.
- **PDF Export Alignment**: PDF export layouts are meticulously adjusted to match the new timeline order, ensuring seamless printed schedules.

### 2. 🔍 Dashboard Quick Navigation Autocomplete Search
We implemented a robust global search and quick-navigate system in the dashboard header:
- **Instant Page Autocomplete**: When the search input is focused, a dropdown list displays all accessible system page routes (e.g., Dashboard, Staff Management, Mentor Schedules, Notifications).
- **Fuzzy Filtering**: Instantly filters pages as you type, grouping them by clean, color-coded category badges (e.g., `Administration`, `Schedule`, `Settings`).
- **Click-Outside Dismissal**: Built using a custom hook listening to `mousedown` events on the document to dismiss the dropdown fluidly.

### 3. 🛡️ Role-Based Access for Mentor Schedules
To enforce data confidentiality and optimize user experience:
- **Self-Only Data Filtering**: If a user is logged in with the **Mentor** role, the system hides the branch and mentor selectors.
- **Personalized Header Labels**: Personalized schedules are displayed using the mentor's logged-in identity (e.g., "Your Schedule").
- **Auto-Filtering**: Mentors automatically see only their assigned batches, days, and time slots, eliminating cross-mentor schedule exposure.

### 4. 🔔 Quick Notification Navigation
- **Header Bell Icon Redirection**: Clicking the notification bell in the main dashboard header instantly navigates the user to the Settings Notification configuration page (`/notification`).

---

## 💻 Tech Stack

- **Frontend**: React.js, React Router DOM, Redux Toolkit, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, Bcrypt.js

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Running locally or via Atlas)

### Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd soft-full
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create and configure environment variables
   cp .env.example .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   # Create and configure environment variables
   cp .env.example .env
   npm run dev
   ```

---

## 🌍 Services Summary

- **Backend Server API**: `http://localhost:3000`
- **Frontend Client Dev Server**: `http://localhost:5173`