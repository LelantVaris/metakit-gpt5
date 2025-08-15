#!/bin/bash
# Start the workflow visualizer server

echo "Starting Workflow Visualizer..."
echo "================================"
echo ""

cd "$(dirname "$0")"
python3 simple_server.py