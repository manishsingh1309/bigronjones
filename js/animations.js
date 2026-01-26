// GSAP Animations
// Make sure GSAP and ScrollTrigger are loaded before this script

document.addEventListener('DOMContentLoaded', () => {
  // Check if GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded. Animations will not run.');
    return;
  }
  
  // Register ScrollTrigger plugin
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  
  // Initialize all animations
  initHeroAnimations();
  initScrollAnimations();
  initHoverAnimations();
});

// Hero Section Animations
function initHeroAnimations() {
  const heroTimeline = gsap.timeline({ delay: 0.5 });
  
  // Animate hero content with stagger
  heroTimeline
    .from('.hero-badge', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .from('.hero-title .line', {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    }, '-=0.4')
    .from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-description', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-ctas .btn', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-trust > *', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.4')
    .from('.scroll-indicator', {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.4');
  
  // Parallax effect on hero background
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.to('.hero-gradient', {
      y: '30%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });
  }
}

// Scroll-triggered animations
function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') {
    console.warn('ScrollTrigger not loaded. Scroll animations will not run.');
    return;
  }
  
  // Animate sections as they enter viewport
  const sections = gsap.utils.toArray('section:not(.hero)');
  sections.forEach(section => {
    gsap.from(section, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'top 60%',
        toggleActions: 'play none none reverse'
      }
    });
  });
  
  // Animate section headers
  const sectionHeaders = gsap.utils.toArray('.section-header');
  sectionHeaders.forEach(header => {
    gsap.from(header.children, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  });
  
  // Animate feature cards with stagger
  const featureCards = gsap.utils.toArray('.feature-card');
  if (featureCards.length) {
    gsap.from(featureCards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate method cards
  const methodCards = gsap.utils.toArray('.method-card');
  if (methodCards.length) {
    gsap.from(methodCards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.method-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate program cards
  const programCards = gsap.utils.toArray('.program-card');
  if (programCards.length) {
    gsap.from(programCards, {
      y: 60,
      opacity: 0,
      duration: 0.9,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.programs-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate transformation cards
  const transformationCards = gsap.utils.toArray('.transformation-card');
  if (transformationCards.length) {
    gsap.from(transformationCards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.transformations-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate testimonial cards
  const testimonialCards = gsap.utils.toArray('.testimonial-card');
  if (testimonialCards.length) {
    gsap.from(testimonialCards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.testimonials-slider',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate process timeline
  const processSteps = gsap.utils.toArray('.process-step');
  if (processSteps.length) {
    gsap.from(processSteps, {
      x: -50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.process-timeline',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate FAQ items
  const faqItems = gsap.utils.toArray('.faq-item');
  if (faqItems.length) {
    gsap.from(faqItems, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.faq-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Animate Instagram grid
  const instagramPosts = gsap.utils.toArray('.instagram-post');
  if (instagramPosts.length) {
    gsap.from(instagramPosts, {
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '.instagram-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
  }
  
  // Parallax effect on about image
  const aboutImage = document.querySelector('.about-image .image-wrapper');
  if (aboutImage) {
    gsap.to(aboutImage, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  }
}

// Hover animations
function initHoverAnimations() {
  // Only add hover animations on devices that support hover
  if (!window.matchMedia('(hover: hover)').matches) {
    return;
  }
  
  // Button pulse animation
  const buttons = document.querySelectorAll('.btn-primary');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });
  
  // Card hover effects
  const cards = document.querySelectorAll('.feature-card, .method-card, .program-card');
  cards.forEach(card => {
    const icon = card.querySelector('.feature-icon, .method-icon, .program-icon');
    
    if (icon) {
      card.addEventListener('mouseenter', () => {
        gsap.to(icon, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: 'back.out(2)'
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    }
  });
  
  // Step number hover
  const stepNumbers = document.querySelectorAll('.step-number');
  stepNumbers.forEach(step => {
    step.addEventListener('mouseenter', () => {
      gsap.to(step, {
        scale: 1.1,
        duration: 0.3,
        ease: 'back.out(2)'
      });
    });
    
    step.addEventListener('mouseleave', () => {
      gsap.to(step, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });
}

// Scroll progress indicator (optional)
function initScrollProgress() {
  if (typeof ScrollTrigger === 'undefined') return;
  
  // Create progress bar element
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, #FF4D00, #FF8A00);
    z-index: 10001;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);
  
  // Update progress on scroll
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const progress = self.progress * 100;
      progressBar.style.width = progress + '%';
    }
  });
}

// Initialize scroll progress (optional - uncomment to enable)
// initScrollProgress();

// Refresh ScrollTrigger on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }, 250);
});
