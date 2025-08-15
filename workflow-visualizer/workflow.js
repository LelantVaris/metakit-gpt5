// Workflow Visualization Engine
class WorkflowVisualizer {
    constructor() {
        this.canvas = document.getElementById('workflow-canvas');
        this.nodesGroup = document.getElementById('nodes');
        this.connectionsGroup = document.getElementById('connections');
        this.nodeDetails = document.getElementById('node-details');
        
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.hoveredNode = null;
        
        this.nodeWidth = 180;
        this.nodeHeight = 60;
        this.nodeSpacing = { x: 250, y: 120 };
        
        this.ws = null;
        this.floatingDetail = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.canvasOffset = { x: 0, y: 0 };
        
        this.initFloatingDetail();
        this.initCanvasInteractions();
        this.initWebSocket();
        this.createGradients();
        this.loadInitialWorkflow();
    }
    
    initFloatingDetail() {
        // Create floating detail element
        this.floatingDetail = document.createElement('div');
        this.floatingDetail.className = 'floating-detail';
        document.querySelector('.workflow-container').appendChild(this.floatingDetail);
    }
    
    initCanvasInteractions() {
        const container = document.querySelector('.workflow-container');
        this.currentScale = 1;
        
        // Canvas panning
        container.addEventListener('mousedown', (e) => {
            if (e.target === this.canvas || e.target.tagName === 'svg') {
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.canvasOffset.x, y: e.clientY - this.canvasOffset.y };
                container.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.canvasOffset.x = e.clientX - this.dragStart.x;
                this.canvasOffset.y = e.clientY - this.dragStart.y;
                this.updateCanvasTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                container.style.cursor = '';
            }
        });
        
        // Zoom with mouse wheel
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const scale = e.deltaY > 0 ? 0.9 : 1.1;
                this.currentScale = Math.max(0.5, Math.min(2, this.currentScale * scale));
                this.updateCanvasTransform();
            }
        });
        
        // Control buttons
        document.getElementById('zoom-in')?.addEventListener('click', () => {
            this.currentScale = Math.min(2, this.currentScale * 1.2);
            this.updateCanvasTransform();
        });
        
        document.getElementById('zoom-out')?.addEventListener('click', () => {
            this.currentScale = Math.max(0.5, this.currentScale * 0.8);
            this.updateCanvasTransform();
        });
        
        document.getElementById('reset-view')?.addEventListener('click', () => {
            this.currentScale = 1;
            this.canvasOffset = { x: 0, y: 0 };
            this.updateCanvasTransform();
        });
    }
    
    updateCanvasTransform() {
        this.canvas.style.transform = `scale(${this.currentScale}) translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
    }
    
    showFloatingDetail(nodeData, x, y) {
        let html = `<div class="floating-detail-header">${nodeData.label}</div>`;
        html += `<div class="floating-detail-content">`;
        
        if (nodeData.details) {
            html += `<p>${nodeData.details.description}</p>`;
            
            if (nodeData.details.fixes) {
                html += `<strong>Fixes Applied:</strong>`;
                html += `<ul class="floating-detail-list">`;
                nodeData.details.fixes.forEach(fix => {
                    html += `<li>${fix}</li>`;
                });
                html += `</ul>`;
            }
            
            if (nodeData.details.features) {
                html += `<strong>Features:</strong>`;
                html += `<ul class="floating-detail-list">`;
                nodeData.details.features.forEach(feature => {
                    html += `<li>${feature}</li>`;
                });
                html += `</ul>`;
            }
            
            if (nodeData.details.patterns) {
                html += `<strong>Patterns:</strong>`;
                html += `<ul class="floating-detail-list">`;
                nodeData.details.patterns.forEach(pattern => {
                    html += `<li>"${pattern}"</li>`;
                });
                html += `</ul>`;
            }
            
            if (nodeData.details.metrics) {
                html += `<p><strong>Target:</strong> ${nodeData.details.metrics}</p>`;
            }
            
            if (nodeData.details.api) {
                html += `<p><strong>API:</strong> ${nodeData.details.api}</p>`;
            }
        } else {
            html += `<p>${nodeData.subtext || 'Processing node'}</p>`;
        }
        
        html += `</div>`;
        
        this.floatingDetail.innerHTML = html;
        
        // Better positioning calculation
        const rect = this.floatingDetail.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = x + 20;
        let top = y + 10;
        
        // Prevent overflow on right edge
        if (left + rect.width > viewportWidth - 20) {
            left = x - rect.width - 20;
        }
        
        // Prevent overflow on bottom edge
        if (top + rect.height > viewportHeight - 20) {
            top = y - rect.height - 10;
        }
        
        this.floatingDetail.style.left = `${Math.max(10, left)}px`;
        this.floatingDetail.style.top = `${Math.max(10, top)}px`;
        this.floatingDetail.classList.add('visible');
    }
    
    hideFloatingDetail() {
        this.floatingDetail.classList.remove('visible');
    }
    
    createGradients() {
        const defs = this.canvas.querySelector('defs');
        
        const gradients = [
            { id: 'gradient-input', colors: ['#667eea', '#764ba2'] },
            { id: 'gradient-process', colors: ['#4CAF50', '#45a049'] },
            { id: 'gradient-decision', colors: ['#FFC107', '#FFA000'] },
            { id: 'gradient-api', colors: ['#2196F3', '#1976D2'] },
            { id: 'gradient-checklist', colors: ['#9C27B0', '#7B1FA2'] }
        ];
        
        gradients.forEach(({ id, colors }) => {
            const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            grad.setAttribute('id', id);
            grad.setAttribute('x1', '0%');
            grad.setAttribute('y1', '0%');
            grad.setAttribute('x2', '100%');
            grad.setAttribute('y2', '100%');
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('style', `stop-color:${colors[0]};stop-opacity:1`);
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('style', `stop-color:${colors[1]};stop-opacity:1`);
            
            grad.appendChild(stop1);
            grad.appendChild(stop2);
            defs.appendChild(grad);
        });
    }
    
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:8002/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'workflow_update') {
                    this.updateWorkflow(data.workflow);
                    this.updateLastUpdated();
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus(false);
                // Retry connection after 3 seconds
                setTimeout(() => this.initWebSocket(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-status');
        if (connected) {
            indicator.className = 'status-indicator connected';
        } else {
            indicator.className = 'status-indicator disconnected';
        }
    }
    
    updateLastUpdated() {
        const element = document.getElementById('last-updated');
        const now = new Date();
        element.textContent = now.toLocaleTimeString();
    }
    
    loadInitialWorkflow() {
        // Default workflow structure based on the content optimizer script
        const defaultWorkflow = {
            nodes: [
                { id: 'start', type: 'input', label: 'Input Content', subtext: 'Google Doc / File', x: 100, y: 100 },
                { id: 'load-checklists', type: 'checklist', label: 'Load Checklists', subtext: '5 checklists', x: 100, y: 200 },
                { id: 'split-chunks', type: 'process', label: 'Split into Chunks', subtext: '~400 words each', x: 350, y: 100 },
                { id: 'analyze-loop', type: 'process', label: 'Analyze Chunks', subtext: 'For each chunk', x: 600, y: 100 },
                { id: 'check-seo', type: 'checklist', label: 'SEO Checks', subtext: 'Keywords, titles', x: 850, y: 50 },
                { id: 'check-nlp', type: 'checklist', label: 'NLP Checks', subtext: 'Readability', x: 850, y: 150 },
                { id: 'check-ai', type: 'checklist', label: 'AI Pattern Checks', subtext: 'Content quality', x: 850, y: 250 },
                { id: 'decision-fix', type: 'decision', label: 'Fix Issues?', subtext: '--fix flag', x: 600, y: 350 },
                { id: 'fix-issues', type: 'api', label: 'Fix with OpenAI', subtext: 'API calls', x: 850, y: 350 },
                { id: 'decision-websearch', type: 'decision', label: 'Web Search?', subtext: '--web-search', x: 850, y: 450 },
                { id: 'web-search', type: 'api', label: 'Search Web', subtext: 'Fact checking', x: 1100, y: 450 },
                { id: 'postprocess', type: 'process', label: 'Postprocess', subtext: 'Clean & normalize', x: 600, y: 550 },
                { id: 'generate-report', type: 'process', label: 'Generate Report', subtext: 'Audit results', x: 350, y: 650 },
                { id: 'output', type: 'input', label: 'Output', subtext: 'Report & Fixed content', x: 600, y: 650 }
            ],
            connections: [
                { from: 'start', to: 'load-checklists' },
                { from: 'start', to: 'split-chunks' },
                { from: 'split-chunks', to: 'analyze-loop' },
                { from: 'analyze-loop', to: 'check-seo' },
                { from: 'analyze-loop', to: 'check-nlp' },
                { from: 'analyze-loop', to: 'check-ai' },
                { from: 'check-seo', to: 'decision-fix' },
                { from: 'check-nlp', to: 'decision-fix' },
                { from: 'check-ai', to: 'decision-fix' },
                { from: 'decision-fix', to: 'fix-issues', label: 'Yes' },
                { from: 'decision-fix', to: 'postprocess', label: 'No' },
                { from: 'fix-issues', to: 'decision-websearch' },
                { from: 'decision-websearch', to: 'web-search', label: 'Yes' },
                { from: 'decision-websearch', to: 'postprocess', label: 'No' },
                { from: 'web-search', to: 'postprocess' },
                { from: 'postprocess', to: 'generate-report' },
                { from: 'generate-report', to: 'output' },
                { from: 'load-checklists', to: 'analyze-loop' }
            ]
        };
        
        this.updateWorkflow(defaultWorkflow);
    }
    
    updateWorkflow(workflow) {
        // Clear existing elements
        this.nodesGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';
        this.nodes = [];
        this.connections = [];
        
        // Create connections first (so they appear behind nodes)
        workflow.connections.forEach(conn => {
            this.createConnection(conn, workflow.nodes);
        });
        
        // Create nodes
        workflow.nodes.forEach(nodeData => {
            this.createNode(nodeData);
        });
        
        // Update metrics
        this.updateMetrics(workflow);
    }
    
    createNode(nodeData) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'workflow-node');
        group.setAttribute('transform', `translate(${nodeData.x}, ${nodeData.y})`);
        group.setAttribute('data-node-id', nodeData.id);
        
        // Create rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', `node-rect ${nodeData.type}`);
        rect.setAttribute('width', this.nodeWidth);
        rect.setAttribute('height', this.nodeHeight);
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        
        // Create main text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-text');
        text.setAttribute('x', this.nodeWidth / 2);
        text.setAttribute('y', this.nodeHeight / 2 - 8);
        text.textContent = nodeData.label;
        
        // Create subtext
        const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtext.setAttribute('class', 'node-subtext');
        subtext.setAttribute('x', this.nodeWidth / 2);
        subtext.setAttribute('y', this.nodeHeight / 2 + 10);
        subtext.textContent = nodeData.subtext || '';
        
        group.appendChild(rect);
        group.appendChild(text);
        group.appendChild(subtext);
        
        // Add interaction handlers
        group.addEventListener('click', () => this.selectNode(nodeData));
        
        group.addEventListener('mouseenter', () => {
            this.hoveredNode = nodeData;
            const rect = group.getBoundingClientRect();
            const containerRect = document.querySelector('.workflow-container').getBoundingClientRect();
            this.showFloatingDetail(nodeData, rect.left - containerRect.left, rect.top - containerRect.top);
        });
        
        group.addEventListener('mouseleave', () => {
            this.hoveredNode = null;
            this.hideFloatingDetail();
        });
        
        this.nodesGroup.appendChild(group);
        this.nodes.push({ element: group, data: nodeData });
    }
    
    createConnection(connData, nodes) {
        const fromNode = nodes.find(n => n.id === connData.from);
        const toNode = nodes.find(n => n.id === connData.to);
        
        if (!fromNode || !toNode) return;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'flow-line');
        
        // Calculate connection points
        const x1 = fromNode.x + this.nodeWidth;
        const y1 = fromNode.y + this.nodeHeight / 2;
        const x2 = toNode.x;
        const y2 = toNode.y + this.nodeHeight / 2;
        
        // Create curved path
        const midX = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}`;
        path.setAttribute('d', d);
        
        // Add label if present
        if (connData.label) {
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.setAttribute('x', midX);
            labelText.setAttribute('y', (y1 + y2) / 2 - 10);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('font-size', '12');
            labelText.setAttribute('fill', connData.label === 'Yes' ? '#4CAF50' : '#f44336');
            labelText.textContent = connData.label;
            this.connectionsGroup.appendChild(labelText);
            
            if (connData.label === 'Yes') {
                path.classList.add('decision-yes');
            } else if (connData.label === 'No') {
                path.classList.add('decision-no');
            }
        }
        
        this.connectionsGroup.appendChild(path);
        this.connections.push({ element: path, data: connData });
    }
    
    selectNode(nodeData) {
        // Update selected state
        this.nodes.forEach(node => {
            node.element.classList.remove('active');
        });
        
        const selectedElement = this.nodes.find(n => n.data.id === nodeData.id);
        if (selectedElement) {
            selectedElement.element.classList.add('active');
        }
        
        this.selectedNode = nodeData;
        this.showNodeDetails(nodeData);
    }
    
    showNodeDetails(nodeData) {
        // Check if node has custom details
        if (nodeData.details) {
            let html = `
                <div class="detail-section">
                    <div class="detail-label">Node: ${nodeData.label}</div>
                    <div class="detail-value">${nodeData.subtext || ''}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-label">Type: ${nodeData.type.toUpperCase()}</div>
                    <div class="detail-value">${nodeData.details.description}</div>
                </div>
            `;
            
            // Add specific details based on what's available
            if (nodeData.details.fixes) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Fixes Applied:</div>
                        <ul class="detail-list">
                            ${nodeData.details.fixes.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (nodeData.details.features) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Features:</div>
                        <ul class="detail-list">
                            ${nodeData.details.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (nodeData.details.patterns) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Patterns Detected:</div>
                        <ul class="detail-list">
                            ${nodeData.details.patterns.map(p => `<li>"${p}"</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (nodeData.details.metrics) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Target Metrics:</div>
                        <div class="detail-value">${nodeData.details.metrics}</div>
                    </div>
                `;
            }
            
            if (nodeData.details.threshold) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Threshold:</div>
                        <div class="detail-value">${nodeData.details.threshold}</div>
                    </div>
                `;
            }
            
            if (nodeData.details.sources) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Data Sources:</div>
                        <ul class="detail-list">
                            ${nodeData.details.sources.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (nodeData.details.api) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">API:</div>
                        <div class="detail-value">${nodeData.details.api}</div>
                    </div>
                `;
            }
            
            if (nodeData.details.format) {
                html += `
                    <div class="detail-section">
                        <div class="detail-label">Format:</div>
                        <div class="detail-value">${nodeData.details.format}</div>
                    </div>
                `;
            }
            
            this.nodeDetails.innerHTML = html;
            return;
        }
        
        // Default details for nodes without custom details
        const details = {
            input: {
                description: 'Accepts content from Google Docs URL or local file',
                details: [
                    'Fetches Google Doc content via export API',
                    'Supports plain text and markdown input',
                    'Validates content availability'
                ]
            },
            process: {
                description: 'Processes and transforms content',
                details: [
                    'Splits content into manageable chunks',
                    'Analyzes content structure',
                    'Applies transformations'
                ]
            },
            checklist: {
                description: 'Applies quality checks from JSON checklists',
                details: [
                    'SEO optimization checks',
                    'NLP readability analysis',
                    'AI content pattern detection',
                    'Custom rules validation'
                ]
            },
            decision: {
                description: 'Conditional workflow branching',
                details: [
                    'Based on command-line flags',
                    'Determines processing path',
                    'Enables optional features'
                ]
            },
            api: {
                description: 'External API integration',
                details: [
                    'OpenAI API for content fixes',
                    'Web search for fact-checking',
                    'Asynchronous processing'
                ]
            }
        };
        
        const typeDetails = details[nodeData.type] || { description: 'Node', details: [] };
        
        let html = `
            <div class="detail-section">
                <div class="detail-label">Node: ${nodeData.label}</div>
                <div class="detail-value">${nodeData.subtext || ''}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Type: ${nodeData.type.toUpperCase()}</div>
                <div class="detail-value">${typeDetails.description}</div>
            </div>
        `;
        
        if (typeDetails.details.length > 0) {
            html += `
                <div class="detail-section">
                    <div class="detail-label">Features:</div>
                    <ul class="detail-list">
                        ${typeDetails.details.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        this.nodeDetails.innerHTML = html;
    }
    
    updateMetrics(workflow) {
        const metrics = {
            totalNodes: workflow.nodes.length,
            checklists: workflow.nodes.filter(n => n.type === 'checklist').length,
            processingSteps: workflow.nodes.filter(n => n.type === 'process').length,
            decisionPoints: workflow.nodes.filter(n => n.type === 'decision').length
        };
        
        document.getElementById('total-nodes').textContent = metrics.totalNodes;
        document.getElementById('total-checklists').textContent = metrics.checklists;
        document.getElementById('processing-steps').textContent = metrics.processingSteps;
        document.getElementById('decision-points').textContent = metrics.decisionPoints;
    }
}

// Initialize visualizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new WorkflowVisualizer();
    
    // Store visualizer globally for voice assistant
    window.visualizer = visualizer;
    
    // Update script status
    document.getElementById('script-status').textContent = 'Ready';
    
    // Animate workflow on load
    setTimeout(() => {
        const connections = document.querySelectorAll('.flow-line');
        connections.forEach((conn, index) => {
            setTimeout(() => {
                conn.classList.add('active');
                setTimeout(() => {
                    conn.classList.remove('active');
                }, 2000);
            }, index * 200);
        });
    }, 500);
});

// Voice Assistant Class
class VoiceAssistant {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.currentUtterance = null;
        
        this.initControls();
    }
    
    initControls() {
        this.voiceBtn = document.getElementById('voice-btn');
        this.speedSlider = document.getElementById('speech-speed');
        this.speedValue = document.getElementById('speed-value');
        this.techLevel = document.getElementById('tech-level');
        this.voiceStatus = document.getElementById('voice-status');
        
        this.voiceBtn.addEventListener('click', () => this.toggleSpeech());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.speedValue.textContent = `${e.target.value}x`;
        });
        
        // Stop speech if user changes settings while speaking
        this.techLevel.addEventListener('change', () => {
            if (this.isSpeaking) {
                this.stopSpeech();
            }
        });
    }
    
    generateExplanation() {
        const level = this.techLevel.value;
        const workflow = this.visualizer.workflowData;
        
        if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
            return "No workflow data is currently loaded. Please wait for the workflow to be parsed.";
        }
        
        const nodeCount = workflow.nodes.length;
        const checklistCount = workflow.nodes.filter(n => n.type === 'checklist').length;
        const apiCount = workflow.nodes.filter(n => n.type === 'api').length;
        const processingCount = workflow.nodes.filter(n => n.type === 'process').length;
        
        let explanation = "";
        
        switch(level) {
            case 'beginner':
                explanation = `Welcome to the Content Optimizer Workflow! This is a visual map of how your content gets improved. 
                
                Think of it like a recipe with ${nodeCount} steps. The workflow starts when you provide an article or content that needs optimization.
                
                First, the system reads your content and breaks it into smaller, manageable pieces. Then, it goes through ${checklistCount} quality checks - these are like spell-checkers but much smarter. They look for things like clarity, accuracy, and readability.
                
                When the system finds issues, it uses artificial intelligence to fix them. There are ${apiCount} points where it connects to AI services to get help with improvements.
                
                The workflow has ${processingCount} processing steps where your content gets analyzed and enhanced. Each purple box is where data comes in or goes out. Green boxes are where the actual work happens. Yellow diamonds are decision points where the system chooses what to do next.
                
                Finally, your improved content is saved and ready to use. The whole process is automatic and ensures your content meets high quality standards.`;
                break;
                
            case 'intermediate':
                explanation = `This workflow visualizes the Content Audit Agent version 4, containing ${nodeCount} distinct operations.
                
                The process begins with input parsing and article loading. The content is then segmented into chunks for parallel processing.
                
                The system employs ${checklistCount} validation checklists covering grammar, style, readability, factual accuracy, and SEO optimization. Each checklist contains specific rules and criteria that content must satisfy.
                
                Processing involves ${processingCount} transformation steps including chunk analysis, AI-powered corrections using GPT models, and content merging. The workflow includes ${apiCount} API integration points for OpenAI services and web search capabilities.
                
                Key decision nodes determine whether to apply fixes, use fallback options, or skip certain optimizations based on command-line flags. The workflow supports both full article processing and chunk-based incremental improvements.
                
                Post-processing steps include formatting cleanup, metadata extraction, and final validation before outputting the optimized content.`;
                break;
                
            case 'advanced':
                explanation = `The Content Audit Agent v4 workflow implements a ${nodeCount}-node directed acyclic graph for content optimization.
                
                Architecture: The system uses AST-based parsing to extract workflow semantics from Python source. It identifies ${checklistCount} JSON-schema validated checklists loaded dynamically at runtime.
                
                Processing pipeline: Input undergoes tokenization and chunk segmentation using configurable boundaries. Each chunk processes through ${processingCount} transformation functions including analyze_chunk, fix_chunk_with_ai, and merge_chunks methods.
                
                API integrations: ${apiCount} external service calls integrate OpenAI's GPT-4 for content generation and web search APIs for fact-checking. Rate limiting and retry logic handle API failures gracefully.
                
                Control flow: Decision nodes implement conditional execution based on CLI arguments like --no-fixes and --use-search. The workflow supports both synchronous and asynchronous execution patterns.
                
                Optimization strategies include caching parsed checklists, batching API requests, and implementing progressive enhancement patterns. Post-processing applies regex-based cleanup, markdown formatting, and semantic HTML generation.
                
                The visualization updates via WebSocket connections, monitoring file system events for real-time workflow modifications.`;
                break;
                
            case 'expert':
                explanation = `Content Audit Agent v4: ${nodeCount}-node workflow graph. AST parsing extracts method definitions, control flow, and data dependencies.
                
                Node taxonomy: Input/Output (I/O boundaries), Process (pure transformations), Decision (branching logic), API (external service calls), Checklist (${checklistCount} JSON-schema validators).
                
                Implementation: Python 3.x, asyncio-compatible, ${processingCount} processing lambdas. Chunk boundaries via regex patterns. State management through class instance variables.
                
                API layer: ${apiCount} integration points. OpenAI GPT-4 (completion API), retry exponential backoff, token optimization. Web search fallback for fact-checking.
                
                Optimization: O(n) chunk processing, parallel validation, memoized checklist parsing. WebSocket server: FastAPI/Uvicorn, file watcher via watchdog, message passing through JSON-RPC.
                
                Graph properties: Topological ordering ensures dependency resolution. Critical path analysis identifies optimization bottlenecks. Node positioning via force-directed layout algorithm.
                
                Real-time updates: inotify/FSEvents monitoring, differential updates, 100ms debounce. Client-side rendering: SVG, D3-inspired transitions, 60fps animation targets.`;
                break;
        }
        
        return explanation;
    }
    
    toggleSpeech() {
        if (this.isSpeaking) {
            this.stopSpeech();
        } else {
            this.startSpeech();
        }
    }
    
    startSpeech() {
        const text = this.generateExplanation();
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = parseFloat(this.speedSlider.value);
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a high-quality voice if available
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Samantha') || 
            voice.name.includes('Alex') || 
            voice.name.includes('Google') ||
            voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateUI('speaking');
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateUI('ready');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateUI('error');
            setTimeout(() => this.updateUI('ready'), 3000);
        };
        
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }
    
    stopSpeech() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        this.updateUI('ready');
    }
    
    updateUI(status) {
        const statusText = this.voiceStatus.querySelector('.status-text');
        const voiceText = this.voiceBtn.querySelector('.voice-text');
        const voiceIcon = this.voiceBtn.querySelector('.voice-icon');
        
        switch(status) {
            case 'speaking':
                statusText.textContent = 'Speaking...';
                voiceText.textContent = 'Stop';
                voiceIcon.textContent = '⏹️';
                this.voiceBtn.classList.add('speaking');
                this.voiceStatus.classList.add('active');
                break;
            case 'ready':
                statusText.textContent = 'Ready';
                voiceText.textContent = 'Explain Workflow';
                voiceIcon.textContent = '🎙️';
                this.voiceBtn.classList.remove('speaking');
                this.voiceStatus.classList.remove('active', 'error');
                break;
            case 'error':
                statusText.textContent = 'Error occurred';
                this.voiceStatus.classList.add('error');
                break;
        }
    }
}

// Create voice assistant after visualizer loads
document.addEventListener('DOMContentLoaded', () => {
    const visualizer = window.visualizer;
    if (visualizer) {
        window.voiceAssistant = new VoiceAssistant(visualizer);
    }
});