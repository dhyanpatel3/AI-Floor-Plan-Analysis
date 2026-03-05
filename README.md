# AI Floor Plan Analysis & Estimation

**AI Floor Analyzer** is a sophisticated full-stack web application designed to revolutionize construction estimation. By leveraging the power of **Google's Gemini AI**, it analyzes floor plan images (JPG, PNG) and PDF files to extract critical structural data—including room dimensions, wall lengths, and total built-up areas. It then provides precise material estimates (bricks, cement, steel, etc.) and comprehensive cost breakdowns, making it an indispensable tool for architects, quantity surveyors, and homeowners.

## 🚀 Key Features

- **AI-Powered Analysis**: Utilizes Google Gemini AI to automatically identify rooms, measure wall dimensions, and calculate areas from uploaded floor plans.
- **Smart Calibration**: Features an interactive calibration tool to ensure measurement accuracy by setting a known reference area or length.
- **Material Estimation**: Instantly calculates quantities for construction materials like Bricks, Cement, Sand, Aggregate, Steel, and Paint based on the analysis.
- **Cost Calculation**: Generates detailed project cost estimates using customizable unit rates.
- **User Authentication**: Secure login and signup implementation using **Google OAuth** and JWT.
- **Payment Integration**: Seamless subscription and payment processing via **Razorpay**.
- **Admin Dashboard**: A comprehensive panel for administrators to manage users, floor plans, and system settings.
- **Results Dashboard**: Visualizes analysis data with interactive charts and key metrics.
- **PDF Reporting**: Generates and downloads detailed PDF reports of the analysis and cost estimates.
- **Email Notifications**: Automated system emails for account verification and updates.

## 🛠️ Tech Stack

### Client (Frontend)

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / Custom Components
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: React Toastify & SweetAlert2
- **PDF Generation**: jsPDF & jsPDF-AutoTable

### Server (Backend)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Storage**: Cloudinary (for image/file management)
- **Authentication**: JWT & Google Auth Library
- **Payments**: Razorpay
- **Email**: Nodemailer

## 📋 Prerequisites

Before you begin, ensure you have the following ready:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- **MongoDB Database** (Local or Atlas URL)
- **Cloudinary Account** (Cloud Name, API Key, Secret)
- **Google Cloud Project** (Client ID & Gemini API Key)
- **Razorpay Account** (Key ID & Secret)
- **Gmail Account** (with App Password for email service)

## ⚙️ Environment Variables (Credentials)

To run this project, you will need to add the following environment variables to your `.env` files in both the `server` and `client` directories.

### Server (`server/.env`)

Create a `.env` file in the `server` directory and populate it with your credentials:

```env
# Server Configuration
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Google Gemini AI Key
GEMINI_API_KEY=your_google_gemini_api_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=your_email@gmail.com
```

### Client (`client/.env`)

Create a `.env` file in the `client` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Google OAuth (Client ID must match server's)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Razorpay Key (Public Key)
VITE_RAZORPAY_KEY=your_razorpay_key_id
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Floor-Plan-Analysis
```

### 2. Backend Setup (Server)

Navigate to the server directory, install dependencies, and start the server:

```bash
cd server
npm install
# Ensure your .env file is created as per the instructions above
npm run dev
```

The server will start on `http://localhost:5000`.

### 3. Frontend Setup (Client)

Open a new terminal, navigate to the client directory, install dependencies, and start the app:

```bash
cd client
npm install
# Ensure your .env file is created as per the instructions above
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## 📖 Usage Guide

1.  **Sign Up/Login**: Access the platform using your Google account or email.
2.  **Upload Plan**: Navigate to the dashboard and upload your floor plan (Image/PDF).
3.  **AI Analysis**: Wait for the Gemini AI model to process and extract dimensions.
4.  **Review & Calibrate**: Check the extracted data. If the scale seems off, use the calibration tool to input a known area or length.
5.  **View Estimates**: Go to the "Cost Estimation" tab to see material breakdowns and total project costs.
6.  **Download Report**: Click "Download PDF" to save a comprehensive report of your project.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.
