/* ==========================================================================
   UK Financial Hub - Common JavaScript
   Dark Theme + Calculator Utilities
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initDropdowns();
  initSliders();
  highlightActivePage();
  initFAQ();
});

/* ==========================================================================
   Mobile Menu Toggle
   ========================================================================== */

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.nav-menu');
  
  if (!toggle || !menu) return;
  
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    
    const isOpen = menu.classList.contains('active');
    toggle.setAttribute('aria-expanded', isOpen);
    
    if (!isOpen) {
      document.querySelectorAll('.dropdown').forEach(dd => {
        dd.classList.remove('active');
      });
    }
  });
  
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!e.target.closest('.nav-container')) {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        document.querySelectorAll('.dropdown').forEach(dd => {
          dd.classList.remove('active');
        });
      }
    }
  });
}

/* ==========================================================================
   Dropdown Functionality
   ========================================================================== */

function initDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(function(dropdown) {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    if (!toggle) return;
    
    toggle.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        
        dropdowns.forEach(function(other) {
          if (other !== dropdown) {
            other.classList.remove('active');
          }
        });
        
        dropdown.classList.toggle('active');
      }
    });
    
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdown.classList.toggle('active');
        
        const menu = dropdown.querySelector('.dropdown-menu');
        const firstLink = menu?.querySelector('a');
        if (dropdown.classList.contains('active') && firstLink) {
          setTimeout(() => firstLink.focus(), 100);
        }
      }
      
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        toggle.focus();
      }
    });
  });
}

/* ==========================================================================
   Slider/Input Sync
   ========================================================================== */

function initSliders() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const inputId = slider.id.replace('Slider', '');
    const input = document.getElementById(inputId);
    
    if (input) {
      slider.addEventListener('input', function() {
        input.value = this.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      input.addEventListener('input', function() {
        if (parseFloat(this.value) >= parseFloat(slider.min) && 
            parseFloat(this.value) <= parseFloat(slider.max)) {
          slider.value = this.value;
        }
      });
    }
  });
}

/**
 * Legacy slider sync function (used by some calculator JS files)
 */
function syncSliderAndInput(slider, input) {
  slider.addEventListener('input', (e) => {
    input.value = e.target.value;
    input.dispatchEvent(new Event('input'));
  });
  
  input.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 0;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    
    if (value >= min && value <= max) {
      slider.value = value;
    }
  });
}

/* ==========================================================================
   Highlight Active Page
   ========================================================================== */

function highlightActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
  
  document.querySelectorAll('.dropdown-menu a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
      
      const parentDropdown = link.closest('.dropdown');
      if (parentDropdown) {
        const parentToggle = parentDropdown.querySelector('.dropdown-toggle');
        if (parentToggle) {
          parentToggle.classList.add('active');
        }
      }
    }
  });
}

/* ==========================================================================
   FAQ Toggle
   ========================================================================== */

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-question');
  
  faqItems.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      faqItem.classList.toggle('active');
    });
  });
}

/* ==========================================================================
   Jargon Card Toggle
   ========================================================================== */

function toggleJargon(card) {
  const isActive = card.classList.contains('active');
  
  document.querySelectorAll('.jargon-card').forEach(c => {
    c.classList.remove('active');
  });
  
  if (!isActive) {
    card.classList.add('active');
  }
}

/* ==========================================================================
   Modal Functions
   ========================================================================== */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

/* ==========================================================================
   Formatting Utilities
   ========================================================================== */

function formatCurrency(amount, decimals = 2) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

function formatPercentage(value, decimals = 1) {
  return value.toFixed(decimals) + '%';
}

function parseCurrency(str) {
  return parseFloat(str.replace(/[£,]/g, '')) || 0;
}

function debounce(func, wait = 100) {
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

/**
 * Create a Chart.js chart
 */
function createChart(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, config);
}

/* ==========================================================================
   UK Tax Data 2025/26
   ========================================================================== */

const UK_TAX_BANDS = {
  england: {
    personalAllowance: 12570,
    bands: [
      { min: 0, max: 12570, rate: 0, name: 'Personal Allowance' },
      { min: 12570, max: 50270, rate: 0.20, name: 'Basic rate' },
      { min: 50270, max: 125140, rate: 0.40, name: 'Higher rate' },
      { min: 125140, max: Infinity, rate: 0.45, name: 'Additional rate' }
    ]
  },
  scotland: {
    personalAllowance: 12570,
    bands: [
      { min: 0, max: 12570, rate: 0, name: 'Personal Allowance' },
      { min: 12570, max: 14876, rate: 0.19, name: 'Starter rate' },
      { min: 14876, max: 26561, rate: 0.20, name: 'Basic rate' },
      { min: 26561, max: 43662, rate: 0.21, name: 'Intermediate rate' },
      { min: 43662, max: 75000, rate: 0.42, name: 'Higher rate' },
      { min: 75000, max: 125140, rate: 0.45, name: 'Advanced rate' },
      { min: 125140, max: Infinity, rate: 0.48, name: 'Top rate' }
    ]
  }
};

const NI_BANDS = {
  class1: {
    primary: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 0.08 },
      { min: 50270, max: Infinity, rate: 0.02 }
    ]
  }
};

const SDLT_BANDS = {
  standard: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 925000, rate: 0.05 },
    { min: 925000, max: 1500000, rate: 0.10 },
    { min: 1500000, max: Infinity, rate: 0.12 }
  ],
  firstTimeBuyer: [
    { min: 0, max: 425000, rate: 0 },
    { min: 425000, max: 625000, rate: 0.05 }
  ],
  additional: [
    { min: 0, max: 250000, rate: 0.05 },
    { min: 250000, max: 925000, rate: 0.10 },
    { min: 925000, max: 1500000, rate: 0.15 },
    { min: 1500000, max: Infinity, rate: 0.17 }
  ]
};
