#!/usr/bin/env python3
"""
WebSocket Server for Workflow Visualizer
Provides real-time updates when the script changes
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Set, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from parser import WorkflowParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Send message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# File watcher for script changes
class ScriptWatcher(FileSystemEventHandler):
    def __init__(self, script_path: str, manager: ConnectionManager):
        self.script_path = Path(script_path)
        self.manager = manager
        self.parser = WorkflowParser(str(self.script_path))
        self.loop = None
        
    def set_loop(self, loop):
        self.loop = loop
        
    def on_modified(self, event):
        if event.src_path.endswith('.py') and 'content_audit' in event.src_path:
            logger.info(f"Script modified: {event.src_path}")
            if self.loop:
                asyncio.run_coroutine_threadsafe(
                    self.update_workflow(),
                    self.loop
                )
    
    async def update_workflow(self):
        """Parse the script and send updates to all clients"""
        try:
            workflow = self.parser.parse()
            message = {
                "type": "workflow_update",
                "workflow": workflow
            }
            await self.manager.broadcast(message)
            logger.info("Workflow update sent to clients")
        except Exception as e:
            logger.error(f"Error updating workflow: {e}")

# Initialize file watcher
script_path = Path(__file__).parent.parent / "article-optimizer" / "content_audit_agent_v4.py"
watcher = ScriptWatcher(str(script_path), manager)

# Set up file monitoring
observer = Observer()
observer.schedule(watcher, path=str(script_path.parent), recursive=False)

# Serve static files
app.mount("/static", StaticFiles(directory=Path(__file__).parent), name="static")

@app.get("/")
async def serve_index():
    """Serve the main HTML page"""
    return FileResponse(Path(__file__).parent / "index-enhanced.html")

@app.get("/styles.css")
async def serve_styles():
    """Serve the CSS file"""
    return FileResponse(Path(__file__).parent / "styles.css")

@app.get("/styles-enhanced.css")
async def serve_enhanced_styles():
    """Serve the enhanced CSS file"""
    return FileResponse(Path(__file__).parent / "styles-enhanced.css")

@app.get("/workflow.js")
async def serve_script():
    """Serve the JavaScript file"""
    return FileResponse(Path(__file__).parent / "workflow.js")

@app.get("/workflow-enhanced.js")
async def serve_enhanced_script():
    """Serve the enhanced JavaScript file"""
    return FileResponse(Path(__file__).parent / "workflow-enhanced.js")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    
    try:
        # Send initial workflow on connection
        parser = WorkflowParser(str(script_path))
        workflow = parser.parse()
        await websocket.send_json({
            "type": "workflow_update",
            "workflow": workflow
        })
        
        # Keep connection alive
        while True:
            # Wait for messages from client (ping/pong)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    """Start the file watcher on server startup"""
    observer.start()
    watcher.set_loop(asyncio.get_event_loop())
    logger.info(f"Monitoring script at: {script_path}")
    logger.info("WebSocket server started on ws://localhost:8002")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the file watcher on server shutdown"""
    observer.stop()
    observer.join()
    logger.info("File watcher stopped")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8002,
        log_level="info"
    )