/* ══════════════════════════════════════
   INSIGHTS & GOAL MODULE
   Weekly carbon, category breakdown, chart,
   comparison card, achievements, goal system
══════════════════════════════════════ */

// ── Update weekly carbon display ──
function updateWeeklyCarbon() {
  const total = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
  document.getElementById('weekCarbon').textContent = total.toFixed(1);

  const percentUsed = Math.min((total / weeklyGoal) * 100, 100);
  const circumference = 188.5;
  const offset = circumference - (circumference * percentUsed / 100);
  document.getElementById('goalCircle').style.strokeDashoffset = offset;
  document.querySelector('.goal-ring-label span').textContent = Math.round(percentUsed) + '%';

  const remaining = Math.max(weeklyGoal - total, 0);
  document.querySelector('.goal-info .main').textContent = `${remaining.toFixed(1)} kg away from your Green Goal`;

  const percentRemaining = Math.max(0, ((weeklyGoal - total) / weeklyGoal) * 100);
  document.getElementById('weeklyProgressBar').style.width = `${percentRemaining}%`;

  const badge = document.getElementById('weeklyBadge');
  if (total >= weeklyGoal) {
    badge.textContent = 'Over Goal';
    badge.style.cssText = 'background:rgba(248,113,113,.15);color:#f87171;border-color:rgba(248,113,113,.3);';
  } else if (percentRemaining < 20) {
    badge.textContent = 'Almost There!';
    badge.style.cssText = 'background:rgba(251,191,36,.15);color:#fbbf24;border-color:rgba(251,191,36,.3);';
  } else {
    badge.textContent = 'On Track';
    badge.style.cssText = 'background:rgba(74,222,128,.1);color:#4ade80;border-color:rgba(74,222,128,.25);';
  }

  document.getElementById('weeklyRemaining').textContent = `${remaining.toFixed(1)} kg`;
  document.getElementById('weeklyUsed').textContent = `${total.toFixed(1)} kg`;
  document.getElementById('weeklyGoalDisplay').textContent = `${weeklyGoal.toFixed(1)} kg`;
  document.getElementById('profileTotalCarbon').textContent = total.toFixed(1);

  if (transactionCount >= 3 && total < weeklyGoal && goalStatus === 'active') {
    setTimeout(awardGreenPoints, 500);
  }
}

// ── Category breakdown (synced to transactions) ──
function updateCategoryBreakdown() {
  const el = document.getElementById('categoryList');
  if (!el) return;

  const catMap = {
    'Eating Places':  'Food & Dining',
    'Fast Food':      'Food & Dining',
    'Restaurant':     'Food & Dining',
    'Grocery Store':  'Food & Dining',
    'Gas Station':    'Transportation',
    'Clothing Store': 'Shopping',
    'Entertainment':  'Entertainment',
    'Health & Fitness':'Entertainment'
  };

  const catMeta = {
    'Food & Dining':  { icon:'🍕', grad:'linear-gradient(90deg,#fb923c,#fbbf24)' },
    'Transportation': { icon:'⛽', grad:'linear-gradient(90deg,#f87171,#fb923c)' },
    'Shopping':       { icon:'👕', grad:'linear-gradient(90deg,#fbbf24,#4ade80)' },
    'Entertainment':  { icon:'🎬', grad:'linear-gradient(90deg,#38bdf8,#4ade80)' }
  };

  const totals = {};
  for (const txn of allTransactions) {
    const display = catMap[txn.cat] || 'Other';
    totals[display] = (totals[display] || 0) + txn.carbon;
  }

  const grand = Object.values(totals).reduce((s, v) => s + v, 0);

  if (grand === 0) {
    el.innerHTML = `<div style="text-align:center;padding:32px 20px;color:var(--text-muted);">
      <div style="font-size:36px;margin-bottom:8px;">📊</div>
      <div style="font-size:13px;">No transactions yet — tap 📷 to add one</div>
    </div>`;
    return;
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted[0][1];

  el.innerHTML = sorted.map(([cat, val]) => {
    const meta = catMeta[cat] || { icon:'📦', grad:'linear-gradient(90deg,#4ade80,#22c55e)' };
    const pct  = grand > 0 ? Math.round((val / grand) * 100) : 0;
    const barW = grand > 0 ? Math.round((val / maxVal) * 100) : 0;
    return `<div class="category-item">
      <div class="cat-icon">${meta.icon}</div>
      <div class="cat-info">
        <div class="cat-name">${cat}</div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${barW}%;background:${meta.grad};"></div></div>
      </div>
      <div class="cat-value">
        <div class="cat-carbon">${val.toFixed(1)} kg</div>
        <div class="cat-percent">${pct}%</div>
      </div>
    </div>`;
  }).join('');
}

// ── Weekly chart ──
function updateWeeklyChart() {
  const chartEl = document.getElementById('weeklyChart');
  if (!chartEl) return;

  const total = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
  const totalEl = document.getElementById('insightsWeeklyTotal');
  if (totalEl) totalEl.textContent = total.toFixed(1) + ' kg CO₂';

  if (total === 0) {
    chartEl.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:36px;margin-bottom:8px;">📊</div>
      <div style="font-size:13px;">No transactions yet — tap 📷 to add one</div>
    </div>`;
    return;
  }

  const now = new Date();
  const dailyTotals = {};
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    dailyTotals[key] = { carbon: 0, label: dayLabels[d.getDay()] };
  }

  allTransactions.forEach(txn => {
    const key = txn.fullDate.toDateString();
    if (dailyTotals[key]) dailyTotals[key].carbon += txn.carbon;
  });

  const entries = Object.values(dailyTotals);
  const maxCarbon = Math.max(...entries.map(e => e.carbon), 0.1);

  chartEl.innerHTML = entries.map((entry, idx) => {
    const height = maxCarbon > 0 ? Math.max((entry.carbon / maxCarbon) * 100, 5) : 5;
    const isToday = idx === entries.length - 1;
    return `<div class="chart-bar${isToday ? ' active' : ''}" style="height:${height}%;">
      <span>${entry.label}<br>${entry.carbon.toFixed(1)}kg</span>
    </div>`;
  }).join('');
}

// ── Comparison card ──
function updateComparisonCard() {
  const yourCarbon = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
  const avgCarbon = weeklyGoal;

  const yourCarbonEl = document.getElementById('yourCarbon');
  const avgCarbonEl  = document.getElementById('avgCarbon');
  const yourBarEl    = document.getElementById('yourBar');
  const compBadgeEl  = document.getElementById('compBadge');
  const compTipEl    = document.getElementById('compTip');

  if (!yourCarbonEl || !avgCarbonEl || !yourBarEl || !compBadgeEl || !compTipEl) return;

  yourCarbonEl.textContent = yourCarbon.toFixed(1) + ' kg';
  avgCarbonEl.textContent  = avgCarbon.toFixed(1) + ' kg';

  if (yourCarbon === 0) {
    yourBarEl.style.width = '0%';
    compBadgeEl.textContent = '-';
    compBadgeEl.className = 'comp-badge';
    compTipEl.textContent = '🌟 Start adding transactions to see how you compare!';
    return;
  }

  yourBarEl.style.width = Math.min((yourCarbon / avgCarbon) * 100, 100) + '%';

  if (yourCarbon < avgCarbon) {
    const pct = Math.round(((avgCarbon - yourCarbon) / avgCarbon) * 100);
    compBadgeEl.textContent = pct + '% Better';
    compBadgeEl.className = 'comp-badge good';
    compTipEl.textContent = '🌟 You\'re doing great! Your carbon footprint is lower than average.';
  } else if (yourCarbon > avgCarbon) {
    const pct = Math.round(((yourCarbon - avgCarbon) / avgCarbon) * 100);
    compBadgeEl.textContent = pct + '% Higher';
    compBadgeEl.className = 'comp-badge bad';
    compTipEl.textContent = '💡 Try reducing your carbon footprint to meet your weekly goal!';
  } else {
    compBadgeEl.textContent = 'On Par';
    compBadgeEl.className = 'comp-badge';
    compTipEl.textContent = '👍 You\'re right on track with the average user.';
  }
}

// ── Achievements ──
function updateAchievements() {
  const achEcoStarter = document.getElementById('achEcoStarter');
  if (achEcoStarter) achEcoStarter.classList.toggle('earned', allTransactions.length >= 1);

  const achGoalGetter = document.getElementById('achGoalGetter');
  if (achGoalGetter) {
    const total = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
    achGoalGetter.classList.toggle('earned', goalStatus === 'success' || (total < weeklyGoal && transactionCount >= 3));
  }

  const achSpendWise = document.getElementById('achSpendWise');
  if (achSpendWise) achSpendWise.classList.toggle('earned', allTransactions.length >= 5);

  const achPointCollector = document.getElementById('achPointCollector');
  if (achPointCollector) achPointCollector.classList.toggle('earned', greenPoints >= 50);
}

// ── Goal status check ──
function checkGoalStatus() {
  const total = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
  const alert = document.getElementById('goalStatusAlert');

  if (goalStatus === 'active' && total >= weeklyGoal) {
    goalStatus = 'failed';
    alert.classList.remove('hidden','success');
    alert.classList.add('failed');
    document.getElementById('goalStatusIcon').textContent = '😢';
    document.getElementById('goalStatusTitle').textContent = 'Goal Failed!';
    document.getElementById('goalStatusMessage').textContent = `You exceeded your ${weeklyGoal.toFixed(1)}kg goal. Try again next week!`;
    setTimeout(() => alert.classList.add('hidden'), 5000);
  }
}

// ── Award green points on goal achievement ──
function awardGreenPoints() {
  const total = allTransactions.reduce((sum, t) => sum + t.carbon, 0);
  if (goalStatus === 'active' && total < weeklyGoal && transactionCount >= 3) {
    goalStatus = 'success';
    greenPoints += 50;
    document.getElementById('greenPoints').textContent = greenPoints;
    const el = document.getElementById('rewardsGP'); if (el) el.textContent = greenPoints;
    saveState();
    updateAchievements();

    const alert = document.getElementById('goalStatusAlert');
    alert.classList.remove('hidden','failed');
    alert.classList.add('success');
    document.getElementById('goalStatusIcon').textContent = '🎉';
    document.getElementById('goalStatusTitle').textContent = 'Goal Achieved!';
    document.getElementById('goalStatusMessage').textContent = 'You earned 50 Green Points! Keep up the great work!';

    const btn = document.getElementById('setGoalBtn');
    btn.style.transform = 'scale(1.1)';
    setTimeout(() => btn.style.transform = '', 300);
    setTimeout(() => alert.classList.add('hidden'), 6000);
  }
}

// ── Goal setting modal ──
document.getElementById('setGoalBtn').addEventListener('click', () => {
  document.getElementById('goalInput').value = weeklyGoal.toFixed(1);
  document.getElementById('goalModal').classList.add('open');
  document.body.style.overflow = 'hidden';
});

document.querySelectorAll('.goal-suggest-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.getElementById('goalInput').value = parseFloat(this.getAttribute('data-goal')).toFixed(1);
  });
});

document.getElementById('goalSaveBtn').addEventListener('click', function() {
  const newGoal = parseFloat(document.getElementById('goalInput').value);
  if (newGoal && newGoal > 0 && newGoal <= 100) {
    weeklyGoal = newGoal;
    document.getElementById('goalValue').textContent = weeklyGoal.toFixed(1);
    goalStatus = 'active';
    document.getElementById('goalStatusAlert').classList.add('hidden');
    closeGoalModal();
    updateWeeklyCarbon();
    saveState();
    const orig = this.textContent;
    this.textContent = '✓ Goal Saved!';
    this.style.opacity = '0.8';
    setTimeout(() => { this.textContent = orig; this.style.opacity = ''; }, 1500);
  } else {
    showToast('Invalid Goal', 'Please enter a valid goal between 1 and 100 kg CO₂', '⚠️');
  }
});

document.getElementById('goalCancelBtn').addEventListener('click', closeGoalModal);
document.getElementById('goalModal').addEventListener('click', e => {
  if (e.target === document.getElementById('goalModal')) closeGoalModal();
});

function closeGoalModal() {
  document.getElementById('goalModal').classList.remove('open');
  document.body.style.overflow = '';
}
