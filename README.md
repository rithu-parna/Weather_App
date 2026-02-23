# SkyCast - Premium Weather Experience ⛅

A stunning, responsive weather application built with React, Vite, and modern CSS featuring a premium glassmorphism design.

## Features ✨

*   **Real-time Weather Data**: Fetches accurate, up-to-date weather information using the Open-Meteo API.
*   **City Search**: Easy-to-use search functionality with auto-geocoding for cities worldwide.
*   **7-Day Forecast**: Provides a sleek, card-based 7-day weather forecast.
*   **Premium Design**:
    *   **Glassmorphism Effects**: Beautiful frosted glass panels that adapt to the dark gradient background.
    *   **Dynamic Layout**: Fully responsive design that looks perfect on extreme mobile screens to large desktop monitors.
    *   **Rich Typography**: Uses the modern 'Outfit' font for a clean and professional look.
    *   **Smooth Animations**: Subtle hover effects, transitions, and entry animations for a polished user experience.
*   **Detailed Metrics**: Displays 'Feels Like' temperature, humidity, and wind speed.
*   **Dynamic Icons**: Context-aware weather icons powered by `lucide-react`.

## Tech Stack 🛠️

*   **Frontend Framework**: React 18
*   **Build Tool**: Vite
*   **Styling**: Modern Vanilla CSS with CSS Variables and Flexbox/Grid
*   **Icons**: Lucide React
*   **APIs**:
    *   Open-Meteo Forecast API
    *   Open-Meteo Geocoding API

## Getting Started 🚀

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (or yarn/pnpm)

### Installation

1.  **Clone the repository** (if applicable):
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Open in Browser**:
    Navigate to `http://localhost:5173/` in your web browser.

## Project Structure 📁

*   `src/App.jsx`: Main application component containing state logic, API calls, and the UI structure.
*   `src/App.css`: Component-specific styles including the glassmorphism classes and responsive grid layouts.
*   `src/index.css`: Global styles, CSS custom properties (design tokens), font imports, and base resets.
*   `index.html`: Main HTML entry point with updated SEO meta tags.

## API Usage 📡

This project uses the free tier of the [Open-Meteo API](https://open-meteo.com/), which does not require an API key for general use.
