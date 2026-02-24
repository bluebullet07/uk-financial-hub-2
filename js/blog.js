// Blog Post JavaScript

// FAQ Accordion
document.addEventListener('DOMContentLoaded', function() {
  // FAQ handled by common.js initFAQ()

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Social share buttons (actual functionality)
  const shareButtons = document.querySelectorAll('.share-btn');
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title);
  
  shareButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      let shareUrl = '';
      
      if (this.classList.contains('linkedin')) {
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
      } else if (this.classList.contains('twitter')) {
        shareUrl = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
      } else if (this.classList.contains('facebook')) {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
      }
      
      if (shareUrl) {
        window.open(shareUrl, 'share', 'width=600,height=400');
      }
    });
  });

  // Reading progress bar (optional enhancement)
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    z-index: 9999;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  });

  // Copy link button (optional)
  const copyButtons = document.querySelectorAll('.copy-link');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
      });
    });
  });
});
