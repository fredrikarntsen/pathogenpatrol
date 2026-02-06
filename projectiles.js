/* Version: #14 */
class Projectile {
    constructor(x, y, target, type) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.type = type; // 'antibody' (B-celle) eller 'toxin' (T-dreper)
        this.markedForDeletion = false;

        this.initTypeProperties();
    }

    initTypeProperties() {
        if (this.type === 'antibody') {
            this.speed = 6;
            this.damage = 10;
            this.color = '#ffff00'; // Gul (klassisk farge for antistoff-illustrasjoner)
        } else if (this.type === 'toxin') {
            this.speed = 4;
            this.damage = 40; // Høy skade!
            this.color = '#e74c3c'; // Rød gift
        }
    }

    update() {
        // Hvis fienden er død før kula treffer, fjern kula
        if (!this.target || this.target.health <= 0) {
            this.markedForDeletion = true;
            return;
        }

        // Regn ut retning mot målet
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Hvis vi treffer
        if (distance < this.target.radius + 5) {
            this.target.health -= this.damage;
            this.markedForDeletion = true;
            return;
        }

        // Flytt kula mot målet
        const velocityX = (dx / distance) * this.speed;
        const velocityY = (dy / distance) * this.speed;

        this.x += velocityX;
        this.y += velocityY;
    }

    draw(ctx) {
        if (this.type === 'antibody') {
            // Tegn en Y-form
            ctx.save();
            ctx.translate(this.x, this.y);
            // Roter mot målet for kul effekt (valgfritt, holder det enkelt nå)
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Stammen
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 5);
            // Armene
            ctx.moveTo(0, 0);
            ctx.lineTo(-3, -4);
            ctx.moveTo(0, 0);
            ctx.lineTo(3, -4);
            ctx.stroke();
            ctx.restore();

        } else {
            // Tegn en gift-kule
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
}
/* Version: #14 */
