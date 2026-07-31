(() => {
  const config = window.SITE_CONFIG || {};
  const facts = [
    "Deze website bestaat omdat één gewone wishlist blijkbaar niet genoeg was.",
    "Het thema is Sunset After Party — cocktails en golden hour zijn dus officieel verplicht.",
    "Ik word 20 en vier dat op 18 augustus van 12:00 tot 17:00.",
    "Een bijdrage aan mijn London-trip telt ook gewoon als een perfect cadeau.",
    "Deze calculator is 98% accuraat en 100% bevooroordeeld."
  ];
  const giftNotes = [
    "Deze staat extra hoog op mijn lijstje. 🤍",
    "Hier ga ik gegarandeerd veel plezier van hebben.",
    "Een heel veilige keuze volgens het verjaardagspanel.",
    "Goedgekeurd voor maximale birthday happiness."
  ];

  function totalGifts() { return Object.values(giftLists).reduce((n, list) => n + list.length, 0); }
  function reservedCount() { return Object.keys(reservations || {}).filter(id => findGiftById(id).gift).length; }
  function updateReservationOverview() {
    const total = totalGifts();
    const used = reservedCount();
    const available = Math.max(0, total - used);
    const pct = total ? (used / total) * 100 : 0;
    const text = `${used} van ${total} gereserveerd • nog ${available} beschikbaar`;
    [["reservationCount","reservationProgressBar"],["wishlistReservationCount","wishlistReservationProgressBar"]].forEach(([t,b]) => {
      const textEl = document.getElementById(t), bar = document.getElementById(b);
      if (textEl) textEl.textContent = text;
      if (bar) bar.style.width = `${pct}%`;
    });
  }

  const originalRefreshReservations = refreshReservations;
  refreshReservations = async function() {
    await originalRefreshReservations();
    updateReservationOverview();
  };

  const originalResultCard = renderResultGiftCard;
  renderResultGiftCard = function(budget, gift, index) {
    const html = originalResultCard(budget, gift, index);
    const id = giftId(budget, index);
    const wanted = (config.mostWanted || []).includes(id);
    const badge = wanted ? '<span class="most-wanted">👑 Most wanted</span>' : '';
    const note = `<p class="gift-note">${escapeHtml(giftNotes[index % giftNotes.length])}</p>`;
    return html.replace('<div class="gift-copy">', `<div class="gift-copy">${badge}`).replace('</h3>', `</h3>${note}`);
  };

  const originalWishlistCard = renderWishlistGiftCard;
  renderWishlistGiftCard = function(budget, gift, index) {
    const html = originalWishlistCard(budget, gift, index);
    const id = giftId(budget, index);
    const wanted = (config.mostWanted || []).includes(id);
    const badge = wanted ? '<span class="most-wanted compact">👑 Most wanted</span>' : '';
    return html.replace('<div class="wishlist-copy">', `<div class="wishlist-copy">${badge}`);
  };

  function renderCountdown() {
    const el = document.getElementById('countdownBanner');
    if (!el || !config.birthday) return;
    const now = new Date();
    const start = new Date(config.birthday);
    const end = new Date(config.partyEnd || config.birthday);
    if (now < start) {
      const days = Math.ceil((start - now) / 86400000);
      el.innerHTML = `<span>🎈</span><strong>Nog ${days} ${days === 1 ? 'dag' : 'dagen'} tot mijn verjaardag!</strong>`;
    } else if (now <= end) {
      el.innerHTML = '<span>🥂</span><strong>Vandaag is het zover — birthday mode aan!</strong>';
    } else {
      el.innerHTML = '<span>🤍</span><strong>Bedankt dat jullie mijn 20e verjaardag zo bijzonder maakten!</strong>';
    }
  }

  function setTheme() {
    const hour = new Date().getHours();
    document.body.classList.toggle('golden-hour-mode', hour >= 18 || hour < 6);
    document.body.classList.add(`sunset-${Math.floor(Math.random() * 4) + 1}`);
  }

  function updateLondonFund() {
    const current = Number(config.londonFundCurrent || 0), goal = Math.max(1, Number(config.londonFundGoal || 400));
    const amount = document.getElementById('londonFundAmount'), bar = document.getElementById('londonProgressBar');
    if (amount) amount.textContent = `€${current} / €${goal}`;
    if (bar) bar.style.width = `${Math.min(100, current / goal * 100)}%`;
  }

  async function surpriseMe() {
    await refreshReservations();
    const all = Object.entries(giftLists).flatMap(([budget, list]) => list.map((gift,index) => ({budget,index,gift,id:giftId(budget,index)})));
    const available = all.filter(item => !reservations[item.id]);
    const pool = available.length ? available : all;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    if (!chosen) return;
    const wasOpen = document.getElementById('wishlistDialog').open;
    if (!wasOpen) await openWishlist();
    setTimeout(() => {
      const card = document.querySelector(`[data-gift-card="${chosen.id}"]`);
      if (card) {
        card.scrollIntoView({behavior:'smooth', block:'center'});
        card.classList.add('surprise-pick');
        setTimeout(() => card.classList.remove('surprise-pick'), 2400);
      }
    }, 180);
  }

  // Shared guestbook through the same Firebase database.
  const guestbookLocalKey = 'annaBirthdayGuestbookV1';
  async function loadGuestbook() {
    const target = document.getElementById('guestbookMessages');
    if (!target) return;
    let data = {};
    try {
      if (reservationsAreShared) {
        const response = await fetch(`${reservationDbUrl}/guestbook.json`, {cache:'no-store'});
        if (!response.ok) throw new Error('Guestbook unavailable');
        data = (await response.json()) || {};
      } else data = JSON.parse(localStorage.getItem(guestbookLocalKey) || '{}');
    } catch { data = JSON.parse(localStorage.getItem(guestbookLocalKey) || '{}'); }
    const messages = Object.values(data).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,30);
    target.innerHTML = messages.length ? messages.map(m => `<article><strong>${escapeHtml(m.name || 'Anoniem')}</strong><p>${escapeHtml(m.message || '')}</p><small>${new Date(m.createdAt).toLocaleDateString('nl-NL')}</small></article>`).join('') : '<p class="empty-guestbook">Nog geen berichtjes — jij kunt de eerste zijn. ✨</p>';
  }

  async function submitGuestbook(event) {
    event.preventDefault();
    const name = document.getElementById('guestbookName').value.trim();
    const message = document.getElementById('guestbookMessage').value.trim();
    const status = document.getElementById('guestbookStatus');
    if (!name || !message) return;
    const value = {name:name.slice(0,40), message:message.slice(0,280), createdAt:new Date().toISOString()};
    try {
      if (reservationsAreShared) {
        const response = await fetch(`${reservationDbUrl}/guestbook.json`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(value)});
        if (!response.ok) throw new Error('Opslaan mislukt');
      } else {
        const data = JSON.parse(localStorage.getItem(guestbookLocalKey) || '{}');
        data[Date.now()] = value;
        localStorage.setItem(guestbookLocalKey, JSON.stringify(data));
      }
      event.target.reset(); status.textContent = 'Je berichtje staat erbij. Dankjewel! 🤍';
      await loadGuestbook(); launchConfetti();
    } catch { status.textContent = 'Opslaan lukt nog niet. Controleer de Firebase-regels.'; }
  }

  // Show a thank-you after a newly made reservation.
  let reservationWasOpen = false;
  let reservationHadValue = false;
  document.getElementById('reservationDialog')?.addEventListener('close', async () => {
    if (!reservationWasOpen) return;
    reservationWasOpen = false;
    await refreshReservations();
    const nowReserved = Boolean(reservations[selectedGift]);
    if (!reservationHadValue && nowReserved) document.getElementById('thankYouDialog')?.showModal();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('.reserve-button');
    if (button) { reservationWasOpen = true; reservationHadValue = Boolean(reservations[button.dataset.giftId]); }
  });

  document.getElementById('welcomeWishlistButton')?.addEventListener('click', openWishlist);
  document.getElementById('surpriseButton')?.addEventListener('click', surpriseMe);
  document.getElementById('leaveWishButton')?.addEventListener('click', () => setTimeout(() => document.getElementById('guestbookSection')?.scrollIntoView({behavior:'smooth'}), 100));
  document.getElementById('guestbookForm')?.addEventListener('submit', submitGuestbook);

  renderCountdown(); setTheme(); updateLondonFund();
  const fact = document.getElementById('funFactText'); if (fact) fact.textContent = facts[Math.floor(Math.random() * facts.length)];
  refreshReservations(); loadGuestbook();
  setInterval(refreshReservations, 30000);
})();
