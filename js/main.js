// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  initLoader();
  initNavigation();
  initFAQ();
  initForms();
  initCounters();
});

// Page Loader
function initLoader() {
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    
    // Fade out loader after everything is loaded
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 1000);
  });
}

// Navigation
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Sticky navbar on scroll
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
  
  // Mobile menu toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
  }
  
  // Close mobile menu when clicking nav links
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// FAQ Accordion
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
}

// Forms
function initForms() {
  // Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
  
  // Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  }
}

function handleContactSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  // Show success message (replace with actual form submission)
  console.log('Contact form submitted:', data);
  alert('Thank you for your message! We\'ll get back to you soon.');
  e.target.reset();
  
  // TODO: Integrate with actual backend/email service
  // Example: Send to email service, CRM, etc.
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  
  const email = e.target.querySelector('input[type="email"]').value;
  
  // Show success message (replace with actual newsletter signup)
  console.log('Newsletter signup:', email);
  alert('Thank you for subscribing!');
  e.target.reset();
  
  // TODO: Integrate with newsletter service (Mailchimp, ConvertKit, etc.)
}

// Animated Counters
function initCounters() {
  const counters = document.querySelectorAll('.proof-number');
  
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.dataset.count);
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps
  let current = 0;
  
  const updateCounter = () => {
    current += increment;
    
    if (current < target) {
      element.textContent = Math.floor(current);
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target;
    }
  };
  
  updateCounter();
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Lazy loading images
function initLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }
}

// Initialize lazy loading
initLazyLoading();

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Handle resize events here
    const navMenu = document.getElementById('navMenu');
    if (window.innerWidth >= 1024 && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      document.getElementById('hamburger').classList.remove('active');
      document.body.style.overflow = '';
    }
  }, 250);
});

// Video modal (for "Watch My Story" button)
const videoButtons = document.querySelectorAll('[data-video]');
videoButtons.forEach(button => {
  button.addEventListener('click', () => {
    const videoId = button.dataset.video;
    // TODO: Implement video modal
    console.log('Open video:', videoId);
    alert('Video player would open here. Integrate with YouTube/Vimeo player.');
  });
});

// Performance monitoring (optional)
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log('Page load time:', pageLoadTime + 'ms');
    }, 0);
  });
}
