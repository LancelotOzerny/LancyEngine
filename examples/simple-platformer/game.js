import { BaseComponent, Engine, GameObject, Scene } from "../../scripts/core/index.js";
import { CameraComponent, ColliderComponent, PhysicComponent, SpriteComponent } from "../../scripts/components/index.js";

const LAYERS = {
    WORLD: 1,
    PLAYER: 2,
    ENEMY: 3,
};

const WORLD = {
    width: 2800,
    height: 720,
    spawnX: 120,
    spawnY: 472,
    finishX: 2600,
};

class PlayerController extends BaseComponent
{
    constructor(params = {})
    {
        super(params);
        this.speed = params.speed ?? 430;
        this.jumpPower = params.jumpPower ?? 830;
        this.respawnDelay = 0;
        this.won = false;
    }

    start()
    {
        this.refreshComponents();
    }

    update(dt)
    {
        this.refreshComponents();
        if (!this.physics || !this.collider) return;

        const engine = Engine.instance;
        const input = engine.input;
        const left = input.isKeyDown("ArrowLeft") || input.isKeyDown("KeyA");
        const right = input.isKeyDown("ArrowRight") || input.isKeyDown("KeyD");
        const jump = input.isKeyPressed("Space") || input.isKeyPressed("ArrowUp") || input.isKeyPressed("KeyW");

        const direction = Number(right) - Number(left);
        this.physics.velocity.x = direction * this.speed;

        if (jump && this.physics.isGrounded)
        {
            this.physics.velocity.y = -this.jumpPower;
        }

        if (this.parent.transform.position.y > WORLD.height + 260)
        {
            this.respawn();
        }

        if (this.parent.transform.position.x >= WORLD.finishX && !this.won)
        {
            this.won = true;
            this.parent.parent.gameState.message = "Финиш! Нажми R, чтобы сыграть еще раз";
        }

        if (input.isKeyPressed("KeyR"))
        {
            this.parent.parent.requestReset();
        }

        this.updatePose(dt, direction);
    }

    refreshComponents()
    {
        this.physics ??= this.parent.findComponent(PhysicComponent);
        this.collider ??= this.parent.findComponent(ColliderComponent);
    }

    updatePose(dt, direction)
    {
        const sprite = this.parent.findComponent(SpriteComponent);
        if (!sprite) return;

        const bob = this.physics.isGrounded
            ? Math.sin(performance.now() / 95) * Math.abs(direction) * 2
            : 0;

        sprite.offsetY = bob;
        this.parent.transform.rotation = direction * 2;
    }

    respawn()
    {
        this.parent.transform.position.set(WORLD.spawnX, WORLD.spawnY);
        this.physics.velocity.set(0, 0);
        this.won = false;
        this.parent.parent.gameState.message = "Осторожнее с врагами";
    }
}

class EnemyController extends BaseComponent
{
    constructor(params = {})
    {
        super(params);
        this.left = params.left ?? 0;
        this.right = params.right ?? 200;
        this.speed = params.speed ?? 135;
        this.direction = params.direction ?? 1;
    }

    start()
    {
        this.refreshComponents();
    }

    update()
    {
        this.refreshComponents();
        if (!this.physics) return;

        const x = this.parent.transform.position.x;

        if (x <= this.left)
        {
            this.direction = 1;
        }
        else if (x >= this.right)
        {
            this.direction = -1;
        }

        this.physics.velocity.x = this.direction * this.speed;

        if (this.sprite)
        {
            this.sprite.color = this.direction > 0 ? "#ef5f67" : "#ff7b72";
        }
    }

    refreshComponents()
    {
        this.physics ??= this.parent.findComponent(PhysicComponent);
        this.sprite ??= this.parent.findComponent(SpriteComponent);
    }
}

class BackgroundRenderer extends BaseComponent
{
    render(ctx)
    {
        const view = Engine.instance.getViewRect();

        ctx.fillStyle = "#7ec8ff";
        ctx.fillRect(view.left - 100, 0, view.width + 200, WORLD.height);

        this.drawHills(ctx, -0.18, "#8bd68b", 470, 120);
        this.drawHills(ctx, -0.34, "#5fbf72", 530, 95);

        ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
        for (let i = 0; i < 9; i += 1)
        {
            const x = (i * 420 - Engine.instance.camera.x * 0.25) % (WORLD.width + 520) - 160;
            this.cloud(ctx, x, 92 + (i % 3) * 58, 1 + (i % 2) * 0.25);
        }
    }

    drawHills(ctx, parallax, color, baseY, height)
    {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-200, WORLD.height);

        for (let x = -200; x <= WORLD.width + 260; x += 180)
        {
            const y = baseY - Math.sin((x + Engine.instance.camera.x * parallax) / 180) * height;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(WORLD.width + 260, WORLD.height);
        ctx.closePath();
        ctx.fill();
    }

    cloud(ctx, x, y, scale)
    {
        ctx.beginPath();
        ctx.arc(x, y, 24 * scale, 0, Math.PI * 2);
        ctx.arc(x + 28 * scale, y - 12 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 64 * scale, y, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
}

class HudRenderer extends BaseComponent
{
    render(ctx)
    {
        const scene = this.parent.parent;
        const view = Engine.instance.getViewRect();
        const x = view.left + 30;
        const y = view.top + 30;

        ctx.fillStyle = "rgba(17, 24, 39, 0.72)";
        ctx.fillRect(x, y, 470, 86);

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 24px Arial, sans-serif";
        ctx.fillText(`Враги: ${scene.gameState.score}/2`, x + 22, y + 34);

        ctx.font = "500 18px Arial, sans-serif";
        ctx.fillText("A/D или стрелки - бег, Space/W/Up - прыжок, R - рестарт", x + 22, y + 65);

        if (scene.gameState.message)
        {
            ctx.fillStyle = "#ffe66d";
            ctx.font = "700 22px Arial, sans-serif";
            ctx.fillText(scene.gameState.message, x + 510, y + 38);
        }
    }
}

class PlatformerScene extends Scene
{
    constructor()
    {
        super();
        this.gameState = {
            score: 0,
            message: "",
        };
        this.resetRequested = false;
        this.player = null;
        this.enemies = [];
    }

    start()
    {
        this.buildLevel();
        super.start();
    }

    resetLevel()
    {
        this.gameObjects.clear({ destroy: true });
        this.gameState.score = 0;
        this.gameState.message = "";
        this.resetRequested = false;
        this.player = null;
        this.enemies = [];
        this.buildLevel();
        this.gameObjects.init();
        this.gameObjects.start();
    }

    requestReset()
    {
        this.resetRequested = true;
    }

    update(dt)
    {
        super.update(dt);
        this.resolveEnemyContacts();

        if (this.resetRequested)
        {
            this.resetLevel();
        }
    }

    buildLevel()
    {
        this.addBackground();

        const player = this.createPlayer(WORLD.spawnX, WORLD.spawnY);
        this.addPlatform(0, 640, WORLD.width, 120, "#345c3c");
        this.addPlatform(340, 520, 260, 42, "#4b7f52");
        this.addPlatform(760, 440, 280, 42, "#4b7f52");
        this.addPlatform(1180, 540, 360, 42, "#4b7f52");
        this.addPlatform(1680, 455, 300, 42, "#4b7f52");
        this.addPlatform(2160, 535, 250, 42, "#4b7f52");
        this.addPlatform(2520, 430, 180, 42, "#ffd166");

        this.addEnemy(850, 378, 760, 1000, 115);
        this.addEnemy(1780, 393, 1680, 1940, 145);
        this.addFinishFlag(WORLD.finishX, 320);
        this.addCamera(player);
        this.addHud();
    }

    addBackground()
    {
        const object = new GameObject();
        object.name = "Background";
        object.addComponent(new BackgroundRenderer());
        this.gameObjects.add(object);
    }

    createPlayer(x, y)
    {
        const object = new GameObject();
        object.name = "Player";
        object.transform.position.set(x, y);
        object.addComponent(new SpriteComponent({ width: 54, height: 78, color: "#2f80ed" }));
        object.addComponent(new ColliderComponent({
            width: 54,
            height: 78,
            layer: LAYERS.PLAYER,
            mask: [LAYERS.WORLD, LAYERS.ENEMY],
        }));
        object.addComponent(new PlayerController());
        object.addComponent(new PhysicComponent({ gravityScale: 180, drag: 0 }));
        this.gameObjects.add(object);
        this.player = object;
        return object;
    }

    addEnemy(x, y, left, right, speed)
    {
        const object = new GameObject();
        object.name = "Enemy";
        object.transform.position.set(x, y);
        object.addComponent(new SpriteComponent({ width: 58, height: 58, color: "#ef5f67" }));
        object.addComponent(new ColliderComponent({
            width: 58,
            height: 58,
            layer: LAYERS.ENEMY,
            mask: [LAYERS.WORLD, LAYERS.PLAYER],
        }));
        object.addComponent(new EnemyController({ left, right, speed }));
        object.addComponent(new PhysicComponent({ gravityScale: 180, drag: 0 }));
        this.gameObjects.add(object);
        this.enemies.push(object);
    }

    resolveEnemyContacts()
    {
        if (!this.player || this.player._isDestroyed) return;

        const playerCollider = this.player.findComponent(ColliderComponent);
        const playerPhysics = this.player.findComponent(PhysicComponent);
        const playerController = this.player.findComponent(PlayerController);

        if (!playerCollider || !playerPhysics || !playerController) return;

        const contacts = [...playerCollider.contacts];

        for (const enemy of this.enemies)
        {
            if (enemy._isDestroyed) continue;

            const enemyCollider = enemy.findComponent(ColliderComponent);
            if (!enemyCollider) continue;

            enemyCollider.contacts
                .filter(contact => contact.other === playerCollider)
                .forEach(contact => contacts.push({
                    ...contact,
                    other: enemyCollider,
                    side: contact.side === "top" ? "bottom" : contact.side,
                }));
        }

        for (const contact of contacts)
        {
            const enemyCollider = contact.other;
            if (enemyCollider?.layer !== LAYERS.ENEMY || enemyCollider.parent._isDestroyed) continue;

            const enemyBounds = enemyCollider.getBounds();
            const previousPlayerBounds = playerCollider.getBounds(
                playerPhysics.prevPosition.x,
                playerPhysics.prevPosition.y
            );
            const landedFromAbove = contact.side === "bottom" ||
                previousPlayerBounds.bottom <= enemyBounds.top + 18;

            if (landedFromAbove)
            {
                enemyCollider.parent.destroy();
                playerPhysics.velocity.y = -520;
                this.gameState.score += 1;
                this.gameState.message = this.gameState.score >= 2
                    ? "Все враги побеждены"
                    : "Хороший прыжок";
                continue;
            }

            playerController.respawn();
            break;
        }

        this.enemies = this.enemies.filter(enemy => !enemy._isDestroyed);
    }

    addPlatform(x, y, width, height, color)
    {
        const object = new GameObject();
        object.name = "Platform";
        object.transform.position.set(x, y);
        object.addComponent(new SpriteComponent({ width, height, color }));
        object.addComponent(new ColliderComponent({
            width,
            height,
            isStatic: true,
            layer: LAYERS.WORLD,
            mask: [LAYERS.PLAYER, LAYERS.ENEMY],
        }));
        this.gameObjects.add(object);
    }

    addFinishFlag(x, y)
    {
        this.addPlatform(x, y + 260, 120, 60, "#2a9d8f");

        const pole = new GameObject();
        pole.name = "FinishFlag";
        pole.transform.position.set(x + 84, y);
        pole.addComponent(new SpriteComponent({ width: 16, height: 310, color: "#f8f9fa" }));
        this.gameObjects.add(pole);

        const flag = new GameObject();
        flag.name = "FinishFlagCloth";
        flag.transform.position.set(x + 100, y + 22);
        flag.addComponent(new SpriteComponent({ width: 112, height: 68, color: "#ffd166" }));
        this.gameObjects.add(flag);
    }

    addCamera(target)
    {
        const object = new GameObject();
        object.name = "Camera";
        object.addComponent(new CameraComponent({
            target,
            offsetY: -80,
            smoothness: 6,
            deadZoneWidth: 220,
            deadZoneHeight: 150,
            bounds: {
                left: 0,
                top: 0,
                right: WORLD.width,
                bottom: WORLD.height,
            },
        }));
        this.gameObjects.add(object);
    }

    addHud()
    {
        const object = new GameObject();
        object.name = "HUD";
        object.addComponent(new HudRenderer());
        this.gameObjects.add(object);
    }
}

const engine = Engine.instance;
engine.init("#game", {
    width: 1280,
    height: 720,
    backgroundColor: "#7ec8ff",
    screenMode: "expand",
    pixelArt: false,
});

engine.scenes.add("platformer", new PlatformerScene());
engine.run();
