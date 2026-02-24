/* ============================================
   DROPDOWN NAVIGATION JAVASCRIPT
   Add this to: js/dropdown-nav.js
   Or append to existing js/common.js
   ============================================ */

(function() {
  'use strict';
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    initDropdownNav();
  });
  
  function initDropdownNav() {
    const dropdowns = document.querySelectorAll('.dropdown');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // ============================================
    // Mobile Dropdown Toggle
    // ============================================
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!toggle || !menu) return;
      
      toggle.addEventListener('click', function(e) {
        // Only prevent default and toggle on mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();
          
          // Close other dropdowns
          dropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove('active');
            }
          });
          
          // Toggle current dropdown
          dropdown.classList.toggle('active');
        }
      });
    });
    
    // ============================================
    // Close Dropdowns When Clicking Outside
    // ============================================
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        if (!e.target.closest('.dropdown')) {
          dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
          });
        }
      }
    });
    
    // ============================================
    // Close Dropdowns on Window Resize
    // ============================================
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        // Close all dropdowns when switching between mobile/desktop
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }, 250);
    });
    
    // ============================================
    // Keyboard Navigation (Accessibility)
    // ============================================
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      const menuLinks = menu ? menu.querySelectorAll('a') : [];
      
      if (!toggle || !menu) return;
      
      // Open dropdown with Enter/Space
      toggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dropdown.classList.toggle('active');
          
          // Focus first menu item when opened
          if (dropdown.classList.contains('active') && menuLinks.length > 0) {
            setTimeout(() => menuLinks[0].focus(), 100);
          }
        }
        
        // Close with Escape
        if (e.key === 'Escape') {
          dropdown.classList.remove('active');
          toggle.focus();
        }
      });
      
      // Navigate menu items with arrow keys
      menuLinks.forEach((link, index) => {
        link.addEventListener('keydown', function(e) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextLink = menuLinks[index + 1];
            if (nextLink) nextLink.focus();
          }
          
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevLink = menuLinks[index - 1];
            if (prevLink) {
              prevLink.focus();
            } else {
              toggle.focus();
            }
          }
          
          if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            toggle.focus();
          }
        });
      });
    });
    
    // ============================================
    // Mobile Menu Toggle (Existing Functionality)
    // ============================================
    if (mobileMenuToggle && navMenu) {
      mobileMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        
        // Close all dropdowns when closing mobile menu
        if (!navMenu.classList.contains('active')) {
          dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
          });
        }
      });
    }
    
    // ============================================
    // Highlight Active Page in Dropdown
    // ============================================
    highlightActivePage();
  }
  
  // ============================================
  // Highlight Active Page
  // ============================================
  function highlightActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
    
    dropdownLinks.forEach(link => {
      const linkPage = link.getAttribute('href');
      if (linkPage === currentPage) {
        link.classList.add('active');
        
        // Also highlight parent dropdown
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
  
  // ============================================
  // Smooth Scroll to Top (Bonus Feature)
  // ============================================
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', function(e) {
      if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }
  
})();

/* ============================================
   USAGE NOTES:
   
   1. Include this file in your HTML:
      <script src="js/dropdown-nav.js"></script>
      
   2. Make sure it loads AFTER the DOM is ready
   
   3. Works with existing mobile menu toggle
   
   4. Fully accessible via keyboard
   
   5. Auto-highlights current page in dropdowns
   ============================================ */
