// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const gitTreeContainer = document.getElementById('gitTree');
  const rightPanel = document.querySelector('.right-panel');
  const closePanelBtn = document.querySelector('.close-panel');
  const commitDetails = document.querySelector('.commit-details');
  const placeholder = document.querySelector('.placeholder');

  // Sample commit data
  const commits = [
    {
      id: 'a1b2c3d4',
      author: 'Alice Developer',
      date: '2023-05-15 10:30:45',
      message: 'Initial project setup',
      changes: [
        { file: 'index.html', status: 'A', lines: 45 },
        { file: 'styles.css', status: 'A', lines: 120 },
        { file: 'scripts.js', status: 'A', lines: 80 }
      ]
    },
    {
      id: 'e5f6g7h8',
      author: 'Bob Programmer',
      date: '2023-05-16 14:22:31',
      message: 'Add menu functionality',
      changes: [
        { file: 'scripts.js', status: 'M', lines: 42 },
        { file: 'styles.css', status: 'M', lines: 18 },
        { file: 'utils.js', status: 'A', lines: 67 }
      ]
    },
    {
      id: 'i9j0k1l2',
      author: 'Alice Developer',
      date: '2023-05-17 09:15:22',
      message: 'Implement commit details panel',
      changes: [
        { file: 'scripts.js', status: 'M', lines: 95 },
        { file: 'styles.css', status: 'M', lines: 32 },
        { file: 'panel.html', status: 'A', lines: 28 }
      ]
    }
  ];

  // Generate the Git tree visualization
  function renderGitTree() {
    gitTreeContainer.innerHTML = '';

    commits.forEach((commit, index) => {
      // Create commit node
      const commitNode = document.createElement('div');
      commitNode.className = 'commit-node';
      commitNode.dataset.commitId = commit.id;

      // Commit dot and line
      const commitDot = document.createElement('div');
      commitDot.className = 'commit-dot';

      // Commit info
      const commitInfo = document.createElement('div');
      commitInfo.className = 'commit-info';

      const commitHash = document.createElement('span');
      commitHash.className = 'commit-hash';
      commitHash.textContent = commit.id.substring(0, 7);

      const commitMessage = document.createElement('span');
      commitMessage.className = 'commit-message';
      commitMessage.textContent = commit.message;

      commitInfo.appendChild(commitHash);
      commitInfo.appendChild(commitMessage);

      commitNode.appendChild(commitDot);
      commitNode.appendChild(commitInfo);

      // Add branch tag for the first commit
      if (index === 0) {
        const branchTag = document.createElement('div');
        branchTag.className = 'branch-tag';
        branchTag.textContent = 'main';
        commitNode.appendChild(branchTag);
      }

      // Add click event to show details
      commitNode.addEventListener('click', () => showCommitDetails(commit));

      gitTreeContainer.appendChild(commitNode);

      // Add connection line between commits
      if (index < commits.length - 1) {
        const connectionLine = document.createElement('div');
        connectionLine.className = 'connection-line';
        gitTreeContainer.appendChild(connectionLine);
      }
    });
  }

  // Show commit details in right panel
  function showCommitDetails(commit) {
    placeholder.style.display = 'none';

    let detailsHTML = `
            <div class="commit-header">
                <h3>${commit.message}</h3>
                <div class="commit-meta">
                    <span class="commit-hash">${commit.id}</span>
                    <span>${commit.author}</span>
                    <span>${commit.date}</span>
                </div>
            </div>
            <div class="changes-list">
                <h4>Changes:</h4>
                <ul>
        `;

    commit.changes.forEach(change => {
      const statusClass =
        change.status === 'A' ? 'change-added' :
          change.status === 'M' ? 'change-modified' : 'change-deleted';

      detailsHTML += `
                <li>
                    <span class="change-status ${statusClass}">${change.status}</span>
                    <span class="change-file">${change.file}</span>
                    <span class="change-lines">(${change.lines} lines)</span>
                </li>
            `;
    });

    detailsHTML += `
                </ul>
            </div>
            <div class="commit-actions">
                <button class="btn">View Diff</button>
                <button class="btn">Checkout</button>
                <button class="btn">Revert</button>
            </div>
        `;

    commitDetails.innerHTML = detailsHTML;
    rightPanel.classList.add('open');
  }

  // Close right panel
  closePanelBtn.addEventListener('click', () => {
    rightPanel.classList.remove('open');
    placeholder.style.display = 'block';
  });

  // Initialize the Git tree
  renderGitTree();
});
