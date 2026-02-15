/* ══════════════════════════════════════
   AUTH MODULE
   Handles login, signup, session management
══════════════════════════════════════ */

const USERS_KEY = 'carboncash_users';
let currentUser = null;
let LS_KEY = '';

// ── User registry helpers ──
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch(e) { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Auth tab switch ──
function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display   = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('signupForm').style.display  = tab === 'signup' ? 'flex' : 'none';
  document.getElementById('loginTab').classList.toggle('active',  tab === 'login');
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  document.getElementById('loginError').textContent  = '';
  document.getElementById('signupError').textContent = '';
}

// ── Login handler ──
function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');

  if (!username || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  const users = getUsers();
  if (!users[username]) { errEl.textContent = 'Username not found. Please sign up first.'; return; }
  if (users[username].password !== btoa(password)) { errEl.textContent = 'Incorrect password.'; return; }

  errEl.textContent = '';
  loginUser(username, users[username].name);
}

// ── Sign up handler ──
function handleSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const errEl    = document.getElementById('signupError');

  if (!name || !username || !password || !confirm) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (username.length < 3)   { errEl.textContent = 'Username must be at least 3 characters.'; return; }
  if (password.length < 6)   { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (password !== confirm)  { errEl.textContent = 'Passwords do not match.'; return; }

  const users = getUsers();
  if (users[username]) { errEl.textContent = 'Username already taken. Try another.'; return; }

  users[username] = { name, password: btoa(password) };
  saveUsers(users);
  errEl.textContent = '';
  loginUser(username, name);
}

// ── Core login: set user, load their data, show app ──
function loginUser(username, name) {
  currentUser = { username, name };
  LS_KEY = 'carboncash_v1_' + username;

  sessionStorage.setItem('carboncash_session', JSON.stringify(currentUser));

  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').style.display = 'flex';

  restoreUserState();
  updateUserDisplays();

  setTimeout(() => {
    initCarbonParticles();
    if (allTransactions.length > 0) refreshUIFromState();
  }, 50);
}

// ── Logout: clear session, reset state, show auth ──
function logoutUser() {
  saveState();
  sessionStorage.removeItem('carboncash_session');
  currentUser = null;
  LS_KEY = '';

  allTransactions  = [];
  greenPoints      = 0;
  weeklyGoal       = 8.0;
  goalStatus       = 'active';
  transactionCount = 0;
  claimedRewards   = new Set();

  ['homeTxnList','transactionsTxnList'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
  });

  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authScreen').classList.remove('hidden');
  switchAuthTab('login');
}

// ── Update name/username displays in the app ──
function updateUserDisplays() {
  const name = currentUser?.name || 'User';
  const username = currentUser?.username || '';
  const nameEl = document.querySelector('.profile-name');
  if (nameEl) nameEl.textContent = name;
  const emailEl = document.querySelector('.profile-email');
  if (emailEl) emailEl.textContent = '@' + username;
}

// ── Check if already logged in from this session ──
(function checkSession() {
  try {
    const session = sessionStorage.getItem('carboncash_session');
    if (session) {
      const { username, name } = JSON.parse(session);
      const users = getUsers();
      if (users[username]) {
        loginUser(username, name);
        return;
      }
    }
  } catch(e) {}
  // No session — show auth screen (already visible by default)
})();

// ── Allow Enter key on auth inputs ──
['loginUsername','loginPassword'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
});
['signupName','signupUsername','signupPassword','signupConfirm'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
});
