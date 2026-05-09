# Full-Stack LMS Platform

A comprehensive Learning Management System built with MERN stack, featuring modules for Admin, Faculty, and Interns with role-based access control.

## Features

### Admin Dashboard
- **Batch Management**: Create, view, update, and delete batches.
- **Intern Management**: Manage intern profiles, assign batches, track progress.
- **Faculty Management**: Manage faculty profiles and assignments.
- **Reports & Analytics**: Generate detailed reports on batch and intern performance.

### Faculty Dashboard
- **My Batches**: View assigned batches and manage interns.
- **Topics Management**: Create and manage training topics.
- **Content Library**: Organize and share learning resources.

### Intern Dashboard
- **Course & Batch**: View assigned courses and batches.
- **Progress Tracking**: Monitor overall progress and performance.
- **Weekly Tasks**: Access and complete weekly tasks.
- **Achievements**: View earned badges and certificates.

## Tech Stack

- **Frontend**: React.js, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, Bcrypt.js

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soft-full
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create .env file based on .env.example
   cp .env.example .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   # Create .env file based on .env.example
   cp .env.example .env
   npm run dev
   ```

## Usage

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173