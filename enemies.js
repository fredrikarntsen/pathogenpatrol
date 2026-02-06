/* Version: #12 */
class Enemy {
    constructor(waypoints, type = 'virus') {
        // Lagre veien fienden skal gå
        this.waypoints = waypoints;
        this.waypointIndex = 0; 

        // Startposisjon
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        
        // Egenskaper
        this.type = type;
        this.radius = 15;
        this.baseSpeed = 0; // Ny variabel: Husker originalfarten
        this.speed = 0;     // Nåværende fart (kan endres av slim)
        this.health = 0;
        this.maxHealth = 0;
        this.moneyValue = 0; 

        this.initTypeProperties();
        
        // Sett startfart lik basefart
        this.speed = this.baseSpeed;
    }

    initTypeProperties() {
        if (this.type === 'virus') {
            this.baseSpeed = 2.0;   
            this.health = 20;       
            this.moneyValue = 5;    
            this.color = '#8e44ad'; 
            this.radius = 12;
        } else if (this.type === 'bacteria') {
            this.baseSpeed = 1.0;   
            this.health = 50;       
            this.moneyValue = 10;
            this.color = '#27ae60'; 
            this.radius = 18;
        }
        this.maxHealth = this.health;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const hpPercent = this.health / this.maxHealth;
        const barWidth = 30;
        const barHeight = 4;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
        
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
    }

    // VIKTIG: update tar nå imot listen over tårn for å sjekke kollisjon
    update(towers) {
        // 1. Reset fart til normal før vi sjekker modifikatorer (slim)
        this.speed = this.baseSpeed;
        let isBlocked = false;

        // 2. Sjekk kollisjon med tårn (Hud og Slim)
        if (towers) {
            for (const tower of towers) {
                // Enkel sirkel-kollisjon sjekk
                const dx = this.x - tower.x;
                const dy = this.y - tower.y;
                const distance = Math.sqrt(dx*dx + dy*dy);

                // Sjekk om vi treffer tårnet (med litt margin)
                // Bruker tower.width for firkanter (Hud) og tower.range for sirkler (Slim)
                let collisionDist = (tower.type === 'barrier') ? 30 : tower.range;
                
                if (distance < collisionDist) {
                    
                    if (tower.type === 'barrier') {
                        // Vi har truffet en vegg (Hud)!
                        isBlocked = true;
                        this.speed = 0;
                        
                        // Skad muren litt hver frame
                        tower.health -= 0.5; 
                    } 
                    else if (tower.type === 'trap') {
                        // Vi er i slim!
                        this.speed *= tower.slowFactor;
                    }
                }
            }
        }

        // Hvis vi er blokkert av en vegg, ikke beveg oss mot neste waypoint
        if (isBlocked) {
            return 'blocked';
        }

        // --- NORMAL BEVEGELSE (som før) ---

        const target = this.waypoints[this.waypointIndex + 1];

        if (!target) {
            return 'finished';
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            this.waypointIndex++;
            if (this.waypointIndex >= this.waypoints.length - 1) {
                return 'finished';
            }
        }

        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;

        this.x += moveX;
        this.y += moveY;
        
        return 'active';
    }
}
/* Version: #12 */
