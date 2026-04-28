#include <iostream>
#include <vector>
using namespace std;
int moveX[8] = {2, 1, -1, -2, -2, -1, 1, 2};
int moveY[8] = {1, 2, 2, 1, -1, -2, -2, -1};


bool isSafe(int x, int y, int N, vector<vector<int>> &board) {
    return (x >= 0 && y >= 0 && x < N && y < N && board[x][y] == -1);
}

bool solveKT(int x, int y, int moveCount, int N, vector<vector<int>> &board) {
    if (moveCount == N * N)
        return true;

    for (int k = 0; k < 8; k++) {
        int nextX = x + moveX[k];
        int nextY = y + moveY[k];

        if (isSafe(nextX, nextY, N, board)) {
            board[nextX][nextY] = moveCount;

            if (solveKT(nextX, nextY, moveCount + 1, N, board))
                return true;

            board[nextX][nextY] = -1;
        }
    }
    return false;
}
void printBoard(vector<vector<int>> &board, int N) {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++)
            cout << board[i][j] << "\t";
        cout << endl;
    }
}

int main() {
    int N;
    cout << "Enter board size (N): ";
    cin >> N;

    vector<vector<int>> board(N, vector<int>(N, -1));

    board[0][0] = 0;

    if (solveKT(0, 0, 1, N, board))
        printBoard(board, N);
    else
        cout << "No solution exists";

    return 0;
}