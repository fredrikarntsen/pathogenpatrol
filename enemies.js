/* Version: #5 */
class Enemy {
    constructor(waypoints, type = 'virus') {
        // Lagre veien fienden skal gå
        this.waypoints = waypoints;
        this.waypointIndex = 0; // Hvilket punkt i veien vi er på vei mot nå

        // Startposisjon (Alltid første punkt i veien)
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        
        // Egenskaper basert på type
        this.type = type;
        this.radius = 15; // Størrelse
        this.speed = 0;
        this.health = 0;
        this.maxHealth = 0;
        this.moneyValue = 0; // Hvor mye energi vi får når den dør

        this.initTypeProperties();
        
        console.log(`Ny fiende skapt: ${this.type} ved startpunkt (${this.x}, ${this.y})`);
    }

    // Sett stats basert på om det er virus eller bakterie
    initTypeProperties() {
        if (this.type === 'virus') {
            this.speed = 2.0;       // Rask
            this.health = 20;       // Svak
            this.moneyValue = 5;    // Gir litt penger
            this.color = '#8e44ad'; // Lilla (Virus-aktig)
            this.radius = 12;
        } else if (this.type === 'bacteria') {
            this.speed = 1.0;       // Treg
            this.health = 50;       // Sterk
            this.moneyValue = 10;
            this.color = '#27ae60'; // Grønn (Bakterie-aktig)
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

        // Tegn helsebar over hodet
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const hpPercent = this.health / this.maxHealth;
        const barWidth = 30;
        const barHeight = 4;
        
        // Bakgrunn (rød)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
        
        // Helse (grønn)
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
    }

    update() {
        // Finn målet vi skal gå mot
        const target = this.waypoints[this.waypointIndex + 1];

        // Hvis vi ikke har flere mål, er vi fremme ved slutten (returner true for å signalisere dette)
        if (!target) {
            return 'finished';
        }

        // Beregn avstand og retning til neste punkt
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Hvis vi er veldig nærme punktet, bytt til neste punkt
        if (distance < 5) {
            this.waypointIndex++;
            // Sjekk om vi er ferdige etter byttet
            if (this.waypointIndex >= this.waypoints.length - 1) {
                return 'finished';
            }
        }

        // Flytt fienden mot målet
        // Vi bruker normalisering av vektoren (dx/distance) ganget med fart
        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;

        this.x += moveX;
        this.y += moveY;
        
        return 'active'; // Fienden er fortsatt i live og på banen
    }
}
/* Version: #5 */
