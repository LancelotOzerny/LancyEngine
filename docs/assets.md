# Assets

`AssetLoader` доступен через `engine.assetLoader`, но обычно используется `engine.prepareData()`.

## Images

```js
await engine.prepareData({
    images: [
        { key: "player", src: "assets/player.png" },
        "assets/enemy.png"
    ],
});
```

Если передать строку, key берется из имени файла без расширения.

```js
const playerImage = engine.assets.get("player");
```

`SpriteComponent` использует `Engine.instance.assets`.

## Audio

```js
await engine.prepareData({
    audio: [{ key: "jump", src: "assets/jump.wav" }],
});

engine.audio.playSfx("jump");
```

## JSON

Available since v2.

```js
await engine.prepareData({
    json: [{ key: "level1", src: "assets/level1.json" }],
});

const level = engine.jsonAssets.get("level1");
```

## Text Files

Available since v2.

```js
await engine.prepareData({
    files: [{ key: "dialog", src: "assets/dialog.txt" }],
});

const text = engine.fileAssets.get("dialog");
```

## prepareData Return Value

```js
const assets = await engine.prepareData({ images: [], audio: [], json: [], files: [] });

assets.images;
assets.audio;
assets.json;
assets.files;
```

## run With Assets

```js
engine.run(() => {
    engine.scenes.add("game", new GameScene());
}, {
    images: [{ key: "player", src: "assets/player.png" }],
});
```
