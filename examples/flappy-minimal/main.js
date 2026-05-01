import { BaseComponent, Engine, GameObject, Scene } from "../../scripts/core/index.js";
import { SpriteComponent } from "../../scripts/components/index.js";

const engine = Engine.instance;

class BirdController extends BaseComponent {
    constructor(scene) {
        super();
        this.scene = scene;
        this.velocityY = 0;
        this.gravity = 1500;
        this.jumpPower = 460;
    }

    start() {
        Engine.instance.input.mapAction("flap", ["Space", "ArrowUp", "KeyW"]);
    }

    update(dt) {
        const input = Engine.instance.input;

        if (input.isActionPressed("flap") || input.wasTapped() || input.isPointerPressed(0)) {
            this.velocityY = -this.jumpPower;
        }

        this.velocityY += this.gravity * dt;
        this.parent.transform.position.y += this.velocityY * dt;

        if (this.parent.transform.position.y < 0 || this.parent.transform.position.y > 720 - 36) {
            this.scene.reset();
        }
    }
}

class PipeComponent extends BaseComponent {
    constructor(scene) {
        super();
        this.scene = scene;
        this.speed = 230;
        this.passed = false;
    }

    update(dt) {
        this.parent.transform.position.x -= this.speed * dt;

        if (!this.passed && this.parent.transform.position.x + 70 < this.scene.bird.transform.position.x) {
            this.passed = true;
            this.scene.score += 1;
        }

        if (this.parent.transform.position.x < -90) {
            this.parent.destroy();
        }

        if (this.overlapsBird()) {
            this.scene.reset();
        }
    }

    overlapsBird() {
        const bird = this.scene.bird.transform.position;
        const pipe = this.parent.transform.position;
        return bird.x < pipe.x + 70 && bird.x + 36 > pipe.x && bird.y < pipe.y + this.parent.height && bird.y + 36 > pipe.y;
    }
}

class HudComponent extends BaseComponent {
    render(ctx) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 32px Arial";
        ctx.fillText(`Score: ${this.parent.parent.score}`, 24, 48);
        ctx.font = "16px Arial";
        ctx.fillText("Space / tap / click to flap", 24, 76);
        ctx.restore();
    }
}

class FlappyScene extends Scene {
    start() {
        this.score = 0;
        this.spawnTimer = 0;
        this.createBird();
        this.createHud();
    }

    update(dt) {
        super.update(dt);

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.35;
            this.spawnPipePair();
        }
    }

    createBird() {
        this.bird = new GameObject();
        this.bird.name = "Bird";
        this.bird.transform.position.set(220, 320);
        this.bird.addComponent(new SpriteComponent({ color: "#facc15", width: 36, height: 36 }));
        this.bird.addComponent(new BirdController(this));
        this.gameObjects.add(this.bird);
    }

    createHud() {
        const hud = new GameObject();
        hud.name = "HUD";
        hud.setLayer("ui");
        hud.addComponent(new HudComponent());
        this.gameObjects.add(hud);
    }

    spawnPipePair() {
        const gap = 190;
        const center = 180 + Math.random() * 320;
        this.createPipe(1280, 0, center - gap / 2);
        this.createPipe(1280, center + gap / 2, 720 - (center + gap / 2));
    }

    createPipe(x, y, height) {
        const pipe = new GameObject();
        pipe.name = "Pipe";
        pipe.height = height;
        pipe.transform.position.set(x, y);
        pipe.addComponent(new SpriteComponent({ color: "#22c55e", width: 70, height }));
        pipe.addComponent(new PipeComponent(this));
        this.gameObjects.add(pipe);
    }

    reset() {
        this.gameObjects.items
            .filter(object => object.name === "Pipe")
            .forEach(object => object.destroy());
        this.score = 0;
        this.spawnTimer = 0.8;
        this.bird.transform.position.set(220, 320);
        this.bird.findComponent(BirdController).velocityY = 0;
    }
}

engine.init("#game", { width: 1280, height: 720, backgroundColor: "#38bdf8" });
engine.scenes.add("flappy", new FlappyScene());
engine.run();
