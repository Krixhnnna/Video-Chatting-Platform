# Video Chat Platform

A real-time video chat application built with WebRTC, allowing users to connect with strangers for video conversations. The platform features a clean, modern UI with dark mode support and includes text chat functionality.

## Features

- 🎥 Real-time video chat using WebRTC
- 💬 Text chat functionality
- 🌙 Dark mode interface
- 📱 Responsive design
- 🔄 Random stranger matching
- 🎨 Modern, minimalist UI

## Tech Stack

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - WebRTC API

- **Backend:**
  - Node.js
  - TypeScript
  - Socket.IO
  - Express

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Krixhnnna/Video-Chatting-Platform.git
cd Video-Chatting-Platform
```

2. Install client dependencies:
```bash
cd client
npm install
```

3. Install server dependencies:
```bash
cd ../server
npm install
```

## Running the Application

1. Start the client development server:
```bash
cd client
npm run dev
```

2. Start the backend server:
```bash
cd ../server
npm start
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click "Start Video Chat" on the home page
2. Allow camera and microphone permissions
3. Wait to be matched with a stranger
4. Use the chat interface to communicate via text
5. Click "Stop Call" to end the conversation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.IO for real-time signaling
