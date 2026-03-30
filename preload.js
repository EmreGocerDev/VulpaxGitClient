const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vulpax', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Auth
  auth: (token) => ipcRenderer.invoke('github-auth', token),
  logout: () => ipcRenderer.invoke('github-logout'),
  getUser: () => ipcRenderer.invoke('github-get-user'),

  // Repos
  listRepos: (params) => ipcRenderer.invoke('github-list-repos', params),
  createRepo: (data) => ipcRenderer.invoke('github-create-repo', data),
  deleteRepo: (owner, repo) => ipcRenderer.invoke('github-delete-repo', owner, repo),
  forkRepo: (owner, repo) => ipcRenderer.invoke('github-fork-repo', owner, repo),
  getRepo: (owner, repo) => ipcRenderer.invoke('github-get-repo', owner, repo),

  // Branches
  listBranches: (owner, repo) => ipcRenderer.invoke('github-list-branches', owner, repo),
  createBranch: (owner, repo, name, from) => ipcRenderer.invoke('github-create-branch', owner, repo, name, from),
  deleteBranch: (owner, repo, branch) => ipcRenderer.invoke('github-delete-branch', owner, repo, branch),

  // Commits
  listCommits: (owner, repo, params) => ipcRenderer.invoke('github-list-commits', owner, repo, params),
  getCommit: (owner, repo, ref) => ipcRenderer.invoke('github-get-commit', owner, repo, ref),

  // Pull Requests
  listPRs: (owner, repo, state) => ipcRenderer.invoke('github-list-prs', owner, repo, state),
  createPR: (owner, repo, data) => ipcRenderer.invoke('github-create-pr', owner, repo, data),
  mergePR: (owner, repo, num, method) => ipcRenderer.invoke('github-merge-pr', owner, repo, num, method),
  closePR: (owner, repo, num) => ipcRenderer.invoke('github-close-pr', owner, repo, num),

  // Issues
  listIssues: (owner, repo, state) => ipcRenderer.invoke('github-list-issues', owner, repo, state),
  createIssue: (owner, repo, data) => ipcRenderer.invoke('github-create-issue', owner, repo, data),
  closeIssue: (owner, repo, num) => ipcRenderer.invoke('github-close-issue', owner, repo, num),
  commentIssue: (owner, repo, num, body) => ipcRenderer.invoke('github-comment-issue', owner, repo, num, body),
  listIssueComments: (owner, repo, num) => ipcRenderer.invoke('github-list-issue-comments', owner, repo, num),

  // Labels
  listLabels: (owner, repo) => ipcRenderer.invoke('github-list-labels', owner, repo),
  createLabel: (owner, repo, data) => ipcRenderer.invoke('github-create-label', owner, repo, data),

  // Releases
  listReleases: (owner, repo) => ipcRenderer.invoke('github-list-releases', owner, repo),
  createRelease: (owner, repo, data) => ipcRenderer.invoke('github-create-release', owner, repo, data),

  // Gists
  listGists: () => ipcRenderer.invoke('github-list-gists'),
  createGist: (data) => ipcRenderer.invoke('github-create-gist', data),
  deleteGist: (id) => ipcRenderer.invoke('github-delete-gist', id),

  // Stars
  listStarred: () => ipcRenderer.invoke('github-list-starred'),
  starRepo: (owner, repo) => ipcRenderer.invoke('github-star-repo', owner, repo),
  unstarRepo: (owner, repo) => ipcRenderer.invoke('github-unstar-repo', owner, repo),

  // Notifications
  listNotifications: () => ipcRenderer.invoke('github-list-notifications'),
  markNotificationRead: (id) => ipcRenderer.invoke('github-mark-notification-read', id),

  // Collaborators
  listCollaborators: (owner, repo) => ipcRenderer.invoke('github-list-collaborators', owner, repo),
  addCollaborator: (owner, repo, user, perm) => ipcRenderer.invoke('github-add-collaborator', owner, repo, user, perm),
  removeCollaborator: (owner, repo, user) => ipcRenderer.invoke('github-remove-collaborator', owner, repo, user),

  // Workflows
  listWorkflows: (owner, repo) => ipcRenderer.invoke('github-list-workflows', owner, repo),
  listWorkflowRuns: (owner, repo, id) => ipcRenderer.invoke('github-list-workflow-runs', owner, repo, id),

  // File browser
  getContents: (owner, repo, path, ref) => ipcRenderer.invoke('github-get-contents', owner, repo, path, ref),
  getReadme: (owner, repo) => ipcRenderer.invoke('github-get-readme', owner, repo),

  // Search
  searchRepos: (q) => ipcRenderer.invoke('github-search-repos', q),
  searchUsers: (q) => ipcRenderer.invoke('github-search-users', q),

  // Local Git - Basic
  gitClone: (url, path) => ipcRenderer.invoke('git-clone', url, path),
  gitStatus: (path) => ipcRenderer.invoke('git-status', path),
  gitLog: (path, max) => ipcRenderer.invoke('git-log', path, max),
  gitAdd: (path, files) => ipcRenderer.invoke('git-add', path, files),
  gitCommit: (path, msg) => ipcRenderer.invoke('git-commit', path, msg),
  gitPush: (path, remote, branch) => ipcRenderer.invoke('git-push', path, remote, branch),
  gitPull: (path, remote, branch) => ipcRenderer.invoke('git-pull', path, remote, branch),
  gitFetch: (path) => ipcRenderer.invoke('git-fetch', path),
  gitDiff: (path) => ipcRenderer.invoke('git-diff', path),
  gitBranchLocal: (path) => ipcRenderer.invoke('git-branch-local', path),
  gitCheckout: (path, branch) => ipcRenderer.invoke('git-checkout', path, branch),
  gitInit: (path) => ipcRenderer.invoke('git-init', path),
  gitRemoteAdd: (path, name, url) => ipcRenderer.invoke('git-remote-add', path, name, url),
  gitStash: (path) => ipcRenderer.invoke('git-stash', path),
  gitStashPop: (path) => ipcRenderer.invoke('git-stash-pop', path),

  // Local Git - Enhanced
  gitRemoteList: (path) => ipcRenderer.invoke('git-remote-list', path),
  gitRemoteRemove: (path, name) => ipcRenderer.invoke('git-remote-remove', path, name),
  gitStashList: (path) => ipcRenderer.invoke('git-stash-list', path),
  gitStashDrop: (path, index) => ipcRenderer.invoke('git-stash-drop', path, index),
  gitDiffStaged: (path) => ipcRenderer.invoke('git-diff-staged', path),
  gitDiffFile: (path, file) => ipcRenderer.invoke('git-diff-file', path, file),
  gitLogFile: (path, file) => ipcRenderer.invoke('git-log-file', path, file),
  gitShow: (path, ref) => ipcRenderer.invoke('git-show', path, ref),
  gitMergeBranch: (path, branch) => ipcRenderer.invoke('git-merge-branch', path, branch),
  gitCherryPick: (path, hash) => ipcRenderer.invoke('git-cherry-pick', path, hash),
  gitRevert: (path, hash) => ipcRenderer.invoke('git-revert', path, hash),
  gitClean: (path) => ipcRenderer.invoke('git-clean', path),
  gitConfigGet: (path, key) => ipcRenderer.invoke('git-config-get', path, key),
  gitConfigSet: (path, key, value) => ipcRenderer.invoke('git-config-set', path, key, value),
  gitUnstage: (path, files) => ipcRenderer.invoke('git-unstage', path, files),
  gitTagList: (path) => ipcRenderer.invoke('git-tag-list', path),
  gitTagDelete: (path, tag) => ipcRenderer.invoke('git-tag-delete', path, tag),
  gitPushTags: (path) => ipcRenderer.invoke('git-push-tags', path),
  gitAddFile: (path, file) => ipcRenderer.invoke('git-add-file', path, file),
  gitBranchDelete: (path, branch) => ipcRenderer.invoke('git-branch-delete', path, branch),
  gitCommitAmend: (path, msg) => ipcRenderer.invoke('git-commit-amend', path, msg),

  // Local File Operations (Code Editor)
  localReadFile: (path) => ipcRenderer.invoke('local-read-file', path),
  localWriteFile: (path, content) => ipcRenderer.invoke('local-write-file', path, content),
  localListDir: (path) => ipcRenderer.invoke('local-list-dir', path),
  localCreateFile: (path, content) => ipcRenderer.invoke('local-create-file', path, content),
  localDeleteFile: (path) => ipcRenderer.invoke('local-delete-file', path),
  localFileStat: (path) => ipcRenderer.invoke('local-file-stat', path),

  // Dialog
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Orgs
  listOrgs: () => ipcRenderer.invoke('github-list-orgs'),

  // Tags
  listTags: (owner, repo) => ipcRenderer.invoke('github-list-tags', owner, repo),

  // Followers
  listFollowers: () => ipcRenderer.invoke('github-list-followers'),
  listFollowing: () => ipcRenderer.invoke('github-list-following'),

  // Milestones
  listMilestones: (owner, repo) => ipcRenderer.invoke('github-list-milestones', owner, repo),
  createMilestone: (owner, repo, data) => ipcRenderer.invoke('github-create-milestone', owner, repo, data),
  updateMilestone: (owner, repo, num, state) => ipcRenderer.invoke('github-update-milestone', owner, repo, num, state),

  // Repo Topics
  getTopics: (owner, repo) => ipcRenderer.invoke('github-get-topics', owner, repo),
  replaceTopics: (owner, repo, names) => ipcRenderer.invoke('github-replace-topics', owner, repo, names),

  // Repo Update
  updateRepo: (owner, repo, data) => ipcRenderer.invoke('github-update-repo', owner, repo, data),

  // Repo Languages
  getLanguages: (owner, repo) => ipcRenderer.invoke('github-get-languages', owner, repo),

  // Compare
  compareCommits: (owner, repo, base, head) => ipcRenderer.invoke('github-compare-commits', owner, repo, base, head),

  // PR Reviews & Files
  listPRReviews: (owner, repo, num) => ipcRenderer.invoke('github-list-pr-reviews', owner, repo, num),
  listPRFiles: (owner, repo, num) => ipcRenderer.invoke('github-list-pr-files', owner, repo, num),

  // Reopen Issue/PR
  reopenIssue: (owner, repo, num) => ipcRenderer.invoke('github-reopen-issue', owner, repo, num),
  reopenPR: (owner, repo, num) => ipcRenderer.invoke('github-reopen-pr', owner, repo, num),

  // Update Issue
  updateIssue: (owner, repo, num, data) => ipcRenderer.invoke('github-update-issue', owner, repo, num, data),

  // Delete Label
  deleteLabel: (owner, repo, name) => ipcRenderer.invoke('github-delete-label', owner, repo, name),

  // Follow/Unfollow
  followUser: (username) => ipcRenderer.invoke('github-follow-user', username),
  unfollowUser: (username) => ipcRenderer.invoke('github-unfollow-user', username),

  // Get Other User
  getUserByName: (username) => ipcRenderer.invoke('github-get-user-by-name', username),

  // Gist Update/Fork/Detail
  updateGist: (id, data) => ipcRenderer.invoke('github-update-gist', id, data),
  forkGist: (id) => ipcRenderer.invoke('github-fork-gist', id),
  getGist: (id) => ipcRenderer.invoke('github-get-gist', id),

  // Mark all notifications
  markAllNotificationsRead: () => ipcRenderer.invoke('github-mark-all-notifications-read'),

  // Search code & issues
  searchCode: (q) => ipcRenderer.invoke('github-search-code', q),
  searchIssues: (q) => ipcRenderer.invoke('github-search-issues', q),

  // Delete Release
  deleteRelease: (owner, repo, id) => ipcRenderer.invoke('github-delete-release', owner, repo, id),

  // Contributors
  listContributors: (owner, repo) => ipcRenderer.invoke('github-list-contributors', owner, repo),

  // Local git: branch create, tag, reset
  gitCreateBranch: (path, name) => ipcRenderer.invoke('git-create-branch', path, name),
  gitTag: (path, tag, msg) => ipcRenderer.invoke('git-tag', path, tag, msg),
  gitReset: (path, mode) => ipcRenderer.invoke('git-reset', path, mode),

  // Events
  listEvents: () => ipcRenderer.invoke('github-list-events'),

  // Check star
  checkStar: (owner, repo) => ipcRenderer.invoke('github-check-star', owner, repo),

  // Download zip
  downloadZip: (owner, repo, ref) => ipcRenderer.invoke('github-download-zip', owner, repo, ref),

  // Watchers & Forks list
  listWatchers: (owner, repo) => ipcRenderer.invoke('github-list-watchers', owner, repo),
  listForks: (owner, repo) => ipcRenderer.invoke('github-list-forks', owner, repo),

  // NEW: Git Blame
  gitBlame: (repoPath, filePath) => ipcRenderer.invoke('git-blame', repoPath, filePath),

  // NEW: Git Branch Rename
  gitBranchRename: (repoPath, oldName, newName) => ipcRenderer.invoke('git-branch-rename', repoPath, oldName, newName),

  // NEW: Git Log Search
  gitLogSearch: (repoPath, query, maxCount) => ipcRenderer.invoke('git-log-search', repoPath, query, maxCount),

  // NEW: Git Diff Stat
  gitDiffStat: (repoPath) => ipcRenderer.invoke('git-diff-stat', repoPath),

  // NEW: Git Remote Set URL
  gitRemoteSetUrl: (repoPath, name, url) => ipcRenderer.invoke('git-remote-set-url', repoPath, name, url),

  // NEW: Local File Rename
  localRenameFile: (oldPath, newPath) => ipcRenderer.invoke('local-rename-file', oldPath, newPath),

  // NEW: Local Create Directory
  localCreateDir: (dirPath) => ipcRenderer.invoke('local-create-dir', dirPath),

  // NEW: Local Move File
  localMoveFile: (srcPath, destPath) => ipcRenderer.invoke('local-move-file', srcPath, destPath),

  // NEW: Local File Search
  localFileSearch: (repoPath, query) => ipcRenderer.invoke('local-file-search', repoPath, query),

  // NEW: Git Stash with message
  gitStashSave: (repoPath, message) => ipcRenderer.invoke('git-stash-save', repoPath, message),

  // NEW: Git Stash Apply by index
  gitStashApply: (repoPath, index) => ipcRenderer.invoke('git-stash-apply', repoPath, index),

  // NEW: Git Fetch All
  gitFetchAll: (repoPath) => ipcRenderer.invoke('git-fetch-all', repoPath),

  // NEW: Git Remote Add (uses existing handler)
  // gitRemoteAdd already exists via git-remote-add at line 701

  // NEW: Run Terminal Command
  runCommand: (cwd, command) => ipcRenderer.invoke('run-terminal-command', cwd, command),
});
