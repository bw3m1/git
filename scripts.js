// Toggle right panel open/close
const rightPanel = document.querySelector('.right-panel');
const closePanelBtn = document.querySelector('.close-panel');
const commitDetails = document.querySelector('.commit-details');
const gitTree = document.getElementById('gitTree');

// Dummy commit data for demonstration
const commits = [
  {
    hash: 'a1b2c3d',
    message: 'Initial commit',
    author: 'Alice',
    date: '2024-06-01',
    branch: 'main',
    changes: [
      { file: 'README.md', status: 'added', lines: '+10' }
    ]
  },
  {
    hash: 'd4e5f6g',
    message: 'Add feature X',
    author: 'Bob',
    date: '2024-06-02',
    branch: '',
    changes: [
      { file: 'feature.js', status: 'added', lines: '+120' },
      { file: 'README.md', status: 'modified', lines: '+2 -1' }
    ]
  }
];

// Render the commit tree
function renderGitTree() {
  gitTree.innerHTML = '';
  commits.forEach((commit, idx) => {
    const node = document.createElement('div');
    node.className = 'commit-node';
    node.innerHTML = `
      <div class="commit-dot"></div>
      <div class="commit-info">
        <span class="commit-hash">${commit.hash}</span>
        <span class="commit-message">${commit.message}</span>
      </div>
      ${commit.branch ? `<span class="branch-tag">${commit.branch}</span>` : ''}
    `;
    node.addEventListener('click', () => showCommitDetails(commit));
    gitTree.appendChild(node);
    if (idx < commits.length - 1) {
      const line = document.createElement('div');
      line.className = 'connection-line';
      gitTree.appendChild(line);
    }
  });
}

// Show commit details in the right panel
function showCommitDetails(commit) {
  rightPanel.classList.add('open');
  commitDetails.innerHTML = `
    <div class="commit-header">
      <h3>${commit.message}</h3>
      <div class="commit-meta">
        <span>Hash: ${commit.hash}</span>
        <span>Author: ${commit.author}</span>
        <span>Date: ${commit.date}</span>
        ${commit.branch ? `<span>Branch: ${commit.branch}</span>` : ''}
      </div>
    </div>
    <div class="changes-list">
      <h4>Changes</h4>
      <ul>
        ${commit.changes.map(change => `
          <li>
            <span class="change-status change-${change.status}">${change.status[0].toUpperCase()}</span>
            <span class="change-file">${change.file}</span>
            <span class="change-lines">${change.lines}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// Close right panel
closePanelBtn.addEventListener('click', () => {
  rightPanel.classList.remove('open');
});

// Initial render
renderGitTree();
