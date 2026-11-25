/* Pothos — interactions
   The habit demo grows an SVG plant, fills a progress ring and fires a
   small canvas confetti burst; plus a testimonial carousel, mobile nav and
   reveal-on-scroll. No dependencies. */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------- header + nav */

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setNav = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  };
  toggle.addEventListener("click", () => setNav(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
      toggle.focus();
    }
  });

  /* ------------------------------------------------------------ the demo */

  const plant = document.querySelector(".plant");
  const stem = plant.querySelector(".stem");
  const growables = [...plant.querySelectorAll("[data-stage]")];
  const habits = [...document.querySelectorAll(".habit")];
  const checkboxes = habits.map((habit) => habit.querySelector("input"));
  const ringFill = document.querySelector(".ring-fill");
  const doneEl = document.querySelector("[data-done]");
  const statusEl = document.querySelector("[data-plant-status]");
  const streakEl = document.querySelector("[data-streak]");
  const streakChip = document.querySelector(".streak");
  const resetButton = document.querySelector("[data-reset]");

  const RING_LENGTH = 2 * Math.PI * 18;
  const STEM_SHARE = [0, 0.38, 0.62, 0.84, 1]; // how much of the stem shows at each stage
  const MESSAGES = [
    "Your plant is waiting for its first habit.",
    "A sprout! Keep going.",
    "Two leaves happier already.",
    "Almost there. One more habit to bloom.",
    "Day complete. Your plant is in full bloom!",
  ];
  const BASE_STREAK = 12;

  const stemLength = stem.getTotalLength();
  stem.style.strokeDasharray = String(stemLength);
  stem.style.strokeDashoffset = String(stemLength);
  ringFill.style.strokeDasharray = String(RING_LENGTH);

  // Greeting and date on the phone follow the visitor's clock.
  const now = new Date();
  const hour = now.getHours();
  document.querySelector("[data-greeting]").textContent =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  document.querySelector("[data-date]").textContent = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  let bloomedToday = false;

  function render() {
    const done = checkboxes.filter((box) => box.checked).length;

    habits.forEach((habit, i) => habit.classList.toggle("is-checked", checkboxes[i].checked));
    stem.style.strokeDashoffset = String(stemLength * (1 - STEM_SHARE[done]));
    growables.forEach((el) => el.classList.toggle("is-grown", Number(el.dataset.stage) <= done));
    plant.classList.toggle("has-grown", done > 0);
    plant.classList.toggle("is-happy", done >= 2);

    ringFill.style.strokeDashoffset = String(RING_LENGTH * (1 - done / 4));
    doneEl.textContent = String(done);
    statusEl.textContent = MESSAGES[done];

    if (done === 4 && !bloomedToday) {
      bloomedToday = true;
      plant.classList.add("is-blooming");
      streakEl.textContent = String(BASE_STREAK + 1);
      if (!reduceMotion) {
        streakChip.classList.remove("bump");
        void streakChip.offsetWidth;
        streakChip.classList.add("bump");
        burstConfetti();
      }
      resetButton.hidden = false;
    }
    if (done < 4) plant.classList.remove("is-blooming");
  }

  checkboxes.forEach((box, i) => {
    box.addEventListener("change", render);
    box.addEventListener("focus", () => {
      if (box.matches(":focus-visible")) habits[i].classList.add("has-focus");
    });
    box.addEventListener("blur", () => habits[i].classList.remove("has-focus"));
  });

  resetButton.addEventListener("click", () => {
    checkboxes.forEach((box) => {
      box.checked = false;
    });
    bloomedToday = false;
    streakEl.textContent = String(BASE_STREAK);
    resetButton.hidden = true;
    render();
    checkboxes[0].focus();
  });

  render();
  requestAnimationFrame(() => requestAnimationFrame(() => plant.classList.add("is-ready")));

  /* ------------------------------------------------------------ confetti */

  const canvas = document.querySelector("[data-confetti]");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#ff7a59", "#ffd65c", "#2f9e6f", "#7fe0b0", "#0f3d2e"];
  let particles = [];
  let confettiFrame = 0;

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burstConfetti() {
    sizeCanvas();
    const canvasRect = canvas.getBoundingClientRect();
    const plantRect = plant.getBoundingClientRect();
    const originX = plantRect.left + plantRect.width / 2 - canvasRect.left;
    const originY = plantRect.top + plantRect.height * 0.35 - canvasRect.top;

    particles = Array.from({ length: 140 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = 5 + Math.random() * 9;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        life: 1,
        leaf: Math.random() < 0.35,
      };
    });

    cancelAnimationFrame(confettiFrame);
    const width = canvasRect.width;
    const height = canvasRect.height;

    const step = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.vy += 0.28;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.life -= 0.009;

        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.leaf) {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size / 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      });
      particles = particles.filter((p) => p.life > 0 && p.y < height + 40);
      if (particles.length) confettiFrame = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, width, height);
    };
    confettiFrame = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ carousel */

  const carousel = document.querySelector("[data-carousel]");
  const slidesEl = carousel.querySelector("[data-slides]");
  const slides = [...slidesEl.children];
  const dotsEl = carousel.querySelector("[data-dots]");
  const pauseButton = carousel.querySelector("[data-pause]");
  const AUTO_MS = 6000;
  let index = 0;
  let autoTimer = 0;
  let userPaused = reduceMotion;
  let hoverPaused = false;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    dot.addEventListener("click", () => goTo(i, true));
    dotsEl.append(dot);
    return dot;
  });

  function goTo(next, fromUser) {
    index = (next + slides.length) % slides.length;
    slidesEl.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
    // Announce changes the visitor asked for, but not automatic rotation.
    slidesEl.setAttribute("aria-live", fromUser ? "polite" : "off");
    restartAuto();
  }

  function restartAuto() {
    window.clearInterval(autoTimer);
    if (!userPaused && !hoverPaused) {
      autoTimer = window.setInterval(() => goTo(index + 1, false), AUTO_MS);
    }
  }

  carousel.querySelector("[data-prev]").addEventListener("click", () => goTo(index - 1, true));
  carousel.querySelector("[data-next]").addEventListener("click", () => goTo(index + 1, true));

  pauseButton.addEventListener("click", () => {
    userPaused = !userPaused;
    pauseButton.setAttribute("aria-pressed", String(userPaused));
    pauseButton.textContent = userPaused ? "Play" : "Pause";
    restartAuto();
  });
  if (reduceMotion) {
    pauseButton.setAttribute("aria-pressed", "true");
    pauseButton.textContent = "Play";
  }

  carousel.addEventListener("mouseenter", () => {
    hoverPaused = true;
    restartAuto();
  });
  carousel.addEventListener("mouseleave", () => {
    hoverPaused = false;
    restartAuto();
  });
  carousel.addEventListener("focusin", () => {
    hoverPaused = true;
    restartAuto();
  });
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      hoverPaused = false;
      restartAuto();
    }
  });

  // Swipe on touch screens.
  let touchX = null;
  slidesEl.addEventListener("touchstart", (event) => {
    touchX = event.touches[0].clientX;
  }, { passive: true });
  slidesEl.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), true);
    touchX = null;
  });

  goTo(0, false);

  /* ---------------------------------------------------- reveal on scroll */

  const targets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
    );
    targets.forEach((el) => observer.observe(el));
  } else {
    targets.forEach((el) => el.classList.add("is-visible"));
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
