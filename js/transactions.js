/* ══════════════════════════════════════
   TRANSACTIONS MODULE
   Transaction generation, UI rendering, modal
══════════════════════════════════════ */

// ── Sample merchant data ──
const sampleMerchants = [
  { emoji:'☕', name:'Starbucks Coffee', cat:'Eating Places', mcc:'5812', amount:()=>Math.floor(Math.random()*300+200), carbonFactor:1.8, impact:'high',
    tips:['Bring your own reusable cup to save ~0.10kg CO₂ per visit.','Choosing plant-based milk reduces emissions by up to 30%!'] },
  { emoji:'🍔', name:"McDonald's", cat:'Fast Food', mcc:'5814', amount:()=>Math.floor(Math.random()*250+150), carbonFactor:1.5, impact:'medium',
    tips:['Try a plant-based burger to cut your meal\'s carbon footprint by 50%.','Dining in uses fewer single-use plastics than takeaway.'] },
  { emoji:'🛒', name:'DMart Grocery', cat:'Grocery Store', mcc:'5411', amount:()=>Math.floor(Math.random()*1000+500), carbonFactor:0.3, impact:'low',
    tips:['Buying local and seasonal produce reduces supply chain emissions.','Bring reusable bags to eliminate plastic waste.'] },
  { emoji:'⛽', name:'Indian Oil Petrol', cat:'Gas Station', mcc:'5541', amount:()=>Math.floor(Math.random()*1500+1000), carbonFactor:2.5, impact:'high',
    tips:['Consider carpooling or public transit to halve your transport emissions.','EVs emit ~70% less CO₂ per km than petrol vehicles.'] },
  { emoji:'🍕', name:"Domino's Pizza", cat:'Restaurant', mcc:'5812', amount:()=>Math.floor(Math.random()*400+300), carbonFactor:1.4, impact:'medium',
    tips:['Vegetarian pizzas have roughly 40% lower carbon footprint.','Ordering in bulk for one delivery beats multiple small orders.'] },
  { emoji:'👕', name:'Zara Fashion', cat:'Clothing Store', mcc:'5691', amount:()=>Math.floor(Math.random()*2000+1000), carbonFactor:0.8, impact:'high',
    tips:['One garment produces ~2.1kg CO₂. Buying second-hand saves 80%.','Washing clothes in cold water cuts energy use by 90%.'] },
  { emoji:'🎬', name:'PVR Cinemas', cat:'Entertainment', mcc:'7832', amount:()=>Math.floor(Math.random()*500+300), carbonFactor:0.4, impact:'low',
    tips:['Cinema visits are one of the lower-impact entertainment choices.','Choosing nearby venues reduces your travel emissions.'] },
  { emoji:'🏋️', name:'Cult.fit Gym', cat:'Health & Fitness', mcc:'7997', amount:()=>Math.floor(Math.random()*1500+1000), carbonFactor:0.2, impact:'low',
    tips:['Working out at a gym has a lower footprint than driving to outdoor activities.','Ask about the gym\'s renewable energy usage!'] }
];

// ── Carbon breakdown by merchant category ──
const carbonBreakdownMap = {
  'Eating Places':    [
    { name:'Food Production & Agriculture', pct:0.55 },
    { name:'Kitchen Energy & Cooking',      pct:0.25 },
    { name:'Packaging & Waste',             pct:0.20 }
  ],
  'Fast Food':        [
    { name:'Meat & Ingredients',            pct:0.50 },
    { name:'Kitchen Operations',            pct:0.30 },
    { name:'Packaging & Delivery',          pct:0.20 }
  ],
  'Restaurant':       [
    { name:'Ingredients & Supply Chain',    pct:0.50 },
    { name:'Cooking & Refrigeration',       pct:0.30 },
    { name:'Packaging & Disposal',          pct:0.20 }
  ],
  'Grocery Store':    [
    { name:'Food & Produce Sourcing',       pct:0.45 },
    { name:'Cold Chain & Refrigeration',    pct:0.35 },
    { name:'Packaging & Transport',         pct:0.20 }
  ],
  'Gas Station':      [
    { name:'Fuel Combustion (direct)',      pct:0.75 },
    { name:'Fuel Refining & Distribution',  pct:0.18 },
    { name:'Station Operations',            pct:0.07 }
  ],
  'Clothing Store':   [
    { name:'Textile Manufacturing',         pct:0.60 },
    { name:'Global Shipping & Logistics',   pct:0.25 },
    { name:'Retail Operations',             pct:0.15 }
  ],
  'Entertainment':    [
    { name:'Venue Energy Use',              pct:0.55 },
    { name:'Travel to Venue',               pct:0.30 },
    { name:'Operations & Equipment',        pct:0.15 }
  ],
  'Health & Fitness': [
    { name:'Facility Electricity',          pct:0.60 },
    { name:'HVAC & Water Heating',          pct:0.25 },
    { name:'Equipment & Maintenance',       pct:0.15 }
  ]
};

// ── Generate a random transaction ──
function generateTransaction() {
  const merchant = sampleMerchants[Math.floor(Math.random() * sampleMerchants.length)];
  const amount = merchant.amount();
  const carbon = parseFloat(((amount / 1000) * merchant.carbonFactor).toFixed(1));
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

  const txn = {
    id: 'txn_' + Date.now(),
    emoji: merchant.emoji,
    name: merchant.name,
    cat: merchant.cat,
    mcc: merchant.mcc,
    amount, carbon,
    impact: merchant.impact,
    time: timeStr,
    date: dateStr,
    fullDate: now,
    details: `MCC ${merchant.mcc} · ${merchant.cat} · Just now`,
    tip: merchant.tips[Math.floor(Math.random() * merchant.tips.length)]
  };

  allTransactions.unshift(txn);
  return txn;
}

// ── Create a transaction DOM element ──
function createTxnElement(txn) {
  const el = document.createElement('div');
  el.className = 'txn-item';
  el.setAttribute('data-txn', txn.id);
  el.setAttribute('data-impact', txn.impact);
  el.innerHTML = `
    <div class="txn-icon ${txn.impact}">${txn.emoji}</div>
    <div class="txn-info">
      <div class="txn-name">${txn.name}</div>
      <div class="txn-details">${txn.details}</div>
    </div>
    <div class="txn-right">
      <div class="txn-carbon ${txn.impact}">${txn.carbon} kg</div>
      <div class="txn-amount">₹${txn.amount}</div>
    </div>
  `;
  el.addEventListener('click', function(e) {
    showTransactionModal(txn);
    const r = document.createElement('span');
    const rect = this.getBoundingClientRect();
    r.style.cssText = `position:absolute;border-radius:50%;background:rgba(74,222,128,.15);width:12px;height:12px;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;transform:translate(-50%,-50%) scale(0);animation:rippleAnim .5s ease-out forwards;pointer-events:none;z-index:99`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 500);
  });
  return el;
}

// ── Add transaction to both list UIs ──
function addTransactionToUI(txn) {
  const homeList  = document.getElementById('homeTxnList');
  const homeEmpty = document.getElementById('homeEmptyState');
  if (homeEmpty) homeEmpty.remove();

  const homeEl = createTxnElement(txn);
  homeEl.style.opacity = '0';
  homeEl.style.transform = 'translateY(-20px)';
  homeList.insertBefore(homeEl, homeList.firstChild);
  setTimeout(() => {
    homeEl.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    homeEl.style.opacity = '1';
    homeEl.style.transform = 'translateY(0)';
  }, 50);

  const homeItems = homeList.querySelectorAll('.txn-item');
  if (homeItems.length > 3) homeItems[homeItems.length - 1].remove();

  const txnsList = document.getElementById('transactionsTxnList');
  const txnsEmpty = document.getElementById('txnsEmptyState');
  if (txnsEmpty) txnsEmpty.remove();

  const txnsEl = createTxnElement(txn);
  txnsEl.style.opacity = '0';
  txnsEl.style.transform = 'translateY(-20px)';
  txnsList.insertBefore(txnsEl, txnsList.firstChild);
  setTimeout(() => {
    txnsEl.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    txnsEl.style.opacity = '1';
    txnsEl.style.transform = 'translateY(0)';
  }, 50);

  const activeFilter = document.querySelector('.filter-tab.active');
  if (activeFilter) {
    const filter = activeFilter.getAttribute('data-filter');
    if (filter !== 'all') {
      txnsEl.style.display = txn.impact === filter ? 'flex' : 'none';
    }
  }

  updateWeeklyCarbon();
  updateCategoryBreakdown();
  updateWeeklyChart();
  updateComparisonCard();
  updateAchievements();
  transactionCount++;
  checkGoalStatus();
  saveState();

  // Award/deduct green points based on impact
  let gpChange = 0;
  const baseGP = Math.floor(txn.amount / 100);
  if (txn.impact === 'low')         gpChange = baseGP * 6;
  else if (txn.impact === 'medium') gpChange = baseGP * 2;
  else if (txn.impact === 'high')   gpChange = -(baseGP * 4);

  if (gpChange !== 0) {
    greenPoints += gpChange;
    if (greenPoints < 0) greenPoints = 0;
    document.getElementById('greenPoints').textContent = greenPoints;
    const el = document.getElementById('rewardsGP');
    if (el) el.textContent = greenPoints;
    updateAchievements();
    saveState();
  }

  return gpChange;
}

// ── Transaction detail modal ──
const txnModal = document.getElementById('txnModal');
const txnModalSheet = document.getElementById('txnModalSheet');

function showTransactionModal(txn) {
  document.getElementById('modalEmoji').textContent = txn.emoji;
  document.getElementById('modalName').textContent = txn.name;
  document.getElementById('modalCat').textContent = `${txn.cat} · MCC ${txn.mcc}`;
  document.getElementById('modalAmount').textContent = `₹${txn.amount}`;
  document.getElementById('modalCarbon').textContent = `${txn.carbon} kg CO₂`;
  document.getElementById('modalDate').textContent = `${txn.date} · ${txn.time}`;

  const iconEl = document.getElementById('modalIconBig');
  iconEl.className = `modal-icon-big ${txn.impact}`;

  const breakdownItems = carbonBreakdownMap[txn.cat] || [
    { name:'Product/Service Carbon',          pct:0.60 },
    { name:'Transportation & Logistics',      pct:0.25 },
    { name:'Operations & Energy',             pct:0.15 }
  ];

  document.getElementById('carbonBreakdown').innerHTML =
    `<div class="breakdown-title">Carbon Breakdown</div>` +
    breakdownItems.map(b => `<div class="breakdown-item"><div class="name">${b.name}</div><div class="val">${(txn.carbon * b.pct).toFixed(2)} kg</div></div>`).join('');

  document.getElementById('modalTip').innerHTML = `<strong>Eco Tip:</strong> ${txn.tip}`;
  txnModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
txnModal.addEventListener('click', e => { if (e.target === txnModal) closeModal(); });

function closeModal() {
  txnModal.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Swipe to close modal ──
let touchStartY = 0;
txnModalSheet.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, {passive:true});
txnModalSheet.addEventListener('touchmove', e => {
  const dy = e.touches[0].clientY - touchStartY;
  if (dy > 0) txnModalSheet.style.transform = `translateY(${dy}px)`;
}, {passive:true});
txnModalSheet.addEventListener('touchend', e => {
  const dy = e.changedTouches[0].clientY - touchStartY;
  txnModalSheet.style.transform = '';
  if (dy > 80) closeModal();
}, {passive:true});

// ── Filter tabs ──
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const filter = this.getAttribute('data-filter');
    document.querySelectorAll('#transactionsTxnList .txn-item').forEach(item => {
      item.style.display = (filter === 'all' || item.getAttribute('data-impact') === filter) ? 'flex' : 'none';
    });
  });
});
