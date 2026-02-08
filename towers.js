/* Version: #40 */
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
        this.isBuffed = false; 
    }

    draw(ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x - 16, this.y - 16, this.width, this.height);
    }

    // NYTT PARAMETER: attackSpeedFactor
    update(enemies, allTowers, age, isSick, attackSpeedFactor = 1.0) {
        
        let agingFactor = 1.0;
        if (age >= 80) agingFactor = 0.5; 
        else if (age >= 60) agingFactor = 0.7; 

        let buffFactor = this.isBuffed ? 2.0 : 1.0; 
        let sicknessFactor = isSick ? 0.8 : 1.0;

        // Inkluder attackSpeedFactor fra innstillinger
        let recoverySpeed = this.cooldownSpeed * agingFactor * buffFactor * sicknessFactor * attackSpeedFactor;

        if (this.fireRate > 0) {
            this.fireRate -= recoverySpeed;
            if (this.fireRate <= 0) this.fireRate = 0;
            else {
                this.isBuffed = false;
                return null; 
            }
        }

        this.isBuffed = false; 

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
            return this.attack(this.target);
        }
        return null;
    }

    attack(enemy) {
        console.log("Generisk tårn angriper");
        return null;
    }

    drawBuffGlow(ctx) {
        if (this.isBuffed) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700'; 
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// === MAKROFAG ===
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
        this.drawBuffGlow(ctx); 

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
        enemy.health -= this.damage;
        this.fireRate = this.maxCooldown;
        return null;
    }
}

// === HUD ===
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
    update(enemies, allTowers, age, isSick) { this.isBuffed = false; return null; }
    draw(ctx) {
        ctx.fillStyle = '#e57373'; 
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20); ctx.lineTo(this.x, this.y + 20);
        ctx.moveTo(this.x - 20, this.y); ctx.lineTo(this.x + 20, this.y);
        ctx.stroke();
        const hpPct = Math.max(0, this.health / this.maxHealth); 
        ctx.fillStyle = 'red'; ctx.fillRect(this.x - 20, this.y - 30, 40, 5);
        ctx.fillStyle = '#32cd32'; ctx.fillRect(this.x - 20, this.y - 30, 40 * hpPct, 5);
    }
}

// === SLIM ===
class Mucus extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Slim";
        this.type = 'trap'; 
        this.range = 50;    
        this.slowFactor = 0.5; 
    }
    update(enemies, allTowers, age, isSick) { this.isBuffed = false; return null; }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)'; ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath(); ctx.arc(this.x - 10, this.y - 10, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 15, this.y + 5, 3, 0, Math.PI * 2); ctx.fill();
    }
}

// === B-CELLE ===
class BCell extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "B-Celle";
        this.range = 200;      
        this.damage = 10;     
        this.maxCooldown = 30; 
        this.color = '#3498db'; 
        this.type = 'turret';
    }
    draw(ctx) {
        this.drawBuffGlow(ctx); 
        ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(this.x, this.y + 5); ctx.lineTo(this.x, this.y - 5);
        ctx.lineTo(this.x - 5, this.y - 10); ctx.moveTo(this.x, this.y - 5); ctx.lineTo(this.x + 5, this.y - 10); ctx.stroke();
    }
    attack(enemy) {
        this.fireRate = this.maxCooldown;
        return new Projectile(this.x, this.y, enemy, 'antibody');
    }
}

// === T-DREPER ===
class TKiller extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "T-Drep";
        this.range = 140;      
        this.damage = 40;      
        this.maxCooldown = 50; 
        this.color = '#e74c3c'; 
        this.type = 'turret';
    }
    draw(ctx) {
        this.drawBuffGlow(ctx);
        ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.x - 8, this.y); ctx.lineTo(this.x + 8, this.y);
        ctx.moveTo(this.x, this.y - 8); ctx.lineTo(this.x, this.y + 8); ctx.stroke();
    }
    attack(enemy) {
        this.fireRate = this.maxCooldown;
        return new Projectile(this.x, this.y, enemy, 'toxin');
    }
}

// === T-HJELPER (REVIDERT) ===
class THelper extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "T-Hjelp";
        this.range = 150;      // Økt rekkevidde for søk
        this.color = '#9b59b6'; 
        this.type = 'turret';
        this.activeConnections = []; // Lagrer posisjonene til de vi buffer for tegning
    }

    draw(ctx) {
        // Tegn rekkevidde veldig svakt
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.1)';
        ctx.stroke();

        // TEGN KOBLINGER (Stråler)
        if (this.activeConnections.length > 0) {
            ctx.strokeStyle = '#ffd700'; // Gull
            ctx.lineWidth = 2;
            for (const pos of this.activeConnections) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        }

        // Cellen
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", this.x, this.y + 2);
    }

    update(enemies, allTowers, age, isSick, attackSpeedFactor) {
        // Nullstill koblinger for denne framen
        this.activeConnections = [];
        
        if (allTowers) {
            // Finn potensielle kandidater
            let candidates = [];
            
            for (const otherTower of allTowers) {
                // Ikke buffe seg selv, murer eller feller
                if (otherTower === this || otherTower.type === 'barrier' || otherTower.type === 'trap') continue;

                const dx = otherTower.x - this.x;
                const dy = otherTower.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < this.range) {
                    candidates.push({ tower: otherTower, dist: dist });
                }
            }

            // Sorter etter avstand (nærmest først)
            candidates.sort((a, b) => a.dist - b.dist);

            // Velg maks 3
            const limit = Math.min(candidates.length, 3);
            for (let i = 0; i < limit; i++) {
                const target = candidates[i].tower;
                target.isBuffed = true; // Aktiver buff
                this.activeConnections.push({ x: target.x, y: target.y }); // Lagre for tegning
            }
        }
        return null; 
    }
}

console.log("towers.js lastet (Versjon #40). T-Hjelper nerf og visuell oppdatering.");
/* Version: #40 */
