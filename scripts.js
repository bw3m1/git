// Toggle right panel open/close
const rightPanel = document.querySelector('.right-panel');
const closePanelBtn = document.querySelector('.close-panel');
const commitDetails = document.querySelector('.commit-details');
const gitTree = document.getElementById('gitTree');

// Example commit data with parent(s) and column for horizontal order
const commits = [
  {
    hash: 'a1b2c3d',
    message: 'Initial commit',
    author: 'Alice',
    date: '2024-06-01',
    branch: 'main',
    parents: [],
    col: 2,
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
    parents: ['a1b2c3d'],
    col: 2,
    changes: [
      { file: 'feature.js', status: 'added', lines: '+120' },
      { file: 'README.md', status: 'modified', lines: '+2 -1' }
    ]
  },
  {
    hash: 'h7i8j9k',
    message: 'Start feature branch',
    author: 'Carol',
    date: '2024-06-03',
    branch: 'feature',
    parents: ['d4e5f6g'],
    col: 3,
    changes: [
      { file: 'feature2.js', status: 'added', lines: '+50' }
    ]
  },
  {
    hash: 'l0m1n2o',
    message: 'Merge feature',
    author: 'Alice',
    date: '2024-06-04',
    branch: 'main',
    parents: ['d4e5f6g', 'h7i8j9k'],
    col: 2,
    changes: [
      { file: 'feature2.js', status: 'added', lines: '+50' }
    ]
  }
];

// Define branches and assign each a column index
const branchCols = {
  main: 0,
  feature: 1
};

// Helper to get branch for a commit
function getBranch(commit) {
  return commit.branch || (commit.col === 2 ? 'main' : 'feature');
}

// Helper to get parent commit object
function getCommitByHash(hash) {
  return commits.find(c => c.hash === hash);
}

// Render the commit tree with improved graph logic
function renderGitTree() {
  gitTree.innerHTML = '';

  // Add header row
  const header = document.createElement('div');
  header.className = 'git-tree-header';
  header.innerHTML = `
    <span>Branch / Tag</span>
    <span>Graph</span>
    <span>Commit Message</span>
    <span>Date / Time</span>
    <span>SHA</span>
  `;
  gitTree.appendChild(header);

  // Reverse for newest at top
  const displayCommits = [...commits].reverse();

  // Map from hash to row index for graph lines
  const hashToRow = {};
  displayCommits.forEach((c, i) => { hashToRow[c.hash] = i; });

  // For each commit, render a row
  displayCommits.forEach((commit, idx) => {
    const node = document.createElement('div');
    node.className = 'commit-node';
    node.setAttribute('data-hash', commit.hash);

    // Branch/Tag cell
    let branchTagHtml = '';
    if (commit.branch) {
      branchTagHtml += `<span class="branch-tag">${commit.branch}</span>`;
    }

    // Graph cell
    const graphCell = document.createElement('div');
    graphCell.className = 'commit-graph-cell';
    graphCell.style.display = 'flex';
    graphCell.style.flexDirection = 'row';
    graphCell.style.justifyContent = 'center';
    graphCell.style.alignItems = 'center';
    graphCell.style.gap = '18px';

    // For each branch column, render a dot and lines
    Object.keys(branchCols).forEach(branch => {
      const colIdx = branchCols[branch];
      const isDot = getBranch(commit) === branch;
      const dot = document.createElement('div');
      dot.style.width = '16px';
      dot.style.height = '16px';
      dot.style.borderRadius = '50%';
      dot.style.background = isDot ? '#4ec9b0' : 'transparent';
      dot.style.position = 'relative';

      // Draw vertical line if previous commit in this branch exists
      let hasVertical = false;
      if (idx < displayCommits.length - 1) {
        // Look for next commit in this branch (older commit)
        for (let j = idx + 1; j < displayCommits.length; ++j) {
          if (getBranch(displayCommits[j]) === branch) {
            // Only draw vertical if this commit is ancestor of the next
            if (displayCommits[j].parents.includes(commit.hash)) {
              hasVertical = true;
            }
            break;
          }
        }
      }
      if (hasVertical) {
        const vLine = document.createElement('div');
        vLine.style.position = 'absolute';
        vLine.style.left = '50%';
        vLine.style.top = '16px';
        vLine.style.width = '2px';
        vLine.style.height = '18px';
        vLine.style.background = '#4ec9b0';
        vLine.style.transform = 'translateX(-50%)';
        dot.appendChild(vLine);
      }

      // Draw vertical line from parent if this is not the first commit in branch
      if (isDot && commit.parents.length > 0) {
        commit.parents.forEach(parentHash => {
          const parentIdx = hashToRow[parentHash];
          if (parentIdx !== undefined) {
            const parentCommit = displayCommits[parentIdx];
            if (getBranch(parentCommit) === branch && parentIdx > idx + 1) {
              // Draw vertical line up to this commit
              const vLine = document.createElement('div');
              vLine.style.position = 'absolute';
              vLine.style.left = '50%';
              vLine.style.top = '-18px';
              vLine.style.width = '2px';
              vLine.style.height = '18px';
              vLine.style.background = '#4ec9b0';
              vLine.style.transform = 'translateX(-50%)';
              dot.appendChild(vLine);
            }
          }
        });
      }

      // Draw horizontal merge line if this commit merges from another branch
      if (commit.parents.length > 1 && isDot) {
        commit.parents.forEach(parentHash => {
          const parentIdx = hashToRow[parentHash];
          if (parentIdx !== undefined) {
            const parentCommit = displayCommits[parentIdx];
            const parentBranch = getBranch(parentCommit);
            const parentCol = branchCols[parentBranch];
            if (parentCol !== colIdx) {
              const hLine = document.createElement('div');
              hLine.style.position = 'absolute';
              hLine.style.top = '50%';
              hLine.style.left = parentCol < colIdx ? '-18px' : '16px';
              hLine.style.width = '18px';
              hLine.style.height = '2px';
              hLine.style.background = '#4ec9b0';
              dot.appendChild(hLine);
            }
          }
        });
      }

      graphCell.appendChild(dot);
    });

    // Compose row
    node.innerHTML = `
      <div class="commit-branch-tag">${branchTagHtml}</div>
      <div class="commit-graph-cell"></div>
      <div class="commit-message">${commit.message}</div>
      <div class="commit-date">${commit.date}</div>
      <div class="commit-sha">${commit.hash}</div>
    `;
    // Replace the empty graph cell with the one we built (with lines/dot)
    node.replaceChild(graphCell, node.children[1]);

    node.addEventListener('click', () => showCommitDetails(commit));
    gitTree.appendChild(node);
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
