# Workflow Visualizer for Content Optimizer

A real-time visualization tool that displays the workflow of your content optimizer script as an interactive flowchart, similar to make.com or n8n workflows.

## Features

- **Interactive Workflow Diagram**: Visual nodes and connections showing the script's processing flow
- **Real-time Updates**: Automatically updates when you modify the content optimizer script
- **Node Details**: Click on any node to see detailed information
- **Workflow Metrics**: Displays counts of different node types
- **Color-coded Nodes**: Different colors for input/output, processing, decisions, API calls, and checklists
- **WebSocket Connection**: Live updates without page refresh

## Installation

1. Install Python dependencies:
```bash
cd workflow-visualizer
pip install -r requirements.txt
```

## Usage

1. Start the WebSocket server:
```bash
python3 server.py
```

2. Open your browser and navigate to:
```
http://localhost:8002
```

3. The visualization will display your content optimizer workflow
4. Keep it on a second screen while working on your script
5. Changes to `content_audit_agent_v4.py` will automatically update the visualization

## Workflow Node Types

- **Input/Output** (Purple): Data entry and exit points
- **Processing** (Green): Data transformation and processing steps
- **Decision** (Yellow): Conditional branches in the workflow
- **API Call** (Blue): External API integrations (OpenAI, Web Search)
- **Checklist** (Magenta): Quality check validations

## How It Works

1. **Parser**: Analyzes the Python script using AST to extract workflow structure
2. **WebSocket Server**: Monitors file changes and broadcasts updates
3. **Visualization**: JavaScript renders the workflow as an interactive SVG diagram
4. **File Watcher**: Detects changes to the script and triggers re-parsing

## Customization

You can modify the workflow layout by editing:
- `parser.py`: Change how the script is analyzed and nodes are extracted
- `workflow.js`: Adjust node positioning, styling, and interactions
- `styles.css`: Customize colors, sizes, and visual effects

## Troubleshooting

- If the WebSocket connection fails, check that port 8002 is available
- If the visualization doesn't update, verify the script path in `server.py`
- For layout issues, adjust node positions in `parser.py`