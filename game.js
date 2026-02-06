/* Version: #13 */
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
const btnSkin = document.getElementById('btn-skin');
const btnMucus = document.getElementById('btn-mucus');
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
let towers = []; 
let selectedTowerType = null; 

// Priser
const TOWER_COSTS = {
    skin: 20,       // Billig
    mucus: 30,      // Middels
    macrophage: 50  // Dyrere
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

// Funksjon for å velge tårn
function selectTower(type) {
    if (playerStats.atp >= TOWER_COSTS[type]) {
        selectedTowerType = type;
        console.log(`Valgt: ${type}. Klikk på brettet.`);
        document.body.style.cursor = "crosshair";
    } else {
        console.log("Ikke nok ATP!");
        alert(`Ikke nok energi. ${type} koster ${TOWER_COSTS[type]} ATP.`);
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
}

// Koble knapper til funksjon
btnSkin.addEventListener('click', () => selectTower('skin'));
btnMucus.addEventListener('click', () => selectTower('mucus'));
btnMacrophage.addEventListener('click', () => selectTower('macrophage'));

// Klikk på kartet for å bygge
canvas.addEventListener('click', (e) => {
    if (!gameActive || !selectedTowerType) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cost = TOWER_COSTS[selectedTowerType];
    
    if (playerStats.atp >= cost) {
        // Sjekk om posisjonen er gyldig for DENNE typen tårn
        if (isPositionValid(x, y, selectedTowerType)) {
            buildTower(x, y, selectedTowerType, cost);
        } else {
            console.log("Ugyldig plassering!");
            // Gi feedback basert på type
            if (selectedTowerType === 'macrophage') {
                alert("Makrofager må plasseres utenfor blodåren.");
            } else {
                alert("Hud og Slim må plasseres PÅ blodåren (veien).");
            }
        }
    } else {
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
});

function buildTower(x, y, type, cost) {
    if (type === 'macrophage') {
        towers.push(new Macrophage(x, y));
    } else if (type === 'skin') {
        towers.push(new Skin(x, y));
    } else if (type === 'mucus') {
        towers.push(new Mucus(x, y));
    }
    
    playerStats.atp -= cost;
    updateUI();
    
    // Vi lar valget være aktivt for "quick build" (kan endres hvis ønskelig)
    // selectedTowerType = null; 
    // document.body.style.cursor = "default";
}

// === LOGIKK FOR PLASSERING ===
function isPositionValid(x, y, type) {
    // 1. Sjekk kollisjon med andre tårn (uansett type)
    for (const tower of towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) return false; // For nærme et annet tårn
    }

    // 2. Sjekk forholdet til veien
    const pathRadius = 30; // Radius på veien (halvparten av bredden)
    let isOnPath = false;
    
    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i+1];
        const dist = distToSegment({x, y}, p1, p2);
        
        if (dist < pathRadius) {
            isOnPath = true;
            break;
        }
    }

    // REGEL: 
    // Makrofag (Turret) -> Må være UTENFOR veien (!isOnPath)
    // Hud/Slim (Barrier/Trap) -> Må være PÅ veien (isOnPath)
    
    if (type === 'macrophage') {
        return !isOnPath;
    } else {
        return isOnPath;
    }
}

function distToSegment(p, v, w) {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// === INITIALISERING ===
startBtn.addEventListener('click', () => initGame());

messageBtn.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
    if (playerStats.hp <= 0) location.reload(); 
});

function initGame() {
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    gameActive = true;
    playerStats = { age: 0, hp: 100, atp: 150, wave: 1 };
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

    drawBoard();
    handleTowers();
    handleEnemies(); // Sender nå tårnene inn her!

    frameCount++;
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        updateUI();
    }

    if (frameCount % 100 === 0) {
        spawnEnemy();
    }
    
    if (playerStats.hp <= 0) {
        gameOver();
    }
}

function handleTowers() {
    // Gå baklengs gjennom listen i tilfelle vi fjerner tårn (ødelagt hud)
    for (let i = towers.length - 1; i >= 0; i--) {
        const tower = towers[i];
        
        // Sjekk om tårnet er ødelagt (Kun aktuelt for Hud)
        if (tower.health !== undefined && tower.health <= 0) {
            towers.splice(i, 1); // Fjern muren
            continue;
        }

        tower.update(enemies);
        tower.draw(ctx);
    }
}

function spawnEnemy() {
    const type = (Math.random() > 0.9) ? 'bacteria' : 'virus';
    enemies.push(new Enemy(waypoints, type));
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // VIKTIG ENDRING: Send "towers" til enemy.update()
        const status = enemy.update(towers); 
        
        enemy.draw(ctx);

        if (enemy.health <= 0) {
            playerStats.atp += enemy.moneyValue;
            updateUI();
            enemies.splice(i, 1);
            continue;
        }

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

console.log("game.js lastet (Versjon #13). Hud og Slim aktivert.");
/* Version: #13 */
