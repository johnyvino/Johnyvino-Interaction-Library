(function () {
  'use strict';

  // ── DATA ─────────────────────────────────────────────────────────────────

  const categories = [
    {
      id: 'featured', name: 'Featured', color: '#F59E0B',
      files: [
        'Assets/Featured/music-player.mp4',
        'Assets/Featured/google-login.mp4',
        'Assets/Featured/5c6e380b88c954cf05beab78_split-bill-interaction-tips-calculator.mp4',
        'Assets/Featured/5c6e494b88c95407b3bed179_chat-bot.mp4',
        'Assets/Featured/5c6e494e88c9545246bed17f_google-business.mp4',
        'Assets/Featured/5c6e494f025323c4c3dd5578_airbnb-food.mp4',
        'Assets/Featured/5c6e494f1c5eee14e8e7ce15_google3.mp4',
        'Assets/Featured/5c6e4951025323fe73dd5584_meet-2.mp4',
        'Assets/Featured/5c6e495288c9541e70bed182_mnc.mp4',
        'Assets/Featured/5c6e49549de5966dcdb46323_invite-bitcoin.mp4',
        'Assets/Featured/5c6e495388c954897abed183_hair-saloon.mp4',
        'Assets/Featured/5c6e4955e965e254b2167efe_saloon-multiple.mp4',
      ]
    },
    {
      id: 'business', name: 'Business', color: '#3B82F6',
      files: [
        'Assets/Business/onboarding-flow.mp4',
        'Assets/Business/business-size.mp4',
        'Assets/Business/5c6e4c939de596e823b46791_gmail.mp4',
        'Assets/Business/5c6e4c950253237dabdd5834_caleder.mp4',
        'Assets/Business/5c6e4c95bf98b281e6f5e652_hire.mp4',
        'Assets/Business/5c6e4c96e965e2282e168324_idea.mp4',
        'Assets/Business/5c6e4c97025323ea0cdd588a_company-profile.mp4',
        'Assets/Business/5c6e4c97bf98b2b92ef5e659_law.mp4',
        'Assets/Business/5c6e4c97e965e244dc168325_1onboarding-any-company.mp4',
        'Assets/Business/5c6e4c989de5967746b46792_mock2l.mp4',
        'Assets/Business/5c6e4c98bf98b21c0bf5e65b_share.mp4',
        'Assets/Business/5c6e4c98e965e2a7b2168326_mystartup.mp4',
        'Assets/Business/5c6e4c9902532307ebdd588e_schedule.mp4',
        'Assets/Business/5c6e4c991c5eee2041e7d28a_new.mp4',
        'Assets/Business/5c6e4c991c5eee5f28e7d289_screeening.mp4',
        'Assets/Business/5c6e4c991c5eeeb48ae7d28d_task1.mp4',
        'Assets/Business/5c6e4c9a1c5eee7b64e7d28f_todolist-menu-interaction.mp4',
        'Assets/Business/5c6e4c9a1c5eeedf9ce7d28e_tenant.mp4',
      ]
    },
    {
      id: 'finance', name: 'Finance', color: '#14B8A6',
      files: [
        'Assets/Finance/5c6e3809025323a911dd4318_filtercalendar.mp4',
        'Assets/Finance/5c6e380a1c5eee61fee7b944_collect_money.mp4',
        'Assets/Finance/5c6e500c1c5eee15efe7d4f3_add-card.mp4',
        'Assets/Finance/5c6e500cbf98b279d5f5e90b_blockchain-login.mp4',
        'Assets/Finance/5c6e500f9de596de75b46e08_lazy-overview.mp4',
        'Assets/Finance/5c6e5012025323a491dd613e_scan-orcode.mp4',
        'Assets/Finance/5c6e5013025323a275dd613f_permission-popup.mp4',
        'Assets/Finance/5c6e50149de5962d72b46e0a_slideup-microloan.mp4',
        'Assets/Finance/5c6e50149de596c703b46e0b_select-plan-interaction.mp4',
        'Assets/Finance/5c772582f8ce84fa0c27f499_3-Cogni-Brain.mp4',
        'Assets/Finance/5c772583760c9554885b0b86_1-Cogni-motivate.mp4',
        'Assets/Finance/5c772583d0b9b37c5e53cc6f_8-Finance-add-credit-card.mp4',
        'Assets/Finance/5c772583ef1968217fbdaa63_5-Complete-bucket.mp4',
        'Assets/Finance/5c772583ef196842cabdaa64_4-Cogni-bucket.mp4',
        'Assets/Finance/5c772583f8ce84383027f49c_7-Cogni-graph.mp4',
        'Assets/Finance/5c772583f8ce84aa0727f49b_9-cogni-card-freez.mp4',
        'Assets/Finance/5c772584ef196826d5bdaa67_13-Create-bucket.mp4',
        'Assets/Finance/5c772584f8ce843af927f49e_15-Past-bucket.mp4',
        'Assets/Finance/5c772585ef196873c8bdaa69_10-send-money-to-people.mp4',
        'Assets/Finance/5c772586ef1968525cbdaa71_18-Cogni-refunded.mp4',
        'Assets/Finance/5c772587ef19687d32bdaa72_17-Cogni-remove-money.mp4',
        'Assets/Finance/5c772587f8ce84530327f4a3_17-Cogni-payment.mp4',
        'Assets/Finance/5c772588ef196856d8bdaa75_21-Cogni-top-up.mp4',
        'Assets/Finance/5c772589760c9571ec5b0b8b_20-cogni-timmer-animation.mp4',
        'Assets/Finance/5c77258af8ce84554527f4ff_24-Cogni-remove-money.mp4',
        'Assets/Finance/5c77258b760c95c9965b0b8f_19-Cogni-add-bucket.mp4',
        'Assets/Finance/5c77258ba943c35fd98e6e1d_23-cogni-pay.mp4',
        'Assets/Finance/5c77258c760c950abf5b0b91_26-Lancing.mp4',
      ]
    },
    {
      id: 'food', name: 'Food', color: '#F97316',
      files: [
        'Assets/Food/food-app-01.mp4',
        'Assets/Food/food-app-02.mp4',
        'Assets/Food/food-app-03.mp4',
        'Assets/Food/food-app-04.mp4',
        'Assets/Food/5c6e51959de5966073b46ec8_filter-food-interaction.mp4',
        'Assets/Food/5c6e51961c5eee711de7d6c5_foodapp-login.mp4',
        'Assets/Food/5c6e5196e965e23ce0168bc8_meetup.mp4',
        'Assets/Food/5c6e5199025323f8e9dd628d_add-to-cart-interaction.mp4',
        'Assets/Food/5c6e519b0253230f67dd628f_order-food.mp4',
        'Assets/Food/5c6e519bbf98b2241cf5eeed_receipe1.mp4',
        'Assets/Food/5c6e519c025323e0aadd6290_yelp-mobile-web-experience.mp4',
        'Assets/Food/5c772585a943c37fb08e6dc0_11-Journey-points.mp4',
      ]
    },
    {
      id: 'health', name: 'Health', color: '#EC4899',
      files: [
        'Assets/Health_fitness/5c6e528d88c9547912bee38c_diet-men.mp4',
        'Assets/Health_fitness/5c6e528e9de59666b7b46f7e_gender.mp4',
        'Assets/Health_fitness/5c6e5294025323fb4cdd6347_schedule.mp4',
        'Assets/Health_fitness/5c6e5294bf98b2e93af5f058_mypillsapp.mp4',
        'Assets/Health_fitness/5c77258c760c95f8725b0b92_27-BMI-calculator.mp4',
        'Assets/Health_fitness/visit-verification-card.mp4',
      ]
    },
    {
      id: 'travel', name: 'Travel', color: '#06B6D4',
      files: [
        'Assets/Transportation/travel-app.mp4',
        'Assets/Transportation/5c6e38769de5963efdb44211_preference-ios-uber-driver-rider.mp4',
        'Assets/Transportation/5c77258d760c95a32c5b0b93_25-google-new.mp4',
        'Assets/Transportation/5c77258df8ce8470fc27f502_22-Wasel-ice-cream.mp4',
        'Assets/Transportation/travel-interaction-01.mp4',
        'Assets/Transportation/travel-interaction-02.mp4',
        'Assets/Transportation/travel-interaction-03.mp4',
        'Assets/Transportation/travel-interaction-04.mp4',
      ]
    },
    {
      id: 'media', name: 'Media', color: '#8B5CF6',
      files: [
        'Assets/News/5c77258a760c95468c5b0b8e_14-Newyork-times.mp4',
        'Assets/News/5c77258df8ce84874327f501_28-Tv-list.mp4',
        'Assets/Photos_videos/5c6e53789de5967617b47081_events-near-you-discover.mp4',
        'Assets/Photos_videos/5c6e5378bf98b2db12f5f24c_events.mp4',
        'Assets/Photos_videos/5c6e53801c5eeea3d6e7da3c_pricing.mp4',
        'Assets/Photos_videos/5c6e5401e965e2f732169030_pinterest-concept.mp4',
        'Assets/Photos_videos/5c772589a943c342cc8e6e1a_12-Movie-night.mp4',
      ]
    },
    {
      id: 'shopping', name: 'Shopping', color: '#FB7185',
      files: [
        'Assets/Lifestyle/shopping-app.mp4',
        'Assets/Lifestyle/5c6e5427025323bb49dd63eb_shopping.quick.mp4',
        'Assets/Lifestyle/5c6e5427bf98b255aef5f2ad_watch-app-ar-vr-marketplace.mp4',
        'Assets/Lifestyle/5c6e5427e965e2849516903b_e.mp4',
      ]
    },
    {
      id: 'social', name: 'Social', color: '#6366F1',
      files: [
        'Assets/Social-Networking/5c6e4f750253232ff9dd5a1a_splash-screen.mp4',
        'Assets/Social-Networking/5c6e4f760253234ccfdd5a1c_whatsapp.mp4',
      ]
    },
    {
      id: 'productivity', name: 'Productivity', color: '#84CC16',
      files: [
        'Assets/MISCELLANEOUS/5c6e556c88c9548074bee6eb_interaction-menu-navigation-setting-ui-ux-clean.mp4',
        'Assets/MISCELLANEOUS/5c6e55729de5964525b4763a_menu.mp4',
        'Assets/MISCELLANEOUS/5c6e557388c9543250bee6ed_signature.mp4',
        'Assets/MISCELLANEOUS/productivity-interaction.mp4',
        'Assets/MISCELLANEOUS/5c77258cf8ce8493a727f500_29-Password.mp4',
        'Assets/Utilities/utility-app.mp4',
        'Assets/Utilities/5c6e53179de5964b9db47049_capt.mp4',
        'Assets/Utilities/5c6e53190253231082dd6382_wages.mp4',
        'Assets/Utilities/5c6e531a9de596970db4704a_wash.mp4',
        'Assets/Utilities/5c772584ef196871c6bdaa68_2-aircondition1.mp4',
        'Assets/checklist-card.mp4',
      ]
    },
  ];

  const svgIcons = {
    featured:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    business:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>`,
    finance:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    food:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
    health:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    travel:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    media:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    shopping:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
    social:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
    productivity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  };

  // ── SCROLL LOCK ───────────────────────────────────────────────────────────

  let scrollLocks = 0;
  function lockScroll() {
    if (++scrollLocks === 1) document.body.classList.add('no-scroll');
  }
  function unlockScroll() {
    if (--scrollLocks <= 0) { scrollLocks = 0; document.body.classList.remove('no-scroll'); }
  }

  // ── BUILD SIDEBAR NAV ─────────────────────────────────────────────────────

  const nav = document.getElementById('sidebarNav');
  categories.forEach((cat, i) => {
    const a = document.createElement('a');
    a.href = `#${cat.id}`;
    a.className = 'nav-item' + (i === 0 ? ' active' : '');
    a.dataset.section = cat.id;
    a.innerHTML = `<span class="cat-icon" data-cat="${cat.id}" aria-hidden="true">${svgIcons[cat.id]}</span><span class="nav-label">${cat.name}</span>`;
    nav.appendChild(a);
  });

  // ── TITLE NORMALISATION ───────────────────────────────────────────────────

  const titleOverrides = {
    // Spelling fixes
    'caleder':                                  'Calendar',
    'screeening':                               'Screening',
    'receipe1':                                 'Recipe',
    'scan-orcode':                              'Scan QR Code',
    'hair-saloon':                              'Hair Salon',
    'saloon-multiple':                          'Salon',
    'mypillsapp':                               'My Pills',
    'mystartup':                                'My Startup',
    'foodapp-login':                            'Food App',
    'filtercalendar':                           'Filter Calendar',
    'cogni-timmer-animation':                   'Cogni Timer',
    'cogni-card-freez':                         'Cogni Card Freeze',
    'Finance-add-credit-card':                  'Add Credit Card',
    'Newyork-times':                            'New York Times',
    'Tv-list':                                  'TV List',
    'BMI-calculator':                           'BMI Calculator',
    'google-new':                               'Google Maps',
    'Wasel-ice-cream':                          'Wasel Delivery',
    'aircondition1':                            'Air Conditioning',
    // Shortened names
    'split-bill-interaction-tips-calculator':   'Split Bill',
    'todolist-menu-interaction':                'To Do List',
    'add-to-cart-interaction':                  'Add to Cart',
    'filter-food-interaction':                  'Filter Food',
    'select-plan-interaction':                  'Select Plan',
    'yelp-mobile-web-experience':               'Yelp',
    'lazy-overview':                            'Overview',
    'slideup-microloan':                        'Micro Loan',
    '1onboarding-any-company':                  'Onboarding',
    'interaction-menu-navigation-setting-ui-ux-clean': 'Menu Navigation',
    'preference-ios-uber-driver-rider':         'Uber Driver',
    'events-near-you-discover':                 'Discover Events',
    'watch-app-ar-vr-marketplace':              'AR Marketplace',
    'shopping.quick':                           'Quick Shopping',
    // Other cleanup
    'visit-verification-card':                  'Visit Verification',
    'checklist-card':                           'Checklist',
    'meet-2':                                   'Meet',
    'google3':                                  'Google',
    'task1':                                    'Task Manager',
    'mock2l':                                   'Mockup',
    'diet-men':                                 'Diet',
    'invite-bitcoin':                           'Bitcoin',
    'mnc':                                      'MNC',
    'e':                                        'E-commerce',
    'whatsapp':                                 'WhatsApp',
    'capt':                                     'Capture',
  };

  function titleFromPath(filePath) {
    let name = filePath.split('/').pop().replace('.mp4', '');
    name = name.replace(/^[a-f0-9]{6,}_/, '').trim();
    if (name in titleOverrides) return titleOverrides[name];
    name = name.replace(/~mv2$/, '');
    if (/^[a-f0-9]{16,}$/.test(name)) return '';
    name = name.replace(/^\d+-/, '');
    if (name in titleOverrides) return titleOverrides[name];
    return name.replace(/[-_.]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── BUILD SECTIONS & CARDS ────────────────────────────────────────────────

  const sectionsEl = document.getElementById('sections');
  categories.forEach(cat => {
    const section = document.createElement('section');
    section.id = cat.id;
    section.className = 'category-section';

    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = cat.name;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    cat.files.forEach((file, i) => {
      const t = titleFromPath(file);
      const title = t || `${cat.name} ${String(i + 1).padStart(2, '0')}`;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        `<div class="card-thumb">` +
        `<video loop muted playsinline preload="none">` +
        `<source src="${encodeURI(file)}" type="video/mp4">` +
        `</video>` +
        `</div>` +
        (title ? `<p class="card-title">${title}</p>` : '');
      grid.appendChild(card);
    });

    section.appendChild(grid);
    sectionsEl.appendChild(section);
  });

  // ── LAZY VIDEO PLAY ───────────────────────────────────────────────────────

  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card-thumb video').forEach(v => {
    videoObserver.observe(v);
    v.addEventListener('canplay', () => v.closest('.card-thumb').classList.add('loaded'));
  });

  // ── SCROLL SPY ────────────────────────────────────────────────────────────

  const navItems = document.querySelectorAll('.nav-item');
  let lastActive = null;
  let scrollingFromClick = false;
  let scrollTimer = null;

  const spy = new IntersectionObserver(entries => {
    if (scrollingFromClick) return;
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id !== lastActive) {
        lastActive = entry.target.id;
        navItems.forEach(a => a.classList.toggle('active', a.dataset.section === lastActive));
        history.replaceState(null, '', `#${lastActive}`);
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });

  document.querySelectorAll('.category-section').forEach(s => spy.observe(s));

  // ── NAV CLICK ─────────────────────────────────────────────────────────────

  navItems.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (!target) return;
      scrollingFromClick = true;
      clearTimeout(scrollTimer);
      navItems.forEach(a => a.classList.toggle('active', a === link));
      lastActive = link.dataset.section;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${link.dataset.section}`);
      scrollTimer = setTimeout(() => { scrollingFromClick = false; }, 1000);
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600);
      closeSidebar();
    });
  });

  // ── EMAIL COPY ────────────────────────────────────────────────────────────

  const emailBtn = document.getElementById('emailBtn');
  emailBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('hi@johnyvino.com').then(() => {
      const orig = emailBtn.innerHTML;
      emailBtn.textContent = 'Copied to clipboard';
      emailBtn.classList.add('btn-action--copied');
      setTimeout(() => {
        emailBtn.innerHTML = orig;
        emailBtn.classList.remove('btn-action--copied');
      }, 2000);
    });
  });

  // ── SCROLL TO TOP ─────────────────────────────────────────────────────────

  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── GREETING + VISITOR COUNT ──────────────────────────────────────────────

  const hour = new Date().getHours();
  document.getElementById('greetingDisplay').textContent =
    hour >= 5  && hour < 12 ? 'Good Morning'   :
    hour >= 12 && hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const STORE_KEY = 'jv_visitor_num_v2';
  let myNumber = parseInt(localStorage.getItem(STORE_KEY) || '0');
  myNumber = myNumber < 1000
    ? 54200 + Math.floor(Math.random() * 30) + 1
    : myNumber + 1;
  localStorage.setItem(STORE_KEY, myNumber);

  const visitorEl  = document.getElementById('visitorCount');
  const countStart = performance.now();
  function countUp(now) {
    const t = Math.min((now - countStart) / 1800, 1);
    visitorEl.textContent = '#' + Math.round((1 - Math.pow(1 - t, 3)) * myNumber).toLocaleString('en-US');
    if (t < 1) requestAnimationFrame(countUp);
  }
  requestAnimationFrame(countUp);

  // ── SIDEBAR ───────────────────────────────────────────────────────────────

  const mobTrigger   = document.getElementById('mobTrigger');
  const sidebarClose = document.getElementById('sidebarClose');
  const overlay      = document.getElementById('sidebarOverlay');
  const sidebar      = document.getElementById('sidebar');
  let lastFocused    = null;

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openSidebar() {
    if (sidebar.classList.contains('open')) return;
    lastFocused = document.activeElement;
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-modal', 'true');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    mobTrigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sidebar-open');
    lockScroll();
    document.addEventListener('keydown', trapFocus);
    sidebarClose?.focus();
  }

  function closeSidebar() {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    sidebar.removeAttribute('aria-modal');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    mobTrigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('sidebar-open');
    unlockScroll();
    document.removeEventListener('keydown', trapFocus);
    lastFocused?.focus();
  }

  mobTrigger.addEventListener('click', () =>
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
  );
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // ── LOGO ──────────────────────────────────────────────────────────────────

  const logoBtn = document.getElementById('logoScrollTop');
  logoBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── LIGHTBOX ──────────────────────────────────────────────────────────────

  const lb      = document.getElementById('lightbox');
  const lbVideo = document.getElementById('lightbox-video');

  function openLightbox(src, title) {
    lbVideo.src = src;
    lbVideo.play().catch(() => {});
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    if (window.plausible) plausible('Video Open', { props: { title: title || 'Unknown' } });
    lockScroll();
  }

  function closeLightbox() {
    if (!lb.classList.contains('open')) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lbVideo.style.transform = '';
    lb.style.opacity = '';
    lbVideo.pause();
    setTimeout(() => { lbVideo.removeAttribute('src'); lbVideo.load(); }, 300);
    unlockScroll();
  }

  lb.addEventListener('click', closeLightbox);

  sectionsEl.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const video = card.querySelector('video');
    const titleEl = card.querySelector('.card-title');
    const src = video?.currentSrc || video?.querySelector('source')?.src;
    if (src) openLightbox(src, titleEl ? titleEl.textContent : '');
  });

  // ── LIGHTBOX SWIPE-DOWN ───────────────────────────────────────────────────

  let lbTouchStartY = 0;
  let lbTouchDY     = 0;
  let lbSwiping     = false;

  lb.addEventListener('touchstart', e => {
    lbTouchStartY = e.touches[0].clientY;
    lbTouchDY     = 0;
    lbSwiping     = true;
  }, { passive: true });

  lb.addEventListener('touchmove', e => {
    if (!lbSwiping) return;
    lbTouchDY = e.touches[0].clientY - lbTouchStartY;
    if (lbTouchDY > 0) {
      e.preventDefault();
      const travel = Math.min(lbTouchDY, 240);
      lbVideo.style.transform = `translateY(${travel * 0.5}px) scale(${1 - (travel / 240) * 0.14})`;
      lb.style.opacity = String(Math.max(0.3, 1 - lbTouchDY / 360));
    }
  }, { passive: false });

  lb.addEventListener('touchend', e => {
    if (!lbSwiping) return;
    lbSwiping = false;
    if (lbTouchDY >= 80) {
      e.preventDefault();
      closeLightbox();
    } else if (lbTouchDY >= 10) {
      e.preventDefault();
      lbVideo.style.transform = '';
      lb.style.opacity = '';
    }
  }, { passive: false });

  // ── CARD TAP-HOLD PEEK ────────────────────────────────────────────────────

  let peekTimer = null;
  let peekCard  = null;

  sectionsEl.addEventListener('touchstart', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    peekTimer = setTimeout(() => {
      peekCard = card;
      card.classList.add('card--peeking');
    }, 500);
  }, { passive: true });

  sectionsEl.addEventListener('touchmove', () => {
    clearTimeout(peekTimer);
    if (peekCard) { peekCard.classList.remove('card--peeking'); peekCard = null; }
  }, { passive: true });

  sectionsEl.addEventListener('touchend', e => {
    clearTimeout(peekTimer);
    if (peekCard) {
      peekCard.classList.remove('card--peeking');
      peekCard = null;
      e.preventDefault();
    }
  }, { passive: false });

  // ── KEYBOARD ──────────────────────────────────────────────────────────────

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (sidebar.classList.contains('open')) closeSidebar();
    else closeLightbox();
  });

  // ── LOGO MORPH ────────────────────────────────────────────────────────────

  const morphEl = document.getElementById('logoMorphPath');
  if (morphEl) {
    const shapes = [
      'M5 1L5 18L9 14L12 21L15 19.5L11.5 13L18 13Z',
      'M5 3L19 12L5 21Z',
      'M13 1L3 14L12 14L10 23L21 10L12 10Z',
      'M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z',
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % shapes.length;
      morphEl.style.opacity = '0';
      setTimeout(() => {
        morphEl.setAttribute('d', shapes[idx]);
        morphEl.style.opacity = '1';
      }, 200);
    }, 2000);
  }

})();
