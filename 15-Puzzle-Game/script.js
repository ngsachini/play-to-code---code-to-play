class PuzzleGame {
    constructor() {
        this.board = [];
        this.emptyRow = 3;
        this.emptyCol = 3;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.history = [];
        this.bestTime = localStorage.getItem('puzzleBestTime') ? parseInt(localStorage.getItem('puzzleBestTime')) : Infinity;
        this.bestMoves = localStorage.getItem('puzzleBestMoves') ? parseInt(localStorage.getItem('puzzleBestMoves')) : Infinity;
        
        this.initializeBoard();
        this.bindEvents();
        this.render();
        this.updateStats();
    }
    
    // Initialize the board with tiles in order
    initializeBoard() {
        this.board = [];
        for (let i = 0; i < 4; i++) {
            this.board[i] = [];
            for (let j = 0; j < 4; j++) {
                this.board[i][j] = i * 4 + j + 1;
            }
        }
        this.board[3][3] = 0; // Empty space
        this.emptyRow = 3;
        this.emptyCol = 3;
        this.moves = 0;
        this.history = [];
    }
    
    // Shuffle the tiles into a random but solvable configuration
    shuffle() {
        // Reset the board to solved state first
        this.initializeBoard();
        
        // Perform a series of valid moves to shuffle
        const moves = 1000;
        for (let i = 0; i < moves; i++) {
            const possibleMoves = this.getPossibleMoves();
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.moveTile(randomMove.row, randomMove.col, true); // true means it's a shuffle move
        }
        
        this.moves = 0;
        this.history = [];
        this.startTimer();
    }
    
    // Get all possible moves for the current state
    getPossibleMoves() {
        const moves = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = this.emptyRow + dr;
            const newCol = this.emptyCol + dc;
            
            if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        return moves;
    }
    
    // Move a tile to the empty space
    moveTile(row, col, isShuffle = false) {
        // Check if the tile is adjacent to the empty space
        const isAdjacent = 
            (Math.abs(row - this.emptyRow) === 1 && col === this.emptyCol) ||
            (Math.abs(col - this.emptyCol) === 1 && row === this.emptyRow);
            
        if (!isAdjacent) return false;
        
        // Save state for undo (unless it's a shuffle move)
        if (!isShuffle) {
            this.history.push({
                board: this.board.map(row => [...row]),
                emptyRow: this.emptyRow,
                emptyCol: this.emptyCol,
                moves: this.moves
            });
        }
        
        // Swap the tile with the empty space
        const temp = this.board[row][col];
        this.board[row][col] = this.board[this.emptyRow][this.emptyCol];
        this.board[this.emptyRow][this.emptyCol] = temp;
        
        // Update empty position
        this.emptyRow = row;
        this.emptyCol = col;
        
        // Update moves count (unless it's a shuffle move)
        if (!isShuffle) {
            this.moves++;
        }
        
        this.render();
        this.updateStats();
        
        // Check for win
        if (!isShuffle && this.isSolved()) {
            this.endGame();
        }
        
        return true;
    }
    
    // Undo the last move
    undoMove() {
        if (this.history.length === 0) return;
        
        const prevState = this.history.pop();
        this.board = prevState.board;
        this.emptyRow = prevState.emptyRow;
        this.emptyCol = prevState.emptyCol;
        this.moves = prevState.moves;
        
        this.render();
        this.updateStats();
    }
    
    // Provide a hint by highlighting a tile that should be moved
    showHint() {
        // Find the correct position for each tile in the solved state
        const solvedBoard = [];
        for (let i = 0; i < 4; i++) {
            solvedBoard[i] = [];
            for (let j = 0; j < 4; j++) {
                solvedBoard[i][j] = i * 4 + j + 1;
            }
        }
        solvedBoard[3][3] = 0; // Empty space
        
        // Find a tile that is in the correct position in the solved board
        // but is not in the correct position in the current board
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] !== 0 && this.board[i][j] === solvedBoard[i][j]) {
                    // This tile is in the correct position, skip it
                    continue;
                }
                
                // Find where this tile should be
                const value = this.board[i][j];
                if (value === 0) continue;
                
                const targetRow = Math.floor((value - 1) / 4);
                const targetCol = (value - 1) % 4;
                
                // Check if moving this tile would bring it closer to its target
                const currentDistance = Math.abs(i - targetRow) + Math.abs(j - targetCol);
                
                // Check if moving this tile to the empty space would reduce distance
                const newDistance = Math.abs(this.emptyRow - targetRow) + Math.abs(this.emptyCol - targetCol);
                
                if (newDistance < currentDistance) {
                    // Highlight this tile
                    const tileElement = document.querySelector(`.tile[data-row="${i}"][data-col="${j}"]`);
                    if (tileElement) {
                        tileElement.classList.add('movable');
                        setTimeout(() => {
                            tileElement.classList.remove('movable');
                        }, 1000);
                    }
                    return;
                }
            }
        }
        
        // If no specific hint, just highlight any movable tile
        const possibleMoves = this.getPossibleMoves();
        if (possibleMoves.length > 0) {
            const move = possibleMoves[0];
            const tileElement = document.querySelector(`.tile[data-row="${move.row}"][data-col="${move.col}"]`);
            if (tileElement) {
                tileElement.classList.add('movable');
                setTimeout(() => {
                    tileElement.classList.remove('movable');
                }, 1000);
            }
        }
    }
    
    // Check if the puzzle is solved
    isSolved() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (i === 3 && j === 3) {
                    if (this.board[i][j] !== 0) return false;
                } else {
                    if (this.board[i][j] !== i * 4 + j + 1) return false;
                }
            }
        }
        return true;
    }
    
    // Start the game timer
    startTimer() {
        if (this.isTimerRunning) return;
        
        this.startTime = new Date();
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            const currentTime = new Date();
            const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    // Stop the game timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.isTimerRunning = false;
        }
    }
    
    // End the game when puzzle is solved
    endGame() {
        this.stopTimer();
        
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
        
        // Update best stats
        let newBestTime = false;
        let newBestMoves = false;
        
        if (elapsedTime < this.bestTime) {
            this.bestTime = elapsedTime;
            localStorage.setItem('puzzleBestTime', elapsedTime.toString());
            newBestTime = true;
        }
        
        if (this.moves < this.bestMoves) {
            this.bestMoves = this.moves;
            localStorage.setItem('puzzleBestMoves', this.moves.toString());
            newBestMoves = true;
        }
        
        // Show win modal
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        
        document.getElementById('win-time').textContent = `${minutes}:${seconds}` + (newBestTime ? ' (New Best!)' : '');
        document.getElementById('win-moves').textContent = this.moves + (newBestMoves ? ' (New Best!)' : '');
        
        const bestMinutes = Math.floor(this.bestTime / 60).toString().padStart(2, '0');
        const bestSeconds = (this.bestTime % 60).toString().padStart(2, '0');
        document.getElementById('best-time').textContent = this.bestTime === Infinity ? 'N/A' : `${bestMinutes}:${bestSeconds}`;
        document.getElementById('best-moves').textContent = this.bestMoves === Infinity ? 'N/A' : this.bestMoves;
        
        document.getElementById('win-modal').classList.remove('hidden');
    }
    
    // Update the moves and timer display
    updateStats() {
        document.getElementById('moves').textContent = this.moves;
    }
    
    // Render the board
    render() {
        const boardElement = document.getElementById('puzzle-board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = this.board[i][j];
                const tile = document.createElement('div');
                
                if (value === 0) {
                    tile.className = 'tile empty';
                    tile.setAttribute('aria-label', 'Empty space');
                } else {
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.setAttribute('tabindex', '0');
                    tile.setAttribute('role', 'button');
                    tile.setAttribute('aria-label', `Tile ${value}`);
                    tile.setAttribute('data-row', i);
                    tile.setAttribute('data-col', j);
                    
                    // Check if this tile can be moved
                    const isMovable = 
                        (Math.abs(i - this.emptyRow) === 1 && j === this.emptyCol) ||
                        (Math.abs(j - this.emptyCol) === 1 && i === this.emptyRow);
                    
                    if (isMovable) {
                        tile.classList.add('movable');
                    }
                }
                
                boardElement.appendChild(tile);
            }
        }
    }
    
    // Handle keyboard navigation
    handleKeyDown(event) {
        // Prevent default behavior for arrow keys to avoid page scrolling
        if ([37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();
        }
        
        let newRow = this.emptyRow;
        let newCol = this.emptyCol;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                newCol = Math.min(3, this.emptyCol + 1);
                break;
            case 38: // Up arrow
                newRow = Math.min(3, this.emptyRow + 1);
                break;
            case 39: // Right arrow
                newCol = Math.max(0, this.emptyCol - 1);
                break;
            case 40: // Down arrow
                newRow = Math.max(0, this.emptyRow - 1);
                break;
            default:
                return; // Exit for other keys
        }
        
        // Only move if the position changed
        if (newRow !== this.emptyRow || newCol !== this.emptyCol) {
            this.moveTile(newRow, newCol);
        }
    }
    
    // Bind event listeners
    bindEvents() {
        // Tile click events
        document.getElementById('puzzle-board').addEventListener('click', (event) => {
            const tile = event.target;
            if (tile.classList.contains('tile') && !tile.classList.contains('empty')) {
                const row = parseInt(tile.getAttribute('data-row'));
                const col = parseInt(tile.getAttribute('data-col'));
                this.moveTile(row, col);
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        // Shuffle button
        document.getElementById('shuffle-btn').addEventListener('click', () => {
            this.stopTimer();
            this.shuffle();
        });
        
        // Undo button
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undoMove();
        });
        
        // Hint button
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });
        
        // Play again button
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.add('hidden');
            this.shuffle();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new PuzzleGame();
    game.shuffle(); // Start with a shuffled board
});