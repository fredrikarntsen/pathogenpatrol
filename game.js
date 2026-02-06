/* Version: #10 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// DOM-elementer
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startBtn = document.getElementById('start-game-btn');
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const messageBtn = document.getElementById('message-btn');

// Knapper for tårn
const btnMacrophage = document.getElementById('btn-macrophage');

// UI-visning
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');

// Spill-variabler
let gameActive = false;
let animationId;
let frameCount = 0;
let enemies = [];
let towers = []; // Liste over alle plasserte tårn
let selectedTowerType = null; // Hvilket tårn vi holder på å bygge

// Priser
const TOWER_COSTS = {
    macrophage: 50
};

// Spillerens stats
let playerStats = {
    age: 0,
    hp: 100,
    atp: 150,
    wave: 1
};

// === KART OG VEI (Pathing) ===
const waypoints = [
    { x: 0, y: 100 },      
    { x: 200, y: 100 },    
    { x: 200, y: 400 },    
    { x: 500, y: 400 },    
    { x: 500, y: 200 },    
    { x: 800, y: 200 }     
];

// === INPUT HÅNDTERING (MUS) ===

// 1. Velg tårn fra menyen
btnMacrophage.addEventListener('click', () => {
    if (playerStats.atp >= TOWER_COSTS.macrophage) {
        selectedTowerType = 'macrophage';
        console.log("Valgt tårn: Makrofag. Klikk på brettet for å plassere.");
        // Visuell feedback på knappen kan legges til her
        document.body.style.cursor = "crosshair"; // Endre markør
    } else {
        console.log("Ikke nok ATP!");
        alert("Ikke nok energi (ATP) til å bygge denne cellen.");
    }
});

// 2. Klikk på kartet for å bygge
canvas.addEventListener('click', (e) => {
    if (!gameActive || !selectedTowerType) return;

    // Finn museposisjon relativt til canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Sjekk om vi har råd og om plassen er ledig
    const cost = TOWER_COSTS[selectedTowerType];
    
    if (playerStats.atp >= cost) {
        if (isPositionValid(x, y)) {
            buildTower(x, y, selectedTowerType, cost);
        } else {
            console.log("Ugyldig plassering! (På veien eller oppå et annet tårn)");
        }
    } else {
        console.log("Ikke nok ATP lenger.");
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
});

function buildTower(x, y, type, cost) {
    if (type === 'macrophage') {
        towers.push(new Macrophage(x, y));
    }
    
    // Trekk fra kostnad
    playerStats.atp -= cost;
    updateUI();
    
    console.log(`Bygget ${type} ved (${x}, ${y}). Gjenværende ATP: ${playerStats.atp}`);
    
    // Reset valg (krever nytt klikk for å bygge neste, eller behold for "quick build"?)
    // Vi resetter for nå for å unngå feilklikk.
    selectedTowerType = null;
    document.body.style.cursor = "default";
}

// === LOGIKK FOR PLASSERING (KOLLISJON) ===
function isPositionValid(x, y) {
    // 1. Sjekk kollisjon med eksisterende tårn
    for (const tower of towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 40) return false; // For nærme et annet tårn
    }

    // 2. Sjekk kollisjon med veien (Blodåren)
    // Veien er linjestykker mellom waypoints. Bredde ca 60px (radius 30).
    const pathRadius = 40; // Litt margin
    
    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i+1];
        
        // Matematikk for avstand fra punkt til linjestykke
        const dist = distToSegment({x, y}, p1, p2);
        
        if (dist < pathRadius) return false; // For nærme veien
    }

    return true;
}

// Hjelpefunksjon: Avstand fra punkt P til linjestykke VW
function distToSegment(p, v, w) {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}


// === INITIALISERING ===

// Lytter etter start-knappen
startBtn.addEventListener('click', () => {
    initGame();
});

messageBtn.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
    if (playerStats.hp <= 0) {
        location.reload(); 
    }
});

function initGame() {
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    gameActive = true;
    playerStats.age = 0;
    playerStats.hp = 100;
    playerStats.atp = 150;
    playerStats.wave = 1;
    
    frameCount = 0;
    enemies = [];
    towers = [];
    
    updateUI();
    animate();
}

// === SPILL-LOOP ===
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tegn brettet
    drawBoard();

    // 2. Håndter tårn (Oppdater og Tegn)
    handleTowers();

    // 3. Håndter fiender
    handleEnemies();

    // 4. Spill-logikk
    frameCount++;
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        updateUI();
    }

    // Spawn fiender (oftere etter hvert som alderen øker?)
    if (frameCount % 100 === 0) {
        spawnEnemy();
    }
    
    if (playerStats.hp <= 0) {
        gameOver();
    }
}

function handleTowers() {
    for (const tower of towers) {
        tower.update(enemies); // La tårnet finne mål og skyte
        tower.draw(ctx);       // Tegn tårnet
    }
}

function spawnEnemy() {
    const type = (Math.random() > 0.9) ? 'bacteria' : 'virus';
    enemies.push(new Enemy(waypoints, type));
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const status = enemy.update();
        enemy.draw(ctx);

        // Scenario A: Fienden døde av skade
        if (enemy.health <= 0) {
            playerStats.atp += enemy.moneyValue; // Gi penger
            updateUI();
            enemies.splice(i, 1);
            continue; // Gå til neste
        }

        // Scenario B: Fienden kom til mål
        if (status === 'finished') {
            playerStats.hp -= 10; 
            updateUI();
            enemies.splice(i, 1);
        }
    }
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    messageTitle.innerText = "GAME OVER";
    messageText.innerText = `Kroppen kollapset ved ${playerStats.age} år.`;
    messageBtn.innerText = "Prøv igjen";
    messageOverlay.classList.remove('hidden');
}

function drawBoard() {
    // Vei
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

    // Guide
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
}

function updateUI() {
    uiAge.innerText = playerStats.age;
    uiHp.innerText = playerStats.hp;
    uiAtp.innerText = playerStats.atp;
    uiWave.innerText = playerStats.wave;
    
    if (playerStats.hp < 30) uiHp.style.color = 'red';
    else uiHp.style.color = '#32cd32';
}

console.log("game.js lastet (Versjon #10). Bygging aktivert.");
/* Version: #10 */
