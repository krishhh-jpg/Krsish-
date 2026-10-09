/**
 * 119 LAUNDRY & Dry Cleaning - Main Script
 * Handles Navigation, Accordions, Dynamic Pricing Calculator,
 * Form Validation & Booking, and WhatsApp Dispatch
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initFaqAccordion();
  initLaundryCalculator();
  initPickupForm();
  initWaitlistModal();
});

/* ----------------------------------------------------
 * 0. Theme Switcher (Light / Dark)
 * ---------------------------------------------------- */
function initTheme() {
  const THEME_KEY = '119_theme';

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function getEffectiveTheme() {
    const saved = getSavedTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}

    // Update aria labels and tooltips on all theme toggle buttons
    const isDark = theme === 'dark';
    const nextLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.setAttribute('aria-label', nextLabel);
      btn.setAttribute('title', nextLabel);
    });
  }

  // Bind click listeners on all theme toggle buttons (header, mobile, drawer)
  const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = document.documentElement.getAttribute('data-theme') || getEffectiveTheme();
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });

  // Listen to OS scheme changes if user hasn't explicitly set a preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Ensure current theme state is synced on load
  applyTheme(getEffectiveTheme());
}

/* ----------------------------------------------------
 * 1. Navigation & Mobile Drawer
 * ---------------------------------------------------- */
function initNavigation() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky navbar shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  function toggleDrawer(open) {
    const isOpen = open !== undefined ? open : !mobileDrawer?.classList.contains('open');
    if (isOpen) {
      mobileDrawer?.classList.add('open');
      drawerOverlay?.classList.add('active');
      mobileToggle?.classList.add('active');
      mobileToggle?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      mobileDrawer?.classList.remove('open');
      drawerOverlay?.classList.remove('active');
      mobileToggle?.classList.remove('active');
      mobileToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  mobileToggle?.addEventListener('click', () => toggleDrawer());
  drawerOverlay?.addEventListener('click', () => toggleDrawer(false));
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleDrawer(false);
      closeWaitlistModal();
    }
  });
}

/* ----------------------------------------------------
 * 2. FAQ Accordion
 * ---------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        questionBtn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ----------------------------------------------------
 * 3. Interactive Laundry Price Calculator
 * ---------------------------------------------------- */
function initLaundryCalculator() {
  const weightSlider = document.getElementById('calcWeight');
  const weightDisplay = document.getElementById('calcWeightVal');
  const serviceRadios = document.querySelectorAll('input[name="calcService"]');
  const totalPriceDisplay = document.getElementById('calcTotalPrice');
  const bookCalcBtn = document.getElementById('bookCalcBtn');

  if (!weightSlider || !totalPriceDisplay) return;

  function updateCalculation() {
    const weight = parseFloat(weightSlider.value) || 4;
    weightDisplay.textContent = `${weight} kg`;

    let rate = 189; // default Wash & Iron (Signature)
    let serviceKey = 'wash-iron';
    serviceRadios.forEach(radio => {
      if (radio.checked) {
        rate = parseInt(radio.value, 10);
        serviceKey = radio.dataset.serviceKey || 'wash-iron';
      }
    });

    const total = Math.round(weight * rate);
    totalPriceDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;

    if (bookCalcBtn) {
      bookCalcBtn.href = `membership-contact.html?service=${serviceKey}&weight=${weight}#pickup-form`;
    }
  }

  weightSlider.addEventListener('input', updateCalculation);
  serviceRadios.forEach(radio => {
    radio.addEventListener('change', updateCalculation);
  });

  // Preset chips
  const presetChips = document.querySelectorAll('.calc-preset-chip');
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.getAttribute('data-weight');
      if (val) {
        weightSlider.value = val;
        updateCalculation();
      }
    });
  });

  updateCalculation();
}

/* ----------------------------------------------------
 * 4. Schedule a Pickup Form
 * ---------------------------------------------------- */
function initPickupForm() {
  const form = document.getElementById('pickupForm');
  const successBox = document.getElementById('pickupSuccessBox');
  const dateInput = document.getElementById('pickupDate');
  const serviceSelect = document.getElementById('pickupService');
  const weightSelect = document.getElementById('pickupWeight');
  const waConfirmBtn = document.getElementById('waConfirmBtn');
  const bookingRefCode = document.getElementById('bookingRefCode');

  if (!form) return;

  // Set min date to today, default to tomorrow
  if (dateInput) {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    dateInput.min = todayIso;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // Pre-fill from query params (e.g. ?service=wash-iron&weight=5)
  const urlParams = new URLSearchParams(window.location.search);
  const paramService = urlParams.get('service');
  const paramWeight = urlParams.get('weight');

  if (paramService && serviceSelect) {
    if (paramService.includes('iron') || paramService === 'wash-iron') {
      serviceSelect.value = 'wash-iron';
    } else if (paramService.includes('fold') || paramService === 'wash-fold') {
      serviceSelect.value = 'wash-fold';
    } else if (paramService.includes('dry') || paramService === 'dry-cleaning') {
      serviceSelect.value = 'dry-cleaning';
    }
  }

  if (paramWeight && weightSelect) {
    const weightNum = parseFloat(paramWeight);
    if (weightNum <= 4) weightSelect.value = '2-4kg';
    else if (weightNum <= 8) weightSelect.value = '5-8kg';
    else if (weightNum <= 12) weightSelect.value = '9-12kg';
    else weightSelect.value = '13kg+';
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      Submitting Request...
    `;

    // Extract form data
    const fullName = document.getElementById('pickupName')?.value || 'Valued Customer';
    const mobile = document.getElementById('pickupPhone')?.value || '';
    const address = document.getElementById('pickupAddress')?.value || '';
    const serviceName = serviceSelect?.options[serviceSelect.selectedIndex]?.text || 'Wash & Iron — ₹189/kg (Signature)';
    const weightText = weightSelect?.options[weightSelect.selectedIndex]?.text || '3-5 kg';
    const pickupDate = dateInput?.value || 'Tomorrow';
    const pickupTime = document.getElementById('pickupTime')?.value || 'Morning (8 AM - 11 AM)';
    const instructions = document.getElementById('pickupNotes')?.value || 'None';

    // Generate realistic booking ID
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const refId = `119-BK${randomId}`;

    // Persist to Supabase if configured
    if (window.SupabaseService && typeof window.SupabaseService.savePickup === 'function') {
      window.SupabaseService.savePickup({
        booking_ref: refId,
        full_name: fullName,
        phone: mobile,
        address: address,
        service: serviceName,
        estimated_weight: weightText,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        notes: instructions
      });
    }

    // Fast, responsive user experience
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      if (bookingRefCode) {
        bookingRefCode.textContent = refId;
      }

      // Hide form, show success box
      form.style.display = 'none';
      if (successBox) {
        successBox.classList.add('show');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Setup WhatsApp instant action
      if (waConfirmBtn) {
        const waMessage = encodeURIComponent(
          `Hello 119 LAUNDRY! 🧺\n\nI just scheduled a pickup on your website.\n*Booking ID:* ${refId}\n*Name:* ${fullName}\n*Phone:* ${mobile}\n*Service:* ${serviceName}\n*Estimated Weight:* ${weightText}\n*Pickup Date:* ${pickupDate}\n*Time Slot:* ${pickupTime}\n*Address:* ${address}\n*Notes:* ${instructions}\n\nPlease confirm my slot. Thank you!`
        );
        waConfirmBtn.href = `https://wa.me/917639556677?text=${waMessage}`;
      }
    }, 600);
  });
}

/* ----------------------------------------------------
 * 5. Membership Waitlist Modal
 * ---------------------------------------------------- */
function initWaitlistModal() {
  const modal = document.getElementById('waitlistModal');
  const openButtons = document.querySelectorAll('.open-waitlist-btn');
  const closeButton = modal?.querySelector('.modal-close-btn');
  const form = document.getElementById('waitlistForm');
  const successMsg = document.getElementById('waitlistSuccess');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  closeButton?.addEventListener('click', closeWaitlistModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeWaitlistModal();
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('wlName')?.value || '';
    const phone = document.getElementById('wlPhone')?.value || '';
    const frequency = document.getElementById('wlFrequency')?.value || 'weekly';

    // Persist waitlist to Supabase
    if (window.SupabaseService && typeof window.SupabaseService.saveWaitlist === 'function') {
      window.SupabaseService.saveWaitlist({
        full_name: name,
        phone: phone,
        frequency: frequency
      });
    }

    if (form) form.style.display = 'none';
    if (successMsg) successMsg.style.display = 'block';
  });
}

function closeWaitlistModal() {
  const modal = document.getElementById('waitlistModal');
  modal?.classList.remove('active');
}
