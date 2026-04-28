script.js

let boardSize;
let board = [];
let startX = -1, startY = -1;
let currentStep = 0;
let currentX = -1, currentY = -1;
let manualMode = true;
const moveX = [2,1,-1,-2,-2,-1,1,2];
const moveY = [1,2,2,1,-1,-2,-2,-1];

function createBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    boardSize = parseInt(document.getElementById("size").value);
    boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;

    board = Array.from({length: boardSize}, () => Array(boardSize).fill(-1));

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement("div");

            cell.className = "cell " + ((i + j) % 2 === 0 ? "white" : "black");

            cell.onclick = () => handleCellClick(i, j, cell);

            cell.id = `cell-${i}-${j}`;
            boardDiv.appendChild(cell);
        }
    }
}
function isKnightMove(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

function handleCellClick(i, j, cell) {

    // First move
    if (currentStep === 0) {
        board[i][j] = 0;
        cell.innerText = 0;
        cell.style.backgroundColor = "green";

        currentX = i;
        currentY = j;
        currentStep++;
        highlightValidMoves(currentX, currentY);
        return;
    }

    // Check if already visited
    if (board[i][j] !== -1) {
        alert("Already visited!");
        return;
    }

    // Check valid knight move
    if (!isKnightMove(currentX, currentY, i, j)) {
        alert("Invalid Knight Move!");
        return;
    }

    // Valid move
    board[i][j] = currentStep;
    cell.innerText = currentStep;

    // Highlight
    let prevCell = document.getElementById(`cell-${currentX}-${currentY}`);
    prevCell.style.backgroundColor = "";

    cell.style.backgroundColor = "orange";

    currentX = i;
    currentY = j;
    currentStep++;
    highlightValidMoves(currentX, currentY);
}

function highlightValidMoves(x, y) {
    clearHints();

    for (let k = 0; k < 8; k++) {
        let nx = x + moveX[k];
        let ny = y + moveY[k];

        if (isSafe(nx, ny)) {
            let cell = document.getElementById(`cell-${nx}-${ny}`);
            cell.classList.add("hint");
        }
    }
}

function clearHints() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.classList.remove("hint");
    });
}

function resetBoard() {
    currentStep = 0;
    currentX = -1;
    currentY = -1;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = -1;
            let cell = document.getElementById(`cell-${i}-${j}`);
            cell.innerText = "";
            cell.style.backgroundColor = "";
        }
    }
}

function isSafe(x, y) {
    return x >= 0 && y >= 0 && x < boardSize && y < boardSize && board[x][y] === -1;
}

function countMoves(x, y) {
    let count = 0;
    for (let k = 0; k < 8; k++) {
        let nx = x + moveX[k];
        let ny = y + moveY[k];
        if (isSafe(nx, ny)) count++;
    }
    return count;
}

function solveTour() {
    clearHints();
    if (currentStep === 0) {
        alert("Select starting position");
        return;
    }

    // Use the clicked starting point
    let x = currentX;
    let y = currentY;

    // Reset board but keep starting point
    board = Array.from({length: boardSize}, () => Array(boardSize).fill(-1));
    board[x][y] = 0;

    for (let move = 1; move < boardSize * boardSize; move++) {
        let minDeg = 9, nextX = -1, nextY = -1;

        for (let k = 0; k < 8; k++) {
            let nx = x + moveX[k];
            let ny = y + moveY[k];

            if (isSafe(nx, ny)) {
                let deg = countMoves(nx, ny);
                if (deg < minDeg) {
                    minDeg = deg;
                    nextX = nx;
                    nextY = ny;
                }
            }
        }

        if (nextX === -1) {
            alert("No solution found!");
            return;
        }

        x = nextX;
        y = nextY;
        board[x][y] = move;
    }

    displayBoardAnimated();
}

function displayBoardAnimated() {
    clearHints();
    let steps = [];

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            steps.push({ x: i, y: j, val: board[i][j] });
        }
    }

    steps.sort((a, b) => a.val - b.val);

    let index = 0;
    let prevCell = null;

    function animate() {
        if (index >= steps.length) return;

        let { x, y, val } = steps[index];
        let cell = document.getElementById(`cell-${x}-${y}`);

        // Remove knight from previous cell
        if (prevCell) {
            prevCell.innerText = steps[index - 1].val;
            prevCell.classList.remove("current");
        }

        // Show number + knight
        cell.innerHTML = `${val} <span class="knight">&#9822;</span>`;
        cell.classList.add("current");

        prevCell = cell;
        index++;

        setTimeout(animate, 400);
    }

    animate();
}