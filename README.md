# Personal Finance Tracker AI Agent

This is a simple web application for tracking personal expenses and incomes using text and voice input. It features a vanilla JS frontend, a Node.js/Express backend, SQLite database, and integrates Google's Gemini API for analyzing voice entries.

## Features

- Add income/expense entries via a text form.
- Add income/expense entries via voice commands (using Web Speech API and Gemini).
- View a table of all entries.
- Filter entries by date range.
- Visualize expense distribution with Pie and Bar charts (using Chart.js).
- Minimalist, responsive UI.
- Lightweight and fast-loading.

## Project Structure

```
personal-finance-web/
├── frontend/             # HTML, CSS, and Vanilla JS for the client-side
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── backend/              # Node.js/Express server
│   ├── node_modules/
│   ├── server.js         # Main server setup
│   └── routes/
│       ├── entries.js    # API endpoints for CRUD operations
│       └── voice.js      # API endpoint for voice analysis via Gemini
├── database/             # Database files
│   ├── schema.sql        # SQL schema definition
│   └── finance.db        # SQLite database file (created automatically)
├── .env                  # Environment variables (API keys, DB path)
├── package.json          # Backend dependencies
├── package-lock.json
└── README.md             # This file
```

## Setup and Installation

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd personal-finance-web
    ```

2.  **Install Backend Dependencies:**
    Navigate to the `backend` directory and install the required Node.js packages.
    ```bash
    cd backend
    npm install
    cd ..
    ```

3.  **Configure Environment Variables:**
    - Create a `.env` file in the project root (`personal-finance-web/`).
    - Copy the contents from the example below and replace the placeholder with your actual Gemini API key.

    ```dotenv
    # .env file

    # Backend Configuration (Optional, defaults to 3000)
    PORT=3000

    # Database Configuration (Optional, defaults to database/finance.db)
    DATABASE_PATH=database/finance.db

    # Google Gemini API Key
    # Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    *   **Important:** Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4.  **Database Setup:**
    The SQLite database file (`database/finance.db`) and the `entries` table will be created automatically when you first run the backend server.

## Running the Application

1.  **Start the Backend Server:**
    Navigate to the `backend` directory and run the server.
    ```bash
    cd backend
    node server.js
    ```
    The server should start, typically on `http://localhost:3000` (or the port specified in `.env`). You should see log messages indicating the database connection.

2.  **Open the Frontend:**
    Open the `frontend/index.html` file directly in your web browser (Opera or any modern Chromium-based browser is recommended for Web Speech API compatibility).
    - You can usually just double-click the `index.html` file or use a simple HTTP server (like `npx serve` in the `frontend` directory) if needed, though direct file access should work for this simple setup.

## Usage

1.  **Adding Entries (Text):**
    - Fill in the fields (Type, Name, Category, Description, Amount) in the "Add New Entry" form.
    - Click "Add Entry".
    - The entry will be saved, and the table and charts will update.

2.  **Adding Entries (Voice):**
    - Click the "Add via Voice" button.
    - Your browser might ask for microphone permission. Allow it.
    - The button text will change to "Listening...". Speak your entry clearly (e.g., "Spent 50 dollars on groceries", "Received 1500 from freelance work").
    - The application will transcribe your speech, send it to the backend for analysis by Gemini.
    - If successful, the form fields will be populated with the extracted information.
    - Review the populated fields. You can edit them if needed.
    - Click "Add Entry" to save the voice-parsed entry.

3.  **Viewing and Filtering:**
    - Entries are displayed in the table, sorted by date (newest first).
    - Use the date pickers ("Start Date", "End Date") and click "Filter" to view entries within a specific period.
    - Click "Clear Filter" to show all entries again.

4.  **Analyzing Data:**
    - The Pie chart shows the percentage distribution of expenses across different categories.
    - The Bar chart shows the total amount spent per category.
    - Charts update automatically when entries are added or filters are applied.

## API Endpoints

-   `POST /entries`: Creates a new entry.
    -   Body (JSON): `{ "type": "expense"|"income", "name": string, "category": string|null, "description": string|null, "amount": number }`
-   `GET /entries`: Retrieves entries.
    -   Query Params (Optional): `?start=YYYY-MM-DD&end=YYYY-MM-DD`
-   `POST /analyze-voice`: Analyzes transcribed voice text using Gemini.
    -   Body (JSON): `{ "transcript": string }`
    -   Returns (JSON): `{ "type": ..., "name": ..., "category": ..., "description": ..., "amount": ... }` or `{ "error": string }`

## Notes

-   The Web Speech API requires HTTPS for deployment, but often works on `localhost` or via `file:///` during development in compatible browsers (like Chrome/Opera).
-   Error handling is basic. More robust validation and user feedback could be added.
-   Ensure your `GEMINI_API_KEY` is kept secret and not committed to version control (add `.env` to your `.gitignore`).
