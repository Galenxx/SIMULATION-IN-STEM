/* ========================================
   Association Rules Lab - Shopping Basket Analysis
   ======================================== */

class AssociationRulesLab {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Items configuration
        this.items = {
            milk: { emoji: '🥛', name: 'Milk', color: '#f0f0f0' },
            bread: { emoji: '🍞', name: 'Bread', color: '#d4a574' },
            beer: { emoji: '🍺', name: 'Beer', color: '#f59e0b' },
            diapers: { emoji: '👶', name: 'Diapers', color: '#60a5fa' },
            eggs: { emoji: '🥚', name: 'Eggs', color: '#fef3c7' },
            butter: { emoji: '🧈', name: 'Butter', color: '#fde68a' },
            cheese: { emoji: '🧀', name: 'Cheese', color: '#fbbf24' },
            chips: { emoji: '🍟', name: 'Chips', color: '#ef4444' }
        };
        
        // Baskets (transactions)
        this.baskets = [];
        this.nextBasketId = 1;
        
        // Association rules
        this.rules = [];
        this.minSupport = 0.2;
        this.minConfidence = 0.5;
        
        // Graph visualization
        this.nodes = [];
        this.links = [];
        this.selectedRule = null;
        
        // Animation
        this.animationTime = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.setupEventListeners();
        this.addBasket();
        this.addBasket();
        this.addBasket();
        this.startAnimation();
        
        window.addEventListener('resize', () => {
            this.resize();
            this.updateGraph();
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const header = container.querySelector('.graph-header');
        const filter = container.querySelector('.filter-panel');
        
        this.canvas.width = container.clientWidth;
        this.canvas.height = 400;
    }
    
    setupEventListeners() {
        // Drag and drop for items
        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('item', card.dataset.item);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });
        
        // Filter sliders
        document.getElementById('support-slider')?.addEventListener('input', (e) => {
            this.minSupport = e.target.value / 100;
            document.getElementById('support-value').textContent = e.target.value + '%';
            this.calculateRules();
            this.updateGraph();
            this.renderRules();
        });
        
        document.getElementById('confidence-slider')?.addEventListener('input', (e) => {
            this.minConfidence = e.target.value / 100;
            document.getElementById('confidence-value').textContent = e.target.value + '%';
            this.calculateRules();
            this.updateGraph();
            this.renderRules();
        });
        
        // Add basket button
        document.getElementById('add-basket')?.addEventListener('click', () => {
            this.addBasket();
        });
        
        // Preset buttons
        document.querySelector('[data-preset="classic"]')?.addEventListener('click', () => {
            this.loadClassicData();
        });
        
        document.querySelector('[data-preset="random"]')?.addEventListener('click', () => {
            this.loadRandomData();
        });
        
        document.querySelector('[data-preset="clear"]')?.addEventListener('click', () => {
            this.clearAll();
        });
        
        // Canvas interaction for selecting rules
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMove(e));
    }
    
    addBasket() {
        const basketId = this.nextBasketId++;
        this.baskets.push({
            id: basketId,
            items: []
        });
        
        this.renderBaskets();
        this.updateStats();
    }
    
    renderBaskets() {
        const container = document.getElementById('baskets-grid');
        
        container.innerHTML = this.baskets.map(basket => `
            <div class="basket" data-basket-id="${basket.id}">
                <div class="basket-header">Basket #${basket.id}</div>
                <div class="basket-items">
                    ${basket.items.map(item => `
                        <span class="basket-item" data-item="${item}" title="Click to remove">
                            ${this.items[item].emoji}
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        // Setup drop zones
        container.querySelectorAll('.basket').forEach(basketEl => {
            const basketId = parseInt(basketEl.dataset.basketId);
            
            basketEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                basketEl.classList.add('drag-over');
            });
            
            basketEl.addEventListener('dragleave', () => {
                basketEl.classList.remove('drag-over');
            });
            
            basketEl.addEventListener('drop', (e) => {
                e.preventDefault();
                basketEl.classList.remove('drag-over');
                
                const item = e.dataTransfer.getData('item');
                this.addItemToBasket(basketId, item);
            });
            
            // Click to remove items
            basketEl.querySelectorAll('.basket-item').forEach(itemEl => {
                itemEl.addEventListener('click', () => {
                    this.removeItemFromBasket(basketId, itemEl.dataset.item);
                });
            });
        });
    }
    
    addItemToBasket(basketId, item) {
        const basket = this.baskets.find(b => b.id === basketId);
        if (basket && !basket.items.includes(item)) {
            basket.items.push(item);
            this.renderBaskets();
            this.calculateRules();
            this.updateGraph();
            this.renderRules();
            this.updateStats();
        }
    }
    
    removeItemFromBasket(basketId, item) {
        const basket = this.baskets.find(b => b.id === basketId);
        if (basket) {
            basket.items = basket.items.filter(i => i !== item);
            this.renderBaskets();
            this.calculateRules();
            this.updateGraph();
            this.renderRules();
            this.updateStats();
        }
    }
    
    loadClassicData() {
        this.baskets = [];
        this.nextBasketId = 1;
        
        // Classic market basket data (Beer & Diapers correlation)
        const transactions = [
            ['milk', 'bread', 'butter'],
            ['beer', 'diapers'],
            ['milk', 'bread', 'eggs'],
            ['beer', 'diapers', 'chips'],
            ['milk', 'bread', 'butter', 'eggs'],
            ['beer', 'diapers'],
            ['bread', 'butter', 'cheese'],
            ['milk', 'eggs'],
            ['beer', 'diapers', 'chips'],
            ['bread', 'cheese', 'butter'],
            ['milk', 'bread'],
            ['beer', 'diapers'],
        ];
        
        transactions.forEach(items => {
            this.baskets.push({
                id: this.nextBasketId++,
                items: [...items]
            });
        });
        
        this.renderBaskets();
        this.calculateRules();
        this.updateGraph();
        this.renderRules();
        this.updateStats();
    }
    
    loadRandomData() {
        this.baskets = [];
        this.nextBasketId = 1;
        
        const allItems = Object.keys(this.items);
        const numBaskets = 10;
        
        for (let i = 0; i < numBaskets; i++) {
            const numItems = Math.floor(Math.random() * 4) + 2;
            const shuffled = [...allItems].sort(() => Math.random() - 0.5);
            const items = shuffled.slice(0, numItems);
            
            this.baskets.push({
                id: this.nextBasketId++,
                items
            });
        }
        
        this.renderBaskets();
        this.calculateRules();
        this.updateGraph();
        this.renderRules();
        this.updateStats();
    }
    
    clearAll() {
        this.baskets = [];
        this.nextBasketId = 1;
        this.rules = [];
        this.selectedRule = null;
        
        this.addBasket();
        this.addBasket();
        this.addBasket();
        
        this.calculateRules();
        this.updateGraph();
        this.renderRules();
        this.updateStats();
    }
    
    calculateRules() {
        this.rules = [];
        
        if (this.baskets.length === 0) return;
        
        const totalTransactions = this.baskets.length;
        
        // Count item frequencies
        const itemCounts = {};
        const pairCounts = {};
        
        this.baskets.forEach(basket => {
            // Single items
            basket.items.forEach(item => {
                itemCounts[item] = (itemCounts[item] || 0) + 1;
            });
            
            // Pairs
            for (let i = 0; i < basket.items.length; i++) {
                for (let j = i + 1; j < basket.items.length; j++) {
                    const pair = [basket.items[i], basket.items[j]].sort().join(',');
                    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
                }
            }
        });
        
        // Generate rules for each pair
        Object.entries(pairCounts).forEach(([pair, count]) => {
            const [item1, item2] = pair.split(',');
            const support = count / totalTransactions;
            
            if (support >= this.minSupport) {
                // Rule: item1 -> item2
                const confidence1 = count / itemCounts[item1];
                const expectedSupport1 = (itemCounts[item1] / totalTransactions) * (itemCounts[item2] / totalTransactions);
                const lift1 = support / expectedSupport1;
                
                if (confidence1 >= this.minConfidence) {
                    this.rules.push({
                        antecedent: item1,
                        consequent: item2,
                        support: support,
                        confidence: confidence1,
                        lift: lift1
                    });
                }
                
                // Rule: item2 -> item1
                const confidence2 = count / itemCounts[item2];
                const expectedSupport2 = (itemCounts[item2] / totalTransactions) * (itemCounts[item1] / totalTransactions);
                const lift2 = support / expectedSupport2;
                
                if (confidence2 >= this.minConfidence) {
                    this.rules.push({
                        antecedent: item2,
                        consequent: item1,
                        support: support,
                        confidence: confidence2,
                        lift: lift2
                    });
                }
            }
        });
        
        // Sort by lift
        this.rules.sort((a, b) => b.lift - a.lift);
    }
    
    updateGraph() {
        // Build nodes from items that appear in rules
        const itemsInRules = new Set();
        this.rules.forEach(rule => {
            itemsInRules.add(rule.antecedent);
            itemsInRules.add(rule.consequent);
        });
        
        // Position nodes in a circle
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        
        this.nodes = Array.from(itemsInRules).map((item, i) => {
            const angle = (i / itemsInRules.size) * Math.PI * 2 - Math.PI / 2;
            return {
                id: item,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                ...this.items[item]
            };
        });
        
        // Build links from rules
        this.links = this.rules.map(rule => ({
            source: rule.antecedent,
            target: rule.consequent,
            ...rule
        }));
    }
    
    renderRules() {
        const container = document.getElementById('rules-panel');
        
        if (this.rules.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-lg); font-size: 0.875rem;">
                    Add items to baskets to discover rules
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.rules.map((rule, i) => {
            const item1 = this.items[rule.antecedent];
            const item2 = this.items[rule.consequent];
            
            return `
                <div class="rule-card ${this.selectedRule === i ? 'active' : ''}" data-rule-index="${i}">
                    <div class="rule-content">
                        <span>${item1.emoji} ${item1.name}</span>
                        <span class="rule-arrow">→</span>
                        <span>${item2.emoji} ${item2.name}</span>
                    </div>
                    <div class="rule-metrics">
                        <div class="metric">
                            <span class="metric-label">Sup:</span>
                            <span class="metric-value">${(rule.support * 100).toFixed(0)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Conf:</span>
                            <span class="metric-value ${rule.confidence > 0.7 ? 'high' : 'medium'}">${(rule.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Lift:</span>
                            <span class="metric-value ${rule.lift > 1.5 ? 'high' : 'medium'}">${rule.lift.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.rule-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.ruleIndex);
                this.selectRule(index);
            });
        });
    }
    
    selectRule(index) {
        this.selectedRule = this.selectedRule === index ? null : index;
        this.renderRules();
        this.showRuleDetails();
    }
    
    showRuleDetails() {
        const panel = document.getElementById('rule-details-panel');
        const container = document.getElementById('rule-details');
        
        if (this.selectedRule === null || !this.rules[this.selectedRule]) {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        const rule = this.rules[this.selectedRule];
        const item1 = this.items[rule.antecedent];
        const item2 = this.items[rule.consequent];
        
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: var(--space-lg);">
                <span style="font-size: 2rem;">${item1.emoji}</span>
                <span style="font-size: 1.5rem; color: var(--color-text-muted); margin: 0 var(--space-sm);">→</span>
                <span style="font-size: 2rem;">${item2.emoji}</span>
            </div>
            
            <p style="font-size: 0.9rem; color: var(--color-text-secondary); text-align: center; margin-bottom: var(--space-lg);">
                "People who bought <strong>${item1.name}</strong> also bought <strong>${item2.name}</strong>"
            </p>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--color-blue);">${(rule.support * 100).toFixed(0)}%</div>
                    <div class="stat-label">Support</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--color-green);">${(rule.confidence * 100).toFixed(0)}%</div>
                    <div class="stat-label">Confidence</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: var(--space-lg); padding: var(--space-md); background: var(--color-bg); border-radius: var(--radius-md);">
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: var(--space-xs);">Lift</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${rule.lift > 1 ? 'var(--color-green)' : 'var(--color-red)'};">
                    ${rule.lift.toFixed(2)}x
                </div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">
                    ${rule.lift > 1 ? '↑ Positive correlation' : '↓ Negative correlation'}
                </div>
            </div>
        `;
    }
    
    updateStats() {
        document.getElementById('basket-count').textContent = this.baskets.length;
        document.getElementById('rule-count').textContent = this.rules.length;
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on a link
        for (let i = 0; i < this.links.length; i++) {
            const link = this.links[i];
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            
            if (source && target) {
                // Check distance to line
                const dist = this.distToLine(x, y, source.x, source.y, target.x, target.y);
                if (dist < 15) {
                    // Find corresponding rule index
                    const ruleIndex = this.rules.findIndex(r => 
                        r.antecedent === link.source && r.consequent === link.target
                    );
                    if (ruleIndex >= 0) {
                        this.selectRule(ruleIndex);
                        return;
                    }
                }
            }
        }
    }
    
    handleCanvasMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if hovering over a link
        let isOverLink = false;
        for (const link of this.links) {
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            
            if (source && target) {
                const dist = this.distToLine(x, y, source.x, source.y, target.x, target.y);
                if (dist < 15) {
                    isOverLink = true;
                    break;
                }
            }
        }
        
        this.canvas.style.cursor = isOverLink ? 'pointer' : 'default';
    }
    
    distToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
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
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw links
        this.drawLinks();
        
        // Draw nodes
        this.drawNodes();
    }
    
    drawLinks() {
        const ctx = this.ctx;
        
        this.links.forEach((link, i) => {
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            
            if (!source || !target) return;
            
            const isSelected = this.selectedRule !== null && 
                this.rules[this.selectedRule]?.antecedent === link.source &&
                this.rules[this.selectedRule]?.consequent === link.target;
            
            // Line thickness based on lift
            const thickness = Math.max(2, Math.min(10, link.lift * 3));
            
            // Color based on selection
            const alpha = isSelected ? 1 : 0.5;
            const color = isSelected ? '#667eea' : '#4b5563';
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            // Draw arrow
            const angle = Math.atan2(target.y - source.y, target.x - source.x);
            const arrowLength = 15;
            const arrowX = target.x - Math.cos(angle) * 35;
            const arrowY = target.y - Math.sin(angle) * 35;
            
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
                arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
                arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Draw lift value on line
            if (isSelected) {
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.beginPath();
                ctx.roundRect(midX - 25, midY - 12, 50, 24, 4);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = '12px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${link.lift.toFixed(1)}x`, midX, midY);
            }
        });
    }
    
    drawNodes() {
        const ctx = this.ctx;
        
        this.nodes.forEach(node => {
            const x = node.x;
            const y = node.y;
            const isInSelectedRule = this.selectedRule !== null && (
                this.rules[this.selectedRule]?.antecedent === node.id ||
                this.rules[this.selectedRule]?.consequent === node.id
            );
            
            const radius = isInSelectedRule ? 35 : 30;
            const pulse = isInSelectedRule ? Math.sin(this.animationTime * 3) * 3 : 0;
            
            // Glow
            if (isInSelectedRule) {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius + 20);
                gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
                gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
                
                ctx.beginPath();
                ctx.arc(x, y, radius + 20 + pulse, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            // Node background
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isInSelectedRule ? '#667eea' : 'rgba(26, 26, 36, 0.9)';
            ctx.fill();
            ctx.strokeStyle = isInSelectedRule ? '#a5b4fc' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Emoji
            ctx.font = `${radius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.emoji, x, y);
            
            // Label
            ctx.fillStyle = isInSelectedRule ? 'white' : 'rgba(255, 255, 255, 0.7)';
            ctx.font = '11px Inter';
            ctx.fillText(node.name, x, y + radius + 15);
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
    const lab = new AssociationRulesLab();
    window.associationLab = lab;
});
