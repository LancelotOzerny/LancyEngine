# Camera

`CameraComponent` moves `Engine.instance.camera`.

## Follow Target

```js
const cameraObject = new GameObject();
cameraObject.addComponent(new CameraComponent({
    target: player,
    smoothness: 8,
}));
scene.gameObjects.add(cameraObject);
```

If `target` is not set, camera follows its parent object.

## Offset

```js
camera.setOffset(0, -80);
```

## Bounds

```js
camera.setBounds(0, 0, 3000, 720);
camera.clearBounds();
```

## Dead Zone

```js
camera.setDeadZone(240, 120);
```

The camera moves only when the target leaves the dead zone.

## Shake

```js
camera.shake(0.25, 12);
```

## Engine Camera Helpers

```js
engine.setCameraPosition(0, 0);
engine.moveCamera(10, 0);
engine.centerCameraOn(playerX, playerY);
```

## Coordinate Conversion

```js
const screen = engine.worldToScreen(worldX, worldY);
const world = engine.screenToWorld(screenX, screenY);
```

These helpers account for camera, scale and contain-mode screen offset.
