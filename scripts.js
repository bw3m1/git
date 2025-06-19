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
    hash: 'p3q4r5s',
    message: 'Hotfix: urgent bugfix',
    author: 'Dan',
    date: '2024-06-03T10:00:00',
    branch: 'hotfix',
    parents: ['a1b2c3d'],
    isHead: false,
    changes: [
      { file: 'main.js', status: 'modified', lines: '+1 -1' }
    ]
  },
  {
    hash: 't6u7v8w',
    message: 'Feature Y (diverged)',
    author: 'Eve',
    date: '2024-06-03T11:00:00',
    branch: 'feature-y',
    parents: ['a1b2c3d'],
    isHead: false,
    changes: [
      { file: 'featureY.js', status: 'added', lines: '+80' }
    ]
  },
  {
    hash: 'x9y0z1a',
    message: 'Continue feature Y',
    author: 'Eve',
    date: '2024-06-03T13:00:00',
    branch: 'feature-y',
    parents: ['t6u7v8w'],
    isHead: false,
    changes: [
      { file: 'featureY.js', status: 'modified', lines: '+30 -5' }
    ]
  },
  {
    hash: 'b2c3d4e',
    message: 'Merge hotfix into main',
    author: 'Alice',
    date: '2024-06-03T14:00:00',
    branch: 'main',
    parents: ['a1b2c3d', 'p3q4r5s'],
    isHead: false,
    changes: [
      { file: 'main.js', status: 'modified', lines: '+1 -1' }
    ]
  },
  {
    hash: 'c5d6e7f',
    message: 'Rebase feature on main',
    author: 'Carol',
    date: '2024-06-03T15:00:00',
    branch: 'feature',
    parents: ['b2c3d4e'],
    isHead: false,
    changes: [
      { file: 'feature.js', status: 'modified', lines: '+10' }
    ]
  },
  {
    hash: 'l0m1n2o',
    message: 'Merged branches feature and main',
    author: 'Alice',
    date: '2024-06-04T16:45:00',
    branch: 'main',
    parents: ['d4e5f6g', 'h7i8j9k'],
    isHead: false,
    changes: [
      { file: 'feature2.js', status: 'added', lines: '+50' }
    ]
  },
  {
    hash: 'm3n4o5p',
    message: 'Merge feature-y into main',
    author: 'Alice',
    date: '2024-06-05T09:00:00',
    branch: 'main',
    parents: ['l0m1n2o', 'x9y0z1a'],
    isHead: false,
    changes: [
      { file: 'featureY.js', status: 'modified', lines: '+30 -5' }
    ]
  },
  {
    hash: 'q6r7s8t',
    message: 'Release v1.0',
    author: 'Alice',
    date: '2024-06-06T12:00:00',
    branch: 'main',
    parents: ['m3n4o5p'],
    isHead: true,
    changes: [
      { file: 'README.md', status: 'modified', lines: '+1' }
    ]
  }
];

// GitKraken-like branch colors (more vibrant)
const branchColors = [
  "#2ec4b6", // teal
  "#3a86ff", // blue
  "#8338ec", // purple
  "#ff006e", // pink
  "#ffbe0b", // yellow
  "#fb5607", // orange
  "#ff595e", // red
  "#43aa8b"  // green
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
  const numCols = Math.max(3, Object.keys(branchMap).length);
  const cellWidth = 30;

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

  // Render commit rows
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
          <i class="fas fa-code-branch"></i>
          ${commit.branch}
          ${commit.isHead ? '<span class="head-indicator"></span>' : ''}
        </span>`;
    }

    node.innerHTML = `
      <div class="commit-branch-tag">${branchTagHtml}</div>
      <div class="commit-graph commit-graph-cell"></div>
      <div class="commit-message">
        <span class="message-text">${commit.message}</span>
        ${commit.parents.length > 1 ? '<span class="merge-indicator">Merge</span>' : ''}
      </div>
      <div class="commit-date">${formatDateTime(commit.date)}</div>
      <div class="commit-sha">${commit.hash.substring(0, 7)}</div>
    `;
    node.addEventListener('click', () => showCommitDetails(commit));
    node.addEventListener('touchstart', () => showCommitDetails(commit), {passive:true});
    fragment.appendChild(node);
  });

  // Add fragment to measure positions
  gitTree.style.position = "relative";
  gitTree.appendChild(fragment);

  // Get the first commit node to measure row height
  const firstCommitNode = gitTree.querySelector('.commit-node');
  const rowHeight = firstCommitNode ? firstCommitNode.offsetHeight : 54;

  // Find the "Graph" column offset and width
  let graphLeft = 0, graphWidth = 110;
  const headerRow = gitTree.querySelector('.git-tree-header');
  if (headerRow) {
    const headerCells = headerRow.children;
    if (headerCells.length >= 2) {
      const graphCell = headerCells[1];
      const treeRect = gitTree.getBoundingClientRect();
      const cellRect = graphCell.getBoundingClientRect();
      graphLeft = cellRect.left - treeRect.left;
      graphWidth = cellRect.width;
    }
  }

  // Calculate SVG top offset: header + legend heights + half row height
  let svgTop = 0;
  if (headerRow) svgTop += headerRow.offsetHeight;
  const legendNode = gitTree.querySelector('.git-graph-legend');
  if (legendNode) svgTop += legendNode.offsetHeight;
  svgTop += rowHeight / 2; // Shift SVG down by half a row height

  // SVG covers the commit rows area
  const svgHeight = displayCommits.length * rowHeight;
  const graphSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  graphSvg.setAttribute("width", graphWidth);
  graphSvg.setAttribute("height", svgHeight);
  graphSvg.setAttribute("class", "commit-graph-svg");
  graphSvg.style.position = "absolute";
  graphSvg.style.left = `${graphLeft}px`;
  graphSvg.style.top = `${svgTop}px`; // svgTop is now just header+legend height
  graphSvg.style.pointerEvents = "none";
  graphSvg.style.zIndex = "1000";

  // Draw vertical branch lines for all rows
  Object.entries(branchMap).forEach(([b, info]) => {
    const x = graphWidth / (numCols + 1) * (info.col + 1);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", 0);
    line.setAttribute("x2", x);
    line.setAttribute("y2", svgHeight);
    line.setAttribute("stroke", info.color);
    line.setAttribute("stroke-width", "2.5");
    line.setAttribute("opacity", "0.13");
    line.setAttribute("stroke-dasharray", "3,3");
    graphSvg.appendChild(line);
  });

  // Draw edges (parent connections) - FIXED COLOR LOGIC
  displayCommits.forEach((commit, idx) => {
    const colIdx = commitLanes.get(commit);
    const x1 = graphWidth / (numCols + 1) * (colIdx + 1);
    const y1 = idx * rowHeight;
    commit.parents.forEach((parentHash, parentIndex) => {
      const parentRow = hashToRow[parentHash];
      if (parentRow !== undefined) {
        const parentCommit = displayCommits[parentRow];
        const parentCol = commitLanes.get(parentCommit);
        const x2 = graphWidth / (numCols + 1) * (parentCol + 1);
        const y2 = parentRow * rowHeight;
        
        // FIXED: Correct coloring logic
        let color;
        if (commit.parents.length > 1) { // Merge commit
          if (parentIndex === 0) {
            // First parent - use current branch color
            color = branchMap[commit.branch]?.color || branchColors[0];
          } else {
            // Additional parents - use merged branch's color
            color = branchMap[parentCommit.branch]?.color || branchColors[0];
          }
        } else { // Regular commit
          // Use current branch color
          color = branchMap[commit.branch]?.color || branchColors[0];
        }

        // L-turn with rounded corner, direction depends on merge or branch
        const isMerge = y2 < y1;
        const isBranch = y2 > y1;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const radius = 14;
        let d;
        if (Math.abs(x2 - x1) > 1 && Math.abs(y2 - y1) > 1) {
          if (isMerge) {
            // Merge: go up then over (vertical, arc, horizontal)
            const signX = x2 > x1 ? 1 : -1;
            const signY = -1;
            d =
              `M${x1},${y1} ` +
              `L${x1},${y2 + signY * radius} ` +
              `A${radius},${radius} 0 0 ${signX === 1 ? 0 : 1} ` +
              `${x1 + signX * radius},${y2} ` +
              `L${x2},${y2}`;
          } else if (isBranch) {
            // Branch: go over then up (horizontal, arc, vertical)
            const signX = x2 > x1 ? 1 : -1;
            const signY = 1;
            d =
              `M${x1},${y1} ` +
              `L${x2 - signX * radius},${y1} ` +
              `A${radius},${radius} 0 0 ${signX === 1 ? 1 : 0} ` +
              `${x2},${y1 + signY * radius} ` +
              `L${x2},${y2}`;
          } else {
            // fallback straight line
            d = `M${x1},${y1} L${x2},${y2}`;
          }
        } else {
          // Just a straight line (no L)
          d = `M${x1},${y1} L${x2},${y2}`;
        }
        
        path.setAttribute("d", d);
        path.setAttribute("stroke", color);  // Use calculated color
        path.setAttribute("stroke-width", (commit.parents.length > 1 && parentIndex > 0) ? "2.5" : "3");
        path.setAttribute("fill", "none");
        path.setAttribute("opacity", (commit.parents.length > 1 && parentIndex > 0) ? "0.7" : "0.9");
        path.setAttribute("class", "commit-path");
        graphSvg.appendChild(path);
      }
    });
  });

  // Draw commit dots
  displayCommits.forEach((commit, idx) => {
    const colIdx = commitLanes.get(commit);
    const x = graphWidth / (numCols + 1) * (colIdx + 1);
    const y = idx * rowHeight;
    const color = branchMap[commit.branch]?.color || branchColors[0];
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "14");
    dot.setAttribute("fill", commit.isHead ? '#ff7b26' : color);
    dot.setAttribute("stroke", "#ffffff");
    dot.setAttribute("stroke-width", commit.isHead ? "4" : "3.5");
    dot.setAttribute("class", "commit-dot" + (commit.isHead ? " head-dot" : ""));
    dot.setAttribute("tabindex", "0");
    dot.setAttribute("role", "button");
    dot.setAttribute("aria-label", `Commit ${commit.hash}: ${commit.message}`);
    dot.setAttribute("data-tooltip", `${commit.message} (${commit.hash.substring(0,7)})`);
    dot.addEventListener('click', e => {
      e.stopPropagation();
      showCommitDetails(commit);
    });
    dot.addEventListener('keydown', e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showCommitDetails(commit);
      }
    });
    graphSvg.appendChild(dot);

    // Draw HEAD indicator
    if (commit.isHead) {
      const headIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      headIndicator.setAttribute("cx", x);
      headIndicator.setAttribute("cy", y);
      headIndicator.setAttribute("r", "7");
      headIndicator.setAttribute("fill", "#fff");
      headIndicator.setAttribute("class", "head-dot");
      graphSvg.appendChild(headIndicator);
    }
  });

  // Insert SVG overlay as the first child after header and legend
  const afterLegend = gitTree.querySelector('.git-graph-legend');
  if (afterLegend && afterLegend.nextSibling) {
    gitTree.insertBefore(graphSvg, afterLegend.nextSibling);
  } else {
    gitTree.insertBefore(graphSvg, gitTree.firstChild);
  }

  // Scroll graph column into view if needed
  const container = document.querySelector('.git-tree-container');
  const graphCell = gitTree.querySelector('.commit-node > .commit-graph, .git-tree-header > span:nth-child(2)');
  if (container && graphCell) {
    const cellRect = graphCell.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    if (cellRect.left < contRect.left || cellRect.right > contRect.right) {
      container.scrollLeft = graphCell.offsetLeft - 40;
    }
  }
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