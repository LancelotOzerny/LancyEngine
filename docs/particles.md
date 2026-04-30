# Particles

`ParticleSystemComponent` is a pooled Canvas particle emitter for arcade effects. Add it to a `GameObject`, then call `burst()` or let it emit over time.

```js
import { GameObject } from "../scripts/core/index.js";
import { ParticleSystemComponent } from "../scripts/components/index.js";
```

## Explosion

```js
const explosion = new GameObject();
explosion.transform.position.set(hitX, hitY);

const particles = explosion.addComponent(new ParticleSystemComponent({
    maxParticles: 120,
    emissionRate: 0,
    autoplay: false,
    lifetime: { min: 0.25, max: 0.75 },
    speed: { min: 120, max: 420 },
    angle: { min: 0, max: Math.PI * 2 },
    gravity: { x: 0, y: 240 },
    startSize: { min: 5, max: 16 },
    endSize: { min: 0, max: 0 },
    startColor: "#ffcc33",
    endColor: "#ff3344",
    blendMode: "lighter",
}));

scene.gameObjects.add(explosion);
particles.burst(80);
```

## Coin Burst

```js
const coinBurst = new GameObject();
coinBurst.transform.position.set(playerX, playerY);

coinBurst.addComponent(new ParticleSystemComponent({
    maxParticles: 40,
    emissionRate: 0,
    autoplay: false,
    lifetime: { min: 0.35, max: 0.8 },
    speed: { min: 80, max: 220 },
    angle: { min: -Math.PI, max: 0 },
    gravity: { x: 0, y: 500 },
    startSize: { min: 4, max: 8 },
    endSize: { min: 2, max: 4 },
    startColor: "#ffe66d",
    endColor: "#ff9f1c",
})).burst(24);
```

## Smoke

```js
const smoke = new GameObject();
smoke.transform.position.set(300, 520);

smoke.addComponent(new ParticleSystemComponent({
    maxParticles: 160,
    emissionRate: 35,
    duration: 1,
    looping: true,
    shape: "circle",
    radius: 12,
    lifetime: { min: 0.8, max: 1.6 },
    speed: { min: 20, max: 70 },
    angle: { min: -Math.PI * 0.85, max: -Math.PI * 0.15 },
    gravity: { x: 0, y: -30 },
    startSize: { min: 12, max: 24 },
    endSize: { min: 36, max: 60 },
    startAlpha: 0.35,
    endAlpha: 0,
    startColor: "#9aa0a6",
}));
```

## Trail

```js
const trail = player.addComponent(new ParticleSystemComponent({
    maxParticles: 80,
    emissionRate: 45,
    duration: 1,
    looping: true,
    worldSpace: true,
    lifetime: { min: 0.2, max: 0.45 },
    speed: { min: 10, max: 45 },
    angle: { min: Math.PI * 0.75, max: Math.PI * 1.25 },
    startSize: { min: 3, max: 8 },
    endSize: { min: 0, max: 0 },
    startAlpha: 0.7,
    endAlpha: 0,
    startColor: "#66ccff",
}));

trail.play();
```

## Texture Particles

Load an image into `engine.assets`, then pass its key:

```js
new ParticleSystemComponent({
    textureKey: "spark",
    blendMode: "lighter",
    startSize: { min: 8, max: 16 },
    endSize: { min: 0, max: 0 },
});
```

## Controls

```js
particles.play();
particles.pause();
particles.stop();
particles.stop(true);
particles.clear();
particles.emit(3);
particles.burst(30);
particles.getAliveCount();
```
