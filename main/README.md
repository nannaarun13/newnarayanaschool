# New Narayana School - Website & Admin Portal

A modern, full-stack school management solution featuring a responsive public website and a comprehensive secure admin dashboard. Built with **React**, **TypeScript**, and **Firebase**.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Features

### 🌐 Public Website
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop.
- **Dynamic Content:** Real-time updates for Notices, Gallery, and School Information.
- **Admissions:** Digital admission inquiry forms.
- **Gallery:** Interactive photo gallery categorized by events.
- **Navigation:** smooth routing and intuitive layout.

### 🛡️ Admin Dashboard
- **Secure Authentication:** Role-based access control (Super Admin / Admin).
- **Content Management:**
  - **Notices:** Create, edit, and delete announcements with priority tagging.
  - **Gallery:** Upload and manage school event photos.
  - **Admissions:** View and manage incoming admission requests.
  - **School Info:** Update contact details, address, and social links instantly.
- **Security Hub:**
  - **Activity Logging:** Tracks login attempts, IP addresses, and critical actions.
  - **Rate Limiting:** Prevents brute-force attacks on login endpoints.
  - **Session Management:** Auto-logout on inactivity.
- **Offline Sync:** Queues updates when offline and syncs automatically when the connection is restored.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend / DB:** Firebase (Authentication, Firestore)
- **State Management:** React Context API
- **Icons:** Lucide React
- **Deployment:** Vercel

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or yarn

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/new-narayana-school.git](https://github.com/your-username/new-narayana-school.git)
    cd new-narayana-school
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Firebase credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```

## 🔥 Firebase Configuration

To make the app function correctly, you need to configure your Firebase Console:

### 1. Authentication
- Go to **Authentication** > **Sign-in method**.
- Enable **Email/Password**.
- Go to **Settings** > **Authorized domains** and add your local (`localhost`) and production domains (`new-narayana-school.vercel.app`).

### 2. Firestore Database
Create a database in **Production Mode** and apply the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public Read Access (Website content)
    match /school/config { allow read: if true; allow write: if request.auth != null; }
    match /notices/{noticeId} { allow read: if true; allow write: if request.auth != null; }
    match /gallery/{imageId} { allow read: if true; allow write: if request.auth != null; }
    
    // Admin Only Access
    match /admins/{userId} { 
      allow read: if request.auth != null;
      allow create: if request.resource.data.status == 'pending'; // Allow registration
      allow write: if request.auth != null && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.status == 'approved';
    }
    
    // Security Logs
    match /security_events/{eventId} { allow read, write: if request.auth != null; }
    match /admin_login_activities/{activityId} { allow read, write: if request.auth != null; }
    
    // Fallback
    match /{document=**} { allow read, write: if false; }
  }
}