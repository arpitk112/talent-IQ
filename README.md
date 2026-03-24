# Talent-IQ

Welcome to the Talent-IQ project! This is a web application designed to help folks prepare for technical interviews. We built it so users can practice algorithms, run code right in the browser, and even hop into video calls with a chat interface for mock interviews.

We put this together using a modern stack: React on the frontend and an Express/Node backend, with a few key integrations like Clerk for managing users, Stream for the video/chat stuff, Monaco Editor so coding feels like it does in VS Code, and Google Gemini AI for our automated Resume Builder.

## What's under the hood?

Here's a quick look at the main tech we are using:

**Frontend**
*   **React 19 & Vite**: Fast development and building.
*   **Tailwind CSS & DaisyUI**: For styling the UI quickly and keeping it clean.
*   **@monaco-editor/react**: The core code editor component.
*   **Stream (Video & Chat React SDKs)**: Handles the real-time communication.
*   **Clerk React**: Takes care of login/signup.
*   **React Query**: For fetching and caching data from our API.
*   **JSZip**: For bundling AI-generated LaTeX resumes directly in the browser.

**Backend**
*   **Node.js & Express**: Our main API server.
*   **MongoDB & Mongoose**: Where we store our data.
*   **Clerk Express**: Secures our API routes.
*   **Stream Node SDK**: Backend integration for creating video/chat channels.
*   **Inngest**: We use this for running background jobs reliably.
*   **Google Gemini SDK**: Connects to the Gemini AI API for generating ATS-friendly resumes.

## Getting the project running locally

If you want to pull this down and run it on your own machine, follow these steps. You'll need Node.js (v18+) and a MongoDB database (local or Atlas works fine) ready to go.

### 1. Get your API Keys

Since we rely on a few external services, you'll need to sign up for free tiers on these platforms and grab your API keys before starting the apps:
*   **[Clerk](https://clerk.com/)**: Create an application to get your Publishable Key and Secret Key.
*   **[Stream](https://getstream.io/)**: Create an app to get your API Key and API Secret.
*   **[Inngest](https://www.inngest.com/)**: Grab an event key for background processing.
*   **[Google AI Studio](https://aistudio.google.com/)**: Generate an API key to enable the Gemini AI Resume Builder.

### 2. Set up the Backend

First, let's get the API server running. Open your terminal and do the following:

```bash
# Move into the backend folder
cd backend

# Install the dependencies
npm install
```

Now, create a file named `.env` right inside the `backend` folder. You need to fill in these values with the keys you got earlier:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
INNGEST_EVENT_KEY=your_inngest_event_key
GEMINI_API_KEY=your_gemini_api_key
```

Once that's saved, you can start the development server:

```bash
npm run dev
```
The backend should now be listening on port 5000.

### 3. Set up the Frontend

Leave the backend running and open a new terminal window. Now we'll set up the React app.

```bash
# Move into the frontend folder from the root of the project
cd frontend

# Install the dependencies
npm install
```

Just like the backend, create a file named `.env.local` inside the `frontend` folder and paste in your public keys:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_STREAM_API_KEY=your_stream_api_key
```

Start the Vite development server:

```bash
npm run dev
```

The frontend should boot up, and you can access the app in your browser, usually at `http://localhost:5173`.
