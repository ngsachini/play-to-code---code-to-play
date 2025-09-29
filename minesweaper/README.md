# Minesweeper Game

A classic Minesweeper game implemented with HTML, CSS, and JavaScript.

## Features

- Three difficulty levels: Beginner, Intermediate, and Expert
- Left-click to reveal cells
- Right-click to flag potential mines
- Timer to track game duration
- Mine counter to show remaining mines
- Responsive design that works on mobile devices

## Play & Edit Feature

This repository includes a powerful "Play & Edit" developer playground that allows you to modify the game code and see your changes in real-time.

### How to Use Play & Edit

1. Open `games/minesweeper/play-and-edit.html` in your browser
2. You'll see three editable code panels for HTML, CSS, and JavaScript
3. Make changes to any of the code panels
4. Click "Run" or enable "Live Update" to see your changes in the preview
5. Use "Save" to persist your changes to localStorage
6. Use "Reset to Original" to restore the default game code

### Features of Play & Edit

- **Live Preview**: See your changes in real-time with a 300ms debounce
- **Sandboxed Preview**: The preview runs in a secure iframe with `sandbox="allow-scripts"` for security
- **Console Output**: Captures and displays console.log, console.warn, and console.error messages from the preview
- **Code Editing**: Syntax highlighting, line numbers, and basic autocomplete for HTML, CSS, and JavaScript
- **Revision History**: Keeps the last 10 edits in localStorage with ability to revert
- **Keyboard Shortcuts**: 
  - Ctrl/Cmd+S to save
  - Ctrl/Cmd+Enter to run
- **Export Options**: Save changes to localStorage, download files, or open in a new tab

### Security Notes

- The preview iframe is sandboxed with `sandbox="allow-scripts"` but without `allow-same-origin` to prevent access to parent DOM
- All communication between the parent and iframe is done via postMessage
- The parent window never evaluates untrusted code
- Console output is captured by injecting a small wrapper script in the preview that overrides console methods

### Running Locally

For best compatibility, especially with features like localStorage and file downloads, it's recommended to run the game through a local static server rather than opening files directly with `file://`.

You can use one of these commands to start a local server:

```bash
# Using npx serve
npx serve

# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser to `http://localhost:8000` or `http://localhost:8000/games/minesweeper/play-and-edit.html` for the Play & Edit interface.

### Distributing User Edits

Users can download their modified files using the "Download Files" button. For a complete solution, you might want to implement ZIP file generation or provide individual file downloads.

For version control, users can:
1. Download their files and use Git for full versioning
2. Use the built-in revision history (last 10 edits)
3. Save to localStorage for persistence between sessions

## Game Controls

- **Left-click**: Reveal a cell
- **Right-click**: Flag/unflag a cell
- **Difficulty selector**: Change game difficulty
- **Reset button**: Start a new game

## Game Rules

1. The goal is to clear the board without detonating any mines
2. Numbers indicate how many mines are adjacent to that cell
3. Right-click to place a flag where you suspect a mine is located
4. The game is won when all non-mine cells are revealed
5. The game is lost if you reveal a mine

## Customization

You can modify the game by editing:
- `index.html`: Game structure and layout
- `style.css`: Visual appearance and styling
- `script.js`: Game logic and functionality

The Play & Edit interface makes it easy to experiment with changes and see the results immediately.