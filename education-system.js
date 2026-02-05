/* ========================================
   ML Playground - Education Enhancement System
   - Interactive Tour Guide (Driver.js style)
   - Dynamic Parameter Explanations
   - Gamification & Achievement System
   ======================================== */

// ========================================
// 1. Interactive Tour Guide System
// ========================================
class TourGuide {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;
        this.labId = this.getLabId();
        this.init();
    }

    getLabId() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        return filename || 'index';
    }

    init() {
        this.createOverlay();
        this.createTooltip();
        this.checkFirstVisit();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.innerHTML = `
            <div class="tour-spotlight"></div>
        `;
        document.body.appendChild(this.overlay);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.innerHTML = `
            <div class="tour-tooltip-content">
                <div class="tour-step-indicator"></div>
                <h4 class="tour-title"></h4>
                <p class="tour-description"></p>
                <div class="tour-actions">
                    <button class="tour-btn tour-skip">Skip Tour</button>
                    <div class="tour-nav">
                        <button class="tour-btn tour-prev" disabled>Previous</button>
                        <button class="tour-btn tour-next primary">Next</button>
                    </div>
                </div>
            </div>
            <div class="tour-arrow"></div>
        `;
        document.body.appendChild(this.tooltip);

        // Event listeners
        this.tooltip.querySelector('.tour-skip').addEventListener('click', () => this.end());
        this.tooltip.querySelector('.tour-prev').addEventListener('click', () => this.prev());
        this.tooltip.querySelector('.tour-next').addEventListener('click', () => this.next());
    }

    checkFirstVisit() {
        const visited = localStorage.getItem(`tour_${this.labId}_completed`);
        if (!visited && this.labId !== 'index' && this.labId !== 'quiz') {
            // Show tour button for first-time visitors
            this.showTourButton();
        }
    }

    showTourButton() {
        const btn = document.createElement('button');
        btn.className = 'start-tour-btn pulse-animation';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Start Interactive Tour</span>
        `;
        btn.addEventListener('click', () => {
            btn.remove();
            this.start();
        });

        // Insert after lab header
        const header = document.querySelector('.lab-header');
        if (header) {
            header.after(btn);
        }
    }

    setSteps(steps) {
        this.steps = steps;
    }

    start() {
        if (this.steps.length === 0) return;
        this.isActive = true;
        this.currentStep = 0;
        document.body.classList.add('tour-active');
        this.showStep(0);
    }

    showStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        
        const step = this.steps[index];
        const element = document.querySelector(step.element);
        
        if (!element) {
            console.warn(`Tour element not found: ${step.element}`);
            this.next();
            return;
        }

        // Update spotlight
        const rect = element.getBoundingClientRect();
        const spotlight = this.overlay.querySelector('.tour-spotlight');
        spotlight.style.cssText = `
            top: ${rect.top - 8}px;
            left: ${rect.left - 8}px;
            width: ${rect.width + 16}px;
            height: ${rect.height + 16}px;
        `;

        // Update tooltip content
        this.tooltip.querySelector('.tour-step-indicator').textContent = 
            `Step ${index + 1} of ${this.steps.length}`;
        this.tooltip.querySelector('.tour-title').textContent = step.title;
        this.tooltip.querySelector('.tour-description').innerHTML = step.description;

        // Update buttons
        this.tooltip.querySelector('.tour-prev').disabled = index === 0;
        this.tooltip.querySelector('.tour-next').textContent = 
            index === this.steps.length - 1 ? 'Finish' : 'Next';

        // Position tooltip
        this.positionTooltip(element, step.position || 'bottom');

        // Show elements
        this.overlay.classList.add('active');
        this.tooltip.classList.add('active');

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight animation
        element.classList.add('tour-highlight');
        setTimeout(() => element.classList.remove('tour-highlight'), 300);
    }

    positionTooltip(element, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const padding = 16;

        let top, left;
        const arrow = this.tooltip.querySelector('.tour-arrow');
        arrow.className = 'tour-arrow';

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - padding;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                arrow.classList.add('arrow-bottom');
                break;
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                arrow.classList.add('arrow-top');
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - padding;
                arrow.classList.add('arrow-right');
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + padding;
                arrow.classList.add('arrow-left');
                break;
        }

        // Keep tooltip in viewport
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.end();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    end() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('active');
        document.body.classList.remove('tour-active');
        localStorage.setItem(`tour_${this.labId}_completed`, 'true');
        
        // Show completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const msg = document.createElement('div');
        msg.className = 'tour-complete-msg';
        msg.innerHTML = `
            <div class="tour-complete-icon">✓</div>
            <p>Tour completed! Start exploring the lab.</p>
        `;
        document.body.appendChild(msg);
        setTimeout(() => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    }
}

// ========================================
// 2. Dynamic Parameter Explanation System
// ========================================
class ParameterExplainer {
    constructor() {
        this.explanations = {};
        this.currentTooltip = null;
        this.init();
    }

    init() {
        this.createTooltipElement();
    }

    createTooltipElement() {
        this.currentTooltip = document.createElement('div');
        this.currentTooltip.className = 'param-explanation';
        this.currentTooltip.innerHTML = `
            <div class="param-explanation-header">
                <span class="param-explanation-icon">💡</span>
                <span class="param-explanation-title"></span>
            </div>
            <div class="param-explanation-content"></div>
            <div class="param-explanation-impact"></div>
        `;
        document.body.appendChild(this.currentTooltip);
    }

    setExplanations(explanations) {
        this.explanations = explanations;
    }

    // Attach to a slider or input element
    attach(elementSelector, paramKey) {
        const element = document.querySelector(elementSelector);
        if (!element) return;

        element.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.showExplanation(paramKey, value, element);
        });

        element.addEventListener('change', () => {
            setTimeout(() => this.hideExplanation(), 2000);
        });
    }

    showExplanation(paramKey, value, element) {
        const explanation = this.explanations[paramKey];
        if (!explanation) return;

        // Get dynamic content based on value
        const content = explanation.getExplanation(value);
        const impact = explanation.getImpact(value);

        // Update tooltip content
        this.currentTooltip.querySelector('.param-explanation-title').textContent = explanation.title;
        this.currentTooltip.querySelector('.param-explanation-content').innerHTML = content;
        this.currentTooltip.querySelector('.param-explanation-impact').innerHTML = `
            <strong>Impact:</strong> ${impact}
        `;

        // Position tooltip
        const rect = element.getBoundingClientRect();
        this.currentTooltip.style.top = `${rect.top - 10}px`;
        this.currentTooltip.style.left = `${rect.right + 16}px`;

        // Check if off-screen
        const tooltipRect = this.currentTooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth - 16) {
            this.currentTooltip.style.left = `${rect.left - tooltipRect.width - 16}px`;
        }

        this.currentTooltip.classList.add('active');
    }

    hideExplanation() {
        this.currentTooltip.classList.remove('active');
    }
}

// ========================================
// 3. Gamification & Achievement System
// ========================================
class AchievementSystem {
    constructor() {
        this.achievements = this.initAchievements();
        this.userProgress = this.loadProgress();
        this.init();
    }

    initAchievements() {
        return {
            // Lab-specific badges (earned by completing quiz with 5/5)
            labs: {
                'linear-regression': {
                    id: 'linear-regression',
                    name: 'Line Finder',
                    description: 'Master Linear Regression',
                    icon: '📈',
                    color: '#3b82f6'
                },
                'logistic-regression': {
                    id: 'logistic-regression',
                    name: 'Probability Pro',
                    description: 'Master Logistic Regression',
                    icon: '📊',
                    color: '#10b981'
                },
                'decision-trees': {
                    id: 'decision-trees',
                    name: 'Tree Builder',
                    description: 'Master Decision Trees',
                    icon: '🌳',
                    color: '#22c55e'
                },
                'svm': {
                    id: 'svm',
                    name: 'Margin Maximizer',
                    description: 'Master Support Vector Machines',
                    icon: '⚡',
                    color: '#f59e0b'
                },
                'knn': {
                    id: 'knn',
                    name: 'Neighbor Expert',
                    description: 'Master K-Nearest Neighbors',
                    icon: '🎯',
                    color: '#ef4444'
                },
                'kmeans': {
                    id: 'kmeans',
                    name: 'Cluster Champion',
                    description: 'Master K-Means Clustering',
                    icon: '🎨',
                    color: '#8b5cf6'
                },
                'association': {
                    id: 'association',
                    name: 'Pattern Finder',
                    description: 'Master Association Rules',
                    icon: '🛒',
                    color: '#ec4899'
                }
            },
            // Ultimate achievement
            grandmaster: {
                id: 'grandmaster',
                name: 'ML Grandmaster',
                description: 'Complete all labs with perfect scores',
                icon: '👑',
                color: '#ffd700'
            }
        };
    }

    loadProgress() {
        const saved = localStorage.getItem('ml_playground_progress');
        return saved ? JSON.parse(saved) : {
            completedLabs: {},
            totalQuizAttempts: 0,
            achievements: []
        };
    }

    saveProgress() {
        localStorage.setItem('ml_playground_progress', JSON.stringify(this.userProgress));
    }

    init() {
        this.createAchievementButton();
        this.createAchievementModal();
    }

    createAchievementButton() {
        const btn = document.createElement('button');
        btn.className = 'achievement-btn';
        btn.innerHTML = `
            <span class="achievement-btn-icon">🏆</span>
            <span class="achievement-btn-count">${this.getUnlockedCount()}</span>
        `;
        btn.addEventListener('click', () => this.showModal());
        
        // Add to navigation or header
        const nav = document.querySelector('.bottom-nav .nav-container');
        if (nav) {
            const achievementNav = document.createElement('div');
            achievementNav.className = 'nav-item achievement-nav magnetic';
            achievementNav.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 15l-2 5h4l-2-5z"/>
                    <path d="M8 9h8l-4-7z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Achievements</span>
                <span class="achievement-badge-count">${this.getUnlockedCount()}/8</span>
            `;
            achievementNav.addEventListener('click', () => this.showModal());
            nav.appendChild(achievementNav);
        }
    }

    createAchievementModal() {
        const modal = document.createElement('div');
        modal.className = 'achievement-modal';
        const unlockedCount = this.getUnlockedCount();
        const totalBadges = 8;
        const isGM = this.isGrandmaster();
        
        modal.innerHTML = `
            <div class="achievement-modal-content">
                <div class="achievement-modal-header">
                    <h2>🏆 Achievement Gallery</h2>
                    <button class="achievement-modal-close">&times;</button>
                </div>
                <div class="achievement-modal-body">
                    <!-- Progress Overview -->
                    <div class="achievement-overview">
                        <div class="achievement-overview-stats">
                            <div class="overview-stat">
                                <span class="overview-stat-value">${unlockedCount}</span>
                                <span class="overview-stat-label">Badges Earned</span>
                            </div>
                            <div class="overview-divider"></div>
                            <div class="overview-stat">
                                <span class="overview-stat-value">${totalBadges - unlockedCount}</span>
                                <span class="overview-stat-label">Remaining</span>
                            </div>
                        </div>
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width: ${this.getProgressPercent()}%"></div>
                            <span class="achievement-progress-text">${unlockedCount}/${totalBadges} Complete</span>
                        </div>
                    </div>
                    
                    <!-- Grandmaster Ultimate Achievement -->
                    <div class="achievement-grandmaster ${isGM ? 'unlocked' : 'locked'}">
                        <div class="grandmaster-icon-wrapper">
                            <div class="grandmaster-icon">${isGM ? '👑' : '🔒'}</div>
                            ${isGM ? '<div class="grandmaster-glow"></div>' : ''}
                        </div>
                        <div class="grandmaster-info">
                            <h3>${isGM ? 'ML Grandmaster' : '??? Ultimate Achievement ???'}</h3>
                            <p>${isGM ? 'You have mastered all Machine Learning concepts!' : 'Complete all 7 labs with perfect quiz scores to unlock'}</p>
                            ${!isGM ? `<div class="grandmaster-progress">
                                <span class="grandmaster-progress-text">${Object.values(this.userProgress.completedLabs).filter(l => l.perfect).length}/7 Labs Completed</span>
                            </div>` : ''}
                        </div>
                        ${isGM ? '<span class="unlocked-badge">🎉 UNLOCKED!</span>' : ''}
                    </div>
                    
                    <!-- Lab Badges Section -->
                    <div class="achievement-section">
                        <h3 class="achievement-section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Lab Badges (${Object.values(this.userProgress.completedLabs).filter(l => l.perfect).length}/7)
                        </h3>
                        <div class="achievement-grid">
                            ${this.renderLabBadges()}
                        </div>
                    </div>
                    
                    <!-- Motivational Footer -->
                    <div class="achievement-footer">
                        ${unlockedCount === 0 
                            ? '<p>🚀 Complete lab quizzes with perfect scores to start earning badges!</p>'
                            : unlockedCount < 4 
                                ? '<p>📚 Great start! Keep learning to unlock more achievements.</p>'
                                : unlockedCount < 7 
                                    ? '<p>🌟 You\'re doing amazing! The Grandmaster title awaits...</p>'
                                    : isGM 
                                        ? '<p>🏆 Congratulations, Grandmaster! You\'ve mastered it all!</p>'
                                        : '<p>🔥 Almost there! One more perfect score for Grandmaster!</p>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        modal.querySelector('.achievement-modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
        
        document.body.appendChild(modal);
        this.modal = modal;
    }

    renderLabBadges() {
        return Object.values(this.achievements.labs).map(badge => {
            const isUnlocked = this.userProgress.completedLabs[badge.id]?.perfect;
            const score = this.userProgress.completedLabs[badge.id]?.score || 0;
            const progressPercent = (score / 5) * 100;
            
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" data-badge-id="${badge.id}">
                    <div class="achievement-card-icon" style="background: ${isUnlocked ? badge.color : 'linear-gradient(135deg, #2a2a3a 0%, #1a1a24 100%)'}">
                        <span>${badge.icon}</span>
                    </div>
                    <div class="achievement-card-info">
                        <h4>${isUnlocked ? badge.name : '???'}</h4>
                        <p>${isUnlocked ? badge.description : 'Complete the quiz with a perfect score to unlock'}</p>
                        ${isUnlocked 
                            ? '<span class="achievement-status"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Unlocked!</span>' 
                            : `<span class="achievement-status"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ${score}/5 correct</span>
                               <div class="achievement-progress-mini">
                                   <div class="achievement-progress-mini-fill" style="width: ${progressPercent}%"></div>
                               </div>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    showModal() {
        const unlockedCount = this.getUnlockedCount();
        const isGM = this.isGrandmaster();
        const perfectLabs = Object.values(this.userProgress.completedLabs).filter(l => l.perfect).length;
        
        // Refresh badge grid
        this.modal.querySelector('.achievement-grid').innerHTML = this.renderLabBadges();
        
        // Update progress bar
        this.modal.querySelector('.achievement-progress-fill').style.width = `${this.getProgressPercent()}%`;
        this.modal.querySelector('.achievement-progress-text').textContent = `${unlockedCount}/8 Complete`;
        
        // Update overview stats
        const overviewStats = this.modal.querySelectorAll('.overview-stat-value');
        if (overviewStats.length >= 2) {
            overviewStats[0].textContent = unlockedCount;
            overviewStats[1].textContent = 8 - unlockedCount;
        }
        
        // Update section title
        const sectionTitle = this.modal.querySelector('.achievement-section-title');
        if (sectionTitle) {
            sectionTitle.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Lab Badges (${perfectLabs}/7)
            `;
        }
        
        // Update grandmaster status
        const gmElement = this.modal.querySelector('.achievement-grandmaster');
        if (gmElement) {
            gmElement.className = `achievement-grandmaster ${isGM ? 'unlocked' : 'locked'}`;
            const iconWrapper = gmElement.querySelector('.grandmaster-icon-wrapper');
            const infoEl = gmElement.querySelector('.grandmaster-info');
            
            if (iconWrapper) {
                iconWrapper.innerHTML = `
                    <div class="grandmaster-icon">${isGM ? '👑' : '🔒'}</div>
                    ${isGM ? '<div class="grandmaster-glow"></div>' : ''}
                `;
            }
            
            if (infoEl) {
                infoEl.innerHTML = `
                    <h3>${isGM ? 'ML Grandmaster' : '??? Ultimate Achievement ???'}</h3>
                    <p>${isGM ? 'You have mastered all Machine Learning concepts!' : 'Complete all 7 labs with perfect quiz scores to unlock'}</p>
                    ${!isGM ? `<div class="grandmaster-progress">
                        <span class="grandmaster-progress-text">${perfectLabs}/7 Labs Completed</span>
                    </div>` : ''}
                `;
            }
            
            // Handle unlocked badge
            let badge = gmElement.querySelector('.unlocked-badge');
            if (isGM && !badge) {
                badge = document.createElement('span');
                badge.className = 'unlocked-badge';
                badge.textContent = '🎉 UNLOCKED!';
                gmElement.appendChild(badge);
            } else if (!isGM && badge) {
                badge.remove();
            }
        }
        
        // Update footer message
        const footer = this.modal.querySelector('.achievement-footer p');
        if (footer) {
            footer.textContent = unlockedCount === 0 
                ? '🚀 Complete lab quizzes with perfect scores to start earning badges!'
                : unlockedCount < 4 
                    ? '📚 Great start! Keep learning to unlock more achievements.'
                    : unlockedCount < 7 
                        ? '🌟 You\'re doing amazing! The Grandmaster title awaits...'
                        : isGM 
                            ? '🏆 Congratulations, Grandmaster! You\'ve mastered it all!'
                            : '🔥 Almost there! One more perfect score for Grandmaster!';
        }
        
        this.modal.classList.add('active');
    }

    getUnlockedCount() {
        let count = Object.values(this.userProgress.completedLabs).filter(l => l.perfect).length;
        if (this.isGrandmaster()) count++;
        return count;
    }

    getProgressPercent() {
        return (this.getUnlockedCount() / 8) * 100;
    }

    isGrandmaster() {
        const allLabs = Object.keys(this.achievements.labs);
        return allLabs.every(lab => this.userProgress.completedLabs[lab]?.perfect);
    }

    // Called when completing a quiz
    recordQuizResult(labId, score, total) {
        this.userProgress.totalQuizAttempts++;
        
        if (!this.userProgress.completedLabs[labId]) {
            this.userProgress.completedLabs[labId] = { score: 0, perfect: false };
        }
        
        const current = this.userProgress.completedLabs[labId];
        if (score > current.score) {
            current.score = score;
        }
        
        if (score === total && !current.perfect) {
            current.perfect = true;
            this.showBadgeUnlocked(labId);
        }
        
        // Check for grandmaster
        if (this.isGrandmaster() && !this.userProgress.achievements.includes('grandmaster')) {
            this.userProgress.achievements.push('grandmaster');
            setTimeout(() => this.showGrandmasterUnlocked(), 2000);
        }
        
        this.saveProgress();
        this.updateBadgeCount();
    }

    showBadgeUnlocked(labId) {
        const badge = this.achievements.labs[labId];
        if (!badge) return;

        // Create celebration confetti
        this.createConfetti();

        const notification = document.createElement('div');
        notification.className = 'badge-unlocked-notification';
        notification.innerHTML = `
            <div class="badge-unlocked-content">
                <div class="badge-unlocked-icon" style="background: ${badge.color}">
                    <span class="badge-icon-emoji">${badge.icon}</span>
                    <div class="badge-icon-ring"></div>
                </div>
                <div class="badge-unlocked-text">
                    <span class="badge-unlocked-label">🎉 Achievement Unlocked!</span>
                    <span class="badge-unlocked-name">${badge.name}</span>
                    <span class="badge-unlocked-desc">${badge.description}</span>
                </div>
            </div>
            <div class="celebration-particles"></div>
        `;
        
        document.body.appendChild(notification);
        
        // Add celebration particles
        const particlesContainer = notification.querySelector('.celebration-particles');
        this.createParticles(particlesContainer);
        
        // Play unlock sound effect (visual cue)
        this.pulseNavBadge();
        
        setTimeout(() => notification.classList.add('active'), 50);
        
        // Auto dismiss with exit animation
        setTimeout(() => {
            notification.classList.add('exit');
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 600);
        }, 5000);
        
        // Update achievement gallery if modal is open
        if (this.modal && this.modal.classList.contains('active')) {
            this.refreshGalleryWithAnimation(labId);
        }
    }
    
    createParticles(container) {
        const colors = ['#10b981', '#667eea', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
            particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`);
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            container.appendChild(particle);
        }
    }
    
    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'achievement-confetti';
        confettiContainer.innerHTML = '';
        
        const colors = ['#10b981', '#667eea', '#f59e0b', '#ec4899', '#8b5cf6', '#ffd700'];
        const shapes = ['square', 'circle'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = `confetti-piece ${shapes[Math.floor(Math.random() * shapes.length)]}`;
            confetti.style.setProperty('--x', `${Math.random() * 100}vw`);
            confetti.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            confetti.style.setProperty('--duration', `${2 + Math.random() * 2}s`);
            confetti.style.setProperty('--delay', `${Math.random() * 0.5}s`);
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        setTimeout(() => confettiContainer.remove(), 5000);
    }
    
    pulseNavBadge() {
        const navBadge = document.querySelector('.achievement-badge-count');
        if (navBadge) {
            navBadge.classList.add('pulse');
            setTimeout(() => navBadge.classList.remove('pulse'), 1000);
        }
    }
    
    refreshGalleryWithAnimation(labId) {
        const card = this.modal.querySelector(`[data-badge-id="${labId}"]`);
        if (card) {
            // Remove locked state and add unlock animation
            card.classList.remove('locked');
            card.classList.add('unlocked', 'just-unlocked');
            
            // Update card content
            const badge = this.achievements.labs[labId];
            const iconEl = card.querySelector('.achievement-card-icon');
            const infoEl = card.querySelector('.achievement-card-info');
            
            if (iconEl) {
                iconEl.style.background = badge.color;
            }
            
            if (infoEl) {
                infoEl.innerHTML = `
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                    <span class="achievement-status"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Unlocked!</span>
                `;
            }
            
            // Update progress bar
            this.modal.querySelector('.achievement-progress-fill').style.width = `${this.getProgressPercent()}%`;
            this.modal.querySelector('.achievement-progress-text').textContent = `${this.getUnlockedCount()}/8 Badges`;
            
            setTimeout(() => card.classList.remove('just-unlocked'), 1000);
        }
    }

    showGrandmasterUnlocked() {
        const notification = document.createElement('div');
        notification.className = 'grandmaster-unlocked-notification';
        notification.innerHTML = `
            <div class="grandmaster-unlocked-content">
                <div class="grandmaster-confetti"></div>
                <div class="grandmaster-icon">👑</div>
                <h2>Congratulations!</h2>
                <p>You've unlocked the <strong>ML Grandmaster</strong> achievement!</p>
                <p class="grandmaster-subtitle">You've mastered all Machine Learning labs!</p>
                <button class="grandmaster-close-btn">Awesome!</button>
            </div>
        `;
        
        notification.querySelector('.grandmaster-close-btn').addEventListener('click', () => {
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 500);
        });
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('active'), 100);
    }

    updateBadgeCount() {
        const countElements = document.querySelectorAll('.achievement-badge-count, .achievement-btn-count');
        countElements.forEach(el => {
            el.textContent = `${this.getUnlockedCount()}/8`;
        });
    }
}

// ========================================
// 4. Lab-Specific Tour Configurations
// ========================================
const LabTours = {
    'knn': [
        {
            element: '.panel:has(.brush-selector), .panel:first-child',
            title: 'Welcome to KNN Lab!',
            description: 'Learn how K-Nearest Neighbors classifies data points by looking at their neighbors.',
            position: 'right'
        },
        {
            element: '.brush-selector',
            title: 'Paint Data Points',
            description: 'Select a class (<span style="color:#ff4757">Class A</span> or <span style="color:#3b82f6">Class B</span>) and click on the canvas to add points.',
            position: 'bottom'
        },
        {
            element: '#k-slider',
            title: 'Adjust K Value',
            description: 'Change the number of neighbors to consider. <strong>Higher K</strong> = smoother boundaries, <strong>Lower K</strong> = more sensitive to local patterns.',
            position: 'left'
        },
        {
            element: '#main-canvas',
            title: 'Query Point',
            description: 'Drag the <span style="color:#f59e0b">yellow ? point</span> around to see how the algorithm classifies different regions!',
            position: 'top'
        },
        {
            element: '.voting-panel',
            title: 'Neighbor Voting',
            description: 'Watch how the K nearest neighbors vote to determine the classification. The majority wins!',
            position: 'left'
        }
    ],
    'linear-regression': [
        {
            element: '.canvas-container',
            title: 'Welcome to Linear Regression!',
            description: 'Learn how to fit a line through data points to make predictions.',
            position: 'bottom'
        },
        {
            element: '.canvas-actions',
            title: 'Generate Data',
            description: 'Click to add points manually, or use presets to generate different data patterns.',
            position: 'bottom'
        },
        {
            element: '#slope-slider',
            title: 'Adjust the Line',
            description: '<strong>Slope (m)</strong> controls how steep the line is. Try moving it and watch the line change!',
            position: 'left'
        },
        {
            element: '#intercept-slider',
            title: 'Y-Intercept',
            description: '<strong>Intercept (b)</strong> shifts the line up or down. Find the best fit!',
            position: 'left'
        },
        {
            element: '.phase-nav',
            title: 'Learning Phases',
            description: 'Progress through phases to understand the full concept - from data to gradient descent!',
            position: 'bottom'
        }
    ],
    'kmeans': [
        {
            element: '.canvas-container',
            title: 'Welcome to K-Means!',
            description: 'Watch the algorithm group similar data points into clusters.',
            position: 'bottom'
        },
        {
            element: '#k-slider, .k-selector',
            title: 'Number of Clusters',
            description: 'Set how many clusters (K) you want to find in the data.',
            position: 'left'
        },
        {
            element: '[data-action="init-centroids"]',
            title: 'Initialize Centroids',
            description: 'Click to place random starting points for each cluster center.',
            position: 'bottom'
        },
        {
            element: '.step-controls',
            title: 'Step-by-Step',
            description: '<strong>Assign:</strong> Color points by nearest centroid. <strong>Update:</strong> Move centroids to cluster centers.',
            position: 'left'
        }
    ],
    'decision-trees': [
        {
            element: '.conveyor-area',
            title: 'Fruit Sorting Factory!',
            description: 'Sort fruits into pure piles using if-then rules - just like a Decision Tree!',
            position: 'bottom'
        },
        {
            element: '.feature-selector',
            title: 'Choose a Feature',
            description: 'Split fruits by <strong>Color</strong> or <strong>Shape</strong>. The algorithm picks the best feature to reduce "impurity".',
            position: 'bottom'
        },
        {
            element: '#overall-entropy-bar',
            title: 'Entropy Meter',
            description: '<span style="color:#10b981">Green = Pure</span> (all same type), <span style="color:#f59e0b">Yellow = Mixed</span>. Goal: reach 0 entropy!',
            position: 'left'
        }
    ],
    'svm': [
        {
            element: '.canvas-container',
            title: 'Welcome to SVM!',
            description: 'Find the widest "street" that separates two classes of points.',
            position: 'bottom'
        },
        {
            element: '.class-selector',
            title: 'Add Points',
            description: 'Paint <span style="color:#ff4757">Class A</span> and <span style="color:#3b82f6">Class B</span> points on the canvas.',
            position: 'bottom'
        },
        {
            element: '.kernel-toggle',
            title: 'Kernel Function',
            description: '<strong>Linear:</strong> Straight line boundary. <strong>RBF:</strong> Curved boundary for circular data.',
            position: 'left'
        },
        {
            element: '#c-slider',
            title: 'C Parameter',
            description: 'Controls the trade-off: <strong>Low C</strong> = wider margin, more errors allowed. <strong>High C</strong> = strict, narrow margin.',
            position: 'left'
        }
    ],
    'logistic-regression': [
        {
            element: '.canvas-container',
            title: 'Welcome to Logistic Regression!',
            description: 'Predict Pass/Fail outcomes using the Sigmoid function.',
            position: 'bottom'
        },
        {
            element: '.view-toggle',
            title: 'View Modes',
            description: '<strong>1D:</strong> See the S-curve. <strong>2D:</strong> See the decision boundary with two features.',
            position: 'bottom'
        },
        {
            element: '#weight-slider',
            title: 'Weight Parameter',
            description: 'Controls the <strong>steepness</strong> of the sigmoid curve. Higher = sharper transition.',
            position: 'left'
        }
    ],
    'association': [
        {
            element: '.items-panel',
            title: 'Shop Items',
            description: 'Drag items into shopping baskets to simulate customer purchases.',
            position: 'right'
        },
        {
            element: '#graph-canvas',
            title: 'Association Network',
            description: 'See which items are frequently bought together. Thicker lines = stronger association.',
            position: 'left'
        },
        {
            element: '#support-slider',
            title: 'Support Threshold',
            description: 'Filter rules by minimum support - how often items appear together.',
            position: 'top'
        }
    ]
};

// ========================================
// 5. Parameter Explanation Configurations
// ========================================
const ParameterExplanations = {
    'knn': {
        k: {
            title: 'K Value (Number of Neighbors)',
            getExplanation: (value) => {
                if (value <= 3) {
                    return `With K=${value}, the algorithm considers only the <strong>${value} closest</strong> neighbors. This makes the model <em>highly sensitive</em> to local patterns and noise.`;
                } else if (value <= 7) {
                    return `K=${value} is a <strong>balanced choice</strong>. The model considers enough neighbors to be stable, but still captures local patterns.`;
                } else {
                    return `With K=${value}, the algorithm averages over <strong>many neighbors</strong>. This creates <em>smoother</em> decision boundaries but may miss local details.`;
                }
            },
            getImpact: (value) => {
                if (value <= 3) return '⚠️ High variance, may overfit';
                if (value <= 7) return '✓ Good balance of bias/variance';
                return '⚠️ High bias, may underfit';
            }
        }
    },
    'linear-regression': {
        slope: {
            title: 'Slope (m)',
            getExplanation: (value) => {
                const direction = value > 0 ? 'positive' : (value < 0 ? 'negative' : 'no');
                const strength = Math.abs(value) > 1 ? 'strong' : (Math.abs(value) > 0.5 ? 'moderate' : 'weak');
                return `Slope m=${value.toFixed(2)} indicates a <strong>${strength} ${direction}</strong> relationship. For every 1 unit increase in X, Y changes by <strong>${value.toFixed(2)}</strong> units.`;
            },
            getImpact: (value) => {
                return `Line rises ${value > 0 ? '↗️' : '↘️'} ${Math.abs(value).toFixed(2)} units per X unit`;
            }
        },
        intercept: {
            title: 'Y-Intercept (b)',
            getExplanation: (value) => {
                return `When X=0, the predicted Y value is <strong>${value.toFixed(2)}</strong>. This shifts the entire line ${value > 0 ? 'upward' : 'downward'}.`;
            },
            getImpact: (value) => `Line crosses Y-axis at ${value.toFixed(2)}`;
        }
    },
    'svm': {
        c: {
            title: 'C Parameter (Regularization)',
            getExplanation: (value) => {
                const cValue = Math.pow(10, value).toFixed(2);
                if (value < -1) {
                    return `C=${cValue} is very <strong>low</strong>. The model prioritizes a <em>wide margin</em> and allows many classification errors. This is called a <strong>soft margin</strong>.`;
                } else if (value < 1) {
                    return `C=${cValue} provides a <strong>balanced</strong> trade-off between margin width and classification accuracy.`;
                } else {
                    return `C=${cValue} is <strong>high</strong>. The model strictly minimizes errors, creating a <em>narrow margin</em>. This is called a <strong>hard margin</strong>.`;
                }
            },
            getImpact: (value) => {
                if (value < -1) return '📏 Wider margin, more tolerant';
                if (value < 1) return '⚖️ Balanced trade-off';
                return '🎯 Narrower margin, strict';
            }
        }
    },
    'logistic-regression': {
        weight: {
            title: 'Weight (w) - Steepness',
            getExplanation: (value) => {
                if (value < 0.5) {
                    return `Weight w=${value.toFixed(2)} creates a <strong>gradual</strong> transition in the sigmoid curve. Predictions change slowly across the input range.`;
                } else if (value < 1.5) {
                    return `Weight w=${value.toFixed(2)} creates a <strong>moderate</strong> sigmoid curve with a reasonable transition zone.`;
                } else {
                    return `Weight w=${value.toFixed(2)} creates a <strong>steep</strong> sigmoid curve. The transition from 0 to 1 probability happens very quickly.`;
                }
            },
            getImpact: (value) => {
                if (value < 0.5) return '🐢 Gradual probability change';
                if (value < 1.5) return '⚖️ Moderate transition';
                return '🚀 Sharp probability jump';
            }
        },
        bias: {
            title: 'Bias (b) - Decision Shift',
            getExplanation: (value) => {
                return `Bias b=${value.toFixed(2)} shifts the decision boundary. The 50% probability point occurs at X=${(-value).toFixed(1)} study hours.`;
            },
            getImpact: (value) => `Decision boundary at X=${(-value).toFixed(1)}`;
        }
    },
    'kmeans': {
        k: {
            title: 'K (Number of Clusters)',
            getExplanation: (value) => {
                if (value <= 2) {
                    return `K=${value} clusters will create a <strong>very broad</strong> grouping. Data is split into ${value} large groups.`;
                } else if (value <= 5) {
                    return `K=${value} clusters is often a <strong>good starting point</strong> for exploring data structure.`;
                } else {
                    return `K=${value} clusters creates <strong>many small groups</strong>. Watch for clusters with very few points - you might be over-segmenting!`;
                }
            },
            getImpact: (value) => {
                if (value <= 2) return '🎯 Broad categories';
                if (value <= 5) return '✓ Moderate granularity';
                return '⚠️ Fine-grained, check for empty clusters';
            }
        }
    }
};

// ========================================
// Global Initialization
// ========================================
let tourGuide, paramExplainer, achievementSystem;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize systems
    achievementSystem = new AchievementSystem();
    
    // IMPORTANT: Set global reference AFTER initialization
    window.achievementSystem = achievementSystem;
    
    // Initialize tour guide for lab pages
    const labId = window.location.pathname.split('/').pop().replace('.html', '');
    if (LabTours[labId]) {
        tourGuide = new TourGuide();
        tourGuide.setSteps(LabTours[labId]);
    }
    
    // Initialize parameter explainer
    if (ParameterExplanations[labId]) {
        paramExplainer = new ParameterExplainer();
        paramExplainer.setExplanations(ParameterExplanations[labId]);
        
        // Auto-attach to known sliders
        if (labId === 'knn') {
            paramExplainer.attach('#k-slider', 'k');
        } else if (labId === 'linear-regression') {
            paramExplainer.attach('#slope-slider', 'slope');
            paramExplainer.attach('#intercept-slider', 'intercept');
        } else if (labId === 'svm') {
            paramExplainer.attach('#c-slider', 'c');
        } else if (labId === 'logistic-regression') {
            paramExplainer.attach('#weight-slider', 'weight');
            paramExplainer.attach('#bias-slider', 'bias');
        } else if (labId === 'kmeans') {
            paramExplainer.attach('#k-slider', 'k');
        }
    }
});

// Export classes for use in other scripts
window.TourGuide = TourGuide;
window.ParameterExplainer = ParameterExplainer;
window.AchievementSystem = AchievementSystem;
