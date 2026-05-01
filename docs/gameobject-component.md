# GameObject And Components

## Создание объекта

```js
const player = new GameObject();
player.name = "Player";
player.transform.position.set(120, 300);
scene.gameObjects.add(player);
```

## Transform

Каждый `GameObject` получает `TransformComponent` автоматически:

```js
player.transform.position.set(100, 200);
player.transform.translate(10, 0);
player.transform.rotation = 15;
```

## Components

```js
const sprite = player.addComponent(new SpriteComponent({
    color: "#22c55e",
    width: 48,
    height: 48,
}));
```

`bindComponent(component)` - совместимый alias вокруг `addComponent`.

## findComponent

```js
const sprite = player.findComponent(SpriteComponent);
```

## Custom Component

```js
class PlayerController extends BaseComponent {
    update(dt) {
        const input = Engine.instance.input;
        const move = Number(input.isKeyDown("ArrowRight")) - Number(input.isKeyDown("ArrowLeft"));
        this.parent.transform.position.x += move * 240 * dt;
    }
}

player.addComponent(new PlayerController());
```

## Render Order

```js
player.setLayer("default");
player.setZIndex(10);
player.setVisible(true);
player.setRenderMode("world"); // or "screen"
```

`visible = false` отключает render, но не update.

## Timers And Tweens

```js
player.delay(0.5, () => console.log("ready"));
player.tween(player.transform.position, { x: 500 }, 1.2, { easing: "easeOutQuad" });
```

Helpers ставят `owner: player`, поэтому таймеры/твины удаляются после `destroy()`.

## Destroy

```js
player.destroy();
```

Объект удаляется из `scene.gameObjects`, компоненты уничтожаются.

## Parent / Scene

После добавления в сцену:

```js
player.parent === scene;
```

У компонента:

```js
component.parent === player;
```
