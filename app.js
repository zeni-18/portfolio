// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. THREE.JS 3D CANVAS BACKGROUND SYSTEM
// ==========================================
class ThreeBackground {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.particleCount = 1800;
        
        // Interaction variables
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.scrollPercent = 0;

        this.init();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    // Helper to generate soft glowing particles without external images
    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw radial glow gradient
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(0, 240, 255, 0.95)');  // Core Cyan
        gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.45)'); // Mid Violet
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');           // Fade out
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    init() {
        // Create Scene
        this.scene = new THREE.Scene();

        // Create Camera (FOV, Aspect, Near, Far)
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.z = 6;

        // Create WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const scales = new Float32Array(this.particleCount);

        const colorCyan = new THREE.Color('#00f0ff');
        const colorPurple = new THREE.Color('#8b5cf6');
        const colorWhite = new THREE.Color('#ffffff');

        for (let i = 0; i < this.particleCount; i++) {
            // Distribute particles in a double-helix / galaxy spiral configuration
            const t = Math.random();
            const angle = t * Math.PI * 8; // Spiral turns
            const radius = 1.2 + t * 8.5;  // Core density with wide arms
            
            // Add some wave distortion
            const spreadX = (Math.random() - 0.5) * 1.5;
            const spreadY = (Math.random() - 0.5) * 1.5;
            const spreadZ = (Math.random() - 0.5) * 1.5;

            positions[i * 3] = Math.cos(angle) * radius + spreadX;
            positions[i * 3 + 1] = Math.sin(angle) * radius + spreadY;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6 + spreadZ; // Z-depth spread

            // Alternate colors between Cyan, Purple, and White sparks
            let chosenColor = colorWhite;
            const rand = Math.random();
            if (rand < 0.45) {
                chosenColor = colorCyan;
            } else if (rand < 0.90) {
                chosenColor = colorPurple;
            }

            colors[i * 3] = chosenColor.r;
            colors[i * 3 + 1] = chosenColor.g;
            colors[i * 3 + 2] = chosenColor.b;
            
            scales[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create Materials using programmatic glowing texture
        const texture = this.createCircleTexture();
        const material = new THREE.PointsMaterial({
            size: 0.09,
            map: texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Assemble Points mesh
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    bindEvents() {
        // Track Mouse
        window.addEventListener('mousemove', (e) => {
            // Normalize coordinates from -1 to 1
            this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Track Scroll
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll > 0) {
                this.scrollPercent = window.scrollY / maxScroll;
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth mouse coordinates interpolation (lerp)
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        // Slow automatic system rotations
        if (this.particles) {
            this.particles.rotation.y += 0.0006;
            this.particles.rotation.x += 0.0002;

            // Mouse interaction tilts the particle ecosystem slightly
            this.particles.rotation.y += (this.mouseX * 0.2 - this.particles.rotation.y) * 0.03;
            this.particles.rotation.x += (-this.mouseY * 0.2 - this.particles.rotation.x) * 0.03;

            // Scroll flight-through dynamics
            // As user scrolls, camera pulls back and particles rotate on Z axis
            this.camera.position.z = 6 + this.scrollPercent * 4.5;
            this.particles.rotation.z = this.scrollPercent * Math.PI * 0.25;
        }

        // Camera subtle drift response to cursor
        this.camera.position.x += (this.mouseX * 0.8 - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.mouseY * 0.8 - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}





// ==========================================
// 3. CARD INTERACTIVE 3D TILT & GLOW SYSTEM
// ==========================================
class InteractiveCards {
    constructor() {
        this.cards = document.querySelectorAll('.project-card, .skills-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMove(e, card));
            card.addEventListener('mouseleave', () => this.handleLeave(card));
            card.addEventListener('mouseenter', () => this.handleEnter(card));
        });
    }

    handleMove(e, card) {
        const rect = card.getBoundingClientRect();
        
        // Relative mouse coordinates in pixels inside the card
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Pass mouse coords as CSS variables for card gradients
        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

        // 3D rotation math
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Maximum rotation amount: 10 degrees
        const rotateX = -((y - centerY) / centerY) * 10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    handleLeave(card) {
        // Smoothly return to baseline when mouse leaves
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease';
    }

    handleEnter(card) {
        // Clear transitions instantly on enter for responsive cursor tracking
        card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease';
    }
}


// ==========================================
// 4. GSAP SCROLL & ENTRY ANIMATIONS
// ==========================================
class AnimationController {
    constructor() {
        this.initEntryAnimations();
        this.initScrollAnimations();
    }

    initEntryAnimations() {
        // Slide up hero content sequentially on page load
        gsap.from('.reveal-init', {
            opacity: 0,
            y: 40,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power4.out',
            delay: 0.3
        });

        // Subtle animation for header navigation items
        gsap.from('#main-header', {
            opacity: 0,
            y: -20,
            duration: 1,
            ease: 'power3.out',
            delay: 0.8
        });
    }

    initScrollAnimations() {
        // Stagger reveal project cards on scroll
        gsap.from('.projects-grid .project-card', {
            opacity: 0,
            y: 60,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.projects-section',
                start: 'top 75%',
                toggleActions: 'play none none none'
            }
        });

        // Stagger reveal skills category cards
        gsap.from('.skills-categories-grid .skills-card', {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.18,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.skills-section',
                start: 'top 75%',
                toggleActions: 'play none none none'
            }
        });

        // General scroll reveals
        const scrollReveals = document.querySelectorAll('.reveal-scroll');
        scrollReveals.forEach(element => {
            // Avoid cards which are already animated in groups above
            if (element.classList.contains('project-card') || element.classList.contains('skills-card')) return;
            
            gsap.fromTo(element, 
                { opacity: 0, y: 35 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: element,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });
    }
}


// ==========================================
// 5. GLOBAL UI & NAVIGATION STATE CONTROLLERS
// ==========================================
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const links = document.querySelectorAll('.mobile-link-item');

    if (!toggleBtn || !mobileMenu) return;

    const toggleActive = () => {
        toggleBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Prevent body scrolling when mobile menu is open
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    toggleBtn.addEventListener('click', toggleActive);

    // Close menu when clicking navigation drawer items
    links.forEach(link => {
        link.addEventListener('click', () => {
            toggleBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}


// ==========================================
// INITIALIZE APPLICATION SYSTEM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Engine
    new ThreeBackground();



    // 3. Initialize Interactive Card Systems
    new InteractiveCards();

    // 4. Initialize GSAP Animation Controller
    new AnimationController();

    // 5. Initialize General UI Elements
    initHeaderScroll();
    initMobileMenu();
});