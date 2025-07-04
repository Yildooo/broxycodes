// Custom JavaScript for Broxy Code Web Development

// Analytics tracking
function initializeAnalytics() {
    // Generate session ID
    let sessionId = localStorage.getItem('broxycode_session');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('broxycode_session', sessionId);
    }

    // Track page view
    trackPageView(sessionId);

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                trackEvent('scroll_depth', { depth: maxScroll, sessionId });
            }
        }
    });
}

async function trackPageView(sessionId) {
    try {
        const data = {
            type: 'page_view',
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        };

        await fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log('Analytics tracking failed:', error);
    }
}

async function trackEvent(eventType, eventData) {
    try {
        const data = {
            type: eventType,
            page: window.location.pathname,
            data: eventData,
            timestamp: new Date().toISOString()
        };

        await fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log('Event tracking failed:', error);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // Initialize analytics
    initializeAnalytics();

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(52, 58, 64, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'rgba(52, 58, 64, 1)';
            navbar.style.backdropFilter = 'none';
        }
    });

    // Active navigation link highlighting
    const navSections = document.querySelectorAll('section');
    window.addEventListener('scroll', function() {
        let current = '';
        navSections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Real Contact form handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const phone = this.querySelector('input[type="tel"]').value;
            const message = this.querySelector('textarea').value;

            // Basic validation
            if (!name || !email || !message) {
                showAlert('Lütfen tüm gerekli alanları doldurun.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert('Lütfen geçerli bir e-posta adresi girin.', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Gönderiliyor...';
            submitBtn.disabled = true;

            try {
                // Set timeout for contact form
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Contact timeout')), 5000)
                );

                // Send to real API with timeout
                const response = await Promise.race([
                    fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: name,
                            email: email,
                            phone: phone,
                            message: message
                        })
                    }),
                    timeoutPromise
                ]);

                const result = await response.json();

                if (result.success) {
                    showAlert(result.message, 'success');
                    contactForm.reset();

                    // Track contact form submission
                    trackEvent('contact_form_submission');
                } else {
                    showAlert(result.error || 'Bir hata oluştu.', 'error');
                }

            } catch (error) {
                console.error('Contact form error:', error);
                if (error.message === 'Contact timeout') {
                    showAlert('Mesaj gönderimi zaman aşımına uğradı. Lütfen tekrar deneyin.', 'warning');
                } else {
                    showAlert('Local test modunda çalışıyorsunuz. Production\'da çalışacak.', 'info');
                }
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Alert function
    function showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'success' ? 'success' : 'danger'} custom-alert`;
        alert.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .portfolio-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // Portfolio item click handling
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    portfolioItems.forEach(item => {
        item.addEventListener('click', function() {
            const projectTitle = this.querySelector('h4').textContent;
            showAlert(`${projectTitle} hakkında daha fazla bilgi için bizimle iletişime geçin!`, 'info');
        });
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .navbar-nav .nav-link.active {
            color: #007bff !important;
        }
    `;
    document.head.appendChild(style);

    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Add pulse animation to CTA buttons
    const ctaButtons = document.querySelectorAll('.hero-buttons .btn-primary');
    ctaButtons.forEach(btn => {
        btn.classList.add('pulse');
    });

    // Enhanced portfolio item interactions
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    portfolioItems.forEach((item, index) => {
        // Add staggered animation delay
        item.style.animationDelay = `${index * 0.2}s`;

        // Add click sound effect (visual feedback)
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Enhanced founder info hover effect
    const founderInfo = document.querySelector('.founder-info');
    if (founderInfo) {
        founderInfo.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        founderInfo.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        const text = heroTitle.innerHTML;
        heroTitle.innerHTML = '';
        let i = 0;

        function typeWriter() {
            if (i < text.length) {
                heroTitle.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }

        // Start typing effect after page load
        setTimeout(typeWriter, 1000);
    }

    // Enhanced scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const enhancedObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';

                // Add special effects for different elements
                if (entry.target.classList.contains('service-card')) {
                    entry.target.style.animationDelay = '0.2s';
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                }
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.service-card, .portfolio-item, .founder-info');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) scale(0.9)';
        el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
        enhancedObserver.observe(el);
    });

    // Real Analytics Tracking with timeout
    function trackEvent(eventType, page = window.location.pathname) {
        // Set short timeout for analytics
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analytics timeout')), 1000)
        );

        Promise.race([
            fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: eventType,
                    page: page,
                    userAgent: navigator.userAgent,
                    referrer: document.referrer,
                    timestamp: new Date().toISOString()
                })
            }),
            timeoutPromise
        ]).catch(error => {
            // Silent fail for analytics - don't block user experience
            console.log('Analytics tracking error (silent):', error.message);
        });
    }

    // Track page view on load
    trackEvent('page_view');

    // Show static portfolio immediately
    console.log('Loading static portfolio...');
    displayStaticPortfolio();

    // Try to load from API in background
    setTimeout(loadPortfolioProjects, 100);

    // Track section views
    const sections = document.querySelectorAll('section[id]');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackEvent('section_view', `#${entry.target.id}`);
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            trackEvent('button_click', `button:${buttonText}`);
        });
    });

    // Track portfolio item clicks
    document.querySelectorAll('.portfolio-item').forEach(item => {
        item.addEventListener('click', function() {
            const projectTitle = this.querySelector('h4').textContent;
            trackEvent('portfolio_click', `portfolio:${projectTitle}`);
        });
    });

    // Make functions globally available
    window.trackEvent = trackEvent;
    window.displayStaticPortfolio = displayStaticPortfolio;

    // Portfolio Functions
    async function loadPortfolioProjects() {
        // Set a timeout for API calls
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), 3000)
        );

        try {
            const response = await Promise.race([
                fetch('/api/portfolio'),
                timeoutPromise
            ]);
            const result = await response.json();

            if (result.success) {
                displayPortfolioProjects(result.portfolio);
            } else {
                // If no projects exist, try to initialize them
                await initializePortfolio();
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
            // Immediately fallback to static portfolio
            displayStaticPortfolio();
        }
    }

    async function initializePortfolio() {
        // Set a shorter timeout for initialization
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Init timeout')), 2000)
        );

        try {
            const response = await Promise.race([
                fetch('/api/init-portfolio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }),
                timeoutPromise
            ]);

            const result = await response.json();
            if (result.success) {
                console.log('Portfolio initialized:', result.message);
                // Reload portfolio after initialization
                setTimeout(loadPortfolioProjects, 500);
            }
        } catch (error) {
            console.error('Error initializing portfolio:', error);
            // Immediately show static portfolio
            displayStaticPortfolio();
        }
    }

    function displayStaticPortfolio() {
        console.log('displayStaticPortfolio called');
        const staticProjects = [
            {
                _id: '1',
                title: "Modern E-Ticaret Sitesi",
                description: "Responsive tasarım, ödeme sistemi entegrasyonu, admin paneli ve stok yönetimi ile tam özellikli e-ticaret platformu.",
                technologies: ["HTML5", "CSS3", "JavaScript", "Bootstrap", "PHP", "MySQL"],
                imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
                projectUrl: "https://demo-ecommerce.broxycode.com",
                features: [
                    "Responsive mobil uyumlu tasarım",
                    "Güvenli ödeme sistemi entegrasyonu",
                    "Ürün katalog yönetimi",
                    "Kullanıcı hesap sistemi",
                    "Sipariş takip sistemi",
                    "Admin dashboard",
                    "SEO optimizasyonu"
                ],
                client: "TechStore A.Ş.",
                duration: "6 hafta",
                year: "2024"
            },
            {
                _id: '2',
                title: "Kurumsal Website",
                description: "SEO optimizasyonu, hızlı yükleme, modern tasarım ve içerik yönetim sistemi ile profesyonel kurumsal web sitesi.",
                technologies: ["HTML5", "CSS3", "jQuery", "Bootstrap", "WordPress"],
                imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
                projectUrl: "https://demo-corporate.broxycode.com",
                features: [
                    "Modern ve profesyonel tasarım",
                    "İçerik yönetim sistemi (CMS)",
                    "Çoklu dil desteği",
                    "İletişim formu entegrasyonu",
                    "Google Analytics entegrasyonu",
                    "Sosyal medya entegrasyonu",
                    "Hızlı yükleme optimizasyonu"
                ],
                client: "İnovasyon Teknoloji Ltd.",
                duration: "4 hafta",
                year: "2024"
            },
            {
                _id: '3',
                title: "Restaurant Website",
                description: "Online rezervasyon sistemi, menü yönetimi, mobil uyumlu tasarım ve sosyal medya entegrasyonu ile restaurant web sitesi.",
                technologies: ["HTML5", "CSS3", "PHP", "MySQL", "JavaScript"],
                imageUrl: "https://images.unsplash.com/photo-1555421689-491a97ff2040?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
                projectUrl: "https://demo-restaurant.broxycode.com",
                features: [
                    "Online rezervasyon sistemi",
                    "Dijital menü yönetimi",
                    "Galeri ve fotoğraf showcase",
                    "Konum ve harita entegrasyonu",
                    "Sosyal medya entegrasyonu",
                    "Mobil uyumlu responsive tasarım",
                    "WhatsApp sipariş entegrasyonu"
                ],
                client: "Lezzet Durağı Restaurant",
                duration: "3 hafta",
                year: "2024"
            },
            {
                _id: '4',
                title: "Kişisel Portfolio",
                description: "Modern tasarım, animasyonlar, admin paneli, blog sistemi ve proje showcase ile kişisel portfolio web sitesi.",
                technologies: ["React", "Node.js", "MongoDB", "Express", "CSS3"],
                imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
                projectUrl: "https://demo-portfolio.broxycode.com",
                features: [
                    "Modern React tabanlı SPA",
                    "Dinamik proje showcase",
                    "Blog yazma sistemi",
                    "Admin panel ile içerik yönetimi",
                    "İletişim formu ve mesajlaşma",
                    "Smooth animasyonlar",
                    "Dark/Light tema desteği"
                ],
                client: "Freelance Developer",
                duration: "5 hafta",
                year: "2024"
            }
        ];

        console.log('Loading static portfolio projects...');
        console.log('Static projects:', staticProjects);
        displayPortfolioProjects(staticProjects);
    }

    function displayPortfolioProjects(projects) {
        console.log('displayPortfolioProjects called with:', projects);
        const container = document.getElementById('portfolioContainer');
        console.log('Portfolio container found:', container);

        if (!projects || projects.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h5>Henüz portfolio projesi bulunmuyor</h5>
                    <p class="text-muted">Yakında projeler eklenecek.</p>
                </div>
            `;
            return;
        }

        let html = '';
        projects.forEach((project, index) => {
            const colorClasses = ['primary', 'success', 'warning', 'info'];
            const colorClass = colorClasses[index % colorClasses.length];

            const technologies = project.technologies.map(tech =>
                `<span class="badge bg-${colorClass} me-1">${tech}</span>`
            ).join('');

            html += `
                <div class="col-lg-6 mb-4">
                    <div class="portfolio-item" data-project-id="${project._id}">
                        <div class="portfolio-image">
                            <img src="${project.imageUrl}"
                                 alt="${project.title}" class="img-fluid rounded">
                            <div class="portfolio-overlay">
                                <div class="portfolio-content">
                                    <h4>${project.title}</h4>
                                    <p>${project.description}</p>
                                    <div class="portfolio-tech">
                                        ${technologies}
                                    </div>
                                    <button class="btn btn-light mt-3" onclick="console.log('Button clicked for project:', '${project._id}'); showProjectDetails('${project._id}');">
                                        <i class="fas fa-info-circle me-2"></i>Detayları Gör
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Store projects globally for modal access
        window.portfolioProjects = projects;
        console.log('Projects stored globally:', window.portfolioProjects);

        // Re-observe portfolio items for animations
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        portfolioItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px) scale(0.9)';
            item.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
            enhancedObserver.observe(item);
        });
    }

    function showPortfolioError() {
        const container = document.getElementById('portfolioContainer');
        container.innerHTML = `
            <div class="col-12 text-center">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5>Portfolio yüklenirken hata oluştu</h5>
                <p class="text-muted">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
                <button class="btn btn-primary" onclick="displayStaticPortfolio()">
                    <i class="fas fa-redo me-2"></i>Projeleri Göster
                </button>
            </div>
        `;
    }

    // Global function for modal
    window.showProjectDetails = function(projectId) {
        console.log('showProjectDetails called with ID:', projectId);
        console.log('Available projects:', window.portfolioProjects);

        // Simple alert test first
        if (!window.portfolioProjects) {
            alert('Portfolio projeleri henüz yüklenmedi. Lütfen bekleyin.');
            return;
        }

        const project = window.portfolioProjects.find(p => p._id === projectId);
        if (!project) {
            console.error('Project not found with ID:', projectId);
            alert('Proje bulunamadı! ID: ' + projectId);
            return;
        }

        console.log('Found project:', project);

        const modalTitle = document.getElementById('portfolioModalLabel');
        const modalBody = document.getElementById('portfolioModalBody');
        const liveLink = document.getElementById('projectLiveLink');

        modalTitle.textContent = project.title;
        liveLink.href = project.projectUrl || '#';
        liveLink.style.display = project.projectUrl ? 'inline-block' : 'none';

        const technologies = project.technologies.map(tech =>
            `<span class="badge bg-primary me-1 mb-1">${tech}</span>`
        ).join('');

        const features = project.features ? project.features.map(feature =>
            `<li><i class="fas fa-check text-success me-2"></i>${feature}</li>`
        ).join('') : '';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${project.imageUrl}" alt="${project.title}" class="img-fluid rounded mb-3">
                </div>
                <div class="col-md-6">
                    <h6 class="text-primary mb-3">Proje Bilgileri</h6>
                    <p><strong>Müşteri:</strong> ${project.client || 'Belirtilmemiş'}</p>
                    <p><strong>Süre:</strong> ${project.duration || 'Belirtilmemiş'}</p>
                    <p><strong>Yıl:</strong> ${project.year || 'Belirtilmemiş'}</p>
                    <div class="mb-3">
                        <strong>Teknolojiler:</strong><br>
                        ${technologies}
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6 class="text-primary mb-3">Proje Açıklaması</h6>
                    <p>${project.description}</p>
                    ${features ? `
                        <h6 class="text-primary mb-3 mt-4">Özellikler</h6>
                        <ul class="list-unstyled">
                            ${features}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;

        // Show modal - simple approach
        const modalElement = document.getElementById('portfolioModal');
        console.log('Modal element found:', modalElement);

        if (!modalElement) {
            alert('Modal element bulunamadı!');
            return;
        }

        // Simple modal display
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        // Add backdrop
        let backdrop = document.getElementById('modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'modal-backdrop';
            document.body.appendChild(backdrop);
        }

        // Close modal functionality
        const closeModal = () => {
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            const existingBackdrop = document.getElementById('modal-backdrop');
            if (existingBackdrop) {
                existingBackdrop.remove();
            }
        };

        // Add close event listeners
        const closeBtn = modalElement.querySelector('.btn-close');
        const dismissBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');

        if (closeBtn) closeBtn.onclick = closeModal;
        if (dismissBtn) dismissBtn.onclick = closeModal;
        if (backdrop) backdrop.onclick = closeModal;

        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Track modal view
        trackEvent('portfolio_detail_view', `project:${project.title}`);
    };

    console.log('Broxy Code website loaded successfully with real analytics and backend!');
});