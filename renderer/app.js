// ==========================================
// VULPAX GIT CLIENT - RENDERER APP
// ==========================================

const V = window.vulpax;
let currentPage = 'dashboard';
let currentUser = null;
let selectedRepo = null; // { owner, name, full_name }
let localRepoPath = null;

// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  initWindowControls();
  initNavigation();
  initModal();
  await loadTheme();
  await checkAuth();
});

// ==========================================
// WINDOW CONTROLS
// ==========================================

function initWindowControls() {
  document.getElementById('btn-minimize').addEventListener('click', () => V.minimize());
  document.getElementById('btn-maximize').addEventListener('click', () => V.maximize());
  document.getElementById('btn-close').addEventListener('click', () => V.close());
}

// ==========================================
// THEME
// ==========================================

async function loadTheme() {
  const theme = await V.getSetting('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

async function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  await V.setSetting('theme', theme);
}

// ==========================================
// NAVIGATION
// ==========================================

function initNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  renderPage(page);
  updateStatusBar();
}

// ==========================================
// AUTH
// ==========================================

async function checkAuth() {
  const result = await V.getUser();
  if (result.success) {
    currentUser = result.user;
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-overlay').style.display = 'flex';
  
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('token-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('token-help-link').addEventListener('click', () => {
    const help = document.getElementById('login-help');
    help.style.display = help.style.display === 'none' ? 'block' : 'none';
  });
}

async function doLogin() {
  const token = document.getElementById('token-input').value.trim();
  if (!token) return toast('Token gereklidir', 'error');
  
  const btn = document.getElementById('btn-login');
  btn.disabled = true;
  btn.textContent = 'Giriş yapılıyor...';
  
  const result = await V.auth(token);
  if (result.success) {
    currentUser = result.user;
    toast(`Hoş geldin, ${result.user.login}!`, 'success');
    showApp();
  } else {
    toast('Giriş başarısız: ' + result.error, 'error');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Giriş Yap`;
  }
}

function showApp() {
  document.getElementById('login-overlay').style.display = 'none';
  if (currentUser) {
    const sidebarUser = document.getElementById('sidebar-user');
    sidebarUser.style.display = 'flex';
    document.getElementById('sidebar-avatar').src = currentUser.avatar_url;
    document.getElementById('sidebar-username').textContent = currentUser.login;
  }
  navigateTo('dashboard');
  initEnhancements();
}

// ==========================================
// TOAST
// ==========================================

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  
  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  
  el.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ==========================================
// MODAL
// ==========================================

function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
}

function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ==========================================
// HELPERS
// ==========================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}sn önce`;
  if (diff < 3600) return `${Math.floor(diff/60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff/3600)}sa önce`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}g önce`;
  return d.toLocaleDateString('tr-TR');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function loading() {
  return '<div class="loader"><div class="spinner"></div></div>';
}

function svgIcon(name) {
  const icons = {
    repo: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="currentColor"/></svg>',
    fork: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 5a3 3 0 11-6 0 3 3 0 016 0zM23 5a3 3 0 11-6 0 3 3 0 016 0zM13 19a3 3 0 11-6 0 3 3 0 016 0z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8v2c0 2 2 4 6 4s6-2 6-4V8M10 14v2" stroke="currentColor" stroke-width="2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 019.9-1" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    branch: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 3v12M18 3v6M6 15a3 3 0 100 6 3 3 0 000-6zM18 9a3 3 0 100 6 3 3 0 000-6zM18 12H9a3 3 0 01-3-3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    commit: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1.05 12H8m8 0h6.95" stroke="currentColor" stroke-width="2"/></svg>',
    issue: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pr: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 9v6M18 9v6" stroke="currentColor" stroke-width="2"/></svg>',
    folder: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="23 4 23 10 17 10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    merge: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="18" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 21V9a9 9 0 009 9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  return icons[name] || '';
}

// ==========================================
// PAGE RENDERER
// ==========================================

function renderPage(page) {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  content.scrollTop = 0;
  
  const pages = {
    dashboard: renderDashboard,
    repos: renderRepos,
    branches: renderBranches,
    commits: renderCommits,
    pullrequests: renderPullRequests,
    issues: renderIssues,
    actions: renderActions,
    releases: renderReleases,
    gists: renderGists,
    stars: renderStars,
    notifications: renderNotifications,
    search: renderSearch,
    localrepo: renderLocalRepo,
    collaborators: renderCollaborators,
    filebrowser: renderFileBrowser,
    organizations: renderOrganizations,
    profile: renderProfile,
    tutorials: renderTutorials,
    settings: renderSettings,
  };
  
  const renderer = pages[page];
  if (renderer) renderer();
}

// ==========================================
// DASHBOARD
// ==========================================

async function renderDashboard() {
  const content = document.getElementById('content');
  
  const [reposRes, notifsRes, gistsRes] = await Promise.all([
    V.listRepos({ per_page: 100 }),
    V.listNotifications(),
    V.listGists()
  ]);
  
  const repos = reposRes.success ? reposRes.repos : [];
  const notifs = notifsRes.success ? notifsRes.notifications : [];
  const gists = gistsRes.success ? gistsRes.gists : [];
  
  const publicRepos = repos.filter(r => !r.private).length;
  const privateRepos = repos.filter(r => r.private).length;
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>
            Dashboard
          </h1>
          <p class="page-subtitle">Hoş geldin, ${escapeHtml(currentUser?.name || currentUser?.login || '')}!</p>
        </div>
        <div class="page-actions">
          <button class="btn" onclick="showActivityFeed()">Aktivite Akışı</button>
          <button class="btn" onclick="exportRepoList()">CSV İndir</button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card" onclick="navigateTo('repos')">
          <div class="stat-icon orange">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${repos.length}</div>
            <div class="stat-label">Toplam Repo</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="currentColor"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${totalStars}</div>
            <div class="stat-label">Toplam Yıldız</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            ${svgIcon('fork')}
          </div>
          <div class="stat-info">
            <div class="stat-number">${totalForks}</div>
            <div class="stat-label">Toplam Fork</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${notifs.length}</div>
            <div class="stat-label">Bildirimler</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">
            ${svgIcon('unlock')}
          </div>
          <div class="stat-info">
            <div class="stat-number">${publicRepos}</div>
            <div class="stat-label">Public Repo</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            ${svgIcon('lock')}
          </div>
          <div class="stat-info">
            <div class="stat-number">${privateRepos}</div>
            <div class="stat-label">Private Repo</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">⚡ Hızlı Erişim</h3>
        </div>
        <div class="local-quick-actions">
          <button class="btn" onclick="navigateTo('localrepo')">📂 Yerel Repo</button>
          <button class="btn" onclick="showQuickCommitPush()">⚡ Hızlı Commit+Push</button>
          <button class="btn" onclick="navigateTo('search')">🔍 Arama</button>
          <button class="btn" onclick="showActivityFeed()">📊 Aktivite</button>
          <button class="btn" onclick="navigateTo('notifications')">🔔 Bildirimler</button>
          <button class="btn" onclick="showKeyboardShortcuts()">⌨️ Kısayollar</button>
          <button class="btn" onclick="exportRepoList()">📥 CSV İndir</button>
          <button class="btn" onclick="detectSystemTheme()">🎨 Tema Algıla</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${svgIcon('repo')} Son Güncellenen Repolar</h3>
          <button class="btn btn-sm" onclick="navigateTo('repos')">Tümünü Gör</button>
        </div>
        ${repos.slice(0, 5).map(r => `
          <div class="list-item" onclick="selectRepoAndGo('${escapeHtml(r.owner.login)}', '${escapeHtml(r.name)}')">
            <div class="list-item-icon">${r.private ? svgIcon('lock') : svgIcon('repo')}</div>
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(r.full_name)}</div>
              <div class="list-item-subtitle">${escapeHtml(r.description || 'Açıklama yok')}</div>
            </div>
            <span class="badge badge-accent">${escapeHtml(r.language || '-')}</span>
            <span class="text-sm text-muted">${timeAgo(r.updated_at)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
            Son Gist'lerim
          </h3>
          <button class="btn btn-sm" onclick="navigateTo('gists')">Tümünü Gör</button>
        </div>
        ${gists.length === 0 ? '<p class="text-muted text-sm" style="padding:12px 16px;">Henüz gist yok</p>' :
          gists.slice(0, 3).map(g => `
            <div class="list-item">
              <div class="list-item-icon">${svgIcon('file')}</div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(g.description || Object.keys(g.files)[0])}</div>
                <div class="list-item-subtitle">${Object.keys(g.files).length} dosya · ${g.public ? 'Public' : 'Secret'} · ${timeAgo(g.updated_at)}</div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// REPOS
// ==========================================

async function renderRepos() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listRepos({ per_page: 100 });
  if (!result.success) return content.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`;
  
  const repos = result.repos;
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('repo')} Repolar</h1>
          <p class="page-subtitle">${repos.length} repo bulundu</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showCreateRepoModal()">
            ${svgIcon('plus')} Yeni Repo
          </button>
        </div>
      </div>
      
      <div class="search-bar">
        <input type="search" id="repo-search" placeholder="Repo ara..." oninput="filterRepos()">
        <select id="repo-filter" onchange="filterRepos()">
          <option value="all">Tümü</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="fork">Fork</option>
        </select>
        <select id="repo-sort" onchange="filterRepos()">
          <option value="updated">Son Güncellenen</option>
          <option value="name">İsim</option>
          <option value="stars">Yıldız</option>
        </select>
      </div>
      
      <div class="repo-grid" id="repo-grid">
        ${repos.map(r => repoCardHtml(r)).join('')}
      </div>
    </div>
  `;
  
  window._allRepos = repos;
}

function repoCardHtml(r) {
  return `
    <div class="repo-card" data-name="${escapeHtml(r.name.toLowerCase())}" data-type="${r.private ? 'private' : 'public'}" data-fork="${r.fork}" data-stars="${r.stargazers_count}" data-updated="${r.updated_at}" onclick="showRepoDetail('${escapeHtml(r.owner.login)}', '${escapeHtml(r.name)}')">
      <div class="repo-card-header">
        <div class="repo-card-name">${escapeHtml(r.name)}</div>
        <span class="badge ${r.private ? 'badge-danger' : 'badge-success'}">${r.private ? 'Private' : 'Public'}</span>
      </div>
      <div class="repo-card-desc">${escapeHtml(r.description || 'Açıklama yok')}</div>
      <div class="repo-card-meta">
        ${r.language ? `<span class="repo-meta-item"><span style="width:12px;height:12px;border-radius:50%;background:var(--accent);display:inline-block;"></span>${escapeHtml(r.language)}</span>` : ''}
        <span class="repo-meta-item">${svgIcon('star')} ${r.stargazers_count}</span>
        <span class="repo-meta-item">${svgIcon('fork')} ${r.forks_count}</span>
        <span class="repo-meta-item">${svgIcon('eye')} ${r.watchers_count}</span>
        <span class="repo-meta-item">${svgIcon('clock')} ${timeAgo(r.updated_at)}</span>
      </div>
    </div>
  `;
}

function filterRepos() {
  const search = document.getElementById('repo-search').value.toLowerCase();
  const filter = document.getElementById('repo-filter').value;
  const sort = document.getElementById('repo-sort').value;
  
  let repos = [...(window._allRepos || [])];
  
  if (search) repos = repos.filter(r => r.name.toLowerCase().includes(search) || (r.description || '').toLowerCase().includes(search));
  if (filter === 'public') repos = repos.filter(r => !r.private);
  if (filter === 'private') repos = repos.filter(r => r.private);
  if (filter === 'fork') repos = repos.filter(r => r.fork);
  
  if (sort === 'name') repos.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'stars') repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  if (sort === 'updated') repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  
  document.getElementById('repo-grid').innerHTML = repos.map(r => repoCardHtml(r)).join('');
}

function showCreateRepoModal() {
  openModal('Yeni Repo Oluştur', `
    <div class="input-group">
      <label>Repo Adı</label>
      <input type="text" id="new-repo-name" placeholder="my-awesome-project">
    </div>
    <div class="input-group">
      <label>Açıklama</label>
      <textarea id="new-repo-desc" placeholder="Proje açıklaması"></textarea>
    </div>
    <div class="checkbox-group">
      <input type="checkbox" id="new-repo-private">
      <label for="new-repo-private">Private repo</label>
    </div>
    <div class="checkbox-group">
      <input type="checkbox" id="new-repo-init" checked>
      <label for="new-repo-init">README ile başlat</label>
    </div>
    <div class="input-group">
      <label>.gitignore Template</label>
      <select id="new-repo-gitignore">
        <option value="">Yok</option>
        <option value="Node">Node</option>
        <option value="Python">Python</option>
        <option value="Java">Java</option>
        <option value="C++">C++</option>
        <option value="C#">C#</option>
        <option value="Go">Go</option>
        <option value="Rust">Rust</option>
        <option value="Ruby">Ruby</option>
        <option value="Swift">Swift</option>
        <option value="Unity">Unity</option>
        <option value="VisualStudio">Visual Studio</option>
      </select>
    </div>
    <div class="input-group">
      <label>Lisans</label>
      <select id="new-repo-license">
        <option value="">Yok</option>
        <option value="mit">MIT</option>
        <option value="apache-2.0">Apache 2.0</option>
        <option value="gpl-3.0">GPL 3.0</option>
        <option value="bsd-2-clause">BSD 2-Clause</option>
        <option value="bsd-3-clause">BSD 3-Clause</option>
        <option value="lgpl-2.1">LGPL 2.1</option>
        <option value="mpl-2.0">MPL 2.0</option>
        <option value="unlicense">Unlicense</option>
      </select>
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="createRepo()">
      ${svgIcon('plus')} Repo Oluştur
    </button>
  `);
}

async function createRepo() {
  const name = document.getElementById('new-repo-name').value.trim();
  if (!name) return toast('Repo adı gerekli', 'error');
  
  const result = await V.createRepo({
    name,
    description: document.getElementById('new-repo-desc').value.trim(),
    private: document.getElementById('new-repo-private').checked,
    auto_init: document.getElementById('new-repo-init').checked,
    gitignore_template: document.getElementById('new-repo-gitignore').value || undefined,
    license_template: document.getElementById('new-repo-license').value || undefined
  });
  
  if (result.success) {
    toast(`"${name}" reposu oluşturuldu!`, 'success');
    closeModal();
    
    // Show origin link info
    const repo = result.repo;
    openModal('Repo Oluşturuldu!', `
      <div style="text-align:center; padding: 20px 0;">
        <svg viewBox="0 0 24 24" width="48" height="48" style="color:var(--success);margin-bottom:16px;"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h3 style="margin-bottom:8px;">${escapeHtml(repo.full_name)}</h3>
        <p class="text-muted mb-md">Repo başarıyla oluşturuldu!</p>
        
        <div class="input-group" style="text-align:left;">
          <label>HTTPS Clone URL</label>
          <div class="flex-row">
            <input type="text" value="${escapeHtml(repo.clone_url)}" readonly id="clone-url-https">
            <button class="btn btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('clone-url-https').value);toast('Kopyalandı!','success');">${svgIcon('copy')}</button>
          </div>
        </div>

        <div class="input-group" style="text-align:left;">
          <label>SSH Clone URL</label>
          <div class="flex-row">
            <input type="text" value="${escapeHtml(repo.ssh_url)}" readonly id="clone-url-ssh">
            <button class="btn btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('clone-url-ssh').value);toast('Kopyalandı!','success');">${svgIcon('copy')}</button>
          </div>
        </div>

        <div class="input-group" style="text-align:left;">
          <label>Origin Eklemek İçin</label>
          <div class="flex-row">
            <input type="text" value="git remote add origin ${escapeHtml(repo.clone_url)}" readonly id="origin-cmd">
            <button class="btn btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('origin-cmd').value);toast('Kopyalandı!','success');">${svgIcon('copy')}</button>
          </div>
        </div>
        
        <div class="flex-row mt-md" style="justify-content:center;gap:8px;">
          <button class="btn btn-primary" onclick="selectRepoAndGo('${escapeHtml(repo.owner.login)}','${escapeHtml(repo.name)}');closeModal();">Repo'ya Git</button>
          <button class="btn" onclick="closeModal();renderRepos();">Kapat</button>
        </div>
      </div>
    `);
  } else {
    toast('Hata: ' + result.error, 'error');
  }
}

function selectRepoAndGo(owner, name) {
  selectedRepo = { owner, name, full_name: `${owner}/${name}` };
  navigateTo('branches');
}

// ==========================================
// BRANCHES
// ==========================================

async function renderBranches() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">${svgIcon('branch')} Branch'ler</h1>
        </div>
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M6 3v12M18 3v6M6 15a3 3 0 100 6 3 3 0 000-6zM18 9a3 3 0 100 6 3 3 0 000-6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <h3>Repo Seçilmedi</h3>
          <p>Lütfen önce Repolar sayfasından bir repo seçin</p>
          <button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button>
        </div>
      </div>
    `;
    return;
  }
  
  content.innerHTML = loading();
  const result = await V.listBranches(selectedRepo.owner, selectedRepo.name);
  if (!result.success) return content.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`;
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('branch')} Branch'ler</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)} · ${result.branches.length} branch</p>
        </div>
        <div class="page-actions">
          <button class="btn" onclick="showCompareModal()">${svgIcon('branch')} Karşılaştır</button>
          <button class="btn btn-primary" onclick="showCreateBranchModal()">
            ${svgIcon('plus')} Yeni Branch
          </button>
        </div>
      </div>
      
      <div class="card">
        ${result.branches.map(b => `
          <div class="list-item">
            <div class="list-item-icon">${svgIcon('branch')}</div>
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(b.name)}</div>
              <div class="list-item-subtitle font-mono">${b.commit.sha.substring(0, 7)}</div>
            </div>
            ${b.protected ? '<span class="badge badge-warning">Protected</span>' : ''}
            <div class="list-item-actions">
              <button class="btn btn-sm btn-danger" onclick="deleteBranch('${escapeHtml(b.name)}')" title="Sil">${svgIcon('trash')}</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showCreateBranchModal() {
  openModal('Yeni Branch Oluştur', `
    <div class="input-group">
      <label>Branch Adı</label>
      <input type="text" id="new-branch-name" placeholder="feature/my-feature">
    </div>
    <div class="input-group">
      <label>Kaynak Branch</label>
      <input type="text" id="new-branch-from" placeholder="main" value="main">
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="createBranch()">
      ${svgIcon('plus')} Branch Oluştur
    </button>
  `);
}

async function createBranch() {
  const name = document.getElementById('new-branch-name').value.trim();
  const from = document.getElementById('new-branch-from').value.trim();
  if (!name || !from) return toast('Tüm alanlar gerekli', 'error');
  
  const result = await V.createBranch(selectedRepo.owner, selectedRepo.name, name, from);
  if (result.success) {
    toast(`"${name}" branch'i oluşturuldu`, 'success');
    closeModal();
    renderBranches();
  } else {
    toast('Hata: ' + result.error, 'error');
  }
}

async function deleteBranch(name) {
  if (!confirm(`"${name}" branch'ini silmek istediğinize emin misiniz?`)) return;
  const result = await V.deleteBranch(selectedRepo.owner, selectedRepo.name, name);
  if (result.success) {
    toast(`"${name}" branch'i silindi`, 'success');
    renderBranches();
  } else {
    toast('Hata: ' + result.error, 'error');
  }
}

// ==========================================
// COMMITS
// ==========================================

async function renderCommits() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header"><h1 class="page-title">${svgIcon('commit')} Commit'ler</h1></div>
        <div class="empty-state"><h3>Repo Seçilmedi</h3><p>Lütfen önce bir repo seçin</p><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div>
      </div>`;
    return;
  }
  
  content.innerHTML = loading();
  const result = await V.listCommits(selectedRepo.owner, selectedRepo.name, { per_page: 50 });
  if (!result.success) return content.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`;
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('commit')} Commit Geçmişi</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
      </div>
      <div class="card" style="padding:0;">
        ${result.commits.map(c => `
          <div class="commit-item" onclick="showCommitDetail('${escapeHtml(selectedRepo.owner)}','${escapeHtml(selectedRepo.name)}','${c.sha}')">
            <div class="commit-dot"></div>
            <div class="commit-info">
              <div class="commit-message">${escapeHtml(c.commit.message.split('\n')[0])}</div>
              <div class="commit-meta">
                <span class="commit-sha">${c.sha.substring(0, 7)}</span>
                <span>${escapeHtml(c.commit.author?.name || 'Unknown')}</span>
                <span>${timeAgo(c.commit.author?.date)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function showCommitDetail(owner, repo, sha) {
  const result = await V.getCommit(owner, repo, sha);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  
  const c = result.commit;
  openModal('Commit Detayı', `
    <div>
      <p class="font-bold mb-sm">${escapeHtml(c.commit.message)}</p>
      <p class="text-sm text-muted mb-md">${escapeHtml(c.commit.author?.name || '')} · ${timeAgo(c.commit.author?.date)} · <span class="font-mono">${c.sha.substring(0, 7)}</span></p>
      <p class="text-sm mb-md">${c.stats ? `<span class="text-success">+${c.stats.additions}</span> / <span class="text-danger">-${c.stats.deletions}</span> (${c.files?.length || 0} dosya)` : ''}</p>
      ${(c.files || []).slice(0, 20).map(f => `
        <div class="diff-block">
          <div class="diff-header">${escapeHtml(f.filename)} <span class="text-success">+${f.additions}</span> <span class="text-danger">-${f.deletions}</span></div>
          ${f.patch ? f.patch.split('\n').slice(0, 30).map(line => {
            let cls = '';
            if (line.startsWith('+')) cls = 'diff-add';
            else if (line.startsWith('-')) cls = 'diff-remove';
            else if (line.startsWith('@@')) cls = 'diff-info';
            return `<div class="diff-line ${cls}">${escapeHtml(line)}</div>`;
          }).join('') : '<div class="diff-line text-muted">(Binary file)</div>'}
        </div>
      `).join('')}
    </div>
  `);
}

// ==========================================
// PULL REQUESTS
// ==========================================

async function renderPullRequests() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title">${svgIcon('pr')} Pull Request'ler</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  
  let prState = 'open';
  
  async function loadPRs(state) {
    prState = state;
    const result = await V.listPRs(selectedRepo.owner, selectedRepo.name, state);
    if (!result.success) return;
    
    document.getElementById('pr-list').innerHTML = result.prs.length === 0
      ? '<div class="empty-state"><h3>PR bulunamadı</h3></div>'
      : result.prs.map(pr => `
        <div class="list-item">
          <div class="list-item" onclick="showPRDetail(${pr.number})" style="cursor:pointer;">
          <div class="list-item-icon" style="color: ${pr.state === 'open' ? 'var(--success)' : 'var(--danger)'};">${svgIcon('pr')}</div>
          <div class="list-item-content">
            <div class="list-item-title">${escapeHtml(pr.title)}</div>
            <div class="list-item-subtitle">#${pr.number} · ${escapeHtml(pr.user?.login || '')} · ${escapeHtml(pr.head?.ref || '')} → ${escapeHtml(pr.base?.ref || '')} · ${timeAgo(pr.created_at)}</div>
          </div>
          <span class="badge ${pr.state === 'open' ? 'badge-success' : pr.merged_at ? 'badge-purple' : 'badge-danger'}">${pr.merged_at ? 'Merged' : pr.state}</span>
          ${pr.state === 'open' ? `
            <div class="list-item-actions">
              <button class="btn btn-sm btn-success" onclick="event.stopPropagation();mergePR(${pr.number})" title="Merge">${svgIcon('merge')} Merge</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();closePR(${pr.number})" title="Kapat">${svgIcon('x')}</button>
            </div>
          ` : pr.state === 'closed' && !pr.merged_at ? `
            <button class="btn btn-sm btn-success" onclick="event.stopPropagation();reopenPRAction(${pr.number})">Yeniden Aç</button>
          ` : ''}
        </div>
      `).join('');
  }
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('pr')} Pull Request'ler</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
        <button class="btn btn-primary" onclick="showCreatePRModal()">
          ${svgIcon('plus')} Yeni PR
        </button>
      </div>
      <div class="tabs" id="pr-tabs">
        <button class="tab-btn active" onclick="document.querySelectorAll('#pr-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadPRsGlobal('open')">Açık</button>
        <button class="tab-btn" onclick="document.querySelectorAll('#pr-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadPRsGlobal('closed')">Kapalı</button>
        <button class="tab-btn" onclick="document.querySelectorAll('#pr-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadPRsGlobal('all')">Tümü</button>
      </div>
      <div class="card" style="padding:0;" id="pr-list">${loading()}</div>
    </div>
  `;
  
  window.loadPRsGlobal = loadPRs;
  loadPRs('open');
}

function showCreatePRModal() {
  openModal('Yeni Pull Request', `
    <div class="input-group"><label>Başlık</label><input type="text" id="pr-title" placeholder="Feature: ..."></div>
    <div class="input-group"><label>Açıklama</label><textarea id="pr-body" placeholder="PR açıklaması"></textarea></div>
    <div class="input-group"><label>Head Branch (kaynak)</label><input type="text" id="pr-head" placeholder="feature-branch"></div>
    <div class="input-group"><label>Base Branch (hedef)</label><input type="text" id="pr-base" placeholder="main" value="main"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="createPR()">PR Oluştur</button>
  `);
}

async function createPR() {
  const data = {
    title: document.getElementById('pr-title').value.trim(),
    body: document.getElementById('pr-body').value.trim(),
    head: document.getElementById('pr-head').value.trim(),
    base: document.getElementById('pr-base').value.trim()
  };
  if (!data.title || !data.head || !data.base) return toast('Gerekli alanları doldurun', 'error');
  
  const result = await V.createPR(selectedRepo.owner, selectedRepo.name, data);
  if (result.success) { toast('PR oluşturuldu', 'success'); closeModal(); renderPullRequests(); }
  else toast('Hata: ' + result.error, 'error');
}

async function mergePR(num) {
  if (!confirm('PR merge edilsin mi?')) return;
  const result = await V.mergePR(selectedRepo.owner, selectedRepo.name, num, 'merge');
  if (result.success) { toast('PR merge edildi', 'success'); renderPullRequests(); }
  else toast('Hata: ' + result.error, 'error');
}

async function closePR(num) {
  if (!confirm('PR kapatılsın mı?')) return;
  const result = await V.closePR(selectedRepo.owner, selectedRepo.name, num);
  if (result.success) { toast('PR kapatıldı', 'success'); renderPullRequests(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// ISSUES
// ==========================================

async function renderIssues() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title">${svgIcon('issue')} Issue'lar</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  
  async function loadIssues(state) {
    const result = await V.listIssues(selectedRepo.owner, selectedRepo.name, state);
    if (!result.success) return;
    // Filter out pull requests (they appear as issues too)
    const issues = result.issues.filter(i => !i.pull_request);
    
    document.getElementById('issue-list').innerHTML = issues.length === 0
      ? '<div class="empty-state"><h3>Issue bulunamadı</h3></div>'
      : issues.map(i => `
        <div class="list-item" onclick="showIssueDetail(${i.number})">
          <div class="list-item-icon" style="color: ${i.state === 'open' ? 'var(--success)' : 'var(--danger)'};">${svgIcon('issue')}</div>
          <div class="list-item-content">
            <div class="list-item-title">${escapeHtml(i.title)}</div>
            <div class="list-item-subtitle">#${i.number} · ${escapeHtml(i.user?.login || '')} · ${timeAgo(i.created_at)} ${i.comments > 0 ? `· ${i.comments} yorum` : ''}</div>
          </div>
          <div class="flex-row gap-sm flex-wrap">
            ${(i.labels || []).map(l => `<span class="badge" style="background:${l.color ? '#' + l.color + '30' : 'var(--bg-tertiary)'};color:${l.color ? '#' + l.color : 'var(--text-secondary)'};">${escapeHtml(l.name)}</span>`).join('')}
          </div>
          ${i.state === 'open' ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();closeIssue(${i.number})" title="Kapat">${svgIcon('x')}</button>` : `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();reopenIssue(${i.number})" title="Yeniden Aç">Aç</button>`}
        </div>
      `).join('');
  }
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('issue')} Issue'lar</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
        <div class="page-actions">
          <button class="btn" onclick="showMilestonesModal()">Milestone'lar</button>
          <button class="btn" onclick="showLabelsModal()">Etiketler</button>
          <button class="btn btn-primary" onclick="showCreateIssueModal()">
            ${svgIcon('plus')} Yeni Issue
          </button>
        </div>
      </div>
      <div class="tabs" id="issue-tabs">
        <button class="tab-btn active" onclick="document.querySelectorAll('#issue-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadIssuesGlobal('open')">Açık</button>
        <button class="tab-btn" onclick="document.querySelectorAll('#issue-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadIssuesGlobal('closed')">Kapalı</button>
        <button class="tab-btn" onclick="document.querySelectorAll('#issue-tabs .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');loadIssuesGlobal('all')">Tümü</button>
      </div>
      <div class="card" style="padding:0;" id="issue-list">${loading()}</div>
    </div>
  `;
  
  window.loadIssuesGlobal = loadIssues;
  loadIssues('open');
}

function showCreateIssueModal() {
  openModal('Yeni Issue', `
    <div class="input-group"><label>Başlık</label><input type="text" id="issue-title" placeholder="Bug: ..."></div>
    <div class="input-group"><label>Açıklama</label><textarea id="issue-body" placeholder="Issue açıklaması (Markdown desteklenir)"></textarea></div>
    <div class="input-group"><label>Etiketler (virgülle ayır)</label><input type="text" id="issue-labels" placeholder="bug, enhancement"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="createIssue()">Issue Oluştur</button>
  `);
}

async function createIssue() {
  const title = document.getElementById('issue-title').value.trim();
  if (!title) return toast('Başlık gerekli', 'error');
  
  const labels = document.getElementById('issue-labels').value.split(',').map(l => l.trim()).filter(Boolean);
  
  const result = await V.createIssue(selectedRepo.owner, selectedRepo.name, {
    title,
    body: document.getElementById('issue-body').value.trim(),
    labels
  });
  if (result.success) { toast('Issue oluşturuldu', 'success'); closeModal(); renderIssues(); }
  else toast('Hata: ' + result.error, 'error');
}

async function closeIssue(num) {
  const result = await V.closeIssue(selectedRepo.owner, selectedRepo.name, num);
  if (result.success) { toast('Issue kapatıldı', 'success'); renderIssues(); }
  else toast('Hata: ' + result.error, 'error');
}

async function showIssueDetail(num) {
  const [issueRes, commentsRes] = await Promise.all([
    V.listIssues(selectedRepo.owner, selectedRepo.name, 'all'),
    V.listIssueComments(selectedRepo.owner, selectedRepo.name, num)
  ]);
  
  const issue = issueRes.success ? issueRes.issues.find(i => i.number === num) : null;
  const comments = commentsRes.success ? commentsRes.comments : [];
  
  if (!issue) return toast('Issue bulunamadı', 'error');
  
  openModal(`#${num} ${issue.title}`, `
    <div>
      <div class="flex-row gap-sm mb-md">
        <span class="badge ${issue.state === 'open' ? 'badge-success' : 'badge-danger'}">${issue.state}</span>
        <span class="text-sm text-muted">${escapeHtml(issue.user?.login || '')} · ${timeAgo(issue.created_at)}</span>
      </div>
      <div style="padding:12px;background:var(--bg-tertiary);border-radius:var(--radius);margin-bottom:16px;">
        <p style="white-space:pre-wrap;word-break:break-word;">${escapeHtml(issue.body || 'Açıklama yok')}</p>
      </div>
      <h4 class="mb-sm">Yorumlar (${comments.length})</h4>
      ${comments.map(c => `
        <div style="padding:12px;border:1px solid var(--border-light);border-radius:var(--radius);margin-bottom:8px;">
          <div class="flex-row gap-sm mb-sm">
            <strong>${escapeHtml(c.user?.login || '')}</strong>
            <span class="text-sm text-muted">${timeAgo(c.created_at)}</span>
          </div>
          <p style="white-space:pre-wrap;word-break:break-word;font-size:13px;">${escapeHtml(c.body)}</p>
        </div>
      `).join('')}
      <div class="input-group mt-md">
        <label>Yorum Ekle</label>
        <textarea id="comment-body" placeholder="Yorum yazın..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="addComment(${num})">Yorum Gönder</button>
    </div>
  `);
}

async function addComment(num) {
  const body = document.getElementById('comment-body').value.trim();
  if (!body) return toast('Yorum boş olamaz', 'error');
  const result = await V.commentIssue(selectedRepo.owner, selectedRepo.name, num, body);
  if (result.success) { toast('Yorum eklendi', 'success'); showIssueDetail(num); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// ACTIONS
// ==========================================

async function renderActions() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg> Actions</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  const [wfRes, runsRes] = await Promise.all([
    V.listWorkflows(selectedRepo.owner, selectedRepo.name),
    V.listWorkflowRuns(selectedRepo.owner, selectedRepo.name)
  ]);
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg> GitHub Actions</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Workflow'lar</h3></div>
        ${(wfRes.success ? wfRes.workflows : []).length === 0 ? '<p class="text-muted" style="padding:12px;">Workflow bulunamadı</p>' :
          (wfRes.workflows || []).map(w => `
            <div class="list-item">
              <div class="list-item-icon"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg></div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(w.name)}</div>
                <div class="list-item-subtitle">${escapeHtml(w.path)} · ${w.state}</div>
              </div>
              <span class="badge ${w.state === 'active' ? 'badge-success' : 'badge-warning'}">${w.state}</span>
            </div>
          `).join('')}
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Son Çalışmalar</h3></div>
        ${(runsRes.success ? runsRes.runs : []).length === 0 ? '<p class="text-muted" style="padding:12px;">Çalışma bulunamadı</p>' :
          (runsRes.runs || []).map(r => `
            <div class="list-item">
              <div class="list-item-icon" style="color:${r.conclusion === 'success' ? 'var(--success)' : r.conclusion === 'failure' ? 'var(--danger)' : 'var(--warning)'};">
                ${r.conclusion === 'success' ? svgIcon('check') : r.conclusion === 'failure' ? svgIcon('x') : svgIcon('clock')}
              </div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(r.name)}</div>
                <div class="list-item-subtitle">${escapeHtml(r.head_branch || '')} · ${escapeHtml(r.event)} · ${timeAgo(r.created_at)}</div>
              </div>
              <span class="badge ${r.conclusion === 'success' ? 'badge-success' : r.conclusion === 'failure' ? 'badge-danger' : 'badge-warning'}">${r.conclusion || r.status}</span>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// RELEASES
// ==========================================

async function renderReleases() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title">Release'ler</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  const [relRes, tagRes] = await Promise.all([
    V.listReleases(selectedRepo.owner, selectedRepo.name),
    V.listTags(selectedRepo.owner, selectedRepo.name)
  ]);
  
  const releases = relRes.success ? relRes.releases : [];
  const tags = tagRes.success ? tagRes.tags : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="none" stroke="currentColor" stroke-width="2"/></svg> Release'ler & Tag'lar</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
        <button class="btn btn-primary" onclick="showCreateReleaseModal()">
          ${svgIcon('plus')} Yeni Release
        </button>
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Release'ler (${releases.length})</h3></div>
        ${releases.length === 0 ? '<p class="text-muted" style="padding:12px;">Release bulunamadı</p>' :
          releases.map(r => `
            <div class="list-item">
              <div class="list-item-icon" style="color:var(--success);">${svgIcon('download')}</div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(r.name || r.tag_name)}</div>
                <div class="list-item-subtitle">${escapeHtml(r.tag_name)} · ${escapeHtml(r.author?.login || '')} · ${timeAgo(r.published_at || r.created_at)}</div>
              </div>
              <div class="flex-row gap-sm">
                ${r.draft ? '<span class="badge badge-warning">Draft</span>' : ''}
                ${r.prerelease ? '<span class="badge badge-info">Pre-release</span>' : '<span class="badge badge-success">Latest</span>'}
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteRelease(${r.id})" title="Sil">${svgIcon('trash')}</button>
              </div>
            </div>
          `).join('')}
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Tag'lar (${tags.length})</h3></div>
        ${tags.length === 0 ? '<p class="text-muted" style="padding:12px;">Tag bulunamadı</p>' :
          tags.map(t => `
            <div class="list-item">
              <div class="list-item-icon"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg></div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(t.name)}</div>
                <div class="list-item-subtitle font-mono">${t.commit.sha.substring(0, 7)}</div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function showCreateReleaseModal() {
  openModal('Yeni Release', `
    <div class="input-group"><label>Tag</label><input type="text" id="release-tag" placeholder="v1.0.0"></div>
    <div class="input-group"><label>Başlık</label><input type="text" id="release-name" placeholder="Release v1.0.0"></div>
    <div class="input-group"><label>Açıklama</label><textarea id="release-body" placeholder="Release notları (Markdown)"></textarea></div>
    <div class="checkbox-group"><input type="checkbox" id="release-draft"><label for="release-draft">Draft</label></div>
    <div class="checkbox-group"><input type="checkbox" id="release-pre"><label for="release-pre">Pre-release</label></div>
    <button class="btn btn-primary btn-block mt-md" onclick="createRelease()">Release Oluştur</button>
  `);
}

async function createRelease() {
  const tag = document.getElementById('release-tag').value.trim();
  if (!tag) return toast('Tag gerekli', 'error');
  
  const result = await V.createRelease(selectedRepo.owner, selectedRepo.name, {
    tag_name: tag,
    name: document.getElementById('release-name').value.trim(),
    body: document.getElementById('release-body').value.trim(),
    draft: document.getElementById('release-draft').checked,
    prerelease: document.getElementById('release-pre').checked
  });
  if (result.success) { toast('Release oluşturuldu', 'success'); closeModal(); renderReleases(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// GISTS
// ==========================================

async function renderGists() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listGists();
  const gists = result.success ? result.gists : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg> Gist'ler</h1>
          <p class="page-subtitle">${gists.length} gist</p>
        </div>
        <button class="btn btn-primary" onclick="showCreateGistModal()">
          ${svgIcon('plus')} Yeni Gist
        </button>
      </div>
      
      <div class="card" style="padding:0;">
        ${gists.length === 0 ? '<div class="empty-state"><h3>Gist bulunamadı</h3></div>' :
          gists.map(g => {
            const files = Object.keys(g.files);
            return `
              <div class="list-item" onclick="showGistDetail('${g.id}')" style="cursor:pointer;">
                <div class="list-item-icon">${svgIcon('file')}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${escapeHtml(g.description || files[0])}</div>
                  <div class="list-item-subtitle">${files.length} dosya · ${g.public ? 'Public' : 'Secret'} · ${timeAgo(g.updated_at)}</div>
                </div>
                <span class="badge ${g.public ? 'badge-success' : 'badge-warning'}">${g.public ? 'Public' : 'Secret'}</span>
                <button class="btn btn-sm" onclick="event.stopPropagation();doForkGist('${g.id}')" title="Fork">${svgIcon('fork')}</button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteGist('${g.id}')" title="Sil">${svgIcon('trash')}</button>
              </div>
            `;
          }).join('')}
      </div>
    </div>
  `;
}

function showCreateGistModal() {
  openModal('Yeni Gist', `
    <div class="input-group"><label>Açıklama</label><input type="text" id="gist-desc" placeholder="Gist açıklaması"></div>
    <div class="input-group"><label>Dosya Adı</label><input type="text" id="gist-filename" placeholder="example.js"></div>
    <div class="input-group"><label>İçerik</label><textarea id="gist-content" style="min-height:150px;font-family:var(--font-mono)" placeholder="// Code here"></textarea></div>
    <div class="checkbox-group"><input type="checkbox" id="gist-public"><label for="gist-public">Public</label></div>
    <button class="btn btn-primary btn-block mt-md" onclick="createGist()">Gist Oluştur</button>
  `);
}

async function createGist() {
  const filename = document.getElementById('gist-filename').value.trim();
  const gistContent = document.getElementById('gist-content').value;
  if (!filename || !gistContent) return toast('Dosya adı ve içerik gerekli', 'error');
  
  const files = {};
  files[filename] = { content: gistContent };
  
  const result = await V.createGist({
    description: document.getElementById('gist-desc').value.trim(),
    public: document.getElementById('gist-public').checked,
    files
  });
  if (result.success) { toast('Gist oluşturuldu', 'success'); closeModal(); renderGists(); }
  else toast('Hata: ' + result.error, 'error');
}

async function deleteGist(id) {
  if (!confirm('Gist silinsin mi?')) return;
  const result = await V.deleteGist(id);
  if (result.success) { toast('Gist silindi', 'success'); renderGists(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// STARS
// ==========================================

async function renderStars() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listStarred();
  const repos = result.success ? result.repos : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="currentColor" opacity="0.8"/></svg> Yıldızlı Repolar</h1>
        <p class="page-subtitle">${repos.length} yıldızlı repo</p>
      </div>
      <div class="repo-grid">
        ${repos.map(r => repoCardHtml(r)).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function renderNotifications() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listNotifications();
  const notifs = result.success ? result.notifications : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" stroke-width="2"/></svg> Bildirimler</h1>
        <p class="page-subtitle">${notifs.length} bildirim</p>
      </div>
      ${notifs.length > 0 ? `<button class="btn mb-md" onclick="markAllNotifsRead()">${svgIcon('check')} Tümünü Okundu Yap</button>` : ''}
      <div class="card" style="padding:0;">
        ${notifs.length === 0 ? '<div class="empty-state"><h3>Yeni bildirim yok</h3><p>Tüm bildirimler okunmuş!</p></div>' :
          notifs.map(n => `
            <div class="notification-item">
              <div class="notification-dot"></div>
              <div class="notification-content">
                <div class="notification-title">${escapeHtml(n.subject.title)}</div>
                <div class="notification-repo">${escapeHtml(n.repository.full_name)}</div>
                <div class="notification-time">${escapeHtml(n.subject.type)} · ${timeAgo(n.updated_at)}</div>
              </div>
              <button class="btn btn-sm" onclick="markNotifRead('${n.id}')" title="Okundu işaretle">${svgIcon('check')}</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

async function markNotifRead(id) {
  const result = await V.markNotificationRead(id);
  if (result.success) { toast('Bildirim okundu', 'success'); renderNotifications(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// SEARCH
// ==========================================

async function renderSearch() {
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> GitHub Arama</h1>
      </div>
      
      <div class="search-bar">
        <input type="search" id="global-search" placeholder="Repo, kullanıcı, kod veya issue ara..." onkeydown="if(event.key==='Enter')doGlobalSearch()">
        <select id="search-type">
          <option value="repos">Repolar</option>
          <option value="users">Kullanıcılar</option>
          <option value="code">Kod</option>
          <option value="issues">Issue & PR</option>
        </select>
        <button class="btn btn-primary" onclick="doGlobalSearch()">Ara</button>
      </div>
      
      <div id="search-results"></div>
    </div>
  `;
}

// doGlobalSearch is defined below with expanded search types

// ==========================================
// LOCAL REPO (Enhanced - 30+ Operations)
// ==========================================

let localRepoTab = 'overview';
let localTabRenderId = 0; // re-entrancy guard for tab rendering
let editorCurrentFile = null;
let editorFileTree = [];

async function renderLocalRepo() {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg> Yerel Git İşlemleri</h1>
          <p class="page-subtitle" id="local-path">${localRepoPath ? escapeHtml(localRepoPath) : 'Henüz bir klasör seçilmedi'}</p>
        </div>
        <div class="page-actions">
          <button class="btn" onclick="selectLocalDir()">${svgIcon('folder')} Klasör Aç</button>
          <button class="btn btn-primary" onclick="showCloneModal()">${svgIcon('download')} Clone</button>
          <button class="btn" onclick="showInitModal()">${svgIcon('plus')} Git Init</button>
        </div>
      </div>

      ${localRepoPath ? `
        <div class="local-tabs" id="local-tabs">
          <button class="local-tab ${localRepoTab === 'overview' ? 'active' : ''}" onclick="switchLocalTab('overview')">📊 Genel Bakış</button>
          <button class="local-tab ${localRepoTab === 'changes' ? 'active' : ''}" onclick="switchLocalTab('changes')">📝 Değişiklikler</button>
          <button class="local-tab ${localRepoTab === 'history' ? 'active' : ''}" onclick="switchLocalTab('history')">📜 Geçmiş</button>
          <button class="local-tab ${localRepoTab === 'branches' ? 'active' : ''}" onclick="switchLocalTab('branches')">🔀 Branch</button>
          <button class="local-tab ${localRepoTab === 'remotes' ? 'active' : ''}" onclick="switchLocalTab('remotes')">🌐 Remote</button>
          <button class="local-tab ${localRepoTab === 'tags' ? 'active' : ''}" onclick="switchLocalTab('tags')">🏷️ Tag</button>
          <button class="local-tab ${localRepoTab === 'stash' ? 'active' : ''}" onclick="switchLocalTab('stash')">📦 Stash</button>
          <button class="local-tab ${localRepoTab === 'config' ? 'active' : ''}" onclick="switchLocalTab('config')">⚙️ Config</button>
          <button class="local-tab ${localRepoTab === 'editor' ? 'active' : ''}" onclick="switchLocalTab('editor')">✏️ Editör</button>
          <button class="local-tab ${localRepoTab === 'files' ? 'active' : ''}" onclick="switchLocalTab('files')">📁 Dosyalar</button>
          <button class="local-tab ${localRepoTab === 'terminal' ? 'active' : ''}" onclick="switchLocalTab('terminal')">💻 Terminal</button>
        </div>
        <div id="local-tab-content">${loading()}</div>
      ` : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <h3>Yerel Repo Seçin</h3>
          <p>Bir klasör seçin, yeni bir repo clone edin veya git init yapın</p>
          <div class="flex-row gap-md mt-md" style="justify-content:center;">
            <button class="btn btn-primary" onclick="selectLocalDir()">${svgIcon('folder')} Klasör Aç</button>
            <button class="btn" onclick="showCloneModal()">${svgIcon('download')} Clone</button>
            <button class="btn" onclick="showInitModal()">${svgIcon('plus')} Git Init</button>
          </div>
        </div>
        ${recentLocalPaths.length > 0 ? `
          <div class="card mt-lg">
            <div class="card-header"><h3 class="card-title">📂 Son Açılan Repolar</h3></div>
            ${recentLocalPaths.map(p => `
              <div class="list-item" onclick="localRepoPath='${escapeJsStr(p)}';localRepoTab='overview';saveRecentPath('${escapeJsStr(p)}');renderLocalRepo();updateStatusBarBranch();" style="cursor:pointer;">
                <div class="list-item-icon">${svgIcon('folder')}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${escapeHtml(p.split(/[\\/]/).pop())}</div>
                  <div class="list-item-subtitle font-mono">${escapeHtml(p)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `}
    </div>
  `;

  if (localRepoPath) {
    renderLocalTabContent();
  }
}

function switchLocalTab(tab) {
  localRepoTab = tab;
  localTabRenderId++;
  document.querySelectorAll('.local-tab').forEach(b => b.classList.remove('active'));
  const tabIndex = ['overview','changes','history','branches','remotes','tags','stash','config','editor','files','terminal'].indexOf(tab);
  const allTabs = document.querySelectorAll('#local-tabs .local-tab');
  if (allTabs[tabIndex]) allTabs[tabIndex].classList.add('active');
  const tabContent = document.getElementById('local-tab-content');
  if (tabContent) tabContent.innerHTML = loading();
  renderLocalTabContent();
}

async function renderLocalTabContent() {
  const myRenderId = ++localTabRenderId;
  const tabs = {
    overview: renderLocalOverview,
    changes: renderLocalChanges,
    history: renderLocalHistory,
    branches: renderLocalBranches,
    remotes: renderLocalRemotes,
    tags: renderLocalTags,
    stash: renderLocalStash,
    config: renderLocalConfig,
    editor: renderLocalEditor,
    files: renderLocalFiles,
    terminal: renderLocalTerminal,
  };
  const fn = tabs[localRepoTab];
  if (!fn) return;
  try {
    await fn();
  } catch (err) {
    if (myRenderId !== localTabRenderId) return;
    const div = document.getElementById('local-tab-content');
    if (div) div.innerHTML = `<div class="card" style="padding:20px;"><p class="text-danger">Sekme yüklenirken hata oluştu: ${escapeHtml(err.message || String(err))}</p><button class="btn mt-md" onclick="renderLocalTabContent()">Tekrar Dene</button></div>`;
  }
}

async function selectLocalDir() {
  const result = await V.selectDirectory();
  if (result.success && result.path) {
    localRepoPath = result.path;
    localRepoTab = 'overview';
    saveRecentPath(result.path);
    renderLocalRepo();
    updateStatusBarBranch();
  }
}

function showCloneModal() {
  openModal('Repo Clone', `
    <div class="input-group"><label>Repo URL</label><input type="url" id="clone-url" placeholder="https://github.com/user/repo.git"></div>
    <div class="input-group">
      <label>Hedef Klasör</label>
      <div class="flex-row"><input type="text" id="clone-path" placeholder="C:\\Projects\\myrepo" readonly><button class="btn" onclick="selectClonePath()">Seç</button></div>
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="doClone()">Clone</button>
  `);
}

async function selectClonePath() {
  const result = await V.selectDirectory();
  if (result.success) document.getElementById('clone-path').value = result.path;
}

async function doClone() {
  const url = document.getElementById('clone-url').value.trim();
  const clonePath = document.getElementById('clone-path').value.trim();
  if (!url || !clonePath) return toast('Tüm alanları doldurun', 'error');
  toast('Clone başlatılıyor...', 'info');
  const result = await V.gitClone(url, clonePath);
  if (result.success) {
    localRepoPath = clonePath;
    toast('Clone tamamlandı!', 'success');
    closeModal();
    renderLocalRepo();
  } else {
    toast('Hata: ' + result.error, 'error');
  }
}

function showInitModal() {
  openModal('Git Init', `
    <div class="input-group">
      <label>Klasör</label>
      <div class="flex-row"><input type="text" id="init-path" placeholder="C:\\Projects\\newrepo" readonly><button class="btn" onclick="selectInitPath()">Seç</button></div>
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="doInit()">Git Init</button>
  `);
}

async function selectInitPath() {
  const result = await V.selectDirectory();
  if (result.success) document.getElementById('init-path').value = result.path;
}

async function doInit() {
  const initPath = document.getElementById('init-path').value.trim();
  if (!initPath) return toast('Klasör seçin', 'error');
  const result = await V.gitInit(initPath);
  if (result.success) {
    localRepoPath = initPath;
    toast('Git init tamamlandı!', 'success');
    closeModal();
    renderLocalRepo();
  } else {
    toast('Hata: ' + result.error, 'error');
  }
}

// ---------- OVERVIEW TAB ----------

async function renderLocalOverview() {
  const div = document.getElementById('local-tab-content');
  if (!div) return;
  div.innerHTML = loading();

  let statusRes, logRes, branchRes, remoteRes, tagRes;
  try {
    [statusRes, logRes, branchRes, remoteRes, tagRes] = await Promise.all([
      V.gitStatus(localRepoPath),
      V.gitLog(localRepoPath, 5),
      V.gitBranchLocal(localRepoPath),
      V.gitRemoteList(localRepoPath),
      V.gitTagList(localRepoPath)
    ]);
  } catch (err) {
    div.innerHTML = `<div class="card" style="padding:20px;"><p class="text-danger">Veri yüklenirken hata: ${escapeHtml(err.message)}</p><button class="btn mt-md" onclick="renderLocalOverview()">Tekrar Dene</button></div>`;
    return;
  }

  const status = statusRes.success ? statusRes.status : null;
  const log = logRes.success ? logRes.log : null;
  const branches = branchRes.success ? branchRes.branches : null;
  const remotes = remoteRes.success ? remoteRes.remotes : [];
  const tags = tagRes.success ? tagRes.tags : { all: [] };

  if (!status && !log) {
    div.innerHTML = `<div class="card" style="padding:20px;"><p class="text-danger">Bu klasör bir Git reposu değil veya erişilemiyor.</p><p class="text-muted mt-sm">Git init yapmak ister misiniz?</p><button class="btn btn-primary mt-md" onclick="doInitHere()">Git Init Yap</button></div>`;
    return;
  }

  const isClean = (status?.staged?.length || 0) === 0 && (status?.modified?.length || 0) === 0 && (status?.not_added?.length || 0) === 0;

  div.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" onclick="switchLocalTab('branches')" style="cursor:pointer;">
        <div class="stat-icon blue">${svgIcon('branch')}</div>
        <div class="stat-info">
          <div class="stat-number">${branches?.all?.length || 0}</div>
          <div class="stat-label">Branch (${escapeHtml(branches?.current || '-')})</div>
        </div>
      </div>
      <div class="stat-card" onclick="switchLocalTab('changes')" style="cursor:pointer;">
        <div class="stat-icon green">${svgIcon('check')}</div>
        <div class="stat-info">
          <div class="stat-number">${status?.staged?.length || 0}</div>
          <div class="stat-label">Staged</div>
        </div>
      </div>
      <div class="stat-card" onclick="switchLocalTab('changes')" style="cursor:pointer;">
        <div class="stat-icon orange">${svgIcon('file')}</div>
        <div class="stat-info">
          <div class="stat-number">${status?.modified?.length || 0}</div>
          <div class="stat-label">Değişen</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">${svgIcon('plus')}</div>
        <div class="stat-info">
          <div class="stat-number">${status?.not_added?.length || 0}</div>
          <div class="stat-label">Untracked</div>
        </div>
      </div>
      <div class="stat-card" onclick="switchLocalTab('remotes')" style="cursor:pointer;">
        <div class="stat-icon purple">${svgIcon('link')}</div>
        <div class="stat-info">
          <div class="stat-number">${remotes.length}</div>
          <div class="stat-label">Remote</div>
        </div>
      </div>
      <div class="stat-card" onclick="switchLocalTab('tags')" style="cursor:pointer;">
        <div class="stat-icon yellow"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg></div>
        <div class="stat-info">
          <div class="stat-number">${tags.all?.length || 0}</div>
          <div class="stat-label">Tag</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">${svgIcon('commit')} Hızlı İşlemler</h3></div>
      <div class="local-quick-actions">
        <button class="btn btn-success" onclick="doGitAddAll()">${svgIcon('plus')} Tümünü Stage</button>
        <button class="btn btn-primary" onclick="showCommitModal()">${svgIcon('commit')} Commit</button>
        <button class="btn btn-info" onclick="showPushModal()">${svgIcon('link')} Push</button>
        <button class="btn btn-warning" onclick="showQuickCommitPush()">⚡ Hızlı Commit+Push</button>
        <button class="btn" onclick="showPullModal()">${svgIcon('download')} Pull</button>
        <button class="btn" onclick="doGitFetch()">${svgIcon('refresh')} Fetch</button>
        <button class="btn" onclick="doGitFetchAll()">🔄 Fetch All</button>
        <button class="btn" onclick="showNamedStashModal()">📦 Stash</button>
        <button class="btn" onclick="doGitStashPop()">📤 Stash Pop</button>
        <button class="btn" onclick="showDiffModal()">🔍 Diff</button>
        <button class="btn" onclick="showStagedDiffModal()">📋 Staged Diff</button>
        <button class="btn btn-warning" onclick="doGitReset('soft')">↩️ Reset Soft</button>
        <button class="btn btn-warning" onclick="doGitReset('mixed')">↩️ Reset Mixed</button>
        <button class="btn btn-danger" onclick="doGitReset('hard')">⚠️ Reset Hard</button>
        <button class="btn btn-danger" onclick="doGitClean()">🧹 Clean</button>
        <button class="btn" onclick="showDiffStat()">📊 Diff Stat</button>
        <button class="btn" onclick="showFileSearchModal()">🔎 Dosya Ara</button>
        <button class="btn" onclick="showLogSearchModal()">📜 Commit Ara</button>
        <button class="btn" onclick="showBlameModal()">👤 Blame</button>
        <button class="btn" onclick="showCreateDirModal()">📁 Klasör Oluştur</button>
        <button class="btn" onclick="toggleAutoRefresh()">🔄 Oto-Yenile</button>
        <button class="btn" onclick="renderLocalRepo()">${svgIcon('refresh')} Yenile</button>
      </div>
    </div>

    ${isClean ? `
      <div class="card" style="text-align:center;padding:20px;">
        <div style="color:var(--success);margin-bottom:8px;">${svgIcon('check')}</div>
        <p style="color:var(--success);font-weight:600;">Temiz çalışma dizini</p>
        <p class="text-muted text-sm">Commit edilecek veya stage edilecek değişiklik yok.</p>
      </div>
    ` : `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Değişen Dosyalar (Özet)</h3>
          <button class="btn btn-sm" onclick="switchLocalTab('changes')">Detaylı Gör</button>
        </div>
        ${[...(status.staged || []).map(f => `<div class="file-item"><span class="file-icon file" style="color:var(--success)">${svgIcon('check')}</span><span class="file-name">${escapeHtml(f)}</span><span class="badge badge-success">staged</span></div>`),
           ...(status.modified || []).map(f => `<div class="file-item"><span class="file-icon file" style="color:var(--warning)">${svgIcon('file')}</span><span class="file-name">${escapeHtml(f)}</span><span class="badge badge-warning">modified</span></div>`),
           ...(status.not_added || []).map(f => `<div class="file-item"><span class="file-icon file" style="color:var(--danger)">${svgIcon('plus')}</span><span class="file-name">${escapeHtml(f)}</span><span class="badge badge-danger">untracked</span></div>`)
          ].join('')}
      </div>
    `}

    ${log && log.all && log.all.length > 0 ? `
      <div class="card" style="padding:0;">
        <div class="card-header" style="padding:16px;"><h3 class="card-title">${svgIcon('commit')} Son Commit'ler</h3>
          <button class="btn btn-sm" onclick="switchLocalTab('history')">Tümünü Gör</button>
        </div>
        ${log.all.slice(0, 5).map(c => `
          <div class="commit-item" onclick="showLocalCommitDetail('${escapeHtml(c.hash)}')">
            <div class="commit-dot"></div>
            <div class="commit-info">
              <div class="commit-message">${escapeHtml(c.message.split('\n')[0])}</div>
              <div class="commit-meta">
                <span class="commit-sha">${c.hash.substring(0, 7)}</span>
                <span>${escapeHtml(c.author_name)}</span>
                <span>${timeAgo(c.date)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

async function doInitHere() {
  const result = await V.gitInit(localRepoPath);
  if (result.success) { toast('Git init tamamlandı!', 'success'); renderLocalRepo(); }
  else toast('Hata: ' + result.error, 'error');
}

// ---------- CHANGES TAB ----------

async function renderLocalChanges() {
  const div = document.getElementById('local-tab-content');
  if (!div) return;
  div.innerHTML = loading();

  let statusRes;
  try {
    statusRes = await V.gitStatus(localRepoPath);
  } catch (err) {
    div.innerHTML = `<div class="card" style="padding:20px;"><p class="text-danger">Durum yüklenirken hata: ${escapeHtml(err.message)}</p><button class="btn mt-md" onclick="renderLocalChanges()">Tekrar Dene</button></div>`;
    return;
  }
  if (!statusRes.success) { div.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(statusRes.error)}</p>`; return; }
  const s = statusRes.status;
  const staged = s.staged || [];
  const modified = s.modified || [];
  const notAdded = s.not_added || [];
  const deleted = s.deleted || [];
  const conflicted = s.conflicted || [];

  div.innerHTML = `
    <div class="flex-row gap-md mb-md flex-wrap">
      <button class="btn btn-success" onclick="doGitAddAll()">${svgIcon('plus')} Tümünü Stage</button>
      <button class="btn btn-primary" onclick="showCommitModal()">${svgIcon('commit')} Commit</button>
      <button class="btn btn-info" onclick="showPushModal()">${svgIcon('link')} Push</button>
      <button class="btn btn-warning" onclick="showQuickCommitPush()">⚡ Hızlı Commit+Push</button>
      <button class="btn" onclick="showAmendModal()">✏️ Amend</button>
      <button class="btn" onclick="showDiffModal()">🔍 Working Diff</button>
      <button class="btn" onclick="showStagedDiffModal()">📋 Staged Diff</button>
      <button class="btn" onclick="renderLocalChanges()">${svgIcon('refresh')} Yenile</button>
    </div>

    ${conflicted.length > 0 ? `
      <div class="card">
        <div class="card-header"><h3 class="card-title" style="color:var(--danger);">⚠️ Çakışan Dosyalar (${conflicted.length})</h3></div>
        ${conflicted.map(f => `
          <div class="file-item">
            <span class="file-icon file" style="color:var(--danger);">${svgIcon('x')}</span>
            <span class="file-name">${escapeHtml(f)}</span>
            <span class="badge badge-danger">conflict</span>
            <button class="btn btn-sm" onclick="openFileInEditorFromChanges('${escapeJsStr(f)}')">✏️ Düzenle</button>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title" style="color:var(--success);">${svgIcon('check')} Staged Dosyalar (${staged.length})</h3>
        ${staged.length > 0 ? `<button class="btn btn-sm btn-danger" onclick="doUnstageAll()">Tümünü Unstage</button>` : ''}
      </div>
      ${staged.length === 0 ? '<p class="text-muted text-sm" style="padding:8px 12px;">Stage edilmiş dosya yok</p>' :
        staged.map(f => `
          <div class="file-item">
            <span class="file-icon file" style="color:var(--success);">${svgIcon('check')}</span>
            <span class="file-name">${escapeHtml(f)}</span>
            <span class="badge badge-success">staged</span>
            <div class="list-item-actions">
              <button class="btn btn-sm" onclick="doUnstageFile('${escapeJsStr(f)}')" title="Unstage">↩️</button>
              <button class="btn btn-sm" onclick="showFileDiffModal('${escapeJsStr(f)}')" title="Diff">🔍</button>
            </div>
          </div>
        `).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title" style="color:var(--warning);">${svgIcon('file')} Değişen Dosyalar (${modified.length})</h3>
        ${modified.length > 0 ? `<button class="btn btn-sm btn-success" onclick="doStageFiles(${JSON.stringify(modified).replace(/"/g, '&quot;')})">Tümünü Stage</button>` : ''}
      </div>
      ${modified.length === 0 ? '<p class="text-muted text-sm" style="padding:8px 12px;">Değişen dosya yok</p>' :
        modified.map(f => `
          <div class="file-item">
            <span class="file-icon file" style="color:var(--warning);">${svgIcon('file')}</span>
            <span class="file-name">${escapeHtml(f)}</span>
            <span class="badge badge-warning">modified</span>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-success" onclick="doStageFile('${escapeJsStr(f)}')" title="Stage">${svgIcon('plus')}</button>
              <button class="btn btn-sm" onclick="showFileDiffModal('${escapeJsStr(f)}')" title="Diff">🔍</button>
              <button class="btn btn-sm" onclick="showFileHistoryModal('${escapeJsStr(f)}')" title="Geçmiş">📜</button>
              <button class="btn btn-sm" onclick="showRenameFileModal('${escapeJsStr(f)}')" title="Yeniden Adlandır">✏️</button>
              <button class="btn btn-sm" onclick="openFileInEditorFromChanges('${escapeJsStr(f)}')" title="Düzenle">📝</button>
            </div>
          </div>
        `).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title" style="color:var(--danger);">${svgIcon('plus')} Untracked Dosyalar (${notAdded.length})</h3>
        ${notAdded.length > 0 ? `<button class="btn btn-sm btn-success" onclick="doStageFiles(${JSON.stringify(notAdded).replace(/"/g, '&quot;')})">Tümünü Stage</button>` : ''}
      </div>
      ${notAdded.length === 0 ? '<p class="text-muted text-sm" style="padding:8px 12px;">Untracked dosya yok</p>' :
        notAdded.map(f => `
          <div class="file-item">
            <span class="file-icon file" style="color:var(--danger);">${svgIcon('plus')}</span>
            <span class="file-name">${escapeHtml(f)}</span>
            <span class="badge badge-danger">untracked</span>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-success" onclick="doStageFile('${escapeJsStr(f)}')" title="Stage">${svgIcon('plus')}</button>
              <button class="btn btn-sm" onclick="openFileInEditorFromChanges('${escapeJsStr(f)}')" title="Düzenle">✏️</button>
            </div>
          </div>
        `).join('')}
    </div>

    ${deleted.length > 0 ? `
      <div class="card">
        <div class="card-header"><h3 class="card-title" style="color:var(--danger);">${svgIcon('trash')} Silinen Dosyalar (${deleted.length})</h3></div>
        ${deleted.map(f => `
          <div class="file-item">
            <span class="file-icon file" style="color:var(--danger);">${svgIcon('trash')}</span>
            <span class="file-name">${escapeHtml(f)}</span>
            <span class="badge badge-danger">deleted</span>
            <button class="btn btn-sm btn-success" onclick="doStageFile('${escapeJsStr(f)}')" title="Stage">${svgIcon('plus')}</button>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function escapeJsStr(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

async function doGitAddAll() {
  const result = await V.gitAdd(localRepoPath, '.');
  if (result.success) { toast('Tüm dosyalar staged', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doStageFile(file) {
  const result = await V.gitAddFile(localRepoPath, file);
  if (result.success) { toast(`"${file}" staged`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doStageFiles(files) {
  const result = await V.gitAdd(localRepoPath, files);
  if (result.success) { toast(`${files.length} dosya staged`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doUnstageFile(file) {
  const result = await V.gitUnstage(localRepoPath, [file]);
  if (result.success) { toast(`"${file}" unstaged`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doUnstageAll() {
  const statusRes = await V.gitStatus(localRepoPath);
  if (statusRes.success && statusRes.status.staged) {
    const result = await V.gitUnstage(localRepoPath, statusRes.status.staged);
    if (result.success) { toast('Tüm dosyalar unstaged', 'success'); refreshLocalTab(); }
    else toast('Hata: ' + result.error, 'error');
  }
}

function showCommitModal() {
  openModal('Commit', `
    <div class="input-group">
      <label>Şablon</label>
      <select onchange="document.getElementById('commit-msg').value=this.value;document.getElementById('commit-msg').focus();">
        <option value="">Şablon seç...</option>
        <option value="feat: ">feat: Yeni özellik</option>
        <option value="fix: ">fix: Hata düzeltme</option>
        <option value="docs: ">docs: Dokümantasyon</option>
        <option value="style: ">style: Stil</option>
        <option value="refactor: ">refactor: Yeniden yapılandırma</option>
        <option value="perf: ">perf: Performans</option>
        <option value="test: ">test: Test</option>
        <option value="chore: ">chore: Diğer</option>
      </select>
    </div>
    <div class="input-group"><label>Commit Mesajı</label><textarea id="commit-msg" placeholder="feat: açıklayıcı bir commit mesajı yazın" style="min-height:100px;"></textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doGitCommit()">Commit</button>
  `);
}

async function doGitCommit() {
  const msg = document.getElementById('commit-msg').value.trim();
  if (!msg) return toast('Commit mesajı gerekli', 'error');
  const result = await V.gitCommit(localRepoPath, msg);
  if (result.success) { toast('Commit yapıldı', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showAmendModal() {
  openModal('Commit Amend', `
    <p class="text-muted text-sm mb-md">Son commit'i düzenleyin. Mesaj boş bırakılırsa mevcut mesaj korunur.</p>
    <div class="input-group"><label>Yeni Commit Mesajı (opsiyonel)</label><textarea id="amend-msg" placeholder="Boş bırakılırsa mevcut mesaj korunur"></textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doAmendCommit()">Amend</button>
  `);
}

async function doAmendCommit() {
  const msg = document.getElementById('amend-msg').value.trim();
  const result = await V.gitCommitAmend(localRepoPath, msg || undefined);
  if (result.success) { toast('Commit amend edildi', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showPushModal() {
  openModal('Push', `
    <div class="input-group"><label>Remote</label><input type="text" id="push-remote" value="origin" placeholder="origin"></div>
    <div class="input-group"><label>Branch (boş bırakılırsa mevcut branch)</label><input type="text" id="push-branch" placeholder="main"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doGitPush()">Push</button>
  `);
}

async function doGitPush() {
  const remote = document.getElementById('push-remote')?.value?.trim() || 'origin';
  const branch = document.getElementById('push-branch')?.value?.trim() || undefined;
  closeModal();
  toast('Push yapılıyor...', 'info');
  const result = await V.gitPush(localRepoPath, remote, branch);
  if (result.success) toast('Push tamamlandı', 'success');
  else toast('Hata: ' + result.error, 'error');
}

function showPullModal() {
  openModal('Pull', `
    <div class="input-group"><label>Remote</label><input type="text" id="pull-remote" value="origin" placeholder="origin"></div>
    <div class="input-group"><label>Branch (boş bırakılırsa mevcut branch)</label><input type="text" id="pull-branch" placeholder="main"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doGitPull()">Pull</button>
  `);
}

async function doGitPull() {
  const remote = document.getElementById('pull-remote')?.value?.trim() || 'origin';
  const branch = document.getElementById('pull-branch')?.value?.trim() || undefined;
  closeModal();
  toast('Pull yapılıyor...', 'info');
  const result = await V.gitPull(localRepoPath, remote, branch);
  if (result.success) { toast('Pull tamamlandı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doGitFetch() {
  toast('Fetch yapılıyor...', 'info');
  const result = await V.gitFetch(localRepoPath);
  if (result.success) toast('Fetch tamamlandı', 'success');
  else toast('Hata: ' + result.error, 'error');
}

async function doGitStash() {
  const result = await V.gitStash(localRepoPath);
  if (result.success) { toast('Stash yapıldı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doGitStashPop() {
  const result = await V.gitStashPop(localRepoPath);
  if (result.success) { toast('Stash pop yapıldı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showDiffModal() {
  V.gitDiff(localRepoPath).then(result => {
    if (!result.success) return toast('Hata: ' + result.error, 'error');
    openModal('Working Directory Diff', `
      <div class="diff-block" style="max-height:60vh;overflow:auto;">
        ${result.diff ? result.diff.split('\n').slice(0, 500).map(line => {
          let cls = '';
          if (line.startsWith('+')) cls = 'diff-add';
          else if (line.startsWith('-')) cls = 'diff-remove';
          else if (line.startsWith('@@')) cls = 'diff-info';
          return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
        }).join('') : '<p class="text-muted" style="padding:12px;">Değişiklik yok</p>'}
      </div>
    `);
  });
}

function showStagedDiffModal() {
  V.gitDiffStaged(localRepoPath).then(result => {
    if (!result.success) return toast('Hata: ' + result.error, 'error');
    openModal('Staged Diff', `
      <div class="diff-block" style="max-height:60vh;overflow:auto;">
        ${result.diff ? result.diff.split('\n').slice(0, 500).map(line => {
          let cls = '';
          if (line.startsWith('+')) cls = 'diff-add';
          else if (line.startsWith('-')) cls = 'diff-remove';
          else if (line.startsWith('@@')) cls = 'diff-info';
          return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
        }).join('') : '<p class="text-muted" style="padding:12px;">Staged değişiklik yok</p>'}
      </div>
    `);
  });
}

function showFileDiffModal(file) {
  V.gitDiffFile(localRepoPath, file).then(result => {
    if (!result.success) return toast('Hata: ' + result.error, 'error');
    openModal('Diff: ' + file, `
      <div class="diff-block" style="max-height:60vh;overflow:auto;">
        ${result.diff ? result.diff.split('\n').slice(0, 500).map(line => {
          let cls = '';
          if (line.startsWith('+')) cls = 'diff-add';
          else if (line.startsWith('-')) cls = 'diff-remove';
          else if (line.startsWith('@@')) cls = 'diff-info';
          return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
        }).join('') : '<p class="text-muted" style="padding:12px;">Değişiklik yok</p>'}
      </div>
    `);
  });
}

function showFileHistoryModal(file) {
  V.gitLogFile(localRepoPath, file).then(result => {
    if (!result.success) return toast('Hata: ' + result.error, 'error');
    const log = result.log;
    openModal('Dosya Geçmişi: ' + file, `
      <div style="max-height:60vh;overflow:auto;">
        ${(log.all || []).map(c => `
          <div class="commit-item" onclick="showLocalCommitDetail('${escapeHtml(c.hash)}')">
            <div class="commit-dot"></div>
            <div class="commit-info">
              <div class="commit-message">${escapeHtml(c.message.split('\n')[0])}</div>
              <div class="commit-meta">
                <span class="commit-sha">${c.hash.substring(0, 7)}</span>
                <span>${escapeHtml(c.author_name)}</span>
                <span>${timeAgo(c.date)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
  });
}

async function doGitReset(mode) {
  const modeLabel = { soft: 'Soft', mixed: 'Mixed', hard: 'Hard' };
  if (!confirm(`Git reset --${mode} yapılacak.${mode === 'hard' ? ' TÜM DEĞİŞİKLİKLER KAYBOLACAK!' : ''} Devam edilsin mi?`)) return;
  const result = await V.gitReset(localRepoPath, mode);
  if (result.success) { toast(`Git reset --${mode} yapıldı`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doGitClean() {
  if (!confirm('Tüm untracked dosyalar SİLİNECEK! Bu işlem geri alınamaz. Devam edilsin mi?')) return;
  const result = await V.gitClean(localRepoPath);
  if (result.success) { toast('Untracked dosyalar temizlendi', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function refreshLocalTab() {
  renderLocalTabContent();
}

// ---------- HISTORY TAB ----------

async function renderLocalHistory() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const logRes = await V.gitLog(localRepoPath, 100);
  if (!logRes.success) { div.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(logRes.error)}</p>`; return; }

  const commits = logRes.log?.all || [];

  div.innerHTML = `
    <div class="flex-row gap-md mb-md flex-wrap">
      <button class="btn" onclick="renderLocalHistory()">${svgIcon('refresh')} Yenile</button>
      <button class="btn" onclick="showLogSearchModal()">🔍 Commit Ara</button>
    </div>
    <div class="card" style="padding:0;">
      <div class="card-header" style="padding:16px;"><h3 class="card-title">${svgIcon('commit')} Commit Geçmişi (${commits.length})</h3></div>
      ${commits.length === 0 ? '<div class="empty-state"><h3>Henüz commit yok</h3></div>' :
        commits.map(c => `
          <div class="commit-item" onclick="showLocalCommitDetail('${escapeHtml(c.hash)}')">
            <div class="commit-dot"></div>
            <div class="commit-info">
              <div class="commit-message">${escapeHtml(c.message.split('\n')[0])}</div>
              <div class="commit-meta">
                <span class="commit-sha" onclick="event.stopPropagation();copyToClipboard('${escapeHtml(c.hash)}')" title="SHA kopyala">${c.hash.substring(0, 7)}</span>
                <span>${escapeHtml(c.author_name)}</span>
                <span>${escapeHtml(c.author_email)}</span>
                <span>${timeAgo(c.date)}</span>
              </div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-sm" onclick="event.stopPropagation();copyToClipboard('${escapeHtml(c.hash)}')" title="SHA Kopyala">📋</button>
              <button class="btn btn-sm" onclick="event.stopPropagation();doCherryPick('${escapeHtml(c.hash)}')" title="Cherry-pick">🍒</button>
              <button class="btn btn-sm" onclick="event.stopPropagation();doRevertCommit('${escapeHtml(c.hash)}')" title="Revert">↩️</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
}

async function showLocalCommitDetail(hash) {
  const result = await V.gitShow(localRepoPath, hash);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal('Commit: ' + hash.substring(0, 7), `
    <div class="diff-block" style="max-height:60vh;overflow:auto;">
      ${result.content.split('\n').slice(0, 500).map(line => {
        let cls = '';
        if (line.startsWith('+') && !line.startsWith('+++')) cls = 'diff-add';
        else if (line.startsWith('-') && !line.startsWith('---')) cls = 'diff-remove';
        else if (line.startsWith('@@')) cls = 'diff-info';
        return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
      }).join('')}
    </div>
  `);
}

async function doCherryPick(hash) {
  if (!confirm(`Commit ${hash.substring(0, 7)} cherry-pick edilsin mi?`)) return;
  const result = await V.gitCherryPick(localRepoPath, hash);
  if (result.success) { toast('Cherry-pick başarılı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doRevertCommit(hash) {
  if (!confirm(`Commit ${hash.substring(0, 7)} revert edilsin mi?`)) return;
  const result = await V.gitRevert(localRepoPath, hash);
  if (result.success) { toast('Revert başarılı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ---------- BRANCHES TAB ----------

async function renderLocalBranches() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const branchRes = await V.gitBranchLocal(localRepoPath);
  if (!branchRes.success) { div.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(branchRes.error)}</p>`; return; }

  const branches = branchRes.branches;
  const current = branches.current;
  const allBranches = branches.all || [];

  div.innerHTML = `
    <div class="flex-row gap-md mb-md flex-wrap">
      <button class="btn btn-primary" onclick="showCreateLocalBranchModal()">${svgIcon('plus')} Yeni Branch</button>
      <button class="btn" onclick="showMergeBranchModal()">🔀 Merge</button>
      <button class="btn" onclick="renderLocalBranches()">${svgIcon('refresh')} Yenile</button>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">${svgIcon('branch')} Yerel Branch'ler (${allBranches.length})</h3></div>
      ${allBranches.map(name => `
        <div class="list-item">
          <div class="list-item-icon" style="color:${name === current ? 'var(--success)' : 'var(--text-secondary)'};">${svgIcon('branch')}</div>
          <div class="list-item-content">
            <div class="list-item-title">${escapeHtml(name)}${name === current ? ' <span class="badge badge-success">aktif</span>' : ''}</div>
          </div>
          <div class="list-item-actions">
            ${name !== current ? `
              <button class="btn btn-sm btn-success" onclick="doSwitchBranch('${escapeJsStr(name)}')" title="Bu branch'e geç">${svgIcon('check')} Geç</button>
              <button class="btn btn-sm" onclick="showRenameBranchModal('${escapeJsStr(name)}')" title="Yeniden Adlandır">✏️</button>
              <button class="btn btn-sm" onclick="doMergeBranch('${escapeJsStr(name)}')" title="Mevcut branch'e merge et">🔀 Merge</button>
              <button class="btn btn-sm btn-danger" onclick="doDeleteLocalBranch('${escapeJsStr(name)}')" title="Sil">${svgIcon('trash')}</button>
            ` : '<span class="badge badge-success">aktif</span>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showCreateLocalBranchModal() {
  openModal('Yeni Yerel Branch', `
    <div class="input-group"><label>Branch Adı</label><input type="text" id="local-branch-name" placeholder="feature/yeni-ozellik"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCreateLocalBranch()">Oluştur ve Geç</button>
  `);
}

async function doCreateLocalBranch() {
  const name = document.getElementById('local-branch-name').value.trim();
  if (!name) return toast('Branch adı gerekli', 'error');
  const result = await V.gitCreateBranch(localRepoPath, name);
  if (result.success) { toast(`Branch "${name}" oluşturuldu`, 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doSwitchBranch(branch) {
  const result = await V.gitCheckout(localRepoPath, branch);
  if (result.success) { toast(`"${branch}" branch'ine geçildi`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doDeleteLocalBranch(branch) {
  if (!confirm(`"${branch}" branch'i silinsin mi?`)) return;
  const result = await V.gitBranchDelete(localRepoPath, branch);
  if (result.success) { toast(`Branch "${branch}" silindi`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doMergeBranch(branch) {
  if (!confirm(`"${branch}" branch'i mevcut branch'e merge edilsin mi?`)) return;
  toast('Merge yapılıyor...', 'info');
  const result = await V.gitMergeBranch(localRepoPath, branch);
  if (result.success) { toast('Merge tamamlandı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showMergeBranchModal() {
  V.gitBranchLocal(localRepoPath).then(res => {
    if (!res.success) return toast('Hata', 'error');
    const branches = res.branches.all.filter(b => b !== res.branches.current);
    openModal('Branch Merge', `
      <p class="text-muted text-sm mb-md">Mevcut branch: <strong>${escapeHtml(res.branches.current)}</strong></p>
      <div class="input-group"><label>Merge edilecek branch</label>
        <select id="merge-branch-select">${branches.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-block mt-md" onclick="doMergeBranch(document.getElementById('merge-branch-select').value);closeModal();">Merge</button>
    `);
  });
}

// ---------- REMOTES TAB ----------

async function renderLocalRemotes() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const result = await V.gitRemoteList(localRepoPath);
  const remotes = result.success ? result.remotes : [];

  div.innerHTML = `
    <div class="flex-row gap-md mb-md flex-wrap">
      <button class="btn btn-primary" onclick="showAddRemoteModal()">${svgIcon('plus')} Remote Ekle</button>
      <button class="btn btn-info" onclick="doGitFetchAll()">🔄 Fetch All</button>
      <button class="btn" onclick="renderLocalRemotes()">${svgIcon('refresh')} Yenile</button>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">${svgIcon('link')} Remote'lar (${remotes.length})</h3></div>
      ${remotes.length === 0 ? '<p class="text-muted text-sm" style="padding:12px;">Remote tanımlı değil</p>' :
        remotes.map(r => `
          <div class="list-item">
            <div class="list-item-icon">${svgIcon('link')}</div>
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(r.name)}</div>
              <div class="list-item-subtitle font-mono">${escapeHtml(r.refs?.fetch || r.refs?.push || '')}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-info" onclick="doGitPushToRemote('${escapeJsStr(r.name)}')" title="Push">Push</button>
              <button class="btn btn-sm" onclick="doGitPullFromRemote('${escapeJsStr(r.name)}')" title="Pull">Pull</button>
              <button class="btn btn-sm" onclick="showSetRemoteUrlModal('${escapeJsStr(r.name)}')" title="URL Değiştir">🔗</button>
              <button class="btn btn-sm btn-danger" onclick="doRemoveRemote('${escapeJsStr(r.name)}')" title="Kaldır">${svgIcon('trash')}</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
}

function showAddRemoteModal() {
  openModal('Remote Ekle', `
    <div class="input-group"><label>Remote Adı</label><input type="text" id="remote-name" value="origin" placeholder="origin"></div>
    <div class="input-group"><label>Remote URL</label><input type="url" id="remote-url" placeholder="https://github.com/user/repo.git"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doAddRemote()">Remote Ekle</button>
  `);
}

async function doAddRemote() {
  const name = document.getElementById('remote-name').value.trim();
  const url = document.getElementById('remote-url').value.trim();
  if (!name || !url) return toast('Tüm alanları doldurun', 'error');
  const result = await V.gitRemoteAdd(localRepoPath, name, url);
  if (result.success) { toast('Remote eklendi', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doRemoveRemote(name) {
  if (!confirm(`"${name}" remote'u kaldırılsın mı?`)) return;
  const result = await V.gitRemoteRemove(localRepoPath, name);
  if (result.success) { toast('Remote kaldırıldı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doGitPushToRemote(remote) {
  toast(`${remote}'a push yapılıyor...`, 'info');
  const result = await V.gitPush(localRepoPath, remote);
  if (result.success) toast('Push tamamlandı', 'success');
  else toast('Hata: ' + result.error, 'error');
}

async function doGitPullFromRemote(remote) {
  toast(`${remote}'dan pull yapılıyor...`, 'info');
  const result = await V.gitPull(localRepoPath, remote);
  if (result.success) { toast('Pull tamamlandı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ---------- TAGS TAB ----------

async function renderLocalTags() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const result = await V.gitTagList(localRepoPath);
  const tags = result.success ? result.tags : { all: [] };

  div.innerHTML = `
    <div class="flex-row gap-md mb-md">
      <button class="btn btn-primary" onclick="showCreateLocalTagModal()">${svgIcon('plus')} Yeni Tag</button>
      <button class="btn btn-info" onclick="doPushTags()">Push Tags</button>
      <button class="btn" onclick="renderLocalTags()">${svgIcon('refresh')} Yenile</button>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg> Tag'lar (${tags.all?.length || 0})</h3></div>
      ${(tags.all || []).length === 0 ? '<p class="text-muted text-sm" style="padding:12px;">Tag bulunamadı</p>' :
        tags.all.map(t => `
          <div class="list-item">
            <div class="list-item-icon"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg></div>
            <div class="list-item-content"><div class="list-item-title">${escapeHtml(t)}</div></div>
            <button class="btn btn-sm btn-danger" onclick="doDeleteLocalTag('${escapeJsStr(t)}')" title="Sil">${svgIcon('trash')}</button>
          </div>
        `).join('')}
    </div>
  `;
}

function showCreateLocalTagModal() {
  openModal('Yeni Tag', `
    <div class="input-group"><label>Tag Adı</label><input type="text" id="local-tag-name" placeholder="v1.0.0"></div>
    <div class="input-group"><label>Mesaj (opsiyonel, annotated tag için)</label><input type="text" id="local-tag-msg" placeholder="İlk sürüm"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCreateLocalTag()">Oluştur</button>
  `);
}

async function doCreateLocalTag() {
  const tag = document.getElementById('local-tag-name').value.trim();
  if (!tag) return toast('Tag adı gerekli', 'error');
  const msg = document.getElementById('local-tag-msg').value.trim();
  const result = await V.gitTag(localRepoPath, tag, msg || undefined);
  if (result.success) { toast(`Tag "${tag}" oluşturuldu`, 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doDeleteLocalTag(tag) {
  if (!confirm(`"${tag}" tag'ı silinsin mi?`)) return;
  const result = await V.gitTagDelete(localRepoPath, tag);
  if (result.success) { toast(`Tag "${tag}" silindi`, 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doPushTags() {
  toast('Tag\'lar push ediliyor...', 'info');
  const result = await V.gitPushTags(localRepoPath);
  if (result.success) toast('Tag\'lar push edildi', 'success');
  else toast('Hata: ' + result.error, 'error');
}

// ---------- STASH TAB ----------

async function renderLocalStash() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const result = await V.gitStashList(localRepoPath);
  const stashes = result.success ? result.stashes : { all: [] };

  div.innerHTML = `
    <div class="flex-row gap-md mb-md flex-wrap">
      <button class="btn btn-primary" onclick="showNamedStashModal()">📦 Mesajlı Stash</button>
      <button class="btn" onclick="doGitStash()">📦 Hızlı Stash</button>
      <button class="btn btn-success" onclick="doGitStashPop()">📤 Stash Pop</button>
      <button class="btn" onclick="renderLocalStash()">${svgIcon('refresh')} Yenile</button>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">📦 Stash Listesi (${stashes.all?.length || 0})</h3></div>
      ${(stashes.all || []).length === 0 ? '<p class="text-muted text-sm" style="padding:12px;">Stash bulunamadı</p>' :
        stashes.all.map((s, i) => `
          <div class="list-item">
            <div class="list-item-icon">📦</div>
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(s.message || `stash@{${i}}`)}</div>
              <div class="list-item-subtitle">${escapeHtml(s.hash?.substring(0, 7) || '')} · ${timeAgo(s.date)}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-sm btn-success" onclick="doStashApply(${i})" title="Apply (kaldırmadan uygula)">📥 Apply</button>
              <button class="btn btn-sm" onclick="showStashDetail(${i})" title="Detay">🔍</button>
              <button class="btn btn-sm btn-danger" onclick="doStashDrop(${i})" title="Sil">${svgIcon('trash')}</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
}

async function showStashDetail(index) {
  const result = await V.gitShow(localRepoPath, `stash@{${index}}`);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal(`Stash @{${index}} Detayı`, `
    <div class="diff-block" style="max-height:60vh;overflow:auto;">
      ${result.content.split('\n').slice(0, 300).map(line => {
        let cls = '';
        if (line.startsWith('+') && !line.startsWith('+++')) cls = 'diff-add';
        else if (line.startsWith('-') && !line.startsWith('---')) cls = 'diff-remove';
        else if (line.startsWith('@@')) cls = 'diff-info';
        return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
      }).join('')}
    </div>
  `);
}

async function doStashDrop(index) {
  if (!confirm(`stash@{${index}} silinsin mi?`)) return;
  const result = await V.gitStashDrop(localRepoPath, index);
  if (result.success) { toast('Stash silindi', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ---------- CONFIG TAB ----------

async function renderLocalConfig() {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();

  const [nameRes, emailRes] = await Promise.all([
    V.gitConfigGet(localRepoPath, 'user.name'),
    V.gitConfigGet(localRepoPath, 'user.email')
  ]);

  div.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">⚙️ Git Yapılandırması</h3></div>
      <div class="input-group">
        <label>user.name</label>
        <div class="flex-row">
          <input type="text" id="config-username" value="${escapeHtml(nameRes.success ? nameRes.value || '' : '')}" placeholder="Adınız">
          <button class="btn" onclick="saveConfigValue('user.name', document.getElementById('config-username').value)">Kaydet</button>
        </div>
      </div>
      <div class="input-group">
        <label>user.email</label>
        <div class="flex-row">
          <input type="text" id="config-email" value="${escapeHtml(emailRes.success ? emailRes.value || '' : '')}" placeholder="email@example.com">
          <button class="btn" onclick="saveConfigValue('user.email', document.getElementById('config-email').value)">Kaydet</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">📂 Repo Bilgileri</h3></div>
      <div class="flex-row gap-lg flex-wrap text-sm" style="padding:8px 0;">
        <span><b>Yol:</b> ${escapeHtml(localRepoPath)}</span>
      </div>
    </div>
  `;
}

async function saveConfigValue(key, value) {
  if (!value.trim()) return toast('Değer boş olamaz', 'error');
  const result = await V.gitConfigSet(localRepoPath, key, value.trim());
  if (result.success) toast(`${key} güncellendi`, 'success');
  else toast('Hata: ' + result.error, 'error');
}

// ---------- EDITOR TAB ----------

async function renderLocalEditor() {
  const div = document.getElementById('local-tab-content');

  div.innerHTML = `
    <div class="editor-layout">
      <div class="editor-sidebar">
        <div class="editor-sidebar-header">
          <span class="font-bold text-sm">DOSYALAR</span>
          <button class="btn-icon" onclick="showNewFileModal()" title="Yeni Dosya">${svgIcon('plus')}</button>
        </div>
        <div class="editor-file-tree" id="editor-file-tree">${loading()}</div>
      </div>
      <div class="editor-main">
        <div class="editor-toolbar" id="editor-toolbar">
          <span class="text-muted text-sm" id="editor-filename">Bir dosya seçin</span>
          <div class="flex-row gap-sm">
            <button class="btn btn-sm btn-success" id="editor-save-btn" onclick="saveEditorFile()" disabled>${svgIcon('check')} Kaydet</button>
            <button class="btn btn-sm" id="editor-stage-btn" onclick="stageEditorFile()" disabled>${svgIcon('plus')} Stage</button>
            <button class="btn btn-sm btn-danger" id="editor-delete-btn" onclick="deleteEditorFile()" disabled>${svgIcon('trash')} Sil</button>
          </div>
        </div>
        <div class="editor-content" id="editor-content">
          <div class="editor-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" style="opacity:0.3;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            <p class="text-muted mt-sm">Sol panelden bir dosya seçerek düzenlemeye başlayın</p>
          </div>
        </div>
      </div>
    </div>
  `;

  loadEditorFileTree(localRepoPath);
}

async function loadEditorFileTree(dirPath) {
  const tree = document.getElementById('editor-file-tree');
  const result = await V.localListDir(dirPath);
  if (!result.success) { tree.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">Dosyalar yüklenemedi</p>'; return; }

  const isRoot = dirPath === localRepoPath;
  tree.innerHTML = `
    ${!isRoot ? `<div class="editor-tree-item" onclick="loadEditorFileTree('${escapeJsStr(dirPath.substring(0, dirPath.lastIndexOf(dirPath.includes('/') ? '/' : '\\\\')))}')"><span style="color:var(--accent);">📁</span> <span class="text-accent">..</span></div>` : ''}
    ${result.items.map(item => {
      if (item.isDir) {
        return `<div class="editor-tree-item" onclick="loadEditorFileTree('${escapeJsStr(item.path)}')"><span style="color:var(--accent);">📁</span> <span class="text-accent">${escapeHtml(item.name)}</span></div>`;
      } else {
        return `<div class="editor-tree-item" onclick="openFileInEditor('${escapeJsStr(item.path)}')">${getFileIcon(item.name)} <span>${escapeHtml(item.name)}</span></div>`;
      }
    }).join('')}
  `;
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    js: '🟨', ts: '🔷', json: '📋', html: '🌐', css: '🎨', md: '📝',
    py: '🐍', java: '☕', rb: '💎', go: '🔵', rs: '🦀', c: '⚙️',
    cpp: '⚙️', h: '⚙️', sh: '🐚', yml: '📄', yaml: '📄', xml: '📄',
    txt: '📄', gitignore: '🙈', env: '🔒', lock: '🔒',
    png: '🖼️', jpg: '🖼️', svg: '🖼️', gif: '🖼️',
  };
  return icons[ext] || '📄';
}

async function openFileInEditor(filePath) {
  const contentDiv = document.getElementById('editor-content');
  contentDiv.innerHTML = loading();

  const result = await V.localReadFile(filePath);
  if (!result.success) {
    contentDiv.innerHTML = `<div class="editor-placeholder"><p class="text-danger">Dosya okunamadı: ${escapeHtml(result.error)}</p></div>`;
    return;
  }

  editorCurrentFile = filePath;
  const fileName = filePath.split(/[\\/]/).pop();
  document.getElementById('editor-filename').textContent = fileName;
  document.getElementById('editor-save-btn').disabled = false;
  document.getElementById('editor-stage-btn').disabled = false;
  document.getElementById('editor-delete-btn').disabled = false;

  const lines = result.content.split('\n');
  const lineNums = lines.map((_, i) => i + 1).join('\n');

  contentDiv.innerHTML = `
    <div class="editor-wrapper">
      <div class="editor-line-numbers" id="editor-line-nums">${lineNums}</div>
      <textarea class="editor-textarea" id="editor-textarea" spellcheck="false" wrap="off">${escapeHtml(result.content)}</textarea>
    </div>
  `;

  const textarea = document.getElementById('editor-textarea');
  const lineNumsEl = document.getElementById('editor-line-nums');

  textarea.addEventListener('scroll', () => {
    lineNumsEl.scrollTop = textarea.scrollTop;
  });

  textarea.addEventListener('input', () => {
    const newLines = textarea.value.split('\n');
    lineNumsEl.textContent = newLines.map((_, i) => i + 1).join('\n');
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEditorFile();
    }
  });
}

function openFileInEditorFromChanges(file) {
  const fullPath = localRepoPath + (localRepoPath.includes('/') ? '/' : '\\') + file;
  localRepoTab = 'editor';
  renderLocalRepo();
  setTimeout(() => openFileInEditor(fullPath), 300);
}

async function saveEditorFile() {
  if (!editorCurrentFile) return;
  const content = document.getElementById('editor-textarea').value;
  const result = await V.localWriteFile(editorCurrentFile, content);
  if (result.success) toast('Dosya kaydedildi', 'success');
  else toast('Hata: ' + result.error, 'error');
}

async function stageEditorFile() {
  if (!editorCurrentFile) return;
  const relativePath = editorCurrentFile.replace(localRepoPath + '\\', '').replace(localRepoPath + '/', '');
  const result = await V.gitAddFile(localRepoPath, relativePath);
  if (result.success) toast('Dosya staged', 'success');
  else toast('Hata: ' + result.error, 'error');
}

async function deleteEditorFile() {
  if (!editorCurrentFile) return;
  if (!confirm('Bu dosya silinecek. Devam edilsin mi?')) return;
  const result = await V.localDeleteFile(editorCurrentFile);
  if (result.success) {
    toast('Dosya silindi', 'success');
    editorCurrentFile = null;
    document.getElementById('editor-content').innerHTML = '<div class="editor-placeholder"><p class="text-muted">Dosya silindi</p></div>';
    document.getElementById('editor-save-btn').disabled = true;
    document.getElementById('editor-stage-btn').disabled = true;
    document.getElementById('editor-delete-btn').disabled = true;
    document.getElementById('editor-filename').textContent = 'Bir dosya seçin';
    loadEditorFileTree(localRepoPath);
  } else toast('Hata: ' + result.error, 'error');
}

function showNewFileModal() {
  openModal('Yeni Dosya Oluştur', `
    <div class="input-group"><label>Dosya Adı (yol dahil)</label><input type="text" id="new-file-name" placeholder="src/index.js"></div>
    <div class="input-group"><label>İçerik (opsiyonel)</label><textarea id="new-file-content" style="font-family:var(--font-mono);min-height:120px;" placeholder="// Yeni dosya"></textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="createNewLocalFile()">Oluştur</button>
  `);
}

async function createNewLocalFile() {
  const name = document.getElementById('new-file-name').value.trim();
  if (!name) return toast('Dosya adı gerekli', 'error');
  const sep = localRepoPath.includes('/') ? '/' : '\\';
  const fullPath = localRepoPath + sep + name.replace(/\//g, sep);
  const content = document.getElementById('new-file-content').value;
  const result = await V.localCreateFile(fullPath, content);
  if (result.success) {
    toast('Dosya oluşturuldu', 'success');
    closeModal();
    loadEditorFileTree(localRepoPath);
    openFileInEditor(fullPath);
  } else toast('Hata: ' + result.error, 'error');
}

// ---------- FILES TAB ----------

let localFileBrowserPath = '';

async function renderLocalFiles() {
  localFileBrowserPath = localRepoPath;
  await loadLocalFileBrowser(localRepoPath);
}

async function loadLocalFileBrowser(dirPath) {
  const div = document.getElementById('local-tab-content');
  div.innerHTML = loading();
  localFileBrowserPath = dirPath;

  const result = await V.localListDir(dirPath);
  if (!result.success) { div.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`; return; }

  const relativePath = dirPath.replace(localRepoPath, '') || '/';
  const isRoot = dirPath === localRepoPath;

  div.innerHTML = `
    <div class="breadcrumb mb-md">
      <span class="breadcrumb-item" onclick="loadLocalFileBrowser('${escapeJsStr(localRepoPath)}')" style="cursor:pointer;">📂 Root</span>
      ${!isRoot ? `<span class="breadcrumb-sep">/</span><span class="breadcrumb-current">${escapeHtml(relativePath)}</span>` : ''}
    </div>
    <div class="card" style="padding:0;">
      ${!isRoot ? `
        <div class="file-item" onclick="loadLocalFileBrowser('${escapeJsStr(dirPath.substring(0, Math.max(dirPath.lastIndexOf('/'), dirPath.lastIndexOf('\\\\'))))}')">
          <span class="file-icon folder">${svgIcon('folder')}</span>
          <span class="file-name">..</span>
        </div>
      ` : ''}
      ${result.items.map(item => `
        <div class="file-item" onclick="${item.isDir ? `loadLocalFileBrowser('${escapeJsStr(item.path)}')` : `previewLocalFile('${escapeJsStr(item.path)}')`}">
          <span class="file-icon ${item.isDir ? 'folder' : 'file'}">${item.isDir ? svgIcon('folder') : getFileIcon(item.name)}</span>
          <span class="file-name">${escapeHtml(item.name)}</span>
          <div class="list-item-actions" style="margin-left:auto;">
            ${!item.isDir ? `<button class="btn btn-sm" onclick="event.stopPropagation();openFileInEditorFromFiles('${escapeJsStr(item.path)}')" title="Editörde Aç">✏️</button>` : ''}
          </div>
        </div>
      `).join('')}
      ${result.items.length === 0 ? '<p class="text-muted text-sm" style="padding:16px;">Boş klasör</p>' : ''}
    </div>
  `;
}

async function previewLocalFile(filePath) {
  const result = await V.localReadFile(filePath);
  if (!result.success) return toast('Dosya okunamadı', 'error');
  const fileName = filePath.split(/[\\/]/).pop();
  openModal('📄 ' + fileName, `
    <div class="diff-block" style="max-height:60vh;overflow:auto;">
      <pre style="padding:16px;overflow-x:auto;font-family:var(--font-mono);font-size:13px;line-height:1.6;margin:0;">${escapeHtml(result.content)}</pre>
    </div>
    <div class="flex-row gap-sm mt-md">
      <button class="btn btn-primary" onclick="closeModal();openFileInEditorFromFiles('${escapeJsStr(filePath)}')">✏️ Editörde Aç</button>
    </div>
  `);
}

function openFileInEditorFromFiles(filePath) {
  localRepoTab = 'editor';
  renderLocalRepo();
  setTimeout(() => openFileInEditor(filePath), 300);
}

// ==========================================
// COLLABORATORS
// ==========================================

async function renderCollaborators() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title">İşbirlikçiler</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  const result = await V.listCollaborators(selectedRepo.owner, selectedRepo.name);
  const collabs = result.success ? result.collaborators : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg> İşbirlikçiler</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)} · ${collabs.length} kişi</p>
        </div>
        <button class="btn btn-primary" onclick="showAddCollabModal()">
          ${svgIcon('plus')} Ekle
        </button>
      </div>
      <div class="card" style="padding:0;">
        ${collabs.map(c => `
          <div class="list-item">
            <img src="${escapeHtml(c.avatar_url)}" width="36" height="36" style="border-radius:50%;">
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(c.login)}</div>
              <div class="list-item-subtitle">${escapeHtml(c.role_name || c.permissions?.admin ? 'admin' : 'write')}</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeCollab('${escapeHtml(c.login)}')">${svgIcon('trash')}</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showAddCollabModal() {
  openModal('İşbirlikçi Ekle', `
    <div class="input-group"><label>GitHub Kullanıcı Adı</label><input type="text" id="collab-username" placeholder="username"></div>
    <div class="input-group"><label>Yetki</label>
      <select id="collab-perm">
        <option value="push">Write (Push)</option>
        <option value="pull">Read (Pull)</option>
        <option value="admin">Admin</option>
      </select>
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="addCollab()">Ekle</button>
  `);
}

async function addCollab() {
  const username = document.getElementById('collab-username').value.trim();
  const perm = document.getElementById('collab-perm').value;
  if (!username) return toast('Kullanıcı adı gerekli', 'error');
  const result = await V.addCollaborator(selectedRepo.owner, selectedRepo.name, username, perm);
  if (result.success) { toast('Davet gönderildi', 'success'); closeModal(); renderCollaborators(); }
  else toast('Hata: ' + result.error, 'error');
}

async function removeCollab(username) {
  if (!confirm(`${username} kaldırılsın mı?`)) return;
  const result = await V.removeCollaborator(selectedRepo.owner, selectedRepo.name, username);
  if (result.success) { toast('Kaldırıldı', 'success'); renderCollaborators(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// FILE BROWSER
// ==========================================

let fileBrowserPath = '';

async function renderFileBrowser() {
  const content = document.getElementById('content');
  if (!selectedRepo) {
    content.innerHTML = `<div class="fade-in"><div class="page-header"><h1 class="page-title">${svgIcon('file')} Dosya Tarayıcı</h1></div><div class="empty-state"><h3>Repo Seçilmedi</h3><button class="btn btn-primary mt-md" onclick="navigateTo('repos')">Repo Seç</button></div></div>`;
    return;
  }
  
  content.innerHTML = loading();
  fileBrowserPath = '';
  await loadFileContents('');
}

async function loadFileContents(path) {
  fileBrowserPath = path;
  const content = document.getElementById('content');
  
  const result = await V.getContents(selectedRepo.owner, selectedRepo.name, path);
  if (!result.success) {
    content.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`;
    return;
  }
  
  const items = Array.isArray(result.contents) ? result.contents : [result.contents];
  const isFile = !Array.isArray(result.contents);
  
  // Build breadcrumb
  const parts = path.split('/').filter(Boolean);
  let breadcrumb = `<span class="breadcrumb-item" onclick="loadFileContents('')">${escapeHtml(selectedRepo.name)}</span>`;
  let cumPath = '';
  parts.forEach((p, i) => {
    cumPath += (cumPath ? '/' : '') + p;
    if (i < parts.length - 1) {
      breadcrumb += `<span class="breadcrumb-sep">/</span><span class="breadcrumb-item" onclick="loadFileContents('${escapeHtml(cumPath)}')">${escapeHtml(p)}</span>`;
    } else {
      breadcrumb += `<span class="breadcrumb-sep">/</span><span class="breadcrumb-current">${escapeHtml(p)}</span>`;
    }
  });
  
  if (isFile) {
    const file = result.contents;
    const fileContent = file.content ? atob(file.content) : '';
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">${svgIcon('file')} Dosya Tarayıcı</h1>
        </div>
        <div class="breadcrumb">${breadcrumb}</div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(file.name)}</h3>
            <span class="text-sm text-muted">${formatSize(file.size)}</span>
          </div>
          <div class="diff-block">
            <pre style="padding:16px;overflow-x:auto;font-family:var(--font-mono);font-size:13px;line-height:1.6;margin:0;">${escapeHtml(fileContent)}</pre>
          </div>
        </div>
      </div>
    `;
  } else {
    // Sort directories first
    items.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
    
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">${svgIcon('file')} Dosya Tarayıcı</h1>
          <p class="page-subtitle">${escapeHtml(selectedRepo.full_name)}</p>
        </div>
        <div class="breadcrumb">${breadcrumb}</div>
        <div class="card" style="padding:0;">
          ${items.map(item => `
            <div class="file-item" onclick="loadFileContents('${escapeHtml(item.path)}')">
              <span class="file-icon ${item.type === 'dir' ? 'folder' : 'file'}">
                ${item.type === 'dir' ? svgIcon('folder') : svgIcon('file')}
              </span>
              <span class="file-name">${escapeHtml(item.name)}</span>
              ${item.size ? `<span class="file-size">${formatSize(item.size)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// ==========================================
// ORGANIZATIONS
// ==========================================

async function renderOrganizations() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listOrgs();
  const orgs = result.success ? result.orgs : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <svg viewBox="0 0 24 24" width="28" height="28"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><rect x="8" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          Organizasyonlar
        </h1>
      </div>
      <div class="repo-grid">
        ${orgs.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><h3>Organizasyon bulunamadı</h3></div>' :
          orgs.map(o => `
            <div class="repo-card">
              <div class="flex-row gap-md">
                <img src="${escapeHtml(o.avatar_url)}" width="48" height="48" style="border-radius:var(--radius);">
                <div>
                  <div class="repo-card-name">${escapeHtml(o.login)}</div>
                  <div class="repo-card-desc">${escapeHtml(o.description || '')}</div>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// PROFILE
// ==========================================

async function renderProfile() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const [userRes, followersRes, followingRes] = await Promise.all([
    V.getUser(),
    V.listFollowers(),
    V.listFollowing()
  ]);
  
  const user = userRes.success ? userRes.user : currentUser;
  const followers = followersRes.success ? followersRes.users : [];
  const following = followingRes.success ? followingRes.users : [];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          Profil
        </h1>
        <button class="btn btn-danger" onclick="doLogout()">Çıkış Yap</button>
      </div>
      
      <div class="card">
        <div class="profile-header">
          <img class="profile-avatar" src="${escapeHtml(user.avatar_url)}" alt="">
          <div>
            <div class="profile-name">${escapeHtml(user.name || user.login)}</div>
            <div class="profile-login">@${escapeHtml(user.login)}</div>
            ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orange">${svgIcon('repo')}</div>
            <div class="stat-info"><div class="stat-number">${user.public_repos || 0}</div><div class="stat-label">Public Repos</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">${svgIcon('repo')}</div>
            <div class="stat-info"><div class="stat-number">${user.total_private_repos || 0}</div><div class="stat-label">Private Repos</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg></div>
            <div class="stat-info"><div class="stat-number">${followers.length}</div><div class="stat-label">Takipçi</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg></div>
            <div class="stat-info"><div class="stat-number">${following.length}</div><div class="stat-label">Takip Edilen</div></div>
          </div>
        </div>
        
        <div class="flex-row gap-lg flex-wrap text-sm text-muted">
          ${user.company ? `<span>🏢 ${escapeHtml(user.company)}</span>` : ''}
          ${user.location ? `<span>📍 ${escapeHtml(user.location)}</span>` : ''}
          ${user.email ? `<span>📧 ${escapeHtml(user.email)}</span>` : ''}
          ${user.blog ? `<span>${svgIcon('link')} ${escapeHtml(user.blog)}</span>` : ''}
          <span>📅 Katılım: ${new Date(user.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Takipçiler (${followers.length})</h3></div>
        <div class="flex-row gap-sm flex-wrap">
          ${followers.slice(0, 30).map(f => `
            <div style="text-align:center;padding:8px;">
              <img src="${escapeHtml(f.avatar_url)}" width="40" height="40" style="border-radius:50%;display:block;margin:0 auto 4px;">
              <span class="text-sm">${escapeHtml(f.login)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function doLogout() {
  if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
  await V.logout();
  location.reload();
}

// ==========================================
// TUTORIALS
// ==========================================

function renderTutorials() {
  const content = document.getElementById('content');
  
  const chapters = [
    {
      chapter: 'BÖLÜM 1: GİTHUB NEDİR?',
      color: '#58a6ff',
      tutorials: [
        {
          title: '🌐 GitHub Nedir ve Ne İşe Yarar?',
          desc: 'GitHub, dünyanın en büyük kod barındırma platformudur. Yazılımcılar kodlarını burada saklar, paylaşır ve birlikte çalışır.',
          details: [
            '<b>GitHub nedir?</b> — GitHub, kodlarınızı internet üzerinde saklayabileceğiniz bir platformdur. Bir nevi "kodlarınız için Google Drive" gibi düşünebilirsiniz.',
            '<b>Ne işe yarar?</b> — Kodunuzun her versiyonunu saklar, başkalarıyla birlikte çalışmanızı sağlar, projelerinizi dünyayla paylaşmanızı mümkün kılar.',
            '<b>Kim kullanır?</b> — Yazılımcılar, tasarımcılar, öğrenciler, şirketler... Microsoft, Google, Facebook gibi şirketler bile GitHub kullanır.',
            '<b>Ücretsiz mi?</b> — Evet! Sınırsız public (açık) ve private (gizli) repo oluşturabilirsiniz. Ücretsiz hesap çoğu kişi için yeterlidir.',
            '<b>Git ile farkı nedir?</b> — Git bir versiyon kontrol aracıdır (bilgisayarınızda çalışır). GitHub ise Git repolarınızı internette barındıran bir servistir.'
          ]
        },
        {
          title: '📖 Temel Kavramlar Sözlüğü',
          desc: 'GitHub\'da karşılaşacağınız tüm temel terimlerin açıklamaları.',
          details: [
            '<b>Repository (Repo)</b> — Projenizin tüm dosyalarının saklandığı klasör. Her proje = bir repo.',
            '<b>Commit</b> — Yaptığınız değişikliklerin kaydı. "Save" gibi düşünün ama her kayıt bir mesajla birlikte tutulur. Örn: "Giriş sayfası eklendi".',
            '<b>Branch (Dal)</b> — Ana koddan ayrı bir çalışma kopyası. Yeni özellik denerken ana kodu bozmamak için kullanılır. Ana branch genelde "main" adını taşır.',
            '<b>Pull Request (PR)</b> — Bir branch\'teki değişiklikleri ana branch\'e birleştirme isteği. Ekip arkadaşlarınız kodunuzu inceleyebilir.',
            '<b>Merge</b> — Bir branch\'teki değişiklikleri başka bir branch\'e birleştirme işlemi.',
            '<b>Clone</b> — Bir repoyu bilgisayarınıza indirme işlemi. İndirdikten sonra çevrimdışı çalışabilirsiniz.',
            '<b>Fork</b> — Başka birinin reposunun bir kopyasını kendi hesabınıza alma. Kopyayı değiştirip orijinaline PR gönderebilirsiniz.',
            '<b>Push</b> — Bilgisayarınızdaki commit\'leri GitHub\'a gönderme.',
            '<b>Pull</b> — GitHub\'daki değişiklikleri bilgisayarınıza çekme.',
            '<b>Issue</b> — Bir hata raporu, özellik isteği veya görev. Proje yönetimi için kullanılır.',
            '<b>Star</b> — Beğendiğiniz repoyu yıldızlama. Yer imi gibi düşünün.',
            '<b>Gist</b> — Küçük kod parçacıkları paylaşmak için kullanılır.',
            '<b>Release</b> — Projenizin belirli bir sürümünü paketleyip yayınlama (ör: v1.0.0).',
            '<b>Actions</b> — Otomatik iş akışları. Kod push edildiğinde testleri çalıştırma, derleme yapma gibi.',
            '<b>README</b> — Reponun ana sayfasında görünen açıklama dosyası. Projenizi tanıtır.'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 2: VULPAX\'A GİRİŞ YAPMA',
      color: '#3fb950',
      tutorials: [
        {
          title: '🔑 GitHub Token Nedir ve Nasıl Oluşturulur?',
          desc: 'Vulpax\'ı kullanmak için bir GitHub Personal Access Token (PAT) gerekir. Bu token, şifreniz yerine kullanılan güvenli bir anahtardır.',
          details: [
            '<b>Token neden gerekli?</b> — GitHub, üçüncü parti uygulamaların (Vulpax gibi) hesabınıza erişmesi için şifre yerine token kullanmanızı ister. Daha güvenlidir çünkü istediğiniz zaman iptal edebilirsiniz.',
            '<b>Adım 1:</b> Tarayıcınızda <code>github.com</code> adresine gidin ve hesabınıza giriş yapın.',
            '<b>Adım 2:</b> Sağ üstteki profil fotonuza tıklayın → <code>Settings</code> (Ayarlar)\'a tıklayın.',
            '<b>Adım 3:</b> Sol menüde en alta inin → <code>Developer settings</code>\'e tıklayın.',
            '<b>Adım 4:</b> <code>Personal access tokens</code> → <code>Tokens (classic)</code> → <code>Generate new token (classic)</code> butonuna tıklayın.',
            '<b>Adım 5:</b> Token\'a bir isim verin. Örnek: "Vulpax Git Client".',
            '<b>Adım 6:</b> Expiration (süre) seçin. "No expiration" süresiz olur.',
            '<b>Adım 7:</b> Scope\'ları (izinleri) seçin. Şunları işaretleyin: <code>repo</code>, <code>user</code>, <code>gist</code>, <code>notifications</code>, <code>admin:org</code>, <code>delete_repo</code>, <code>workflow</code>.',
            '<b>Adım 8:</b> Sayfanın altındaki yeşil <code>Generate token</code> butonuna tıklayın.',
            '<b>Adım 9:</b> Token gösterilecek (ghp_ ile başlar). <b>HEMEN KOPYALAYIN!</b> Sayfayı kapatınca bir daha göremezsiniz.',
            '<b>Adım 10:</b> Vulpax\'ı açın → Token kutusuna yapıştırın → "Giriş Yap" butonuna tıklayın. Bağlantı başarılı!'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 3: VULPAX ARAYÜZÜ REHBERİ',
      color: '#d2a8ff',
      tutorials: [
        {
          title: '🖥️ Ana Ekran ve Sol Menü Nedir?',
          desc: 'Vulpax\'ı açtığınızda gördüğünüz her şeyin ne olduğunu ve ne işe yaradığını öğrenin.',
          details: [
            '<b>Üst Bar (Başlık Çubuğu)</b> — En üstte "Vulpax Git Client" yazısını ve pencere kontrol butonlarını (küçült, büyüt, kapat) görürsünüz. Sürükleyerek pencereyi taşıyabilirsiniz.',
            '<b>Sol Menü (Sidebar)</b> — Tüm sayfalara buradan ulaşırsınız. Her simge bir sayfaya götürür:',
            '&nbsp;&nbsp;📊 <b>Dashboard</b> — Ana gösterge paneli. Repo sayınız, yıldızlarınız, gist\'leriniz ve son aktiviteleriniz burada.',
            '&nbsp;&nbsp;📦 <b>Repolar</b> — GitHub\'daki tüm repolarınızın listesi. Yeni repo oluşturabilirsiniz.',
            '&nbsp;&nbsp;🔀 <b>Branch\'ler</b> — Seçili reponun dallarını (branch) yönetin. Yeni branch oluşturun veya silin.',
            '&nbsp;&nbsp;📝 <b>Commit\'ler</b> — Seçili reponun commit geçmişini görün.',
            '&nbsp;&nbsp;🔃 <b>Pull Request</b> — PR\'ları listeleyin, yeni PR oluşturun, merge edin veya kapatın.',
            '&nbsp;&nbsp;🐛 <b>Issue\'lar</b> — Hata raporları ve görevleri yönetin. Yeni issue oluşturun.',
            '&nbsp;&nbsp;⚡ <b>Actions</b> — CI/CD otomasyonlarını görüntüleyin.',
            '&nbsp;&nbsp;🚀 <b>Release\'ler</b> — Proje sürümlerini yayınlayın.',
            '&nbsp;&nbsp;📋 <b>Gist\'ler</b> — Kod parçacıklarını oluşturun ve paylaşın.',
            '&nbsp;&nbsp;⭐ <b>Yıldızlar</b> — Yıldızladığınız repoları görün.',
            '&nbsp;&nbsp;🔔 <b>Bildirimler</b> — GitHub bildirimlerinizi takip edin.',
            '&nbsp;&nbsp;🔍 <b>Arama</b> — GitHub\'da repo ve kullanıcı arayın.',
            '&nbsp;&nbsp;📂 <b>Yerel Repo</b> — Bilgisayarınızdaki repo\'yu clone/init ile yönetin.',
            '&nbsp;&nbsp;👥 <b>İşbirlikçiler</b> — Repoya collaborator ekleyin veya çıkarın.',
            '&nbsp;&nbsp;🗂️ <b>Dosyalar</b> — Reponun dosya ve klasörlerini tarayın.',
            '&nbsp;&nbsp;🏢 <b>Organizasyonlar</b> — Üye olduğunuz organizasyonları görün.',
            '&nbsp;&nbsp;👤 <b>Profil</b> — GitHub profilinizi, takipçilerinizi görün.',
            '&nbsp;&nbsp;📖 <b>Öğreticiler</b> — Şu an okuduğunuz bu sayfa!',
            '&nbsp;&nbsp;⚙️ <b>Ayarlar</b> — Tema değiştirme, çıkış yapma, hakkında bilgileri.',
            '<b>İçerik Alanı</b> — Sol menüden seçtiğiniz sayfanın içeriği sağ taraftaki geniş alanda görünür.',
            '<b>Toast Bildirimleri</b> — İşlem sonuçları (başarı/hata) sağ altta kısa süreliğine beliren bildirimlerle gösterilir.'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 4: TEMEL İŞLEMLER',
      color: '#f0883e',
      tutorials: [
        {
          title: '📦 Repository (Repo) İşlemleri',
          desc: 'Yeni repo oluşturma, repoları listeleme ve repo detaylarını görme.',
          details: [
            '<b>Repolarım sayfası nerede?</b> — Sol menüde 📦 ikonuna tıklayın. Tüm GitHub repolarınız burada listelenir.',
            '<b>Her repo kartında ne var?</b> — Repo adı, açıklaması, programlama dili, yıldız sayısı, fork sayısı ve public/private etiketi gösterilir.',
            '<b>Yeni repo nasıl oluşturulur?</b>',
            '&nbsp;&nbsp;1. Sayfanın üstündeki yeşil "Yeni Repo" butonuna tıklayın.',
            '&nbsp;&nbsp;2. Repo adı girin (boşluk olmadan, kısa ve öz). Örn: "my-first-project".',
            '&nbsp;&nbsp;3. Açıklama yazın (opsiyonel). Örn: "İlk GitHub projem".',
            '&nbsp;&nbsp;4. Public (herkes görebilir) veya Private (sadece siz) seçin.',
            '&nbsp;&nbsp;5. "Auto Init" seçeneğini işaretlerseniz README dosyası otomatik oluşturulur.',
            '&nbsp;&nbsp;6. "Oluştur" butonuna tıklayın. Tebrikler, ilk reponuz hazır!',
            '<b>Repo silmek:</b> Repo kartındaki menüden "Sil" seçeneğini kullanabilirsiniz. DİKKAT: Silinen repo geri gelmez!',
            '<b>Repo seçme:</b> Bir repoya tıkladığınızda o repo "aktif repo" olur. Branch, Commit, PR, Issue gibi sayfalar bu seçili repoyla çalışır.'
          ]
        },
        {
          title: '🔀 Branch (Dal) İşlemleri',
          desc: 'Branch\'ler, ana kodunuzu bozmadan yeni özellikler geliştirmenizi sağlar.',
          details: [
            '<b>Branch ne işe yarar?</b> — Düşünün ki bir resim çiziyorsunuz. Branch, o resmin bir kopyasını almak gibidir. Kopya üzerine istediğinizi çizebilirsiniz; beğenmezseniz atarsınız, beğenirseniz orijinale eklersiniz.',
            '<b>Branch sayfası nerede?</b> — Sol menüde 🔀 ikonuna tıklayın. (Önce bir repo seçili olmalı!)',
            '<b>Mevcut branch\'leri görme:</b> Sayfa açıldığında tüm branch\'ler listelenir. Yeşil etiketli olan varsayılan (default) branch\'tir, genelde "main" veya "master" adında olur.',
            '<b>Yeni branch oluşturma:</b>',
            '&nbsp;&nbsp;1. "Yeni Branch" butonuna tıklayın.',
            '&nbsp;&nbsp;2. Yeni branch\'e isim verin. Örn: "yeni-ozellik" veya "bugfix-login".',
            '&nbsp;&nbsp;3. Kaynak branch\'i seçin (genelde "main").',
            '&nbsp;&nbsp;4. "Oluştur" butonuna tıklayın.',
            '<b>Branch silme:</b> Branch\'in yanındaki çöp kutusu 🗑️ ikonuna tıklayın. Varsayılan branch silinemez!',
            '<b>İpucu:</b> Her yeni özellik veya hata düzeltmesi için ayrı bir branch oluşturun. İş bitince PR ile merge edin.'
          ]
        },
        {
          title: '📝 Commit Nedir ve Nasıl Görülür?',
          desc: 'Commit, kodunuzdaki her değişikliğin kalıcı kaydıdır. Bir nevi "geri alma noktası" gibidir.',
          details: [
            '<b>Commit nedir?</b> — Her "kaydet" işleminiz bir commit\'tir. Ama normal kaydetmeden farkı: HER commit bir mesaj içerir ve GERİ ALINABİLİR.',
            '<b>Commit sayfası nerede?</b> — Sol menüde 📝 ikonuna tıklayın.',
            '<b>Commit listesinde ne görürsünüz?</b>',
            '&nbsp;&nbsp;• <b>Commit mesajı</b> — Ne değiştirildiğini açıklar. Örn: "Ana sayfa tasarımı güncellendi".',
            '&nbsp;&nbsp;• <b>Yazar</b> — Kim yaptı.',
            '&nbsp;&nbsp;• <b>Tarih</b> — Ne zaman yapıldı.',
            '&nbsp;&nbsp;• <b>SHA</b> — Her commit\'in benzersiz kimliği (kısa bir harf-rakam kodu).',
            '<b>Commit detayı:</b> Bir commit\'e tıklarsanız, o commit\'te hangi dosyaların değiştiğini ve neler eklenip neler silindiğini (diff) görebilirsiniz.',
            '<b>İyi commit mesajı nasıl yazılır?</b>',
            '&nbsp;&nbsp;✅ "Login sayfasına şifre doğrulama eklendi"',
            '&nbsp;&nbsp;✅ "README dosyası güncellendi"',
            '&nbsp;&nbsp;❌ "fix" (çok belirsiz)',
            '&nbsp;&nbsp;❌ "asdfasdf" (anlamsız)'
          ]
        },
        {
          title: '🔃 Pull Request (PR) İşlemleri',
          desc: 'Branch\'te yaptığınız değişiklikleri ana koda birleştirmek için PR kullanırsınız.',
          details: [
            '<b>PR ne işe yarar?</b> — Diyelim "yeni-ozellik" branch\'inde bir özellik geliştirdiniz. Bunu "main" branch\'ine eklemek için PR oluşturursunuz. Ekibiniz kodunuzu inceleyebilir, yorum yapabilir, onaylayabilir.',
            '<b>PR sayfası nerede?</b> — Sol menüde 🔃 ikonuna tıklayın.',
            '<b>Yeni PR oluşturma:</b>',
            '&nbsp;&nbsp;1. "Yeni PR" butonuna tıklayın.',
            '&nbsp;&nbsp;2. <b>Head branch</b> (kaynak): Değişikliklerinizin olduğu branch. Örn: "yeni-ozellik".',
            '&nbsp;&nbsp;3. <b>Base branch</b> (hedef): Birleştirmek istediğiniz branch. Örn: "main".',
            '&nbsp;&nbsp;4. PR başlığı yazın. Örn: "Kullanıcı giriş sistemi eklendi".',
            '&nbsp;&nbsp;5. Açıklama yazın (ne yaptığınızı detaylıca anlatın).',
            '&nbsp;&nbsp;6. "Oluştur" butonuna tıklayın.',
            '<b>PR\'ı merge etme:</b> PR listesinden PR\'a tıklayın → yeşil "Merge" butonuna tıklayın. Değişiklikler ana koda birleştirilir!',
            '<b>PR\'ı kapatma:</b> Eğer değişikliklerden vazgeçtiyseniz "Kapat" butonuyla PR\'ı iptal edebilirsiniz.',
            '<b>İpucu:</b> Tek başınıza çalışsanız bile PR kullanmanız iyi bir alışkanlıktır. Değişikliklerinizin geçmişini temiz tutar.'
          ]
        },
        {
          title: '🐛 Issue (Görev/Hata) Yönetimi',
          desc: 'Issue\'lar, projenizdeki hataları, istekleri ve yapılacak görevleri takip etmek için kullanılır.',
          details: [
            '<b>Issue ne işe yarar?</b> — Bir to-do listesi gibi düşünün. "Şu hatayı düzelt", "Bu özelliği ekle", "Şu testi yaz" gibi görevleri takip edersiniz.',
            '<b>Issue sayfası nerede?</b> — Sol menüde 🐛 ikonuna tıklayın.',
            '<b>Yeni issue oluşturma:</b>',
            '&nbsp;&nbsp;1. "Yeni Issue" butonuna tıklayın.',
            '&nbsp;&nbsp;2. Başlık yazın. Örn: "Login sayfası hata veriyor".',
            '&nbsp;&nbsp;3. Açıklama yazın (detaylı anlatın, ekran görüntüsü de ekleyebilirsiniz). Markdown desteklenir!',
            '&nbsp;&nbsp;4. Etiket (label) ekleyin: "bug" (hata), "enhancement" (geliştirme), "documentation" (belgeleme) gibi.',
            '&nbsp;&nbsp;5. "Oluştur" butonuna tıklayın.',
            '<b>Issue detayı:</b> Bir issue\'ya tıklayın → açıklamasını okuyun → yorum ekleyerek tartışabilirsiniz.',
            '<b>Issue kapatma:</b> Görev tamamlandığında "Kapat" butonuna tıklayın. Kapatılmış issue\'lar silinmez, arşivde kalır.',
            '<b>İpucu:</b> Commit mesajınıza "Fixes #5" yazarsanız, o commit merge edildiğinde 5 numaralı issue otomatik kapanır!'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 5: İLERİ SEVİYE ÖZELLİKLER',
      color: '#f778ba',
      tutorials: [
        {
          title: '⚡ GitHub Actions (CI/CD Otomasyonu)',
          desc: 'Kod push ettiğinizde testleri otomatik çalıştırın, projeyi derleyin ve dağıtın.',
          details: [
            '<b>Actions ne işe yarar?</b> — Her commit push ettiğinizde otomatik olarak testleri çalıştırabilir, projeyi derleyebilir veya bir sunucuya deploy edebilirsiniz.',
            '<b>Actions sayfası nerede?</b> — Sol menüde ⚡ ikonuna tıklayın.',
            '<b>Ne görürsünüz?</b>',
            '&nbsp;&nbsp;• <b>Workflow listesi</b> — Tanımlı iş akışları (.github/workflows klasöründeki YAML dosyaları).',
            '&nbsp;&nbsp;• <b>Run geçmişi</b> — Her çalışmanın durumu: ✅ başarılı, ❌ başarısız, 🔄 devam ediyor.',
            '&nbsp;&nbsp;• <b>Süre</b> — Her çalışmanın ne kadar sürdüğü.',
            '<b>Nasıl çalışır?</b> — Reponuzda <code>.github/workflows/</code> klasörüne bir YAML dosyası eklersiniz. GitHub bu dosyayı okur ve belirttiğiniz olaylarda (push, PR, zamanlama vb.) otomatik çalıştırır.',
            '<b>İpucu:</b> Actions sayfa yalnızca görüntüleme içindir. Workflow oluşturmak için reponuza YAML dosyası eklemeniz gerekir.'
          ]
        },
        {
          title: '🚀 Release (Sürüm) Yayınlama',
          desc: 'Projenizin belirli bir sürümünü paketleyip kullanıcılara sunun.',
          details: [
            '<b>Release ne işe yarar?</b> — Projenizin "v1.0.0" gibi bir sürümünü resmi olarak yayınlarsınız. Kullanıcılar bu sürümü indirebilir.',
            '<b>Release sayfası nerede?</b> — Sol menüde 🚀 ikonuna tıklayın.',
            '<b>Yeni release oluşturma:</b>',
            '&nbsp;&nbsp;1. "Yeni Release" butonuna tıklayın.',
            '&nbsp;&nbsp;2. <b>Tag adı</b> girin. Örn: "v1.0.0". Semantic Versioning kullanın: major.minor.patch.',
            '&nbsp;&nbsp;3. <b>Release başlığı</b> yazın. Örn: "İlk Kararlı Sürüm".',
            '&nbsp;&nbsp;4. <b>Release notları</b> yazın. Neler değişti, neler eklendi anlatın.',
            '&nbsp;&nbsp;5. Gerekirse "Draft" (taslak) veya "Pre-release" (ön sürüm) işaretleyin.',
            '&nbsp;&nbsp;6. "Oluştur" butonuna tıklayın.',
            '<b>Versiyon numaralama:</b>',
            '&nbsp;&nbsp;• <b>v1.0.0 → v1.0.1</b>: Küçük hata düzeltmesi (patch).',
            '&nbsp;&nbsp;• <b>v1.0.0 → v1.1.0</b>: Yeni özellik eklendi (minor).',
            '&nbsp;&nbsp;• <b>v1.0.0 → v2.0.0</b>: Büyük/uyumsuz değişiklik (major).'
          ]
        },
        {
          title: '📋 Gist (Kod Parçacığı) Paylaşma',
          desc: 'Kısa kod parçacıklarını hızlıca paylaşmak için Gist kullanın.',
          details: [
            '<b>Gist ne işe yarar?</b> — Tam bir repo oluşturmak istemediğiniz küçük kod parçacıkları için idealdir. Bir config dosyası, script, not veya şablon paylaşmak istediğinizde kullanın.',
            '<b>Gist sayfası nerede?</b> — Sol menüde 📋 ikonuna tıklayın.',
            '<b>Yeni gist oluşturma:</b>',
            '&nbsp;&nbsp;1. "Yeni Gist" butonuna tıklayın.',
            '&nbsp;&nbsp;2. <b>Açıklama</b> yazın. Örn: "Python sıralama algoritması".',
            '&nbsp;&nbsp;3. <b>Dosya adı</b> girin. Örn: "sort.py" (uzantı önemli, renklendirme için).',
            '&nbsp;&nbsp;4. <b>İçerik</b> alanına kodunuzu yapıştırın.',
            '&nbsp;&nbsp;5. <b>Public</b> (herkes görebilir) veya <b>Secret</b> (link bilenler görebilir) seçin.',
            '&nbsp;&nbsp;6. "Oluştur" butonuna tıklayın.',
            '<b>İpucu:</b> Secret gist\'ler tamamen gizli DEĞİLDİR — linki olan herkes görebilir. Sadece arama motorlarında çıkmaz.'
          ]
        },
        {
          title: '📂 Yerel Repo: Clone ve Git Init',
          desc: 'Bilgisayarınızdaki klasörleri Git ile yönetin, GitHub repolarını klonlayın.',
          details: [
            '<b>Yerel repo sayfası nerede?</b> — Sol menüde 📂 ikonuna tıklayın.',
            '<b>Clone (Klonlama) nedir?</b> — GitHub\'daki bir repoyu bilgisayarınıza indirirsiniz. İndirdikten sonra dosyaları düzenleyebilir, commit yapabilir ve tekrar GitHub\'a push edebilirsiniz.',
            '<b>Clone işlemi:</b>',
            '&nbsp;&nbsp;1. "Clone" sekmesini seçin.',
            '&nbsp;&nbsp;2. Repo URL\'sini girin. Örn: https://github.com/kullaniciadi/repo-adi.git',
            '&nbsp;&nbsp;3. Hedef klasörü seçin (reponun indirileceği yer).',
            '&nbsp;&nbsp;4. "Clone" butonuna tıklayın. Dosyalar indirilecektir.',
            '<b>Git Init nedir?</b> — Bilgisayarınızdaki mevcut bir klasörü Git reposuna dönüştürür.',
            '<b>Git Init işlemi:</b>',
            '&nbsp;&nbsp;1. "Init" sekmesini seçin.',
            '&nbsp;&nbsp;2. Klasör seçin.',
            '&nbsp;&nbsp;3. "Init" butonuna tıklayın. Artık o klasördeki değişiklikleri Git ile takip edebilirsiniz.',
            '<b>Clone/Init sonrası ne yapılır?</b>',
            '&nbsp;&nbsp;• <b>Status:</b> Hangi dosyalar değişmiş gösterir.',
            '&nbsp;&nbsp;• <b>Stage:</b> Commit\'e dahil edilecek dosyaları seçin.',
            '&nbsp;&nbsp;• <b>Commit:</b> Değişiklikleri kaydedin.',
            '&nbsp;&nbsp;• <b>Push:</b> Commit\'leri GitHub\'a gönderin.',
            '&nbsp;&nbsp;• <b>Pull:</b> GitHub\'daki değişiklikleri bilgisayarınıza çekin.'
          ]
        },
        {
          title: '👥 İşbirlikçi (Collaborator) Yönetimi',
          desc: 'Reponuza başka insanları davet edin ve birlikte çalışın.',
          details: [
            '<b>İşbirlikçi nedir?</b> — Reponuza erişim izni verdiğiniz kişilerdir. Private repoya sadece siz ve işbirlikçileriniz erişebilir.',
            '<b>İşbirlikçiler sayfası nerede?</b> — Sol menüde 👥 ikonuna tıklayın.',
            '<b>Yeni işbirlikçi ekleme:</b>',
            '&nbsp;&nbsp;1. "Ekle" butonuna tıklayın.',
            '&nbsp;&nbsp;2. Kişinin GitHub kullanıcı adını girin.',
            '&nbsp;&nbsp;3. Yetki seviyesi seçin:',
            '&nbsp;&nbsp;&nbsp;&nbsp;• <b>Read</b> — Sadece okuyabilir (kodu görebilir ama değiştiremez).',
            '&nbsp;&nbsp;&nbsp;&nbsp;• <b>Write</b> — Okuyabilir ve yazabilir (commit, push yapabilir).',
            '&nbsp;&nbsp;&nbsp;&nbsp;• <b>Admin</b> — Her şeyi yapabilir (ayarları değiştirme, kişi ekleme dahil).',
            '&nbsp;&nbsp;4. Davet gönderilir. Karşı taraf kabul ettiğinde erişim başlar.',
            '<b>İşbirlikçi çıkarma:</b> Listeden kişinin yanındaki kaldır butonuna tıklayın.'
          ]
        },
        {
          title: '🗂️ Dosya Tarayıcı',
          desc: 'Bir reponun dosya ve klasörlerini tarayıcıda görüntüleyin.',
          details: [
            '<b>Dosya tarayıcı nerede?</b> — Sol menüde 🗂️ ikonuna tıklayın. (Önce bir repo seçili olmalı!)',
            '<b>Nasıl kullanılır?</b>',
            '&nbsp;&nbsp;• Klasörlere tıklayarak içlerine girin.',
            '&nbsp;&nbsp;• Dosyalara tıklayarak içeriklerini görüntüleyin.',
            '&nbsp;&nbsp;• Üstteki breadcrumb (yol çubuğu) ile üst dizinlere dönün.',
            '<b>Ne görürsünüz?</b> — Dosya/klasör adı, boyutu ve son değişiklik tarihi gösterilir. Klasörler 📁 ikonu, dosyalar 📄 ikonu ile gösterilir.'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 6: DİĞER ÖZELLİKLER',
      color: '#79c0ff',
      tutorials: [
        {
          title: '⭐ Yıldızlar (Stars)',
          desc: 'Beğendiğiniz repoları yıldızlayarak yer imi gibi saklayın.',
          details: [
            '<b>Yıldız ne işe yarar?</b> — Beğendiğiniz veya ilerde bakmak istediğiniz repoları işaretlersiniz. Yer imi gibidir.',
            '<b>Yıldızlar sayfası nerede?</b> — Sol menüde ⭐ ikonuna tıklayın. Yıldızladığınız tüm repolar burada listelenir.',
            '<b>Bir repoya yıldız nasıl verilir?</b> — Arama sayfasından bir repo bulun, detaylarında "Yıldız Ekle" butonunu kullanın.',
            '<b>Yıldızı kaldırma:</b> Aynı butonla yıldızı geri alabilirsiniz.'
          ]
        },
        {
          title: '🔔 Bildirimler',
          desc: 'GitHub\'dan gelen tüm bildirimleri takip edin.',
          details: [
            '<b>Bildirimler sayfası nerede?</b> — Sol menüde 🔔 ikonuna tıklayın.',
            '<b>Hangi olaylar bildirim oluşturur?</b>',
            '&nbsp;&nbsp;• İzlediğiniz (watch) bir repoya yeni issue/PR açılması.',
            '&nbsp;&nbsp;• Size atanan (assigned) issue/PR\'lar.',
            '&nbsp;&nbsp;• Yorum yapılan konuşmalar.',
            '&nbsp;&nbsp;• PR inceleme istekleri (review request).',
            '<b>Bildirim okundu işaretleme:</b> Bir bildirimin yanındaki "Okundu" butonuna tıklayın.',
            '<b>İpucu:</b> Bildirimlerinizi düzenli kontrol edin, özellikle ekip projelerinde!'
          ]
        },
        {
          title: '🔍 GitHub Arama',
          desc: 'GitHub\'ın devasa veritabanında repo ve kullanıcı arayın.',
          details: [
            '<b>Arama sayfası nerede?</b> — Sol menüde 🔍 ikonuna tıklayın.',
            '<b>Nasıl aranır?</b>',
            '&nbsp;&nbsp;1. Arama kutusuna aranacak kelimeyi yazın. Örn: "react todo app".',
            '&nbsp;&nbsp;2. Filtre seçin: <b>Repolar</b> veya <b>Kullanıcılar</b>.',
            '&nbsp;&nbsp;3. "Ara" butonuna tıklayın veya Enter\'a basın.',
            '&nbsp;&nbsp;4. Sonuçlar kartlar halinde gösterilir.',
            '<b>Repo sonuçlarında ne var?</b> — Repo adı, açıklaması, yıldız sayısı, fork sayısı, kullanılan dil.',
            '<b>Kullanıcı sonuçlarında ne var?</b> — Kullanıcı adı, profil fotosu, bio.',
            '<b>İpucu:</b> Spesifik arama yapın. "javascript" yerine "javascript calculator beginner" aratmak daha iyi sonuç verir.'
          ]
        },
        {
          title: '🏢 Organizasyonlar',
          desc: 'Üye olduğunuz GitHub organizasyonlarını görüntüleyin.',
          details: [
            '<b>Organizasyon nedir?</b> — Şirketler veya ekipler, birey hesaplarının yanı sıra organizasyon hesapları oluşturabilir. Repolar bu ortak hesap altında tutulur.',
            '<b>Organizasyonlar sayfası nerede?</b> — Sol menüde 🏢 ikonuna tıklayın.',
            '<b>Ne görürsünüz?</b> — Üye olduğunuz tüm organizasyonların listesi, logoları ve açıklamaları.'
          ]
        },
        {
          title: '👤 Profil Sayfası',
          desc: 'GitHub profilinizi, istatistiklerinizi ve takipçilerinizi görün.',
          details: [
            '<b>Profil sayfası nerede?</b> — Sol menüde 👤 ikonuna tıklayın.',
            '<b>Ne görürsünüz?</b>',
            '&nbsp;&nbsp;• <b>Profil fotosu ve bio</b>.',
            '&nbsp;&nbsp;• <b>İstatistikler</b>: Repo sayısı, gist sayısı, takipçi/takip edilen sayıları.',
            '&nbsp;&nbsp;• <b>Ek bilgiler</b>: Şirket, konum, e-posta, web sitesi, katılım tarihi.',
            '&nbsp;&nbsp;• <b>Takipçi listesi</b>: Sizi takip eden kullanıcılar.',
            '<b>Profil düzenleme:</b> Profil bilgilerinizi değiştirmek için github.com\'daki ayarlarınızı kullanın.'
          ]
        },
        {
          title: '⚙️ Tema ve Ayarlar',
          desc: 'Vulpax\'ın görünümünü özelleştirin.',
          details: [
            '<b>Ayarlar sayfası nerede?</b> — Sol menüde ⚙️ ikonuna tıklayın.',
            '<b>Tema seçenekleri:</b>',
            '&nbsp;&nbsp;• <b>Dark</b> — GitHub\'ın karanlık teması. Varsayılan tema.',
            '&nbsp;&nbsp;• <b>Dark Dimmed</b> — Daha yumuşak karanlık tema. Göz yorgunluğu için.',
            '&nbsp;&nbsp;• <b>Light</b> — Açık (beyaz) tema. Gündüz kullanımı için.',
            '<b>Tema nasıl değiştirilir?</b> — Tema kartına tıklayın. Seçiminiz otomatik kaydedilir ve anında uygulanır.',
            '<b>Çıkış yapma:</b> Ayarlar sayfasının altında "Çıkış Yap" butonu var. Token silinir ve giriş ekranına dönersiniz.',
            '<b>Uygulama bilgileri:</b> Versiyon numarası ve diğer bilgiler ayarlar sayfasında gösterilir.'
          ]
        }
      ]
    },
    {
      chapter: 'BÖLÜM 7: EN ÇOK SORULAN SORULAR',
      color: '#e3b341',
      tutorials: [
        {
          title: '❓ Sık Sorulan Sorular (SSS)',
          desc: 'Yeni başlayanların en çok sorduğu sorular ve cevapları.',
          details: [
            '<b>S: Token\'ımı kaybettim, ne yapacağım?</b>',
            'C: GitHub\'a gidin → Settings → Developer settings → Personal access tokens → Eski token\'ı silin ve yeni bir tane oluşturun.',
            '<b>S: Repo seçmeden neden bazı sayfalar boş?</b>',
            'C: Branch, Commit, PR, Issue, Dosyalar gibi sayfalar bir repo ile çalışır. Önce "Repolar" sayfasından bir repo seçmelisiniz.',
            '<b>S: Public ve Private ne demek?</b>',
            'C: Public repo herkes tarafından görülebilir. Private repo sadece siz ve davet ettiğiniz kişiler görebilir. İkisi de ücretsiz!',
            '<b>S: Fork ile Clone arasındaki fark nedir?</b>',
            'C: Fork = Başkasının reposunu kendi hesabınıza kopyalama (GitHub üzerinde). Clone = Bir repoyu bilgisayarınıza indirme.',
            '<b>S: Main ve Master arasındaki fark nedir?</b>',
            'C: İkisi de varsayılan branch ismidir. Eskiden "master" kullanılıyordu, şimdi "main" standart oldu. İşlev olarak hiçbir farkı yok.',
            '<b>S: Silinen repo geri gelir mi?</b>',
            'C: Hayır! Repo silme işlemi geri alınamaz. Silmeden önce iki kez düşünün.',
            '<b>S: GitHub Actions ücretsiz mi?</b>',
            'C: Public repolar için tamamen ücretsiz. Private repolar için aylık 2000 dakika ücretsiz kullanım hakkınız var.',
            '<b>S: Markdown nedir?</b>',
            'C: Düz metin ile basit biçimlendirme yapmanızı sağlayan bir sözdizimi. # ile başlık, ** ile kalın, - ile liste oluşturursunuz. Issue ve PR açıklamalarında kullanılır.',
            '<b>S: .gitignore nedir?</b>',
            'C: Git\'in takip etmemesi gereken dosyaları belirttiğiniz bir dosyadır. Örn: node_modules/, .env gibi dosyalar genelde .gitignore\'a eklenir.'
          ]
        }
      ]
    }
  ];
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          GitHub Öğreticiler — Sıfırdan Herşey
        </h1>
        <p class="page-subtitle">GitHub'ı hiç bilmiyormuş gibi, adım adım, her buton ve her kavram açıklanıyor.</p>
      </div>
      
      ${chapters.map(ch => `
        <div style="margin-bottom: 32px;">
          <h2 style="color: ${ch.color}; font-size: 1.1rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${ch.color}33;">
            ${ch.chapter}
          </h2>
          ${ch.tutorials.map(t => `
            <div class="tutorial-card" style="border-left: 3px solid ${ch.color};">
              <h3>${t.title}</h3>
              <p style="color: var(--text-secondary); margin-bottom: 12px;">${escapeHtml(t.desc)}</p>
              <div class="tutorial-steps">
                ${t.details.map(d => '<div style="padding: 6px 0; line-height: 1.6; border-bottom: 1px solid var(--border-subtle, var(--border-default)); color: var(--text-primary);">' + d + '</div>').join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================
// SETTINGS
// ==========================================

async function renderSettings() {
  const content = document.getElementById('content');
  const currentTheme = await V.getSetting('theme') || 'dark';
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          Ayarlar
        </h1>
      </div>
      
      <div class="settings-section">
        <h3>
          <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Tema
        </h3>
        <div class="theme-grid">
          <div class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" onclick="changeTheme('dark')">
            <div class="theme-preview" style="background: linear-gradient(135deg, #0d1117 50%, #161b22 50%);"></div>
            <div class="theme-name">Dark</div>
          </div>
          <div class="theme-option ${currentTheme === 'dimmed' ? 'active' : ''}" onclick="changeTheme('dimmed')">
            <div class="theme-preview" style="background: linear-gradient(135deg, #22272e 50%, #2d333b 50%);"></div>
            <div class="theme-name">Dark Dimmed</div>
          </div>
          <div class="theme-option ${currentTheme === 'light' ? 'active' : ''}" onclick="changeTheme('light')">
            <div class="theme-preview" style="background: linear-gradient(135deg, #ffffff 50%, #f6f8fa 50%);"></div>
            <div class="theme-name">Light</div>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          Hesap
        </h3>
        <div class="card">
          <div class="flex-row gap-md">
            <img src="${escapeHtml(currentUser?.avatar_url || '')}" width="48" height="48" style="border-radius:50%;">
            <div>
              <div class="font-bold">${escapeHtml(currentUser?.name || currentUser?.login || '')}</div>
              <div class="text-sm text-muted">@${escapeHtml(currentUser?.login || '')}</div>
            </div>
            <button class="btn btn-danger" style="margin-left:auto;" onclick="doLogout()">Çıkış Yap</button>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>
          <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Hakkında
        </h3>
        <div class="card">
          <div class="flex-row gap-md" style="align-items:flex-start;">
            <img src="../assets/logovulpax.png" width="56" height="56" style="border-radius:12px;">
            <div>
              <h3 style="font-size:20px;font-weight:800;background:linear-gradient(135deg,var(--accent),#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Vulpax Git Client</h3>
              <p class="text-sm text-muted mt-sm">Sürüm 1.0.0</p>
              <p class="text-sm text-muted mt-sm">Modern, hızlı ve güçlü GitHub masaüstü istemcisi.</p>
              <p class="text-sm text-muted mt-sm">Vulpax Digital © ${new Date().getFullYear()}</p>
              <p class="text-sm text-muted mt-sm">Electron + GitHub API + Simple Git</p>
              <div class="flex-row gap-sm mt-sm">
                <span class="badge badge-accent">Ctrl+K → Arama</span>
                <span class="badge badge-accent">Ctrl+N → Bildirimler</span>
                <span class="badge badge-accent">Ctrl+1-6 → Sayfa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function changeTheme(theme) {
  await setTheme(theme);
  toast(`Tema değiştirildi: ${theme}`, 'success');
  renderSettings();
}

// ==========================================
// NEW FEATURES: REPO DETAIL PAGE
// ==========================================

async function showRepoDetail(owner, name) {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const [repoRes, langRes, topicsRes, contribRes] = await Promise.all([
    V.getRepo(owner, name),
    V.getLanguages(owner, name),
    V.getTopics(owner, name),
    V.listContributors(owner, name)
  ]);
  
  const repo = repoRes.success ? repoRes.repo : null;
  if (!repo) return content.innerHTML = '<p class="text-danger">Repo yüklenemedi</p>';
  
  const langs = langRes.success ? langRes.languages : {};
  const topics = topicsRes.success ? topicsRes.topics : [];
  const contribs = contribRes.success ? contribRes.contributors : [];
  
  const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);
  const langColors = { JavaScript: '#f1e05a', Python: '#3572A5', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', 'C++': '#f34b7d', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89e051' };
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('repo')} ${escapeHtml(repo.full_name)}</h1>
          <p class="page-subtitle">${escapeHtml(repo.description || 'Açıklama yok')}</p>
        </div>
        <div class="page-actions">
          <button class="btn" onclick="openRepoInBrowser('${escapeHtml(owner)}','${escapeHtml(name)}')" title="Tarayıcıda Aç">${svgIcon('link')} Tarayıcıda Aç</button>
          <button class="btn" onclick="copyCloneUrl('${escapeHtml(repo.clone_url)}')" title="Clone URL Kopyala">${svgIcon('copy')} Clone URL</button>
          <button class="btn btn-primary" onclick="selectRepoAndGo('${escapeHtml(owner)}','${escapeHtml(name)}')">${svgIcon('branch')} Branch'lere Git</button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon orange">${svgIcon('star')}</div><div class="stat-info"><div class="stat-number">${repo.stargazers_count}</div><div class="stat-label">Yıldız</div></div></div>
        <div class="stat-card"><div class="stat-icon blue">${svgIcon('fork')}</div><div class="stat-info"><div class="stat-number">${repo.forks_count}</div><div class="stat-label">Fork</div></div></div>
        <div class="stat-card"><div class="stat-icon green">${svgIcon('eye')}</div><div class="stat-info"><div class="stat-number">${repo.watchers_count}</div><div class="stat-label">Watcher</div></div></div>
        <div class="stat-card"><div class="stat-icon purple">${svgIcon('issue')}</div><div class="stat-info"><div class="stat-number">${repo.open_issues_count}</div><div class="stat-label">Açık Issue</div></div></div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Bilgiler</h3>
          <button class="btn btn-sm" onclick="showEditRepoModal('${escapeHtml(owner)}','${escapeHtml(name)}','${escapeHtml(repo.description || '')}',${repo.private})">${svgIcon('file')} Düzenle</button>
        </div>
        <div class="flex-row gap-lg flex-wrap text-sm" style="padding:12px 16px;">
          <span><b>Dil:</b> ${escapeHtml(repo.language || '-')}</span>
          <span><b>Lisans:</b> ${escapeHtml(repo.license?.name || 'Yok')}</span>
          <span><b>Boyut:</b> ${formatSize(repo.size * 1024)}</span>
          <span><b>Varsayılan Branch:</b> ${escapeHtml(repo.default_branch)}</span>
          <span><b>Oluşturulma:</b> ${new Date(repo.created_at).toLocaleDateString('tr-TR')}</span>
          <span><b>Son Güncelleme:</b> ${timeAgo(repo.updated_at)}</span>
          <span class="badge ${repo.private ? 'badge-danger' : 'badge-success'}">${repo.private ? 'Private' : 'Public'}</span>
          ${repo.fork ? '<span class="badge badge-info">Fork</span>' : ''}
          ${repo.archived ? '<span class="badge badge-warning">Arşivlenmiş</span>' : ''}
        </div>
      </div>
      
      ${topics.length > 0 ? `
        <div class="card">
          <div class="card-header"><h3 class="card-title">Konular (Topics)</h3>
            <button class="btn btn-sm" onclick="showEditTopicsModal('${escapeHtml(owner)}','${escapeHtml(name)}','${escapeHtml(topics.join(','))}')">${svgIcon('file')} Düzenle</button>
          </div>
          <div class="flex-row gap-sm flex-wrap" style="padding:12px 16px;">
            ${topics.map(t => `<span class="badge badge-accent">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-header"><h3 class="card-title">Konular (Topics)</h3></div>
          <div style="padding:12px 16px;">
            <p class="text-muted text-sm">Henüz konu eklenmemiş.</p>
            <button class="btn btn-sm mt-sm" onclick="showEditTopicsModal('${escapeHtml(owner)}','${escapeHtml(name)}','')">${svgIcon('plus')} Konu Ekle</button>
          </div>
        </div>
      `}
      
      ${totalBytes > 0 ? `
        <div class="card">
          <div class="card-header"><h3 class="card-title">Dil İstatistikleri</h3></div>
          <div style="padding:12px 16px;">
            <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:12px;">
              ${Object.entries(langs).map(([lang, bytes]) => `<div style="width:${(bytes/totalBytes*100).toFixed(1)}%;background:${langColors[lang] || '#8b949e'}" title="${escapeHtml(lang)}: ${(bytes/totalBytes*100).toFixed(1)}%"></div>`).join('')}
            </div>
            <div class="flex-row gap-md flex-wrap text-sm">
              ${Object.entries(langs).map(([lang, bytes]) => `<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${langColors[lang] || '#8b949e'};margin-right:4px;"></span>${escapeHtml(lang)} <span class="text-muted">${(bytes/totalBytes*100).toFixed(1)}%</span></span>`).join('')}
            </div>
          </div>
        </div>
      ` : ''}
      
      ${contribs.length > 0 ? `
        <div class="card">
          <div class="card-header"><h3 class="card-title">Katkıda Bulunanlar (${contribs.length})</h3></div>
          <div class="flex-row gap-sm flex-wrap" style="padding:12px 16px;">
            ${contribs.slice(0, 30).map(c => `
              <div style="text-align:center;padding:6px;cursor:pointer;" onclick="showUserProfile('${escapeHtml(c.login)}')" title="${escapeHtml(c.login)} (${c.contributions} commit)">
                <img src="${escapeHtml(c.avatar_url)}" width="36" height="36" style="border-radius:50%;display:block;margin:0 auto 4px;">
                <span class="text-sm">${escapeHtml(c.login)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="flex-row gap-md flex-wrap">
        <button class="btn btn-danger" onclick="deleteRepoAction('${escapeHtml(owner)}','${escapeHtml(name)}')">${svgIcon('trash')} Repo Sil</button>
        <button class="btn" onclick="forkRepoAction('${escapeHtml(owner)}','${escapeHtml(name)}')">${svgIcon('fork')} Fork</button>
        <button class="btn" onclick="toggleRepoVisibility('${escapeHtml(owner)}','${escapeHtml(name)}',${repo.private})">${repo.private ? svgIcon('unlock') + ' Public Yap' : svgIcon('lock') + ' Private Yap'}</button>
      </div>
    </div>
  `;
}

function openRepoInBrowser(owner, name) {
  V.openExternal('https://github.com/' + owner + '/' + name);
}

function copyCloneUrl(url) {
  navigator.clipboard.writeText(url);
  toast('Clone URL kopyalandı!', 'success');
}

function showEditRepoModal(owner, name, desc, isPrivate) {
  openModal('Repo Düzenle', `
    <div class="input-group"><label>Açıklama</label><textarea id="edit-repo-desc">${escapeHtml(desc)}</textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doEditRepo('${escapeHtml(owner)}','${escapeHtml(name)}')">Kaydet</button>
  `);
}

async function doEditRepo(owner, name) {
  const desc = document.getElementById('edit-repo-desc').value.trim();
  const result = await V.updateRepo(owner, name, { description: desc });
  if (result.success) { toast('Repo güncellendi', 'success'); closeModal(); showRepoDetail(owner, name); }
  else toast('Hata: ' + result.error, 'error');
}

function showEditTopicsModal(owner, name, currentTopics) {
  openModal('Konuları Düzenle', `
    <div class="input-group"><label>Konular (virgülle ayır)</label><input type="text" id="edit-topics" value="${escapeHtml(currentTopics)}" placeholder="javascript, react, web"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doEditTopics('${escapeHtml(owner)}','${escapeHtml(name)}')">Kaydet</button>
  `);
}

async function doEditTopics(owner, name) {
  const topics = document.getElementById('edit-topics').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const result = await V.replaceTopics(owner, name, topics);
  if (result.success) { toast('Konular güncellendi', 'success'); closeModal(); showRepoDetail(owner, name); }
  else toast('Hata: ' + result.error, 'error');
}

async function deleteRepoAction(owner, name) {
  if (!confirm(`"${owner}/${name}" reposunu SİLMEK istediğinize emin misiniz?\n\nBU İŞLEM GERİ ALINAMAZ!`)) return;
  if (!confirm('GERÇEKTEN emin misiniz? Bu repo kalıcı olarak silinecektir.')) return;
  const result = await V.deleteRepo(owner, name);
  if (result.success) { toast('Repo silindi', 'success'); navigateTo('repos'); }
  else toast('Hata: ' + result.error, 'error');
}

async function forkRepoAction(owner, name) {
  toast('Fork oluşturuluyor...', 'info');
  const result = await V.forkRepo(owner, name);
  if (result.success) { toast('Fork oluşturuldu!', 'success'); }
  else toast('Hata: ' + result.error, 'error');
}

async function toggleRepoVisibility(owner, name, isPrivate) {
  const newVisibility = !isPrivate;
  if (!confirm(`Repo ${newVisibility ? 'private' : 'public'} yapılacak. Devam edilsin mi?`)) return;
  const result = await V.updateRepo(owner, name, { private: newVisibility });
  if (result.success) { toast('Görünürlük değiştirildi', 'success'); showRepoDetail(owner, name); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: COMPARE BRANCHES
// ==========================================

async function showCompareModal() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const branchRes = await V.listBranches(selectedRepo.owner, selectedRepo.name);
  const branches = branchRes.success ? branchRes.branches : [];
  
  openModal('Branch Karşılaştır', `
    <div class="input-group"><label>Base (hedef) branch</label>
      <select id="compare-base">${branches.map(b => `<option value="${escapeHtml(b.name)}" ${b.name === 'main' || b.name === 'master' ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}</select>
    </div>
    <div class="input-group"><label>Head (kaynak) branch</label>
      <select id="compare-head">${branches.map(b => `<option value="${escapeHtml(b.name)}">${escapeHtml(b.name)}</option>`).join('')}</select>
    </div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCompare()">Karşılaştır</button>
  `);
}

async function doCompare() {
  const base = document.getElementById('compare-base').value;
  const head = document.getElementById('compare-head').value;
  if (base === head) return toast('Aynı branch seçilemez', 'error');
  
  closeModal();
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.compareCommits(selectedRepo.owner, selectedRepo.name, base, head);
  if (!result.success) return content.innerHTML = `<p class="text-danger">Hata: ${escapeHtml(result.error)}</p>`;
  
  const cmp = result.comparison;
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('branch')} Branch Karşılaştırma</h1>
          <p class="page-subtitle">${escapeHtml(base)} ← ${escapeHtml(head)} · ${cmp.ahead_by} commit ileri, ${cmp.behind_by} commit geri</p>
        </div>
        <button class="btn" onclick="renderBranches()">Geri</button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon green">${svgIcon('commit')}</div><div class="stat-info"><div class="stat-number">${cmp.total_commits}</div><div class="stat-label">Commit</div></div></div>
        <div class="stat-card"><div class="stat-icon blue">${svgIcon('file')}</div><div class="stat-info"><div class="stat-number">${cmp.files?.length || 0}</div><div class="stat-label">Dosya Değişti</div></div></div>
      </div>
      
      <div class="card" style="padding:0;">
        <div class="card-header" style="padding:16px;"><h3 class="card-title">Commit'ler</h3></div>
        ${(cmp.commits || []).map(c => `
          <div class="commit-item">
            <div class="commit-dot"></div>
            <div class="commit-info">
              <div class="commit-message">${escapeHtml(c.commit.message.split('\n')[0])}</div>
              <div class="commit-meta"><span class="commit-sha">${c.sha.substring(0, 7)}</span><span>${escapeHtml(c.commit.author?.name || '')}</span><span>${timeAgo(c.commit.author?.date)}</span></div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Değişen Dosyalar</h3></div>
        ${(cmp.files || []).slice(0, 50).map(f => `
          <div class="diff-block">
            <div class="diff-header">${escapeHtml(f.filename)} <span class="text-success">+${f.additions}</span> <span class="text-danger">-${f.deletions}</span> <span class="badge">${escapeHtml(f.status)}</span></div>
            ${f.patch ? f.patch.split('\n').slice(0, 20).map(line => {
              let cls = '';
              if (line.startsWith('+')) cls = 'diff-add';
              else if (line.startsWith('-')) cls = 'diff-remove';
              else if (line.startsWith('@@')) cls = 'diff-info';
              return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
            }).join('') : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// NEW FEATURES: PR DETAIL (REVIEWS + FILES)
// ==========================================

async function showPRDetail(num) {
  if (!selectedRepo) return;
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const [prRes, reviewsRes, filesRes] = await Promise.all([
    V.listPRs(selectedRepo.owner, selectedRepo.name, 'all'),
    V.listPRReviews(selectedRepo.owner, selectedRepo.name, num),
    V.listPRFiles(selectedRepo.owner, selectedRepo.name, num)
  ]);
  
  const pr = prRes.success ? prRes.prs.find(p => p.number === num) : null;
  const reviews = reviewsRes.success ? reviewsRes.reviews : [];
  const files = filesRes.success ? filesRes.files : [];
  
  if (!pr) return content.innerHTML = '<p class="text-danger">PR bulunamadı</p>';
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">${svgIcon('pr')} #${pr.number} ${escapeHtml(pr.title)}</h1>
          <p class="page-subtitle">${escapeHtml(pr.user?.login || '')} · ${escapeHtml(pr.head?.ref || '')} → ${escapeHtml(pr.base?.ref || '')}</p>
        </div>
        <div class="page-actions">
          ${pr.state === 'open' ? `
            <button class="btn btn-success" onclick="mergePR(${pr.number})">${svgIcon('merge')} Merge</button>
            <button class="btn btn-danger" onclick="closePR(${pr.number})">${svgIcon('x')} Kapat</button>
          ` : pr.state === 'closed' && !pr.merged_at ? `
            <button class="btn btn-success" onclick="reopenPRAction(${pr.number})">Yeniden Aç</button>
          ` : ''}
          <button class="btn" onclick="renderPullRequests()">Geri</button>
        </div>
      </div>
      
      <div class="flex-row gap-sm mb-md">
        <span class="badge ${pr.state === 'open' ? 'badge-success' : pr.merged_at ? 'badge-purple' : 'badge-danger'}">${pr.merged_at ? 'Merged' : pr.state}</span>
        <span class="text-sm text-muted">${timeAgo(pr.created_at)}</span>
      </div>
      
      ${pr.body ? `<div class="card"><div style="padding:16px;white-space:pre-wrap;word-break:break-word;">${escapeHtml(pr.body)}</div></div>` : ''}
      
      ${reviews.length > 0 ? `
        <div class="card">
          <div class="card-header"><h3 class="card-title">Review'lar (${reviews.length})</h3></div>
          ${reviews.map(r => `
            <div class="list-item">
              <img src="${escapeHtml(r.user?.avatar_url || '')}" width="28" height="28" style="border-radius:50%;">
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(r.user?.login || '')}</div>
                <div class="list-item-subtitle">${escapeHtml(r.state)} · ${timeAgo(r.submitted_at)}</div>
              </div>
              <span class="badge ${r.state === 'APPROVED' ? 'badge-success' : r.state === 'CHANGES_REQUESTED' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(r.state)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="card">
        <div class="card-header"><h3 class="card-title">Değişen Dosyalar (${files.length})</h3></div>
        ${files.slice(0, 50).map(f => `
          <div class="diff-block">
            <div class="diff-header">${escapeHtml(f.filename)} <span class="text-success">+${f.additions}</span> <span class="text-danger">-${f.deletions}</span> <span class="badge">${escapeHtml(f.status)}</span></div>
            ${f.patch ? f.patch.split('\n').slice(0, 25).map(line => {
              let cls = '';
              if (line.startsWith('+')) cls = 'diff-add';
              else if (line.startsWith('-')) cls = 'diff-remove';
              else if (line.startsWith('@@')) cls = 'diff-info';
              return '<div class="diff-line ' + cls + '">' + escapeHtml(line) + '</div>';
            }).join('') : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function reopenPRAction(num) {
  const result = await V.reopenPR(selectedRepo.owner, selectedRepo.name, num);
  if (result.success) { toast('PR yeniden açıldı', 'success'); showPRDetail(num); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: ISSUE ENHANCEMENTS
// ==========================================

async function reopenIssue(num) {
  const result = await V.reopenIssue(selectedRepo.owner, selectedRepo.name, num);
  if (result.success) { toast('Issue yeniden açıldı', 'success'); renderIssues(); }
  else toast('Hata: ' + result.error, 'error');
}

async function showAssignIssueModal(num) {
  openModal('Issue Atama', `
    <div class="input-group"><label>Kullanıcı Adı (virgülle ayır)</label><input type="text" id="issue-assignees" placeholder="user1, user2"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doAssignIssue(${num})">Ata</button>
  `);
}

async function doAssignIssue(num) {
  const assignees = document.getElementById('issue-assignees').value.split(',').map(a => a.trim()).filter(Boolean);
  const result = await V.updateIssue(selectedRepo.owner, selectedRepo.name, num, { assignees });
  if (result.success) { toast('Atandı', 'success'); closeModal(); showIssueDetail(num); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: MILESTONE MANAGEMENT
// ==========================================

async function showMilestonesModal() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const result = await V.listMilestones(selectedRepo.owner, selectedRepo.name);
  const milestones = result.success ? result.milestones : [];
  
  openModal('Milestone\'lar', `
    <button class="btn btn-primary mb-md" onclick="showCreateMilestoneModal()">${svgIcon('plus')} Yeni Milestone</button>
    ${milestones.length === 0 ? '<p class="text-muted">Milestone bulunamadı</p>' : milestones.map(m => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(m.title)}</div>
          <div class="list-item-subtitle">${m.open_issues} açık, ${m.closed_issues} kapalı issue${m.due_on ? ' · Bitiş: ' + new Date(m.due_on).toLocaleDateString('tr-TR') : ''}</div>
          <div style="margin-top:4px;height:4px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
            <div style="width:${m.open_issues + m.closed_issues > 0 ? (m.closed_issues / (m.open_issues + m.closed_issues) * 100) : 0}%;height:100%;background:var(--success);"></div>
          </div>
        </div>
        <span class="badge ${m.state === 'open' ? 'badge-success' : 'badge-danger'}">${m.state}</span>
        <button class="btn btn-sm" onclick="toggleMilestone(${m.number},'${m.state}')">${m.state === 'open' ? 'Kapat' : 'Aç'}</button>
      </div>
    `).join('')}
  `);
}

function showCreateMilestoneModal() {
  closeModal();
  openModal('Yeni Milestone', `
    <div class="input-group"><label>Başlık</label><input type="text" id="ms-title" placeholder="Sprint 1"></div>
    <div class="input-group"><label>Açıklama</label><textarea id="ms-desc" placeholder="Milestone açıklaması"></textarea></div>
    <div class="input-group"><label>Bitiş Tarihi</label><input type="date" id="ms-due"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCreateMilestone()">Oluştur</button>
  `);
}

async function doCreateMilestone() {
  const title = document.getElementById('ms-title').value.trim();
  if (!title) return toast('Başlık gerekli', 'error');
  const due = document.getElementById('ms-due').value;
  const result = await V.createMilestone(selectedRepo.owner, selectedRepo.name, {
    title,
    description: document.getElementById('ms-desc').value.trim(),
    due_on: due ? new Date(due).toISOString() : undefined
  });
  if (result.success) { toast('Milestone oluşturuldu', 'success'); closeModal(); showMilestonesModal(); }
  else toast('Hata: ' + result.error, 'error');
}

async function toggleMilestone(num, currentState) {
  const newState = currentState === 'open' ? 'closed' : 'open';
  const result = await V.updateMilestone(selectedRepo.owner, selectedRepo.name, num, newState);
  if (result.success) { toast('Milestone güncellendi', 'success'); showMilestonesModal(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: LABEL MANAGEMENT
// ==========================================

async function showLabelsModal() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const result = await V.listLabels(selectedRepo.owner, selectedRepo.name);
  const labels = result.success ? result.labels : [];
  
  openModal('Etiketler (Labels)', `
    <button class="btn btn-primary mb-md" onclick="showCreateLabelModal()">${svgIcon('plus')} Yeni Etiket</button>
    ${labels.length === 0 ? '<p class="text-muted">Etiket bulunamadı</p>' : labels.map(l => `
      <div class="list-item">
        <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#${l.color};"></span>
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(l.name)}</div>
          <div class="list-item-subtitle">${escapeHtml(l.description || '')}</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="doDeleteLabel('${escapeHtml(l.name)}')">${svgIcon('trash')}</button>
      </div>
    `).join('')}
  `);
}

function showCreateLabelModal() {
  closeModal();
  openModal('Yeni Etiket', `
    <div class="input-group"><label>İsim</label><input type="text" id="label-name" placeholder="bug"></div>
    <div class="input-group"><label>Renk (hex)</label><input type="color" id="label-color" value="#e11d48"></div>
    <div class="input-group"><label>Açıklama</label><input type="text" id="label-desc" placeholder="Açıklama"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCreateLabel()">Oluştur</button>
  `);
}

async function doCreateLabel() {
  const name = document.getElementById('label-name').value.trim();
  if (!name) return toast('İsim gerekli', 'error');
  const color = document.getElementById('label-color').value.replace('#', '');
  const result = await V.createLabel(selectedRepo.owner, selectedRepo.name, {
    name, color, description: document.getElementById('label-desc').value.trim()
  });
  if (result.success) { toast('Etiket oluşturuldu', 'success'); closeModal(); showLabelsModal(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doDeleteLabel(name) {
  if (!confirm(`"${name}" etiketi silinsin mi?`)) return;
  const result = await V.deleteLabel(selectedRepo.owner, selectedRepo.name, name);
  if (result.success) { toast('Etiket silindi', 'success'); showLabelsModal(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: USER PROFILE VIEW
// ==========================================

async function showUserProfile(username) {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.getUserByName(username);
  if (!result.success) return content.innerHTML = `<p class="text-danger">Kullanıcı bulunamadı</p>`;
  
  const user = result.user;
  const isMe = currentUser && currentUser.login === user.login;
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          ${escapeHtml(user.login)}
        </h1>
        ${!isMe ? `
          <div class="page-actions">
            <button class="btn btn-primary" onclick="doFollowUser('${escapeHtml(user.login)}')">${svgIcon('plus')} Takip Et</button>
            <button class="btn btn-danger" onclick="doUnfollowUser('${escapeHtml(user.login)}')">${svgIcon('x')} Takibi Bırak</button>
          </div>
        ` : ''}
      </div>
      
      <div class="card">
        <div class="profile-header">
          <img class="profile-avatar" src="${escapeHtml(user.avatar_url)}" alt="">
          <div>
            <div class="profile-name">${escapeHtml(user.name || user.login)}</div>
            <div class="profile-login">@${escapeHtml(user.login)}</div>
            ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon orange">${svgIcon('repo')}</div><div class="stat-info"><div class="stat-number">${user.public_repos}</div><div class="stat-label">Public Repos</div></div></div>
          <div class="stat-card"><div class="stat-icon green">${svgIcon('file')}</div><div class="stat-info"><div class="stat-number">${user.public_gists}</div><div class="stat-label">Public Gists</div></div></div>
          <div class="stat-card"><div class="stat-icon blue"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg></div><div class="stat-info"><div class="stat-number">${user.followers}</div><div class="stat-label">Takipçi</div></div></div>
          <div class="stat-card"><div class="stat-icon purple"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg></div><div class="stat-info"><div class="stat-number">${user.following}</div><div class="stat-label">Takip Edilen</div></div></div>
        </div>
        
        <div class="flex-row gap-lg flex-wrap text-sm text-muted" style="padding:12px 0;">
          ${user.company ? `<span>🏢 ${escapeHtml(user.company)}</span>` : ''}
          ${user.location ? `<span>📍 ${escapeHtml(user.location)}</span>` : ''}
          ${user.blog ? `<span>${svgIcon('link')} ${escapeHtml(user.blog)}</span>` : ''}
          <span>📅 Katılım: ${new Date(user.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    </div>
  `;
}

async function doFollowUser(username) {
  const result = await V.followUser(username);
  if (result.success) toast(username + ' takip edildi', 'success');
  else toast('Hata: ' + result.error, 'error');
}

async function doUnfollowUser(username) {
  const result = await V.unfollowUser(username);
  if (result.success) toast(username + ' takipten çıkıldı', 'success');
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: GIST DETAIL & EDIT & FORK
// ==========================================

async function showGistDetail(gistId) {
  const result = await V.getGist(gistId);
  if (!result.success) return toast('Gist yüklenemedi', 'error');
  
  const g = result.gist;
  const files = Object.entries(g.files);
  
  openModal(escapeHtml(g.description || 'Gist Detayı'), `
    <div class="flex-row gap-sm mb-md">
      <span class="badge ${g.public ? 'badge-success' : 'badge-warning'}">${g.public ? 'Public' : 'Secret'}</span>
      <span class="text-sm text-muted">${escapeHtml(g.owner?.login || '')} · ${timeAgo(g.updated_at)}</span>
    </div>
    ${files.map(([name, file]) => `
      <div class="diff-block">
        <div class="diff-header">${escapeHtml(name)} (${escapeHtml(file.language || 'Text')})</div>
        <pre style="padding:12px;overflow-x:auto;font-family:var(--font-mono);font-size:12px;line-height:1.5;margin:0;max-height:300px;">${escapeHtml(file.content || '')}</pre>
      </div>
    `).join('')}
    <div class="flex-row gap-sm mt-md">
      <button class="btn" onclick="doForkGist('${g.id}')">${svgIcon('fork')} Fork</button>
      <button class="btn btn-danger" onclick="deleteGist('${g.id}');closeModal();">${svgIcon('trash')} Sil</button>
    </div>
  `);
}

async function doForkGist(gistId) {
  const result = await V.forkGist(gistId);
  if (result.success) { toast('Gist fork edildi!', 'success'); renderGists(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: MARK ALL NOTIFICATIONS
// ==========================================

async function markAllNotifsRead() {
  if (!confirm('Tüm bildirimler okundu olarak işaretlensin mi?')) return;
  const result = await V.markAllNotificationsRead();
  if (result.success) { toast('Tüm bildirimler okundu', 'success'); renderNotifications(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: SEARCH CODE & ISSUES
// ==========================================

async function doGlobalSearch() {
  const query = document.getElementById('global-search').value.trim();
  if (!query) return;
  const type = document.getElementById('search-type').value;
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = loading();
  
  if (type === 'repos') {
    const result = await V.searchRepos(query);
    if (!result.success) return resultsDiv.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`;
    resultsDiv.innerHTML = `<p class="text-muted mb-md">${result.total_count} sonuç</p><div class="repo-grid">${result.repos.map(r => repoCardHtml(r)).join('')}</div>`;
  } else if (type === 'users') {
    const result = await V.searchUsers(query);
    if (!result.success) return resultsDiv.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`;
    resultsDiv.innerHTML = `<p class="text-muted mb-md">${result.total_count} sonuç</p><div class="repo-grid">${result.users.map(u => `
      <div class="repo-card" onclick="showUserProfile('${escapeHtml(u.login)}')" style="cursor:pointer;">
        <div class="flex-row gap-md"><img src="${escapeHtml(u.avatar_url)}" width="48" height="48" style="border-radius:50%;"><div><div class="repo-card-name">${escapeHtml(u.login)}</div><div class="repo-card-desc">${escapeHtml(u.type)}</div></div></div>
      </div>`).join('')}</div>`;
  } else if (type === 'code') {
    const result = await V.searchCode(query);
    if (!result.success) return resultsDiv.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`;
    resultsDiv.innerHTML = `<p class="text-muted mb-md">${result.total_count} sonuç</p><div class="card" style="padding:0;">${result.items.map(item => `
      <div class="list-item">
        <div class="list-item-icon">${svgIcon('file')}</div>
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(item.name)}</div>
          <div class="list-item-subtitle">${escapeHtml(item.repository?.full_name || '')} · ${escapeHtml(item.path)}</div>
        </div>
      </div>`).join('')}</div>`;
  } else if (type === 'issues') {
    const result = await V.searchIssues(query);
    if (!result.success) return resultsDiv.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`;
    resultsDiv.innerHTML = `<p class="text-muted mb-md">${result.total_count} sonuç</p><div class="card" style="padding:0;">${result.items.map(item => `
      <div class="list-item">
        <div class="list-item-icon" style="color:${item.state === 'open' ? 'var(--success)' : 'var(--danger)'};">${item.pull_request ? svgIcon('pr') : svgIcon('issue')}</div>
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(item.title)}</div>
          <div class="list-item-subtitle">${escapeHtml(item.repository_url?.split('/').slice(-2).join('/') || '')} #${item.number} · ${escapeHtml(item.user?.login || '')} · ${timeAgo(item.created_at)}</div>
        </div>
        <span class="badge ${item.state === 'open' ? 'badge-success' : 'badge-danger'}">${item.state}</span>
      </div>`).join('')}</div>`;
  }
}

// ==========================================
// NEW FEATURES: DELETE RELEASE
// ==========================================

async function deleteRelease(releaseId) {
  if (!confirm('Release silinsin mi?')) return;
  const result = await V.deleteRelease(selectedRepo.owner, selectedRepo.name, releaseId);
  if (result.success) { toast('Release silindi', 'success'); renderReleases(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NEW FEATURES: ACTIVITY FEED (EVENTS)
// ==========================================

async function showActivityFeed() {
  const content = document.getElementById('content');
  content.innerHTML = loading();
  
  const result = await V.listEvents();
  const events = result.success ? result.events : [];
  
  const eventTypes = {
    PushEvent: { icon: 'commit', label: 'Push', color: 'var(--success)' },
    CreateEvent: { icon: 'plus', label: 'Oluşturma', color: 'var(--accent)' },
    DeleteEvent: { icon: 'trash', label: 'Silme', color: 'var(--danger)' },
    IssuesEvent: { icon: 'issue', label: 'Issue', color: '#f0883e' },
    PullRequestEvent: { icon: 'pr', label: 'PR', color: '#d2a8ff' },
    WatchEvent: { icon: 'star', label: 'Star', color: '#e3b341' },
    ForkEvent: { icon: 'fork', label: 'Fork', color: '#79c0ff' },
    IssueCommentEvent: { icon: 'issue', label: 'Yorum', color: '#f0883e' },
    ReleaseEvent: { icon: 'download', label: 'Release', color: '#3fb950' },
  };
  
  content.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title"><svg viewBox="0 0 24 24" width="28" height="28"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Aktivite Akışı</h1>
        <p class="page-subtitle">Son ${events.length} aktivite</p>
      </div>
      <div class="card" style="padding:0;">
        ${events.length === 0 ? '<div class="empty-state"><h3>Aktivite bulunamadı</h3></div>' : events.map(e => {
          const et = eventTypes[e.type] || { icon: 'file', label: e.type, color: 'var(--text-muted)' };
          return `
            <div class="list-item">
              <div class="list-item-icon" style="color:${et.color};">${svgIcon(et.icon)}</div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(et.label)}: ${escapeHtml(e.repo?.name || '')}</div>
                <div class="list-item-subtitle">${timeAgo(e.created_at)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// NEW FEATURES: EXPORT REPO LIST
// ==========================================

function exportRepoList() {
  const repos = window._allRepos || [];
  if (repos.length === 0) return toast('Hiç repo bulunamadı', 'error');
  
  const csv = ['İsim,URL,Dil,Yıldız,Fork,Private,Açıklama'];
  repos.forEach(r => {
    csv.push([
      r.name,
      r.clone_url,
      r.language || '',
      r.stargazers_count,
      r.forks_count,
      r.private ? 'Evet' : 'Hayır',
      '"' + (r.description || '').replace(/"/g, '""') + '"'
    ].join(','));
  });
  
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'vulpax-repos.csv';
  link.click();
  toast('Repo listesi indirildi', 'success');
}

// ==========================================
// KEYBOARD SHORTCUTS (enhanced)
// ==========================================

document.addEventListener('keydown', (e) => {
  // Command palette: Ctrl+Shift+P (works everywhere)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    toggleCommandPalette();
    return;
  }

  // Escape to close command palette
  if (e.key === 'Escape') {
    const cp = document.getElementById('command-palette-overlay');
    if (cp && cp.style.display !== 'none') { cp.style.display = 'none'; return; }
  }

  // Only when not typing in input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '1': e.preventDefault(); navigateTo('dashboard'); break;
      case '2': e.preventDefault(); navigateTo('repos'); break;
      case '3': e.preventDefault(); navigateTo('branches'); break;
      case '4': e.preventDefault(); navigateTo('commits'); break;
      case '5': e.preventDefault(); navigateTo('pullrequests'); break;
      case '6': e.preventDefault(); navigateTo('issues'); break;
      case '7': e.preventDefault(); navigateTo('localrepo'); break;
      case '8': e.preventDefault(); navigateTo('search'); break;
      case 'k': e.preventDefault(); navigateTo('search'); setTimeout(() => { const el = document.getElementById('global-search'); if (el) el.focus(); }, 100); break;
      case 'n': e.preventDefault(); navigateTo('notifications'); break;
      case 'b': e.preventDefault(); navigateTo('branches'); break;
    }
  }

  // Quick shortcuts (no modifier)
  if (e.key === '?' && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    showKeyboardShortcuts();
  }
});

// ==========================================
// SIDEBAR TOGGLE
// ==========================================

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('collapsed');
    });
  }
}

// ==========================================
// COMMAND PALETTE
// ==========================================

function toggleCommandPalette() {
  const overlay = document.getElementById('command-palette-overlay');
  if (overlay.style.display === 'none') {
    overlay.style.display = 'flex';
    const input = document.getElementById('command-palette-input');
    input.value = '';
    input.focus();
    renderCommandResults('');
    input.addEventListener('input', (e) => renderCommandResults(e.target.value));
    input.addEventListener('keydown', handleCommandPaletteKeys);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
  } else {
    overlay.style.display = 'none';
  }
}

function handleCommandPaletteKeys(e) {
  const results = document.getElementById('command-palette-results');
  const items = results.querySelectorAll('.command-item');
  const active = results.querySelector('.command-item.active');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (active) { active.classList.remove('active'); const next = active.nextElementSibling || items[0]; next?.classList.add('active'); }
    else if (items[0]) items[0].classList.add('active');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (active) { active.classList.remove('active'); const prev = active.previousElementSibling || items[items.length - 1]; prev?.classList.add('active'); }
    else if (items[items.length - 1]) items[items.length - 1].classList.add('active');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (active) active.click();
  }
}

const commandPaletteCommands = [
  { label: 'Dashboard\'a Git', action: () => navigateTo('dashboard'), keywords: 'anasayfa home dashboard' },
  { label: 'Repolar', action: () => navigateTo('repos'), keywords: 'repos depolar repositories' },
  { label: 'Branch\'ler', action: () => navigateTo('branches'), keywords: 'dallar branches' },
  { label: 'Commit\'ler', action: () => navigateTo('commits'), keywords: 'commits' },
  { label: 'Pull Request\'ler', action: () => navigateTo('pullrequests'), keywords: 'pr merge' },
  { label: 'Issue\'lar', action: () => navigateTo('issues'), keywords: 'sorunlar issues' },
  { label: 'Actions', action: () => navigateTo('actions'), keywords: 'workflow ci cd' },
  { label: 'Release\'ler', action: () => navigateTo('releases'), keywords: 'sürümler' },
  { label: 'Gist\'ler', action: () => navigateTo('gists'), keywords: 'snippet' },
  { label: 'Yıldızlar', action: () => navigateTo('stars'), keywords: 'stars favoriler' },
  { label: 'Bildirimler', action: () => navigateTo('notifications'), keywords: 'notifications' },
  { label: 'Arama', action: () => navigateTo('search'), keywords: 'search bul' },
  { label: 'Yerel Repo', action: () => navigateTo('localrepo'), keywords: 'local git' },
  { label: 'İşbirlikçiler', action: () => navigateTo('collaborators'), keywords: 'collaborators team' },
  { label: 'Dosya Tarayıcı', action: () => navigateTo('filebrowser'), keywords: 'files browser' },
  { label: 'Organizasyonlar', action: () => navigateTo('organizations'), keywords: 'org' },
  { label: 'Profil', action: () => navigateTo('profile'), keywords: 'profile kullanıcı' },
  { label: 'Öğreticiler', action: () => navigateTo('tutorials'), keywords: 'tutorials rehber' },
  { label: 'Ayarlar', action: () => navigateTo('settings'), keywords: 'settings tema theme' },
  { label: 'Aktivite Akışı', action: () => showActivityFeed(), keywords: 'activity events' },
  { label: 'Repo Listesini Dışa Aktar (CSV)', action: () => exportRepoList(), keywords: 'export csv' },
  { label: 'Tüm Bildirimleri Okundu İşaretle', action: () => markAllNotifsRead(), keywords: 'mark all read' },
  { label: 'Tema: Koyu', action: () => setTheme('dark'), keywords: 'dark karanlık' },
  { label: 'Tema: Loş', action: () => setTheme('dimmed'), keywords: 'dimmed' },
  { label: 'Tema: Açık', action: () => setTheme('light'), keywords: 'light aydınlık' },
  { label: 'Kısayolları Göster', action: () => showKeyboardShortcuts(), keywords: 'shortcuts klavye' },
  { label: 'Hızlı Commit+Push', action: () => showQuickCommitPush(), keywords: 'commit push hızlı' },
  { label: 'Dosya Ara (Yerel Repo)', action: () => showFileSearchModal(), keywords: 'file search grep' },
  { label: 'Git Blame', action: () => showBlameModal(), keywords: 'blame suçla' },
  { label: 'Kenar Çubuğunu Aç/Kapat', action: () => { document.getElementById('sidebar').classList.toggle('collapsed'); }, keywords: 'sidebar toggle' },
];

function renderCommandResults(query) {
  const div = document.getElementById('command-palette-results');
  const q = query.toLowerCase();
  const filtered = q ? commandPaletteCommands.filter(c => 
    c.label.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q)
  ) : commandPaletteCommands;
  
  div.innerHTML = filtered.slice(0, 15).map((c, i) => `
    <div class="command-item ${i === 0 && q ? 'active' : ''}" onclick="executeCommand(${commandPaletteCommands.indexOf(c)})">
      <span>${escapeHtml(c.label)}</span>
    </div>
  `).join('') || '<div class="text-muted" style="padding:12px;">Sonuç bulunamadı</div>';
}

function executeCommand(index) {
  document.getElementById('command-palette-overlay').style.display = 'none';
  commandPaletteCommands[index]?.action();
}

// ==========================================
// KEYBOARD SHORTCUTS HELP
// ==========================================

function showKeyboardShortcuts() {
  openModal('Klavye Kısayolları', `
    <div style="display:grid;gap:8px;">
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Komut Paleti</span><kbd class="kbd">Ctrl+Shift+P</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Dashboard</span><kbd class="kbd">Ctrl+1</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Repolar</span><kbd class="kbd">Ctrl+2</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Branch'ler</span><kbd class="kbd">Ctrl+3</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Commit'ler</span><kbd class="kbd">Ctrl+4</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Pull Request'ler</span><kbd class="kbd">Ctrl+5</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Issue'lar</span><kbd class="kbd">Ctrl+6</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Yerel Repo</span><kbd class="kbd">Ctrl+7</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Arama</span><kbd class="kbd">Ctrl+8</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Arama Odakla</span><kbd class="kbd">Ctrl+K</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-muted);"><span>Bildirimler</span><kbd class="kbd">Ctrl+N</kbd></div>
      <div class="flex-row" style="justify-content:space-between;padding:6px 0;"><span>Kısayolları Göster</span><kbd class="kbd">?</kbd></div>
    </div>
  `);
}

// ==========================================
// STATUS BAR
// ==========================================

function updateStatusBar() {
  const pageNames = {
    dashboard: 'Dashboard', repos: 'Repolar', branches: "Branch'ler", commits: "Commit'ler",
    pullrequests: 'Pull Request', issues: "Issue'lar", actions: 'Actions', releases: "Release'ler",
    gists: "Gist'ler", stars: 'Yıldızlar', notifications: 'Bildirimler', search: 'Arama',
    localrepo: 'Yerel Repo', collaborators: 'İşbirlikçiler', filebrowser: 'Dosyalar',
    organizations: 'Organizasyonlar', profile: 'Profil', tutorials: 'Öğreticiler', settings: 'Ayarlar'
  };
  const pageEl = document.getElementById('status-bar-page');
  if (pageEl) pageEl.textContent = pageNames[currentPage] || currentPage;
  
  const repoEl = document.getElementById('status-repo-name');
  if (repoEl && selectedRepo) repoEl.textContent = selectedRepo.full_name || selectedRepo.name;
  
  updateStatusBarBranch();
}

async function updateStatusBarBranch() {
  if (!localRepoPath) return;
  try {
    const branchRes = await V.gitBranchLocal(localRepoPath);
    if (branchRes.success) {
      const el = document.getElementById('status-branch-name');
      if (el) el.textContent = branchRes.branches.current || '-';
    }
    const statusRes = await V.gitStatus(localRepoPath);
    if (statusRes.success) {
      const s = statusRes.status;
      const count = (s.staged?.length || 0) + (s.modified?.length || 0) + (s.not_added?.length || 0);
      const changesEl = document.getElementById('status-bar-changes');
      const countEl = document.getElementById('status-changes-count');
      if (changesEl && countEl) {
        if (count > 0) {
          changesEl.style.display = '';
          countEl.textContent = count + ' değişiklik';
        } else {
          changesEl.style.display = 'none';
        }
      }
    }
  } catch (e) { /* silent */ }
}

// ==========================================
// NOTIFICATION BADGE
// ==========================================

async function updateNotificationBadge() {
  try {
    const result = await V.listNotifications();
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (result.success && result.notifications.length > 0) {
      badge.style.display = '';
      badge.textContent = result.notifications.length;
    } else {
      badge.style.display = 'none';
    }
  } catch (e) { /* silent */ }
}

// ==========================================
// QUICK COMMIT + PUSH
// ==========================================

function showQuickCommitPush() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  openModal('⚡ Hızlı Commit + Push', `
    <p class="text-muted text-sm mb-md">Tüm değişiklikleri stage edip, commit yapıp push eder.</p>
    <div class="input-group">
      <label>Commit Mesajı</label>
      <textarea id="quick-commit-msg" placeholder="feat: açıklama" style="min-height:80px;"></textarea>
    </div>
    <div class="input-group">
      <label>Mesaj Şablonu</label>
      <select id="commit-template" onchange="applyCommitTemplate()">
        <option value="">Şablon seç...</option>
        <option value="feat: ">✨ feat: Yeni özellik</option>
        <option value="fix: ">🐛 fix: Hata düzeltme</option>
        <option value="docs: ">📝 docs: Dokümantasyon</option>
        <option value="style: ">💎 style: Stil değişikliği</option>
        <option value="refactor: ">♻️ refactor: Yeniden yapılandırma</option>
        <option value="perf: ">⚡ perf: Performans iyileştirme</option>
        <option value="test: ">🧪 test: Test ekleme/düzeltme</option>
        <option value="chore: ">🔧 chore: Araç/yapılandırma</option>
        <option value="ci: ">👷 ci: CI/CD değişikliği</option>
        <option value="revert: ">⏪ revert: Geri alma</option>
      </select>
    </div>
    <div class="input-group">
      <label>Remote</label>
      <input type="text" id="quick-push-remote" value="origin">
    </div>
    <div class="input-group">
      <label>Branch (boş = mevcut)</label>
      <input type="text" id="quick-push-branch" placeholder="main">
    </div>
    <button class="btn btn-warning btn-block mt-md" onclick="doQuickCommitPush()">⚡ Stage + Commit + Push</button>
  `);
}

function applyCommitTemplate() {
  const tpl = document.getElementById('commit-template').value;
  const msg = document.getElementById('quick-commit-msg');
  if (tpl && msg) {
    msg.value = tpl;
    msg.focus();
    msg.setSelectionRange(tpl.length, tpl.length);
  }
}

async function doQuickCommitPush() {
  const msg = document.getElementById('quick-commit-msg').value.trim();
  if (!msg) return toast('Commit mesajı gerekli', 'error');
  const remote = document.getElementById('quick-push-remote')?.value?.trim() || 'origin';
  const branch = document.getElementById('quick-push-branch')?.value?.trim() || undefined;
  
  closeModal();
  toast('Stage ediliyor...', 'info');
  
  const addResult = await V.gitAdd(localRepoPath, '.');
  if (!addResult.success) return toast('Stage hatası: ' + addResult.error, 'error');
  
  toast('Commit yapılıyor...', 'info');
  const commitResult = await V.gitCommit(localRepoPath, msg);
  if (!commitResult.success) return toast('Commit hatası: ' + commitResult.error, 'error');
  
  toast('Push yapılıyor...', 'info');
  const pushResult = await V.gitPush(localRepoPath, remote, branch);
  if (pushResult.success) {
    toast('Commit + Push tamamlandı!', 'success');
    refreshLocalTab();
    updateStatusBarBranch();
  } else {
    toast('Push hatası: ' + pushResult.error, 'error');
  }
}

// ==========================================
// COMMIT MESSAGE TEMPLATES (in standard commit modal)
// ==========================================

function showCommitModalWithTemplate() {
  openModal('Commit', `
    <div class="input-group">
      <label>Şablon</label>
      <select onchange="document.getElementById('commit-msg').value=this.value;document.getElementById('commit-msg').focus();">
        <option value="">Şablon seç...</option>
        <option value="feat: ">feat: Yeni özellik</option>
        <option value="fix: ">fix: Hata düzeltme</option>
        <option value="docs: ">docs: Dokümantasyon</option>
        <option value="style: ">style: Stil</option>
        <option value="refactor: ">refactor: Yeniden yapılandırma</option>
        <option value="perf: ">perf: Performans</option>
        <option value="test: ">test: Test</option>
        <option value="chore: ">chore: Araç/yapılandırma</option>
      </select>
    </div>
    <div class="input-group"><label>Commit Mesajı</label><textarea id="commit-msg" placeholder="feat: açıklayıcı bir commit mesajı yazın" style="min-height:100px;"></textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doGitCommit()">Commit</button>
  `);
}

// ==========================================
// FILE SEARCH (LOCAL REPO)
// ==========================================

function showFileSearchModal() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  openModal('Dosya İçerik Arama', `
    <div class="input-group">
      <label>Aranacak Metin</label>
      <div class="flex-row gap-sm">
        <input type="text" id="file-search-query" placeholder="ara..." style="flex:1;">
        <button class="btn btn-primary" onclick="doFileSearch()">Ara</button>
      </div>
    </div>
    <div id="file-search-results" style="max-height:50vh;overflow:auto;"></div>
  `);
  setTimeout(() => document.getElementById('file-search-query')?.focus(), 100);
}

async function doFileSearch() {
  const query = document.getElementById('file-search-query')?.value?.trim();
  if (!query) return;
  const div = document.getElementById('file-search-results');
  div.innerHTML = loading();
  
  const result = await V.localFileSearch(localRepoPath, query);
  if (!result.success) { div.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`; return; }
  
  const matches = result.matches || [];
  div.innerHTML = matches.length === 0 ? '<p class="text-muted mt-md">Sonuç bulunamadı</p>' : `
    <p class="text-muted text-sm mt-md mb-sm">${matches.length} sonuç bulundu</p>
    ${matches.map(m => `
      <div class="file-item" onclick="openFileInEditorFromChanges('${escapeJsStr(m.file)}')" style="cursor:pointer;">
        <span class="file-icon file">${svgIcon('file')}</span>
        <span class="file-name">${escapeHtml(m.file)}</span>
        <span class="text-muted text-sm">Satır ${escapeHtml(m.line)}</span>
        <span class="text-sm font-mono" style="color:var(--text-secondary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.content)}</span>
      </div>
    `).join('')}
  `;
}

// ==========================================
// GIT BLAME VIEWER
// ==========================================

function showBlameModal() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  openModal('Git Blame', `
    <div class="input-group">
      <label>Dosya Yolu (repo içindeki)</label>
      <div class="flex-row gap-sm">
        <input type="text" id="blame-file" placeholder="src/main.js" style="flex:1;">
        <button class="btn btn-primary" onclick="doGitBlame()">Blame</button>
      </div>
    </div>
    <div id="blame-results" style="max-height:55vh;overflow:auto;"></div>
  `);
}

async function doGitBlame() {
  const file = document.getElementById('blame-file')?.value?.trim();
  if (!file) return toast('Dosya yolu gerekli', 'error');
  const div = document.getElementById('blame-results');
  div.innerHTML = loading();
  
  const result = await V.gitBlame(localRepoPath, file);
  if (!result.success) { div.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`; return; }
  
  const blame = result.blame || [];
  div.innerHTML = blame.length === 0 ? '<p class="text-muted">Blame verisi bulunamadı</p>' : `
    <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:12px;">
      <thead><tr style="border-bottom:1px solid var(--border-muted);">
        <th style="text-align:left;padding:4px 8px;color:var(--text-muted);">SHA</th>
        <th style="text-align:left;padding:4px 8px;color:var(--text-muted);">Yazar</th>
        <th style="text-align:left;padding:4px 8px;color:var(--text-muted);">Satır</th>
        <th style="text-align:left;padding:4px 8px;color:var(--text-muted);">İçerik</th>
      </tr></thead>
      <tbody>
      ${blame.map(b => `
        <tr style="border-bottom:1px solid var(--border-muted);" title="${escapeHtml(b.summary || '')}">
          <td style="padding:2px 8px;color:var(--text-link);cursor:pointer;" onclick="copyToClipboard('${escapeHtml(b.hash)}')">${(b.hash || '').substring(0, 7)}</td>
          <td style="padding:2px 8px;color:var(--text-secondary);">${escapeHtml(b.author || '')}</td>
          <td style="padding:2px 8px;color:var(--text-muted);">${b.finalLine || ''}</td>
          <td style="padding:2px 8px;white-space:pre;">${escapeHtml(b.content || '')}</td>
        </tr>
      `).join('')}
      </tbody>
    </table>
  `;
}

// ==========================================
// COPY TO CLIPBOARD
// ==========================================

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast('Kopyalandı: ' + text.substring(0, 20), 'success');
  }).catch(() => {
    toast('Kopyalama başarısız', 'error');
  });
}

// ==========================================
// BRANCH RENAME
// ==========================================

function showRenameBranchModal(oldName) {
  openModal('Branch Yeniden Adlandır', `
    <div class="input-group"><label>Mevcut İsim</label><input type="text" value="${escapeHtml(oldName)}" disabled></div>
    <div class="input-group"><label>Yeni İsim</label><input type="text" id="new-branch-name" placeholder="feature/yeni-isim"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doRenameBranch('${escapeJsStr(oldName)}')">Yeniden Adlandır</button>
  `);
}

async function doRenameBranch(oldName) {
  const newName = document.getElementById('new-branch-name')?.value?.trim();
  if (!newName) return toast('Yeni isim gerekli', 'error');
  const result = await V.gitBranchRename(localRepoPath, oldName, newName);
  if (result.success) { toast('Branch yeniden adlandırıldı', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// NAMED STASH
// ==========================================

function showNamedStashModal() {
  openModal('Stash Kaydet', `
    <div class="input-group"><label>Mesaj (opsiyonel)</label><input type="text" id="stash-message" placeholder="WIP: açıklama"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doNamedStash()">Stash</button>
  `);
}

async function doNamedStash() {
  const message = document.getElementById('stash-message')?.value?.trim();
  const result = await V.gitStashSave(localRepoPath, message || undefined);
  if (result.success) { toast('Stash kaydedildi', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

async function doStashApply(index) {
  const result = await V.gitStashApply(localRepoPath, index);
  if (result.success) { toast('Stash uygulandı', 'success'); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// REMOTE MANAGEMENT ENHANCEMENTS
// ==========================================

function showAddRemoteModal() {
  openModal('Remote Ekle', `
    <div class="input-group"><label>Remote Adı</label><input type="text" id="remote-name" placeholder="upstream"></div>
    <div class="input-group"><label>URL</label><input type="url" id="remote-url" placeholder="https://github.com/user/repo.git"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doAddRemote()">Ekle</button>
  `);
}

async function doAddRemote() {
  const name = document.getElementById('remote-name')?.value?.trim();
  const url = document.getElementById('remote-url')?.value?.trim();
  if (!name || !url) return toast('Tüm alanları doldurun', 'error');
  const result = await V.gitRemoteAdd(localRepoPath, name, url);
  if (result.success) { toast('Remote eklendi', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showSetRemoteUrlModal(remoteName) {
  openModal('Remote URL Değiştir', `
    <div class="input-group"><label>Remote</label><input type="text" value="${escapeHtml(remoteName)}" disabled></div>
    <div class="input-group"><label>Yeni URL</label><input type="url" id="new-remote-url" placeholder="https://github.com/user/repo.git"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doSetRemoteUrl('${escapeJsStr(remoteName)}')">Güncelle</button>
  `);
}

async function doSetRemoteUrl(remoteName) {
  const url = document.getElementById('new-remote-url')?.value?.trim();
  if (!url) return toast('URL gerekli', 'error');
  const result = await V.gitRemoteSetUrl(localRepoPath, remoteName, url);
  if (result.success) { toast('Remote URL güncellendi', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// FETCH ALL REMOTES
// ==========================================

async function doGitFetchAll() {
  toast('Tüm remote\'lar fetch ediliyor...', 'info');
  const result = await V.gitFetchAll(localRepoPath);
  if (result.success) toast('Fetch all tamamlandı', 'success');
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// FILE MANAGEMENT (LOCAL)
// ==========================================

function showCreateDirModal() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  openModal('Klasör Oluştur', `
    <div class="input-group"><label>Klasör Yolu (repo kökünden)</label><input type="text" id="new-dir-path" placeholder="src/components"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doCreateDir()">Oluştur</button>
  `);
}

async function doCreateDir() {
  const dirPath = document.getElementById('new-dir-path')?.value?.trim();
  if (!dirPath) return toast('Klasör yolu gerekli', 'error');
  const fullPath = localRepoPath + '/' + dirPath;
  const result = await V.localCreateDir(fullPath);
  if (result.success) { toast('Klasör oluşturuldu', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showRenameFileModal(fileName) {
  openModal('Dosya Yeniden Adlandır', `
    <div class="input-group"><label>Mevcut İsim</label><input type="text" value="${escapeHtml(fileName)}" disabled></div>
    <div class="input-group"><label>Yeni İsim</label><input type="text" id="new-file-name" placeholder="yeni-isim.ts" value="${escapeHtml(fileName)}"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doRenameFile('${escapeJsStr(fileName)}')">Yeniden Adlandır</button>
  `);
}

async function doRenameFile(oldName) {
  const newName = document.getElementById('new-file-name')?.value?.trim();
  if (!newName) return toast('Yeni isim gerekli', 'error');
  const oldPath = localRepoPath + '/' + oldName;
  const newPath = localRepoPath + '/' + newName;
  const result = await V.localRenameFile(oldPath, newPath);
  if (result.success) { toast('Dosya yeniden adlandırıldı', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

function showMoveFileModal(fileName) {
  openModal('Dosya Taşı', `
    <div class="input-group"><label>Dosya</label><input type="text" value="${escapeHtml(fileName)}" disabled></div>
    <div class="input-group"><label>Hedef Yol (repo kökünden)</label><input type="text" id="move-dest-path" placeholder="src/utils/" value="${escapeHtml(fileName)}"></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doMoveFile('${escapeJsStr(fileName)}')">Taşı</button>
  `);
}

async function doMoveFile(fileName) {
  const destPath = document.getElementById('move-dest-path')?.value?.trim();
  if (!destPath) return toast('Hedef yol gerekli', 'error');
  const srcPath = localRepoPath + '/' + fileName;
  const fullDest = localRepoPath + '/' + destPath;
  const result = await V.localMoveFile(srcPath, fullDest);
  if (result.success) { toast('Dosya taşındı', 'success'); closeModal(); refreshLocalTab(); }
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// LOG SEARCH
// ==========================================

function showLogSearchModal() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  openModal('Commit Geçmişinde Ara', `
    <div class="input-group">
      <label>Aranacak metin</label>
      <div class="flex-row gap-sm">
        <input type="text" id="log-search-query" placeholder="commit mesajı ara..." style="flex:1;">
        <button class="btn btn-primary" onclick="doLogSearch()">Ara</button>
      </div>
    </div>
    <div id="log-search-results" style="max-height:50vh;overflow:auto;"></div>
  `);
}

async function doLogSearch() {
  const query = document.getElementById('log-search-query')?.value?.trim();
  if (!query) return;
  const div = document.getElementById('log-search-results');
  div.innerHTML = loading();
  
  const result = await V.gitLogSearch(localRepoPath, query);
  if (!result.success) { div.innerHTML = `<p class="text-danger">${escapeHtml(result.error)}</p>`; return; }
  
  const commits = result.log?.all || [];
  div.innerHTML = commits.length === 0 ? '<p class="text-muted mt-md">Sonuç bulunamadı</p>' : `
    <p class="text-muted text-sm mt-md mb-sm">${commits.length} commit bulundu</p>
    ${commits.map(c => `
      <div class="commit-item" onclick="showLocalCommitDetail('${escapeHtml(c.hash)}')">
        <div class="commit-dot"></div>
        <div class="commit-info">
          <div class="commit-message">${escapeHtml(c.message.split('\n')[0])}</div>
          <div class="commit-meta">
            <span class="commit-sha" onclick="event.stopPropagation();copyToClipboard('${escapeHtml(c.hash)}')" title="SHA kopyala">${c.hash.substring(0, 7)}</span>
            <span>${escapeHtml(c.author_name)}</span>
            <span>${timeAgo(c.date)}</span>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// ==========================================
// DIFF STAT SUMMARY
// ==========================================

async function showDiffStat() {
  if (!localRepoPath) return toast('Önce yerel repo seçin', 'error');
  const result = await V.gitDiffStat(localRepoPath);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal('Diff İstatistikleri', `
    <div class="diff-block" style="max-height:60vh;overflow:auto;">
      <pre style="padding:12px;font-family:var(--font-mono);font-size:12px;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(result.stat || 'Değişiklik yok')}</pre>
    </div>
  `);
}

// ==========================================
// REPO LANGUAGE CHART
// ==========================================

function renderLanguageChart(languages) {
  if (!languages || Object.keys(languages).length === 0) return '<p class="text-muted text-sm">Dil bilgisi yok</p>';
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const colors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8',
    Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c',
    Shell: '#89e051', Lua: '#000080', Vim: '#199f4b', Dockerfile: '#384d54'
  };
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  
  return `
    <div style="margin:8px 0;">
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:8px;">
        ${sorted.map(([lang, bytes]) => `<div style="width:${(bytes / total * 100).toFixed(1)}%;background:${colors[lang] || '#8b949e'};" title="${escapeHtml(lang)}: ${(bytes / total * 100).toFixed(1)}%"></div>`).join('')}
      </div>
      <div class="flex-row gap-md flex-wrap">
        ${sorted.slice(0, 8).map(([lang, bytes]) => `
          <span class="flex-row gap-sm text-sm">
            <span style="width:10px;height:10px;border-radius:50%;background:${colors[lang] || '#8b949e'};display:inline-block;"></span>
            ${escapeHtml(lang)} <span class="text-muted">${(bytes / total * 100).toFixed(1)}%</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// WATCHERS & FORKS LIST
// ==========================================

async function showWatchers() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const result = await V.listWatchers(selectedRepo.owner, selectedRepo.name);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal('İzleyenler (Watchers)', result.watchers.length === 0 ? '<p class="text-muted">İzleyen yok</p>' :
    result.watchers.map(w => `
      <div class="list-item" onclick="showUserProfile('${escapeHtml(w.login)}')" style="cursor:pointer;">
        <img src="${escapeHtml(w.avatar_url)}" width="32" height="32" style="border-radius:50%;">
        <div class="list-item-content"><div class="list-item-title">${escapeHtml(w.login)}</div></div>
      </div>
    `).join('')
  );
}

async function showForksList() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const result = await V.listForks(selectedRepo.owner, selectedRepo.name);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal('Fork\'lar', result.forks.length === 0 ? '<p class="text-muted">Fork yok</p>' :
    result.forks.map(f => `
      <div class="list-item" style="cursor:pointer;">
        <img src="${escapeHtml(f.owner?.avatar_url || '')}" width="32" height="32" style="border-radius:50%;">
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(f.full_name)}</div>
          <div class="list-item-subtitle">${svgIcon('star')} ${f.stargazers_count} · ${timeAgo(f.created_at)}</div>
        </div>
      </div>
    `).join('')
  );
}

// ==========================================
// CONTRIBUTORS LIST
// ==========================================

async function showContributors() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  const result = await V.listContributors(selectedRepo.owner, selectedRepo.name);
  if (!result.success) return toast('Hata: ' + result.error, 'error');
  openModal('Katkıda Bulunanlar', result.contributors.length === 0 ? '<p class="text-muted">Katkıda bulunan yok</p>' :
    result.contributors.map(c => `
      <div class="list-item" onclick="showUserProfile('${escapeHtml(c.login)}')" style="cursor:pointer;">
        <img src="${escapeHtml(c.avatar_url)}" width="32" height="32" style="border-radius:50%;">
        <div class="list-item-content">
          <div class="list-item-title">${escapeHtml(c.login)}</div>
          <div class="list-item-subtitle">${c.contributions} katkı</div>
        </div>
        <span class="badge">${c.contributions}</span>
      </div>
    `).join('')
  );
}

// ==========================================
// DOWNLOAD ZIP
// ==========================================

async function downloadRepoZip() {
  if (!selectedRepo) return toast('Önce repo seçin', 'error');
  toast('ZIP indiriliyor...', 'info');
  const result = await V.downloadZip(selectedRepo.owner, selectedRepo.name, 'main');
  if (result.success) toast('ZIP indirildi', 'success');
  else toast('Hata: ' + result.error, 'error');
}

// ==========================================
// AUTO-REFRESH
// ==========================================

let autoRefreshInterval = null;

function toggleAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    toast('Otomatik yenileme kapatıldı', 'info');
    return;
  }
  autoRefreshInterval = setInterval(() => {
    if (currentPage === 'localrepo' && localRepoPath) {
      updateStatusBarBranch();
    }
    updateNotificationBadge();
  }, 30000);
  toast('Otomatik yenileme açıldı (30sn)', 'success');
}

// ==========================================
// THEME AUTO-DETECT
// ==========================================

function detectSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
    toast('Açık tema uygulandı', 'success');
  } else {
    setTheme('dark');
    toast('Koyu tema uygulandı', 'success');
  }
}

// ==========================================
// RECENT REPOS MEMORY
// ==========================================

let recentLocalPaths = [];

function saveRecentPath(path) {
  recentLocalPaths = recentLocalPaths.filter(p => p !== path);
  recentLocalPaths.unshift(path);
  if (recentLocalPaths.length > 10) recentLocalPaths.pop();
  try { localStorage.setItem('vulpax-recent-paths', JSON.stringify(recentLocalPaths)); } catch(e) {}
}

function loadRecentPaths() {
  try { recentLocalPaths = JSON.parse(localStorage.getItem('vulpax-recent-paths') || '[]'); } catch(e) { recentLocalPaths = []; }
}

// ==========================================
// ENHANCED DASHBOARD STATS
// ==========================================

function renderDashboardStats(repos, notifs, gists) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const languages = {};
  repos.forEach(r => { if (r.language) languages[r.language] = (languages[r.language] || 0) + 1; });
  const topLang = Object.entries(languages).sort((a, b) => b[1] - a[1])[0];
  
  return `
    <div class="stats-grid">
      <div class="stat-card" onclick="navigateTo('repos')" style="cursor:pointer;">
        <div class="stat-icon blue">${svgIcon('repo')}</div>
        <div class="stat-info"><div class="stat-number">${repos.length}</div><div class="stat-label">Toplam Repo</div></div>
      </div>
      <div class="stat-card" onclick="navigateTo('stars')" style="cursor:pointer;">
        <div class="stat-icon yellow">${svgIcon('star')}</div>
        <div class="stat-info"><div class="stat-number">${totalStars}</div><div class="stat-label">Toplam Yıldız</div></div>
      </div>
      <div class="stat-card" onclick="navigateTo('notifications')" style="cursor:pointer;">
        <div class="stat-icon red"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>
        <div class="stat-info"><div class="stat-number">${notifs.length}</div><div class="stat-label">Bildirim</div></div>
      </div>
      <div class="stat-card" onclick="navigateTo('gists')" style="cursor:pointer;">
        <div class="stat-icon green">${svgIcon('file')}</div>
        <div class="stat-info"><div class="stat-number">${gists.length}</div><div class="stat-label">Gist</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">${svgIcon('fork')}</div>
        <div class="stat-info"><div class="stat-number">${totalForks}</div><div class="stat-label">Toplam Fork</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">${svgIcon('branch')}</div>
        <div class="stat-info"><div class="stat-number">${topLang ? topLang[0] : '-'}</div><div class="stat-label">En Çok Dil</div></div>
      </div>
    </div>
  `;
}

// ==========================================
// INIT ENHANCEMENTS
// ==========================================

// ==========================================
// LOCAL TERMINAL
// ==========================================

let terminalHistory = [];
let terminalHistoryIndex = -1;

function renderLocalTerminal() {
  const div = document.getElementById('local-tab-content');
  if (!div) return;
  div.innerHTML = `
    <div class="terminal-container">
      <div class="terminal-toolbar">
        <span class="terminal-title">💻 Terminal — ${escapeHtml(localRepoPath)}</span>
        <div class="flex-row gap-sm">
          <button class="btn btn-sm btn-success" onclick="terminalQuickCmd('git add . && git status')">${svgIcon('plus')} Stage All</button>
          <button class="btn btn-sm btn-primary" onclick="showTerminalCommitModal()">${svgIcon('commit')} Commit</button>
          <button class="btn btn-sm btn-info" onclick="terminalQuickCmd('git push')">${svgIcon('link')} Push</button>
          <button class="btn btn-sm" onclick="terminalQuickCmd('git pull')">${svgIcon('download')} Pull</button>
          <button class="btn btn-sm" onclick="terminalQuickCmd('git status')">📋 Status</button>
          <button class="btn btn-sm" onclick="terminalQuickCmd('git log --oneline -10')">📜 Log</button>
          <button class="btn btn-sm" onclick="terminalQuickCmd('git diff --stat')">📊 Diff Stat</button>
          <button class="btn btn-sm btn-danger" onclick="clearTerminal()">🗑️ Temizle</button>
        </div>
      </div>
      <div class="terminal-output" id="terminal-output"><div class="terminal-line terminal-info">Terminal hazır. Komut yazın veya yukarıdaki butonları kullanın.</div><div class="terminal-line terminal-info">Çalışma dizini: ${escapeHtml(localRepoPath)}</div></div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">$</span>
        <input type="text" class="terminal-input" id="terminal-input" placeholder="Komut yazın... (Enter ile çalıştır)" autocomplete="off" spellcheck="false">
      </div>
    </div>
  `;
  const input = document.getElementById('terminal-input');
  input.focus();
  input.addEventListener('keydown', handleTerminalKeydown);
}

function handleTerminalKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = e.target.value.trim();
    if (!cmd) return;
    terminalHistory.push(cmd);
    terminalHistoryIndex = terminalHistory.length;
    e.target.value = '';
    runTerminalCommand(cmd);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (terminalHistoryIndex > 0) {
      terminalHistoryIndex--;
      e.target.value = terminalHistory[terminalHistoryIndex] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (terminalHistoryIndex < terminalHistory.length - 1) {
      terminalHistoryIndex++;
      e.target.value = terminalHistory[terminalHistoryIndex] || '';
    } else {
      terminalHistoryIndex = terminalHistory.length;
      e.target.value = '';
    }
  }
}

async function runTerminalCommand(cmd) {
  const output = document.getElementById('terminal-output');
  if (!output) return;
  
  // Show command
  output.innerHTML += `<div class="terminal-line terminal-cmd"><span class="terminal-prompt">$</span> ${escapeHtml(cmd)}</div>`;
  output.scrollTop = output.scrollHeight;
  
  const result = await V.runCommand(localRepoPath, cmd);
  
  if (result.stdout) {
    const lines = result.stdout.split('\n');
    lines.forEach(line => {
      if (line.trim()) output.innerHTML += `<div class="terminal-line">${escapeHtml(line)}</div>`;
    });
  }
  if (result.stderr) {
    const lines = result.stderr.split('\n');
    lines.forEach(line => {
      if (line.trim()) output.innerHTML += `<div class="terminal-line terminal-error">${escapeHtml(line)}</div>`;
    });
  }
  if (!result.success && result.error && !result.stderr) {
    output.innerHTML += `<div class="terminal-line terminal-error">Hata: ${escapeHtml(result.error)}</div>`;
  }
  if (result.success && !result.stdout && !result.stderr) {
    output.innerHTML += `<div class="terminal-line terminal-info">Komut başarıyla çalıştı (çıktı yok)</div>`;
  }
  
  output.scrollTop = output.scrollHeight;
  updateStatusBarBranch();
}

function terminalQuickCmd(cmd) {
  const output = document.getElementById('terminal-output');
  if (!output) {
    // Terminal tab not active, switch to it first
    switchLocalTab('terminal');
    setTimeout(() => terminalQuickCmd(cmd), 200);
    return;
  }
  runTerminalCommand(cmd);
}

function showTerminalCommitModal() {
  openModal('Terminal Commit', `
    <div class="input-group">
      <label>Şablon</label>
      <select onchange="document.getElementById('terminal-commit-msg').value=this.value;document.getElementById('terminal-commit-msg').focus();">
        <option value="">Şablon seç...</option>
        <option value="feat: ">feat: Yeni özellik</option>
        <option value="fix: ">fix: Hata düzeltme</option>
        <option value="docs: ">docs: Dokümantasyon</option>
        <option value="refactor: ">refactor: Yeniden yapılandırma</option>
        <option value="chore: ">chore: Diğer</option>
      </select>
    </div>
    <div class="input-group"><label>Commit Mesajı</label><textarea id="terminal-commit-msg" placeholder="feat: açıklama" style="min-height:80px;"></textarea></div>
    <button class="btn btn-primary btn-block mt-md" onclick="doTerminalCommit()">Commit</button>
    <button class="btn btn-warning btn-block mt-sm" onclick="doTerminalCommitPush()">Commit + Push</button>
  `);
}

async function doTerminalCommit() {
  const msg = document.getElementById('terminal-commit-msg')?.value?.trim();
  if (!msg) return toast('Commit mesajı gerekli', 'error');
  closeModal();
  await runTerminalCommand('git add .');
  await runTerminalCommand('git commit -m "' + msg.replace(/"/g, '\\"') + '"');
}

async function doTerminalCommitPush() {
  const msg = document.getElementById('terminal-commit-msg')?.value?.trim();
  if (!msg) return toast('Commit mesajı gerekli', 'error');
  closeModal();
  await runTerminalCommand('git add .');
  await runTerminalCommand('git commit -m "' + msg.replace(/"/g, '\\"') + '"');
  await runTerminalCommand('git push');
}

function clearTerminal() {
  const output = document.getElementById('terminal-output');
  if (output) output.innerHTML = '<div class="terminal-line terminal-info">Terminal temizlendi.</div>';
}

function initEnhancements() {
  initSidebarToggle();
  loadRecentPaths();
  updateNotificationBadge();
  updateStatusBar();
  // Auto-refresh every 60s for notifications
  setInterval(() => {
    updateNotificationBadge();
  }, 60000);
}
