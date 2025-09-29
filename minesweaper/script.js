// Game configuration for different difficulty levels
const DIFFICULTY_LEVELS = {
    beginner: {
        rows: 9,
        cols: 9,
        mines: 15
    },
    intermediate: {
        rows: 16,
        cols: 16,
        mines: 40
    },
    expert: {
        rows: 16,
        cols: 30,
        mines: 99
    }
};

// Game state variables
let board = [];
let minePositions = [];
let gameOver = false;
let gameWon = false;
let firstClick = true;
let timer = 0;
let timerInterval = null;
let flaggedCells = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const difficultySelector = document.getElementById('difficulty');
const resetButton = document.getElementById('reset-button');
const minesCountElement = document.getElementById('mines-count');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    // Reset game state
    gameOver = false;
    gameWon = false;
    firstClick = true;
    flaggedCells = 0;
    clearInterval(timerInterval);
    timer = 0;
    timerElement.textContent = timer;
    
    // Hide message
    messageElement.classList.add('hidden');
    
    // Get selected difficulty
    const difficulty = difficultySelector.value;
    const { rows, cols, mines } = DIFFICULTY_LEVELS[difficulty];
    
    // Update mines counter
    minesCountElement.textContent = mines;
    
    // Create empty board
    board = Array(rows).fill().map(() => Array(cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
    })));
    
    // Set mine positions array
    minePositions = [];
    
    // Render the board
    renderBoard(rows, cols);
    console.log(`Game initialized with ${rows}x${cols} board and ${mines} mines`);
}

// Render the game board
function renderBoard(rows, cols) {
    console.log(`Rendering board: ${rows} rows x ${cols} cols`);
    // Clear the game board
    gameBoard.innerHTML = '';
    
    // Set grid template columns
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    
    // Create cells
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add event listeners
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(row, col);
            });
            
            gameBoard.appendChild(cell);
        }
    }
}

// Place mines randomly on the board (avoiding the first clicked cell)
function placeMines(firstRow, firstCol) {
    const difficulty = difficultySelector.value;
    const { rows, cols, mines } = DIFFICULTY_LEVELS[difficulty];
    
    console.log(`Placing ${mines} mines on board, avoiding ${firstRow},${firstCol}`);
    
    // Create array of all possible positions
    const positions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Don't place mine on first clicked cell or its neighbors
            if (Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1) {
                continue;
            }
            positions.push({ row, col });
        }
    }
    
    // Shuffle positions and select mines
    shuffleArray(positions);
    minePositions = positions.slice(0, mines);
    
    // Place mines on the board
    minePositions.forEach(({ row, col }) => {
        board[row][col].isMine = true;
    });
    
    // Calculate adjacent mines for each cell
    calculateAdjacentMines();
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Calculate adjacent mines for each cell
function calculateAdjacentMines() {
    const difficulty = difficultySelector.value;
    const { rows, cols } = DIFFICULTY_LEVELS[difficulty];
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!board[row][col].isMine) {
                board[row][col].adjacentMines = countAdjacentMines(row, col);
            }
        }
    }
}

// Count adjacent mines for a cell
function countAdjacentMines(row, col) {
    const difficulty = difficultySelector.value;
    const { rows, cols } = DIFFICULTY_LEVELS[difficulty];
    
    let count = 0;
    
    // Check all 8 neighboring cells
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (board[r][c].isMine) {
                count++;
            }
        }
    }
    
    return count;
}

// Handle left click on a cell
function handleCellClick(row, col) {
    // Ignore if game is over or cell is flagged
    if (gameOver || gameWon || board[row][col].isFlagged) {
        return;
    }
    
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    
    // First click - place mines and start timer
    if (firstClick) {
        console.log(`First click at ${row},${col}`);
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    // If it's a mine, game over
    if (board[row][col].isMine) {
        console.warn("Mine clicked! Game over.");
        revealMines();
        cell.classList.add('revealed', 'mine');
        gameOver = true;
        clearInterval(timerInterval);
        showMessage('Game Over!', 'lose');
        return;
    }
    
    // Reveal the cell
    revealCell(row, col);
    
    // Check for win
    checkWin();
}

// Reveal a cell and its neighbors if it's empty
function revealCell(row, col) {
    const difficulty = difficultySelector.value;
    const { rows, cols } = DIFFICULTY_LEVELS[difficulty];
    
    // Ignore if out of bounds, already revealed, or flagged
    if (row < 0 || row >= rows || col < 0 || col >= cols || 
        board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }
    
    // Mark as revealed
    board[row][col].isRevealed = true;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('revealed');
    
    // If it's an empty cell, reveal neighbors
    if (board[row][col].adjacentMines === 0) {
        cell.textContent = '';
        
        // Recursively reveal neighbors
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                if (r !== row || c !== col) {
                    revealCell(r, c);
                }
            }
        }
    } else {
        // Show adjacent mine count
        cell.textContent = board[row][col].adjacentMines;
        cell.dataset.count = board[row][col].adjacentMines;
    }
}

// Handle right click (flag placement)
function handleRightClick(row, col) {
    // Ignore if game is over or cell is already revealed
    if (gameOver || gameWon || board[row][col].isRevealed) {
        return;
    }
    
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    const difficulty = difficultySelector.value;
    const { mines } = DIFFICULTY_LEVELS[difficulty];
    
    // Toggle flag
    if (board[row][col].isFlagged) {
        console.log(`Removing flag from ${row},${col}`);
        board[row][col].isFlagged = false;
        cell.classList.remove('flagged');
        flaggedCells--;
    } else {
        // Only allow flagging if we have mines left
        if (flaggedCells < mines) {
            console.log(`Placing flag at ${row},${col}`);
            board[row][col].isFlagged = true;
            cell.classList.add('flagged');
            flaggedCells++;
        }
    }
    
    // Update mines counter
    minesCountElement.textContent = mines - flaggedCells;
}

// Reveal all mines (when game is lost)
function revealMines() {
    minePositions.forEach(({ row, col }) => {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!board[row][col].isFlagged) {
            cell.classList.add('revealed', 'mine');
        }
    });
}

// Start the game timer
function startTimer() {
    console.log("Starting game timer");
    clearInterval(timerInterval);
    timer = 0;
    timerElement.textContent = timer;
    
    timerInterval = setInterval(() => {
        timer++;
        timerElement.textContent = timer;
    }, 1000);
}

// Check if player has won
function checkWin() {
    const difficulty = difficultySelector.value;
    const { rows, cols, mines } = DIFFICULTY_LEVELS[difficulty];
    
    // Count revealed cells
    let revealedCells = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].isRevealed) {
                revealedCells++;
            }
        }
    }
    
    // Win condition: all non-mine cells are revealed
    if (revealedCells === (rows * cols - mines)) {
        console.log("Congratulations! You won the game!");
        gameWon = true;
        gameOver = true;
        clearInterval(timerInterval);
        showMessage('You Win!', 'win');
    }
}

// Show message (win/lose)
function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    messageElement.classList.remove('hidden');
}

// Event listeners
difficultySelector.addEventListener('change', initGame);
resetButton.addEventListener('click', initGame);

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', initGame);