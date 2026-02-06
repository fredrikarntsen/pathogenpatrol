/* Version: #16 */
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
        this.type = 'turret'; 
    }

    draw(ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x - 16, this.y - 16, this.width, this.height);
    }

    update(enemies) {
        if (this.fireRate > 0) {
            this.fireRate--;
            return null; // Ingen handling mens vi lader
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
            // VIKTIG: Returner resultatet av angrepet (f.eks. et prosjektil)
            return this.attack(this.target);
        }
        return null;
    }

    attack(enemy) {
        console.log("Generisk tårn angriper");
        return null;
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
        this.type = 'turret'; 
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#bdc3c7'; 
        ctx.fill();

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
        // Direkte skade (spising), ingen prosjektiler
        enemy.health -= this.damage;
        this.fireRate = this.maxCooldown;
        return null;
    }
}

// === HUD (Barriere / Mur) ===
class Skin extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Hud";
        this.maxHealth = 200; 
        this.health = 200;
        this.type = 'barrier'; 
        this.width = 40; 
        this.height = 40;
    }

    update(enemies) {
        // Passiv
        return null;
    }

    draw(ctx) {
        ctx.fillStyle = '#e57373'; 
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x, this.y + 20);
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x + 20, this.y);
        ctx.stroke();

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
        this.type = 'trap'; 
        this.range = 50;    
        this.slowFactor = 0.5; 
    }

    update(enemies) {
        return null;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)'; 
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// === B-CELLE (Skytter - Antistoffer) ===
class BCell extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "B-Celle";
        this.range = 200;      // Lang rekkevidde
        this.damage = 10;     
        this.maxCooldown = 30; // Skyter 2 ganger i sekundet
        this.color = '#3498db'; // Blå
        this.type = 'turret';
    }

    draw(ctx) {
        // Cellen
        ctx.beginPath();
        ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Y-symbol på toppen (Antistoff fabrikk)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 5);
        ctx.lineTo(this.x, this.y - 5);
        ctx.lineTo(this.x - 5, this.y - 10);
        ctx.moveTo(this.x, this.y - 5);
        ctx.lineTo(this.x + 5, this.y - 10);
        ctx.stroke();
    }

    attack(enemy) {
        this.fireRate = this.maxCooldown;
        // Returner et nytt prosjektil
        return new Projectile(this.x, this.y, enemy, 'antibody');
    }
}

// === T-DREPECELLE (Skytter - Gift) ===
class TKiller extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "T-Drep";
        this.range = 140;      // Middels rekkevidde
        this.damage = 40;      // Høy skade
        this.maxCooldown = 50; // Tregere
        this.color = '#e74c3c'; // Rød
        this.type = 'turret';
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Sikte/Kors på toppen (Killer)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y);
        ctx.lineTo(this.x + 8, this.y);
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x, this.y + 8);
        ctx.stroke();
    }

    attack(enemy) {
        this.fireRate = this.maxCooldown;
        // Returner gift-prosjektil
        return new Projectile(this.x, this.y, enemy, 'toxin');
    }
}

// === T-HJELPER (Placeholder - Support) ===
class THelper extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "T-Hjelp";
        this.range = 100;      // Buff radius
        this.color = '#9b59b6'; // Lilla
        this.type = 'turret';
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Hjelpe-symbol (+)
        ctx.fillStyle = 'white';
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", this.x, this.y + 2);
    }

    update(enemies) {
        // Denne gjør ingenting aktivt mot fiender foreløpig
        return null; 
    }
}

console.log("towers.js lastet (Versjon #16). B-celler og T-drep lagt til.");
/* Version: #16 */
