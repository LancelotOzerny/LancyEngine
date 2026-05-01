# v2 Features

## Input 2.0

Available since v2.

- keyboard compatibility: `isKeyDown`, `isKeyPressed`, `isKeyReleased`
- action mapping
- pointer/mouse/touch
- tap and swipe helpers
- Gamepad API
- virtual buttons and joystick

## Layers

Available since v2.

- `GameObject.layer`
- `GameObject.zIndex`
- `GameObject.visible`
- `GameObject.renderMode`
- scene layer order and parallax
- screen-space `ui` layer

## TileMap

Available since v2.

- `TileSet`
- `TileMap`
- `TileMapComponent`
- `TileMapColliderComponent`
- JSON map loading through `AssetLoader`

## Timers / Tweens

Available since v2.

- `engine.timers.setTimeout`
- `engine.timers.setInterval`
- `engine.timers.wait`
- `engine.tweens.to`
- `engine.tweens.from`
- easing, repeat, yoyo

## Particles

Available since v2.

- pooled `ParticleSystemComponent`
- bursts and looping emitters
- texture or shape particles
- world-space and local-space particles

## SaveManager

Planned. There is no built-in `SaveManager` class in the current codebase.

## Debug Tools

Planned. Current debug helpers are lightweight APIs such as `scene.getRenderList()` and collision query methods; there is no dedicated debug overlay/tool module yet.
