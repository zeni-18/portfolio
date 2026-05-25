// 3D Tilt Effect for Project Cards
const tiltCards = document.querySelectorAll('.project-card');

tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // Mouse X inside card
        const y = e.clientY - rect.top;  // Mouse Y inside card

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 10 degrees)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    // Snap back to zero when mouse leaves
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    });

    // Remove transition delay when mouse enters for instant tracking
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
    });
});