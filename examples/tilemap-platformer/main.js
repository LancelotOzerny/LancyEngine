import { BaseComponent, Engine, GameObject, Scene, TileMap } from "../../scripts/core/index.js";
import { CameraComponent, SpriteComponent, TileMapColliderComponent, TileMapComponent } from "../../scripts/components/index.js";

const engine = Engine.instance;

function createTilesImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 24, 32, 8);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(32, 0, 32, 32);
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(32, 0, 32, 8);
    return canvas;
}

function createLevelData(width = 48, height = 18) {
    const solid = new Array(width * height).fill(0);
    const background = new Array(width * height).fill(0);
    const set = (x, y, id) => { solid[y * width + x] = id; };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            background[y * width + x] = 1;
        }
    }

    for (let x = 0; x < width; x++) set(x, height - 2, 2);
    for (let x = 8; x < 14; x++) set(x, 12, 2);
    for (let x = 18; x < 26; x++) set(x, 9, 2);
    for (let x = 31; x < 38; x++) set(x, 13, 2);

    return {
        width,
        height,
        tileWidth: 32,
        tileHeight: 32,
        tilesets: [{ name: "main", imageKey: "tiles", tileWidth: 32, tileHeight: 32, columns: 2 }],
        layers: [
            { name: "background", visible: true, opacity: 0.25, collision: false, zIndex: 0, data: background },
            { name: "solid", visible: true, collision: true, zIndex: 10, data: solid },
        ],
    };
}

class PlayerController extends BaseComponent {
    constructor(tileCollider) {
        super();
        this.tileCollider = tileCollider;
        this.velocity = { x: 0, y: 0 };
        this.grounded = false;
    }

    update(dt) {
        const input = Engine.instance.input;
        const left = input.isKeyDown("ArrowLeft") || input.isKeyDown("KeyA");
        const right = input.isKeyDown("ArrowRight") || input.isKeyDown("KeyD");
        const jump = input.isKeyPressed("Space") || input.isKeyPressed("ArrowUp") || input.isKeyPressed("KeyW");

        this.velocity.x = (Number(right) - Number(left)) * 220;
        this.velocity.y += 900 * dt;

        if (jump && this.grounded) {
            this.velocity.y = -430;
        }

        const rect = {
            x: this.parent.transform.position.x,
            y: this.parent.transform.position.y,
            width: 28,
            height: 44,
        };
        const result = this.tileCollider.resolveAABB(rect, {
            x: this.velocity.x * dt,
            y: this.velocity.y * dt,
        });

        this.parent.transform.position.set(result.rect.x, result.rect.y);
        if (result.velocity.x === 0) this.velocity.x = 0;
        if (result.velocity.y === 0) this.velocity.y = 0;
        this.grounded = result.touching.bottom;
    }
}

class HudComponent extends BaseComponent {
    render(ctx) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.fillText("A/D or arrows to move, Space/W/Up to jump", 20, 32);
        ctx.restore();
    }
}

class TilePlatformerScene extends Scene {
    start() {
        Engine.instance.assets.set("tiles", createTilesImage());

        const tileMap = TileMap.fromJSON(createLevelData(), { images: Engine.instance.assets });
        const map = new GameObject();
        map.name = "TileMap";
        map.setLayer("background");
        map.addComponent(new TileMapComponent({ tileMap, layerNames: ["background", "solid"] }));
        const tileCollider = map.addComponent(new TileMapColliderComponent({ tileMap, layerNames: ["solid"] }));
        this.gameObjects.add(map);

        const player = new GameObject();
        player.name = "Player";
        player.transform.position.set(96, 320);
        player.setLayer("default");
        player.addComponent(new SpriteComponent({ color: "#facc15", width: 28, height: 44 }));
        player.addComponent(new PlayerController(tileCollider));
        this.gameObjects.add(player);

        const camera = new GameObject();
        camera.addComponent(new CameraComponent({
            target: player,
            smoothness: 10,
            bounds: { left: 0, top: 0, right: tileMap.getBounds().right, bottom: tileMap.getBounds().bottom },
        }));
        this.gameObjects.add(camera);

        const hud = new GameObject();
        hud.setLayer("ui");
        hud.addComponent(new HudComponent());
        this.gameObjects.add(hud);
    }
}

engine.init("#game", { width: 960, height: 540, backgroundColor: "#7dd3fc", screenMode: "expand" });
engine.scenes.add("tilemap-platformer", new TilePlatformerScene());
engine.run();
