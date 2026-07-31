const questions = [
  { key: "closeness", title: "Hoe close zijn we?", subtitle: "Kies zorgvuldig. Ik controleer de antwoorden persoonlijk.", options: [
    { label: "We praten bijna elke dag", emoji: "❤️", score: 4 },
    { label: "We zijn heel goede vrienden", emoji: "💕", score: 3 },
    { label: "We zien elkaar af en toe", emoji: "☀️", score: 2 },
    { label: "Volgens mij moest je mij uitnodigen", emoji: "😂", score: 1 }
  ]},
  { key: "annoyance", title: "Heb je mij dit jaar geannoyed?", subtitle: "Eerlijkheid wordt misschien beloond.", options: [
    { label: "Nooit, ik ben een engel", emoji: "😇", score: 4 },
    { label: "Misschien één of twee keer", emoji: "🤏", score: 3 },
    { label: "Een verdacht aantal keer", emoji: "🙄", score: 2 },
    { label: "Constant en met trots", emoji: "💀", score: 1 }
  ]},
  { key: "budget", title: "Wat is je budget?", subtitle: "Geen druk. De calculator onthoudt alleen alles.", options: [
    { label: "Keeping it cute: Under €25", emoji: "🎀", value: "small" },
    { label: "Mid-range magic: €30 - €55", emoji: "✨", value: "medium" },
    { label: "Go big: €70 - €80", emoji: "🍾", value: "large" },
    { label: "Money is no object: €80+", emoji: "👑", value: "luxury" }
  ]}
];

function placeholder(label, emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#ffd4c8"/><stop offset=".5" stop-color="#f4a7a8"/><stop offset="1" stop-color="#c96c8a"/></linearGradient></defs><rect width="800" height="520" rx="44" fill="url(#g)"/><circle cx="400" cy="195" r="105" fill="#fff" fill-opacity=".34"/><text x="400" y="235" text-anchor="middle" font-size="112">${emoji}</text><text x="400" y="395" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="#6e334c">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const builtInGiftLists = {
  small: [
    { name: "Cute scented candle", image: placeholder("Scented candle", "🕯️"), link: "", price: "" },
    { name: "My favorite snacks", image: placeholder("Favorite snacks", "🍬"), link: "", price: "" },
    { name: "Mini flower bouquet", image: placeholder("Flower bouquet", "💐"), link: "", price: "" },
    { name: "Pretty notebook", image: placeholder("Pretty notebook", "📔"), link: "", price: "" }
  ],
  medium: [
    { name: "Jewelry piece", image: placeholder("Jewelry", "💍"), link: "", price: "" },
    { name: "Beauty gift set", image: placeholder("Beauty set", "💄"), link: "", price: "" },
    { name: "Dinner or brunch date", image: placeholder("Brunch date", "🥐"), link: "", price: "" },
    { name: "Personalized photo gift", image: placeholder("Photo gift", "📸"), link: "", price: "" }
  ],
  large: [
    { name: "Nice perfume", image: placeholder("Perfume", "🌷"), link: "", price: "" },
    { name: "Concert or event ticket", image: placeholder("Event ticket", "🎟️"), link: "", price: "" },
    { name: "Statement handbag", image: placeholder("Handbag", "👜"), link: "", price: "" },
    { name: "Spa or wellness voucher", image: placeholder("Wellness", "🧖‍♀️"), link: "", price: "" }
  ],
  luxury: [
    { name: "London-trip contribution", image: placeholder("London trip", "✈️"), link: "", price: "" },
    { name: "Designer accessory", image: placeholder("Designer accessory", "🕶️"), link: "", price: "" },
    { name: "Premium headphones", image: placeholder("Headphones", "🎧"), link: "", price: "" },
    { name: "Special experience day", image: placeholder("Experience day", "✨"), link: "", price: "" }
  ]
};

const publishedGiftLists = window.GIFT_LISTS && typeof window.GIFT_LISTS === "object" ? window.GIFT_LISTS : builtInGiftLists;
const budgetLabels = { small: "Keeping it cute", medium: "Mid-range magic", large: "Go big", luxury: "Money is no object" };
const budgetMessages = { small: "Het gaat om het gebaar. En een beetje om de verpakking.", medium: "Een uitstekende balans tussen lief en indrukwekkend.", large: "Oké, jij neemt deze verjaardag serieus.", luxury: "Ik wist altijd al dat jij mijn favoriete persoon was." };
const jokes = ["Deze uitslag is gecontroleerd door een professioneel verjaardagspanel.", "Geen AI gebruikt. Alleen mijn zeer objectieve mening.", "De calculator is 98% accuraat en 100% bevooroordeeld.", "Resultaten zijn bindend zodra je een screenshot maakt."];
const quotes = ["Life is better at golden hour.", "Sip happens.", "Good friends make the best memories.", "Meet me where the sun kisses the sea."];

let currentQuestion = 0;
let answers = {};
let giftLists = loadGiftLists();
const $ = id => document.getElementById(id);
const welcomeView = $("welcomeView"), quizWrap = $("quizWrap"), quizView = $("quizView"), resultView = $("resultView");
const questionContainer = $("questionContainer"), progressBar = $("progressBar"), progressText = $("progressText"), giftGrid = $("giftGrid");
const giftEditor = $("giftEditor"), editorFields = $("editorFields"), giftEditorForm = $("giftEditorForm"), saveGiftsButton = $("saveGiftsButton");

function normalizeGift(gift, fallback) {
  if (typeof gift === "string") return { name: gift, image: fallback.image, link: "", price: "" };
  return { name: gift?.name || "Voeg een cadeau toe", image: gift?.image || fallback.image, link: gift?.link || "", price: gift?.price || "" };
}
function cloneDefaults() {
  return Object.fromEntries(Object.keys(builtInGiftLists).map(key => [key, (publishedGiftLists[key] || builtInGiftLists[key]).map((g,i) => normalizeGift(g, builtInGiftLists[key][i]))]));
}
function loadGiftLists() {
  try {
    const saved = JSON.parse(localStorage.getItem("birthdayGiftListsV2") || localStorage.getItem("birthdayGiftLists"));
    if (!saved || !Object.keys(builtInGiftLists).every(key => Array.isArray(saved[key]) && saved[key].length === 4)) return cloneDefaults();
    return Object.fromEntries(Object.keys(builtInGiftLists).map(key => [key, saved[key].map((g,i) => normalizeGift(g, cloneDefaults()[key][i]))]));
  } catch { return cloneDefaults(); }
}

function startQuiz() {
  welcomeView.classList.remove("is-active"); welcomeView.classList.add("is-hidden");
  quizWrap.classList.remove("is-hidden"); renderQuestion();
}
function renderQuestion() {
  const q = questions[currentQuestion];
  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  progressText.textContent = `Vraag ${currentQuestion + 1} van ${questions.length}`;
  questionContainer.innerHTML = `<div class="question-card"><span class="question-number">0${currentQuestion + 1}</span><h2>${q.title}</h2><p>${q.subtitle}</p><div class="answer-grid">${q.options.map((o,i) => `<button class="answer-button" type="button" data-index="${i}"><span class="answer-emoji">${o.emoji}</span><span>${o.label}</span><b>→</b></button>`).join("")}</div></div>`;
  questionContainer.querySelectorAll(".answer-button").forEach(btn => btn.addEventListener("click", () => chooseAnswer(q.options[Number(btn.dataset.index)])));
}
function chooseAnswer(option) {
  answers[questions[currentQuestion].key] = option;
  if (currentQuestion < 2) {
    currentQuestion++;
    questionContainer.animate([{opacity:1,transform:"translateX(0)"},{opacity:0,transform:"translateX(-25px)"}],{duration:220,easing:"ease"}).onfinish = renderQuestion;
  } else showResults();
}
function showResults() {
  quizWrap.classList.add("is-hidden"); resultView.classList.add("is-active");
  $("revealLoader").classList.remove("is-hidden"); $("resultContent").classList.add("is-hidden");
  setTimeout(async () => {
    const budget = answers.budget.value;
    await refreshReservations();
    const relationshipScore = answers.closeness.score + answers.annoyance.score;
    const match = Math.min(99, 76 + relationshipScore * 3 + (budget === "luxury" ? 1 : 0));
    $("matchScore").textContent = `${match}%`;
    $("resultTitle").textContent = budgetLabels[budget];
    $("resultMessage").textContent = budgetMessages[budget];
    $("resultJoke").textContent = jokes[Math.floor(Math.random() * jokes.length)];
    $("quoteText").textContent = `“${quotes[Math.floor(Math.random() * quotes.length)]}”`;
    const vip = budget === "luxury" && relationshipScore >= 7;
    giftGrid.innerHTML = giftLists[budget].map((gift,index) => renderResultGiftCard(budget, gift, index)).join("") + (vip ? `<article class="gift-card vip-card"><div class="vip-inner"><span>👑</span><small>Secret VIP result</small><h3>Jij mag mij ook gewoon meenemen naar London.</h3></div></article>` : "");
    bindReservationButtons(giftGrid);
    $("revealLoader").classList.add("is-hidden"); $("resultContent").classList.remove("is-hidden"); launchConfetti();
  }, 1200);
}
function restartQuiz() {
  currentQuestion = 0; answers = {}; resultView.classList.remove("is-active"); quizWrap.classList.remove("is-hidden"); renderQuestion(); window.scrollTo({top:0,behavior:"smooth"});
}
function launchConfetti() {
  const box = $("confetti"); box.innerHTML = Array.from({length:55},(_,i) => `<i style="--x:${Math.random()*100};--d:${Math.random()*1.5};--r:${Math.random()*360};--s:${6+Math.random()*8}"></i>`).join("");
  box.classList.add("go"); setTimeout(() => { box.classList.remove("go"); box.innerHTML = ""; }, 3200);
}
async function copyGiftList() {
  const b = answers.budget?.value; if (!b) return;
  const text = `Anna's verjaardagscadeaus (${budgetLabels[b]}):\n${giftLists[b].map(g => `• ${g.name}${g.link ? ` — ${g.link}` : ""}`).join("\n")}`;
  try { await navigator.clipboard.writeText(text); $("copyButton").textContent = "Gekopieerd! ✓"; } catch { $("copyButton").textContent = "Kopiëren lukt niet"; }
  setTimeout(() => $("copyButton").textContent = "Kopieer cadeaulijst", 1800);
}

function openGiftEditor() {
  editorFields.innerHTML = Object.entries(giftLists).map(([key,gifts]) => `<section class="editor-group"><h3>${budgetLabels[key]}</h3><div class="editor-inputs">${gifts.map((gift,index) => `<div class="gift-edit-row" data-budget="${key}" data-index="${index}"><img class="editor-preview" src="${escapeAttribute(gift.image)}" alt="Preview"><div class="gift-edit-controls"><label>Naam<input class="gift-name-input" type="text" maxlength="100" value="${escapeAttribute(gift.name)}"></label><div class="two-fields"><label>Prijs<input class="gift-price-input" type="text" maxlength="20" placeholder="€22,99" value="${escapeAttribute(gift.price)}"></label><label>Productlink<input class="gift-link-input" type="url" placeholder="https://..." value="${escapeAttribute(gift.link)}"></label></div><label>Afbeelding-URL<input class="gift-image-input" type="url" placeholder="https://...jpg" value="${gift.image.startsWith("data:") ? "" : escapeAttribute(gift.image)}"></label><div class="image-actions"><label class="upload-button">Kies afbeelding<input class="gift-file-input" type="file" accept="image/*"></label><button class="tiny-button reset-image-button" type="button">Reset afbeelding</button></div><input class="image-data-input" type="hidden" value="${escapeAttribute(gift.image)}"></div></div>`).join("")}</div></section>`).join("");
  editorFields.querySelectorAll(".gift-edit-row").forEach(row => {
    const preview=row.querySelector(".editor-preview"), url=row.querySelector(".gift-image-input"), file=row.querySelector(".gift-file-input"), data=row.querySelector(".image-data-input");
    url.addEventListener("input",()=>{if(url.value.trim()){preview.src=url.value.trim();data.value=url.value.trim();}});
    file.addEventListener("change",()=>{const f=file.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{preview.src=r.result;data.value=r.result;url.value="";};r.readAsDataURL(f);});
    row.querySelector(".reset-image-button").addEventListener("click",()=>{const fallback=builtInGiftLists[row.dataset.budget][Number(row.dataset.index)].image;preview.src=fallback;data.value=fallback;url.value="";file.value="";});
  });
  giftEditor.showModal();
}
function saveGiftLists(event) {
  if (event.submitter !== saveGiftsButton) return; event.preventDefault(); const updated=cloneDefaults();
  editorFields.querySelectorAll(".gift-edit-row").forEach(row => { const b=row.dataset.budget,i=Number(row.dataset.index); updated[b][i]={name:row.querySelector(".gift-name-input").value.trim()||"Voeg een cadeau toe",price:row.querySelector(".gift-price-input").value.trim(),link:row.querySelector(".gift-link-input").value.trim(),image:row.querySelector(".image-data-input").value||builtInGiftLists[b][i].image}; });
  giftLists=updated; try { localStorage.setItem("birthdayGiftListsV2",JSON.stringify(giftLists)); } catch { alert("De afbeelding is te groot. Gebruik een kleinere afbeelding of een afbeeldingslink."); return; }
  giftEditor.close(); if(resultView.classList.contains("is-active")&&!$("resultContent").classList.contains("is-hidden")) showResults();
}
function downloadGiftData() {
  const blob=new Blob([`window.GIFT_LISTS = ${JSON.stringify(giftLists,null,2)};\n`],{type:"text/javascript;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download="gift-data.js";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url); $("downloadGiftDataButton").textContent="Gedownload ✓";setTimeout(()=>$("downloadGiftDataButton").textContent="Download gift-data.js",1800);
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);}
function escapeAttribute(v){return escapeHtml(v);}

$("startButton").addEventListener("click",startQuiz); $("restartButton").addEventListener("click",restartQuiz); $("copyButton").addEventListener("click",copyGiftList);
$("editGiftButton").addEventListener("click",openGiftEditor); giftEditorForm.addEventListener("submit",saveGiftLists); $("downloadGiftDataButton").addEventListener("click",downloadGiftData);
$("londonButton").addEventListener("click",()=>$("londonDialog").showModal());


function renderFullWishlist() {
  const content = $("wishlistContent");
  content.innerHTML = Object.entries(giftLists).map(([budget, gifts]) => `
    <section class="wishlist-group">
      <div class="wishlist-group-heading">
        <h3>${escapeHtml(budgetLabels[budget])}</h3>
        <span>${gifts.length} cadeau${gifts.length === 1 ? "" : "s"}</span>
      </div>
      <div class="wishlist-grid">
        ${gifts.map((gift, index) => renderWishlistGiftCard(budget, gift, index)).join("")}
      </div>
    </section>
  `).join("");
}

async function openWishlist() {
  await refreshReservations();
  renderFullWishlist();
  bindReservationButtons($("wishlistContent"));
  $("wishlistDialog").showModal();
}

async function copyFullWishlist() {
  const text = Object.entries(giftLists).map(([budget, gifts]) => `${budgetLabels[budget]}:\n${gifts.map(g => `• ${g.name}${g.price ? ` (${g.price})` : ""}${g.link ? ` — ${g.link}` : ""}`).join("\n")}`).join("\n\n");
  try {
    await navigator.clipboard.writeText(`Anna's complete wishlist:\n\n${text}`);
    $("copyFullWishlistButton").textContent = "Gekopieerd! ✓";
  } catch {
    $("copyFullWishlistButton").textContent = "Kopiëren lukt niet";
  }
  setTimeout(() => $("copyFullWishlistButton").textContent = "Kopieer hele wishlist", 1800);
}

$("wishlistButton").addEventListener("click", openWishlist);
$("closeWishlistButton").addEventListener("click", () => $("wishlistDialog").close());
$("closeWishlistBottomButton").addEventListener("click", () => $("wishlistDialog").close());
$("copyFullWishlistButton").addEventListener("click", copyFullWishlist);
$("wishlistDialog").addEventListener("click", event => {
  if (event.target === $("wishlistDialog")) $("wishlistDialog").close();
});


// Shared gift reservations -------------------------------------------------
const reservationConfig = window.RESERVATION_CONFIG || {};
const reservationDbUrl = String(reservationConfig.databaseURL || "").replace(/\/$/, "");
const reservationsAreShared = /^https:\/\/.+\.(firebaseio\.com|firebasedatabase\.app)$/i.test(reservationDbUrl);
let reservations = {};
let selectedGift = null;

function giftId(budget, index) { return `${budget}-${index}`; }
function localReservationKey() { return "annaGiftReservationsV1"; }
function ownerTokenKey(id) { return `annaGiftOwner-${id}`; }
function makeToken() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

async function sha256(value) {
  if (!value) return "";
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function refreshReservations() {
  try {
    if (reservationsAreShared) {
      const response = await fetch(`${reservationDbUrl}/reservations.json`, { cache: "no-store" });
      if (!response.ok) throw new Error("Database niet bereikbaar");
      reservations = (await response.json()) || {};
    } else {
      reservations = JSON.parse(localStorage.getItem(localReservationKey()) || "{}") || {};
    }
  } catch (error) {
    console.warn(error);
    reservations = JSON.parse(localStorage.getItem(localReservationKey()) || "{}") || {};
  }
}

async function saveReservation(id, value) {
  if (reservationsAreShared) {
    const response = await fetch(`${reservationDbUrl}/reservations/${encodeURIComponent(id)}.json`, {
      method: value ? "PUT" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: value ? JSON.stringify(value) : undefined
    });
    if (!response.ok) throw new Error("Opslaan mislukt");
  } else {
    if (value) reservations[id] = value; else delete reservations[id];
    localStorage.setItem(localReservationKey(), JSON.stringify(reservations));
  }
  await refreshReservations();
}

function reservationBadge(id) {
  const r = reservations[id];
  if (!r) return `<span class="reservation-status available">Nog beschikbaar</span>`;
  return `<span class="reservation-status reserved">Afgestreept door ${escapeHtml(r.name || "iemand")}</span>`;
}

function reservationButton(id) {
  const reserved = Boolean(reservations[id]);
  return `<button class="reserve-button ${reserved ? "is-reserved" : ""}" type="button" data-gift-id="${id}">${reserved ? "Reservering beheren" : "Dit cadeau afstrepen"}</button>`;
}

function renderResultGiftCard(budget, gift, index) {
  const id = giftId(budget, index), reserved = Boolean(reservations[id]);
  return `<article class="gift-card ${reserved ? "gift-reserved" : ""}" data-gift-card="${id}">
    <div class="gift-image-wrap"><img class="gift-image" src="${escapeAttribute(gift.image)}" alt="${escapeAttribute(gift.name)}" onerror="this.src='${escapeAttribute(builtInGiftLists[budget][index].image)}'"></div>
    <div class="gift-copy"><div class="gift-meta"><span>${index === 0 ? "Mijn aanrader" : `Optie ${index + 1}`}</span>${gift.price ? `<b>${escapeHtml(gift.price)}</b>` : ""}</div><h3>${escapeHtml(gift.name)}</h3>${reservationBadge(id)}
    <div class="gift-card-actions">${gift.link ? `<a class="view-gift" href="${escapeAttribute(gift.link)}" target="_blank" rel="noopener">Bekijk cadeau ↗</a>` : `<span class="view-gift no-link">Geen productlink</span>`}${reservationButton(id)}</div></div>
  </article>`;
}

function renderWishlistGiftCard(budget, gift, index) {
  const id = giftId(budget, index), reserved = Boolean(reservations[id]);
  return `<article class="wishlist-item ${reserved ? "gift-reserved" : ""}" data-gift-card="${id}">
    <div class="wishlist-image-wrap"><img src="${escapeAttribute(gift.image)}" alt="${escapeAttribute(gift.name)}" onerror="this.src='${escapeAttribute(builtInGiftLists[budget][index].image)}'"></div>
    <div class="wishlist-copy"><div><small>Optie ${index + 1}</small>${gift.price ? `<b>${escapeHtml(gift.price)}</b>` : ""}</div><h4>${escapeHtml(gift.name)}</h4>${reservationBadge(id)}
    <div class="wishlist-item-actions">${gift.link ? `<a href="${escapeAttribute(gift.link)}" target="_blank" rel="noopener">Bekijk cadeau ↗</a>` : `<span class="no-link">Geen productlink</span>`}${reservationButton(id)}</div></div>
  </article>`;
}

function bindReservationButtons(root) {
  root.querySelectorAll(".reserve-button").forEach(button => button.addEventListener("click", () => openReservationDialog(button.dataset.giftId)));
}

function findGiftById(id) {
  const [budget, indexText] = id.split("-");
  const index = Number(indexText);
  return { budget, index, gift: giftLists[budget]?.[index] };
}

function openReservationDialog(id) {
  selectedGift = id;
  const existing = reservations[id];
  const found = findGiftById(id);
  $("reservationTitle").textContent = existing ? "Reservering beheren" : "Cadeau afstrepen";
  $("reservationDescription").textContent = existing
    ? `${found.gift?.name || "Dit cadeau"} is afgestreept door ${existing.name}. Vul hetzelfde e-mailadres in om de reservering te verwijderen. Zonder e-mailadres kan dit alleen vanaf dezelfde browser.`
    : `Je staat op het punt “${found.gift?.name || "dit cadeau"}” af te strepen. Zo voorkom je dat iemand anders hetzelfde koopt.`;
  $("reservationName").value = existing ? existing.name || "" : "";
  $("reservationName").disabled = Boolean(existing);
  $("reservationEmail").value = "";
  $("reservationError").textContent = reservationsAreShared ? "" : "Teststand: deze afstreping is nu alleen op dit apparaat zichtbaar. Volg FIREBASE-INSTELLEN.txt om hem voor iedereen te delen.";
  $("confirmReservationButton").textContent = existing ? "Afstreping verwijderen" : "Streep af";
  $("confirmReservationButton").classList.toggle("danger-button", Boolean(existing));
  $("reservationDialog").showModal();
}

async function handleReservationSubmit(event) {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const id = selectedGift;
  if (!id) return;
  const existing = reservations[id];
  const name = $("reservationName").value.trim();
  const email = $("reservationEmail").value.trim();
  const error = $("reservationError");
  error.textContent = "";
  try {
    if (!existing) {
      if (!name) { error.textContent = "Vul je naam in."; return; }
      const token = makeToken();
      localStorage.setItem(ownerTokenKey(id), token);
      await saveReservation(id, { name: name.slice(0, 40), emailHash: await sha256(email), ownerToken: email ? "" : token, reservedAt: new Date().toISOString() });
    } else {
      const localToken = localStorage.getItem(ownerTokenKey(id)) || "";
      const suppliedHash = await sha256(email);
      const allowed = (existing.emailHash && suppliedHash === existing.emailHash) || (!existing.emailHash && existing.ownerToken && localToken === existing.ownerToken);
      if (!allowed) { error.textContent = existing.emailHash ? "Dit e-mailadres hoort niet bij deze reservering." : "Deze reservering kan alleen worden verwijderd vanaf de browser waarmee hij is gemaakt."; return; }
      await saveReservation(id, null);
      localStorage.removeItem(ownerTokenKey(id));
    }
    $("reservationDialog").close();
    if (answers.budget?.value && resultView.classList.contains("is-active")) {
      const budget = answers.budget.value;
      giftGrid.innerHTML = giftLists[budget].map((gift,index) => renderResultGiftCard(budget, gift, index)).join("");
      bindReservationButtons(giftGrid);
    }
    if ($("wishlistDialog").open) { renderFullWishlist(); bindReservationButtons($("wishlistContent")); }
  } catch (e) {
    console.error(e); error.textContent = "Opslaan lukt nu niet. Controleer de database-instellingen en probeer opnieuw.";
  }
}

$("reservationForm").addEventListener("submit", handleReservationSubmit);
