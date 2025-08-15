// 3D Workflow Visualizer using Three.js

let scene, camera, renderer, controls;
let nodes = [];
let connections = [];
let raycaster, mouse;
let autoRotate = true;
let hoveredNode = null;
let tooltip;
let particles = [];
let executionPath = [];
let isSimulating = false;
let simulationStep = 0;
let clock = new THREE.Clock();

// Node colors by type
const nodeColors = {
    input: 0x667eea,
    process: 0x4CAF50,
    decision: 0xFFC107,
    api: 0x2196F3,
    checklist: 0x9C27B0
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 100, 500);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 50, 100);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Controls (requires OrbitControls)
    addOrbitControls();
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Tooltip
    tooltip = document.getElementById('tooltip');
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Load workflow data
    loadWorkflow();
    
    // Start animation
    animate();
}

function addOrbitControls() {
    // Simple orbit controls implementation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };
        
        if (e.buttons === 1) { // Left click - rotate
            const rotationSpeed = 0.005;
            camera.position.x = camera.position.x * Math.cos(deltaMove.x * rotationSpeed) - camera.position.z * Math.sin(deltaMove.x * rotationSpeed);
            camera.position.z = camera.position.x * Math.sin(deltaMove.x * rotationSpeed) + camera.position.z * Math.cos(deltaMove.x * rotationSpeed);
            camera.position.y += deltaMove.y * 0.2;
            camera.lookAt(0, 0, 0);
        }
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    renderer.domElement.addEventListener('wheel', (e) => {
        const zoomSpeed = 0.1;
        const scale = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        camera.position.multiplyScalar(scale);
    });
}

async function loadWorkflow() {
    try {
        const response = await fetch('/workflow.json');
        const data = await response.json();
        createWorkflowNodes(data.nodes);
        createConnections(data.connections, data.nodes);
    } catch (error) {
        console.error('Failed to load workflow:', error);
        // Use default data if fetch fails
        createDefaultWorkflow();
    }
}

function createWorkflowNodes(nodeData) {
    nodeData.forEach((node, index) => {
        // Create 3D box for each node
        const geometry = new THREE.BoxGeometry(15, 8, 4);
        const material = new THREE.MeshPhongMaterial({
            color: nodeColors[node.type] || 0x888888,
            emissive: nodeColors[node.type] || 0x888888,
            emissiveIntensity: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Position nodes in 3D space
        const x = (node.x - 700) * 0.1;
        const z = (node.y - 400) * 0.1;
        const y = node.type === 'api' ? 10 : 0;
        
        mesh.position.set(x, y, z);
        mesh.userData = node;
        
        // Add text sprite
        const sprite = createTextSprite(node.label, node.type);
        sprite.position.set(x, y + 6, z);
        
        scene.add(mesh);
        scene.add(sprite);
        nodes.push({ mesh, sprite, data: node });
    });
}

function createTextSprite(text, type) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '20px Arial';
    context.fillStyle = '#333';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 3.75, 1);
    
    return sprite;
}

function createConnections(connectionData, nodeData) {
    connectionData.forEach(conn => {
        const fromNode = nodeData.find(n => n.id === conn.from);
        const toNode = nodeData.find(n => n.id === conn.to);
        
        if (!fromNode || !toNode) return;
        
        const points = [];
        const from = new THREE.Vector3(
            (fromNode.x - 700) * 0.1,
            fromNode.type === 'api' ? 10 : 0,
            (fromNode.y - 400) * 0.1
        );
        const to = new THREE.Vector3(
            (toNode.x - 700) * 0.1,
            toNode.type === 'api' ? 10 : 0,
            (toNode.y - 400) * 0.1
        );
        
        // Create curved path
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.y += 5;
        
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        points.push(...curve.getPoints(20));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: conn.label === 'Yes' ? 0x4CAF50 : 
                   conn.label === 'No' ? 0xf44336 : 0x999999,
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        connections.push(line);
    });
}

function createDefaultWorkflow() {
    // Create a simple default workflow if JSON fails to load
    const defaultNodes = [
        { id: 'start', type: 'input', label: 'Start', x: 100, y: 100 },
        { id: 'process', type: 'process', label: 'Process', x: 300, y: 100 },
        { id: 'end', type: 'input', label: 'End', x: 500, y: 100 }
    ];
    
    createWorkflowNodes(defaultNodes);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Check for hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh));
    
    if (intersects.length > 0) {
        const node = intersects[0].object;
        if (hoveredNode !== node) {
            if (hoveredNode) {
                hoveredNode.material.emissiveIntensity = 0.1;
            }
            hoveredNode = node;
            node.material.emissiveIntensity = 0.3;
            
            // Show tooltip
            showTooltip(event, node.userData);
        }
    } else {
        if (hoveredNode) {
            hoveredNode.material.emissiveIntensity = 0.1;
            hoveredNode = null;
            hideTooltip();
        }
    }
}

function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh));
    
    if (intersects.length > 0) {
        const node = intersects[0].object;
        
        // Check if this is a checklist item
        if (node.userData.id && node.userData.id.match(/^[A-Z]+\d+$/)) {
            showCheckDetails(node.userData);
        } else {
            focusOnNode(node);
            showDetailPanel(node.userData);
        }
    }
}

// Enhanced detail display for individual checks
function showCheckDetails(check) {
    const panel = document.getElementById('detailPanel');
    const title = document.getElementById('detailTitle');
    const subtitle = document.getElementById('detailSubtitle');
    const content = document.getElementById('detailContent');
    
    title.textContent = `${check.id}: ${check.label}`;
    subtitle.textContent = check.description;
    
    // Build detailed parameter display
    let html = '';
    
    // Severity and auto-fix badges
    html += '<div class="detail-section">';
    html += '<div style="display: flex; gap: 10px; margin-bottom: 15px;">';
    html += `<span style="padding: 4px 12px; background: ${getSeverityColor(check.params.severity)}; color: white; border-radius: 4px; font-size: 12px; font-weight: 600;">${check.params.severity.toUpperCase()}</span>`;
    if (check.params.auto_fixable) {
        html += '<span style="padding: 4px 12px; background: #4CAF50; color: white; border-radius: 4px; font-size: 12px;">✓ Auto-fixable</span>';
    } else {
        html += '<span style="padding: 4px 12px; background: #FF9800; color: white; border-radius: 4px; font-size: 12px;">Manual Review</span>';
    }
    html += '</div>';
    html += '</div>';
    
    // Detection method
    html += '<div class="detail-section">';
    html += '<h3>Detection Method</h3>';
    html += `<p style="font-size: 14px; color: #555;">${check.params.detection || 'Pattern-based detection'}</p>`;
    html += '</div>';
    
    // Patterns to check
    if (check.params.patterns && check.params.patterns.length > 0) {
        html += '<div class="detail-section">';
        html += '<h3>Patterns Checked</h3>';
        html += '<div class="example-box">';
        html += '<ul class="detail-list">';
        check.params.patterns.forEach(pattern => {
            html += `<li><code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${escapeHtml(pattern)}</code></li>`;
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';
    }
    
    // Avoid patterns
    if (check.params.avoid_patterns && check.params.avoid_patterns.length > 0) {
        html += '<div class="detail-section">';
        html += '<h3>Patterns to Avoid</h3>';
        html += '<div class="example-box example-before">';
        html += '<ul class="detail-list">';
        check.params.avoid_patterns.forEach(pattern => {
            html += `<li style="color: #d32f2f;"><code style="background: #ffebee; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${escapeHtml(pattern)}</code></li>`;
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';
    }
    
    // Thresholds and limits
    html += '<div class="detail-section">';
    html += '<h3>Parameters & Thresholds</h3>';
    html += '<div class="metric-grid">';
    
    if (check.params.min_count !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Minimum Count</div>';
        html += `<div class="metric-value">${check.params.min_count}</div>`;
        html += '</div>';
    }
    
    if (check.params.max_count !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Maximum Count</div>';
        html += `<div class="metric-value">${check.params.max_count}</div>`;
        html += '</div>';
    }
    
    if (check.params.max_lines !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Max Lines</div>';
        html += `<div class="metric-value">${check.params.max_lines}</div>`;
        html += '</div>';
    }
    
    if (check.params.max_words !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Max Words</div>';
        html += `<div class="metric-value">${check.params.max_words}</div>`;
        html += '</div>';
    }
    
    if (check.params.min_words !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Min Words</div>';
        html += `<div class="metric-value">${check.params.min_words}</div>`;
        html += '</div>';
    }
    
    if (check.params.readability_max !== undefined) {
        html += '<div class="metric-item">';
        html += '<div class="metric-label">Max Readability Score</div>';
        html += `<div class="metric-value">${check.params.readability_max}</div>`;
        html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    // Examples section
    html += '<div class="detail-section">';
    html += '<h3>How This Check Works</h3>';
    html += '<div class="example-box">';
    html += '<h4>Purpose</h4>';
    html += `<p>${getCheckPurpose(check)}</p>`;
    html += '</div>';
    
    if (check.params.auto_fixable) {
        html += '<div class="example-box">';
        html += '<h4>Auto-Fix Capability</h4>';
        html += '<p>This check can be automatically fixed by the AI optimizer. The system will:</p>';
        html += '<ul style="margin: 8px 0; padding-left: 20px; font-size: 12px;">';
        html += `<li>${getAutoFixDescription(check)}</li>`;
        html += '</ul>';
        html += '</div>';
    }
    html += '</div>';
    
    // Impact score
    html += '<div class="detail-section">';
    html += '<h3>Quality Impact</h3>';
    html += `<div style="display: flex; align-items: center; gap: 15px;">`;
    html += `<div style="flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">`;
    const impactScore = getImpactScore(check.params.severity);
    html += `<div style="width: ${impactScore}%; height: 100%; background: ${getSeverityColor(check.params.severity)};"></div>`;
    html += `</div>`;
    html += `<span style="font-weight: 600; color: ${getSeverityColor(check.params.severity)};">${impactScore}%</span>`;
    html += `</div>`;
    html += '</div>';
    
    content.innerHTML = html;
    panel.classList.add('visible');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getSeverityColor(severity) {
    switch(severity) {
        case 'critical': return '#d32f2f';
        case 'high': return '#f57c00';
        case 'medium': return '#fbc02d';
        case 'low': return '#689f38';
        default: return '#757575';
    }
}

function getImpactScore(severity) {
    switch(severity) {
        case 'critical': return 100;
        case 'high': return 75;
        case 'medium': return 50;
        case 'low': return 25;
        default: return 0;
    }
}

function getCheckPurpose(check) {
    const purposes = {
        'P001': 'Ensures content sounds natural and conversational by using contractions like "don\'t" and "it\'s" instead of formal "do not" and "it is".',
        'P002': 'Creates a direct connection with readers by addressing them as "you" rather than using third-person references.',
        'V001': 'Verifies content provides genuine value through actionable insights rather than generic information.',
        'V002': 'Ensures credibility by including real company examples with specific names and results.',
        'O001': 'Checks that content offers a unique perspective rather than rehashing common knowledge.',
        'D001': 'Eliminates unnecessary filler words that dilute the message and waste reader time.',
        'AI001': 'Detects and removes AI-generated patterns that make content sound robotic.',
        'NLP001': 'Optimizes sentence structure for better comprehension and search engine understanding.',
        'S001': 'Ensures primary keyword appears early to signal relevance to search engines.'
    };
    return purposes[check.id] || 'Ensures content meets quality standards for better engagement and performance.';
}

function getAutoFixDescription(check) {
    const descriptions = {
        'P001': 'Replace formal phrases with contractions',
        'P002': 'Rewrite sentences to directly address the reader',
        'V002': 'Add specific company examples and case studies',
        'D001': 'Remove filler phrases and transitional words',
        'D002': 'Break long paragraphs into shorter, scannable sections',
        'AI001': 'Rewrite sentences to avoid AI patterns',
        'NLP001': 'Restructure sentences to Subject-Verb-Object format',
        'S001': 'Move primary keyword to the beginning of content'
    };
    return descriptions[check.id] || 'Apply appropriate fixes based on the check requirements';
}

function showDetailPanel(nodeData) {
    const panel = document.getElementById('detailPanel');
    const title = document.getElementById('detailTitle');
    const subtitle = document.getElementById('detailSubtitle');
    const content = document.getElementById('detailContent');
    
    title.textContent = nodeData.label;
    subtitle.textContent = nodeData.subtext || nodeData.type;
    
    let html = '';
    
    if (nodeData.details) {
        // Description section
        html += `<div class="detail-section">
            <h3>Description</h3>
            <p>${nodeData.details.description}</p>
        </div>`;
        
        // Fixes section
        if (nodeData.details.fixes) {
            html += `<div class="detail-section">
                <h3>Fixes Applied</h3>
                <ul class="detail-list">`;
            nodeData.details.fixes.forEach(fix => {
                html += `<li>${fix}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Examples section
        if (nodeData.details.examples) {
            html += `<div class="detail-section">
                <h3>Before & After Examples</h3>
                <div class="example-box">
                    <h4>Before:</h4>
                    <p class="example-before">${nodeData.details.examples.before}</p>
                    <h4>After:</h4>
                    <p class="example-after">${nodeData.details.examples.after}</p>
                    <h4>Explanation:</h4>
                    <p>${nodeData.details.examples.explanation}</p>
                </div>
            </div>`;
        }
        
        // Metrics section
        if (nodeData.details.metrics || nodeData.details.scores) {
            const metrics = nodeData.details.metrics || nodeData.details.scores;
            html += `<div class="detail-section">
                <h3>Metrics</h3>
                <div class="metric-grid">`;
            
            for (const [key, value] of Object.entries(metrics)) {
                html += `<div class="metric-item">
                    <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div class="metric-value">${value}</div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        // Patterns section
        if (nodeData.details.patterns) {
            html += `<div class="detail-section">
                <h3>Patterns Detected</h3>
                <ul class="detail-list">`;
            nodeData.details.patterns.forEach(pattern => {
                html += `<li>"${pattern}"</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Rules section
        if (nodeData.details.rules) {
            html += `<div class="detail-section">
                <h3>Rules & Guidelines</h3>
                <ul class="detail-list">`;
            nodeData.details.rules.forEach(rule => {
                html += `<li>${rule}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Techniques section
        if (nodeData.details.techniques) {
            html += `<div class="detail-section">
                <h3>Techniques</h3>
                <ul class="detail-list">`;
            nodeData.details.techniques.forEach(technique => {
                html += `<li>${technique}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Humanization section
        if (nodeData.details.humanization) {
            html += `<div class="detail-section">
                <h3>Humanization Strategies</h3>`;
            
            if (nodeData.details.humanization.techniques) {
                html += `<h4 style="margin-top: 10px; font-size: 13px;">Techniques:</h4>
                <ul class="detail-list">`;
                nodeData.details.humanization.techniques.forEach(tech => {
                    html += `<li>${tech}</li>`;
                });
                html += `</ul>`;
            }
            
            if (nodeData.details.humanization.voiceTraits) {
                html += `<h4 style="margin-top: 10px; font-size: 13px;">Voice Traits:</h4>
                <ul class="detail-list">`;
                nodeData.details.humanization.voiceTraits.forEach(trait => {
                    html += `<li>${trait}</li>`;
                });
                html += `</ul>`;
            }
            html += `</div>`;
        }
        
        // Detection section
        if (nodeData.details.detection) {
            html += `<div class="detail-section">
                <h3>AI Detection Analysis</h3>
                <div class="metric-grid">`;
            
            for (const [key, value] of Object.entries(nodeData.details.detection)) {
                html += `<div class="metric-item">
                    <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div class="metric-value">${value}</div>
                </div>`;
            }
            html += `</div></div>`;
        }
    } else if (nodeData.type === 'checklist') {
        // For checklist nodes, show what they check
        html += `<div class="detail-section">
            <h3>Checklist Details</h3>
            <p>This node performs quality checks on the content.</p>
            <ul class="detail-list">
                <li>Validates against predefined rules</li>
                <li>Scores content quality</li>
                <li>Identifies areas for improvement</li>
                <li>Generates fix recommendations</li>
            </ul>
        </div>`;
        
        if (nodeData.id === 'check-master') {
            html += `<div class="detail-section">
                <h3>Master Checklist Items</h3>
                <ul class="detail-list">
                    <li>Content completeness and depth</li>
                    <li>Logical flow and structure</li>
                    <li>Evidence and citation quality</li>
                    <li>Actionable insights presence</li>
                    <li>Target audience alignment</li>
                    <li>Call-to-action effectiveness</li>
                    <li>Visual content recommendations</li>
                    <li>Internal/external linking strategy</li>
                </ul>
            </div>`;
        }
    } else {
        // Generic node information
        html += `<div class="detail-section">
            <h3>Node Information</h3>
            <p>Type: ${nodeData.type}</p>
            <p>ID: ${nodeData.id}</p>
            <p>Position: (${nodeData.x}, ${nodeData.y})</p>
        </div>`;
    }
    
    content.innerHTML = html;
    panel.classList.add('visible');
}

window.closeDetailPanel = function() {
    document.getElementById('detailPanel').classList.remove('visible');
};

function focusOnNode(node) {
    // Animate camera to focus on selected node
    const targetPosition = node.position.clone();
    targetPosition.y += 30;
    targetPosition.z += 30;
    
    animateCamera(targetPosition);
}

function animateCamera(targetPosition) {
    const startPosition = camera.position.clone();
    const duration = 1000;
    const startTime = Date.now();
    
    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        }
    }
    
    updateCamera();
}

function showTooltip(event, nodeData) {
    let content = `<h3>${nodeData.label}</h3>`;
    content += `<p>${nodeData.subtext || ''}</p>`;
    
    if (nodeData.details) {
        content += `<p>${nodeData.details.description || ''}</p>`;
        
        if (nodeData.details.fixes) {
            content += '<p><strong>Fixes:</strong></p>';
            content += '<ul style="margin: 0; padding-left: 20px; font-size: 11px;">';
            nodeData.details.fixes.forEach(fix => {
                content += `<li>${fix}</li>`;
            });
            content += '</ul>';
        }
    }
    
    tooltip.innerHTML = content;
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY + 10 + 'px';
    tooltip.classList.add('visible');
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // Auto-rotate camera
    if (autoRotate) {
        const rotationSpeed = 0.001;
        camera.position.x = camera.position.x * Math.cos(rotationSpeed) - camera.position.z * Math.sin(rotationSpeed);
        camera.position.z = camera.position.x * Math.sin(rotationSpeed) + camera.position.z * Math.cos(rotationSpeed);
        camera.lookAt(0, 0, 0);
    }
    
    // Animate nodes slightly
    nodes.forEach((node, index) => {
        const time = Date.now() * 0.001;
        node.mesh.position.y = node.data.type === 'api' ? 
            10 + Math.sin(time + index) * 0.5 : 
            Math.sin(time + index) * 0.2;
            
        // Pulse effect for active simulation node
        if (isSimulating && executionPath[simulationStep] === node.data.id) {
            const scale = 1 + Math.sin(time * 5) * 0.2;
            node.mesh.scale.set(scale, scale, scale);
            node.mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.3;
        } else if (node.mesh.scale.x > 1) {
            node.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            node.mesh.material.emissiveIntensity = Math.max(0.1, node.mesh.material.emissiveIntensity - 0.02);
        }
    });
    
    // Update particles
    updateParticles(delta);
    
    // Update simulation
    if (isSimulating) {
        updateSimulation();
    }
    
    renderer.render(scene, camera);
}

function updateParticles(delta) {
    particles.forEach((particle, index) => {
        if (particle.active) {
            // Move particle along path
            particle.progress += delta * 0.3;
            
            if (particle.progress >= 1) {
                particle.active = false;
                scene.remove(particle.mesh);
                particles.splice(index, 1);
            } else {
                // Calculate position along curve
                const point = particle.curve.getPoint(particle.progress);
                particle.mesh.position.copy(point);
                
                // Add glow effect
                particle.mesh.material.opacity = 1 - particle.progress * 0.5;
                const scale = 1 + Math.sin(particle.progress * Math.PI) * 0.5;
                particle.mesh.scale.set(scale, scale, scale);
            }
        }
    });
}

function createParticle(fromNode, toNode) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8,
        emissive: 0x00ff00,
        emissiveIntensity: 0.5
    });
    
    const particle = new THREE.Mesh(geometry, material);
    
    const from = new THREE.Vector3(
        fromNode.position.x,
        fromNode.position.y,
        fromNode.position.z
    );
    const to = new THREE.Vector3(
        toNode.position.x,
        toNode.position.y,
        toNode.position.z
    );
    
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += 10;
    
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    
    scene.add(particle);
    
    particles.push({
        mesh: particle,
        curve: curve,
        progress: 0,
        active: true
    });
}

function updateSimulation() {
    const time = Date.now();
    
    if (time - window.lastSimulationUpdate > 1500) { // Update every 1.5 seconds
        window.lastSimulationUpdate = time;
        
        // Move to next step
        if (simulationStep < executionPath.length - 1) {
            const currentNodeId = executionPath[simulationStep];
            const nextNodeId = executionPath[simulationStep + 1];
            
            const currentNode = nodes.find(n => n.data.id === currentNodeId);
            const nextNode = nodes.find(n => n.data.id === nextNodeId);
            
            if (currentNode && nextNode) {
                createParticle(currentNode.mesh, nextNode.mesh);
                
                // Show execution info
                showExecutionInfo(nextNode.data);
            }
            
            simulationStep++;
            
            // Update progress bar
            const progress = (simulationStep / executionPath.length) * 100;
            document.getElementById('simulationProgressBar').style.width = progress + '%';
        } else {
            // Reset simulation
            isSimulating = false;
            simulationStep = 0;
            showNotification('Workflow simulation complete!');
            document.getElementById('simulationProgress').classList.remove('active');
        }
    }
}

function showExecutionInfo(nodeData) {
    const info = document.createElement('div');
    info.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideUp 0.5s ease;
    `;
    
    info.innerHTML = `
        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">Executing: ${nodeData.label}</div>
        <div style="font-size: 14px; color: #666;">${nodeData.subtext || ''}</div>
        ${nodeData.details ? `<div style="font-size: 12px; color: #999; margin-top: 5px;">${nodeData.details.description || ''}</div>` : ''}
    `;
    
    document.body.appendChild(info);
    
    setTimeout(() => {
        info.style.opacity = '0';
        setTimeout(() => document.body.removeChild(info), 300);
    }, 3000);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.5s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Global functions for controls
window.resetCamera = function() {
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
};

window.toggleRotation = function() {
    autoRotate = !autoRotate;
};

window.focusOnFixes = function() {
    const fixNode = nodes.find(n => n.data.id === 'fix-issues');
    if (fixNode) {
        focusOnNode(fixNode.mesh);
    }
};

window.startSimulation = function() {
    if (isSimulating) {
        // Stop simulation
        isSimulating = false;
        simulationStep = 0;
        showNotification('Simulation stopped');
        document.getElementById('simulationProgress').classList.remove('active');
        return;
    }
    
    // Define execution path
    executionPath = [
        'start', 'load-checklists', 'split-chunks', 'analyze-loop',
        'check-seo', 'check-nlp', 'check-ai', 'check-master', 'check-pvod',
        'decision-fix', 'fix-issues', 'decision-websearch', 'web-search',
        'postprocess', 'strip-scaffold', 'clean-links', 'fix-code', 'dedupe',
        'generate-report', 'generate-mdx', 'output'
    ];
    
    isSimulating = true;
    simulationStep = 0;
    window.lastSimulationUpdate = Date.now();
    autoRotate = false; // Stop rotation during simulation
    
    showNotification('Starting workflow simulation...');
    
    // Show progress bar
    document.getElementById('simulationProgress').classList.add('active');
    document.getElementById('simulationProgressBar').style.width = '0%';
    
    // Focus camera on workflow
    camera.position.set(0, 80, 120);
    camera.lookAt(0, 0, 0);
};

window.toggleParticles = function() {
    // Toggle continuous particle generation for testing
    if (window.particleInterval) {
        clearInterval(window.particleInterval);
        window.particleInterval = null;
        showNotification('Particles disabled');
    } else {
        window.particleInterval = setInterval(() => {
            if (nodes.length > 1) {
                const fromIdx = Math.floor(Math.random() * nodes.length);
                const toIdx = Math.floor(Math.random() * nodes.length);
                if (fromIdx !== toIdx) {
                    createParticle(nodes[fromIdx].mesh, nodes[toIdx].mesh);
                }
            }
        }, 500);
        showNotification('Particles enabled');
    }
};

window.switchView = function(viewType, evt) {
    // Clean up previous view
    if (window.cleanupMasterView) {
        window.cleanupMasterView();
        window.cleanupMasterView = null;
    }
    
    // Remove any existing scoring overlays
    const existingOverlay = document.getElementById('scoringOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Update button styles
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#667eea';
    });
    if (evt && evt.target) {
        evt.target.style.background = '#667eea';
        evt.target.style.color = 'white';
    }
    
    // Clear and rebuild scene based on view
    nodes.forEach(node => {
        scene.remove(node.mesh);
        if (node.sprite) scene.remove(node.sprite);
    });
    connections.forEach(conn => scene.remove(conn));
    nodes = [];
    connections = [];
    
    switch(viewType) {
        case 'workflow':
            // Show full workflow
            loadWorkflow();
            camera.position.set(0, 50, 100);
            break;
            
        case 'fixes':
            // Focus on fix nodes only
            loadWorkflow().then(() => {
                // Hide non-fix nodes
                nodes.forEach(node => {
                    if (!node.data.id.includes('fix')) {
                        node.mesh.visible = false;
                        node.sprite.visible = false;
                    } else {
                        // Make fix nodes larger
                        node.mesh.scale.set(1.5, 1.5, 1.5);
                        node.sprite.scale.multiplyScalar(1.5);
                    }
                });
                camera.position.set(30, 30, 50);
                camera.lookAt(20, 0, 0);
            });
            break;
            
        case 'checklists':
            // Focus on checklist nodes
            loadWorkflow().then(() => {
                nodes.forEach(node => {
                    if (node.data.type !== 'checklist') {
                        node.mesh.visible = false;
                        node.sprite.visible = false;
                    } else {
                        // Arrange checklists in a circle
                        const angle = (nodes.filter(n => n.data.type === 'checklist').indexOf(node) / 
                                      nodes.filter(n => n.data.type === 'checklist').length) * Math.PI * 2;
                        node.mesh.position.set(
                            Math.cos(angle) * 30,
                            10,
                            Math.sin(angle) * 30
                        );
                        node.sprite.position.copy(node.mesh.position);
                        node.sprite.position.y += 8;
                        node.mesh.scale.set(1.3, 1.3, 1.3);
                    }
                });
                camera.position.set(0, 60, 60);
                camera.lookAt(0, 10, 0);
            });
            break;
            
        case 'master':
            // Show all 85 master checklist items
            createMasterChecklistView();
            camera.position.set(0, 100, 150);
            camera.lookAt(0, 0, 0);
            break;
            
        case 'metrics':
            // Show metrics visualization
            createMetricsView();
            camera.position.set(0, 40, 80);
            camera.lookAt(0, 0, 0);
            break;
    }
};

// Add scoring overlay
function createScoringOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'scoringOverlay';
    overlay.style.cssText = `
        position: absolute;
        top: 80px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 300px;
    `;
    
    // Calculate scores
    const scores = calculateChecklistScores();
    
    let html = '<h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Quality Scoring</h3>';
    
    scores.forEach(score => {
        html += `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 13px; color: #666;">${score.category}</span>
                    <span style="font-size: 13px; font-weight: 600; color: ${score.color};">${score.percentage}%</span>
                </div>
                <div style="height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${score.percentage}%; height: 100%; background: ${score.color}; transition: width 0.5s;"></div>
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 2px;">${score.passed}/${score.total} checks configured</div>
            </div>
        `;
    });
    
    // Overall score
    const overallScore = scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length;
    html += `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #667eea;">
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: ${getScoreColor(overallScore)};">${Math.round(overallScore)}%</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Overall Quality Score</div>
            </div>
        </div>
    `;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    
    return overlay;
}

function calculateChecklistScores() {
    // Simulate scoring based on checklist categories
    return masterChecklistData.categories.map(category => {
        const total = category.checks.length;
        const criticalCount = category.checks.filter(c => c.params.severity === 'critical').length;
        const highCount = category.checks.filter(c => c.params.severity === 'high').length;
        const autoFixable = category.checks.filter(c => c.params.auto_fixable).length;
        
        // Weight calculation
        const weight = (criticalCount * 4 + highCount * 2 + (total - criticalCount - highCount)) / total;
        const percentage = Math.round((autoFixable / total) * 100 * (weight / 3));
        
        return {
            category: category.name,
            color: category.color,
            total: total,
            passed: autoFixable,
            percentage: Math.min(percentage, 100)
        };
    });
}

function getScoreColor(score) {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
}

function createMasterChecklistView() {
    // Clear scene first
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]);
    }
    
    // Re-add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);
    
    // Create a grid layout for all 85 checks
    const categories = masterChecklistData.categories;
    let totalIndex = 0;
    
    categories.forEach((category, catIndex) => {
        const categoryColor = new THREE.Color(category.color);
        
        // Create category header
        const headerGeometry = new THREE.BoxGeometry(30, 3, 8);
        const headerMaterial = new THREE.MeshPhongMaterial({
            color: categoryColor,
            emissive: categoryColor,
            emissiveIntensity: 0.2
        });
        const header = new THREE.Mesh(headerGeometry, headerMaterial);
        header.position.set(catIndex * 40 - 140, 50, -80);
        scene.add(header);
        
        // Add category label
        const categorySprite = createTextSprite(category.name, 'category');
        categorySprite.position.set(catIndex * 40 - 140, 55, -80);
        categorySprite.scale.set(20, 5, 1);
        scene.add(categorySprite);
        
        // Create individual check boxes
        category.checks.forEach((check, checkIndex) => {
            const checkGeometry = new THREE.BoxGeometry(4, 4, 4);
            
            // Color based on severity
            let checkColor = categoryColor;
            if (check.params.severity === 'critical') {
                checkColor = new THREE.Color(0xff0000);
            } else if (check.params.severity === 'high') {
                checkColor = new THREE.Color(0xff9800);
            } else if (check.params.severity === 'medium') {
                checkColor = new THREE.Color(0xffeb3b);
            }
            
            const checkMaterial = new THREE.MeshPhongMaterial({
                color: checkColor,
                emissive: checkColor,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: check.params.auto_fixable ? 1.0 : 0.6
            });
            
            const checkBox = new THREE.Mesh(checkGeometry, checkMaterial);
            
            // Position in a grid under category
            const row = Math.floor(checkIndex / 3);
            const col = checkIndex % 3;
            checkBox.position.set(
                catIndex * 40 - 140 + (col - 1) * 8,
                40 - row * 8,
                -80
            );
            
            // Store check data
            checkBox.userData = {
                ...check,
                category: category.name,
                categoryColor: category.color
            };
            
            // Add interaction
            checkBox.castShadow = true;
            checkBox.receiveShadow = true;
            
            scene.add(checkBox);
            nodes.push({ 
                mesh: checkBox, 
                sprite: null, 
                data: checkBox.userData 
            });
            
            // Add check ID label
            const labelSprite = createTextSprite(check.id, 'checkId');
            labelSprite.position.copy(checkBox.position);
            labelSprite.position.y += 3;
            labelSprite.scale.set(3, 1, 1);
            scene.add(labelSprite);
            
            totalIndex++;
        });
    });
    
    // Add summary platform
    const platformGeometry = new THREE.BoxGeometry(350, 2, 100);
    const platformMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xeeeeee,
        transparent: true,
        opacity: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -10, -80);
    platform.receiveShadow = true;
    scene.add(platform);
    
    // Add total count display
    const totalSprite = createTextSprite(`Total Checks: ${totalIndex}/85`, 'total');
    totalSprite.position.set(0, 65, -80);
    totalSprite.scale.set(25, 5, 1);
    scene.add(totalSprite);
    
    // Add legend for severity levels
    const severities = [
        { label: 'Critical', color: 0xff0000, x: -60 },
        { label: 'High', color: 0xff9800, x: -20 },
        { label: 'Medium', color: 0xffeb3b, x: 20 },
        { label: 'Low', color: 0x4caf50, x: 60 }
    ];
    
    severities.forEach(sev => {
        const legendGeometry = new THREE.BoxGeometry(3, 3, 3);
        const legendMaterial = new THREE.MeshPhongMaterial({ color: sev.color });
        const legendBox = new THREE.Mesh(legendGeometry, legendMaterial);
        legendBox.position.set(sev.x, -20, -80);
        scene.add(legendBox);
        
        const legendLabel = createTextSprite(sev.label, 'legend');
        legendLabel.position.set(sev.x, -25, -80);
        legendLabel.scale.set(8, 2, 1);
        scene.add(legendLabel);
    });
    
    // Add scoring overlay
    const scoringOverlay = createScoringOverlay();
    
    // Clean up function for view switching
    window.cleanupMasterView = () => {
        if (scoringOverlay && scoringOverlay.parentNode) {
            scoringOverlay.parentNode.removeChild(scoringOverlay);
        }
    };
}

function createMetricsView() {
    // Create 3D bar chart for metrics
    const metricsData = [
        { label: 'SEO Score', value: 75, color: 0x4CAF50 },
        { label: 'Readability', value: 62, color: 0x2196F3 },
        { label: 'AI Detection', value: 87, color: 0xf44336 },
        { label: 'Keyword Density', value: 45, color: 0xFFC107 },
        { label: 'Content Depth', value: 68, color: 0x9C27B0 }
    ];
    
    metricsData.forEach((metric, index) => {
        // Create bar
        const height = metric.value / 5;
        const geometry = new THREE.BoxGeometry(8, height, 8);
        const material = new THREE.MeshPhongMaterial({
            color: metric.color,
            emissive: metric.color,
            emissiveIntensity: 0.2
        });
        
        const bar = new THREE.Mesh(geometry, material);
        bar.position.set((index - 2) * 15, height / 2, 0);
        bar.castShadow = true;
        bar.userData = metric;
        
        // Create label
        const sprite = createTextSprite(`${metric.label}\n${metric.value}%`, 'metric');
        sprite.position.set((index - 2) * 15, height + 5, 0);
        
        scene.add(bar);
        scene.add(sprite);
        nodes.push({ mesh: bar, sprite, data: metric });
    });
    
    // Add base platform
    const platformGeometry = new THREE.BoxGeometry(100, 1, 40);
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    scene.add(platform);
};

// Initialize on load
init();