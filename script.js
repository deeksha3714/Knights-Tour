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
  [-2, -1], [-2, 1],   // up 2, left/right 1
  [-1, -2], [-1, 2],   // up 1, left/right 2
  [ 1, -2], [ 1, 2],   // down 1, left/right 2
  [ 2, -1], [ 2, 1]    // down 2, left/right 1
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
  if (isNaN(N) || N < 5) N = 5;  // if not a number or less than 5, default to 5
  if (N > 200)           N = 200; // cap at 200 so browser doesnt freeze

  console.log("--- Starting new game, N =", N, "---");

  // reset all state
  // Array.from creates a new array - using it here to make a 2D array filled with -1
  board = Array.from({ length: N }, function() {
    return new Array(N).fill(-1);
  });

  history    = [];
  moveCount  = 0;
  knightRow  = -1;
  knightCol  = -1;
  gameActive = false; // true = game in progress, false = not started or ended
  placing    = true;  // true = waiting for knight placement, false = knight already on board
  hintOn     = false;

  // reset hint button text
  document.getElementById('btnHint').textContent = 'Hint (Warnsdorff)';

  // update HUD (heads up display - the stats row)
  document.getElementById('hudSize').textContent   = N + "x" + N;
  document.getElementById('hudMoves').textContent  = "0";
  document.getElementById('hudRemain').textContent = N * N; // all squares remaining
  document.getElementById('hudValid').textContent  = "-";

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
  // offsetWidth is more reliable than clientWidth for getting the actual rendered size
  var wrapWidth = document.querySelector('.board-wrap').offsetWidth - 24; // subtract padding
  if (wrapWidth <= 0) wrapWidth = 600; // fallback if layout hasnt happened yet
  var cs = Math.floor(wrapWidth / N); // cell size in px = total width / number of columns
  cs = Math.max(20, Math.min(72, cs)); // clamp: min 20px so cells are always clickable

  var fontSize  = Math.max(7,  Math.floor(cs * 0.36)); // move number font size
  var pieceSize = Math.max(10, Math.floor(cs * 0.62)); // knight piece size

  // set CSS grid layout dynamically
  boardEl.style.gridTemplateColumns = "repeat(" + N + ", " + cs + "px)";
  boardEl.style.gridTemplateRows    = "repeat(" + N + ", " + cs + "px)";
  boardEl.style.width  = (N * cs) + "px";
  boardEl.style.height = (N * cs) + "px";

  // clear old board before redrawing
  boardEl.innerHTML = '';

  // figure out which squares knight can legally move to right now
  var validSet = new Set();
  if (gameActive && knightRow >= 0) {
    var vMoves = getValidMoves(knightRow, knightCol);
    for (var i = 0; i < vMoves.length; i++) {
      // store as single number (row * N + col) so Set lookup is fast
      validSet.add(vMoves[i][0] * N + vMoves[i][1]);
    }
  }

  // get hint cell (warnsdorffs best move) if hint mode is on
  var hintCell = null;
  if (hintOn && gameActive && knightRow >= 0) {
    hintCell = warnsdorffBest(knightRow, knightCol);
  }

  // build each cell div
  for (var r = 0; r < N; r++) {
    for (var c = 0; c < N; c++) {

      var cell     = document.createElement('div');
      var isLight  = (r + c) % 2 === 0; // checkerboard pattern
      var isKnight = (r === knightRow && c === knightCol);
      var isValid  = validSet.has(r * N + c);
      var isHint   = hintCell && hintCell[0] === r && hintCell[1] === c;
      var visited  = isVisited(r, c);

      // set base class
      cell.className = 'cell ' + (isLight ? 'light' : 'dark');
      cell.style.width  = cs + 'px';
      cell.style.height = cs + 'px';

      // add state-based classes (order matters - knight overrides visited etc)
      if (isKnight)     cell.classList.add('knight');
      else if (visited) cell.classList.add('visited');

      if (isHint)        cell.classList.add('hint');
      else if (isValid)  cell.classList.add('valid');

      // show move number inside visited squares
      if (visited || isKnight) {
        var numSpan = document.createElement('span');
        numSpan.className = 'num';
        numSpan.style.fontSize = fontSize + 'px';
        numSpan.textContent = board[r][c] + 1; // +1 because array is 0-indexed but display should start at 1
        cell.appendChild(numSpan);
      }

      // show chess piece symbol on knight square
      if (isKnight) {
        var piece = document.createElement('span');
        piece.className = 'piece';
        piece.style.fontSize = pieceSize + 'px';
        piece.textContent = '♞';
        cell.appendChild(piece);
      }

      // small dot on valid squares (only if cells are big enough to see it)
      if (isValid && !isHint && !visited && !isKnight && cs >= 14) {
        var dot = document.createElement('span');
        var dotSize = Math.max(4, Math.floor(cs * 0.16));
        dot.style.cssText = 'width:' + dotSize + 'px; height:' + dotSize + 'px; border-radius:50%; background:rgba(0,0,0,0.25); pointer-events:none;';
        cell.appendChild(dot);
      }

      // click handler - using IIFE to correctly capture r and c in the loop
      // (if we just wrote onclick = function(){ handleCellClick(r,c) }
      //  all cells would use the LAST value of r and c due to closure)
      cell.addEventListener('click', (function(row, col) {
        return function() { handleCellClick(row, col); };
      })(r, c));

      boardEl.appendChild(cell);
    }
  }

  updateHUD();
  console.log("renderBoard() done | moveCount:", moveCount, "| remaining:", (N * N - moveCount));
}


// =============================================
// HANDLE CELL CLICK
// either places knight (first click) or moves it
// =============================================
function handleCellClick(r, c) {

  // --- PHASE 1: first click = place the knight ---
  if (placing) {
    console.log("Placing knight at row:", r, "col:", c);

    board[r][c] = 0;   // mark as move 0 (first square)
    knightRow  = r;
    knightCol  = c;
    moveCount  = 1;    // knight is on square 1
    history    = [{ r: r, c: c }];
    placing    = false;
    gameActive = true;

    // enable game buttons now that knight is placed
    document.getElementById('btnUndo').disabled   = false;
    document.getElementById('btnHint').disabled   = false;
    document.getElementById('btnSolve').disabled  = false;
    document.getElementById('btnGiveUp').disabled = false;

    var vm = getValidMoves(r, c);
    setStatus("Knight placed! " + vm.length + " valid moves available", "playing");
    checkStateAndRender();
    return;
  }

  // --- PHASE 2: subsequent clicks = move the knight ---
  if (!gameActive) {
    console.log("handleCellClick: game not active, ignoring click on (", r, ",", c, ")");
    return;
  }

  // check if the clicked square is actually a valid knight move
  var legalMoves = getValidMoves(knightRow, knightCol);
  console.log("Phase 2 click: (", r, ",", c, ") | knight at (", knightRow, ",", knightCol, ") | legal moves:", legalMoves.length);
  var clickedIsLegal = false;

  for (var i = 0; i < legalMoves.length; i++) {
    if (legalMoves[i][0] === r && legalMoves[i][1] === c) {
      clickedIsLegal = true;
      break;
    }
  }

  if (!clickedIsLegal) {
    // clicked somewhere the knight cant go - silently ignore
    return;
  }

  // make the move
  console.log("Player moved to (", r, ",", c, ") | move #" + (moveCount + 1));
  board[r][c] = moveCount; // store move number in board array
  history.push({ r: r, c: c });
  knightRow = r;
  knightCol = c;
  moveCount++;

  checkStateAndRender();
}


// =============================================
// CHECK GAME STATE THEN RE-RENDER
// called after every move - detects win or stuck
// =============================================
function checkStateAndRender() {
  var remaining = N * N - moveCount;
  var vm = getValidMoves(knightRow, knightCol);

  // --- WIN: visited every single square ---
  if (remaining === 0) {
    gameActive = false;
    renderBoard();
    setStatus("YOU WIN! Complete tour in " + moveCount + " moves!", "won");

    document.getElementById('winMsg').innerHTML =
      "You completed a full Knight's Tour on a <b>" + N + "x" + N + "</b> board!<br><br>" +
      (N >= 8 ? "Impressive - most people need hints for this!" : "Try a bigger board for more challenge!");

    showPopup('overlayWin');
    console.log("GAME WON! Visited all", N * N, "squares.");
    return;
  }

  // --- STUCK: no legal moves left but board not complete ---
  if (vm.length === 0) {
    gameActive = false;
    renderBoard();
    setStatus("Stuck! No valid moves. Visited " + moveCount + "/" + N * N + " squares.", "stuck");

    document.getElementById('stuckMsg').innerHTML =
      "No moves left after <b>" + moveCount + "</b> of <b>" + N * N + "</b> squares.<br><br>" +
      remaining + " square" + (remaining > 1 ? "s" : "") + " unvisited. Try Undo to backtrack!";

    showPopup('overlayStuck');
    console.log("STUCK at move", moveCount, "| remaining:", remaining);
    return;
  }

  // --- still going ---
  renderBoard();
  setStatus(vm.length + " valid move(s) | " + remaining + " squares remaining", "playing");
}


// =============================================
// UNDO LAST MOVE
// pops from history and goes back one step
// =============================================
function undoMove() {
  // need at least 2 entries to undo (current + one before)
  if (history.length < 2) {
    console.log("Undo: nothing to undo");
    return;
  }

  var last = history.pop();        // remove last position
  board[last.r][last.c] = -1;     // unmark that square
  moveCount--;

  console.log("Undo: removed move at (", last.r, ",", last.c, ") | moveCount now:", moveCount);

  // restore knight to the previous position
  var prev = history[history.length - 1];
  knightRow = prev.r;
  knightCol = prev.c;

  // if game was in stuck state, undo brings it back to life
  if (!gameActive) {
    gameActive = true;
    console.log("Undo: game reactivated after stuck state");
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
  console.log("Hint toggled:", hintOn ? "ON" : "OFF");
  renderBoard();
}


// =============================================
// AUTO SOLVE FROM CURRENT POSITION
// uses warnsdorffs iteratively from wherever knight is now
// NOTE: iterative loop (not recursion) so no stack overflow risk
// =============================================
function autoSolveFromHere() {
  // block if no knight placed yet, OR if still in placing phase
  if (knightRow < 0 || placing) {
    console.log("autoSolve: blocked - knight not ready");
    return;
  }

  console.log("Auto-solving from (", knightRow, ",", knightCol, ") at move", moveCount);

  // only disable player control AFTER confirming its safe
  gameActive = false;
  hintOn = false;
  document.getElementById('btnHint').textContent = 'Hint (Warnsdorff)';

  // build the full path warnsdorffs would take from current position
  var r = knightRow;
  var c = knightCol;
  var steps = [[r, c]]; // steps[0] = current position

  while (true) {
    var best = warnsdorffBest(r, c);
    if (!best) break; // no moves left, stop

    r = best[0];
    c = best[1];
    steps.push([r, c]);

    // temporarily mark visited so warnsdorff doesnt pick it again
    board[r][c] = moveCount + steps.length - 1;
  }

  console.log("Auto-solve found", steps.length - 1, "more moves");

  // unmark all the temporary marks (animation will re-mark them one by one)
  for (var i = 1; i < steps.length; i++) {
    board[steps[i][0]][steps[i][1]] = -1;
  }

  // skip animation for very large boards - would take too long
  if (N > 400) {
    console.log("Large board - skipping animation, drawing all at once");
    for (var j = 1; j < steps.length; j++) {
      // j=1 -> moveCount (next unassigned move number), j=2 -> moveCount+1, etc.
      board[steps[j][0]][steps[j][1]] = moveCount + (j - 1);
      history.push({ r: steps[j][0], c: steps[j][1] });
    }
    knightRow = steps[steps.length - 1][0];
    knightCol = steps[steps.length - 1][1];
    setStatus("Auto-solve complete! " + (moveCount + steps.length - 1) + "/" + N * N + " squares", "won");
    renderBoard();
    return;
  }

  // animate the solution step by step
  // delay gets shorter on bigger boards so it doesnt take forever
  var delay = Math.max(15, Math.floor(350 / N));
  var idx = 1;

  function animStep() {
    if (idx >= steps.length) {
      // total squares visited = original moveCount + all animated steps
      var totalVisited = moveCount + steps.length - 1;
      setStatus("Auto-solve done! " + totalVisited + "/" + N * N + " squares visited", "won");
      renderBoard();
      console.log("Animation complete");
      return;
    }

    var nr = steps[idx][0];
    var nc = steps[idx][1];

    // moveCount is already the NEXT move number to assign
    // idx starts at 1, so first animated move = moveCount + 0 = moveCount  ✓
    board[nr][nc] = moveCount + (idx - 1);
    history.push({ r: nr, c: nc });
    knightRow = nr;
    knightCol = nc;

    idx++;
    renderBoard();
    setTimeout(animStep, delay); // schedule next frame
  }

  setStatus("Auto-solving with Warnsdorff's heuristic...", "playing");
  animStep();
}


// =============================================
// GIVE UP
// shows warnsdorffs solution from current position
// =============================================
function giveUp() {
  console.log("Player gave up at move", moveCount);
  gameActive = false;
  document.getElementById('btnGiveUp').disabled = true;
  setStatus("Showing solution from here...", "playing");
  autoSolveFromHere();
}


// =============================================
// UPDATE HUD
// refreshes the stats numbers at the top
// =============================================
function updateHUD() {
  var remaining = N > 0 ? N * N - moveCount : 0;
  document.getElementById('hudMoves').textContent  = moveCount;
  document.getElementById('hudRemain').textContent = remaining;

  if (gameActive && knightRow >= 0) {
    var vCount = getValidMoves(knightRow, knightCol).length;
    document.getElementById('hudValid').textContent = vCount;
  }
}


// =============================================
// SET STATUS BAR MESSAGE + COLOR
// type = "playing" | "won" | "stuck" | "" (idle)
// =============================================
function setStatus(msg, type) {
  var bar = document.getElementById('statusBar');
  bar.className = 'status-bar';       // reset classes
  if (type) bar.classList.add(type);  // add new state class
  bar.textContent = msg;
}


// =============================================
// POPUP / OVERLAY HELPERS
// show and hide the win/stuck popups
// =============================================
function showPopup(id) {
  // short delay so board finishes rendering before popup appears
  setTimeout(function() {
    document.getElementById(id).classList.add('show');
  }, 350);
}

// NOTE: index.html calls closePopup() on button clicks - make sure name matches!
function closePopup(id) {
  document.getElementById(id).classList.remove('show');
}


// =============================================
// RESIZE HANDLER
// re-render board when window size changes
// so cell sizes stay correct
// =============================================
window.addEventListener('resize', function() {
  if (N > 0) {
    console.log("Window resized - re-rendering");
    renderBoard();
  }
});


// =============================================
// AUTO START
// NOTE: must wait for DOMContentLoaded before calling startGame!
// if startGame runs before the browser finishes layout,
// .board-wrap clientWidth = 0, so all cells become 4x4px
// and the green valid-move squares are too tiny to click
// =============================================
console.log("script.js loaded OK");
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM ready - starting game");
  startGame();
});
