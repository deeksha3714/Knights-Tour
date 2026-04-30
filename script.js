// board variables
let boardSize;
let board = [];

let currentStep = 0;
let currentX = -1;
let currentY = -1;

// all knight moves
const moveX = [2,1,-1,-2,-2,-1,1,2];
const moveY = [1,2,2,1,-1,-2,-2,-1];

// ==========================
// CREATE BOARD
// ==========================
function createBoard() {

    const sizeInput = document.getElementById("size").value;
    boardSize = parseInt(sizeInput);

    // checking input
    if (isNaN(boardSize) || boardSize <= 0) {
        alert("Enter valid board size!");
        return;
    }

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    // create grid
    boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;

    // initialize board
    board = Array.from({ length: boardSize }, () =>
        Array(boardSize).fill(-1)
    );

    // create cells
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {

            const cell = document.createElement("div");

            // alternating colors
            cell.className = "cell " + ((i + j) % 2 === 0 ? "white" : "black");

            // click event
            cell.onclick = () => handleClick(i, j);

            cell.id = `cell-${i}-${j}`;
            boardDiv.appendChild(cell);
        }
    }

    // reset state
    currentStep = 0;
    currentX = -1;
    currentY = -1;
}


// ==========================
// HANDLE CLICK
// ==========================
function handleClick(i, j) {

    const cell = document.getElementById(`cell-${i}-${j}`);

    // first click = start
    if (currentStep === 0) {
        board[i][j] = 0;
        cell.innerText = 0;
        cell.classList.add("start");

        currentX = i;
        currentY = j;
        currentStep++;

        highlightMoves(i, j);
        return;
    }

    // already visited
    if (board[i][j] !== -1) {
        alert("Already visited!");
        return;
    }

    // invalid move
    if (!isKnightMove(currentX, currentY, i, j)) {
        alert("Invalid move!");
        return;
    }

    // valid move
    board[i][j] = currentStep;
    cell.innerText = currentStep;

    // remove old highlight
    document.getElementById(`cell-${currentX}-${currentY}`).classList.remove("current");

    cell.classList.add("current");

    currentX = i;
    currentY = j;
    currentStep++;

    highlightMoves(i, j);
}


// ==========================
// KNIGHT MOVE CHECK
// ==========================
function isKnightMove(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}


// ==========================
// HIGHLIGHT MOVES
// ==========================
function highlightMoves(x, y) {

    clearHints();

    for (let k = 0; k < 8; k++) {
        let nx = x + moveX[k];
        let ny = y + moveY[k];

        if (isSafe(nx, ny)) {
            document.getElementById(`cell-${nx}-${ny}`).classList.add("hint");
        }
    }
}


// ==========================
function clearHints() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.classList.remove("hint");
    });
}


// ==========================
// SAFETY CHECK
// ==========================
function isSafe(x, y) {
    return (
        x >= 0 &&
        y >= 0 &&
        x < boardSize &&
        y < boardSize &&
        board[x][y] === -1
    );
}


// ==========================
// RESET BOARD
// ==========================
function resetBoard() {

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {

            board[i][j] = -1;

            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.innerText = "";
            cell.className = "cell " + ((i + j) % 2 === 0 ? "white" : "black");
        }
    }

    currentStep = 0;
    currentX = -1;
    currentY = -1;

    clearHints();
}


// ==========================
// SOLVE (Warnsdorff)
// ==========================
function solveTour() {

    if (currentStep === 0) {
        alert("Select starting point first!");
        return;
    }

    let x = currentX;
    let y = currentY;

    // reset board but keep start
    board = Array.from({ length: boardSize }, () =>
        Array(boardSize).fill(-1)
    );
    board[x][y] = 0;

    for (let move = 1; move < boardSize * boardSize; move++) {

        let minDeg = 9;
        let nextX = -1;
        let nextY = -1;

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

    displaySolution();
}


// ==========================
function countMoves(x, y) {
    let count = 0;

    for (let k = 0; k < 8; k++) {
        let nx = x + moveX[k];
        let ny = y + moveY[k];

        if (isSafe(nx, ny)) count++;
    }

    return count;
}


// ==========================
// DISPLAY SOLUTION
// ==========================
function displaySolution() {

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {

            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.innerText = board[i][j];
        }
    }
}
