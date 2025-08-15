#!/usr/bin/env python3
"""
Simple Workflow Visualizer Server - No external dependencies required
Uses only Python standard library modules
"""

import http.server
import socketserver
import json
import os
import time
import threading
from pathlib import Path

# Configuration
PORT = 8002
SCRIPT_PATH = Path(__file__).parent.parent / "article-optimizer" / "content_audit_agent_v4.py"
WORKFLOW_JSON = Path(__file__).parent / "workflow.json"

def generate_workflow():
    """Generate workflow JSON from the script"""
    workflow = {
        "nodes": [
            {"id": "start", "type": "input", "label": "Input Content", "subtext": "Google Doc / File", "x": 100, "y": 100},
            {"id": "load-checklists", "type": "checklist", "label": "Load Checklists", "subtext": "5 checklists", "x": 100, "y": 200},
            {"id": "split-chunks", "type": "process", "label": "Split into Chunks", "subtext": "~400 words each", "x": 350, "y": 100},
            {"id": "analyze-loop", "type": "process", "label": "Analyze Chunks", "subtext": "For each chunk", "x": 600, "y": 100},
            {"id": "check-seo", "type": "checklist", "label": "SEO Checks", "subtext": "Keywords, titles", "x": 850, "y": 50},
            {"id": "check-nlp", "type": "checklist", "label": "NLP Checks", "subtext": "Readability", "x": 850, "y": 150},
            {"id": "check-ai", "type": "checklist", "label": "AI Patterns", "subtext": "Content quality", "x": 850, "y": 250},
            {"id": "check-master", "type": "checklist", "label": "Master Checks", "subtext": "Overall quality", "x": 1050, "y": 100},
            {"id": "check-pvod", "type": "checklist", "label": "PVOD Checks", "subtext": "Value & depth", "x": 1050, "y": 200},
            {"id": "decision-fix", "type": "decision", "label": "Fix Issues?", "subtext": "--fix flag", "x": 600, "y": 350},
            {"id": "fix-issues", "type": "api", "label": "Fix with OpenAI", "subtext": "API calls", "x": 850, "y": 350},
            {"id": "decision-websearch", "type": "decision", "label": "Web Search?", "subtext": "--web-search", "x": 850, "y": 450},
            {"id": "web-search", "type": "api", "label": "Search Web", "subtext": "Fact checking", "x": 1100, "y": 450},
            {"id": "postprocess", "type": "process", "label": "Postprocess", "subtext": "Clean & normalize", "x": 600, "y": 550},
            {"id": "strip-scaffold", "type": "process", "label": "Strip Scaffolding", "subtext": "Remove meta", "x": 850, "y": 550},
            {"id": "clean-links", "type": "process", "label": "Clean Links", "subtext": "Remove UTM", "x": 1050, "y": 550},
            {"id": "fix-code", "type": "process", "label": "Fix Code Fences", "subtext": "Normalize", "x": 850, "y": 650},
            {"id": "dedupe", "type": "process", "label": "Deduplicate", "subtext": "Remove repeats", "x": 1050, "y": 650},
            {"id": "generate-report", "type": "process", "label": "Generate Report", "subtext": "Audit results", "x": 350, "y": 750},
            {"id": "generate-mdx", "type": "process", "label": "Generate MDX", "subtext": "If requested", "x": 600, "y": 750},
            {"id": "output", "type": "input", "label": "Output", "subtext": "Report & Fixed content", "x": 850, "y": 750}
        ],
        "connections": [
            {"from": "start", "to": "load-checklists"},
            {"from": "start", "to": "split-chunks"},
            {"from": "split-chunks", "to": "analyze-loop"},
            {"from": "analyze-loop", "to": "check-seo"},
            {"from": "analyze-loop", "to": "check-nlp"},
            {"from": "analyze-loop", "to": "check-ai"},
            {"from": "analyze-loop", "to": "check-master"},
            {"from": "analyze-loop", "to": "check-pvod"},
            {"from": "check-seo", "to": "decision-fix"},
            {"from": "check-nlp", "to": "decision-fix"},
            {"from": "check-ai", "to": "decision-fix"},
            {"from": "check-master", "to": "decision-fix"},
            {"from": "check-pvod", "to": "decision-fix"},
            {"from": "decision-fix", "to": "fix-issues", "label": "Yes"},
            {"from": "decision-fix", "to": "postprocess", "label": "No"},
            {"from": "fix-issues", "to": "decision-websearch"},
            {"from": "decision-websearch", "to": "web-search", "label": "Yes"},
            {"from": "decision-websearch", "to": "postprocess", "label": "No"},
            {"from": "web-search", "to": "postprocess"},
            {"from": "postprocess", "to": "strip-scaffold"},
            {"from": "strip-scaffold", "to": "clean-links"},
            {"from": "clean-links", "to": "fix-code"},
            {"from": "fix-code", "to": "dedupe"},
            {"from": "dedupe", "to": "generate-report"},
            {"from": "generate-report", "to": "generate-mdx"},
            {"from": "generate-mdx", "to": "output"},
            {"from": "load-checklists", "to": "analyze-loop"}
        ]
    }
    
    # Try to enhance with actual script analysis if possible
    if SCRIPT_PATH.exists():
        try:
            with open(SCRIPT_PATH, 'r') as f:
                content = f.read()
                
            # Count actual checklists
            checklist_dir = SCRIPT_PATH.parent / "checklists"
            if checklist_dir.exists():
                checklist_count = len(list(checklist_dir.glob("*.json")))
                for node in workflow["nodes"]:
                    if node["id"] == "load-checklists":
                        node["subtext"] = f"{checklist_count} checklists"
                        
            # Check for specific methods to confirm workflow
            if "postprocess_content" in content:
                # Script has postprocessing
                pass
            if "generate_mdx_metadata" in content:
                # Script can generate MDX
                pass
                
        except Exception as e:
            print(f"Note: Could not enhance workflow from script: {e}")
    
    return workflow

def update_workflow_file():
    """Update the workflow JSON file"""
    workflow = generate_workflow()
    with open(WORKFLOW_JSON, 'w') as f:
        json.dump(workflow, f, indent=2)
    print(f"Updated workflow.json at {time.strftime('%H:%M:%S')}")

def watch_script():
    """Watch for script changes and update workflow"""
    last_modified = 0
    while True:
        try:
            if SCRIPT_PATH.exists():
                current_modified = os.path.getmtime(SCRIPT_PATH)
                if current_modified != last_modified:
                    last_modified = current_modified
                    update_workflow_file()
            time.sleep(2)  # Check every 2 seconds
        except Exception as e:
            print(f"Watch error: {e}")
            time.sleep(5)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler to serve our files"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.path = '/index-enhanced.html'
        elif self.path.startswith('/workflow.json'):
            # Serve the workflow JSON (ignore cache buster)
            self.path = '/workflow.json'
        
        return super().do_GET()
    
    def log_message(self, format, *args):
        """Suppress normal logging"""
        pass

def main():
    """Main server function"""
    print("=" * 50)
    print("WORKFLOW VISUALIZER - Simple Server")
    print("=" * 50)
    print(f"Script monitored: {SCRIPT_PATH}")
    print(f"Server port: {PORT}")
    print()
    
    # Generate initial workflow
    update_workflow_file()
    
    # Start file watcher in background thread
    watcher_thread = threading.Thread(target=watch_script, daemon=True)
    watcher_thread.start()
    print("✓ File watcher started")
    
    # Start HTTP server
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"✓ Server running at http://localhost:{PORT}")
        print()
        print("Open your browser and navigate to:")
        print(f"  → http://localhost:{PORT}")
        print()
        print("The visualization will auto-refresh every 2 seconds")
        print("Press Ctrl+C to stop the server")
        print("-" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == "__main__":
    main()