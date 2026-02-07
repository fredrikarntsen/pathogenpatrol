/* Version: #21 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// === DOM-ELEMENTER (HTML-koblinger) ===
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startBtn = document.getElementById('start-game-btn');

// Overlay for beskjeder
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

// Liste over knapper som hører til det spesifikke forsvaret (låses opp senere)
const specificDefenseBtns = [btnTHelper, btnBCell, btnTKiller];

// Knapper for medisin
const btnVaccine = document.getElementById('btn-vaccine');
const btnAntibiotics = document.getElementById('btn-antibiotics');
const resistanceBar = document.getElementById('resistance-bar');

// UI-visning (Topp-meny)
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');

// === SPILL-VARIABLER ===
let gameActive = false;
let animationId;
let frameCount = 0; // Teller frames for tidsstyring

// Lister over objekter i spillet
let enemies = [];
let towers = []; 
let projectiles = []; 

// Bygge-tilstand
let selectedTowerType = null; 
let specificDefenseUnlocked = false; // Blir true ved alder 15

// Medisin-tilstand
let antibioticResistance = 0; // 0 til 100%
let bacteriaResistant = false; // Blir true hvis resistens når 100%
let isVaccineTargeting = false; // Hvis true, venter vi på klikk på en fiende
let vaccinatedTypes = []; // Liste over fiendetyper vi har vaksinert mot

// === KONFIGURASJON (Priser og Verdier) ===
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

// Spillerens stats (Startverdier)
let playerStats = {
    age: 0,
    hp: 100,
    atp: 150,
    wave: 1
};

// Veien fiendene går (Waypoints)
const waypoints = [
    { x: 0, y: 100 },      
    { x: 200, y: 100 },    
    { x: 200, y: 400 },    
    { x: 500, y: 400 },    
    { x: 500, y: 200 },    
    { x: 800, y: 200 }     
];

// === INPUT HÅNDTERING: TÅRN-KNAPPER ===

function selectTower(type) {
    // Avbryt vaksine-modus hvis den er aktiv
    isVaccineTargeting = false; 
    document.body.style.cursor = "default";

    // Sjekk om tårnet er låst (før alder 15)
    if (['thelper', 'bcell', 'tkiller'].includes(type) && !specificDefenseUnlocked) {
        console.log("Dette forsvaret er ikke utviklet enda!");
        return; 
    }

    // Sjekk om vi har råd
    if (playerStats.atp >= TOWER_COSTS[type]) {
        selectedTowerType = type;
        console.log(`Valgt tårn: ${type}`);
        document.body.style.cursor = "crosshair"; // Endre peker for å vise at vi bygger
    } else {
        alert(`Ikke nok energi! ${type} koster ${TOWER_COSTS[type]} ATP.`);
        selectedTowerType = null;
        document.body.style.cursor = "default";
    }
}

// Koble knappene til funksjonen
btnSkin.addEventListener('click', () => selectTower('skin'));
btnMucus.addEventListener('click', () => selectTower('mucus'));
btnMacrophage.addEventListener('click', () => selectTower('macrophage'));
btnTHelper.addEventListener('click', () => selectTower('thelper'));
btnBCell.addEventListener('click', () => selectTower('bcell'));
btnTKiller.addEventListener('click', () => selectTower('tkiller'));

// === INPUT HÅNDTERING: MEDISIN-KNAPPER ===

// 1. Antibiotika
btnAntibiotics.addEventListener('click', () => {
    // Sjekk kostnad
    if (playerStats.atp < MED_COSTS.antibiotics) {
        alert("Ikke nok ATP til antibiotika.");
        return;
    }

    // Sjekk resistens
    if (bacteriaResistant) {
        alert("Antibiotika virker ikke lenger! Bakteriene er resistente.");
        return;
    }

    // Sjekk om det er vits (er det bakterier der?)
    const bacteriaOnScreen = enemies.filter(e => e.type === 'bacteria');
    if (bacteriaOnScreen.length === 0) {
        alert("Ingen bakterier å drepe. (Virker ikke på virus!)");
        return; 
    }

    // Utfør effekt
    playerStats.atp -= MED_COSTS.antibiotics;
    
    // Øk resistens
    antibioticResistance += 25;
    if (antibioticResistance > 100) antibioticResistance = 100;

    // Drep bakteriene
    enemies.forEach(enemy => {
        if (enemy.type === 'bacteria') {
            enemy.health = 0; // Dør med en gang
        }
    });

    console.log("Antibiotika brukt.");
    updateUI();
});

// 2. Vaksine
btnVaccine.addEventListener('click', () => {
    if (playerStats.atp < MED_COSTS.vaccine) {
        alert("Ikke nok ATP til vaksine.");
        return;
    }

    // Sett i "sikte-modus"
    isVaccineTargeting = true;
    selectedTowerType = null; // Avbryt bygging
    document.body.style.cursor = "help"; // Endre peker til spørsmålstegn
    console.log("Vaksine-modus aktivert. Klikk på en fiende.");
});


// === MUSEKLIKK PÅ SPILLBRETTET (CANVAS) ===
canvas.addEventListener('click', (e) => {
    if (!gameActive) return;

    // Finn museposisjon inni canvaset
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // SCENARIO A: Vaksine-sier (Klikke på fiende)
    if (isVaccineTargeting) {
        for (const enemy of enemies) {
            // Sjekk avstand til fiende
            const dist = Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2);
            if (dist < enemy.radius + 10) { 
                applyVaccine(enemy.type);
                return;
            }
        }
        console.log("Bommet på fiende.");
        return;
    }

    // SCENARIO B: Bygge tårn
    if (selectedTowerType) {
        const cost = TOWER_COSTS[selectedTowerType];
        
        // Sjekk råd igjen (i tilfelle de brukte penger mens de siktet)
        if (playerStats.atp >= cost) {
            // Sjekk om plasseringen er lovlig
            if (isPositionValid(x, y, selectedTowerType)) {
                buildTower(x, y, selectedTowerType, cost);
            } else {
                console.log("Ugyldig plassering her.");
            }
        } else {
            selectedTowerType = null;
            document.body.style.cursor = "default";
        }
    }
});

function applyVaccine(type) {
    if (vaccinatedTypes.includes(type)) {
        alert(`Du er allerede vaksinert mot ${type}!`);
        isVaccineTargeting = false;
        document.body.style.cursor = "default";
        return;
    }

    playerStats.atp -= MED_COSTS.vaccine;
    vaccinatedTypes.push(type);
    
    isVaccineTargeting = false;
    document.body.style.cursor = "default";

    alert(`Vaksine mot ${type} utviklet! Fremtidige ${type} vil være svakere.`);
    updateUI();
}

function buildTower(x, y, type, cost) {
    // Legg til riktig objekt i listen
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
    // 1. Sjekk om vi krasjer med andre tårn
    for (const tower of towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) return false; // For nærme
    }

    // 2. Sjekk om vi er på veien eller ikke
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

    // REGEL: Hud og Slim MÅ være på veien. Celler MÅ være utenfor.
    if (type === 'skin' || type === 'mucus') {
        return isOnPath;
    } else {
        return !isOnPath;
    }
}

// Matematisk hjelpefunksjon for avstand til linje
function distToSegment(p, v, w) {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}


// === SPILL-STATUS (Start, Game Over, Pause) ===

startBtn.addEventListener('click', () => initGame());

messageBtn.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
    // Fortsett spillet hvis vi ikke er døde
    if (playerStats.hp > 0) {
        gameActive = true;
        animate();
    } else {
        location.reload(); // Start på nytt hvis Game Over
    }
});

function initGame() {
    // UI Setup
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    // Reset Variabler
    gameActive = true;
    playerStats = { age: 0, hp: 100, atp: 150, wave: 1 };
    frameCount = 0;
    
    // Tøm lister
    enemies = [];
    towers = [];
    projectiles = []; 
    
    // Reset upgrades
    specificDefenseUnlocked = false;
    specificDefenseBtns.forEach(btn => btn.classList.add('locked'));
    
    // Reset medisin
    antibioticResistance = 0;
    bacteriaResistant = false;
    vaccinatedTypes = [];
    isVaccineTargeting = false;

    updateUI();
    animate();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    messageTitle.innerText = "GAME OVER";
    messageText.innerText = `Kroppen klarte ikke mer. Du ble ${playerStats.age} år gammel.`;
    messageBtn.innerText = "Prøv igjen";
    messageOverlay.classList.remove('hidden');
}


// === HOVED-LOOP (ANIMATE) ===
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    
    // Tøm lerretet
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tegn brettet
    drawBoard();

    // 2. Oppdater spill-objekter
    handleTowers();
    handleProjectiles();
    handleEnemies();

    // 3. Tidsstyrte hendelser
    frameCount++;

    // Alder øker (hvert 10. sekund ca)
    if (frameCount % 600 === 0) { 
        playerStats.age += 1;
        checkUnlocks(); // Sjekk om vi skal låse opp Spesifikt Forsvar
        updateUI();
    }

    // Spawn fiender (hvert 1.5 sekund ca)
    if (frameCount % 100 === 0) {
        spawnEnemy();
    }

    // Antibiotika resistens synker sakte (hvert 2. sekund)
    if (frameCount % 120 === 0 && antibioticResistance > 0 && !bacteriaResistant) {
        antibioticResistance -= 1;
        updateUI(); 
    }
    
    // Sjekk om resistens er kritisk
    if (antibioticResistance >= 100 && !bacteriaResistant) {
        bacteriaResistant = true;
        alert("KRITISK: Bakteriene har utviklet full resistens!");
    }
    
    // Sjekk Game Over
    if (playerStats.hp <= 0) {
        gameOver();
    }
}


// === OBJEKT-HÅNDTERING ===

// Sjekker om alder 15 er nådd
function checkUnlocks() {
    if (playerStats.age >= 15 && !specificDefenseUnlocked) {
        specificDefenseUnlocked = true;
        
        // Lås opp knappene visuelt
        specificDefenseBtns.forEach(btn => btn.classList.remove('locked'));

        // Pause og vis info
        gameActive = false;
        cancelAnimationFrame(animationId);
        
        messageTitle.innerText = "Kroppen er moden!";
        messageText.innerText = "Du er nå 15 år. Det spesifikke immunforsvaret (B- og T-celler) er ferdig utviklet!";
        messageBtn.innerText = "Fortsett";
        messageOverlay.classList.remove('hidden');
    }
}

function handleTowers() {
    for (let i = towers.length - 1; i >= 0; i--) {
        const tower = towers[i];
        
        // Fjern ødelagte tårn (Hud som er spist opp)
        if (tower.health !== undefined && tower.health <= 0) {
            towers.splice(i, 1);
            continue;
        }

        // Oppdater tårn
        // VIKTIG: Vi sender både 'enemies' (for å finne mål) og 'towers' (for T-Hjelper buffing)
        const projectile = tower.update(enemies, towers);
        
        // Hvis tårnet skjøt et prosjektil, legg det til i listen
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

        // Fjern prosjektiler som har truffet eller mistet målet
        if (p.markedForDeletion) {
            projectiles.splice(i, 1);
        }
    }
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Oppdater fiende. Vi sender 'towers' for kollisjonssjekk (Hud/Slim)
        const status = enemy.update(towers); 
        
        // Tegn visuell indikator på resistente bakterier
        if (bacteriaResistant && enemy.type === 'bacteria') {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
            ctx.strokeRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius*2, enemy.radius*2);
        }

        enemy.draw(ctx);

        // Scenario 1: Fienden døde (Helse <= 0)
        if (enemy.health <= 0) {
            playerStats.atp += enemy.moneyValue; // Gi penger
            updateUI();
            enemies.splice(i, 1);
            continue;
        }

        // Scenario 2: Fienden kom i mål
        if (status === 'finished') {
            playerStats.hp -= 10; // Mist liv
            updateUI();
            enemies.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    // Øk sjanse for bakterier når man blir eldre
    let chanceForBacteria = 0.1;
    if (playerStats.age > 15) chanceForBacteria = 0.4;
    
    const type = (Math.random() > (1 - chanceForBacteria)) ? 'bacteria' : 'virus';
    
    const newEnemy = new Enemy(waypoints, type);

    // Sjekk om vi har vaksine
    if (vaccinatedTypes.includes(type)) {
        newEnemy.maxHealth = newEnemy.maxHealth / 2; // Halv helse
        newEnemy.health = newEnemy.maxHealth;
        newEnemy.radius *= 0.8; // Litt mindre
    }

    enemies.push(newEnemy);
}

// === TEGNING OG UI ===

function drawBoard() {
    // Tegn selve veien
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

    // Tegn midtstripe (guide)
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
    
    // Fargekode helse
    if (playerStats.hp < 30) uiHp.style.color = 'red';
    else uiHp.style.color = '#32cd32';

    // Oppdater resistens-bar
    resistanceBar.style.width = antibioticResistance + '%';
    
    if (antibioticResistance < 50) {
        resistanceBar.style.backgroundColor = '#32cd32'; // Grønn
    } else if (antibioticResistance < 80) {
        resistanceBar.style.backgroundColor = 'orange';  // Oransje
    } else {
        resistanceBar.style.backgroundColor = 'red';     // Rød
    }
}

console.log("game.js lastet (Versjon #21). Fullstendig kode.");
/* Version: #21 */
