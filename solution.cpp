// Knight's Tour - Warnsdorff's Heuristic

// We tried doing this with plain backtracking first but it was way too slow for boards bigger than like 7x7. After reading about Warnsdorff's rule
// we switched to this approach - basically you always move to the square that has the LEAST number of onward moves available. It's greedy but
// works really well in practice.

#include <iostream>
#include <vector>
#include <climits>
using namespace std;

// all 8 possible L-shaped moves a knight can make
int dx[] = {2, 1, -1, -2, -2, -1,  1,  2};
int dy[] = {1, 2,  2,  1, -1, -2, -2, -1};

bool isValid(int x, int y, int N, vector<vector<int>> &board) {  // check if the position is inside the board AND not visited yet
    return (x >= 0 && x < N && y >= 0 && y < N && board[x][y] == -1);
}

// Warnsdorff's key function - count how many moves are available from (x, y)
// We pick the next square with the lowest degree (fewest onward moves)
int getDegree(int x, int y, int N, vector<vector<int>> &board) {
    int count = 0;
    for (int i = 0; i < 8; i++) {
        int nx = x + dx[i];
        int ny = y + dy[i];
        if (isValid(nx, ny, N, board))
            count++;
    }
    return count;
}

// returns the next best move using Warnsdorff's rule
// picks the neighbor with minimum onward degree
pair<int,int> nextMove(int x, int y, int N, vector<vector<int>> &board) {
    int minDeg = INT_MAX;
    int bestX = -1, bestY = -1;

    for (int i = 0; i < 8; i++) {
        int nx = x + dx[i];
        int ny = y + dy[i];

        if (isValid(nx, ny, N, board)) {
            int deg = getDegree(nx, ny, N, board);
            // if this neighbor has fewer onward moves, prefer it
            if (deg < minDeg) {
                minDeg = deg;
                bestX = nx;
                bestY = ny;
            }
        }
    }

    return {bestX, bestY};
}

bool solveKnightTour(int startX, int startY, int N, vector<vector<int>> &board) {
    board[startX][startY] = 0;  // mark starting square as move 0

    int curX = startX, curY = startY;

    for (int move = 1; move < N * N; move++) {
        auto [nx, ny] = nextMove(curX, curY, N, board);

        // if no valid next move found, tour failed from this start
        if (nx == -1)
            return false;

        board[nx][ny] = move;
        curX = nx;
        curY = ny;
    }

    return true;
}

void printBoard(vector<vector<int>> &board, int N) {
    cout << "\nKnight's Tour Solution:\n\n";
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            // padding so columns align nicely
            if (board[i][j] < 10) cout << " ";
            cout << board[i][j] << "  ";
        }
        cout << "\n";
    }
}

int main() {
    int N;
    cout << "Enter board size (N x N): ";
    cin >> N;

    if (N < 5) {
        // Knight's tour generally doesn't work for boards smaller than 5x5
        cout << "Board size too small! Try N >= 5\n";
        return 1;
    }

    // initialize board with -1 (unvisited)
    vector<vector<int>> board(N, vector<int>(N, -1));

    // starting from (0,0) - top left corner
    int startX = 0, startY = 0;

    cout << "Starting from position (" << startX << ", " << startY << ")\n";

    if (solveKnightTour(startX, startY, N, board)) {
        printBoard(board, N);
    } else {
        cout << "No solution found from this starting position.\n";
        cout << "Try a different starting square.\n";
    }

    return 0;
}
