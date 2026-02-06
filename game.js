/* Version: #18 */
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
const specificDefenseBtns = [btnTHelper, btnBCell, btnTKiller];

// Medisin-knapper og UI
const btnVaccine = document.getElementById('btn-vaccine');
const btnAntibiotics = document.getElementById('btn-antibiotics');
const resistanceBar = document.getElementById('resistance-bar');

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
let projectiles = [];
let selectedTowerType = null; 
let specificDefenseUnlocked = false;

// MEDISIN VARIABLER
let antibioticResistance = 0; // 0 til 100
let bacteriaResistant = false; // Blir true hvis resistens når 100
let isVaccineTargeting = false; // Er vi i "velg fiende for vaksine" modus?
let vaccinatedTypes = []; // Liste over typer vi har vaksinert mot (f.eks. ['virus'])

// Priser
const TOWER_COSTS = {
    skin: 20,
    mucus: 30,
    macrophage: 50,
    thelper: 100,
    bcell: 120,
    tkiller: 150
};

const MED_COSTS = {
    vaccine: 100,
    antibiotics: 100
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

// === INPUT HÅNDTERING (TÅRN) ===

function selectTower(type) {
    // Avbryt vaksine-modus hvis den er aktiv
    isVaccineTargeting = false; 
    document.body.style.cursor = "default";

    if (['thelper', 'bcell', 'tkiller'].includes(type) && !specificDefenseUnlocked) {
        console.log("Dette forsvaret er ikke utviklet enda!");
        return;
    }

    if (playerStats.atp >= TOWER_COSTS[type]) {
        selectedTowerType = type;
        console.log(`Valgt: ${type}. Klikk på brettet.`);
        document.body.style.cursor = "crosshair";
    } else {
        alert("Ikke nok ATP!");
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

// === INPUT HÅNDTERING (MEDISIN) ===

// 1. ANTIBIOTIKA
btnAntibiotics.addEventListener('click', () => {
    // Sjekk kostnad
    if (playerStats.atp < MED_COSTS.antibiotics) {
        alert("Ikke nok ATP til antibiotika (Koster 100).");
        return;
    }

    // Sjekk resistens
    if (bacteriaResistant) {
        alert("Antibiotika virker ikke! Bakteriene er resistente.");
        return;
    }

    // Sjekk om det finnes bakterier på skjermen
    const bacteriaOnScreen = enemies.filter(e => e.type === 'bacteria');
    
    if (bacteriaOnScreen.length === 0) {
        alert("Ingen bakterier å drepe! Antibiotika virker IKKE på virus.");
        return; // Ikke bruk penger eller øk resistens hvis det er bom
    }

    // UTFØR BEHANDLING
    playerStats.atp -= MED_COSTS.antibiotics;
    
    // Øk resistens kraftig
    antibioticResistance += 25;
    if (antibioticResistance > 100) antibioticResistance = 100;

    // Drep alle bakterier
    let killCount = 0;
    enemies.forEach(enemy => {
        if (enemy.type === 'bacteria') {
            enemy.health = 0; // Dør umiddelbart
            killCount++;
        }
    });

    console.log(`Antibiotika brukt. Drepte ${killCount} bakterier. Resistens: ${antibioticResistance}%`);
    updateUI();
});

// 2. VAKSINE
btnVaccine.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.vaccine) {
        alert("Ikke nok ATP til vaksine (Koster 100).");
        return;
    }

    // Aktiver sikte-modus
    isVaccineTargeting = true;
    selectedTowerType = null; // Avbryt evt. bygging
    document.body.style.cursor = "help"; // Endre cursor til spørsmålstegn/sikte
    console.log("Vaksine-modus: Klikk på en fiende for å utvikle immunitet.");
});


// === KLIKK PÅ CANVAS (BYGGING OG VAKSINE) ===
canvas.addEventListener('click', (e) => {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scenario A: Vi prøver å vaksinere (klikke på fiende)
    if (isVaccineTargeting) {
        // Sjekk om vi traff en fiende
        for (const enemy of enemies) {
            const dist = Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2);
            if (dist < enemy.radius + 10) { // Litt margin
                // Traff!
                applyVaccine(enemy.type);
                return;
            }
        }
        // Bommet
        console.log("Ingen fiende truffet.");
        return;
    }

    // Scenario B: Vi bygger tårn
    if (selectedTowerType) {
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
    }
});

function applyVaccine(type) {
    if (vaccinatedTypes.includes(type)) {
        alert(`Du har allerede vaksinert mot ${type}!`);
        isVaccineTargeting = false;
        document.body.style.cursor = "default";
        return;
    }

    // Betal
    playerStats.atp -= MED_COSTS.vaccine;
    
    // Legg til i listen
    vaccinatedTypes.push(type);
    
    // Reset cursor
    isVaccineTargeting = false;
    document.body.style.cursor = "default";

    // Vis beskjed
    alert(`Vaksine utviklet! Fremtidige ${type} vil være mye svakere.`);
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
    updateUI();
}

// === LOGIKK FOR PLASSERING ===
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
        if (dist < pathRadius) {
            isOnPath = true;
            break;
        }
    }

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
    
    frameCount = 0;
    enemies = [];
    towers = [];
    projectiles = []; 
    specificDefenseUnlocked = false;
    
    // Reset medisin
    antibioticResistance = 0;
    bacteriaResistant = false;
    vaccinatedTypes = [];
    isVaccineTargeting = false;

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
    handleProjectiles();
    handleEnemies();

    // Håndter antibiotika-resistens (synker sakte over tid)
    // Synker 1% hvert 2. sekund (120 frames)
    if (frameCount % 120 === 0 && antibioticResistance > 0 && !bacteriaResistant) {
        antibioticResistance -= 1;
        updateUI(); // Oppdater baren
    }
    // Sjekk om resistens er kritisk
    if (antibioticResistance >= 100 && !bacteriaResistant) {
        bacteriaResistant = true;
        alert("ADVARSEL: Bakteriene har utviklet full resistens! Antibiotika virker ikke lenger.");
    }

    frameCount++;
    
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        checkUnlocks(); 
        updateUI();
    }

    if (frameCount % 100 === 0) {
        spawnEnemy();
    }
    
    if (playerStats.hp <= 0) {
        gameOver();
    }
}

function checkUnlocks() {
    if (playerStats.age >= 15 && !specificDefenseUnlocked) {
        specificDefenseUnlocked = true;
        specificDefenseBtns.forEach(btn => btn.classList.remove('locked'));
        gameActive = false;
        cancelAnimationFrame(animationId);
        messageTitle.innerText = "Kroppen er moden!";
        messageText.innerText = "Det spesifikke immunforsvaret er utviklet! Du kan nå bygge B-celler og T-drepeceller.";
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
        const projectile = tower.update(enemies);
        if (projectile) {
            projectiles.push(projectile);
        }
        tower.draw(ctx);
    }
}

function handleProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw(ctx);
        if (p.markedForDeletion) {
            projectiles.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    let chanceForBacteria = 0.1;
    if (playerStats.age > 15) chanceForBacteria = 0.4;
    
    const type = (Math.random() > (1 - chanceForBacteria)) ? 'bacteria' : 'virus';
    
    // Lag fienden
    const newEnemy = new Enemy(waypoints, type);

    // Sjekk om vi har vaksine mot denne typen
    if (vaccinatedTypes.includes(type)) {
        // Vaksine-effekt: Halv helse
        newEnemy.maxHealth = newEnemy.maxHealth / 2;
        newEnemy.health = newEnemy.maxHealth;
        // Visuell effekt for å vise at den er svekket? (F.eks. mindre)
        newEnemy.radius *= 0.8; 
    }

    enemies.push(newEnemy);
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const status = enemy.update(towers); 
        
        // Hvis bakterier er resistente, vis det visuelt
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

    // Oppdater resistens-bar
    resistanceBar.style.width = antibioticResistance + '%';
    if (antibioticResistance < 50) {
        resistanceBar.style.backgroundColor = '#32cd32'; // Grønn
    } else if (antibioticResistance < 80) {
        resistanceBar.style.backgroundColor = 'orange';
    } else {
        resistanceBar.style.backgroundColor = 'red';
    }
}

console.log("game.js lastet (Versjon #18). Medisinmodul aktivert.");
/* Version: #18 */
