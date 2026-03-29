const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const fs = require('fs');
const https = require('https');

const store = new Store();

let mainWindow;
let octokit = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile('renderer/index.html');

  // Restore saved token
  const savedToken = store.get('github-token');
  if (savedToken) {
    octokit = new Octokit({ auth: savedToken });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ========== WINDOW CONTROLS ==========
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('window-close', () => mainWindow.close());

// ========== SETTINGS ==========
ipcMain.handle('get-setting', (event, key) => store.get(key));
ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

// ========== GITHUB AUTH ==========
ipcMain.handle('github-auth', async (event, token) => {
  try {
    const testOctokit = new Octokit({ auth: token });
    const { data } = await testOctokit.users.getAuthenticated();
    octokit = testOctokit;
    store.set('github-token', token);
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-logout', () => {
  octokit = null;
  store.delete('github-token');
  return { success: true };
});

ipcMain.handle('github-get-user', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.users.getAuthenticated();
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REPOSITORIES ==========
ipcMain.handle('github-list-repos', async (event, params = {}) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: params.sort || 'updated',
      per_page: params.per_page || 100,
      type: params.type || 'all'
    });
    return { success: true, repos: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-repo', async (event, repoData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: repoData.name,
      description: repoData.description || '',
      private: repoData.private || false,
      auto_init: repoData.auto_init || true,
      gitignore_template: repoData.gitignore_template || undefined,
      license_template: repoData.license_template || undefined
    });
    return { success: true, repo: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-delete-repo', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.repos.delete({ owner, repo });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-fork-repo', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.createFork({ owner, repo });
    return { success: true, repo: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-get-repo', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return { success: true, repo: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== BRANCHES ==========
ipcMain.handle('github-list-branches', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listBranches({ owner, repo, per_page: 100 });
    return { success: true, branches: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-branch', async (event, owner, repo, branchName, fromBranch) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${fromBranch}` });
    await octokit.git.createRef({
      owner, repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-delete-branch', async (event, owner, repo, branch) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.git.deleteRef({ owner, repo, ref: `heads/${branch}` });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== COMMITS ==========
ipcMain.handle('github-list-commits', async (event, owner, repo, params = {}) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listCommits({
      owner, repo,
      sha: params.branch || undefined,
      per_page: params.per_page || 50
    });
    return { success: true, commits: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-get-commit', async (event, owner, repo, ref) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.getCommit({ owner, repo, ref });
    return { success: true, commit: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== PULL REQUESTS ==========
ipcMain.handle('github-list-prs', async (event, owner, repo, state = 'open') => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.list({ owner, repo, state, per_page: 100 });
    return { success: true, prs: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-pr', async (event, owner, repo, prData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.create({
      owner, repo,
      title: prData.title,
      body: prData.body || '',
      head: prData.head,
      base: prData.base
    });
    return { success: true, pr: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-merge-pr', async (event, owner, repo, pullNumber, mergeMethod) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.merge({
      owner, repo,
      pull_number: pullNumber,
      merge_method: mergeMethod || 'merge'
    });
    return { success: true, merge: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-close-pr', async (event, owner, repo, pullNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.update({
      owner, repo,
      pull_number: pullNumber,
      state: 'closed'
    });
    return { success: true, pr: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== ISSUES ==========
ipcMain.handle('github-list-issues', async (event, owner, repo, state = 'open') => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.listForRepo({ owner, repo, state, per_page: 100 });
    return { success: true, issues: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-issue', async (event, owner, repo, issueData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.create({
      owner, repo,
      title: issueData.title,
      body: issueData.body || '',
      labels: issueData.labels || [],
      assignees: issueData.assignees || []
    });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-close-issue', async (event, owner, repo, issueNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.update({
      owner, repo,
      issue_number: issueNumber,
      state: 'closed'
    });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-comment-issue', async (event, owner, repo, issueNumber, body) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.createComment({
      owner, repo,
      issue_number: issueNumber,
      body
    });
    return { success: true, comment: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-list-issue-comments', async (event, owner, repo, issueNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.listComments({
      owner, repo,
      issue_number: issueNumber,
      per_page: 100
    });
    return { success: true, comments: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== LABELS ==========
ipcMain.handle('github-list-labels', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.listLabelsForRepo({ owner, repo, per_page: 100 });
    return { success: true, labels: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-label', async (event, owner, repo, labelData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.createLabel({
      owner, repo,
      name: labelData.name,
      color: labelData.color,
      description: labelData.description || ''
    });
    return { success: true, label: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== RELEASES ==========
ipcMain.handle('github-list-releases', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listReleases({ owner, repo, per_page: 30 });
    return { success: true, releases: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-release', async (event, owner, repo, releaseData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.createRelease({
      owner, repo,
      tag_name: releaseData.tag_name,
      name: releaseData.name || releaseData.tag_name,
      body: releaseData.body || '',
      draft: releaseData.draft || false,
      prerelease: releaseData.prerelease || false
    });
    return { success: true, release: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GISTS ==========
ipcMain.handle('github-list-gists', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.gists.list({ per_page: 100 });
    return { success: true, gists: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-gist', async (event, gistData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.gists.create({
      description: gistData.description || '',
      public: gistData.public || false,
      files: gistData.files
    });
    return { success: true, gist: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-delete-gist', async (event, gistId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.gists.delete({ gist_id: gistId });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== STARS ==========
ipcMain.handle('github-list-starred', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.activity.listReposStarredByAuthenticatedUser({ per_page: 100 });
    return { success: true, repos: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-star-repo', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.activity.starRepoForAuthenticatedUser({ owner, repo });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-unstar-repo', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.activity.unstarRepoForAuthenticatedUser({ owner, repo });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== NOTIFICATIONS ==========
ipcMain.handle('github-list-notifications', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.activity.listNotificationsForAuthenticatedUser({ per_page: 50 });
    return { success: true, notifications: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-mark-notification-read', async (event, threadId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.activity.markThreadAsRead({ thread_id: threadId });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== COLLABORATORS ==========
ipcMain.handle('github-list-collaborators', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listCollaborators({ owner, repo, per_page: 100 });
    return { success: true, collaborators: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-add-collaborator', async (event, owner, repo, username, permission) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.repos.addCollaborator({ owner, repo, username, permission: permission || 'push' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-remove-collaborator', async (event, owner, repo, username) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.repos.removeCollaborator({ owner, repo, username });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== ACTIONS / WORKFLOWS ==========
ipcMain.handle('github-list-workflows', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.actions.listRepoWorkflows({ owner, repo });
    return { success: true, workflows: data.workflows };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-list-workflow-runs', async (event, owner, repo, workflowId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const params = { owner, repo, per_page: 20 };
    if (workflowId) params.workflow_id = workflowId;
    const { data } = await octokit.actions.listWorkflowRunsForRepo(params);
    return { success: true, runs: data.workflow_runs };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== FILE BROWSER ==========
ipcMain.handle('github-get-contents', async (event, owner, repo, path, ref) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const params = { owner, repo, path: path || '' };
    if (ref) params.ref = ref;
    const { data } = await octokit.repos.getContent(params);
    return { success: true, contents: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-get-readme', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    return { success: true, readme: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== SEARCH ==========
ipcMain.handle('github-search-repos', async (event, query) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.search.repos({ q: query, per_page: 30 });
    return { success: true, repos: data.items, total_count: data.total_count };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-search-users', async (event, query) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.search.users({ q: query, per_page: 30 });
    return { success: true, users: data.items, total_count: data.total_count };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== LOCAL GIT OPERATIONS ==========
ipcMain.handle('git-clone', async (event, url, targetPath) => {
  try {
    const token = store.get('github-token');
    let cloneUrl = url;
    if (token && url.startsWith('https://github.com/')) {
      cloneUrl = url.replace('https://github.com/', `https://${token}@github.com/`);
    }
    const git = simpleGit();
    await git.clone(cloneUrl, targetPath);
    return { success: true, path: targetPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-status', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();
    return { success: true, status };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-log', async (event, repoPath, maxCount) => {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount: maxCount || 50 });
    return { success: true, log };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-add', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.add(files);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-commit', async (event, repoPath, message) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.commit(message);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-push', async (event, repoPath, remote, branch) => {
  try {
    const git = simpleGit(repoPath);
    await git.push(remote || 'origin', branch || undefined);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-pull', async (event, repoPath, remote, branch) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.pull(remote || 'origin', branch || undefined);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-fetch', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.fetch();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-diff', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const diff = await git.diff();
    return { success: true, diff };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-branch-local', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const branches = await git.branchLocal();
    return { success: true, branches };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-checkout', async (event, repoPath, branch) => {
  try {
    const git = simpleGit(repoPath);
    await git.checkout(branch);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-init', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.init();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-remote-add', async (event, repoPath, name, url) => {
  try {
    const git = simpleGit(repoPath);
    await git.addRemote(name, url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-stash', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.stash();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-stash-pop', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.stash(['pop']);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== DIALOG ==========
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return { success: false };
  return { success: true, path: result.filePaths[0] };
});

// ========== SHELL ==========
ipcMain.handle('open-external', async (event, url) => {
  // Only allow https URLs to github.com for security
  if (url && (url.startsWith('https://github.com/') || url.startsWith('https://docs.github.com/'))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Only GitHub URLs are allowed' };
});

// ========== ORGANIZATIONS ==========
ipcMain.handle('github-list-orgs', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.orgs.listForAuthenticatedUser({ per_page: 100 });
    return { success: true, orgs: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== TAGS ==========
ipcMain.handle('github-list-tags', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listTags({ owner, repo, per_page: 100 });
    return { success: true, tags: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== FOLLOWERS / FOLLOWING ==========
ipcMain.handle('github-list-followers', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.users.listFollowersForAuthenticatedUser({ per_page: 100 });
    return { success: true, users: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-list-following', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.users.listFollowedByAuthenticatedUser({ per_page: 100 });
    return { success: true, users: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== MILESTONES ==========
ipcMain.handle('github-list-milestones', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.listMilestones({ owner, repo, per_page: 100 });
    return { success: true, milestones: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-create-milestone', async (event, owner, repo, milestoneData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.createMilestone({
      owner, repo,
      title: milestoneData.title,
      description: milestoneData.description || '',
      due_on: milestoneData.due_on || undefined
    });
    return { success: true, milestone: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REPO TOPICS ==========
ipcMain.handle('github-get-topics', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.getAllTopics({ owner, repo });
    return { success: true, topics: data.names };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-replace-topics', async (event, owner, repo, names) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.replaceAllTopics({ owner, repo, names });
    return { success: true, topics: data.names };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REPO UPDATE ==========
ipcMain.handle('github-update-repo', async (event, owner, repo, updateData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.update({
      owner, repo,
      ...updateData
    });
    return { success: true, repo: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REPO LANGUAGES ==========
ipcMain.handle('github-get-languages', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listLanguages({ owner, repo });
    return { success: true, languages: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== COMPARE BRANCHES ==========
ipcMain.handle('github-compare-commits', async (event, owner, repo, base, head) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.compareCommits({ owner, repo, base, head });
    return { success: true, comparison: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== PR REVIEWS ==========
ipcMain.handle('github-list-pr-reviews', async (event, owner, repo, pullNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.listReviews({ owner, repo, pull_number: pullNumber });
    return { success: true, reviews: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== PR FILES (DIFF) ==========
ipcMain.handle('github-list-pr-files', async (event, owner, repo, pullNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 });
    return { success: true, files: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REOPEN ISSUE ==========
ipcMain.handle('github-reopen-issue', async (event, owner, repo, issueNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.update({ owner, repo, issue_number: issueNumber, state: 'open' });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== UPDATE ISSUE (ASSIGNEES/MILESTONES) ==========
ipcMain.handle('github-update-issue', async (event, owner, repo, issueNumber, updateData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.update({ owner, repo, issue_number: issueNumber, ...updateData });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== CLOSE/REOPEN MILESTONE ==========
ipcMain.handle('github-update-milestone', async (event, owner, repo, milestoneNumber, state) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.issues.updateMilestone({ owner, repo, milestone_number: milestoneNumber, state });
    return { success: true, milestone: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== DELETE LABEL ==========
ipcMain.handle('github-delete-label', async (event, owner, repo, name) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.issues.deleteLabel({ owner, repo, name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== FOLLOW / UNFOLLOW ==========
ipcMain.handle('github-follow-user', async (event, username) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.users.follow({ username });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github-unfollow-user', async (event, username) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.users.unfollow({ username });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GET OTHER USER PROFILE ==========
ipcMain.handle('github-get-user-by-name', async (event, username) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.users.getByUsername({ username });
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GIST UPDATE ==========
ipcMain.handle('github-update-gist', async (event, gistId, updateData) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.gists.update({ gist_id: gistId, ...updateData });
    return { success: true, gist: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GIST FORK ==========
ipcMain.handle('github-fork-gist', async (event, gistId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.gists.fork({ gist_id: gistId });
    return { success: true, gist: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GET GIST DETAIL ==========
ipcMain.handle('github-get-gist', async (event, gistId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.gists.get({ gist_id: gistId });
    return { success: true, gist: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== MARK ALL NOTIFICATIONS READ ==========
ipcMain.handle('github-mark-all-notifications-read', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.activity.markNotificationsAsRead();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== SEARCH CODE ==========
ipcMain.handle('github-search-code', async (event, query) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.search.code({ q: query, per_page: 30 });
    return { success: true, items: data.items, total_count: data.total_count };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== SEARCH ISSUES ==========
ipcMain.handle('github-search-issues', async (event, query) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.search.issuesAndPullRequests({ q: query, per_page: 30 });
    return { success: true, items: data.items, total_count: data.total_count };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== DELETE RELEASE ==========
ipcMain.handle('github-delete-release', async (event, owner, repo, releaseId) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.repos.deleteRelease({ owner, repo, release_id: releaseId });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REOPEN PR ==========
ipcMain.handle('github-reopen-pr', async (event, owner, repo, pullNumber) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.pulls.update({ owner, repo, pull_number: pullNumber, state: 'open' });
    return { success: true, pr: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== REPO CONTRIBUTORS ==========
ipcMain.handle('github-list-contributors', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listContributors({ owner, repo, per_page: 100 });
    return { success: true, contributors: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GIT LOCAL: BRANCH CREATE, TAG CREATE, RESET ==========
ipcMain.handle('git-create-branch', async (event, repoPath, branchName) => {
  try {
    const git = simpleGit(repoPath);
    await git.checkoutLocalBranch(branchName);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-tag', async (event, repoPath, tagName, message) => {
  try {
    const git = simpleGit(repoPath);
    if (message) {
      await git.addAnnotatedTag(tagName, message);
    } else {
      await git.addTag(tagName);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('git-reset', async (event, repoPath, mode) => {
  try {
    const git = simpleGit(repoPath);
    await git.reset(mode === 'hard' ? ['--hard'] : ['--soft']);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== GITHUB EVENTS ==========
ipcMain.handle('github-list-events', async () => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const user = await octokit.users.getAuthenticated();
    const { data } = await octokit.activity.listEventsForAuthenticatedUser({ username: user.data.login, per_page: 30 });
    return { success: true, events: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== CHECK STAR ==========
ipcMain.handle('github-check-star', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    await octokit.activity.getRepoSubscription({ owner, repo });
    return { success: true, starred: true };
  } catch (err) {
    if (err.status === 404) return { success: true, starred: false };
    return { success: false, error: err.message };
  }
});

// ========== DOWNLOAD REPO ZIP ==========
ipcMain.handle('github-download-zip', async (event, owner, repo, ref) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { url } = await octokit.repos.downloadZipballArchive({ owner, repo, ref: ref || 'HEAD' });
    return { success: true, url };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== LIST REPO WATCHERS ==========
ipcMain.handle('github-list-watchers', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.activity.listWatchersForRepo({ owner, repo, per_page: 100 });
    return { success: true, watchers: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== LIST REPO FORKS ==========
ipcMain.handle('github-list-forks', async (event, owner, repo) => {
  if (!octokit) return { success: false, error: 'Not authenticated' };
  try {
    const { data } = await octokit.repos.listForks({ owner, repo, per_page: 100 });
    return { success: true, forks: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
