// PyroPlasm Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeNavigation();
    initializeForm();
    initializeModal();
    initializeMobileMenu();
    initializeBlogList();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Blog list population
function initializeBlogList() {
    const list = document.getElementById('blog-list');
    const postsContainer = document.getElementById('blog-posts');
    if (!list && !postsContainer) return;

    fetch('blog.json')
        .then(r => r.ok ? r.json() : [])
        .then(async (items) => {
            if (list) list.innerHTML = '';
            if (postsContainer) postsContainer.innerHTML = '';
            if (!Array.isArray(items) || items.length === 0) {
                if (list) {
                    const li = document.createElement('li');
                    li.textContent = 'No posts yet';
                    list.appendChild(li);
                }
                if (postsContainer) {
                    const p = document.createElement('p');
                    p.textContent = 'No posts yet';
                    postsContainer.appendChild(p);
                }
                return;
            }
            // Render list and full posts in order of appearance
            for (const item of items) {
                // list entry
                if (list) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.textContent = item.title || 'Untitled';
                    a.href = `#${slugify(item.title || item.path)}`;
                    a.className = 'post-link';
                    li.appendChild(a);
                    list.appendChild(li);
                }
                // fetch and render post
                if (postsContainer) {
                    try {
                        const res = await fetch(item.path);
                        if (!res.ok) throw new Error('failed');
                        const mdRaw = await res.text();
                        const { title, body } = parseFrontMatter(mdRaw, item.title);
                        const html = renderMarkdown(body);
                        const article = document.createElement('article');
                        const id = slugify(title || item.title || item.path);
                        article.id = id;
                        article.className = 'post';
                        const h3 = document.createElement('h3');
                        h3.textContent = title || item.title || 'Untitled';
                        article.appendChild(h3);
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'post-content';
                        contentDiv.innerHTML = html;
                        article.appendChild(contentDiv);
                        postsContainer.appendChild(article);
                    } catch (e) {
                        const err = document.createElement('p');
                        err.textContent = `Failed to load post: ${item.title || item.path}`;
                        postsContainer.appendChild(err);
                    }
                }
            }
        })
        .catch(() => {
            if (list) {
                const li = document.createElement('li');
                li.textContent = 'Failed to load posts';
                list.appendChild(li);
            }
            if (postsContainer) {
                const p = document.createElement('p');
                p.textContent = 'Failed to load posts';
                postsContainer.appendChild(p);
            }
        });
}

function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function parseFrontMatter(text, fallbackTitle) {
    let title = fallbackTitle;
    let body = text;
    const m = text.match(/^---[\s\S]*?---/);
    if (m) {
        const fm = m[0];
        body = text.slice(fm.length).replace(/^\n+/, '');
        const t = fm.match(/\btitle:\s*"?(.+?)"?(\r?\n|$)/i);
        if (t) title = t[1].trim();
    }
    return { title, body };
}

// Markdown rendering using marked + DOMPurify
function renderMarkdown(md) {
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
        // Preprocess to support heading levels 7-10 by converting to inline HTML h6 with data-level
        const preprocessed = md.replace(/^(#{7,10})\s+(.*)$/gm, (_, hashes, text) => {
            const lvl = hashes.length;
            return `<h6 data-level="${lvl}">${escapeHtml(text)}</h6>`;
        });
        const rawHtml = marked.parse(preprocessed, { mangle: false, headerIds: true });
        if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
            return DOMPurify.sanitize(rawHtml);
        }
        return rawHtml;
    }
    // Fallback: minimal Markdown renderer to avoid single-line <pre> output
    // Supports headings (# .. ########## = 10 levels), paragraphs, lists, and basic line breaks.
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let inList = false;
    function closeList(){ if(inList){ out.push('</ul>'); inList=false; } }
    for (let line of lines) {
        const m = line.match(/^(#{1,10})\s+(.*)$/); // up to 10 hashes
        if (m) {
            closeList();
            const lvl = m[1].length;
            const txt = m[2].trim();
            out.push(`<h${lvl}>${escapeHtml(txt)}</h${lvl}>`);
            continue;
        }
        if (/^\s*[-*+]\s+/.test(line)) {
            if (!inList) { out.push('<ul>'); inList = true; }
            const item = line.replace(/^\s*[-*+]\s+/, '');
            out.push(`<li>${escapeHtml(item)}</li>`);
            continue;
        }
        if (line.trim() === '') { closeList(); out.push(''); continue; }
        // paragraph
        closeList();
        out.push(`<p>${escapeHtml(line)}</p>`);
    }
    closeList();
    const html = out.join('\n')
      .replace(/\n{2,}/g, '\n');
    return html;
}

function escapeHtml(s){
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Form validation and submission
function initializeForm() {
    const form = document.getElementById('membershipForm');
    if (!form) return;
    const inputs = form.querySelectorAll('input, textarea');
    
    // Add real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });
}

// Individual field validation
function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(fieldName + 'Error');
    
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    field.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    
    // Validation rules
    switch (fieldName) {
        case 'fullName':
            if (!value) {
                errorMessage = 'Full name is required';
                isValid = false;
            } else if (value.length < 2) {
                errorMessage = 'Full name must be at least 2 characters';
                isValid = false;
            } else if (!/^[a-zA-Z\s\-'\.]+$/.test(value)) {
                errorMessage = 'Full name contains invalid characters';
                isValid = false;
            }
            break;
            
        case 'address':
            if (!value) {
                errorMessage = 'Address is required';
                isValid = false;
            } else if (value.length < 10) {
                errorMessage = 'Please provide a complete address';
                isValid = false;
            }
            break;
            
        case 'email':
            if (!value) {
                errorMessage = 'Email address is required';
                isValid = false;
            } else if (!isValidEmail(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
            break;
            
        case 'phone':
            // Phone is optional, but if provided, validate format
            if (value && !isValidPhone(value)) {
                errorMessage = 'Please enter a valid phone number';
                isValid = false;
            }
            break;
            
        case 'agreeStatutes':
            if (!field.checked) {
                errorMessage = 'You must agree to the association\'s statutes';
                isValid = false;
            }
            break;
    }
    
    // Show error if validation failed
    if (!isValid && errorElement) {
        field.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
    }
    
    return isValid;
}

// Full form validation
function validateForm() {
    const form = document.getElementById('membershipForm');
    const requiredFields = form.querySelectorAll('input[required], textarea[required]');
    const statutesCheckbox = document.getElementById('agreeStatutes');
    
    let isFormValid = true;
    
    // Validate all required fields
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });
    
    // Validate statutes checkbox
    if (!validateField(statutesCheckbox)) {
        isFormValid = false;
    }
    
    // Validate optional phone field if filled
    const phoneField = document.getElementById('phone');
    if (phoneField.value.trim()) {
        if (!validateField(phoneField)) {
            isFormValid = false;
        }
    }
    
    return isFormValid;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation helper
function isValidPhone(phone) {
    // Allow various international phone formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(phone);
}

// Form submission
function submitForm() {
    const form = document.getElementById('membershipForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    
    // Simulate form submission (in real implementation, this would be an API call)
    setTimeout(() => {
        // Reset form
        form.reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Clear any error states
        const errorInputs = form.querySelectorAll('.error');
        const errorMessages = form.querySelectorAll('.error-message.show');
        
        errorInputs.forEach(input => input.classList.remove('error'));
        errorMessages.forEach(message => {
            message.classList.remove('show');
            message.textContent = '';
        });
        
        // Show success modal
        showSuccessModal();
        
    }, 1500); // Simulate processing time
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    const closeButton = document.getElementById('closeModal');
    const overlay = modal.querySelector('.modal-overlay');
    
    // Close modal handlers
    closeButton.addEventListener('click', hideSuccessModal);
    overlay.addEventListener('click', hideSuccessModal);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideSuccessModal();
        }
    });
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    
    // Focus trap
    const closeButton = document.getElementById('closeModal');
    closeButton.focus();
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('hidden');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Return focus to the form
    const firstInput = document.getElementById('fullName');
    if (firstInput) {
        firstInput.focus();
    }
}

// Utility functions for enhanced user experience
function addHoverEffects() {
    // Add subtle animation to cards
    const cards = document.querySelectorAll('.card, .about-card, .stat-card, .deployment-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Initialize hover effects after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addHoverEffects();
});

// Intersection Observer for scroll animations (optional enhancement)
function initializeScrollAnimations() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.about-card, .stat-card, .impact-item, .deployment-card');
    animateElements.forEach(el => observer.observe(el));
}

// Add CSS animation classes dynamically
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .about-card, .stat-card, .impact-item, .deployment-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize scroll animations when page loads
window.addEventListener('load', function() {
    addAnimationStyles();
    initializeScrollAnimations();
});

// Smooth scroll to top functionality
function addScrollToTop() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-btn-primary-text);
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(scrollButton);
    
    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.transform = 'translateY(0)';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.transform = 'translateY(100px)';
        }
    });
    
    // Scroll to top functionality
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top button
document.addEventListener('DOMContentLoaded', function() {
    addScrollToTop();
});

// Handle navigation active states
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
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
}

// Initialize active navigation
document.addEventListener('DOMContentLoaded', function() {
    updateActiveNavigation();
    
    // Add active nav styles
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.active {
            background: var(--color-primary);
            color: var(--color-btn-primary-text);
        }
    `;
    document.head.appendChild(style);
});