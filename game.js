/* Version: #26 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// === DOM-ELEMENTER ===
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
    skin: btnSkin,
    mucus: btnMucus,
    macrophage: btnMacrophage,
    thelper: btnTHelper,
    bcell: btnBCell,
    tkiller: btnTKiller
};

const btnVaccine = document.getElementById('btn-vaccine');
const btnAntibiotics = document.getElementById('btn-antibiotics');
const resistanceBar = document.getElementById('resistance-bar');

// UI-visning
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');

// === SPILL-VARIABLER ===
let gameActive = false;
let animationId;
let frameCount = 0;

let enemies = [];
let towers = []; 
let projectiles = []; 

let selectedTowerType = null; 

// Tilstander for progresjon
let specificDefenseUnlocked = false; // Alder 15
let age60Warned = false; // Har vi vist advarsel for 60 år?
let age80Warned = false; // Har vi vist advarsel for 80 år?

// Medisin
let antibioticResistance = 0; 
let bacteriaResistant = false; 
let isVaccineTargeting = false; 
let vaccinatedTypes = []; 

// === ØKONOMI OG KOSTNADER ===
// Startpriser
const BASE_COSTS = {
    skin: 20,
    mucus: 30,
    macrophage: 50,
    thelper: 100,
    bcell: 120,
    tkiller: 150
};

// Medisinpriser (faste)
const MED_COSTS = {
    vaccine: 100,
    antibiotics: 100
};

// Nåværende priser (øker når man bygger)
let currentCosts = { ...BASE_COSTS };
const COST_SCALING = 1.2; // Pris øker med 20% for hvert tårn av samme type

// Spillerens stats
let playerStats = {
    age: 0,
    hp: 100,
    atp: 150,
    wave: 1
};

// Veien (Waypoints)
const waypoints = [
    { x: 0, y: 100 },      
    { x: 200, y: 100 },    
    { x: 200, y: 400 },    
    { x: 500, y: 400 },    
    { x: 500, y: 200 },    
    { x: 800, y: 200 }     
];

// === HJELPEFUNKSJONER FOR UI ===

// Oppdaterer prislappen på knappene
function updateCostDisplay() {
    for (const [type, btn] of Object.entries(towerButtons)) {
        const costSpan = btn.querySelector('.cost');
        if (costSpan) {
            costSpan.innerText = Math.floor(currentCosts[type]) + " ATP";
        }
    }
}

// === INPUT HÅNDTERING ===

function selectTower(type) {
    isVaccineTargeting = false; 
    document.body.style.cursor = "default";

    if (['thelper', 'bcell', 'tkiller'].includes(type) && !specificDefenseUnlocked) {
        console.log("Ikke låst opp enda.");
        return; 
    }

    // Sjekk mot NÅVÆRENDE pris
    if (playerStats.atp >= currentCosts[type]) {
        selectedTowerType = type;
        document.body.style.cursor = "crosshair"; 
    } else {
        alert(`Ikke nok energi! ${type} koster nå ${Math.floor(currentCosts[type])} ATP.`);
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
}

// Koblinger
btnSkin.addEventListener('click', () => selectTower('skin'));
btnMucus.addEventListener('click', () => selectTower('mucus'));
btnMacrophage.addEventListener('click', () => selectTower('macrophage'));
btnTHelper.addEventListener('click', () => selectTower('thelper'));
btnBCell.addEventListener('click', () => selectTower('bcell'));
btnTKiller.addEventListener('click', () => selectTower('tkiller'));

// Medisin
btnAntibiotics.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.antibiotics) { alert("Mangler ATP."); return; }
    if (bacteriaResistant) { alert("Resistent!"); return; }
    
    const bacteriaOnScreen = enemies.filter(e => e.type === 'bacteria');
    if (bacteriaOnScreen.length === 0) { alert("Ingen bakterier."); return; }

    playerStats.atp -= MED_COSTS.antibiotics;
    antibioticResistance += 25;
    if (antibioticResistance > 100) antibioticResistance = 100;
    
    enemies.forEach(enemy => {
        if (enemy.type === 'bacteria') enemy.health = 0;
    });
    updateUI();
});

btnVaccine.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.vaccine) { alert("Mangler ATP."); return; }
    isVaccineTargeting = true;
    selectedTowerType = null;
    document.body.style.cursor = "help";
});

// Klikk på brett
canvas.addEventListener('click', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Vaksine
    if (isVaccineTargeting) {
        for (const enemy of enemies) {
            const dist = Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2);
            if (dist < enemy.radius + 10) { 
                applyVaccine(enemy.type);
                return;
            }
        }
        return;
    }

    // Bygging
    if (selectedTowerType) {
        const cost = currentCosts[selectedTowerType]; // Bruk dynamisk pris
        
        if (playerStats.atp >= cost) {
            if (isPositionValid(x, y, selectedTowerType)) {
                buildTower(x, y, selectedTowerType, cost);
            } else {
                console.log("Ugyldig plassering.");
            }
        } else {
            selectedTowerType = null;
            document.body.style.cursor = "default";
        }
    }
});

function applyVaccine(type) {
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
    alert(`Vaksine mot ${type} klar!`);
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
    
    // ØK PRISEN FOR NESTE KJØP
    currentCosts[type] = currentCosts[type] * COST_SCALING;
    updateCostDisplay(); // Oppdater teksten på knappen
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
    // Fortsett kun hvis vi lever og ikke har vunnet
    if (playerStats.hp > 0 && playerStats.age < 100) {
        gameActive = true;
        animate();
    } else {
        // Hvis død eller vunnet -> restart
        location.reload(); 
    }
});

function initGame() {
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    gameActive = true;
    playerStats = { age: 0, hp: 100, atp: 150, wave: 1 };
    frameCount = 0;
    
    enemies = [];
    towers = [];
    projectiles = []; 
    
    // Reset flags
    specificDefenseUnlocked = false;
    age60Warned = false;
    age80Warned = false;

    specificDefenseBtns.forEach(btn => btn.classList.add('locked'));
    
    antibioticResistance = 0;
    bacteriaResistant = false;
    vaccinatedTypes = [];
    isVaccineTargeting = false;

    // Reset priser
    currentCosts = { ...BASE_COSTS };
    updateCostDisplay();

    updateUI();
    animate();
}

// === SPILL-SLUTT FUNKSJONER ===
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
    messageTitle.style.color = "#ffd700"; // Gull
    messageText.innerText = `Du har levd et langt og friskt liv til 100 år! Immunforsvaret gjorde jobben sin.`;
    messageBtn.innerText = "Start nytt liv";
    messageOverlay.classList.remove('hidden');
}

// === MAIN LOOP ===
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBoard();
    handleTowers();
    handleProjectiles();
    handleEnemies();

    frameCount++;

    // --- ALDERS-LOGIKK ---
    // Øk alder hvert 600. frame (ca 10 sekunder)
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        checkAgeEvents(); 
        updateUI();
    }

    // --- SPAWN LOGIKK (Økende vanskelighetsgrad) ---
    // Start spawn rate: hver 120 frame (2 sek). 
    // Slutt spawn rate (ved 90 år): hver 30 frame (0.5 sek).
    // Formel: Reduser ventetid basert på alder.
    let spawnRate = Math.max(30, 120 - playerStats.age); 
    
    if (frameCount % spawnRate === 0) {
        spawnEnemy();
    }

    // --- MEDISIN LOGIKK ---
    if (frameCount % 120 === 0 && antibioticResistance > 0 && !bacteriaResistant) {
        antibioticResistance -= 1;
        updateUI(); 
    }
    if (antibioticResistance >= 100 && !bacteriaResistant) {
        bacteriaResistant = true;
        alert("KRITISK: Bakteriene har utviklet full resistens!");
    }
    
    // --- SJEKK HELSE ---
    if (playerStats.hp <= 0) {
        gameOver();
    }
}


function checkAgeEvents() {
    // 1. Lås opp spesifikt forsvar
    if (playerStats.age >= 15 && !specificDefenseUnlocked) {
        specificDefenseUnlocked = true;
        specificDefenseBtns.forEach(btn => btn.classList.remove('locked'));
        pauseAndShowMessage("Kroppen er moden!", "Du er 15 år. Det spesifikke immunforsvaret (B- og T-celler) er klart!");
    }

    // 2. Varsel 60 år (Aldring 1)
    if (playerStats.age >= 60 && !age60Warned) {
        age60Warned = true;
        pauseAndShowMessage("Alderdommen kommer...", "Du har fylt 60 år. Immunforsvaret reagerer 30% tregere.");
    }

    // 3. Varsel 80 år (Aldring 2)
    if (playerStats.age >= 80 && !age80Warned) {
        age80Warned = true;
        pauseAndShowMessage("Svekket forsvar", "Du har fylt 80 år. Immunforsvaret er nå sterkt svekket (50% tregere). Pass på!");
    }

    // 4. Seier ved 100 år
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

        // VIKTIG: Sender med playerStats.age for aldringseffekter i towers.js
        const projectile = tower.update(enemies, towers, playerStats.age);
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
    // Sjanse for bakterier øker med alder
    let chanceForBacteria = 0.1 + (playerStats.age / 200); // 0.1 ved 0 år, 0.6 ved 100 år
    
    const type = (Math.random() > (1 - chanceForBacteria)) ? 'bacteria' : 'virus';
    const newEnemy = new Enemy(waypoints, type);

    // SKALERING AV FIENDE-STYRKE
    // Fiender får +5% helse for hvert 10. år
    let healthMultiplier = 1 + (playerStats.age / 200); 
    newEnemy.maxHealth = Math.floor(newEnemy.maxHealth * healthMultiplier);
    newEnemy.health = newEnemy.maxHealth;

    // Vaksine-sjekk
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
        
        if (bacteriaResistant && enemy.type === 'bacteria') {
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

function updateUI() {
    uiAge.innerText = playerStats.age;
    uiHp.innerText = playerStats.hp;
    uiAtp.innerText = Math.floor(playerStats.atp); // Ingen desimaler
    uiWave.innerText = playerStats.wave;
    
    if (playerStats.hp < 30) uiHp.style.color = 'red';
    else uiHp.style.color = '#32cd32';

    resistanceBar.style.width = antibioticResistance + '%';
    if (antibioticResistance < 50) resistanceBar.style.backgroundColor = '#32cd32';
    else if (antibioticResistance < 80) resistanceBar.style.backgroundColor = 'orange';
    else resistanceBar.style.backgroundColor = 'red';
}

console.log("game.js lastet (Versjon #26). Dynamiske priser og vanskelighetsgrad.");
/* Version: #26 */
