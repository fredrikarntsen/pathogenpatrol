/* Version: #19 */
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
        this.isBuffed = false; // Ny egenskap: Er den buffet av T-Hjelper?
    }

    draw(ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x - 16, this.y - 16, this.width, this.height);
    }

    // VIKTIG: Vi tar nå imot "allTowers" for å kunne samhandle
    update(enemies, allTowers) {
        // Beregn hastighet på lading
        // Hvis vi er buffet, lader vi dobbelt så fort (minsker cooldown med 2 per frame i stedet for 1)
        let cooldownReduction = this.isBuffed ? 2 : 1;
        
        if (this.fireRate > 0) {
            this.fireRate -= cooldownReduction;
            if (this.fireRate < 0) this.fireRate = 0;
            
            // Hvis vi fortsatt lader, gjør ingenting mer, MEN behold isBuffed til neste sjekk
            // (Vi resetter isBuffed helt til slutt i funksjonen eller lar den styres av THelper)
        }

        // Reset isBuffed for NESTE frame (slik at buffen forsvinner hvis T-Hjelper fjernes)
        // Men vi gjør det helt til slutt, eller vi lar T-Hjelper sette den på nytt hver frame.
        // Strategi: Vi setter this.isBuffed = false HER, så må T-Hjelper sette den til true igjen hvis den er i nærheten.
        this.isBuffed = false; 

        // Sjekk om vi er klare til å skyte
        if (this.fireRate > 0) return null;

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

    // Hjelpefunksjon for å tegne buff-effekt
    drawBuffGlow(ctx) {
        if (this.isBuffed) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700'; // Gull
            ctx.lineWidth = 2;
            ctx.stroke();
        }
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
        this.drawBuffGlow(ctx); // Tegn gullring hvis buffet

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

    update(enemies, allTowers) {
        // Hud kan også buffes (f.eks. regenerere helse?), men vi holder det enkelt: Hud buffes ikke
        this.isBuffed = false; 
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

    update(enemies, allTowers) {
        this.isBuffed = false;
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
        this.range = 200;      
        this.damage = 10;     
        this.maxCooldown = 30; 
        this.color = '#3498db'; 
        this.type = 'turret';
    }

    draw(ctx) {
        this.drawBuffGlow(ctx); // Gyllen ring hvis buff

        ctx.beginPath();
        ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
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
        return new Projectile(this.x, this.y, enemy, 'antibody');
    }
}

// === T-DREPECELLE (Skytter - Gift) ===
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

        ctx.beginPath();
        ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
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
        return new Projectile(this.x, this.y, enemy, 'toxin');
    }
}

// === T-HJELPER (Support / Buffer) ===
class THelper extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "T-Hjelp";
        this.range = 100;      // Buff radius
        this.color = '#9b59b6'; // Lilla
        this.type = 'turret';
        this.pulseSize = 0;     // For animasjon
    }

    draw(ctx) {
        // Tegn rekkevidde svakt
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.2)';
        ctx.stroke();

        // Puls-animasjon
        this.pulseSize += 0.5;
        if (this.pulseSize > this.range) this.pulseSize = 0;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.1)'; // Svak puls
        ctx.stroke();

        // Selve cellen
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

    update(enemies, allTowers) {
        // VIKTIG: Finn naboer og buff dem
        if (allTowers) {
            for (const otherTower of allTowers) {
                // Ikke buff seg selv, og ikke buff murer/slim (valgfritt)
                if (otherTower === this || otherTower.type === 'barrier' || otherTower.type === 'trap') continue;

                const dx = otherTower.x - this.x;
                const dy = otherTower.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < this.range) {
                    otherTower.isBuffed = true; // Aktiver buffen på naboen
                }
            }
        }
        return null; 
    }
}

console.log("towers.js lastet (Versjon #19). T-Hjelper logikk aktivert.");
/* Version: #19 */
