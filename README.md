# Video Chat Application Configuration Guide

This document outlines the configuration details, ports, and environment variables required to run the Video Chat Application.

## Project Structure
- **server**: Node.js/Express backend with Socket.IO signaling.
- **client**: React frontend using Vite and WebRTC.

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Running locally or Atlas URI)
- RabbitMQ (Running locally for message queuing)

## Port Configuration

| Service | Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Server API / Signaling** | **80** | HTTP / WS | The main backend server port. Requires Admin privileges to bind. |
| **Client Dev Server** | 5173 | HTTP | Default Vite development port. |
| **STUN / TURN** | 3478 | UDP / TCP | External TURN server for NAT traversal. |
| **SSH** | 22 | TCP | Server SSH access (System level). |
| **Media Relay** | 49152-65535 | UDP | Port range used by the TURN server for relaying media. |

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

# TURN Server Configuration
VITE_TURN_IP=72.61.174.27
VITE_TURN_PORT=3478
VITE_TURN_USERNAME=webrtcuser
VITE_TURN_PASSWORD=webrtcpassword
```

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

## WebRTC Troubleshooting
- **Firewall**: Ensure outbound traffic on port 3478 (UDP/TCP) is allowed.
- **ICE Candidates**: Use `chrome://webrtc-internals` in Chrome to verify that candidates are being gathered from the TURN server (`72.61.174.27`).
