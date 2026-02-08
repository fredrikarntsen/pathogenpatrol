/* Version: #39 */
class Enemy {
    constructor(waypoints, type) {
        this.waypoints = waypoints;
        this.waypointIndex = 0; 
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        
        this.type = type;
        this.radius = 15;
        this.baseSpeed = 0; 
        this.speed = 0;     
        this.health = 0;
        this.maxHealth = 0;
        this.moneyValue = 0; 

        this.initTypeProperties();
        
        this.speed = this.baseSpeed;
    }

    initTypeProperties() {
        if (this.type === 'virus_red') {
            this.baseSpeed = 2.0;   
            this.health = 20;       
            this.moneyValue = 2;    
            this.color = '#ff0000'; 
            this.radius = 12;
            this.shape = 'circle';
        } 
        else if (this.type === 'virus_blue') {
            this.baseSpeed = 2.5; 
            this.health = 30;
            this.moneyValue = 3;    
            this.color = '#0000ff'; 
            this.radius = 12;
            this.shape = 'circle';
        }
        else if (this.type === 'virus_yellow') {
            this.baseSpeed = 3.0; 
            this.health = 15;     
            this.moneyValue = 1;    
            this.color = '#ffff00'; 
            this.radius = 10;
            this.shape = 'circle';
        }
        else if (this.type === 'bacteria_green') {
            this.baseSpeed = 1.0;   
            this.health = 60;       
            this.moneyValue = 8;    
            this.color = '#00ff00'; 
            this.radius = 18;
            this.shape = 'circle'; 
        }
        else if (this.type === 'bacteria_orange') {
            this.baseSpeed = 1.2;
            this.health = 80;
            this.moneyValue = 10;   
            this.color = '#ffa500'; 
            this.radius = 18;
            this.shape = 'oval';
        }
        else if (this.type === 'bacteria_purple') {
            this.baseSpeed = 0.8; 
            this.health = 120;    
            this.moneyValue = 15;   
            this.color = '#800080'; 
            this.radius = 20;
            this.shape = 'triangle';
        }

        this.maxHealth = this.health;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } 
        else if (this.shape === 'oval') {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        else if (this.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y + this.radius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        const barWidth = 30;
        const barHeight = 4;
        const yOffset = (this.shape === 'triangle') ? this.radius + 5 : 10;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - yOffset, barWidth, barHeight);
        
        if (hpPercent > 0) {
            ctx.fillStyle = '#32cd32';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - yOffset, barWidth * hpPercent, barHeight);
        }
    }

    // NYTT: speedFactor argument
    update(towers, speedFactor = 1.0) {
        // Juster baseSpeed med faktor
        this.speed = this.baseSpeed * speedFactor;
        
        let isBlocked = false;

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
/* Version: #39 */
