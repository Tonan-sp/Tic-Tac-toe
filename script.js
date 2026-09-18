// Connexion au serveur WebSocket hébergé sur Render
const socket = io("https://morpion-backend-qnv2.onrender.com");

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
let mySymbol = null;       // Symbol attribué au joueur actuel ('X' ou 'O')
let currentRoom = null;    // Nom de la room réseau
let isMyTurn = false;      // Est-ce au tour de ce joueur de cliquer ?
let gameOver = false;
let scores = { X: 0, O: 0 };

// Mettre à jour l'indicateur visuel de tour
function setTurnDisplay() {
  if (gameOver) return;

  if (isMyTurn) {
    turnIndicator.textContent = `À votre tour (${mySymbol})`;
  } else {
    const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';
    turnIndicator.textContent = `Au tour de l'adversaire (${opponentSymbol})`;
  }

  scoreCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.player === currentPlayer);
  });
}

function getWinningLine() {
  return winningLines.find(([first, second, third]) => (
    board[first] && board[first] === board[second] && board[first] === board[third]
  ));
}

// Appliquer un coup visuellement sur la grille
function applyMove(index, symbol) {
  board[index] = symbol;
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add(symbol.toLowerCase());
  cell.disabled = true;
  cell.setAttribute('aria-label', `Case ${index + 1}, ${symbol}`);

  const winningLine = getWinningLine();
  if (winningLine) {
    gameOver = true;
    scores[symbol] += 1;
    winningLine.forEach((winningIndex) => cells[winningIndex].classList.add('winner'));
    
    if (symbol === mySymbol) {
      message.textContent = `Vous avez gagné ! 🎉`;
    } else {
      message.textContent = `L'adversaire (${symbol}) a gagné !`;
    }
    
    turnIndicator.textContent = 'Partie terminée';
    document.querySelector(`#score-${symbol.toLowerCase()}`).textContent = scores[symbol];
    return;
  }

  if (board.every(Boolean)) {
    gameOver = true;
    message.textContent = 'Égalité ! Bien joué à tous les deux.';
    turnIndicator.textContent = 'Partie terminée';
    return;
  }

  // Alterner le tour
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  isMyTurn = (currentPlayer === mySymbol);
  
  if (isMyTurn) {
    message.textContent = "C'est à votre tour de jouer.";
  } else {
    message.textContent = "L'adversaire réfléchit...";
  }

  setTurnDisplay();
}

// Clic sur une case de la grille
function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  // Vérifications de sécurité
  if (gameOver || !isMyTurn || board[index] !== '' || !currentRoom) return;

  // Appliquer le coup localement
  applyMove(index, mySymbol);

  // Envoyer le coup au serveur pour informer l'autre joueur
  socket.emit('makeMove', {
    room: currentRoom,
    index: index,
    symbol: mySymbol
  });
}

// Réinitialiser visuellement la grille
function resetGameLocal() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  isMyTurn = (mySymbol === 'X');

  cells.forEach((cell, index) => {
    cell.textContent = '';
    cell.disabled = false;
    cell.className = 'cell';
    cell.setAttribute('aria-label', `Case ${index + 1}`);
  });

  if (mySymbol) {
    message.textContent = isMyTurn ? "Nouvelle manche ! Vous commencez." : "Nouvelle manche ! L'adversaire commence.";
    setTurnDisplay();
  }
}

function resetScores() {
  scores = { X: 0, O: 0 };
  scoreX.textContent = '0';
  scoreO.textContent = '0';
}

// ==================== ÉVÉNEMENTS WEBSOCKET ====================

// Reçu quand le joueur est en attente d'un adversaire
socket.on('waiting', (msg) => {
  message.textContent = msg;
  turnIndicator.textContent = 'Recherche...';
});

// Reçu lorsque deux joueurs sont jumelés
socket.on('startGame', (data) => {
  mySymbol = data.symbol;
  currentRoom = data.room;
  isMyTurn = data.myTurn;
  currentPlayer = 'X';

  resetGameLocal();
  
  if (isMyTurn) {
    message.textContent = `Adversaire trouvé ! Vous jouez les ${mySymbol}. À vous d'ouvrir !`;
  } else {
    message.textContent = `Adversaire trouvé ! Vous jouez les ${mySymbol}. Attendez le coup de l'adversaire.`;
  }
  setTurnDisplay();
});

// Reçu lorsqu'un coup est joué par l'adversaire
socket.on('moveMade', (data) => {
  applyMove(data.index, data.symbol);
});

// Attacher les listeners d'événements
cells.forEach((cell) => cell.addEventListener('click', handleCellClick));
resetButton.addEventListener('click', resetGameLocal);
resetScoresButton.addEventListener('click', resetScores);