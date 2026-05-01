# Collision

Collision is built around `ColliderComponent` and the global `CollisionSystem`.

## ColliderComponent

```js
object.addComponent(new ColliderComponent({
    width: 48,
    height: 48,
    bodyType: BodyType.DYNAMIC,
}));
```

If width/height are not provided, collider can infer size from `SpriteComponent`.

## AABB

Default shape is AABB:

```js
new ColliderComponent({ width: 64, height: 32 });
```

## Circle

```js
new ColliderComponent({
    shape: "circle",
    radius: 24,
});
```

## Body Types

```js
BodyType.STATIC
BodyType.DYNAMIC
BodyType.KINEMATIC
```

`PhysicComponent` works with dynamic colliders and resolves against other colliders.

## Triggers

```js
new ColliderComponent({
    isTrigger: true,
    width: 100,
    height: 100,
});
```

## Events

Methods can be defined on collider, game object, or another component on the same object:

```js
collisionEnter(other, pair) {}
collisionStay(other, pair) {}
collisionExit(other, pair) {}
triggerEnter(other, pair) {}
triggerStay(other, pair) {}
triggerExit(other, pair) {}
```

## Queries

```js
engine.collisionWorld.overlapBox(x, y, w, h);
engine.collisionWorld.overlapPoint(x, y);
engine.collisionWorld.overlapCircle(x, y, radius);
engine.collisionWorld.raycast(x, y, dx, dy, { maxDistance: 500 });
```

`CollisionSystem.instance` exposes the same query helpers.

## Best Practices

- Use static colliders for walls and floors.
- Use trigger colliders for coins, sensors and pickups.
- Use layer/mask fields to reduce unnecessary checks.
- For large tile levels, prefer `TileMapColliderComponent` instead of one collider per tile.
