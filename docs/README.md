# LancyEngine v2

LancyEngine - небольшой JavaScript 2D Canvas движок для аркадных игр, прототипов и учебных проектов. Он использует ES modules, обычный `<canvas>` и компонентную модель: `Engine -> Scene -> GameObject -> Component`.

## Для каких игр подходит

- Flappy Bird-like и one-button arcade
- платформеры и runner-игры
- clicker/tap games
- tilemap-уровни
- эффекты, particles, простые UI overlay
- небольшие HTML5 игры без сборщика

Для больших production-проектов с редактором уровней, сложной физикой или сетевым кодом движок лучше рассматривать как основу, которую можно развивать.

## Быстрый старт

```html
<canvas id="game"></canvas>
<script type="module" src="main.js"></script>
```

```js
import { Engine, GameObject, Scene } from "./scripts/core/index.js";
import { SpriteComponent } from "./scripts/components/index.js";

class GameScene extends Scene {
    start() {
        const box = new GameObject();
        box.transform.position.set(100, 100);
        box.addComponent(new SpriteComponent({
            color: "#4cc9f0",
            width: 64,
            height: 64,
        }));
        this.gameObjects.add(box);
    }
}

const engine = Engine.instance;
engine.init("#game", { width: 1280, height: 720, backgroundColor: "#111827" });
engine.scenes.add("game", new GameScene());
engine.run();
```

## Базовая структура проекта

```text
index.html
main.js
assets/
scripts/
  core/
  components/
  math/
  ui/
```

## Основные модули

- `Engine` - canvas, loop, assets, input, audio, scenes.
- `SceneManager` и `Scene` - регистрация, переключение и lifecycle сцен.
- `GameObject` - объект мира с `transform` и компонентами.
- `BaseComponent` - базовый класс для поведения.
- `SpriteComponent`, `AnimationComponent`, `CameraComponent` - визуальные и camera-компоненты.
- `InputSystem` - keyboard, actions, pointer/touch, gamepad, virtual controls.
- `CollisionSystem` - AABB/circle colliders, triggers, overlap/raycast.
- `AudioManager` - music/sfx каналы.
- `TileMap`, `TimerManager`, `TweenManager`, `ParticleSystemComponent` - возможности v2.

Дальше: [getting-started.md](getting-started.md), [architecture.md](architecture.md), [api-reference.md](api-reference.md).
