/* ========================================
   Decision Trees Lab - Fruit Sorting Conveyor Belt
   ======================================== */

class DecisionTreeLab {
    constructor() {
        this.canvas = document.getElementById('conveyor-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Fruit data
        this.fruits = [];
        this.piles = {};
        
        // Tree state
        this.splits = [];
        this.currentLevel = 0;
        
        // Animation state
        this.animating = false;
        this.animationTime = 0;
        
        // Fruit types
        this.fruitTypes = [
            { name: 'Red Apple', color: 'red', shape: 'round', emoji: '🍎' },
            { name: 'Green Apple', color: 'green', shape: 'round', emoji: '🍏' },
            { name: 'Banana', color: 'yellow', shape: 'long', emoji: '🍌' },
            { name: 'Orange', color: 'orange', shape: 'round', emoji: '🍊' },
            { name: 'Lemon', color: 'yellow', shape: 'oval', emoji: '🍋' },
            { name: 'Grape', color: 'purple', shape: 'round', emoji: '🍇' }
        ];
        
        // Color mapping for visuals
        this.colorMap = {
            'red': '#ff4757',
            'green': '#2ed573',
            'yellow': '#ffa502',
            'orange': '#ff7f50',
            'purple': '#8b5cf6'
        };
        
        this.init();
    }
    
    init() {
        this.setupResizeObserver();
        this.generateFruits();
        this.setupEventListeners();
        this.startAnimation();
        this.updateUI();
    }
    
    // FIXED: Use ResizeObserver for responsive canvas
    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
            this.layoutPiles(); // Re-layout piles on resize
        });
        
        const container = this.canvas.parentElement;
        if (container) {
            resizeObserver.observe(container);
        }
        
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.layoutPiles();
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const header = container.querySelector('.conveyor-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        // FIXED: Calculate height responsively, not fixed
        const width = Math.max(rect.width, 300);
        const height = Math.min(Math.max(rect.height - headerHeight, 400), 600);
        
        // Device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Store logical dimensions
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Set canvas with DPR
        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        
        // CSS size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Scale context
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    
    generateFruits() {
        this.fruits = [];
        this.piles = { 'mixed': [] };
        this.splits = [];
        this.currentLevel = 0;
        
        // Generate mixed fruits
        const count = 12;
        for (let i = 0; i < count; i++) {
            const type = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
            const fruit = {
                id: i,
                ...type,
                pile: 'mixed',
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                scale: 1,
                rotation: Math.random() * 0.2 - 0.1
            };
            this.fruits.push(fruit);
            this.piles['mixed'].push(fruit);
        }
        
        this.layoutPiles();
        this.updateFeatureButtons();
    }
    
    layoutPiles() {
        // FIXED: Use logical dimensions for responsive layout
        const w = this.logicalWidth || this.canvas.width;
        const h = this.logicalHeight || this.canvas.height;
        const pileKeys = Object.keys(this.piles);
        const pileCount = pileKeys.length;
        
        if (pileCount === 0) return;
        
        // FIXED: Calculate pile width using percentage-based spacing
        const availableWidth = w - 60; // 30px margin on each side
        const pileWidth = Math.min(180, availableWidth / pileCount);
        const totalPilesWidth = pileWidth * pileCount;
        const startX = (w - totalPilesWidth) / 2 + pileWidth / 2;
        
        // FIXED: Dynamic spacing based on pile width
        const fruitSpacing = Math.min(40, pileWidth / 4.5);
        
        pileKeys.forEach((key, pileIndex) => {
            const pile = this.piles[key];
            const pileX = startX + pileIndex * pileWidth;
            const pileY = h - 80;
            
            // Layout fruits in pile (stacked) with responsive spacing
            const cols = Math.max(2, Math.floor(pileWidth / fruitSpacing));
            pile.forEach((fruit, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const offsetX = (col - (cols - 1) / 2) * fruitSpacing;
                
                fruit.targetX = pileX + offsetX;
                fruit.targetY = pileY - row * 45;
            });
        });
    }
    
    setupEventListeners() {
        // Feature buttons
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.animating && !btn.disabled) {
                    this.splitByFeature(btn.dataset.feature);
                }
            });
        });
        
        // Reset button
        document.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
            if (!this.animating) {
                this.generateFruits();
                this.updateUI();
            }
        });
        
        // Auto sort button
        document.querySelector('[data-action="auto"]')?.addEventListener('click', () => {
            if (!this.animating) {
                this.autoSort();
            }
        });
        
        // Prune button
        document.getElementById('prune-btn')?.addEventListener('click', () => {
            if (!this.animating && this.splits.length > 0) {
                this.pruneLastSplit();
            }
        });
    }
    
    splitByFeature(feature) {
        if (this.animating) return;
        
        this.animating = true;
        
        // Find which piles can be split
        const splitablePiles = Object.entries(this.piles).filter(([key, pile]) => {
            if (pile.length <= 1) return false;
            const values = [...new Set(pile.map(f => f[feature]))];
            return values.length > 1;
        });
        
        if (splitablePiles.length === 0) {
            this.animating = false;
            return;
        }
        
        // Record the split
        this.splits.push({ feature, level: this.currentLevel });
        this.currentLevel++;
        
        // Create new piles
        const newPiles = {};
        
        Object.entries(this.piles).forEach(([pileKey, pile]) => {
            const values = [...new Set(pile.map(f => f[feature]))];
            
            if (values.length > 1 && pile.length > 1) {
                // Split this pile
                values.forEach(value => {
                    const newKey = `${pileKey}_${feature}_${value}`;
                    newPiles[newKey] = pile.filter(f => f[feature] === value);
                    newPiles[newKey].forEach(f => f.pile = newKey);
                });
            } else {
                // Keep this pile as is
                newPiles[pileKey] = pile;
            }
        });
        
        this.piles = newPiles;
        this.layoutPiles();
        
        // Animate fruits to new positions
        this.animateFruits(() => {
            this.animating = false;
            this.updateUI();
            this.updateFeatureButtons();
        });
    }
    
    animateFruits(onComplete) {
        const duration = 0.8;
        
        this.fruits.forEach((fruit, i) => {
            // Animate with stagger
            gsap.to(fruit, {
                x: fruit.targetX,
                y: fruit.targetY,
                duration: duration,
                delay: i * 0.05,
                ease: 'power2.out',
                onUpdate: () => {
                    // Trigger render
                }
            });
            
            // Bounce effect
            gsap.to(fruit, {
                scale: 1.2,
                duration: duration * 0.3,
                delay: i * 0.05,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            });
        });
        
        // Call onComplete after all animations
        setTimeout(onComplete, (duration + this.fruits.length * 0.05) * 1000);
    }
    
    autoSort() {
        if (this.animating) return;
        
        const sortStep = () => {
            // Find best feature to split
            let bestFeature = null;
            let bestGain = 0;
            
            ['color', 'shape'].forEach(feature => {
                const gain = this.calculateInformationGain(feature);
                if (gain > bestGain) {
                    bestGain = gain;
                    bestFeature = feature;
                }
            });
            
            if (bestFeature && bestGain > 0) {
                this.splitByFeature(bestFeature);
                
                // Continue after animation
                setTimeout(() => {
                    if (!this.isPerfectlySorted()) {
                        sortStep();
                    }
                }, 1500);
            }
        };
        
        sortStep();
    }
    
    isPerfectlySorted() {
        return Object.values(this.piles).every(pile => {
            if (pile.length <= 1) return true;
            const firstType = pile[0].name;
            return pile.every(f => f.name === firstType);
        });
    }
    
    calculateInformationGain(feature) {
        let totalGain = 0;
        
        Object.values(this.piles).forEach(pile => {
            if (pile.length <= 1) return;
            
            const currentEntropy = this.calculateEntropy(pile);
            const values = [...new Set(pile.map(f => f[feature]))];
            
            if (values.length <= 1) return;
            
            let weightedEntropy = 0;
            values.forEach(value => {
                const subset = pile.filter(f => f[feature] === value);
                const weight = subset.length / pile.length;
                weightedEntropy += weight * this.calculateEntropy(subset);
            });
            
            totalGain += currentEntropy - weightedEntropy;
        });
        
        return totalGain;
    }
    
    calculateEntropy(fruits) {
        if (fruits.length === 0) return 0;
        
        // Count unique fruit types
        const counts = {};
        fruits.forEach(f => {
            counts[f.name] = (counts[f.name] || 0) + 1;
        });
        
        let entropy = 0;
        Object.values(counts).forEach(count => {
            const p = count / fruits.length;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });
        
        return entropy;
    }
    
    calculateOverallEntropy() {
        let totalEntropy = 0;
        let totalFruits = 0;
        
        Object.values(this.piles).forEach(pile => {
            totalEntropy += this.calculateEntropy(pile) * pile.length;
            totalFruits += pile.length;
        });
        
        return totalFruits > 0 ? totalEntropy / totalFruits : 0;
    }
    
    pruneLastSplit() {
        if (this.splits.length === 0) return;
        
        this.animating = true;
        const lastSplit = this.splits.pop();
        this.currentLevel--;
        
        // Merge piles that were split by this feature
        const newPiles = {};
        const processedKeys = new Set();
        
        Object.entries(this.piles).forEach(([key, pile]) => {
            // Find parent key (remove last split suffix)
            const parts = key.split(`_${lastSplit.feature}_`);
            const parentKey = parts[0];
            
            if (!newPiles[parentKey]) {
                newPiles[parentKey] = [];
            }
            
            pile.forEach(f => {
                f.pile = parentKey;
                newPiles[parentKey].push(f);
            });
        });
        
        this.piles = newPiles;
        this.layoutPiles();
        
        this.animateFruits(() => {
            this.animating = false;
            this.updateUI();
            this.updateFeatureButtons();
        });
    }
    
    updateFeatureButtons() {
        ['color', 'shape'].forEach(feature => {
            const btn = document.getElementById(`btn-${feature}`);
            if (btn) {
                const gain = this.calculateInformationGain(feature);
                btn.disabled = gain === 0;
                btn.classList.toggle('active', false);
            }
        });
        
        // Update prune button
        const pruneBtn = document.getElementById('prune-btn');
        if (pruneBtn) {
            pruneBtn.disabled = this.splits.length === 0;
        }
    }
    
    updateUI() {
        // Update overall entropy
        const entropy = this.calculateOverallEntropy();
        const maxEntropy = Math.log2(this.fruitTypes.length);
        const normalizedEntropy = entropy / maxEntropy;
        
        document.getElementById('overall-entropy').textContent = entropy.toFixed(2);
        
        const entropyBar = document.getElementById('overall-entropy-bar');
        entropyBar.style.width = (normalizedEntropy * 100) + '%';
        entropyBar.className = 'entropy-fill';
        if (normalizedEntropy < 0.1) {
            entropyBar.classList.add('pure');
        } else if (normalizedEntropy < 0.5) {
            entropyBar.classList.add('mixed');
        } else {
            entropyBar.classList.add('impure');
        }
        
        // Update pile statistics
        this.updatePileStats();
        
        // Update tree visualization
        this.updateTreeViz();
    }
    
    updatePileStats() {
        const container = document.getElementById('pile-stats');
        const pileKeys = Object.keys(this.piles);
        
        container.innerHTML = pileKeys.map(key => {
            const pile = this.piles[key];
            const entropy = this.calculateEntropy(pile);
            const isPure = entropy === 0;
            const maxEntropy = Math.log2(this.fruitTypes.length);
            const purity = 1 - (entropy / maxEntropy);
            
            // Get dominant fruit
            const counts = {};
            pile.forEach(f => counts[f.emoji] = (counts[f.emoji] || 0) + 1);
            const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            
            const displayName = key === 'mixed' ? 'Mixed Pile' : 
                key.split('_').slice(-1)[0].charAt(0).toUpperCase() + key.split('_').slice(-1)[0].slice(1);
            
            return `
                <div class="pile-stat">
                    <div class="pile-stat-title">${displayName}</div>
                    <div class="pile-stat-value" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        ${dominant ? dominant[0] : '📦'} ${pile.length}
                    </div>
                    <div class="pile-stat-bar">
                        <div class="pile-stat-fill" style="width: ${purity * 100}%; background: ${isPure ? 'var(--color-green)' : 'var(--color-yellow)'};"></div>
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-text-muted); margin-top: 4px;">
                        ${isPure ? '✓ Pure' : `Entropy: ${entropy.toFixed(2)}`}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateTreeViz() {
        const container = document.getElementById('tree-viz');
        
        if (this.splits.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-lg);">
                    Click a feature to start building the tree
                </div>
            `;
            return;
        }
        
        // Build tree HTML
        let html = '<div style="font-family: var(--font-mono); font-size: 0.8rem;">';
        
        // Root
        html += '<div style="text-align: center; margin-bottom: 10px;">';
        html += '<span class="tree-node decision">🍎 All Fruits</span>';
        html += '</div>';
        
        // Splits
        this.splits.forEach((split, i) => {
            html += '<div style="text-align: center; margin: 5px 0; color: var(--color-text-muted);">↓</div>';
            html += '<div style="text-align: center; margin-bottom: 10px;">';
            html += `<span class="tree-node decision">Split by ${split.feature === 'color' ? '🎨 Color' : '⭐ Shape'}</span>`;
            html += '</div>';
        });
        
        // Leaf nodes (current piles)
        html += '<div style="text-align: center; margin: 5px 0; color: var(--color-text-muted);">↓</div>';
        html += '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">';
        
        Object.entries(this.piles).forEach(([key, pile]) => {
            const entropy = this.calculateEntropy(pile);
            const isPure = entropy === 0;
            const dominant = pile.length > 0 ? pile[0].emoji : '📦';
            
            html += `<span class="tree-node ${isPure ? 'leaf' : ''}" style="border-color: ${isPure ? 'var(--color-green)' : 'var(--color-yellow)'};">
                ${dominant} ${pile.length}
            </span>`;
        });
        
        html += '</div>';
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    startAnimation() {
        const animate = () => {
            this.animationTime += 0.016;
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    render() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth || this.canvas.width;
        const h = this.logicalHeight || this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw conveyor belt
        this.drawConveyor();
        
        // Draw pile areas
        this.drawPileAreas();
        
        // Draw fruits
        this.drawFruits();
    }
    
    drawConveyor() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth || this.canvas.width;
        const h = this.logicalHeight || this.canvas.height;
        
        // Conveyor belt (bottom)
        const beltY = h - 40;
        
        // Belt surface
        ctx.fillStyle = '#2a2a35';
        ctx.fillRect(0, beltY, w, 40);
        
        // Belt lines (animated)
        ctx.strokeStyle = '#3a3a45';
        ctx.lineWidth = 2;
        const lineSpacing = 30;
        const offset = (this.animationTime * 30) % lineSpacing;
        
        for (let x = -lineSpacing + offset; x < w + lineSpacing; x += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, beltY);
            ctx.lineTo(x + 20, beltY + 40);
            ctx.stroke();
        }
        
        // Belt edges
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(0, beltY - 5, w, 5);
    }
    
    drawPileAreas() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth || this.canvas.width;
        const h = this.logicalHeight || this.canvas.height;
        const pileKeys = Object.keys(this.piles);
        const pileCount = pileKeys.length;
        
        if (pileCount === 0) return;
        
        // FIXED: Responsive pile sizing
        const availableWidth = w - 60;
        const pileWidth = Math.min(180, availableWidth / pileCount);
        const totalPilesWidth = pileWidth * pileCount;
        const startX = (w - totalPilesWidth) / 2;
        
        pileKeys.forEach((key, i) => {
            const pile = this.piles[key];
            const entropy = this.calculateEntropy(pile);
            const isPure = entropy === 0;
            
            const x = startX + i * pileWidth;
            const y = h - 250;
            const areaWidth = pileWidth - 20;
            const areaHeight = 200;
            
            // FIXED: Clamp area to prevent overflow
            const clampedAreaWidth = Math.max(60, areaWidth);
            
            // Pile area background
            const color = isPure ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x + 10, y, clampedAreaWidth, areaHeight, 10);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = isPure ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            
            const label = key === 'mixed' ? 'Mixed' : 
                key.split('_').slice(-1)[0].charAt(0).toUpperCase() + key.split('_').slice(-1)[0].slice(1);
            ctx.fillText(label, x + pileWidth / 2, y - 10);
            
            // Purity indicator
            if (isPure) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
                ctx.fillText('✓ Pure', x + pileWidth / 2, y + areaHeight + 20);
            }
        });
    }
    
    drawFruits() {
        const ctx = this.ctx;
        
        // Sort fruits by y position for proper layering
        const sortedFruits = [...this.fruits].sort((a, b) => a.y - b.y);
        
        sortedFruits.forEach(fruit => {
            // Update position towards target
            if (!this.animating) {
                fruit.x = fruit.x + (fruit.targetX - fruit.x) * 0.1;
                fruit.y = fruit.y + (fruit.targetY - fruit.y) * 0.1;
            }
            
            const x = fruit.x || fruit.targetX;
            const y = fruit.y || fruit.targetY;
            const scale = fruit.scale || 1;
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x, y + 15 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Fruit emoji
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(fruit.rotation);
            ctx.scale(scale, scale);
            
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(fruit.emoji, 0, 0);
            
            ctx.restore();
        });
    }
}

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const lab = new DecisionTreeLab();
    window.decisionTreeLab = lab;
});
