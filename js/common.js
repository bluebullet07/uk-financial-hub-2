// ==========================================================================
// UK Financial Hub - Common Utilities
// ==========================================================================

/**
 * Format number as UK currency (£)
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, decimals = 2) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Parse currency string to number
 * @param {string} str - String to parse
 * @returns {number} Parsed number
 */
function parseCurrency(str) {
  return parseFloat(str.replace(/[£,]/g, '')) || 0;
}

/**
 * Sync slider with input field
 * @param {HTMLInputElement} slider - Range input element
 * @param {HTMLInputElement} input - Number input element
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

/**
 * Debounce function to limit calculation frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
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
 * Toggle FAQ item
 */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-question');
  
  faqItems.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains('active');
      
      // Close all FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Open clicked item if it wasn't active
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.nav-menu');
  
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }
}

/**
 * Set active navigation link
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Create a simple chart using Chart.js
 * @param {string} canvasId - ID of canvas element
 * @param {Object} config - Chart configuration
 */
function createChart(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  return new Chart(ctx, config);
}

/**
 * Initialize common features on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initMobileMenu();
  setActiveNavLink();
});

/**
 * UK Tax bands for 2025/26 (can be easily updated)
 */
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

/**
 * National Insurance bands for 2025/26
 */
const NI_BANDS = {
  class1: {
    primary: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 0.08 },
      { min: 50270, max: Infinity, rate: 0.02 }
    ]
  }
};

/**
 * Stamp Duty Land Tax bands for 2025/26
 */
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

/**
 * Toggle jargon card expansion (for jargon buster sections)
 * @param {HTMLElement} card - The jargon card element to toggle
 */
function toggleJargon(card) {
  const isActive = card.classList.contains('active');
  
  // Close all cards
  document.querySelectorAll('.jargon-card').forEach(c => {
    c.classList.remove('active');
  });
  
  // Open clicked card if it wasn't active
  if (!isActive) {
    card.classList.add('active');
  }
}
