const ENGINE_WIDTH = () => Engine.instance.designWidth ?? Engine.instance.options?.width ?? 1920;
const ENGINE_HEIGHT = () => Engine.instance.designHeight ?? Engine.instance.options?.height ?? 1080;
const VIEW_WIDTH = () => Engine.instance.viewWidth ?? ENGINE_WIDTH();
const VIEW_HEIGHT = () => Engine.instance.viewHeight ?? ENGINE_HEIGHT();
const VIEW_LEFT = () => (Engine.instance.camera?.x ?? 0) - (Engine.instance.worldOffset?.x ?? 0);
const VIEW_TOP = () => (Engine.instance.camera?.y ?? 0) - (Engine.instance.worldOffset?.y ?? 0);
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${src}`));
        image.src = src;
    });
}

function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function drawGlow(ctx, x, y, radius, color, alpha = 0.55) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
async function createProceduralAssets() {
    const assetMap = new Map();

    function makeImage(name, width, height, draw) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        draw(ctx, width, height);
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve([name, image]);
            image.onerror = () => reject(new Error(`
Не удалось создать ассет: $ {
    name
}
`));
            image.src = canvas.toDataURL("image/png");
        });
    }
    const assets = await Promise.all([makeImage("ship_player", 128, 128, (ctx, w, h) => {
        ctx.translate(w / 2, h / 2);
        ctx.fillStyle = "#0c1830";
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(34, 34);
        ctx.lineTo(14, 18);
        ctx.lineTo(0, 30);
        ctx.lineTo(-14, 18);
        ctx.lineTo(-34, 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#58ebff";
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(24, 24);
        ctx.lineTo(8, 18);
        ctx.lineTo(0, 28);
        ctx.lineTo(-8, 18);
        ctx.lineTo(-24, 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#d6fbff";
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(10, 8);
        ctx.lineTo(0, 18);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#7cf6ff";
        ctx.fillRect(-28, 18, 8, 18);
        ctx.fillRect(20, 18, 8, 18);
    }), makeImage("enemy_drone", 112, 112, (ctx, w, h) => {
        ctx.translate(w / 2, h / 2);
        ctx.fillStyle = "#35111f";
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(28, 0);
        ctx.lineTo(0, 28);
        ctx.lineTo(-28, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff5c89";
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-20, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe4ec";
        ctx.fillRect(-12, -4, 24, 8);
    }), makeImage("enemy_scout", 96, 96, (ctx, w, h) => {
        ctx.translate(w / 2, h / 2);
        ctx.fillStyle = "#44220a";
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(24, 0);
        ctx.lineTo(0, 24);
        ctx.lineTo(-24, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffa24f";
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 16);
        ctx.lineTo(-16, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff0d8";
        ctx.fillRect(-8, -3, 16, 6);
    }), makeImage("enemy_boss", 260, 180, (ctx, w, h) => {
        ctx.translate(w / 2, h / 2);
        ctx.fillStyle = "#23123e";
        ctx.beginPath();
        ctx.moveTo(-90, 10);
        ctx.lineTo(-54, -42);
        ctx.lineTo(0, -68);
        ctx.lineTo(54, -42);
        ctx.lineTo(90, 10);
        ctx.lineTo(62, 46);
        ctx.lineTo(-62, 46);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#9661ff";
        ctx.beginPath();
        ctx.moveTo(-72, 8);
        ctx.lineTo(-40, -28);
        ctx.lineTo(0, -48);
        ctx.lineTo(40, -28);
        ctx.lineTo(72, 8);
        ctx.lineTo(48, 32);
        ctx.lineTo(-48, 32);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f3eaff";
        ctx.fillRect(-54, -2, 108, 12);
    }), makeImage("bullet_player", 16, 48, (ctx, w, h) => {
        ctx.fillStyle = "#d8fbff";
        ctx.fillRect(4, 0, 8, 18);
        ctx.fillStyle = "#62efff";
        ctx.fillRect(5, 0, 6, 48);
    }), makeImage("bullet_enemy", 16, 40, (ctx, w, h) => {
        ctx.fillStyle = "#ffe3ea";
        ctx.fillRect(4, 22, 8, 12);
        ctx.fillStyle = "#ff6d95";
        ctx.fillRect(5, 0, 6, 40);
    }), makeImage("bullet_boss", 20, 56, (ctx, w, h) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(5, 18, 10, 14);
        ctx.fillStyle = "#cf96ff";
        ctx.fillRect(6, 0, 8, 56);
    }), makeImage("power_rapid", 64, 64, (ctx, w, h) => {
        ctx.fillStyle = "#19243d";
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd35b";
        ctx.beginPath();
        ctx.moveTo(24, 36);
        ctx.lineTo(31, 18);
        ctx.lineTo(30, 30);
        ctx.lineTo(40, 28);
        ctx.lineTo(32, 46);
        ctx.lineTo(33, 35);
        ctx.closePath();
        ctx.fill();
    }), makeImage("power_shield", 64, 64, (ctx, w, h) => {
        ctx.fillStyle = "#19243d";
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#79edff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(32, 13);
        ctx.lineTo(46, 19);
        ctx.lineTo(42, 39);
        ctx.lineTo(32, 49);
        ctx.lineTo(22, 39);
        ctx.lineTo(18, 19);
        ctx.closePath();
        ctx.stroke();
    }), makeImage("power_heal", 64, 64, (ctx, w, h) => {
        ctx.fillStyle = "#19243d";
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9dffb4";
        ctx.fillRect(28, 18, 8, 28);
        ctx.fillRect(18, 28, 28, 8);
    }), ]);
    for (const [name, image] of assets) {
        assetMap.set(name, image);
    }
    return assetMap;
}

function getBounds(entity) {
    const x = entity.transform.position.x + (entity.hitboxOffsetX ?? 0);
    const y = entity.transform.position.y + (entity.hitboxOffsetY ?? 0);
    const width = entity.hitboxWidth ?? entity.sprite?.width ?? 0;
    const height = entity.hitboxHeight ?? entity.sprite?.height ?? 0;
    return {
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
    };
}

function intersects(a, b) {
    const aa = getBounds(a);
    const bb = getBounds(b);
    return aa.right >= bb.left && aa.left <= bb.right && aa.bottom >= bb.top && aa.top <= bb.bottom;
}
class Starfield extends GameObject {
    constructor() {
        super();
        this.stars = [];
        this.nebulae = [];
        for (let i = 0; i < 140; i += 1) {
            this.stars.push({
                x: rand(-600, ENGINE_WIDTH() + 600),
                y: rand(-1200, ENGINE_HEIGHT() + 300),
                radius: rand(1.2, 3.8),
                speed: rand(20, 180),
                alpha: rand(0.25, 0.95),
            });
        }
        for (let i = 0; i < 7; i += 1) {
            this.nebulae.push({
                x: rand(-300, ENGINE_WIDTH() + 300),
                y: rand(-200, ENGINE_HEIGHT()),
                radius: rand(120, 320),
                hue: rand(190, 290),
                alpha: rand(0.05, 0.12),
            });
        }
    }
    update(dt) {
        const width = ENGINE_WIDTH();
        const height = ENGINE_HEIGHT();
        for (const star of this.stars) {
            star.y += star.speed * dt;
            if (star.y > height + 120) {
                star.y = -rand(50, 400);
                star.x = rand(-600, width + 600);
            }
        }
    }
    render(ctx) {
        const left = VIEW_LEFT();
        const top = VIEW_TOP();
        const width = VIEW_WIDTH();
        const height = VIEW_HEIGHT();
        const sky = ctx.createLinearGradient(left, top, left, top + height);
        sky.addColorStop(0, "#071224");
        sky.addColorStop(0.52, "#050915");
        sky.addColorStop(1, "#02030a");
        ctx.fillStyle = sky;
        ctx.fillRect(left, top, width, height);
        for (const nebula of this.nebulae) {
            ctx.save();
            ctx.globalAlpha = nebula.alpha;
            ctx.fillStyle = `hsl(${nebula.hue} 95% 72%)`;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        for (const star of this.stars) {
            ctx.save();
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = "#eef7ff";
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
class ParticleBurst extends GameObject {
    constructor(x, y, color = "#ffe29a", amount = 14, life = 0.7, speed = [120, 420]) {
        super();
        this.transform.position.set(x, y);
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.particles = [];
        for (let i = 0; i < amount; i += 1) {
            const angle = rand(0, Math.PI * 2);
            const velocity = rand(speed[0], speed[1]);
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                radius: rand(2, 5),
            });
        }
    }
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this._dead = true;
            return;
        }
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
        }
    }
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
class Bullet extends GameObject {
    constructor(config = {}) {
        super();
        this.owner = config.owner ?? "player";
        this.damage = config.damage ?? 1;
        this.speedX = config.speedX ?? 0;
        this.speedY = config.speedY ?? -1200;
        this.spriteName = config.spriteName ?? (this.owner === "player" ? "bullet_player" : "bullet_enemy");
        this.width = config.width ?? (this.owner === "player" ? 18 : 16);
        this.height = config.height ?? (this.owner === "player" ? 44 : 32);
        this.hitboxWidth = this.width;
        this.hitboxHeight = this.height;
    }

    init() {
        this.sprite = new SpriteComponent({
            sprite: this.spriteName,
            width: this.width ?? 6,
            height: this.height ?? 10,
        });
        this.sprite.color = 'red';
        this.bindComponent(this.sprite);
        console.log(this.width);
        this.bindComponent(new ColliderComponent({
            width: this.width ?? 6,
            height: this.height ?? 10,
        }));
        super.init();
    }
    update(dt) {
        this.transform.translate(this.speedX * dt, this.speedY * dt);
        if (this.transform.position.y < -180 || this.transform.position.y > ENGINE_HEIGHT() + 180 || this.transform.position.x < -180 || this.transform.position.x > ENGINE_WIDTH() + 180) {
            this._dead = true;
        }
        super.update(dt);
    }
}
class PowerUp extends GameObject {
    constructor(kind, x, y) {
        super();
        this.kind = kind;
        this.width = 44;
        this.height = 44;
        this.hitboxWidth = 44;
        this.hitboxHeight = 44;
        this.speedY = 220;
        this.angle = rand(0, Math.PI * 2);
        this.transform.position.set(x, y);
    }
    init() {
        const spriteName = {
            rapid: "power_rapid",
            shield: "power_shield",
            heal: "power_heal",
        } [this.kind];
        this.sprite = new SpriteComponent({
            sprite: spriteName,
            width: this.width,
            height: this.height,
        });
        this.bindComponent(this.sprite);
        this.bindComponent(new ColliderComponent({
            width: this.width,
            height: this.height
        }));
        super.init();
    }
    update(dt) {
        this.angle += dt * 3;
        this.transform.position.y += this.speedY * dt;
        this.transform.position.x += Math.sin(this.angle) * 65 * dt;
        if (this.transform.position.y > ENGINE_HEIGHT() + 100) {
            this._dead = true;
        }
        super.update(dt);
    }
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = this.kind === "rapid" ? "#ffd25b" : this.kind === "shield" ? "#79ecff" : "#9dffaf";
        ctx.beginPath();
        ctx.arc(this.transform.position.x + this.width / 2, this.transform.position.y + this.height / 2, 34 + Math.sin(this.angle * 2) * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        super.render(ctx);
    }
}
class Enemy extends GameObject {
    constructor(config = {}) {
        super();
        this.variant = config.variant ?? "drone";
        this.spriteKey = this.variant === "scout" ? "enemy_scout" : "enemy_drone";
        this.width = this.variant === "scout" ? 66 : 78;
        this.height = this.variant === "scout" ? 66 : 78;
        this.hitboxWidth = this.width * 0.8;
        this.hitboxHeight = this.height * 0.75;
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        this.hitboxOffsetY = (this.height - this.hitboxHeight) / 2;
        this.hp = config.hp ?? (this.variant === "scout" ? 1 : 2);
        this.scoreValue = config.scoreValue ?? (this.variant === "scout" ? 120 : 180);
        this.baseX = config.x ?? 0;
        this.transform.position.set(config.x ?? 0, config.y ?? 0);
        this.time = rand(0, Math.PI * 2);
        this.moveAmplitude = config.moveAmplitude ?? rand(24, 96);
        this.speedY = config.speedY ?? (this.variant === "scout" ? rand(210, 270) : rand(140, 200));
        this.frequency = config.frequency ?? rand(1.4, 2.8);
        this.fireCooldown = rand(0.8, 1.8);
    }
    init() {
        this.sprite = new SpriteComponent({
            sprite: this.spriteKey,
            width: this.width ?? 100,
            height: this.height ?? 80,
        });
        this.bindComponent(this.sprite);
        this.bindComponent(new ColliderComponent({
            offsetX: this.hitboxOffsetX,
            offsetY: this.hitboxOffsetY,
        }));
        super.init();
    }
    update(dt) {
        if (this.parent.isFrozen) return;
        this.time += dt;
        this.transform.position.y += this.speedY * dt;
        this.transform.position.x = this.baseX + Math.sin(this.time * this.frequency) * this.moveAmplitude;
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && this.transform.position.y > 70) {
            this.fireCooldown = this.variant === "scout" ? rand(1.6, 2.4) : rand(1.0, 1.9);
            this.fire();
        }
        if (this.transform.position.y > ENGINE_HEIGHT() + 120) {
            this._dead = true;
        }
        super.update(dt);
    }
    fire() {
        const scene = this.parent;
        const target = scene.player;
        if (!target || target._dead) return;
        const fromX = this.transform.position.x + this.width / 2;
        const fromY = this.transform.position.y + this.height - 6;
        const targetX = target.transform.position.x + target.sprite.width / 2;
        const targetY = target.transform.position.y + target.sprite.height / 2;
        const dx = targetX - fromX;
        const dy = targetY - fromY;
        const length = Math.hypot(dx, dy) || 1;
        const speed = this.variant === "scout" ? 380 : 460;
        scene.spawnBullet(new Bullet({
            owner: "enemy",
            speedX: (dx / length) * speed,
            speedY: (dy / length) * speed,
            spriteName: "bullet_enemy",
            width: 14,
            height: 28,
            damage: 1,
        }), fromX - 7, fromY - 4);
    }
    takeDamage(damage = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.parent.onEnemyDestroyed(this);
            this._dead = true;
        }
    }
}
class Boss extends GameObject {
    constructor(wave = 5) {
        super();
        this.wave = wave;
        this.width = 280;
        this.height = 192;
        this.hitboxWidth = 220;
        this.hitboxHeight = 120;
        this.hitboxOffsetX = 30;
        this.hitboxOffsetY = 32;
        this.hp = 48 + wave * 7;
        this.maxHp = this.hp;
        this.entryDone = false;
        this.fireTimer = 0.8;
        this.sideTimer = 0;
        this.phase = rand(0, Math.PI * 2);
        this.transform.position.set(ENGINE_WIDTH() / 2 - this.width / 2, -220);
    }
    init() {
        this.sprite = new SpriteComponent({
            sprite: "enemy_boss",
            width: this.width,
            height: this.height,
        });
        this.bindComponent(this.sprite);
        this.bindComponent(new ColliderComponent({
            width: this.hitboxWidth,
            height: this.hitboxHeight,
            offsetX: this.hitboxOffsetX,
            offsetY: this.hitboxOffsetY,
        }));
        super.init();
    }
    update(dt) {
        if (this.parent.isFrozen) return;
        this.phase += dt;
        const targetY = 110;
        if (!this.entryDone) {
            this.transform.position.y = lerp(this.transform.position.y, targetY, dt * 1.6);
            if (Math.abs(this.transform.position.y - targetY) < 6) {
                this.entryDone = true;
            }
        } else {
            this.sideTimer += dt;
            this.transform.position.x = ENGINE_WIDTH() / 2 - this.width / 2 + Math.sin(this.sideTimer * 0.9) * 460;
            this.transform.position.y = targetY + Math.sin(this.phase * 2.1) * 18;
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                this.fireTimer = Math.max(0.38, 0.84 - this.parent.wave * 0.025);
                this.firePattern();
            }
        }
        super.update(dt);
    }
    firePattern() {
        const scene = this.parent;
        const centerX = this.transform.position.x + this.width / 2;
        const baseY = this.transform.position.y + this.height - 18;
        const angles = [-0.58, -0.32, -0.16, 0, 0.16, 0.32, 0.58];
        for (const angle of angles) {
            const speed = 540;
            scene.spawnBullet(new Bullet({
                owner: "enemy",
                speedX: Math.sin(angle) * speed,
                speedY: Math.cos(angle) * speed,
                spriteName: "bullet_boss",
                width: 18,
                height: 44,
                damage: 1,
            }), centerX - 9, baseY - 6);
        }
    }
    takeDamage(damage = 1) {
        this.hp -= damage;
        this.parent.flashBossBar = 0.15;
        if (this.hp <= 0) {
            this.parent.onBossDestroyed(this);
            this._dead = true;
        }
    }
    render(ctx) {
        super.render(ctx);
        const width = 480;
        const height = 16;
        const x = ENGINE_WIDTH() / 2 - width / 2;
        const y = 34;
        const fill = clamp(this.hp / this.maxHp, 0, 1);
        ctx.save();
        ctx.fillStyle = "rgba(10, 15, 31, 0.7)";
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = this.parent.flashBossBar > 0 ? "#f8e6ff" : "#bf77ff";
        ctx.fillRect(x, y, width * fill, height);
        ctx.strokeStyle = "rgba(237, 228, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "#f4ecff";
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Флагман Пустоты · ${this.hp}`, ENGINE_WIDTH() / 2, y - 8);
        ctx.restore();
    }
}
class Player extends GameObject {
    constructor() {
        super();
        this.width = 110;
        this.height = 110;
        this.hitboxWidth = 52;
        this.hitboxHeight = 56;
        this.hitboxOffsetX = 29;
        this.hitboxOffsetY = 26;
        this.speed = 720;
        this.boostMultiplier = 1.55;
        this.fireCooldownBase = 0.18;
        this.fireCooldown = 0;
        this.rapidTimer = 0;
        this.invulnerableTimer = 0;
        this.lives = 3;
        this.shield = 0;
        this.trailTimer = 0;
    }
    init() {
        this.sprite = new SpriteComponent({
            sprite: "ship_player",
            width: this.width,
            height: this.height,
        });
        this.bindComponent(this.sprite);
        this.bindComponent(new ColliderComponent({
            width: this.hitboxWidth,
            height: this.hitboxHeight,
            offsetX: this.hitboxOffsetX,
            offsetY: this.hitboxOffsetY,
        }));
        super.init();
    }
    start() {
        super.start();
        this.transform.position.set(ENGINE_WIDTH() / 2 - this.width / 2, ENGINE_HEIGHT() - this.height - 80);
    }
    update(dt) {
        if (this.parent.gameOver) return;
        let moveX = 0;
        let moveY = 0;
        const input = Engine.instance.input;
        if (input.isKeyDown("ArrowLeft") || input.isKeyDown("KeyA")) moveX -= 1;
        if (input.isKeyDown("ArrowRight") || input.isKeyDown("KeyD")) moveX += 1;
        if (input.isKeyDown("ArrowUp") || input.isKeyDown("KeyW")) moveY -= 1;
        if (input.isKeyDown("ArrowDown") || input.isKeyDown("KeyS")) moveY += 1;
        let moveLength = Math.hypot(moveX, moveY);
        if (moveLength > 0) {
            moveX /= moveLength;
            moveY /= moveLength;
        }
        const isBoosting = input.isKeyDown("ShiftLeft") || input.isKeyDown("ShiftRight");
        const speed = this.speed * (isBoosting ? this.boostMultiplier : 1);
        this.transform.position.x += moveX * speed * dt;
        this.transform.position.y += moveY * speed * dt;
        this.transform.position.x = clamp(this.transform.position.x, 20, ENGINE_WIDTH() - this.width - 20);
        this.transform.position.y = clamp(this.transform.position.y, 90, ENGINE_HEIGHT() - this.height - 24);
        this.fireCooldown -= dt;
        this.rapidTimer = Math.max(0, this.rapidTimer - dt);
        this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
        this.trailTimer -= dt;
        if (this.trailTimer <= 0) {
            this.trailTimer = isBoosting ? 0.025 : 0.05;
            this.parent.spawnEffect(new ParticleBurst(this.transform.position.x + this.width / 2, this.transform.position.y + this.height - 20, isBoosting ? "#6ef2ff" : "#98f8ff", isBoosting ? 5 : 3, 0.22, [40, 120]));
        }
        if (input.isKeyDown("Space") && this.fireCooldown <= 0) {
            this.fire();
            this.fireCooldown = this.rapidTimer > 0 ? 0.075 : this.fireCooldownBase;
        }
        super.update(dt);
    }
    fire() {
        const scene = this.parent;
        const baseX = this.transform.position.x + this.width / 2;
        const y = this.transform.position.y - 8;
        scene.spawnBullet(new Bullet({
            owner: "player",
            speedY: -1100,
            spriteName: "bullet_player",
            width: 14,
            height: 42,
            damage: 1,
        }), baseX - 31, y);
        scene.spawnBullet(new Bullet({
            owner: "player",
            speedY: -1100,
            spriteName: "bullet_player",
            width: 14,
            height: 42,
            damage: 1,
        }), baseX + 17, y);
        if (this.rapidTimer > 0) {
            scene.spawnBullet(new Bullet({
                owner: "player",
                speedX: -140,
                speedY: -980,
                spriteName: "bullet_player",
                width: 12,
                height: 36,
                damage: 1,
            }), baseX - 14, y + 8);
            scene.spawnBullet(new Bullet({
                owner: "player",
                speedX: 140,
                speedY: -980,
                spriteName: "bullet_player",
                width: 12,
                height: 36,
                damage: 1,
            }), baseX + 2, y + 8);
        }
    }
    takeDamage(amount = 1) {
        if (this.invulnerableTimer > 0 || this.parent.gameOver) return;
        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield - amount);
            this.invulnerableTimer = 0.65;
            this.parent.setStatus("Щит принял удар", "Заряд щита уменьшился.");
            this.parent.spawnEffect(new ParticleBurst(this.transform.position.x + this.width / 2, this.transform.position.y + this.height / 2, "#7deeff", 16, 0.35, [80, 220]));
            return;
        }
        this.lives -= amount;
        this.invulnerableTimer = 1.1;
        this.parent.spawnEffect(new ParticleBurst(this.transform.position.x + this.width / 2, this.transform.position.y + this.height / 2, "#ffd0a1", 20, 0.55, [100, 380]));
        if (this.lives <= 0) {
            this.parent.onPlayerDestroyed();
        }
    }
    applyPowerUp(kind) {
        if (kind === "rapid") {
            this.rapidTimer = 7;
            this.parent.setStatus("Импульсный разгон", "Скорострельность увеличена на 7 секунд.");
        } else if (kind === "shield") {
            this.shield = Math.min(3, this.shield + 1);
            this.parent.setStatus("Щит усилен", "Следующий удар частично или полностью будет поглощён.");
        } else if (kind === "heal") {
            this.lives = Math.min(5, this.lives + 1);
            this.parent.setStatus("Корпус восстановлен", "Получена дополнительная единица прочности.");
        }
    }
    render(ctx) {
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 18) % 2 === 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            super.render(ctx);
            ctx.restore();
        } else {
            super.render(ctx);
        }
        if (this.shield > 0) {
            const centerX = this.transform.position.x + this.width / 2;
            const centerY = this.transform.position.y + this.height / 2 + 4;
            ctx.save();
            ctx.globalAlpha = 0.18 + this.shield * 0.08;
            ctx.strokeStyle = "#85f1ff";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 50 + Math.sin(performance.now() / 180) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}
class GameScene extends Scene {
    constructor(ui) {
        super();
        this.ui = ui;
        this.wave = 0;
        this.score = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveDelay = 1.8;
        this.gameOver = false;
        this.isFrozen = false;
        this.statusTimer = 0;
        this.statusText = "";
        this.statusSub = "";
        this.flashBossBar = 0;
    }
    init() {
        this.background = new Starfield();
        this.player = new Player();
        this.gameObjects.append(this.background);
        this.gameObjects.append(this.player);
        super.init();
    }
    start() {
        super.start();
        this.startNextWave();
    }
    update(dt) {
        if (this.flashBossBar > 0) {
            this.flashBossBar -= dt;
        }
        if (this.statusTimer > 0) {
            this.statusTimer -= dt;
            if (this.statusTimer <= 0 && !this.gameOver) {
                this.setStatus(`Волна ${this.wave}`, "Поддерживай огневой темп и избегай плотных залпов.", 0.2);
            }
        }
        if (this.gameOver) {
            if (Engine.instance.input.isKeyPressed("KeyR")) {
                window.location.reload();
            }
            super.update(dt);
            this.cleanupDeadObjects();
            this.updateUi();
            return;
        }
        this.handleWaveSpawning(dt);
        super.update(dt);
        this.handleCollisions();
        this.cleanupDeadObjects();
        if (this.spawnQueue.length === 0 && this.getEnemies().length === 0 && this.getBoss() === null) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this.startNextWave();
            }
        }
        this.updateUi();
    }
    render(ctx) {
        super.render(ctx);
        const player = this.player;
        if (player && !player._dead && player.rapidTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.86;
            ctx.fillStyle = "#ffd87b";
            ctx.font = "bold 18px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`⚡ x${player.rapidTimer.toFixed(1)}s`, ENGINE_WIDTH() - 24, ENGINE_HEIGHT() - 32);
            ctx.restore();
        }
    }
    spawnBullet(bullet, x, y) {
        bullet.transform.position.set(x, y);
        this.gameObjects.append(bullet);
    }
    spawnEffect(effect) {
        this.gameObjects.append(effect);
    }
    spawnPowerUp(kind, x, y) {
        const powerUp = new PowerUp(kind, x, y);
        this.gameObjects.append(powerUp);
    }
    getEnemies() {
        return this.gameObjects.items.filter((item) => item instanceof Enemy && !item._dead);
    }
    getBoss() {
        return this.gameObjects.items.find((item) => item instanceof Boss && !item._dead) ?? null;
    }
    getBullets(owner) {
        return this.gameObjects.items.filter((item) => item instanceof Bullet && item.owner === owner && !item._dead);
    }
    getPowerUps() {
        return this.gameObjects.items.filter((item) => item instanceof PowerUp && !item._dead);
    }
    handleWaveSpawning(dt) {
        if (this.spawnQueue.length === 0) return;
        this.spawnTimer -= dt;
        if (this.spawnTimer > 0) return;
        const spawnInfo = this.spawnQueue.shift();
        if (!spawnInfo) return;
        if (spawnInfo.type === "boss") {
            this.gameObjects.append(new Boss(this.wave));
            this.setStatus("Флагман на радаре", "Уклоняйся от веерных залпов и держи центр поля.", 3.4);
        } else {
            this.gameObjects.append(new Enemy(spawnInfo));
        }
        this.spawnTimer = spawnInfo.delay ?? rand(0.16, 0.45);
    }
    startNextWave() {
        this.wave += 1;
        this.waveDelay = 2.4;
        this.spawnQueue = [];
        this.spawnTimer = 0.05;
        if (this.wave % 5 === 0) {
            this.spawnQueue.push({
                type: "boss",
                delay: 0.8
            });
            for (let i = 0; i < 6 + this.wave; i += 1) {
                this.spawnQueue.push({
                    type: "enemy",
                    variant: i % 2 === 0 ? "scout" : "drone",
                    x: rand(120, ENGINE_WIDTH() - 180),
                    y: rand(-620, -100),
                    speedY: rand(170, 250),
                    moveAmplitude: rand(32, 110),
                    delay: rand(0.2, 0.34),
                    hp: i % 2 === 0 ? 1 : 2,
                    scoreValue: i % 2 === 0 ? 140 : 190,
                });
            }
            this.setStatus(`Волна ${this.wave}: Флагман`, "Подготовься к тяжёлому бою. Усиления особенно важны.", 3.2);
            return;
        }
        const rows = 2 + Math.floor(this.wave / 2);
        const perRow = clamp(5 + this.wave, 6, 12);
        const gap = ENGINE_WIDTH() / (perRow + 1);
        for (let row = 0; row < rows; row += 1) {
            for (let i = 0; i < perRow; i += 1) {
                const variant = (this.wave >= 3 && (row + i) % 3 === 0) ? "scout" : "drone";
                const x = gap * (i + 1) - (variant === "scout" ? 33 : 39);
                const y = -80 - row * rand(90, 130) - i * rand(18, 42);
                this.spawnQueue.push({
                    type: "enemy",
                    variant,
                    x,
                    y,
                    speedY: variant === "scout" ? rand(230, 300) : rand(155, 215) + this.wave * 4,
                    moveAmplitude: rand(24, 96) + this.wave * 2,
                    hp: variant === "scout" ? 1 : 2 + Math.floor(this.wave / 4),
                    scoreValue: variant === "scout" ? 120 : 160 + this.wave * 8,
                    delay: rand(0.08, 0.22),
                });
            }
        }
        this.setStatus(`Волна ${this.wave}`, this.wave < 4 ? "Наращивай темп и собирай усиления." : "Плотность огня растёт — держи дистанцию.", 2.8);
    }
    handleCollisions() {
        const player = this.player;
        if (!player || player._dead) return;
        const playerBullets = this.getBullets("player");
        const enemyBullets = this.getBullets("enemy");
        const enemies = this.getEnemies();
        const boss = this.getBoss();
        const powerUps = this.getPowerUps();
        for (const bullet of playerBullets) {
            for (const enemy of enemies) {
                if (bullet._dead || enemy._dead) continue;
                if (intersects(bullet, enemy)) {
                    bullet._dead = true;
                    enemy.takeDamage(bullet.damage);
                }
            }
            if (!bullet._dead && boss && intersects(bullet, boss)) {
                bullet._dead = true;
                boss.takeDamage(bullet.damage);
                this.spawnEffect(new ParticleBurst(bullet.transform.position.x, bullet.transform.position.y, "#d8c2ff", 8, 0.22, [40, 120]));
            }
        }
        for (const bullet of enemyBullets) {
            if (!bullet._dead && intersects(bullet, player)) {
                bullet._dead = true;
                player.takeDamage(bullet.damage);
            }
        }
        for (const enemy of enemies) {
            if (!enemy._dead && intersects(enemy, player)) {
                enemy._dead = true;
                player.takeDamage(1);
                this.spawnEffect(new ParticleBurst(enemy.transform.position.x + enemy.width / 2, enemy.transform.position.y + enemy.height / 2, "#ffce9a", 18, 0.45, [120, 260]));
            }
        }
        if (boss && intersects(boss, player)) {
            player.takeDamage(2);
        }
        for (const powerUp of powerUps) {
            if (!powerUp._dead && intersects(powerUp, player)) {
                powerUp._dead = true;
                player.applyPowerUp(powerUp.kind);
                this.spawnEffect(new ParticleBurst(powerUp.transform.position.x + powerUp.width / 2, powerUp.transform.position.y + powerUp.height / 2, powerUp.kind === "rapid" ? "#ffe08c" : powerUp.kind === "shield" ? "#80f0ff" : "#a9ffb8", 16, 0.42, [70, 220]));
                this.score += 40;
            }
        }
    }
    onEnemyDestroyed(enemy) {
        this.score += enemy.scoreValue;
        this.spawnEffect(new ParticleBurst(enemy.transform.position.x + enemy.width / 2, enemy.transform.position.y + enemy.height / 2, enemy.variant === "scout" ? "#ffd6ae" : "#ff92b0", enemy.variant === "scout" ? 10 : 16, 0.45, [90, 250]));
        const chance = Math.random();
        if (chance < 0.08) {
            this.spawnPowerUp("rapid", enemy.transform.position.x + enemy.width / 2 - 22, enemy.transform.position.y + 8);
        } else if (chance < 0.13) {
            this.spawnPowerUp("shield", enemy.transform.position.x + enemy.width / 2 - 22, enemy.transform.position.y + 8);
        } else if (chance < 0.16) {
            this.spawnPowerUp("heal", enemy.transform.position.x + enemy.width / 2 - 22, enemy.transform.position.y + 8);
        }
    }
    onBossDestroyed(boss) {
        this.score += 2500 + this.wave * 120;
        this.spawnEffect(new ParticleBurst(boss.transform.position.x + boss.width / 2, boss.transform.position.y + boss.height / 2, "#e3c6ff", 42, 1.15, [120, 420]));
        this.setStatus("Флагман уничтожен", "Сектор очищен. Подготовка к следующей волне...", 3.1);
        const healX = boss.transform.position.x + boss.width / 2 - 22;
        const healY = boss.transform.position.y + boss.height / 2 - 22;
        this.spawnPowerUp("heal", healX - 70, healY + 20);
        this.spawnPowerUp("shield", healX, healY - 10);
        this.spawnPowerUp("rapid", healX + 70, healY + 20);
    }
    onPlayerDestroyed() {
        this.gameOver = true;
        this.isFrozen = true;
        this.setStatus("Связь потеряна", "Рейд завершён. Нажми R или кнопку ниже, чтобы начать заново.", 99);
        this.showOverlay("Рейд завершён", `Итоговый счёт: ${this.score}. Достигнута волна: ${this.wave}. Нажми R или кнопку ниже для новой попытки.`);
    }
    cleanupDeadObjects() {
        const dead = this.gameObjects.items.filter((item) => item._dead === true);
        dead.forEach((item) => item.destroy());
    }
    setStatus(text, sub, duration = 2.4) {
        this.statusText = text;
        this.statusSub = sub;
        this.statusTimer = duration;
        this.updateUi();
    }
    updateUi() {
        this.ui.score.textContent = String(this.score);
        this.ui.wave.textContent = String(this.wave);
        this.ui.lives.textContent = String(Math.max(0, this.player?.lives ?? 0));
        this.ui.shield.textContent = String(Math.max(0, this.player?.shield ?? 0));
        this.ui.status.textContent = this.statusText || `Волна ${this.wave}`;
        this.ui.statusSub.textContent = this.statusSub || "Уничтожай врагов и продержись как можно дольше.";
    }
    showOverlay(title, text) {
        this.ui.overlayTitle.textContent = title;
        this.ui.overlayText.textContent = text;
        this.ui.overlay.classList.add("is-visible");
    }
}
class SpaceShooterGame {
    constructor() {
        this.engine = Engine.instance;
        this.ui = {
            score: document.getElementById("score-value"),
            wave: document.getElementById("wave-value"),
            lives: document.getElementById("lives-value"),
            shield: document.getElementById("shield-value"),
            status: document.getElementById("status-text"),
            statusSub: document.getElementById("status-sub"),
            overlay: document.getElementById("overlay"),
            overlayTitle: document.getElementById("overlay-title"),
            overlayText: document.getElementById("overlay-text"),
            restartButton: document.getElementById("restart-button"),
        };
    }
    async boot() {
        this.ui.restartButton.addEventListener("click", () => window.location.reload());
        const assets = await createProceduralAssets();
        this.engine.assets = assets;
        this.engine.assetLoader.assets = assets;
        const scene = new GameScene(this.ui);
        this.engine.scenes.append(scene);
        this.engine.init("#game-canvas", {
            width: 1920,
            height: 1080,
            screenMode: "expand",
            fitToWindow: true,
            autoResize: true,
            backgroundColor: "#040814",
        });
        const canvas = document.getElementById("game-canvas");
        canvas.focus();
        this.engine.startGameLoop();
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    const game = new SpaceShooterGame();
    await game.boot();
});