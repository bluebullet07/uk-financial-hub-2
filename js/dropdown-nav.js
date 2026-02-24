/* ============================================
   ULTRA SIMPLE MOBILE MENU - GUARANTEED TO WORK
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Mobile menu script loaded');
  
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.nav-menu');
  const dropdowns = document.querySelectorAll('.dropdown');
  
  // Debug: Check elements exist
  console.log('Toggle button:', toggle);
  console.log('Nav menu:', menu);
  console.log('Dropdowns found:', dropdowns.length);
  
  if (!toggle || !menu) {
    console.error('❌ Mobile menu elements not found!');
    return;
  }
  
  // ============================================
  // Mobile Menu Toggle
  // ============================================
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isActive = menu.classList.toggle('active');
    toggle.classList.toggle('active');
    
    console.log('📱 Mobile menu toggled:', isActive ? 'OPEN' : 'CLOSED');
    
    // Close dropdowns when closing menu
    if (!isActive) {
      dropdowns.forEach(dd => dd.classList.remove('active'));
    }
  });
  
  // ============================================
  // Dropdown Toggle (Mobile Only)
  // ============================================
  dropdowns.forEach(function(dropdown) {
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    
    if (!dropdownToggle) return;
    
    dropdownToggle.addEventListener('click', function(e) {
      // Only handle on mobile
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(function(other) {
          if (other !== dropdown) {
            other.classList.remove('active');
          }
        });
        
        // Toggle this dropdown
        const isActive = dropdown.classList.toggle('active');
        console.log('📂 Dropdown toggled:', isActive ? 'OPEN' : 'CLOSED');
      }
    });
  });
  
  // ============================================
  // Close menu when clicking outside
  // ============================================
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!e.target.closest('.nav-container')) {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        dropdowns.forEach(dd => dd.classList.remove('active'));
        console.log('🔒 Menu closed (clicked outside)');
      }
    }
  });
  
  console.log('✅ Mobile menu initialized successfully');
});
