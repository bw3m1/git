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
    hash: 'h7i8j9k',
    message: 'Started branch: "feature"',
    author: 'Carol',
    date: '2024-06-03',
    branch: 'feature',
    parents: ['d4e5f6g'],
    col: 3,
    changes: [
      { file: 'feature.js', status: 'added', lines: '+50' }
    ]
  },
  {
    hash: 'd4e5f6g',
    message: 'Added feature X',
    author: 'Bob',
    date: '2024-06-02',
    branch: 'feature',
    parents: ['a1b2c3d'],
    col: 2,
    changes: [
      { file: 'feature.js', status: 'added', lines: '+120' },
      { file: 'README.md', status: 'modified', lines: '+2 -1' }
    ]
  },
  {
    hash: 'l0m1n2o',
    message: 'Merged branches feature and main',
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

// Assign a color to each branch
const branchColors = [
  "#1b647c", // teal
  "#11448d", // blue
  "#550f72" // purple
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

// Helper to get parent commit object
function getCommitByHash(hash) {
  return commits.find(c => c.hash === hash);
}

// Render the commit tree with SVG graph
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

  // Assign columns/colors to branches
  const branchMap = getBranchMap(displayCommits);

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
      branchTagHtml += `<span class="branch-tag" style="background:${branchMap[commit.branch].color}">${commit.branch}</span>`;
    }

    // SVG graph cell
    const graphCell = document.createElement('div');
    graphCell.className = 'commit-graph-cell';
    const branch = getBranch(commit);
    const colIdx = branchMap[branch] ? branchMap[branch].col : 0;
    const color = branchMap[branch] ? branchMap[branch].color : branchColors[0];
    const numCols = Object.keys(branchMap).length || 1;
    const cellWidth = 28;
    const cellHeight = 32;
    const svgWidth = cellWidth * numCols;
    const svgHeight = cellHeight;

    // SVG for lines and dots
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    svg.style.overflow = "visible";

    // Draw lines from parents to this commit
    commit.parents.forEach(parentHash => {
      const parentIdx = hashToRow[parentHash];
      if (parentIdx !== undefined) {
        const parentCommit = displayCommits[parentIdx];
        const parentBranch = getBranch(parentCommit);
        const parentCol = branchMap[parentBranch] ? branchMap[parentBranch].col : 0;
        const parentColor = branchMap[parentBranch] ? branchMap[parentBranch].color : branchColors[0];
        // Draw a line from parent dot to this dot
        const x1 = cellWidth / 2 + parentCol * cellWidth;
        const y1 = svgHeight + 2; // bottom of this cell
        const x2 = cellWidth / 2 + colIdx * cellWidth;
        const y2 = -2; // top of this cell
        // If same column, draw straight line; else, draw a curve
        if (parentCol === colIdx) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", x1);
          line.setAttribute("y1", y1);
          line.setAttribute("x2", x2);
          line.setAttribute("y2", y2);
          line.setAttribute("stroke", parentColor);
          line.setAttribute("stroke-width", "2.5");
          svg.appendChild(line);
        } else {
          // Draw a cubic Bezier curve for merge/split
          const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const d = `M${x1},${y1} C${x1},${svgHeight/2} ${x2},${svgHeight/2} ${x2},${y2}`;
          curve.setAttribute("d", d);
          curve.setAttribute("stroke", parentColor);
          curve.setAttribute("stroke-width", "2.5");
          curve.setAttribute("fill", "none");
          svg.appendChild(curve);
        }
      }
    });

    // Draw vertical lines for ongoing branches (future children)
    Object.entries(branchMap).forEach(([b, {col, color: bColor}]) => {
      // If this branch continues below, draw a faint vertical line
      let continues = false;
      for (let j = idx + 1; j < displayCommits.length; ++j) {
        const nextCommit = displayCommits[j];
        if (getBranch(nextCommit) === b && nextCommit.parents.includes(commit.hash)) {
          continues = true;
          break;
        }
      }
      if (continues || getBranch(commit) === b) {
        const x = cellWidth / 2 + col * cellWidth;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", cellHeight / 2);
        line.setAttribute("x2", x);
        line.setAttribute("y2", svgHeight + 2);
        line.setAttribute("stroke", bColor);
        line.setAttribute("stroke-width", "1.2");
        line.setAttribute("opacity", "0.35");
        svg.appendChild(line);
      }
    });

    // Draw the commit dot
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", cellWidth / 2 + colIdx * cellWidth);
    dot.setAttribute("cy", cellHeight / 2);
    dot.setAttribute("r", "8");
    dot.setAttribute("fill", color);
    dot.setAttribute("stroke", "#fff");
    dot.setAttribute("stroke-width", commit.branch ? "2.5" : "1.5");
    dot.setAttribute("class", "commit-dot-svg");
    svg.appendChild(dot);

    graphCell.appendChild(svg);

    // Compose row
    node.innerHTML = `
      <div class="commit-branch-tag">${branchTagHtml}</div>
      <div class="commit-graph-cell"></div>
      <div class="commit-message">${commit.message}</div>
      <div class="commit-date">${commit.date}</div>
      <div class="commit-sha">${commit.hash}</div>
    `;
    // Replace the empty graph cell with the one we built (with SVG)
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
