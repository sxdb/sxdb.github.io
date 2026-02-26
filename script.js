// Get the URL param and shortened hostname
const params = new URLSearchParams(window.location.search);
const fullUrl = params.get('url');
const span = document.querySelector('.shortenedurl');

if (fullUrl) {
  try {
    const urlObj = new URL(fullUrl);
    const shortened = urlObj.hostname;
    span.textContent = shortened;

    createParticles(40);

    // Redirect after 4 seconds
    setTimeout(() => {
      window.location.href = fullUrl;
    }, 4000);

  } catch {
    span.textContent = 'Invalid URL';
  }
} else {
  span.textContent = 'No URL Provided';
}

// Particle creation function
function createParticles(count) {
  const container = document.getElementById('particles');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    const size = 3 + Math.random() * 5;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.backgroundColor = accent;

    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    p.style.top = startY + 'vh';
    p.style.left = startX + 'vw';

    const deltaX = (Math.random() - 0.5) * 4;  // horizontal float range
    const deltaY = (Math.random() - 0.5) * 4;  // vertical float range

    // Animate floating with smooth yoyo effect
    p.animate([
      { transform: 'translate(0, 0)', opacity: 0.15 },
      { transform: `translate(${deltaX}vw, ${deltaY}vh)`, opacity: 0.05 },
      { transform: 'translate(0, 0)', opacity: 0.15 }
    ], {
      duration: 7000 + Math.random() * 7000,
      iterations: Infinity,
      easing: 'ease-in-out',
      delay: Math.random() * 7000
    });

    container.appendChild(p);
  }
}
