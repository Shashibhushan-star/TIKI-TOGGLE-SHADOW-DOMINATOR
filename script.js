const GAME_POSITIONS = 10;
const TIKI_SIZE = 45;
const ROW_HEIGHT = 60; // 60px per row in CSS

// Game State
let numPlayers = 3;
let players = [];
let currentPlayerIndex = 0;
let isSwitching = false;
let gameOver = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const winScreen = document.getElementById('win-screen');

const playerCountSelect = document.getElementById('player-count');
const startBtn = document.getElementById('start-btn');
const exitBtn = document.getElementById('exit-btn');
const restartBtn = document.getElementById('restart-btn');
const winExitBtn = document.getElementById('win-exit-btn');

const boardBg = document.getElementById('track-bg');
const tikisLayer = document.getElementById('tikis-layer');
const turnIndicator = document.getElementById('turn-indicator');
const actionFeedback = document.getElementById('action-feedback');

const btnMove1 = document.getElementById('btn-move-1');
const btnMove2 = document.getElementById('btn-move-2');
const btnTopple = document.getElementById('btn-topple');
const btnSwitch = document.getElementById('btn-switch');
const btnCancelSwitch = document.getElementById('btn-cancel-switch');

const switchPanel = document.getElementById('switch-panel');
const switchTargets = document.getElementById('switch-targets');
const winnerText = document.getElementById('winner-text');

// Init
function init() {
    startBtn.addEventListener('click', startGame);
    exitBtn.addEventListener('click', showStartScreen);
    winExitBtn.addEventListener('click', showStartScreen);
    restartBtn.addEventListener('click', startGame);
    
    btnMove1.addEventListener('click', () => handleMove(1));
    btnMove2.addEventListener('click', () => handleMove(2));
    btnTopple.addEventListener('click', handleTopple);
    btnSwitch.addEventListener('click', handleSwitchInit);
    btnCancelSwitch.addEventListener('click', cancelSwitch);
    
    createTrackBackground();
}

function createTrackBackground() {
    boardBg.innerHTML = '';
    for (let i = 1; i <= GAME_POSITIONS; i++) {
        const row = document.createElement('div');
        row.className = `track-row ${i === 1 ? 'finish-line' : ''}`;
        
        const label = document.createElement('div');
        label.className = 'position-label';
        label.innerText = i;
        
        row.appendChild(label);
        boardBg.appendChild(row);
    }
}

function startGame() {
    numPlayers = parseInt(playerCountSelect.value);
    players = [];
    currentPlayerIndex = 0;
    gameOver = false;
    isSwitching = false;
    switchPanel.classList.add('hidden');
    
    for (let i = 1; i <= numPlayers; i++) {
        players.push({
            id: i,
            name: `Player ${i}`,
            pos: GAME_POSITIONS, // All start at bottom
            colorClass: `p${i}`
        });
    }
    
    renderTikis();
    updateTurnUI();
    setFeedback('Game started! Good luck.');
    
    startScreen.classList.remove('active');
    winScreen.classList.remove('active');
    gameScreen.classList.add('active');
}

function showStartScreen() {
    gameScreen.classList.remove('active');
    winScreen.classList.remove('active');
    startScreen.classList.add('active');
}

function renderTikis() {
    tikisLayer.innerHTML = '';
    
    // Group players by position to handle overlapping
    const posGroups = {};
    players.forEach(p => {
        if (!posGroups[p.pos]) posGroups[p.pos] = [];
        posGroups[p.pos].push(p);
    });
    
    players.forEach(p => {
        const tiki = document.createElement('div');
        tiki.className = `tiki ${p.colorClass} ${p.id === players[currentPlayerIndex].id && !gameOver ? 'active-tiki' : ''}`;
        tiki.innerText = `P${p.id}`;
        
        // Calculate position
        // top offset = (pos - 1) * ROW_HEIGHT + center offset
        const top = (p.pos - 1) * ROW_HEIGHT + (ROW_HEIGHT - TIKI_SIZE) / 2;
        
        // left offset based on how many share the same position
        const group = posGroups[p.pos];
        const idxInGroup = group.indexOf(p);
        const totalInGroup = group.length;
        
        // Base left offset after the position label
        const baseLeft = 50; 
        const spacing = TIKI_SIZE + 10;
        const left = baseLeft + (idxInGroup * spacing);
        
        tiki.style.top = `${top}px`;
        tiki.style.left = `${left}px`;
        
        tikisLayer.appendChild(tiki);
    });
}

function updateTurnUI() {
    if (gameOver) return;
    
    const currentPlayer = players[currentPlayerIndex];
    turnIndicator.innerText = `${currentPlayer.name}'s Turn`;
    turnIndicator.style.color = getPlayerColorHex(currentPlayer.id);
    turnIndicator.style.textShadow = `0 0 10px ${getPlayerColorHex(currentPlayer.id)}`;
    
    // Disable moves if switching
    btnMove1.disabled = isSwitching;
    btnMove2.disabled = isSwitching;
    btnTopple.disabled = isSwitching;
    btnSwitch.disabled = isSwitching;
    
    // Specific logic to disable buttons
    if (!isSwitching) {
        // Can always move 1 unless at pos 1
        btnMove1.disabled = currentPlayer.pos <= 1;
        // Can move 2 if pos > 2
        btnMove2.disabled = currentPlayer.pos <= 2;
        
        // Can topple if there's someone in front
        const someoneInFront = players.some(p => p.pos < currentPlayer.pos);
        btnTopple.disabled = !someoneInFront;
    }
}

function getPlayerColorHex(id) {
    switch(id) {
        case 1: return '#ff007f';
        case 2: return '#00f3ff';
        case 3: return '#39ff14';
        case 4: return '#ffff00';
        default: return '#fff';
    }
}

function setFeedback(msg) {
    actionFeedback.innerText = msg;
    actionFeedback.classList.remove('feedback-animate');
    void actionFeedback.offsetWidth; // trigger reflow
    actionFeedback.classList.add('feedback-animate');
}

function nextTurn() {
    if (checkWin()) return;
    
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    renderTikis();
    updateTurnUI();
}

function checkWin() {
    const winner = players.find(p => p.pos === 1);
    if (winner) {
        gameOver = true;
        renderTikis(); // Remove active state
        
        setTimeout(() => {
            winnerText.innerText = `${winner.name} Wins!`;
            winnerText.style.color = getPlayerColorHex(winner.id);
            gameScreen.classList.remove('active');
            winScreen.classList.add('active');
        }, 1000);
        return true;
    }
    return false;
}

// Actions
function handleMove(steps) {
    if (gameOver || isSwitching) return;
    
    const p = players[currentPlayerIndex];
    p.pos = Math.max(1, p.pos - steps);
    
    setFeedback(`${p.name} moved forward by ${steps}.`);
    
    renderTikis();
    setTimeout(nextTurn, 600);
}

function handleTopple() {
    if (gameOver || isSwitching) return;
    
    const p = players[currentPlayerIndex];
    
    // Find all players strictly in front of current player
    const inFront = players.filter(other => other.pos < p.pos);
    
    if (inFront.length === 0) return;
    
    // Find the minimum position among those in front (the very front)
    const minPos = Math.min(...inFront.map(other => other.pos));
    
    // Move all in front back by 1 (max at GAME_POSITIONS)
    inFront.forEach(other => {
        other.pos = Math.min(GAME_POSITIONS, other.pos + 1);
    });
    
    // Current player leaps to the front
    p.pos = minPos;
    
    setFeedback(`${p.name} toppled the stacks ahead!`);
    
    renderTikis();
    setTimeout(nextTurn, 800);
}

function handleSwitchInit() {
    if (gameOver || isSwitching) return;
    
    isSwitching = true;
    updateTurnUI();
    setFeedback('Select a player to switch with.');
    
    switchPanel.classList.remove('hidden');
    switchTargets.innerHTML = '';
    
    const currentPlayer = players[currentPlayerIndex];
    
    players.forEach(other => {
        if (other.id !== currentPlayer.id) {
            const btn = document.createElement('button');
            btn.className = `switch-target-btn ${other.colorClass}`;
            btn.innerText = `P${other.id}`;
            btn.onclick = () => executeSwitch(other);
            switchTargets.appendChild(btn);
        }
    });
}

function cancelSwitch() {
    isSwitching = false;
    switchPanel.classList.add('hidden');
    setFeedback('Action cancelled. Choose another action.');
    updateTurnUI();
}

function executeSwitch(targetPlayer) {
    const p = players[currentPlayerIndex];
    
    const tempPos = p.pos;
    p.pos = targetPlayer.pos;
    targetPlayer.pos = tempPos;
    
    switchPanel.classList.add('hidden');
    isSwitching = false;
    
    setFeedback(`${p.name} swapped with ${targetPlayer.name}!`);
    
    renderTikis();
    setTimeout(nextTurn, 800);
}

// Start everything
init();
