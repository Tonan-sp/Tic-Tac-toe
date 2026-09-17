const cells = [...document.querySelectorAll('.cell')];
const message = document.querySelector('#message');
const turnIndicator = document.querySelector('#turn-indicator');
const resetButton = document.querySelector('#reset-button');
const resetScoresButton = document.querySelector('#reset-scores-button');
const scoreX = document.querySelector('#score-x');
const scoreO = document.querySelector('#score-o');
const scoreCards = document.querySelectorAll('.score');

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let scores = { X: 0, O: 0 };

function setTurnDisplay() {
  turnIndicator.textContent = `Au tour de ${currentPlayer}`;
  scoreCards.forEach((card) => card.classList.toggle('active', card.dataset.player === currentPlayer));
}

function getWinningLine() {
  return winningLines.find(([first, second, third]) => (
    board[first] && board[first] === board[second] && board[first] === board[third]
  ));
}

function handleMove(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  if (gameOver || board[index]) return;

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());
  cell.disabled = true;
  cell.setAttribute('aria-label', `Case ${index + 1}, ${currentPlayer}`);

  const winningLine = getWinningLine();
  if (winningLine) {
    gameOver = true;
    scores[currentPlayer] += 1;
    winningLine.forEach((winningIndex) => cells[winningIndex].classList.add('winner'));
    message.textContent = `${currentPlayer} a gagné la partie !`;
    turnIndicator.textContent = 'Partie terminée';
    document.querySelector(`#score-${currentPlayer.toLowerCase()}`).textContent = scores[currentPlayer];
    return;
  }

  if (board.every(Boolean)) {
    gameOver = true;
    message.textContent = 'Égalité ! Bien joué à tous les deux.';
    turnIndicator.textContent = 'Partie terminée';
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  message.textContent = `C'est au tour de ${currentPlayer}`;
  setTurnDisplay();
}

function resetGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  cells.forEach((cell, index) => {
    cell.textContent = '';
    cell.disabled = false;
    cell.className = 'cell';
    cell.setAttribute('aria-label', `Case ${index + 1}`);
  });
  message.textContent = 'X commence la partie';
  setTurnDisplay();
}

function resetScores() {
  scores = { X: 0, O: 0 };
  scoreX.textContent = '0';
  scoreO.textContent = '0';
}

cells.forEach((cell) => cell.addEventListener('click', handleMove));
resetButton.addEventListener('click', resetGame);
resetScoresButton.addEventListener('click', resetScores);
setTurnDisplay();
