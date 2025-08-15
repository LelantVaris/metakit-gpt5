// Enhanced Workflow Visualization Engine
class EnhancedWorkflowVisualizer {
    constructor() {
        this.canvas = document.getElementById('workflow-canvas');
        this.nodesGroup = document.getElementById('nodes');
        this.connectionsGroup = document.getElementById('connections');
        this.nodeDetails = document.getElementById('node-details');
        
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.hoveredNode = null;
        this.criticalPath = [];
        
        this.nodeWidth = 180;
        this.nodeHeight = 80;
        this.nodeSpacing = { x: 250, y: 120 };
        
        // Enhanced features
        this.nodeStats = new Map();
        this.nodeGroups = new Map();
        this.executionTimes = new Map();
        this.filterActive = false;
        this.searchTerm = '';
        
        this.initEnhancements();
        this.loadWorkflow();
        setInterval(() => this.loadWorkflow(), 2000);
    }
    
    initEnhancements() {
        // Add search functionality
        this.createSearchBar();
        
        // Add filter buttons
        this.createFilterButtons();
        
        // Add performance overlay
        this.createPerformanceOverlay();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Add keyboard shortcuts
        this.initKeyboardShortcuts();
    }
    
    createSearchBar() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="node-search" placeholder="Search nodes... (Ctrl+F)">
            <button id="clear-search">✕</button>
        `;
        
        const workflowContainer = document.querySelector('.workflow-container');
        workflowContainer.insertBefore(searchContainer, workflowContainer.firstChild);
        
        const searchInput = document.getElementById('node-search');
        searchInput.addEventListener('input', (e) => this.searchNodes(e.target.value));
        
        document.getElementById('clear-search').addEventListener('click', () => {
            searchInput.value = '';
            this.searchNodes('');
        });
    }
    
    createFilterButtons() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <button class="filter-btn" data-type="all">All Nodes</button>
            <button class="filter-btn" data-type="checklist">Checklists</button>
            <button class="filter-btn" data-type="process">Processing</button>
            <button class="filter-btn" data-type="api">API Calls</button>
            <button class="filter-btn" data-type="decision">Decisions</button>
            <button class="filter-btn" data-type="critical">Critical Path</button>
        `;
        
        const header = document.querySelector('header');
        header.appendChild(filterContainer);
        
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.filterNodes(e.target.dataset.type);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }
    
    createPerformanceOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'performance-overlay';
        overlay.id = 'performance-overlay';
        overlay.style.display = 'none';
        
        document.querySelector('.workflow-container').appendChild(overlay);
    }
    
    initTooltips() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'node-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F for search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('node-search').focus();
            }
            
            // ESC to clear selection
            if (e.key === 'Escape') {
                this.clearSelection();
            }
            
            // Arrow keys to navigate between nodes
            if (this.selectedNode && e.key.startsWith('Arrow')) {
                this.navigateNodes(e.key);
            }
            
            // P for performance view
            if (e.key === 'p' && !e.ctrlKey) {
                this.togglePerformanceView();
            }
        });
    }
    
    async loadWorkflow() {
        try {
            const response = await fetch('/workflow.json?' + Date.now());
            const data = await response.json();
            
            // Calculate additional metrics
            this.calculateMetrics(data);
            
            // Update visualization
            this.updateWorkflow(data);
            this.updateLastUpdated();
            document.getElementById('script-status').textContent = 'Connected';
        } catch (error) {
            console.error('Failed to load workflow:', error);
            document.getElementById('script-status').textContent = 'Error loading';
        }
    }
    
    calculateMetrics(workflow) {
        // Calculate node statistics
        workflow.nodes.forEach(node => {
            const incomingConnections = workflow.connections.filter(c => c.to === node.id).length;
            const outgoingConnections = workflow.connections.filter(c => c.from === node.id).length;
            
            this.nodeStats.set(node.id, {
                incoming: incomingConnections,
                outgoing: outgoingConnections,
                complexity: incomingConnections + outgoingConnections,
                depth: this.calculateNodeDepth(node.id, workflow)
            });
            
            // Estimate execution times (mock data for demonstration)
            const baseTime = {
                'input': 100,
                'process': 500,
                'checklist': 300,
                'decision': 50,
                'api': 2000
            };
            
            this.executionTimes.set(node.id, {
                min: baseTime[node.type] * 0.8,
                avg: baseTime[node.type],
                max: baseTime[node.type] * 1.5
            });
        });
        
        // Identify node groups
        this.identifyNodeGroups(workflow);
        
        // Calculate critical path
        this.calculateCriticalPath(workflow);
    }
    
    calculateNodeDepth(nodeId, workflow, visited = new Set()) {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        
        const incoming = workflow.connections.filter(c => c.to === nodeId);
        if (incoming.length === 0) return 0;
        
        return 1 + Math.max(...incoming.map(c => 
            this.calculateNodeDepth(c.from, workflow, visited)));
    }
    
    identifyNodeGroups(workflow) {
        // Group nodes by their primary function
        const groups = {
            'input': [],
            'validation': [],
            'processing': [],
            'output': []
        };
        
        workflow.nodes.forEach(node => {
            if (node.type === 'input' || node.id === 'start' || node.id === 'output') {
                groups.input.push(node.id);
            } else if (node.type === 'checklist') {
                groups.validation.push(node.id);
            } else if (node.type === 'process' || node.type === 'api') {
                groups.processing.push(node.id);
            } else {
                groups.output.push(node.id);
            }
        });
        
        this.nodeGroups = groups;
    }
    
    calculateCriticalPath(workflow) {
        // Simple critical path calculation (longest path from start to end)
        const startNode = workflow.nodes.find(n => n.id === 'start');
        const endNode = workflow.nodes.find(n => n.id === 'output');
        
        if (!startNode || !endNode) return;
        
        const paths = this.findAllPaths(startNode.id, endNode.id, workflow);
        
        // Find the longest path (by estimated time)
        let maxTime = 0;
        let criticalPath = [];
        
        paths.forEach(path => {
            const pathTime = path.reduce((sum, nodeId) => {
                const time = this.executionTimes.get(nodeId);
                return sum + (time ? time.avg : 0);
            }, 0);
            
            if (pathTime > maxTime) {
                maxTime = pathTime;
                criticalPath = path;
            }
        });
        
        this.criticalPath = criticalPath;
    }
    
    findAllPaths(start, end, workflow, currentPath = [], visited = new Set()) {
        if (visited.has(start)) return [];
        
        currentPath = [...currentPath, start];
        visited.add(start);
        
        if (start === end) {
            return [currentPath];
        }
        
        const outgoing = workflow.connections.filter(c => c.from === start);
        const paths = [];
        
        outgoing.forEach(conn => {
            const subPaths = this.findAllPaths(conn.to, end, workflow, currentPath, new Set(visited));
            paths.push(...subPaths);
        });
        
        return paths;
    }
    
    updateWorkflow(workflow) {
        // Clear existing elements
        this.nodesGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';
        this.nodes = [];
        this.connections = [];
        
        // Create gradients
        this.createGradients();
        
        // Create group backgrounds
        this.createGroupBackgrounds(workflow);
        
        // Create connections with enhanced styling
        workflow.connections.forEach(conn => {
            this.createEnhancedConnection(conn, workflow.nodes);
        });
        
        // Create nodes with enhanced features
        workflow.nodes.forEach(nodeData => {
            this.createEnhancedNode(nodeData);
        });
        
        // Update metrics
        this.updateEnhancedMetrics(workflow);
    }
    
    createGroupBackgrounds(workflow) {
        const groupColors = {
            'validation': 'rgba(156, 39, 176, 0.05)',
            'processing': 'rgba(76, 175, 80, 0.05)',
            'input': 'rgba(102, 126, 234, 0.05)',
            'output': 'rgba(255, 193, 7, 0.05)'
        };
        
        Object.entries(this.nodeGroups).forEach(([groupName, nodeIds]) => {
            if (nodeIds.length === 0) return;
            
            const nodes = nodeIds.map(id => workflow.nodes.find(n => n.id === id)).filter(Boolean);
            if (nodes.length === 0) return;
            
            const minX = Math.min(...nodes.map(n => n.x)) - 20;
            const minY = Math.min(...nodes.map(n => n.y)) - 20;
            const maxX = Math.max(...nodes.map(n => n.x)) + this.nodeWidth + 20;
            const maxY = Math.max(...nodes.map(n => n.y)) + this.nodeHeight + 20;
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'group-background');
            rect.setAttribute('x', minX);
            rect.setAttribute('y', minY);
            rect.setAttribute('width', maxX - minX);
            rect.setAttribute('height', maxY - minY);
            rect.setAttribute('fill', groupColors[groupName] || 'rgba(200, 200, 200, 0.05)');
            rect.setAttribute('rx', '15');
            rect.setAttribute('ry', '15');
            
            this.connectionsGroup.appendChild(rect);
        });
    }
    
    createEnhancedNode(nodeData) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'workflow-node enhanced');
        group.setAttribute('transform', `translate(${nodeData.x}, ${nodeData.y})`);
        group.setAttribute('data-node-id', nodeData.id);
        
        // Background rect with gradient
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.nodeWidth);
        rect.setAttribute('height', this.nodeHeight);
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        rect.setAttribute('fill', `url(#gradient-${nodeData.type})`);
        rect.setAttribute('stroke', this.criticalPath.includes(nodeData.id) ? '#ff5722' : 'rgba(0,0,0,0.1)');
        rect.setAttribute('stroke-width', this.criticalPath.includes(nodeData.id) ? '3' : '2');
        
        // Add complexity indicator
        const stats = this.nodeStats.get(nodeData.id);
        if (stats && stats.complexity > 3) {
            const complexityIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            complexityIndicator.setAttribute('cx', this.nodeWidth - 10);
            complexityIndicator.setAttribute('cy', 10);
            complexityIndicator.setAttribute('r', '6');
            complexityIndicator.setAttribute('fill', '#ff9800');
            complexityIndicator.setAttribute('class', 'complexity-indicator');
            group.appendChild(complexityIndicator);
        }
        
        // Main text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-text');
        text.setAttribute('x', this.nodeWidth / 2);
        text.setAttribute('y', 25);
        text.textContent = nodeData.label;
        
        // Subtext
        const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtext.setAttribute('class', 'node-subtext');
        subtext.setAttribute('x', this.nodeWidth / 2);
        subtext.setAttribute('y', 45);
        subtext.textContent = nodeData.subtext || '';
        
        // Performance indicator
        const execTime = this.executionTimes.get(nodeData.id);
        if (execTime) {
            const perfText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            perfText.setAttribute('class', 'node-performance');
            perfText.setAttribute('x', this.nodeWidth / 2);
            perfText.setAttribute('y', 65);
            perfText.setAttribute('font-size', '10');
            perfText.setAttribute('fill', 'rgba(255,255,255,0.7)');
            perfText.textContent = `~${Math.round(execTime.avg)}ms`;
            group.appendChild(perfText);
        }
        
        // Connection count badges
        if (stats) {
            // Incoming connections badge
            if (stats.incoming > 0) {
                const inBadge = this.createBadge(10, this.nodeHeight - 10, stats.incoming, '#2196F3');
                group.appendChild(inBadge);
            }
            
            // Outgoing connections badge
            if (stats.outgoing > 0) {
                const outBadge = this.createBadge(this.nodeWidth - 10, this.nodeHeight - 10, stats.outgoing, '#4CAF50');
                group.appendChild(outBadge);
            }
        }
        
        group.appendChild(rect);
        group.appendChild(text);
        group.appendChild(subtext);
        
        // Event handlers
        group.addEventListener('click', () => this.selectNode(nodeData));
        group.addEventListener('mouseenter', (e) => this.showTooltip(e, nodeData));
        group.addEventListener('mouseleave', () => this.hideTooltip());
        
        this.nodesGroup.appendChild(group);
        this.nodes.push({ element: group, data: nodeData });
    }
    
    createBadge(x, y, count, color) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', color);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = count;
        
        g.appendChild(circle);
        g.appendChild(text);
        
        return g;
    }
    
    createEnhancedConnection(connData, nodes) {
        const fromNode = nodes.find(n => n.id === connData.from);
        const toNode = nodes.find(n => n.id === connData.to);
        
        if (!fromNode || !toNode) return;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'flow-line enhanced');
        
        // Check if this connection is on the critical path
        const onCriticalPath = this.criticalPath.includes(connData.from) && 
                               this.criticalPath.includes(connData.to);
        
        if (onCriticalPath) {
            path.classList.add('critical-path');
        }
        
        const x1 = fromNode.x + this.nodeWidth;
        const y1 = fromNode.y + this.nodeHeight / 2;
        const x2 = toNode.x;
        const y2 = toNode.y + this.nodeHeight / 2;
        
        const midX = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        if (connData.label) {
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.setAttribute('x', midX);
            labelText.setAttribute('y', (y1 + y2) / 2 - 10);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('font-size', '12');
            labelText.setAttribute('font-weight', 'bold');
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
    
    searchNodes(term) {
        this.searchTerm = term.toLowerCase();
        
        this.nodes.forEach(node => {
            const matches = !term || 
                          node.data.label.toLowerCase().includes(this.searchTerm) ||
                          (node.data.subtext && node.data.subtext.toLowerCase().includes(this.searchTerm)) ||
                          node.data.type.toLowerCase().includes(this.searchTerm);
            
            if (matches) {
                node.element.style.opacity = '1';
                node.element.classList.remove('dimmed');
            } else {
                node.element.style.opacity = '0.3';
                node.element.classList.add('dimmed');
            }
        });
        
        // Update connections visibility
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.data.id === conn.data.from);
            const toNode = this.nodes.find(n => n.data.id === conn.data.to);
            
            if (fromNode && toNode && 
                !fromNode.element.classList.contains('dimmed') && 
                !toNode.element.classList.contains('dimmed')) {
                conn.element.style.opacity = '1';
            } else {
                conn.element.style.opacity = '0.2';
            }
        });
    }
    
    filterNodes(type) {
        if (type === 'all') {
            this.nodes.forEach(node => {
                node.element.style.opacity = '1';
                node.element.classList.remove('filtered');
            });
            this.connections.forEach(conn => {
                conn.element.style.opacity = '1';
            });
            return;
        }
        
        if (type === 'critical') {
            this.highlightCriticalPath();
            return;
        }
        
        this.nodes.forEach(node => {
            if (node.data.type === type) {
                node.element.style.opacity = '1';
                node.element.classList.remove('filtered');
            } else {
                node.element.style.opacity = '0.2';
                node.element.classList.add('filtered');
            }
        });
        
        // Update connections
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.data.id === conn.data.from);
            const toNode = this.nodes.find(n => n.data.id === conn.data.to);
            
            if (fromNode && toNode && 
                !fromNode.element.classList.contains('filtered') && 
                !toNode.element.classList.contains('filtered')) {
                conn.element.style.opacity = '1';
            } else {
                conn.element.style.opacity = '0.1';
            }
        });
    }
    
    highlightCriticalPath() {
        this.nodes.forEach(node => {
            if (this.criticalPath.includes(node.data.id)) {
                node.element.style.opacity = '1';
                node.element.classList.add('critical-node');
            } else {
                node.element.style.opacity = '0.3';
                node.element.classList.remove('critical-node');
            }
        });
        
        this.connections.forEach(conn => {
            const onPath = this.criticalPath.includes(conn.data.from) && 
                          this.criticalPath.includes(conn.data.to);
            conn.element.style.opacity = onPath ? '1' : '0.2';
        });
    }
    
    showTooltip(event, nodeData) {
        const stats = this.nodeStats.get(nodeData.id);
        const execTime = this.executionTimes.get(nodeData.id);
        
        let content = `
            <div class="tooltip-header">${nodeData.label}</div>
            <div class="tooltip-type">${nodeData.type.toUpperCase()}</div>
        `;
        
        if (stats) {
            content += `
                <div class="tooltip-stats">
                    <div>Incoming: ${stats.incoming}</div>
                    <div>Outgoing: ${stats.outgoing}</div>
                    <div>Complexity: ${stats.complexity}</div>
                    <div>Depth: ${stats.depth}</div>
                </div>
            `;
        }
        
        if (execTime) {
            content += `
                <div class="tooltip-performance">
                    <div>Min: ${Math.round(execTime.min)}ms</div>
                    <div>Avg: ${Math.round(execTime.avg)}ms</div>
                    <div>Max: ${Math.round(execTime.max)}ms</div>
                </div>
            `;
        }
        
        if (this.criticalPath.includes(nodeData.id)) {
            content += '<div class="tooltip-critical">⚠️ On Critical Path</div>';
        }
        
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        this.tooltip.style.left = rect.left + rect.width / 2 + 'px';
        this.tooltip.style.top = rect.top - 10 + 'px';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    togglePerformanceView() {
        const overlay = document.getElementById('performance-overlay');
        
        if (overlay.style.display === 'none') {
            // Calculate total execution time
            let totalTime = 0;
            this.criticalPath.forEach(nodeId => {
                const time = this.executionTimes.get(nodeId);
                if (time) totalTime += time.avg;
            });
            
            // Create performance summary
            let html = `
                <div class="performance-summary">
                    <h3>Performance Analysis</h3>
                    <div class="perf-metric">
                        <span>Critical Path Time:</span>
                        <strong>${Math.round(totalTime)}ms</strong>
                    </div>
                    <div class="perf-metric">
                        <span>Critical Path Nodes:</span>
                        <strong>${this.criticalPath.length}</strong>
                    </div>
                    <h4>Bottlenecks:</h4>
                    <ul>
            `;
            
            // Find bottlenecks (nodes with highest execution time)
            const bottlenecks = Array.from(this.executionTimes.entries())
                .sort((a, b) => b[1].avg - a[1].avg)
                .slice(0, 5);
            
            bottlenecks.forEach(([nodeId, time]) => {
                const node = this.nodes.find(n => n.data.id === nodeId);
                if (node) {
                    html += `<li>${node.data.label}: ${Math.round(time.avg)}ms</li>`;
                }
            });
            
            html += `
                    </ul>
                    <button onclick="this.parentElement.parentElement.style.display='none'">Close</button>
                </div>
            `;
            
            overlay.innerHTML = html;
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }
    
    navigateNodes(direction) {
        // Implementation for keyboard navigation between nodes
        const currentIndex = this.nodes.findIndex(n => n.data.id === this.selectedNode.id);
        let newIndex = currentIndex;
        
        switch(direction) {
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % this.nodes.length;
                break;
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + this.nodes.length) % this.nodes.length;
                break;
        }
        
        if (newIndex !== currentIndex) {
            this.selectNode(this.nodes[newIndex].data);
        }
    }
    
    clearSelection() {
        this.nodes.forEach(node => {
            node.element.classList.remove('active');
        });
        this.selectedNode = null;
        this.nodeDetails.innerHTML = '<p class="placeholder">Click on a node to view details</p>';
    }
    
    selectNode(nodeData) {
        this.nodes.forEach(node => {
            node.element.classList.remove('active');
        });
        
        const selectedElement = this.nodes.find(n => n.data.id === nodeData.id);
        if (selectedElement) {
            selectedElement.element.classList.add('active');
        }
        
        this.selectedNode = nodeData;
        this.showEnhancedNodeDetails(nodeData);
    }
    
    showEnhancedNodeDetails(nodeData) {
        const stats = this.nodeStats.get(nodeData.id);
        const execTime = this.executionTimes.get(nodeData.id);
        const onCriticalPath = this.criticalPath.includes(nodeData.id);
        
        let html = `
            <div class="detail-section">
                <div class="detail-label">Node: ${nodeData.label}</div>
                <div class="detail-value">${nodeData.subtext || ''}</div>
                ${onCriticalPath ? '<div class="critical-badge">Critical Path</div>' : ''}
            </div>
            <div class="detail-section">
                <div class="detail-label">Type: ${nodeData.type.toUpperCase()}</div>
                <div class="detail-value">ID: ${nodeData.id}</div>
            </div>
        `;
        
        if (stats) {
            html += `
                <div class="detail-section">
                    <div class="detail-label">Connections:</div>
                    <div class="detail-value">
                        <div>→ Incoming: ${stats.incoming}</div>
                        <div>← Outgoing: ${stats.outgoing}</div>
                        <div>⚡ Complexity: ${stats.complexity}</div>
                        <div>📊 Depth Level: ${stats.depth}</div>
                    </div>
                </div>
            `;
        }
        
        if (execTime) {
            html += `
                <div class="detail-section">
                    <div class="detail-label">Performance:</div>
                    <div class="detail-value">
                        <div>⏱️ Min: ${Math.round(execTime.min)}ms</div>
                        <div>⏱️ Avg: ${Math.round(execTime.avg)}ms</div>
                        <div>⏱️ Max: ${Math.round(execTime.max)}ms</div>
                    </div>
                </div>
            `;
        }
        
        // Add connected nodes information
        const connections = this.findConnectedNodes(nodeData.id);
        if (connections.from.length > 0 || connections.to.length > 0) {
            html += `
                <div class="detail-section">
                    <div class="detail-label">Connected Nodes:</div>
                    <div class="detail-value">
            `;
            
            if (connections.from.length > 0) {
                html += '<div class="connection-list">Receives from:</div><ul class="detail-list">';
                connections.from.forEach(nodeId => {
                    const node = this.nodes.find(n => n.data.id === nodeId);
                    if (node) {
                        html += `<li class="clickable-node" data-node-id="${nodeId}">${node.data.label}</li>`;
                    }
                });
                html += '</ul>';
            }
            
            if (connections.to.length > 0) {
                html += '<div class="connection-list">Sends to:</div><ul class="detail-list">';
                connections.to.forEach(nodeId => {
                    const node = this.nodes.find(n => n.data.id === nodeId);
                    if (node) {
                        html += `<li class="clickable-node" data-node-id="${nodeId}">${node.data.label}</li>`;
                    }
                });
                html += '</ul>';
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        this.nodeDetails.innerHTML = html;
        
        // Add click handlers for connected nodes
        this.nodeDetails.querySelectorAll('.clickable-node').forEach(el => {
            el.addEventListener('click', () => {
                const nodeId = el.dataset.nodeId;
                const node = this.nodes.find(n => n.data.id === nodeId);
                if (node) this.selectNode(node.data);
            });
        });
    }
    
    findConnectedNodes(nodeId) {
        const from = this.connections
            .filter(c => c.data.to === nodeId)
            .map(c => c.data.from);
        
        const to = this.connections
            .filter(c => c.data.from === nodeId)
            .map(c => c.data.to);
        
        return { from, to };
    }
    
    updateEnhancedMetrics(workflow) {
        // Update standard metrics
        document.getElementById('total-nodes').textContent = workflow.nodes.length;
        document.getElementById('total-checklists').textContent = 
            workflow.nodes.filter(n => n.type === 'checklist').length;
        document.getElementById('processing-steps').textContent = 
            workflow.nodes.filter(n => n.type === 'process').length;
        document.getElementById('decision-points').textContent = 
            workflow.nodes.filter(n => n.type === 'decision').length;
        
        // Add new metrics if container exists
        let enhancedMetrics = document.getElementById('enhanced-metrics');
        if (!enhancedMetrics) {
            enhancedMetrics = document.createElement('div');
            enhancedMetrics.id = 'enhanced-metrics';
            enhancedMetrics.className = 'metrics-panel';
            enhancedMetrics.innerHTML = '<h2>Advanced Metrics</h2>';
            document.querySelector('.sidebar').appendChild(enhancedMetrics);
        }
        
        const totalComplexity = Array.from(this.nodeStats.values())
            .reduce((sum, stats) => sum + stats.complexity, 0);
        
        const avgComplexity = (totalComplexity / this.nodeStats.size).toFixed(1);
        
        const criticalTime = this.criticalPath.reduce((sum, nodeId) => {
            const time = this.executionTimes.get(nodeId);
            return sum + (time ? time.avg : 0);
        }, 0);
        
        enhancedMetrics.innerHTML = `
            <h2>Advanced Metrics</h2>
            <div class="metric">
                <span class="metric-label">Avg Complexity:</span>
                <span class="metric-value">${avgComplexity}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Critical Path:</span>
                <span class="metric-value">${this.criticalPath.length} nodes</span>
            </div>
            <div class="metric">
                <span class="metric-label">Est. Runtime:</span>
                <span class="metric-value">${Math.round(criticalTime)}ms</span>
            </div>
            <div class="metric">
                <span class="metric-label">API Calls:</span>
                <span class="metric-value">${workflow.nodes.filter(n => n.type === 'api').length}</span>
            </div>
        `;
    }
    
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('last-updated').textContent = now.toLocaleTimeString();
    }
    
    createGradients() {
        const existingDefs = this.canvas.querySelector('defs');
        const gradients = [
            { id: 'gradient-input', colors: ['#667eea', '#764ba2'] },
            { id: 'gradient-process', colors: ['#4CAF50', '#45a049'] },
            { id: 'gradient-decision', colors: ['#FFC107', '#FFA000'] },
            { id: 'gradient-api', colors: ['#2196F3', '#1976D2'] },
            { id: 'gradient-checklist', colors: ['#9C27B0', '#7B1FA2'] }
        ];
        
        gradients.forEach(({ id, colors }) => {
            if (!document.getElementById(id)) {
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
                existingDefs.appendChild(grad);
            }
        });
    }
}

// Initialize enhanced visualizer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.enhancedVisualizer = new EnhancedWorkflowVisualizer();
    });
} else {
    window.enhancedVisualizer = new EnhancedWorkflowVisualizer();
}