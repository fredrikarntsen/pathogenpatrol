/* Version: #22 */
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
        this.baseSpeed = 0; 
        this.speed = 0;     
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
        // FIX: Bruk Math.max(0, ...) for å unngå negativ bredde hvis helsen går under 0
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        
        const barWidth = 30;
        const barHeight = 4;
        
        // Tegn rød bakgrunn
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
        
        // Tegn grønn helse (kun hvis hpPercent > 0)
        if (hpPercent > 0) {
            ctx.fillStyle = '#32cd32';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
        }
    }

    update(towers) {
        // 1. Reset fart
        this.speed = this.baseSpeed;
        let isBlocked = false;

        // 2. Sjekk kollisjon med tårn
        if (towers) {
            for (const tower of towers) {
                const dx = this.x - tower.x;
                const dy = this.y - tower.y;
                const distance = Math.sqrt(dx*dx + dy*dy);

                let collisionDist = (tower.type === 'barrier') ? 30 : tower.range;
                
                if (distance < collisionDist) {
                    if (tower.type === 'barrier') {
                        isBlocked = true;
                        this.speed = 0;
                        tower.health -= 0.5; 
                    } 
                    else if (tower.type === 'trap') {
                        this.speed *= tower.slowFactor;
                    }
                }
            }
        }

        if (isBlocked) {
            return 'blocked';
        }

        // --- NORMAL BEVEGELSE ---
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
/* Version: #22 */
