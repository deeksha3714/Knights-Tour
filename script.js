// script.js
// Knights Tour - DSA Mini Project
// Using Warnsdorff's Heuristic + iterative approach (no recursion = no stack overflow)
//
// HOW IT WORKS:
// 1. Player clicks a square to place the knight
// 2. All valid L-shaped moves are highlighted green
// 3. Player clicks a green square to move
// 4. Repeat until all squares visited (win) or no moves left (stuck)
// 5. Warnsdorff's hint shows the BEST next move (fewest onward moves from there)


// =============================================
// KNIGHT MOVE OFFSETS
// a knight moves in an L-shape: 2 squares one way, 1 square the other
// all 8 possible directions listed here
// =============================================
var KNIGHT_MOVES = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [ 1, -2], [ 1, 2],
  [ 2, -1], [ 2, 1]
];


// =============================================
// GAME STATE VARIABLES
// keeping these global so all functions can access them
// =============================================
var N = 0;             // board size (NxN)
var board = [];        // 2D array - stores move number at each cell, -1 if not visited
var history = [];      // stores {r, c} of each move for undo
var knightRow = -1;    // current row of knight
var knightCol = -1;    // current col of knight
var moveCount = 0;     // how many moves made so far
var gameActive = false;
var placing = false;   // true when waiting for player to place knight
var hintOn = false;    // whether hint highlighting is on


// =============================================
// HELPER FUNCTIONS
// =============================================

// checks if row,col is inside the board
function inBounds(r, c) {
  return r >= 0 && r < N && c >= 0 && c < N;
}

// checks if a square has already been visited
function isVisited(r, c) {
  return board[r][c] >= 0;
}

// returns list of all valid moves from position r,c
// (must be in bounds AND not yet visited)
function getValidMoves(r, c) {
  var moves = [];
  for (var i = 0; i < KNIGHT_MOVES.length; i++) {
    var nr = r + KNIGHT_MOVES[i][0];
    var nc = c + KNIGHT_MOVES[i][1];
    if (inBounds(nr, nc) && !isVisited(nr, nc)) {
      moves.push([nr, nc]);
    }
  }
  return moves;
}

// warnsdorffs heuristic - counts onward moves from a position
// lower degree = fewer escape routes = visit it sooner
function getDegree(r, c) {
  return getValidMoves(r, c).length;
}

// finds the best next move using warnsdorffs rule:
// pick the neighbor with fewest onward moves
// returns [row, col] or null if no moves available
function warnsdorffBest(r, c) {
  var moves = getValidMoves(r, c);

  if (moves.length === 0) {
    console.log("warnsdorffBest: no moves available from", r, c);
    return null;
  }

  var bestMove = null;
  var bestDeg = 999; // start high, find minimum

  for (var i = 0; i < moves.length; i++) {
    var d = getDegree(moves[i][0], moves[i][1]);
    // console.log("  checking move", moves[i], "degree =", d); // too noisy, commented out
    if (d < bestDeg) {
      bestDeg = d;
      bestMove = moves[i];
    }
  }

  console.log("warnsdorffBest from (" + r + "," + c + ") -> best:", bestMove, "deg:", bestDeg);
  return bestMove;
}


// =============================================
// START / SETUP GAME
// =============================================
function startGame() {
  // read board size from input
  N = parseInt(document.getElementById('sizeInput').value);

  // validate - clamp to safe range
  if (isNaN(N) || N < 5)  N = 5;
  if (N > 200)            N = 200;

  console.log("--- Starting new game, N =", N, "---");

  // reset all state
  // using Array.from to make a 2D array filled with -1
  board = Array.from({ length: N }, function() {
    return new Array(N).fill(-1);
  });

  history   = [];
  moveCount = 0;
  knightRow = -1;
  knightCol = -1;
  gameActive = false;
  placing    = true;
  hintOn     = false;

  // update hint button text
  document.getElementById('btnHint').textContent = 'Hint (Warnsdorff)';

  // update HUD
  document.getElementById('hudSize').textContent    = N + "x" + N;
  document.getElementById('hudMoves').textContent   = "0";
  document.getElementById('hudRemain').textContent  = N * N;
  document.getElementById('hudValid').textContent   = "-";

  // disable buttons until knight is placed
  document.getElementById('btnUndo').disabled   = true;
  document.getElementById('btnHint').disabled   = true;
  document.getElementById('btnSolve').disabled  = true;
  document.getElementById('btnGiveUp').disabled = true;

  setStatus("Click any square to place your knight", "playing");

  renderBoard();
}


// =============================================
// RENDER / DRAW THE BOARD
// builds board cells as divs and puts them in #board
// called every time something changes
// =============================================
function renderBoard() {
  var boardEl = document.getElementById('board');

  // figure out cell size based on available width
  var wrapWidth = document.querySelector('.board-wrap').clientWidth - 24;
  var cs = Math.floor(wrapWidth / N);  // cell size in px
  cs = Math.max(4, Math.min(72, cs));  // clamp between 4px and 72px

  var fontSize   = Math.max(7, Math.floor(cs * 0.36));
  var pieceSize  = Math.max(10, Math.floor(cs * 0.62));

  // set grid layout
  boardEl.style.gridTemplateColumns = "repeat(" + N + ", " + cs + "px)";
  boardEl.style.gridTemplateRows    = "repeat(" + N + ", " + cs + "px)";
  boardEl.style.width  = (N * cs) + "px";
  boardEl.style.height = (N * cs) + "px";

  // clear previous board
  boardEl.innerHTML = '';

  // figure out which squares are valid moves right now
  var validSet = new Set();
  if (gameActive && knightRow >= 0) {
    var vMoves = getValidMoves(knightRow, knightCol);
    for (var i = 0; i < vMoves.length; i++) {
      validSet.add(vMoves[i][0] * N + vMoves[i][1]);
    }
  }

  // get hint cell (warnsdorffs best) if hint mode is on
  var hintCell = null;
  if (hintOn && gameActive && knightRow >= 0) {
    hintCell = warnsdorffBest(knightRow, knightCol);
  }

  // build each cell
  for (var r = 0; r < N; r++) {
    for (var c = 0; c < N; c++) {

      var cell = document.createElement('div');
      var isLight   = (r + c) % 2 === 0;
      var isKnight  = (r === knightRow && c === knightCol);
      var isValid   = validSet.has(r * N + c);
      var isHint    = hintCell && hintCell[0] === r && hintCell[1] === c;
      var visited   = isVisited(r, c);

      // base classes
      cell.className = 'cell ' + (isLight ? 'light' : 'dark');
      cell.style.width  = cs + 'px';
      cell.style.height = cs + 'px';

      // add state classes
      if (isKnight)       cell.classList.add('knight');
      else if (visited)   cell.classList.add('visited');

      if (isHint)         cell.classList.add('hint');
      else if (isValid)   cell.classList.add('valid');

      // show move number if visited
      if (visited || isKnight) {
        var numSpan = document.createElement('span');
        numSpan.className = 'num';
        numSpan.style.fontSize = fontSize + 'px';
        numSpan.textContent = board[r][c] + 1; // +1 so it shows 1-indexed
        cell.appendChild(numSpan);
      }

      // show chess piece on knight square
      if (isKnight) {
        var piece = document.createElement('span');
        piece.className = 'piece';
        piece.style.fontSize = pieceSize + 'px';
        piece.textContent = '♞';
        cell.appendChild(piece);
      }

      // dot marker on valid (but not hint) squares if cells are big enough
      if (isValid && !isHint && !visited && !isKnight && cs >= 14) {
        var dot = document.createElement('span');
        var dotSize = Math.max(4, Math.floor(cs * 0.16));
        dot.style.cssText = 'width:' + dotSize + 'px; height:' + dotSize + 'px; border-radius:50%; background:rgba(0,0,0,0.25); pointer-events:none;';
        cell.appendChild(dot);
      }

      // attach click handler - arrow function captures r and c correctly
      cell.addEventListener('click', (function(row, col) {
        return function() { handleCellClick(row, col); };
      })(r, c));

      boardEl.appendChild(cell);
    }
  }

  updateHUD();
  console.log("Board rendered. moveCount =", moveCount, "| remaining =", (N*N - moveCount));
}


// =============================================
// HANDLE CELL CLICK
// either places knight (first click) or moves knight
// =============================================
function handleCellClick(r, c) {

  // --- PHASE 1: placing the knight ---
  if (placing) {
    console.log("Placing knight at", r, c);

    board[r][c] = 0;
    knightRow = r;
    knightCol = c;
    moveCount = 1;
    history   = [{ r: r, c: c }];
    placing   = false;
    gameActive = true;

    // enable buttons
    document.getElementById('btnUndo').disabled   = false;
    document.getElementById('btnHint').disabled   = false;
    document.getElementById('btnSolve').disabled  = false;
    document.getElementById('btnGiveUp').disabled = false;

    var vm = getValidMoves(r, c);
    setStatus("Knight placed! " + vm.length + " valid moves available", "playing");
    checkStateAndRender();
    return;
  }

  // --- PHASE 2: moving the knight ---
  if (!gameActive) {
    console.log("handleCellClick: game not active, ignoring click");
    return;
  }

  // check if clicked square is a valid move
  var validMoves = getValidMoves(knightRow, knightCol);
  var isValid = false;
  for (var i = 0; i < validMoves.length; i++) {
    if (validMoves[i][0] === r && validMoves[i][1] === c) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    // player clicked somewhere they cant go - just ignore it
    // console.log("Invalid move clicked:", r, c); // too noisy
    return;
  }

  console.log("Player moved to", r, c, "| move #" + (moveCount + 1));

  board[r][c] = moveCount;
  history.push({ r: r, c: c });
  knightRow = r;
  knightCol = c;
  moveCount++;

  checkStateAndRender();
}


// =============================================
// CHECK GAME STATE THEN RE-RENDER
// called after every move - checks win/stuck
// =============================================
function checkStateAndRender() {
  var remaining = N * N - moveCount;
  var vm = getValidMoves(knightRow, knightCol);

  // WIN CONDITION - all squares visited
  if (remaining === 0) {
    gameActive = false;
    renderBoard();
    setStatus("YOU WIN! Complete tour in " + moveCount + " moves!", "won");

    document.getElementById('winMsg').innerHTML =
      "You completed a full Knight's Tour on a <b>" + N + "x" + N + "</b> board!<br><br>" +
      (N >= 8 ? "That's really impressive - most people need hints!" : "Try a bigger board next!");

    showPopup('overlayWin');
    console.log("GAME WON! All", N*N, "squares visited.");
    return;
  }

  // STUCK - no valid moves but board not complete
  if (vm.length === 0) {
    gameActive = false;
    renderBoard();
    setStatus("Stuck! No valid moves. Visited " + moveCount + "/" + N*N + " squares.", "stuck");

    document.getElementById('stuckMsg').innerHTML =
      "No moves left after <b>" + moveCount + "</b> of <b>" + N*N + "</b> squares.<br><br>" +
      remaining + " square" + (remaining > 1 ? "s" : "") + " unvisited. Use Undo to backtrack!";

    showPopup('overlayStuck');
    console.log("STUCK at move", moveCount, "| remaining:", remaining);
    return;
  }

  // game still going
  renderBoard();
  setStatus(vm.length + " valid move(s) | " + remaining + " squares remaining", "playing");
}


// =============================================
// UNDO LAST MOVE
// pops history stack and goes back one step
// =============================================
function undoMove() {
  if (history.length <= 1) {
    console.log("Undo: nothing to undo (at start)");
    return;
  }

  var last = history.pop();
  board[last.r][last.c] = -1;  // unmark that square
  moveCount--;

  console.log("Undo: went back from", last.r, last.c, "| moveCount now:", moveCount);

  // if history is now empty, go back to placement phase
  if (history.length === 0) {
    knightRow  = -1;
    knightCol  = -1;
    placing    = true;
    gameActive = false;

    document.getElementById('btnUndo').disabled   = true;
    document.getElementById('btnHint').disabled   = true;
    document.getElementById('btnSolve').disabled  = true;
    document.getElementById('btnGiveUp').disabled = true;

    setStatus("Click any square to place your knight", "playing");
    renderBoard();
    return;
  }

  // restore knight to previous position
  var prev = history[history.length - 1];
  knightRow = prev.r;
  knightCol = prev.c;

  // re-activate game if it was stuck
  if (!gameActive) {
    gameActive = true;
    console.log("Undo: re-activating game after stuck state");
  }

  checkStateAndRender();
}


// =============================================
// HINT TOGGLE
// turns warnsdorffs hint highlighting on/off
// =============================================
function toggleHint() {
  hintOn = !hintOn;
  document.getElementById('btnHint').textContent = hintOn ? 'Hide Hint' : 'Hint (Warnsdorff)';
  console.log("Hint mode:", hintOn ? "ON" : "OFF");
  renderBoard();
}


// =============================================
// AUTO SOLVE FROM CURRENT POSITION
// runs warnsdorffs iteratively and animates the result
// NOTE: this is iterative (loop, not recursion) so it wont stack overflow
// =============================================
function autoSolveFromHere() {
  if (!gameActive && knightRow < 0) {
    console.log("autoSolve: no knight placed yet");
    return;
  }

  console.log("Auto-solving from", knightRow, knightCol, "| already at move", moveCount);

  gameActive = false;
  hintOn = false;
  document.getElementById('btnHint').textContent = 'Hint (Warnsdorff)';

  // collect the path warnsdorffs would take from here
  var r = knightRow;
  var c = knightCol;
  var steps = [[r, c]]; // includes current position

  // iterative loop - keep picking best move until stuck
  while (true) {
    var best = warnsdorffBest(r, c);
    if (!best) break;

    r = best[0];
    c = best[1];
    steps.push([r, c]);

    // temporarily mark so warnsdorff doesnt revisit
    board[r][c] = moveCount + steps.length - 1;
  }

  console.log("Auto-solve path length:", steps.length - 1, "new moves");

  // unmark everything (will animate them back in)
  for (var i = 1; i < steps.length; i++) {
    board[steps[i][0]][steps[i][1]] = -1;
  }

  // animate each step with a delay
  var idx = 1;

  // for big boards dont bother animating - too slow
  if (N > 400) {
    console.log("Board too large to animate, drawing all at once");
    for (var j = 1; j < steps.length; j++) {
      board[steps[j][0]][steps[j][1]] = moveCount + j - 1;
      history.push({ r: steps[j][0], c: steps[j][1] });
    }
    knightRow = steps[steps.length - 1][0];
    knightCol = steps[steps.length - 1][1];
    setStatus("Auto-solve complete! " + (moveCount + steps.length - 1) + "/" + N*N + " squares", "won");
    renderBoard();
    return;
  }

  // animation speed depends on board size
  var delay = Math.max(15, Math.floor(350 / N));

  function animStep() {
    if (idx >= steps.length) {
      setStatus("Auto-solve done! Visited " + (moveCount + steps.length - 1) + "/" + N*N + " squares", "won");
      renderBoard();
      console.log("Auto-solve animation complete");
      return;
    }

    var nr = steps[idx][0];
    var nc = steps[idx][1];

    board[nr][nc] = moveCount + idx - 1;
    history.push({ r: nr, c: nc });
    knightRow = nr;
    knightCol = nc;

    idx++;
    renderBoard();
    setTimeout(animStep, delay);
  }

  setStatus("Auto-solving with Warnsdorff's heuristic...", "playing");
  animStep();
}


// =============================================
// GIVE UP
// disables game and runs auto-solve to show solution
// =============================================
function giveUp() {
  console.log("Player gave up at move", moveCount);
  gameActive = false;
  document.getElementById('btnGiveUp').disabled = true;
  setStatus("Showing Warnsdorff's solution from here...", "playing");
  autoSolveFromHere();
}


// =============================================
// UPDATE HUD
// refreshes the stats row at top
// =============================================
function updateHUD() {
  var remaining = N > 0 ? N*N - moveCount : 0;

  document.getElementById('hudMoves').textContent  = moveCount;
  document.getElementById('hudRemain').textContent = remaining;

  if (gameActive && knightRow >= 0) {
    var validCount = getValidMoves(knightRow, knightCol).length;
    document.getElementById('hudValid').textContent = validCount;
  }
}


// =============================================
// SET STATUS MESSAGE
// updates the status bar text + color class
// =============================================
function setStatus(msg, type) {
  var bar = document.getElementById('statusBar');
  // remove old state classes
  bar.className = 'status-bar';
  if (type) bar.classList.add(type);
  bar.textContent = msg;
}


// =============================================
// POPUP HELPERS
// =============================================
function showPopup(id) {
  // small delay so board render finishes first
  setTimeout(function() {
    document.getElementById(id).classList.add('show');
  }, 350);
}

function closePopup(id) {
  document.getElementById(id).classList.remove('show');
}


// =============================================
// RE-RENDER ON WINDOW RESIZE
// so board stays proportional if window changes
// =============================================
window.addEventListener('resize', function() {
  if (N > 0) {
    console.log("Window resized, re-rendering board");
    renderBoard();
  }
});


// =============================================
// INIT - auto start when page loads
// =============================================
console.log("script.js loaded - starting default game");
startGame();
