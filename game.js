/* Version: #7 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// DOM-elementer (Knapper og UI)
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startBtn = document.getElementById('start-game-btn');
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const messageBtn = document.getElementById('message-btn');

// UI-visning av stats
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');

// Spill-variabler
let gameActive = false;
let animationId;
let frameCount = 0; // Teller antall frames for tidsstyring
let enemies = [];   // Liste over alle aktive fiender

// Spillerens stats (Startverdier)
let playerStats = {
    age: 0,
    hp: 100,
    atp: 150,
    wave: 1
};

// === KART OG VEI (Pathing) ===
// En enkel svingete vei for "Barndom" nivået.
const waypoints = [
    { x: 0, y: 100 },      // Start
    { x: 200, y: 100 },    
    { x: 200, y: 400 },    
    { x: 500, y: 400 },    
    { x: 500, y: 200 },    
    { x: 800, y: 200 }     // Slutt
];

// === INITIALISERING ===

// Lytter etter start-knappen
startBtn.addEventListener('click', () => {
    initGame();
});

// Lytter etter overlay-knappen (Game Over / Info)
messageBtn.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
    if (playerStats.hp <= 0) {
        // Hvis vi klikker etter game over, reset spillet
        location.reload(); 
    }
});

function initGame() {
    // 1. Skjul startskjerm, vis spill
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    // 2. Reset variabler
    gameActive = true;
    playerStats.age = 0;
    playerStats.hp = 100;
    playerStats.atp = 150;
    playerStats.wave = 1;
    frameCount = 0;
    enemies = []; // Tøm listen over fiender
    
    updateUI();
    
    console.log("Spill initialisert.");
    animate();
}

// === SPILL-MOTOREN (Game Loop) ===
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    
    // Tøm lerretet
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tegn banen
    drawBoard();

    // 2. Håndter fiender
    handleEnemies();

    // 3. Logikk for alder og ressurser over tid
    frameCount++;
    
    // Øk alder hvert 10. sekund (600 frames)
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        updateUI();
    }

    // Spawn fiender (Midlertidig enkel logikk: Spawn hver 100. frame)
    if (frameCount % 100 === 0) {
        spawnEnemy();
    }
    
    // Sjekk om spillet er tapt
    if (playerStats.hp <= 0) {
        gameOver();
    }
}

// === FIENDE-HÅNDTERING ===
function spawnEnemy() {
    // 10% sjanse for bakterie, ellers virus (i starten)
    const type = (Math.random() > 0.9) ? 'bacteria' : 'virus';
    enemies.push(new Enemy(waypoints, type));
}

function handleEnemies() {
    // Vi itererer baklengs gjennom listen for trygt å kunne fjerne elementer
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Flytt fienden og sjekk status
        const status = enemy.update();
        
        // Tegn fienden
        enemy.draw(ctx);

        // Hvis fienden er fremme ved slutten
        if (status === 'finished') {
            playerStats.hp -= 10; // Mist helse
            updateUI();
            enemies.splice(i, 1); // Fjern fra listen
        }
    }
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    messageTitle.innerText = "GAME OVER";
    messageText.innerText = `Du overlevde til du ble ${playerStats.age} år gammel. Patogenene vant denne gangen.`;
    messageBtn.innerText = "Prøv igjen";
    messageOverlay.classList.remove('hidden');
}

// === TEGNE-FUNKSJONER ===
function drawBoard() {
    // Tegn veien (Blodåren)
    ctx.beginPath();
    ctx.lineWidth = 60; 
    ctx.strokeStyle = "#5a1a1a"; 
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke(); 

    // Guide-linje
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
}

// === UI OPPDATERING ===
function updateUI() {
    uiAge.innerText = playerStats.age;
    uiHp.innerText = playerStats.hp;
    uiAtp.innerText = playerStats.atp;
    uiWave.innerText = playerStats.wave;
    
    // Endre farge på HP hvis den er lav
    if (playerStats.hp < 30) {
        uiHp.style.color = 'red';
    } else {
        uiHp.style.color = '#32cd32';
    }
}

console.log("game.js lastet (Versjon #7). Fiender aktivert.");
/* Version: #7 */
