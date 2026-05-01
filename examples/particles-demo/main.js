import { BaseComponent, Engine, GameObject, Scene } from "../../scripts/core/index.js";
import { ParticleSystemComponent } from "../../scripts/components/index.js";

const engine = Engine.instance;

class DemoController extends BaseComponent {
    constructor(explosion, smoke, trail) {
        super();
        this.explosion = explosion;
        this.smoke = smoke;
        this.trail = trail;
        this.time = 0;
    }

    update(dt) {
        this.time += dt;
        this.trail.parent.transform.position.set(640 + Math.cos(this.time * 2) * 220, 360 + Math.sin(this.time * 3) * 120);

        const input = Engine.instance.input;
        if (input.isPointerPressed(0) || input.wasTapped()) {
            const p = input.getPointerWorldPosition();
            this.explosion.parent.transform.position.set(p.x, p.y);
            this.explosion.burst(90);
        }

        if (input.isKeyPressed("Space")) {
            this.smoke.isPlaying() ? this.smoke.pause() : this.smoke.play();
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.fillText("Click/tap for explosion. Space pauses/resumes smoke.", 20, 32);
        ctx.restore();
    }
}

class ParticlesScene extends Scene {
    start() {
        const explosionObject = new GameObject();
        explosionObject.transform.position.set(640, 360);
        const explosion = explosionObject.addComponent(new ParticleSystemComponent({
            maxParticles: 180,
            emissionRate: 0,
            autoplay: false,
            lifetime: { min: 0.25, max: 0.8 },
            speed: { min: 120, max: 460 },
            gravity: { x: 0, y: 260 },
            startSize: { min: 4, max: 14 },
            endSize: { min: 0, max: 0 },
            startColor: "#facc15",
            endColor: "#ef4444",
            blendMode: "lighter",
        }));
        this.gameObjects.add(explosionObject);

        const smokeObject = new GameObject();
        smokeObject.transform.position.set(220, 520);
        const smoke = smokeObject.addComponent(new ParticleSystemComponent({
            maxParticles: 180,
            emissionRate: 32,
            looping: true,
            shape: "circle",
            radius: 12,
            lifetime: { min: 0.9, max: 1.8 },
            speed: { min: 20, max: 80 },
            angle: { min: -Math.PI * 0.9, max: -Math.PI * 0.1 },
            gravity: { x: 0, y: -40 },
            startSize: { min: 10, max: 22 },
            endSize: { min: 36, max: 64 },
            startAlpha: 0.35,
            endAlpha: 0,
            startColor: "#94a3b8",
        }));
        this.gameObjects.add(smokeObject);

        const trailObject = new GameObject();
        const trail = trailObject.addComponent(new ParticleSystemComponent({
            maxParticles: 120,
            emissionRate: 55,
            looping: true,
            worldSpace: true,
            lifetime: { min: 0.25, max: 0.55 },
            speed: { min: 10, max: 55 },
            startSize: { min: 3, max: 9 },
            endSize: { min: 0, max: 0 },
            startAlpha: 0.8,
            endAlpha: 0,
            startColor: "#38bdf8",
            blendMode: "lighter",
        }));
        this.gameObjects.add(trailObject);

        const hud = new GameObject();
        hud.setLayer("ui");
        hud.addComponent(new DemoController(explosion, smoke, trail));
        this.gameObjects.add(hud);

        explosion.burst(90);
    }
}

engine.init("#game", { width: 1280, height: 720, backgroundColor: "#020617" });
engine.scenes.add("particles", new ParticlesScene());
engine.run();
