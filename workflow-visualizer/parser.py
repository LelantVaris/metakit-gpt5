#!/usr/bin/env python3
"""
Script Parser - Analyzes the content_audit_agent_v4.py to extract workflow structure
"""

import ast
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional


class WorkflowParser:
    def __init__(self, script_path: str = "../article-optimizer/content_audit_agent_v4.py"):
        self.script_path = Path(script_path)
        self.workflow = {
            "nodes": [],
            "connections": []
        }
        self.node_positions = {}
        self.current_x = 100
        self.current_y = 100
        
    def parse(self) -> Dict[str, Any]:
        """Parse the script and extract workflow structure"""
        if not self.script_path.exists():
            print(f"Script not found at {self.script_path}")
            return self.get_default_workflow()
        
        try:
            with open(self.script_path, 'r') as f:
                content = f.read()
            
            # Parse AST
            tree = ast.parse(content)
            
            # Extract main workflow from audit_content method
            self.extract_audit_workflow(tree)
            
            # Extract checklist information
            self.extract_checklists()
            
            # Extract postprocessing steps
            self.extract_postprocessing(tree)
            
            return self.workflow
            
        except Exception as e:
            print(f"Error parsing script: {e}")
            return self.get_default_workflow()
    
    def extract_audit_workflow(self, tree: ast.AST):
        """Extract the main audit workflow from the audit_content method"""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "ContentAuditAgent":
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == "audit_content":
                        self.parse_audit_method(item)
                        break
    
    def parse_audit_method(self, func_node: ast.FunctionDef):
        """Parse the audit_content method to extract workflow steps"""
        steps = []
        
        # Analyze the function body for key operations
        for stmt in ast.walk(func_node):
            if isinstance(stmt, ast.Call):
                if isinstance(stmt.func, ast.Attribute):
                    method_name = stmt.func.attr
                    
                    # Map method calls to workflow nodes
                    if method_name == "load_checklists":
                        self.add_node("load-checklists", "checklist", "Load Checklists", "JSON files", 100, 200)
                    elif method_name == "fetch_google_doc":
                        self.add_node("fetch-doc", "input", "Fetch Google Doc", "URL input", 100, 100)
                    elif method_name == "split_into_chunks":
                        self.add_node("split-chunks", "process", "Split into Chunks", "~400 words", 350, 100)
                    elif method_name == "analyze_chunk":
                        self.add_node("analyze-chunks", "process", "Analyze Chunks", "Loop through", 600, 100)
                    elif method_name == "fix_chunk_with_ai":
                        self.add_node("fix-ai", "api", "Fix with AI", "OpenAI API", 850, 350)
                    elif method_name == "postprocess_content":
                        self.add_node("postprocess", "process", "Postprocess", "Clean content", 600, 550)
                    elif method_name == "generate_report":
                        self.add_node("report", "process", "Generate Report", "Markdown", 350, 650)
                    elif method_name == "validate_fixes":
                        self.add_node("validate", "process", "Validate Fixes", "Check quality", 600, 450)
        
        # Add input/output nodes
        self.add_node("start", "input", "Input Content", "Doc/File", 100, 50)
        self.add_node("output", "input", "Output", "Report & Fixed", 600, 700)
        
        # Add decision nodes based on parameters
        self.add_node("fix-decision", "decision", "Fix Issues?", "--fix flag", 600, 300)
        self.add_node("websearch-decision", "decision", "Web Search?", "--web-search", 850, 450)
        
        # Create connections based on typical flow
        self.add_connection("start", "load-checklists")
        self.add_connection("start", "split-chunks")
        self.add_connection("split-chunks", "analyze-chunks")
        self.add_connection("analyze-chunks", "fix-decision")
        self.add_connection("fix-decision", "fix-ai", "Yes")
        self.add_connection("fix-decision", "postprocess", "No")
        self.add_connection("fix-ai", "websearch-decision")
        self.add_connection("websearch-decision", "validate", "Yes")
        self.add_connection("websearch-decision", "postprocess", "No")
        self.add_connection("validate", "postprocess")
        self.add_connection("postprocess", "report")
        self.add_connection("report", "output")
        self.add_connection("load-checklists", "analyze-chunks")
    
    def extract_checklists(self):
        """Extract checklist nodes from the checklists directory"""
        checklist_dir = self.script_path.parent / "checklists"
        if checklist_dir.exists():
            checklist_files = list(checklist_dir.glob("*.json"))
            
            # Add individual checklist nodes
            y_offset = 50
            for i, checklist_file in enumerate(checklist_files):
                name = checklist_file.stem.replace("_", " ").title()
                node_id = f"check-{checklist_file.stem}"
                self.add_node(
                    node_id, 
                    "checklist", 
                    name, 
                    "Quality checks",
                    850 + (i % 2) * 200,
                    y_offset + (i // 2) * 100
                )
                self.add_connection("analyze-chunks", node_id)
                self.add_connection(node_id, "fix-decision")
    
    def extract_postprocessing(self, tree: ast.AST):
        """Extract postprocessing steps"""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "ContentAuditAgent":
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == "postprocess_content":
                        # Extract individual postprocessing steps
                        steps = self.extract_method_calls(item)
                        
                        # Add postprocessing sub-nodes
                        y_offset = 500
                        for i, step in enumerate(steps[:5]):  # Limit to 5 for visualization
                            if step.startswith("_"):
                                step_name = step[1:].replace("_", " ").title()
                                node_id = f"post-{i}"
                                self.add_node(
                                    node_id,
                                    "process",
                                    step_name[:20],  # Truncate long names
                                    "Cleanup",
                                    850 + (i * 150),
                                    y_offset + 100
                                )
    
    def extract_method_calls(self, func_node: ast.FunctionDef) -> List[str]:
        """Extract method calls from a function"""
        methods = []
        for node in ast.walk(func_node):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute):
                    methods.append(node.func.attr)
                elif isinstance(node.func, ast.Name):
                    methods.append(node.func.id)
        return methods
    
    def add_node(self, node_id: str, node_type: str, label: str, subtext: str, x: int, y: int):
        """Add a node to the workflow"""
        # Check if node already exists
        if any(n["id"] == node_id for n in self.workflow["nodes"]):
            return
        
        self.workflow["nodes"].append({
            "id": node_id,
            "type": node_type,
            "label": label,
            "subtext": subtext,
            "x": x,
            "y": y
        })
        self.node_positions[node_id] = (x, y)
    
    def add_connection(self, from_id: str, to_id: str, label: Optional[str] = None):
        """Add a connection between nodes"""
        # Check if connection already exists
        if any(c["from"] == from_id and c["to"] == to_id for c in self.workflow["connections"]):
            return
        
        conn = {"from": from_id, "to": to_id}
        if label:
            conn["label"] = label
        self.workflow["connections"].append(conn)
    
    def get_default_workflow(self) -> Dict[str, Any]:
        """Return a default workflow structure"""
        return {
            "nodes": [
                {"id": "start", "type": "input", "label": "Input Content", "subtext": "Google Doc / File", "x": 100, "y": 100},
                {"id": "load-checklists", "type": "checklist", "label": "Load Checklists", "subtext": "5 checklists", "x": 100, "y": 200},
                {"id": "split-chunks", "type": "process", "label": "Split into Chunks", "subtext": "~400 words each", "x": 350, "y": 100},
                {"id": "analyze-loop", "type": "process", "label": "Analyze Chunks", "subtext": "For each chunk", "x": 600, "y": 100},
                {"id": "check-seo", "type": "checklist", "label": "SEO Checks", "subtext": "Keywords, titles", "x": 850, "y": 50},
                {"id": "check-nlp", "type": "checklist", "label": "NLP Checks", "subtext": "Readability", "x": 850, "y": 150},
                {"id": "check-ai", "type": "checklist", "label": "AI Patterns", "subtext": "Content quality", "x": 850, "y": 250},
                {"id": "decision-fix", "type": "decision", "label": "Fix Issues?", "subtext": "--fix flag", "x": 600, "y": 350},
                {"id": "fix-issues", "type": "api", "label": "Fix with OpenAI", "subtext": "API calls", "x": 850, "y": 350},
                {"id": "decision-websearch", "type": "decision", "label": "Web Search?", "subtext": "--web-search", "x": 850, "y": 450},
                {"id": "web-search", "type": "api", "label": "Search Web", "subtext": "Fact checking", "x": 1100, "y": 450},
                {"id": "postprocess", "type": "process", "label": "Postprocess", "subtext": "Clean & normalize", "x": 600, "y": 550},
                {"id": "generate-report", "type": "process", "label": "Generate Report", "subtext": "Audit results", "x": 350, "y": 650},
                {"id": "output", "type": "input", "label": "Output", "subtext": "Report & Fixed content", "x": 600, "y": 650}
            ],
            "connections": [
                {"from": "start", "to": "load-checklists"},
                {"from": "start", "to": "split-chunks"},
                {"from": "split-chunks", "to": "analyze-loop"},
                {"from": "analyze-loop", "to": "check-seo"},
                {"from": "analyze-loop", "to": "check-nlp"},
                {"from": "analyze-loop", "to": "check-ai"},
                {"from": "check-seo", "to": "decision-fix"},
                {"from": "check-nlp", "to": "decision-fix"},
                {"from": "check-ai", "to": "decision-fix"},
                {"from": "decision-fix", "to": "fix-issues", "label": "Yes"},
                {"from": "decision-fix", "to": "postprocess", "label": "No"},
                {"from": "fix-issues", "to": "decision-websearch"},
                {"from": "decision-websearch", "to": "web-search", "label": "Yes"},
                {"from": "decision-websearch", "to": "postprocess", "label": "No"},
                {"from": "web-search", "to": "postprocess"},
                {"from": "postprocess", "to": "generate-report"},
                {"from": "generate-report", "to": "output"},
                {"from": "load-checklists", "to": "analyze-loop"}
            ]
        }


if __name__ == "__main__":
    parser = WorkflowParser()
    workflow = parser.parse()
    print(json.dumps(workflow, indent=2))