/* Version: #8 */
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.range = 100;
        this.damage = 10;
        this.fireRate = 0; // Teller ned til 0
        this.cooldownSpeed = 1; // Hvor fort den lader
        this.target = null;
    }

    draw(ctx) {
        // Generisk tegning (hvis vi glemmer å overstyre i sub-klasser)
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x - 16, this.y - 16, this.width, this.height);
    }

    update(enemies) {
        // Hvis tårnet er på "cooldown" (lader opp/fordøyer), tell ned
        if (this.fireRate > 0) {
            this.fireRate--;
            return;
        }

        // Finn nærmeste fiende
        this.target = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            // Pytagoras for å finne avstand
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Sjekk om fienden er innenfor rekkevidde og nærmere enn forrige
            if (distance < this.range && distance < minDistance) {
                this.target = enemy;
                minDistance = distance;
            }
        }

        // Hvis vi fant et mål, angrip!
        if (this.target) {
            this.attack(this.target);
        }
    }

    attack(enemy) {
        // Denne funksjonen overskrives av de spesifikke tårnene
        console.log("Generisk tårn angriper");
    }
}

// === MAKROFAG (Nærkamp / Spiser) ===
class Macrophage extends Tower {
    constructor(x, y) {
        super(x, y);
        this.name = "Makrofag";
        this.range = 70;      // Kort rekkevidde (må være nær)
        this.damage = 25;     // Høy skade (et jafs)
        this.maxCooldown = 60; // 1 sekund (60 frames) fordøyelsestid
        this.color = '#ecf0f1'; // Hvit/Lys grå (Hvit blodcelle)
    }

    draw(ctx) {
        // Tegn rekkevidde (kun hvis musen er over - kan legges til senere. Nå tegner vi svakt)
        /*
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
        */

        // Selve cellen (amorf form / sirkel)
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Kjerne (Nucleus)
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#bdc3c7'; // Mørkere grå
        ctx.fill();

        // Vis indikator hvis den fordøyer (Cooldown)
        if (this.fireRate > 0) {
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Tegn en bue som viser hvor mye tid som er igjen
            const pct = this.fireRate / this.maxCooldown;
            ctx.arc(this.x, this.y, 22, -Math.PI/2, (Math.PI * 2 * pct) - Math.PI/2, true);
            ctx.stroke();
        }
    }

    attack(enemy) {
        // "Spis" litt av fienden (gi skade)
        enemy.health -= this.damage;
        
        // Sett cooldown (fordøyelse)
        this.fireRate = this.maxCooldown;

        // Visuell effekt? (Kan legges til senere, f.eks. at den blir større et øyeblikk)
    }
}

console.log("towers.js lastet (Versjon #8). Makrofag klar.");
/* Version: #8 */
