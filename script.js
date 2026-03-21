// 1. Initialize Particles.js
particlesJS("particles-js", {
  particles: {
    number: { value: 130, density: { enable: true, value_area: 800 } },
    color: { value: "#ff8000" },
    shape: { type: "circle" },
    opacity: {
      value: 0.5,
      random: true,
      anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
    },
    size: {
      value: 3,
      random: true,
      anim: { enable: false }
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ff8000",
      opacity: 0.2,
      width: 1
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" },
      resize: true
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 1 } },
      push: { particles_nb: 4 }
    }
  },
  retina_detect: true
});

// 2. Handle URL Logic
const params = new URLSearchParams(window.location.search);
const fullUrl = params.get('url');
const span = document.querySelector('.shortenedurl');

if (fullUrl) {
    try {
        const urlObj = new URL(fullUrl);
        span.textContent = urlObj.hostname;

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = fullUrl;
        }, 3500);
    } catch {
        span.textContent = "Invalid Link";
    }
} else {
    span.textContent = "No URL Found";
}
