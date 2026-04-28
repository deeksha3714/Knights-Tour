// Knight's Tour - script.js

// This handles the interactive chessboard + solving using Warnsdorff's heuristic.
// The user can either play manually (clicking valid squares) or hit Solve
// to auto-complete from whatever starting square they picked.

let boardSize;
let board = [];       // 2D array storing move numbers (-1 = unvisited)
let currentStep = 0;
let currentX = -1, currentY = -1;

// all 8 L-shaped moves a knight can make (row, col offsets)
const dx = [2, 1, -1, -2, -2, -1,  1,  2];
const dy = [1, 2,  2,  1, -1, -2, -2, -1];

// ---- Board Setup ----

function createBoard() {
    const size = parseInt(document.getElementById("size").value);

    if (isNaN(size) || size < 5 || size > 10) {
        setStatus("Please enter a board size between 5 and 10.");
        return;
    }

    boardSize = size;
    setStatus("Click any square to place the knight!");

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;

    // reset all state
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(-1));
    currentStep = 0;
    currentX = -1;
    currentY = -1;

    // create all the cells
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement("div");
            const color = (i + j) % 2 === 0 ? "white" : "black";
            cell.className = `cell ${color}`;
            cell.id = `cell-${i}-${j}`;
            cell.onclick = () => handleCellClick(i, j);
            boardDiv.appendChild(cell);
        }
    }
}

// ---- Manual Play ----

function handleCellClick(i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);

    // placing the knight for the first time
    if (currentStep === 0) {
        board[i][j] = 0;
        cell.innerHTML = `0 <span class="knight">&#9822;</span>`;
        cell.classList.add("start");
        currentX = i;
        currentY = j;
        currentStep++;
        highlightValidMoves(currentX, currentY);
        setStatus(`Knight placed at (${i}, ${j}). Now move it!`);
        return;
    }

    // don't allow revisiting
    if (board[i][j] !== -1) {
        setStatus("That square is already visited!");
        return;
    }

    // make sure it's a valid knight move from current position
    if (!isKnightMove(currentX, currentY, i, j)) {
        setStatus("That's not a valid knight move!");
        return;
    }

    // valid move - update board
    clearHints();
    const prevCell = document.getElementById(`cell-${currentX}-${currentY}`);
    prevCell.innerHTML = board[currentX][currentY]; // remove knight symbol from old cell
    prevCell.classList.remove("current");

    board[i][j] = currentStep;
    cell.innerHTML = `${currentStep} <span class="knight">&#9822;</span>`;
    cell.classList.add("current");

    currentX = i;
    currentY = j;
    currentStep++;

    if (currentStep === boardSize * boardSize) {
        setStatus("Congratulations! You completed the tour!");
        return;
    }

    highlightValidMoves(currentX, currentY);
    setStatus(`Move ${currentStep - 1} done. Keep going!`);
}

function isKnightMove(x1, y1, x2, y2) {
    const diffX = Math.abs(x1 - x2);
    const diffY = Math.abs(y1 - y2);
    return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
}

// ---- Hints ----

function highlightValidMoves(x, y) {
    clearHints();
    for (let k = 0; k < 8; k++) {
        const nx = x + dx[k];
        const ny = y + dy[k];
        if (isValid(nx, ny)) {
            document.getElementById(`cell-${nx}-${ny}`).classList.add("hint");
        }
    }
}

function clearHints() {
    document.querySelectorAll(".hint").forEach(cell => cell.classList.remove("hint"));
}

// ---- Warnsdorff's Solver ----

// counts how many onward moves are available from (x, y)
// this is the key part of Warnsdorff's rule
function getDegree(x, y) {
    let count = 0;
    for (let k = 0; k < 8; k++) {
        if (isValid(x + dx[k], y + dy[k])) count++;
    }
    return count;
}

function solveTour() {
    clearHints();

    if (currentStep === 0) {
        setStatus("Place the knight first by clicking a square.");
        return;
    }

    // start from wherever the user placed the knight
    let x = currentX, y = currentY;

    // reset board but keep the starting square
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(-1));
    board[x][y] = 0;

    // Warnsdorff's: at each step, move to the neighbor with fewest onward moves
    for (let move = 1; move < boardSize * boardSize; move++) {
        let minDeg = 9;  // max possible degree is 8
        let nextX = -1, nextY = -1;

        for (let k = 0; k < 8; k++) {
            const nx = x + dx[k];
            const ny = y + dy[k];

            if (isValid(nx, ny)) {
                const deg = getDegree(nx, ny);
                if (deg < minDeg) {
                    minDeg = deg;
                    nextX = nx;
                    nextY = ny;
                }
            }
        }

        // if no move found, this starting position doesn't work
        if (nextX === -1) {
            setStatus("No complete tour found from this square. Try a different start.");
            return;
        }

        board[nextX][nextY] = move;
        x = nextX;
        y = nextY;
    }

    // animate the solution onto the board
    animateSolution();
}

// ---- Animation ----

function animateSolution() {
    // flatten the board into a sorted list by move number
    const moves = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            moves.push({ x: i, y: j, step: board[i][j] });
        }
    }
    moves.sort((a, b) => a.step - b.step);

    let idx = 0;
    let prevCell = null;

    setStatus("Solving...");

    function animate() {
        if (idx >= moves.length) {
            setStatus("Tour complete!");
            return;
        }

        const { x, y, step } = moves[idx];
        const cell = document.getElementById(`cell-${x}-${y}`);

        // remove knight icon from previous cell, just leave the number
        if (prevCell) {
            const prevStep = moves[idx - 1];
            prevCell.innerHTML = prevStep.step;
            prevCell.classList.remove("current");
        }

        cell.innerHTML = `${step} <span class="knight">&#9822;</span>`;
        cell.classList.add("current");

        prevCell = cell;
        idx++;
        setTimeout(animate, 350);
    }

    animate();
}

// ---- Helpers ----

function isValid(x, y) {
    return x >= 0 && y >= 0 && x < boardSize && y < boardSize && board[x][y] === -1;
}

function resetBoard() {
    currentStep = 0;
    currentX = -1;
    currentY = -1;
    setStatus("Board reset. Create a new board or click a square to start.");

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = -1;
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.innerHTML = "";
            cell.className = `cell ${(i + j) % 2 === 0 ? "white" : "black"}`;
            cell.style.backgroundColor = "";
        }
    }
}

// helper to show messages below the buttons instead of using alert()
function setStatus(msg) {
    document.getElementById("status-msg").innerText = msg;
}
