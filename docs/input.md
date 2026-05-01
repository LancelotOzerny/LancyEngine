# Input

`engine.input` is an `InputSystem`.

## Keyboard

```js
input.isKeyDown("Space");     // held
input.isKeyPressed("Space");  // became down this logic step
input.isKeyReleased("Space"); // released this logic step
```

Old keyboard API is preserved.

## Actions

Available since v2.

```js
input.mapAction("jump", ["Space", "KeyW"]);

if (input.isActionPressed("jump")) {
    player.jump();
}
```

## Pointer

Pointer API supports mouse, pen and touch through Pointer Events.

```js
if (input.isPointerPressed(0)) {
    const screen = input.getPointerScreenPosition();
    const world = input.getPointerWorldPosition();
}

input.isPointerDown(0);
input.isPointerReleased(0);
input.getPointerDelta();
input.getPointerWheelDelta();
```

`getPointerWorldPosition()` uses `engine.screenToWorld()`, so camera and scale are considered.

## Touch Helpers

```js
input.getTouches();
input.getTouchCount();
input.isTouching();
input.wasTapped();
input.getSwipe();
```

Swipe shape:

```js
{
    active: true,
    direction: "left",
    distance: 120,
    start,
    end,
}
```

## Gamepad

```js
input.isGamepadButtonDown(0, 0);
input.isGamepadButtonPressed(0, 0);
input.isGamepadButtonReleased(0, 0);
input.getGamepadAxis(0, 0);
input.getConnectedGamepads();
```

The engine calls `updateGamepads()` during the fixed update loop.

## Virtual Controls

```js
input.addVirtualButton("jump", { x: 1100, y: 560, width: 96, height: 96 });
input.isVirtualButtonPressed("jump");

input.addVirtualJoystick("move", {
    x: 120,
    y: 600,
    radius: 72,
    followPointer: true,
});

const stick = input.getVirtualJoystick("move");
```

Virtual controls use screen coordinates and do not create DOM UI.
