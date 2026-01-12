# AI Floor Plan Analysis & Estimator

**AI-Floor-Plan-Analysis** is a full-stack web application designed to simplify construction estimation. By leveraging **Google's Gemini AI**, it analyzes floor plan images or PDFs to extract structural data, including room dimensions, wall lengths, and total built-up area. It then provides detailed material estimates and cost breakdowns, making it a powerful tool for quantity surveyors, architects, and homeowners.

## 🚀 Features

- **AI-Powered Analysis**: Automatically extracts floor plan details (Area, Wall Length, Rooms, Doors, Windows) using Google Gemini AI.
- **Smart Calibration**: Allows users to calibrate the scale based on a known area for precise measurements.
- **Material Estimation**: Calculates required quantities for Bricks, Cement, Sand, Aggregate, Steel, and Paint.
- **Cost Calculation**: Provides estimated project costs based on customizable unit rates.
- **Interactive Dashboard**: Visualizes data with charts and key statistics.
- **File Support**: Accepts image formats (JPG, PNG) and PDF files.

## 🛠️ Tech Stack

### Client (Frontend)

- **Framework**: React (v19) with TypeScript
- **Build Tool**: Vite
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Styling**: CSS / Custom Components

### Server (Backend)

- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Utilities**: Cors, Dotenv

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

You will also need a **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/).

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Floor-Plan-Analysis
```

### 2. Backend Setup (Server)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

**Configuration:**
Create a `.env` file in the `server` directory and add your API credentials:

```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

start the server:

```bash
npm run dev
# OR
npm start
```

The server will run on `http://localhost:5000`.

### 3. Frontend Setup (Client)

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

**Configuration:**
By default, the client expects the server to be running on `http://localhost:5000`. If you changed the server port, update the API URL in `client/services/geminiService.ts`.

Start the development server:

```bash
npm run dev
```

Access the application at the URL provided by Vite (typically `http://localhost:5173`).

## 📖 Usage Guide

1.  **Upload Plan**: Click on the upload area to select a Floor Plan image or PDF.
2.  **Wait for Analysis**: The AI will process the image to identify rooms and dimensions.
3.  **Calibrate**: If the extracted area looks incorrect (due to scale), enter the known "Total Built-up Area" in the Input field to recalibrate all measurements.
4.  **View Results**:
    - **Dashboard**: Overview of total costs and area.
    - **Charts**: Visual breakdown of material costs.
    - **Detailed Table**: Line-item quantities and costs for each material.
5.  **Adjust Rates**: You can update the unit rates for materials to match local market prices.

## 📂 Project Structure

```
AI-Floor-Plan-Analysis/
├── client/                 # Frontend React Application
│   ├── components/         # UI Components (Charts, Tables, Upload)
│   ├── services/           # API Services (Gemini integration, API calls)
│   ├── utils/              # Calculation logic (Material formulas)
│   ├── App.tsx             # Main Application Component
│   └── ...
├── server/                 # Backend Node.js Application
│   ├── index.js            # Express Server & AI Logic
│   └── ...
└── README.md               # Project Documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
