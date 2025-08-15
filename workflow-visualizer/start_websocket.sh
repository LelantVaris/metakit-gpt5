#!/bin/bash

# Start the WebSocket server with virtual environment
echo "Starting WebSocket server on http://localhost:8002"
echo "Press Ctrl+C to stop the server"
echo ""

# Activate virtual environment and run server
source venv/bin/activate && python3 server.py