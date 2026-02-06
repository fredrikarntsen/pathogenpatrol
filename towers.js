/* Version: #11 */
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.range = 100;
        this.damage = 10;
        this.fireRate = 0; 
        this.cooldownSpeed = 1; 
        this.target = null;
        this.type = 'turret'; // Standard type (står ved siden av veien)
    }

    draw(ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x - 16, this.y - 16, this.width, this.height);
    }

    update(enemies) {
        if (this.fireRate > 0) {
            this.fireRate--;
            return;
        }

        this.target = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.range && distance < minDistance) {
                this.target = enemy;
                minDistance = distance;
            }
        }

        if (this.target) {
            this.attack(this.target);
        }
    }

    attack(enemy) {
        console.log("Generisk tårn angriper");
    }
}

// === MAKROFAG (Nærkamp / Spiser) ===
class Macrophage extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Makrofag";
        this.range = 70;      
        this.damage = 25;     
        this.maxCooldown = 60; 
        this.color = '#ecf0f1'; 
        this.type = 'turret'; // Plasseres utenfor veien
    }

    draw(ctx) {
        // Cellen
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Kjerne
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#bdc3c7'; 
        ctx.fill();

        // Cooldown indikator
        if (this.fireRate > 0) {
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const pct = this.fireRate / this.maxCooldown;
            ctx.arc(this.x, this.y, 22, -Math.PI/2, (Math.PI * 2 * pct) - Math.PI/2, true);
            ctx.stroke();
        }
    }

    attack(enemy) {
        enemy.health -= this.damage;
        this.fireRate = this.maxCooldown;
    }
}

// === HUD (Barriere / Mur) ===
class Skin extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Hud";
        this.maxHealth = 200; // Tåler mye
        this.health = 200;
        this.type = 'barrier'; // Plasseres PÅ veien
        this.width = 40; // Bredere for å dekke veien
        this.height = 40;
    }

    // Hud gjør ikke noe i update (den er passiv), så vi overskriver update til å være tom
    update(enemies) {
        // Hud gjør ingenting aktivt, den bare står der og tar skade
        // (Logikken for at fienden stopper håndteres i enemies.js)
    }

    draw(ctx) {
        // Tegn en "mur" av celler
        ctx.fillStyle = '#e57373'; // Lys rød/hudfarge
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        
        // Tegn celle-mønster (rutenett)
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Loddrett strek
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x, this.y + 20);
        // Vannrett strek
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x + 20, this.y);
        ctx.stroke();

        // Helsebar for muren
        const hpPct = this.health / this.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 20, this.y - 30, 40, 5);
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(this.x - 20, this.y - 30, 40 * hpPct, 5);
    }
}

// === SLIMHINNER (Felle / Slow) ===
class Mucus extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Slim";
        this.type = 'trap'; // Plasseres PÅ veien
        this.range = 50;    // Radius for effekten
        this.slowFactor = 0.5; // Halverer farten
    }

    update(enemies) {
        // Slim trenger ikke oppdateres på samme måte,
        // men vi kan animere det eller la det tørke ut over tid senere.
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)'; // Gjennomsiktig grønn
        ctx.fill();
        
        // Små bobler for å vise at det er slim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

console.log("towers.js lastet (Versjon #11). Hud og Slim lagt til.");
/* Version: #11 */
