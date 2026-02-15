/* ══════════════════════════════════════
   APP MODULE
   Navigation, QR handler, toast, particles,
   CSV export, delete data, profile interactions
══════════════════════════════════════ */

// ── Carbon particles ──
function initCarbonParticles() {
  const carbonField = document.getElementById('carbonField');
  if (carbonField.children.length > 0) return;
  const symbols = ['CO₂', '🌿', '♻️', '🌍'];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'carbon-particle';
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    p.style.left = Math.random() * 100 + '%';
    p.style.fontSize = (Math.random() * 12 + 16) + 'px';
    p.style.animationDuration = (Math.random() * 20 + 25) + 's';
    p.style.animationDelay = Math.random() * 15 + 's';
    p.style.color = 'rgba(74,222,128,0.2)';
    carbonField.appendChild(p);
  }
}

// ── Page navigation ──
function navigateToPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  setTimeout(() => {
    const pg = document.getElementById(pageId);
    if (pg) pg.classList.add('active');
  }, 50);
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const target = document.querySelector(`[data-page="${pageId}"]`);
  if (target) target.classList.add('active');
}

function navigateTo(pageId) { navigateToPage(pageId); }

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigateToPage(item.getAttribute('data-page')));
});

// ── Toast notification ──
function showToast(title, message, icon = '✓', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icon}</div>
      <div class="toast-text">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ── QR button handler ──
function handleQRScan(e) {
  const btn = e.currentTarget;
  btn.style.transform = 'scale(0.9)';
  setTimeout(() => {
    btn.style.transform = '';
    const txn = generateTransaction();
    const gpChange = addTransactionToUI(txn);

    let gpMessage = '';
    if (gpChange > 0)      gpMessage = ` • +${gpChange} GP earned! 🎉`;
    else if (gpChange < 0) gpMessage = ` • ${gpChange} GP penalty 😔`;

    showToast(`${txn.name} – ₹${txn.amount}`, `+${txn.carbon} kg CO₂ added${gpMessage}`, txn.emoji, 3500);
    btn.style.boxShadow = '0 0 20px rgba(74,222,128,.6)';
    setTimeout(() => btn.style.boxShadow = '', 1000);
  }, 200);
}

document.getElementById('qrBtn').addEventListener('click', handleQRScan);
document.getElementById('qrBtn2').addEventListener('click', handleQRScan);
document.getElementById('qrBtn3').addEventListener('click', handleQRScan);
document.getElementById('qrBtn4').addEventListener('click', handleQRScan);

// ── Ripple animation style ──
const ripStyle = document.createElement('style');
ripStyle.textContent = '@keyframes rippleAnim{to{transform:scale(14);opacity:0;}}';
document.head.appendChild(ripStyle);

// ── CSV export (two files) ──
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href:url, download:filename, style:'display:none' });
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToCSV() {
  const now       = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
  const dateTag   = now.toISOString().slice(0, 10);

  const totalCarbon = allTransactions.reduce((s, t) => s + t.carbon, 0);
  const totalSpend  = allTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const goalLabel   = goalStatus === 'success' ? 'Achieved' : goalStatus === 'failed' ? 'Failed' : 'Active';
  const claimed     = [...claimedRewards].join('; ') || 'None';

  const profileRows = [
    ['Field', 'Value'],
    ['Export Timestamp', timestamp],
    ['Username',         currentUser?.username || ''],
    ['Name',             currentUser?.name || ''],
    ['Green Points (GP)', greenPoints],
    ['Weekly Carbon Goal (kg CO₂)', weeklyGoal.toFixed(1)],
    ['Goal Status',      goalLabel],
    ['Total CO₂ This Week (kg)', totalCarbon.toFixed(2)],
    ['Total Transactions', allTransactions.length],
    ['Total Spend (₹)',  totalSpend],
    ['Claimed Rewards',  claimed],
  ];

  const cats = { 'Eating Places': 0, 'Gas Station': 0, 'Grocery Store': 0,
                 'Clothing Store': 0, 'Entertainment': 0, 'Health & Fitness': 0, 'Restaurant': 0, 'Fast Food': 0 };
  allTransactions.forEach(t => { if (cats[t.cat] !== undefined) cats[t.cat] += t.carbon; });
  profileRows.push(['', ''], ['--- Carbon by Category ---', '']);
  Object.entries(cats).forEach(([cat, kg]) => {
    if (kg > 0) profileRows.push([cat + ' (kg CO₂)', kg.toFixed(2)]);
  });

  const profileCSV = profileRows.map(r => r.map(escapeCSV).join(',')).join('\r\n');

  const txnHeaders = ['Transaction ID', 'Date', 'Time', 'Merchant Name', 'Category', 'MCC Code', 'Amount (₹)', 'Carbon (kg CO₂)', 'Impact Level', 'Green Points Change', 'Eco Tip'];
  const txnRows = allTransactions.map(t => {
    let gpEstimate = '';
    if (t.impact === 'low')    gpEstimate = '+' + Math.round((t.amount / 1000) * 6 * 2);
    if (t.impact === 'medium') gpEstimate = '+' + Math.round((t.amount / 1000) * 2 * 2);
    if (t.impact === 'high')   gpEstimate = '-' + Math.round((t.amount / 1000) * 4 * 2);
    return [t.id, t.date||dateTag, t.time||'', t.name, t.cat, t.mcc||'', t.amount||'', t.carbon.toFixed(2), t.impact, gpEstimate, t.tip||''];
  });

  const txnCSV = [txnHeaders, ...txnRows].map(r => r.map(escapeCSV).join(',')).join('\r\n');

  downloadCSV(profileCSV, `carboncash_profile_${dateTag}.csv`);
  setTimeout(() => downloadCSV(txnCSV, `carboncash_transactions_${dateTag}.csv`), 400);
  showToast('Export Complete! 📊', '2 CSV files downloaded: profile & transactions', '✅', 4000);
}

// ── Export button (profile page) ──
document.getElementById('exportDataBtn').onclick = function() {
  saveState();
  downloadCSVFromStore();
  showToast('CSV Downloaded! 📊', 'carboncash_data.csv — always the same file', '✅', 3500);
};

// ── Delete all data ──
function showDeleteConfirm() {
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
}

function deleteAllData() {
  allTransactions  = [];
  greenPoints      = 0;
  weeklyGoal       = 8.0;
  goalStatus       = 'active';
  transactionCount = 0;
  claimedRewards   = new Set();

  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_KEY + '_csv');

  ['greenPoints','rewardsGP'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '0';
  });

  const goalValEl = document.getElementById('goalValue');
  if (goalValEl) goalValEl.textContent = '8.0';
  const profileCarbon = document.getElementById('profileTotalCarbon');
  if (profileCarbon) profileCarbon.textContent = '0';

  ['homeTxnList','transactionsTxnList'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });

  updateWeeklyCarbon();
  updateCategoryBreakdown();
  updateWeeklyChart();
  updateComparisonCard();
  updateAchievements();

  closeDeleteModal();
  showToast('Data Deleted', 'All your data has been permanently erased', '🗑️', 3500);
}

document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
document.getElementById('deleteConfirmBtn').addEventListener('click', deleteAllData);
document.getElementById('deleteModal').addEventListener('click', function(e) {
  if (e.target === this) closeDeleteModal();
});

// ── Profile interactions ──
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function() {
    if (this.id === 'exportDataBtn' || this.id === 'deleteDataBtn') return;
    const title = this.querySelector('.menu-title')?.textContent;
    if (title) showToast('Opening', title, '📱');
  });
});

document.getElementById('editProfileBtn').addEventListener('click', () => {
  showToast('Coming Soon', 'Edit profile feature is under development', '👤');
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Log out of CarbonCash?')) logoutUser();
});
