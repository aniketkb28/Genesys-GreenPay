/* ══════════════════════════════════════
   STATE MODULE
   Persistent data store, CSV export, state variables
══════════════════════════════════════ */

// ── App-wide state variables ──
let allTransactions  = [];
let weeklyGoal       = 8.0;
let greenPoints      = 0;
let goalStatus       = 'active';
let transactionCount = 0;
let claimedRewards   = new Set();

// ── Restore saved state for current user ──
function restoreUserState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.allTransactions)           allTransactions  = s.allTransactions;
    if (s.weeklyGoal)                weeklyGoal       = s.weeklyGoal;
    if (s.greenPoints !== undefined) greenPoints      = s.greenPoints;
    if (s.goalStatus)                goalStatus       = s.goalStatus;
    if (s.transactionCount)          transactionCount = s.transactionCount;
    if (s.claimedRewards)            claimedRewards   = new Set(s.claimedRewards);
  } catch(e) { console.warn('State restore failed:', e); }
}

// ── Full UI refresh from restored state ──
function refreshUIFromState() {
  document.getElementById('greenPoints').textContent = greenPoints;
  const gpEl = document.getElementById('rewardsGP');
  if (gpEl) gpEl.textContent = greenPoints;

  const homeList = document.getElementById('homeTxnList');
  const txnsList = document.getElementById('transactionsTxnList');
  if (homeList) homeList.innerHTML = '';
  if (txnsList) txnsList.innerHTML = '';

  allTransactions.forEach(txn => {
    const el = createTxnElement(txn);
    if (homeList && homeList.children.length < 5) homeList.appendChild(el.cloneNode(true));
    if (txnsList) txnsList.appendChild(el);
  });

  document.querySelectorAll('.txn-item[data-txn]').forEach(item => {
    item.addEventListener('click', () => {
      const id  = item.getAttribute('data-txn');
      const txn = allTransactions.find(t => t.id === id);
      if (txn) showTransactionModal(txn);
    });
  });

  updateWeeklyCarbon();
  updateCategoryBreakdown();
  updateWeeklyChart();
  updateComparisonCard();
  updateAchievements();
}

// ── CSV builder (single combined file) ──
function escapeCSVVal(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildCSV() {
  const now        = new Date().toLocaleString('en-IN');
  const totalCO2   = allTransactions.reduce((s, t) => s + t.carbon, 0).toFixed(2);
  const totalSpend = allTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const goalLabel  = goalStatus === 'success' ? 'Achieved' : goalStatus === 'failed' ? 'Failed' : 'Active';
  const cats = {};
  allTransactions.forEach(t => { cats[t.cat] = (cats[t.cat] || 0) + t.carbon; });

  const rows = [
    ['section','field_or_id','value_or_date','col3','col4','col5','col6','col7','col8','col9','col10'],
    ['profile','last_updated',       now],
    ['profile','username',           currentUser?.username || ''],
    ['profile','name',               currentUser?.name || ''],
    ['profile','green_points',       greenPoints],
    ['profile','weekly_goal_kg',     weeklyGoal.toFixed(1)],
    ['profile','goal_status',        goalLabel],
    ['profile','total_co2_kg',       totalCO2],
    ['profile','total_spend_inr',    totalSpend],
    ['profile','total_transactions', allTransactions.length],
    ['profile','claimed_rewards',    [...claimedRewards].join('; ') || 'None'],
    ['category','category_name','co2_kg'],
    ...Object.entries(cats).map(([cat, kg]) => ['category', cat, kg.toFixed(2)]),
    ['transaction','id','date','time','merchant','category','mcc','amount_inr','co2_kg','impact','gp_change','eco_tip'],
    ...allTransactions.map(t => {
      const base = Math.floor((t.amount || 0) / 100);
      const gp   = t.impact === 'low' ? '+' + base * 6
                 : t.impact === 'medium' ? '+' + base * 2
                 : '-' + base * 4;
      return ['transaction', t.id, t.date||'', t.time||'', t.name, t.cat,
              t.mcc||'', t.amount||'', t.carbon.toFixed(2), t.impact, gp, t.tip||''];
    }),
  ];
  return rows.map(r => r.map(escapeCSVVal).join(',')).join('\r\n');
}

// ── Save everything to localStorage ──
function saveState() {
  if (!LS_KEY) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      allTransactions, weeklyGoal, greenPoints,
      goalStatus, transactionCount,
      claimedRewards: [...claimedRewards]
    }));
    localStorage.setItem(LS_KEY + '_csv', buildCSV());
  } catch(e) { console.warn('Save failed:', e); }
}

// ── Download single combined CSV ──
function downloadCSVFromStore() {
  const content = localStorage.getItem(LS_KEY + '_csv') || buildCSV();
  const blob    = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = Object.assign(document.createElement('a'), {
    href: url, download: 'carboncash_data.csv', style: 'display:none'
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Save on page unload ──
window.addEventListener('beforeunload', saveState);

// ── Restore UI if saved data exists on load ──
if (allTransactions.length > 0) {
  setTimeout(refreshUIFromState, 0);
}
