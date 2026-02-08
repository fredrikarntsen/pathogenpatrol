/* Version: #36 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container'); // For CSS-effekter

// DOM-elementer
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startBtn = document.getElementById('start-game-btn');

// Overlay
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const messageBtn = document.getElementById('message-btn');

// Knapper
const btnSkin = document.getElementById('btn-skin');
const btnMucus = document.getElementById('btn-mucus');
const btnMacrophage = document.getElementById('btn-macrophage');
const btnTHelper = document.getElementById('btn-t-helper');
const btnBCell = document.getElementById('btn-b-cell');
const btnTKiller = document.getElementById('btn-t-killer');
const specificDefenseBtns = [btnTHelper, btnBCell, btnTKiller];
const towerButtons = {
    skin: btnSkin, mucus: btnMucus, macrophage: btnMacrophage,
    thelper: btnTHelper, bcell: btnBCell, tkiller: btnTKiller
};

const btnVaccine = document.getElementById('btn-vaccine');
const btnAntibiotics = document.getElementById('btn-antibiotics');
const resistanceBar = document.getElementById('resistance-bar');
const vaccineList = document.getElementById('vaccine-list'); 

// UI-visning
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');
const uiStatus = document.getElementById('status-display'); // NYTT: Status-felt

// === SPILL-VARIABLER ===
let gameActive = false;
let animationId;
let frameCount = 0;

let enemies = [];
let towers = []; 
let projectiles = []; 

let selectedTowerType = null; 

// Tilstander
let specificDefenseUnlocked = false; 
let age60Warned = false; 
let age80Warned = false; 

// Medisin
let antibioticResistance = 0; 
let bacteriaResistant = false; 
let isVaccineTargeting = false; 
let vaccinatedTypes = []; 

// Sykdom
const SICKNESS_THRESHOLD = 5; // Antall fiender før man blir "syk"

// Økonomi
const BASE_COSTS = {
    skin: 20, mucus: 30, macrophage: 50,
    thelper: 100, bcell: 120, tkiller: 150
};
const MED_COSTS = { vaccine: 100, antibiotics: 100 };
let currentCosts = { ...BASE_COSTS };
const COST_SCALING = 1.2; 

let playerStats = { 
    age: 0, 
    hp: 100, 
    atp: 150, 
    wave: 1,
    isSick: false // Ny status
};

const waypoints = [ { x: 0, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 400 }, { x: 500, y: 400 }, { x: 500, y: 200 }, { x: 800, y: 200 } ];

// === BØLGE KONFIGURASJON ===
function getAvailableEnemiesForWave(wave) {
    if (wave === 1) return ['virus_red'];
    if (wave === 2) return ['virus_red', 'bacteria_green'];
    if (wave <= 5) return ['virus_red', 'virus_blue', 'bacteria_green'];
    if (wave <= 9) return ['virus_blue', 'virus_yellow', 'bacteria_green', 'bacteria_orange'];
    return ['virus_red', 'virus_blue', 'virus_yellow', 'bacteria_green', 'bacteria_orange', 'bacteria_purple'];
}

function updateCostDisplay() {
    for (const [type, btn] of Object.entries(towerButtons)) {
        const costSpan = btn.querySelector('.cost');
        if (costSpan) costSpan.innerText = Math.floor(currentCosts[type]) + " ATP";
    }
}

// === INPUT ===
function selectTower(type) {
    isVaccineTargeting = false; 
    document.body.style.cursor = "default";
    if (['thelper', 'bcell', 'tkiller'].includes(type) && !specificDefenseUnlocked) return;

    if (playerStats.atp >= currentCosts[type]) {
        selectedTowerType = type;
        document.body.style.cursor = "crosshair"; 
    } else {
        alert(`Ikke nok energi! ${Math.floor(currentCosts[type])} ATP.`);
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
}

btnSkin.addEventListener('click', () => selectTower('skin'));
btnMucus.addEventListener('click', () => selectTower('mucus'));
btnMacrophage.addEventListener('click', () => selectTower('macrophage'));
btnTHelper.addEventListener('click', () => selectTower('thelper'));
btnBCell.addEventListener('click', () => selectTower('bcell'));
btnTKiller.addEventListener('click', () => selectTower('tkiller'));

btnAntibiotics.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.antibiotics) { alert("Mangler ATP."); return; }
    if (bacteriaResistant) { alert("Resistent!"); return; }
    const bacteriaOnScreen = enemies.filter(e => e.type.startsWith('bacteria'));
    if (bacteriaOnScreen.length === 0) { alert("Ingen bakterier."); return; }

    playerStats.atp -= MED_COSTS.antibiotics;
    antibioticResistance += 25;
    if (antibioticResistance > 100) antibioticResistance = 100;
    
    enemies.forEach(enemy => {
        if (enemy.type.startsWith('bacteria')) enemy.health = 0;
    });
    updateUI();
});

btnVaccine.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.vaccine) { alert("Mangler ATP."); return; }
    isVaccineTargeting = true;
    selectedTowerType = null;
    document.body.style.cursor = "help";
});

canvas.addEventListener('click', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isVaccineTargeting) {
        for (const enemy of enemies) {
            const dist = Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2);
            if (dist < enemy.radius + 10) { 
                applyVaccine(enemy); 
                return;
            }
        }
        return;
    }

    if (selectedTowerType) {
        const cost = currentCosts[selectedTowerType];
        if (playerStats.atp >= cost) {
            if (isPositionValid(x, y, selectedTowerType)) {
                buildTower(x, y, selectedTowerType, cost);
            }
        } else {
            selectedTowerType = null;
            document.body.style.cursor = "default";
        }
    }
});

function applyVaccine(enemy) {
    const type = enemy.type;
    if (vaccinatedTypes.includes(type)) {
        alert("Allerede vaksinert.");
        isVaccineTargeting = false;
        document.body.style.cursor = "default";
        return;
    }
    playerStats.atp -= MED_COSTS.vaccine;
    vaccinatedTypes.push(type);
    isVaccineTargeting = false;
    document.body.style.cursor = "default";
    
    const badge = document.createElement('div');
    badge.className = 'vaccine-badge';
    badge.style.backgroundColor = enemy.color;
    vaccineList.appendChild(badge);

    alert(`Vaksine utviklet!`);
    updateUI();
}

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
    currentCosts[type] *= COST_SCALING;
    updateCostDisplay();
    updateUI();
}

function isPositionValid(x, y, type) {
    for (const tower of towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) return false; 
    }
    const pathRadius = 30; 
    let isOnPath = false;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i+1];
        const dist = distToSegment({x, y}, p1, p2);
        if (dist < pathRadius) { isOnPath = true; break; }
    }
    if (type === 'skin' || type === 'mucus') return isOnPath;
    else return !isOnPath;
}

function distToSegment(p, v, w) {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}


// === SPILL-TILSTAND ===

startBtn.addEventListener('click', () => initGame());

messageBtn.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
    if (playerStats.hp > 0 && playerStats.age < 100) {
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
    playerStats = { age: 0, hp: 100, atp: 150, wave: 1, isSick: false };
    frameCount = 0;
    enemies = [];
    towers = [];
    projectiles = []; 
    specificDefenseUnlocked = false;
    age60Warned = false;
    age80Warned = false;
    specificDefenseBtns.forEach(btn => btn.classList.add('locked'));
    antibioticResistance = 0;
    bacteriaResistant = false;
    vaccinatedTypes = [];
    isVaccineTargeting = false;
    vaccineList.innerHTML = '';
    currentCosts = { ...BASE_COSTS };
    
    // Fjern sykdomseffekter hvis de henger igjen
    canvasContainer.classList.remove('sick-state');
    
    updateCostDisplay();
    updateUI();
    animate();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    messageTitle.innerText = "GAME OVER";
    messageTitle.style.color = "red";
    messageText.innerText = `Infeksjonen tok overhånd. Du ble ${playerStats.age} år gammel.`;
    messageBtn.innerText = "Prøv igjen";
    messageOverlay.classList.remove('hidden');
}

function gameWon() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    messageTitle.innerText = "GRATULERER!";
    messageTitle.style.color = "#ffd700"; 
    messageText.innerText = `Du har levd et langt og friskt liv til 100 år!`;
    messageBtn.innerText = "Start nytt liv";
    messageOverlay.classList.remove('hidden');
}

// === MAIN LOOP ===
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- SJEKK SYKDOMSSTATUS ---
    if (enemies.length >= SICKNESS_THRESHOLD) {
        playerStats.isSick = true;
    } else {
        playerStats.isSick = false;
    }
    // Oppdater UI en gang per frame (kan optimaliseres, men ok for nå)
    updateStatusUI();

    drawBoard();
    handleTowers();
    handleProjectiles();
    handleEnemies();

    frameCount++;

    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        checkAgeEvents(); 
        if (playerStats.age % 5 === 0) {
            playerStats.wave++;
        }
        updateUI();
    }

    // --- SPAWN LOGIKK ---
    let spawnRate = Math.max(20, 90 - (playerStats.wave * 3)); 
    
    if (frameCount % spawnRate === 0) {
        spawnEnemy();
        let swarmChance = 0.2 + (playerStats.wave * 0.05);
        if (Math.random() < swarmChance) {
             spawnEnemy(); 
        }
    }

    if (frameCount % 120 === 0 && antibioticResistance > 0 && !bacteriaResistant) {
        antibioticResistance -= 1;
        updateUI(); 
    }
    if (antibioticResistance >= 100 && !bacteriaResistant) {
        bacteriaResistant = true;
        alert("KRITISK: Bakteriene har utviklet full resistens!");
    }
    
    if (playerStats.hp <= 0) gameOver();
}


function checkAgeEvents() {
    if (playerStats.age >= 15 && !specificDefenseUnlocked) {
        specificDefenseUnlocked = true;
        specificDefenseBtns.forEach(btn => btn.classList.remove('locked'));
        pauseAndShowMessage("Kroppen er moden!", "Spesifikt immunforsvar (B/T-celler) er klart!");
    }
    if (playerStats.age >= 60 && !age60Warned) {
        age60Warned = true;
        pauseAndShowMessage("Alderdommen kommer...", "60 år. Forsvaret er 30% tregere.");
    }
    if (playerStats.age >= 80 && !age80Warned) {
        age80Warned = true;
        pauseAndShowMessage("Svekket forsvar", "80 år. Forsvaret er 50% tregere.");
    }
    if (playerStats.age >= 100) {
        gameWon();
    }
}

function pauseAndShowMessage(title, text) {
    gameActive = false;
    cancelAnimationFrame(animationId);
    messageTitle.innerText = title;
    messageTitle.style.color = "#ff4d4d";
    messageText.innerText = text;
    messageBtn.innerText = "Fortsett";
    messageOverlay.classList.remove('hidden');
}


function handleTowers() {
    for (let i = towers.length - 1; i >= 0; i--) {
        const tower = towers[i];
        if (tower.health !== undefined && tower.health <= 0) {
            towers.splice(i, 1);
            continue;
        }
        // VIKTIG: Sender nå isSick til tårnet!
        const projectile = tower.update(enemies, towers, playerStats.age, playerStats.isSick);
        if (projectile) projectiles.push(projectile);
        tower.draw(ctx);
    }
}

function handleProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw(ctx);
        if (p.markedForDeletion) projectiles.splice(i, 1);
    }
}

function spawnEnemy() {
    const availableTypes = getAvailableEnemiesForWave(playerStats.wave);
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    const newEnemy = new Enemy(waypoints, type);

    let healthMultiplier = 1 + (playerStats.wave * 0.05); 
    newEnemy.maxHealth = Math.floor(newEnemy.maxHealth * healthMultiplier);
    newEnemy.health = newEnemy.maxHealth;

    if (vaccinatedTypes.includes(type)) {
        newEnemy.maxHealth /= 2;
        newEnemy.health = newEnemy.maxHealth;
        newEnemy.radius *= 0.8; 
    }

    enemies.push(newEnemy);
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const status = enemy.update(towers); 
        
        if (bacteriaResistant && enemy.type.startsWith('bacteria')) {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
            ctx.strokeRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius*2, enemy.radius*2);
        }

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

// NY FUNKSJON: Oppdaterer kun status-delen (for å håndtere blinking/CSS)
function updateStatusUI() {
    if (playerStats.isSick) {
        uiStatus.innerText = "INFEKSJON!";
        uiStatus.style.color = "#ff4d4d"; // Rød
        uiStatus.classList.add('text-blink'); // Blinkende tekst
        canvasContainer.classList.add('sick-state'); // Grønn kant på brettet
    } else {
        uiStatus.innerText = "Frisk";
        uiStatus.style.color = "#32cd32"; // Grønn
        uiStatus.classList.remove('text-blink');
        canvasContainer.classList.remove('sick-state');
    }
}

function updateUI() {
    uiAge.innerText = playerStats.age;
    uiHp.innerText = playerStats.hp;
    uiAtp.innerText = Math.floor(playerStats.atp); 
    uiWave.innerText = playerStats.wave;
    
    if (playerStats.hp < 30) uiHp.style.color = 'red';
    else uiHp.style.color = '#32cd32';

    resistanceBar.style.width = antibioticResistance + '%';
    if (antibioticResistance < 50) resistanceBar.style.backgroundColor = '#32cd32';
    else if (antibioticResistance < 80) resistanceBar.style.backgroundColor = 'orange';
    else resistanceBar.style.backgroundColor = 'red';
}

console.log("game.js lastet (Versjon #36). Fullt spill med sykdomslogikk.");
/* Version: #36 */
