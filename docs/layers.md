# Layers and Render Order

LancyEngine renders scene objects by layer order, then `zIndex`, then the order in which objects were added to the scene. Update order is unchanged.

Default layers:

```js
background: 0
default: 100
foreground: 200
effects: 300
ui: 1000
```

## Background Layer

```js
const scene = Engine.instance.scenes.get("level");

scene.createLayer("sky", {
    order: -100,
    parallaxX: 0.25,
    parallaxY: 0.25,
});

const sky = new GameObject();
sky.setLayer("sky");
sky.addComponent(new SpriteComponent({
    sprite: "sky",
    width: 2400,
    height: 1080,
}));

scene.gameObjects.add(sky);
```

## Player On Default Layer

```js
const player = new GameObject();
player.setLayer("default");
player.setZIndex(10);
scene.gameObjects.add(player);
```

## Particles On Effects Layer

```js
const particles = new GameObject();
particles.setLayer("effects");
particles.setZIndex(0);
scene.gameObjects.add(particles);
```

## UI On Screen Layer

Objects on the `ui` layer automatically use `renderMode = "screen"` unless you explicitly set another render mode.

```js
const score = new GameObject();
score.setLayer("ui");
score.transform.position.set(24, 24);
score.addComponent(new SpriteComponent({
    color: "#ffffff",
    width: 180,
    height: 48,
}));

scene.gameObjects.add(score);
```

Manual screen-space rendering is also available:

```js
const marker = new GameObject();
marker.setRenderMode("screen");
marker.setLayer("foreground");
scene.gameObjects.add(marker);
```

## zIndex Sorting

Higher `zIndex` values render later inside the same layer.

```js
backgroundTree.setLayer("default").setZIndex(-10);
player.setLayer("default").setZIndex(0);
frontGrass.setLayer("default").setZIndex(20);
```

## Debug Render List

```js
const renderList = scene.getRenderList();
console.table(renderList.map(object => ({
    name: object.name,
    layer: object.layer,
    zIndex: object.zIndex,
    renderMode: object.renderMode,
})));
```
