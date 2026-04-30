# Timers And Tweens

LancyEngine has global managers on the engine instance:

```js
const engine = Engine.instance;

engine.timers.setTimeout(() => {}, 0.5);
engine.tweens.to(player.transform.position, { x: 500 }, 1.2);
```

Managers are updated by the engine fixed timestep. They do not create their own `requestAnimationFrame`.

## Delayed Spawn

```js
engine.timers.setTimeout(() => {
    const enemy = createEnemy();
    scene.gameObjects.add(enemy);
}, 1.5);
```

With an owner, the timer is removed automatically if the owner is destroyed:

```js
player.delay(0.35, () => {
    player.shoot();
});
```

## Repeating Enemy Spawn

```js
const spawnTimer = engine.timers.setInterval(() => {
    scene.gameObjects.add(createEnemy());
}, 2.0);

engine.timers.pause(spawnTimer);
engine.timers.resume(spawnTimer);
engine.timers.clear(spawnTimer);
```

## Tween UI Alpha

```js
engine.tweens.to(hudSprite, { alpha: 0 }, 0.4, {
    easing: "easeOutQuad",
    onComplete: () => {
        hudObject.setVisible(false);
    },
});
```

## Move Object

```js
engine.tweens.to(player.transform.position, { x: 500, y: 240 }, 1.2, {
    easing: "easeInOutCubic",
    owner: player,
});
```

`GameObject.tween()` sets the object as owner automatically:

```js
player.tween(player.transform.position, { x: 500 }, 1.2, {
    easing: "easeOutQuad",
});
```

## Yoyo Tween

```js
engine.tweens.to(coin.transform.position, { y: coin.transform.position.y - 16 }, 0.6, {
    easing: "easeInOutQuad",
    repeat: Infinity,
    yoyo: true,
    owner: coin,
});
```

## From Tween

```js
engine.tweens.from(panel.transform.position, { y: -120 }, 0.35, {
    easing: "easeOutBack",
});
```

## Clear Tweens By Target

```js
engine.tweens.clearTarget(player.transform.position);
```
