import { BaseComponent, Engine, GameObject, Scene } from "../../scripts/core/index.js";

const engine = Engine.instance;

class TargetComponent extends BaseComponent {
    constructor(scene) {
        super();
        this.scene = scene;
        this.radius = 34;
        this.color = "#fb7185";
    }

    update() {
        const input = Engine.instance.input;
        if (!input.isPointerPressed(0) && !input.wasTapped()) return;

        const p = input.getPointerWorldPosition();
        const pos = this.parent.transform.position;
        if (Math.hypot(p.x - pos.x, p.y - pos.y) <= this.radius) {
            this.scene.score += 1;
            this.parent.transform.position.set(80 + Math.random() * 1120, 100 + Math.random() * 520);
            this.radius = 24 + Math.random() * 28;
            this.color = `hsl(${Math.floor(Math.random() * 360)}, 85%, 65%)`;
        }
    }

    render(ctx) {
        const pos = this.parent.transform.position;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HudComponent extends BaseComponent {
    render(ctx) {
        const scene = this.parent.parent;
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 30px Arial";
        ctx.fillText(`Score: ${scene.score}`, 24, 44);
        ctx.font = "16px Arial";
        ctx.fillText("Click or tap the circle. Pointer/touch input uses world coordinates.", 24, 72);
        ctx.restore();
    }
}

class ClickerScene extends Scene {
    start() {
        this.score = 0;

        const target = new GameObject();
        target.name = "Target";
        target.transform.position.set(640, 360);
        target.addComponent(new TargetComponent(this));
        this.gameObjects.add(target);

        const hud = new GameObject();
        hud.setLayer("ui");
        hud.addComponent(new HudComponent());
        this.gameObjects.add(hud);
    }
}

engine.init("#game", { width: 1280, height: 720, backgroundColor: "#111827" });
engine.scenes.add("clicker", new ClickerScene());
engine.run();
