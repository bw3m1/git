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
    date: '2024-06-01T10:00:00',
    branch: 'main',
    parents: [],
    isHead: false,
    changes: [
      { file: 'README.md', status: 'added', lines: '+10' }
    ]
  },
  {
    hash: 'd4e5f6g',
    message: 'Added feature X',
    author: 'Bob',
    date: '2024-06-02T14:30:00',
    branch: 'feature',
    parents: ['a1b2c3d'],
    isHead: false,
    changes: [
      { file: 'feature.js', status: 'added', lines: '+120' },
      { file: 'README.md', status: 'modified', lines: '+2 -1' }
    ]
  },
  {
    hash: 'h7i8j9k',
    message: 'Started branch: "feature"',
    author: 'Carol',
    date: '2024-06-03T09:15:00',
    branch: 'feature',
    parents: ['d4e5f6g'],
    isHead: false,
    changes: [
      { file: 'feature.js', status: 'added', lines: '+50' }
    ]
  },
  {
    hash: 'l0m1n2o',
    message: 'Merged branches feature and main',
    author: 'Alice',
    date: '2024-06-04T16:45:00',
    branch: 'main',
    parents: ['d4e5f6g', 'h7i8j9k'],
    isHead: true,
    changes: [
      { file: 'feature2.js', status: 'added', lines: '+50' }
    ]
  }
];

// GitKraken-like branch colors
const branchColors = [
  "#1b647c", // teal
  "#11448d", // blue
  "#550f72", // purple
  "#711b6c", // pink-ish
  "#7b104a", // red-ish
  "#751012", // dark red
  "#873e28", // oringe-ish
  "#87742b"  // yellow-ish
];

// Dynamically assign columns and colors to branches
function getBranchMap(commits) {
  const branchMap = {};
  let col = 0;
  commits.forEach(c => {
    const branch = c.branch || '';
    if (branch && !(branch in branchMap)) {
      branchMap[branch] = {
        col: col++,
        color: branchColors[(col - 1) % branchColors.length]
      };
    }
  });
  return branchMap;
}

// Helper to get branch for a commit
function getBranch(commit) {
  return commit.branch || '';
}

function renderGitTree() {
  // Use document fragment for batch DOM updates
  const fragment = document.createDocumentFragment();
  gitTree.innerHTML = '';

  // Add header row
  const header = document.createElement('div');
  header.className = 'git-tree-header';
  header.innerHTML = `
    <span>Branch / Tag</span>
    <span>Graph</span>
    <span>Commit Message</span>
    <span>Date / Time</span>
    <span>Commit ID</span>
  `;
  fragment.appendChild(header);

  // Sort commits by date (newest first)
  const displayCommits = [...commits].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Assign columns/colors to branches with better distribution
  const branchMap = getBranchMap(displayCommits);
  const numCols = Math.max(3, Object.keys(branchMap).length); // Minimum 3 columns for better spacing
  const cellWidth = 30;
  const cellHeight = 44; // Slightly taller for better curves

  // Map from hash to row index for graph lines
  const hashToRow = {};
  displayCommits.forEach((c, i) => { hashToRow[c.hash] = i; });

  // Precompute commit branches and lane information
  const commitBranches = new Map();
  const commitLanes = new Map();
  displayCommits.forEach(commit => {
    commitBranches.set(commit, getBranch(commit));
    commitLanes.set(commit, branchMap[getBranch(commit)]?.col || 0);
  });

  // Track active branches for continuous lines
  const activeBranches = new Set();

  // For each commit, render a row (from newest to oldest)
  displayCommits.forEach((commit, idx) => {
    const node = document.createElement('div');
    node.className = `commit-node${commit.isHead ? ' head-commit' : ''}`;
    node.setAttribute('data-hash', commit.hash);

    // Branch/Tag cell with improved styling
    let branchTagHtml = '';
    if (commit.branch) {
      const branchColor = branchMap[commit.branch]?.color || branchColors[0];
      branchTagHtml += `
        <span class="branch-tag" style="background:${branchColor};color:${getContrastColor(branchColor)}">
          ${commit.branch}
          ${commit.isHead ? '<span class="head-indicator"></span>' : ''}
        </span>`;
    }

    // SVG graph cell - enhanced for GitKraken look
    const graphCell = document.createElement('div');
    graphCell.className = 'commit-graph-cell';
    
    const branch = commitBranches.get(commit);
    const branchInfo = branchMap[branch] || { col: 0, color: branchColors[0] };
    const colIdx = branchInfo.col;
    const color = branchInfo.color;
    const svgWidth = cellWidth * numCols;

    // Create SVG with improved dimensions
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", cellHeight);
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${cellHeight}`);
    svg.style.overflow = "visible";

    // Draw vertical branch lines with gradient effect
    Object.entries(branchMap).forEach(([b, info]) => {
      const x = cellWidth / 2 + info.col * cellWidth;
      const isActive = activeBranches.has(b);
      const opacity = isActive ? 0.25 : 0.15;
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", cellHeight);
      line.setAttribute("stroke", info.color);
      line.setAttribute("stroke-width", isActive ? "3.5" : "2.5");
      line.setAttribute("opacity", opacity);
      if (!isActive) {
        line.setAttribute("stroke-dasharray", "3,3");
      }
      svg.appendChild(line);
    });

    // Update active branches
    commit.parents.forEach(parentHash => {
      const parentRow = hashToRow[parentHash];
      if (parentRow !== undefined) {
        const parentCommit = displayCommits[parentRow];
        const parentBranch = commitBranches.get(parentCommit);
        if (parentBranch) activeBranches.add(parentBranch);
      }
    });

    // Draw connections to parents with smoother curves
    commit.parents.forEach((parentHash, parentIndex) => {
      const parentRow = hashToRow[parentHash];
      if (parentRow !== undefined) {
        const parentCommit = displayCommits[parentRow];
        const parentBranch = commitBranches.get(parentCommit);
        const parentInfo = branchMap[parentBranch] || { col: 0, color: branchColors[0] };
        
        const x1 = cellWidth / 2 + colIdx * cellWidth;
        const y1 = cellHeight / 2;
        const x2 = cellWidth / 2 + parentInfo.col * cellWidth;
        const y2 = cellHeight / 2 + (parentRow - idx) * cellHeight;
        const isMerge = commit.parents.length > 1 && parentIndex > 0;

        // Enhanced Bezier curves with dynamic control points
        const curveFactor = Math.min(80, Math.max(20, Math.abs(colIdx - parentInfo.col) * 25));
        const d = isMerge 
          ? `M${x1},${y1} C${x1},${y1 + curveFactor*0.7} ${x2},${y2 - curveFactor*0.5} ${x2},${y2}`
          : `M${x1},${y1} C${x1},${y1 + curveFactor} ${x2},${y2 - curveFactor} ${x2},${y2}`;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", parentInfo.color);
        path.setAttribute("stroke-width", isMerge ? "2.5" : "3");
        path.setAttribute("fill", "none");
        path.setAttribute("opacity", isMerge ? "0.7" : "0.9");
        path.setAttribute("class", "commit-path");
        svg.appendChild(path);
      }
    });

    // Draw the commit dot with enhanced styling
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const dotX = cellWidth / 2 + colIdx * cellWidth;
    dot.setAttribute("cx", dotX);
    dot.setAttribute("cy", cellHeight / 2);
    dot.setAttribute("r", "9");
    dot.setAttribute("fill", commit.isHead ? '#ff7b26' : color);
    dot.setAttribute("stroke", "#ffffff");
    dot.setAttribute("stroke-width", commit.isHead ? "3" : "2");
    dot.setAttribute("class", "commit-dot");
    dot.setAttribute("filter", "url(#commit-glow)");
    svg.appendChild(dot);

    // Add glow filter for commit dots
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "commit-glow");
    filter.setAttribute("x", "-30%");
    filter.setAttribute("y", "-30%");
    filter.setAttribute("width", "160%");
    filter.setAttribute("height", "160%");
    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "2");
    feGaussianBlur.setAttribute("result", "blur");
    const feComposite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    feComposite.setAttribute("in", "SourceGraphic");
    feComposite.setAttribute("in2", "blur");
    feComposite.setAttribute("operator", "over");
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feComposite);
    svg.appendChild(filter);

    // Draw HEAD indicator with animation
    if (commit.isHead) {
      const headIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      headIndicator.setAttribute("cx", dotX);
      headIndicator.setAttribute("cy", cellHeight / 2);
      headIndicator.setAttribute("r", "5");
      headIndicator.setAttribute("fill", "#ffffff");
      headIndicator.setAttribute("class", "head-dot");
      svg.appendChild(headIndicator);
    }

    graphCell.appendChild(svg);

    // Compose row with improved structure
    node.innerHTML = `
      <div class="commit-branch-tag">${branchTagHtml}</div>
      <div class="commit-graph"></div>
      <div class="commit-message">
        <span class="message-text">${commit.message}</span>
        ${commit.parents.length > 1 ? '<span class="merge-indicator">Merge</span>' : ''}
      </div>
      <div class="commit-date">${formatDateTime(commit.date)}</div>
      <div class="commit-sha">${commit.hash.substring(0, 7)}</div>
    `;

    // Insert graph
    node.querySelector('.commit-graph').replaceWith(graphCell);
    node.addEventListener('click', () => showCommitDetails(commit));
    fragment.appendChild(node);

    // Update active branches after rendering
    if (branch) activeBranches.add(branch);
  });

  gitTree.appendChild(fragment);
}

// Helper to get contrasting text color
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#222' : '#fff';
}

// Helper functions
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
        <span>Date: ${formatDateTime(commit.date)}</span>
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