# Video Chat Application Configuration Guide

This document outlines the configuration details, ports, and environment variables required to run the Video Chat Application.

## Project Structure
- **server**: Node.js/Express backend with Socket.IO signaling.
- **client**: React frontend using Vite and WebRTC.

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Running locally or Atlas URI)
- RabbitMQ (Running locally for message queuing)



## Environment Variables

### Server (`server/.env`)
Create a `.env` file in the `server` directory:

```env
PORT=80
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Client (`client/.env`)
Create a `.env` file in the `client` directory. These variables are exposed to the browser.

```env
# Point to the Server API (Port 80)
VITE_API_URL=http://localhost:80



## How to Run

### 1. Start the Server
The server must be started first. **Note:** On Windows, you might need to run your terminal as **Administrator** to bind to port 80.

```bash
cd server
npm install
npm start
```
*Expected Output:* `Server running on port 80`

### 2. Start the Client
Open a new terminal window.

```bash
cd client
npm install
npm run dev
```
*Expected Output:* `Local: http://localhost:5173/`

