/* Version: #17 */
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
const btnTHelper = document.getElementById('btn-t-helper');
const btnBCell = document.getElementById('btn-b-cell');
const btnTKiller = document.getElementById('btn-t-killer');

// Samling av knapper for spesifikt forsvar (for enkel opplåsing)
const specificDefenseBtns = [btnTHelper, btnBCell, btnTKiller];

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
let projectiles = []; // NYTT: Liste for kuler/gift
let selectedTowerType = null; 
let specificDefenseUnlocked = false; // Holder styr på om vi er voksne nok

// Priser
const TOWER_COSTS = {
    skin: 20,
    mucus: 30,
    macrophage: 50,
    thelper: 100, // Dyrere
    bcell: 120,
    tkiller: 150
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

function selectTower(type) {
    // Sjekk om tårnet er låst (Spesifikt forsvar før alder 15)
    if (['thelper', 'bcell', 'tkiller'].includes(type) && !specificDefenseUnlocked) {
        console.log("Dette forsvaret er ikke utviklet enda!");
        return; // Gjør ingenting
    }

    if (playerStats.atp >= TOWER_COSTS[type]) {
        selectedTowerType = type;
        console.log(`Valgt: ${type}. Klikk på brettet.`);
        document.body.style.cursor = "crosshair";
    } else {
        console.log("Ikke nok ATP!");
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
}

// Koble knapper
btnSkin.addEventListener('click', () => selectTower('skin'));
btnMucus.addEventListener('click', () => selectTower('mucus'));
btnMacrophage.addEventListener('click', () => selectTower('macrophage'));
btnTHelper.addEventListener('click', () => selectTower('thelper'));
btnBCell.addEventListener('click', () => selectTower('bcell'));
btnTKiller.addEventListener('click', () => selectTower('tkiller'));

// Klikk på kartet for å bygge
canvas.addEventListener('click', (e) => {
    if (!gameActive || !selectedTowerType) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cost = TOWER_COSTS[selectedTowerType];
    
    if (playerStats.atp >= cost) {
        if (isPositionValid(x, y, selectedTowerType)) {
            buildTower(x, y, selectedTowerType, cost);
        } else {
            console.log("Ugyldig plassering!");
        }
    } else {
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
});

function buildTower(x, y, type, cost) {
    switch (type) {
        case 'skin': towers.push(new Skin(x, y)); break;
        case 'mucus': towers.push(new Mucus(x, y)); break;
        case 'macrophage': towers.push(new Macrophage(x, y)); break;
        case 'thelper': towers.push(new THelper(x, y)); break;
        case 'bcell': towers.push(new BCell(x, y)); break;
        case 'tkiller': towers.push(new TKiller(x, y)); break;
    }
    
    playerStats.atp -= cost;
    updateUI();
}

// === LOGIKK FOR PLASSERING ===
function isPositionValid(x, y, type) {
    // 1. Sjekk kollisjon med andre tårn
    for (const tower of towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) return false;
    }

    // 2. Sjekk forholdet til veien
    const pathRadius = 30; 
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

    // REGEL: Hud/Slim PÅ veien, alt annet (celler) UTENFOR
    if (type === 'skin' || type === 'mucus') {
        return isOnPath;
    } else {
        return !isOnPath;
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
    // Hvis vi bare pauset for en beskjed, fortsett spillet (hvis hp > 0)
    if (playerStats.hp > 0) {
        gameActive = true;
        animate();
    } else {
        location.reload(); 
    }
});

function initGame() {
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    gameActive = true;
    playerStats = { age: 0, hp: 100, atp: 150, wave: 1 };
    
    // Reset alt
    frameCount = 0;
    enemies = [];
    towers = [];
    projectiles = []; // Tøm prosjektiler
    specificDefenseUnlocked = false;

    // Lås knappene visuelt igjen ved omstart
    specificDefenseBtns.forEach(btn => btn.classList.add('locked'));

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
    handleProjectiles(); // NY: Håndter kuler
    handleEnemies();

    frameCount++;
    
    // Øk alder
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        checkUnlocks(); // Sjekk om vi skal låse opp nytt forsvar
        updateUI();
    }

    if (frameCount % 100 === 0) {
        spawnEnemy();
    }
    
    if (playerStats.hp <= 0) {
        gameOver();
    }
}

// Sjekker om alder kvalifiserer til opplåsing
function checkUnlocks() {
    if (playerStats.age >= 15 && !specificDefenseUnlocked) {
        specificDefenseUnlocked = true;
        
        // Fjern locked-klasse
        specificDefenseBtns.forEach(btn => btn.classList.remove('locked'));

        // Pause spillet og vis beskjed
        gameActive = false;
        cancelAnimationFrame(animationId);
        
        messageTitle.innerText = "Kroppen er moden!";
        messageText.innerText = "Du har nådd 15 år. Det spesifikke immunforsvaret er utviklet! Du kan nå bygge B-celler, T-drepeceller og T-hjelpeceller.";
        messageBtn.innerText = "Fortsett";
        messageOverlay.classList.remove('hidden');
    }
}

function handleTowers() {
    for (let i = towers.length - 1; i >= 0; i--) {
        const tower = towers[i];
        
        if (tower.health !== undefined && tower.health <= 0) {
            towers.splice(i, 1);
            continue;
        }

        // Få prosjektil i retur hvis tårnet skjøt
        const projectile = tower.update(enemies);
        if (projectile) {
            projectiles.push(projectile);
        }

        tower.draw(ctx);
    }
}

// NY FUNKSJON: Håndter prosjektiler
function handleProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        p.update();
        p.draw(ctx);

        // Fjern hvis den traff eller fienden døde før treff
        if (p.markedForDeletion) {
            projectiles.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    // Øk vanskelighetsgrad basert på alder?
    // Start med mest virus, så bakterier
    let chanceForBacteria = 0.1;
    if (playerStats.age > 15) chanceForBacteria = 0.4;
    
    const type = (Math.random() > (1 - chanceForBacteria)) ? 'bacteria' : 'virus';
    enemies.push(new Enemy(waypoints, type));
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Send towers til update for kollisjon
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

console.log("game.js lastet (Versjon #17). Spesifikt forsvar aktivert.");
/* Version: #17 */
