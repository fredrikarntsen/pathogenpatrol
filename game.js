/* Version: #4 */
// === OPPSETT OG KONFIGURASJON ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// DOM-elementer (Knapper og UI)
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startBtn = document.getElementById('start-game-btn');

// UI-visning av stats
const uiAge = document.getElementById('age-display');
const uiHp = document.getElementById('hp-display');
const uiAtp = document.getElementById('atp-display');
const uiWave = document.getElementById('wave-display');

// Spill-variabler
let gameActive = false;
let animationId;
let frameCount = 0; // Teller antall frames for tidsstyring

// Spillerens stats (Startverdier)
let playerStats = {
    age: 0,
    hp: 100,
    atp: 150,
    wave: 1
};

// === KART OG VEI (Pathing) ===
// En enkel svingete vei for "Barndom" nivået.
// Koordinater er x, y. Fiender vil bevege seg fra punkt til punkt.
const waypoints = [
    { x: 0, y: 100 },      // Start (Venstre side, litt opp)
    { x: 200, y: 100 },    // Går rett frem
    { x: 200, y: 400 },    // Svinger ned
    { x: 500, y: 400 },    // Svinger høyre
    { x: 500, y: 200 },    // Svinger opp
    { x: 800, y: 200 }     // Slutt (Høyre side)
];

// === INITIALISERING ===

// Lytter etter start-knappen
startBtn.addEventListener('click', () => {
    console.log("Start-knapp trykket. Starter spillet...");
    initGame();
});

function initGame() {
    // 1. Skjul startskjerm, vis spill
    startScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    // 2. Sett startverdier
    gameActive = true;
    playerStats.age = 0;
    playerStats.hp = 100;
    playerStats.atp = 150;
    
    // 3. Oppdater UI med en gang
    updateUI();
    
    console.log("Spill initialisert. Stats:", playerStats);

    // 4. Start loopen
    animate();
}

// === SPILL-MOTOREN (Game Loop) ===
function animate() {
    if (!gameActive) return;

    // Kaller seg selv på nytt (60 ganger i sekundet)
    animationId = requestAnimationFrame(animate);
    
    // Tømmer hele lerretet før vi tegner på nytt
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tegn spillbrettet (Bakgrunn og vei)
    drawBoard();

    // Logikk som kjører over tid (f.eks. alder)
    frameCount++;
    if (frameCount % 600 === 0) { // Hvert 10. sekund (ca) øker alderen
        playerStats.age += 1;
        console.log("Alder økte til:", playerStats.age);
        updateUI();
    }
}

// === TEGNE-FUNKSJONER ===

function drawBoard() {
    // 1. Tegn veien (Blodåren)
    ctx.beginPath();
    ctx.lineWidth = 60; // Bredden på veien
    ctx.strokeStyle = "#5a1a1a"; // Mørkere rød for selve "grøfta"/åren
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Flytt til startpunktet
    ctx.moveTo(waypoints[0].x, waypoints[0].y);

    // Tegn linjer til hvert punkt i listen
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    
    ctx.stroke(); // Tegn selve streken

    // 2. Tegn en "guide-linje" i midten (hjelp for oss utviklere for å se banen tydelig)
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
}

// === HJELPEFUNKSJONER ===
function updateUI() {
    uiAge.innerText = playerStats.age;
    uiHp.innerText = playerStats.hp;
    uiAtp.innerText = playerStats.atp;
    uiWave.innerText = playerStats.wave;
}

// Log at filen er lastet
console.log("game.js lastet (Versjon #4). Klar til start.");
/* Version: #4 */
