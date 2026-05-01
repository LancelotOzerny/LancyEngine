# Getting Started

## 1. HTML

```html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LancyEngine Game</title>
</head>
<body>
    <canvas id="game"></canvas>
    <script type="module" src="main.js"></script>
</body>
</html>
```

## 2. Импорт Engine

```js
import { Engine, GameObject, Scene } from "./scripts/core/index.js";
import { SpriteComponent } from "./scripts/components/index.js";
```

## 3. Init

```js
const engine = Engine.instance;

engine.init("#game", {
    width: 1280,
    height: 720,
    backgroundColor: "#0f172a",
    pixelArt: false,
});
```

## 4. Scene

```js
class MainScene extends Scene {
    start() {
        const player = new GameObject();
        player.name = "Player";
        player.transform.position.set(200, 300);
        player.addComponent(new SpriteComponent({
            color: "#22c55e",
            width: 48,
            height: 48,
        }));

        this.gameObjects.add(player);
    }
}
```

## 5. Регистрация и запуск

```js
engine.scenes.add("main", new MainScene());
engine.run();
```

## 6. Assets

```js
await engine.prepareData({
    images: [{ key: "player", src: "assets/player.png" }],
    audio: [{ key: "jump", src: "assets/jump.wav" }],
    json: [{ key: "level1", src: "assets/level1.json" }],
});
```

Или через `run`:

```js
engine.run(() => {
    engine.scenes.add("main", new MainScene());
}, {
    images: [{ key: "player", src: "assets/player.png" }],
});
```

## 7. Sprite from asset

```js
player.addComponent(new SpriteComponent({
    sprite: "player",
    width: 64,
    height: 64,
}));
```

Открывайте примеры через local server, например `npm run develop`, потому что ES modules и asset loading обычно не работают из `file://`.
