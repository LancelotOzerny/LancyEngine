# API Reference

This is a compact public API map for the current codebase.

## Engine

- `Engine.instance`
- `Engine.hasInstance`
- `init(selector, params)`
- `prepareData(data)`
- `run(prepareFunc, data)`
- `switchScene(sceneOrKey, options)`
- `pauseScene()`, `resumeScene()`, `toggleScenePause()`
- `showLoadingScreen(options)`, `hideLoadingScreen()`
- `setCameraPosition(x, y)`, `moveCamera(dx, dy)`, `centerCameraOn(x, y)`
- `worldToScreen(x, y)`, `screenToWorld(x, y)`, `getViewRect()`
- `destroy()`

Properties include `canvas`, `context`, `assets`, `audioAssets`, `jsonAssets`, `input`, `audio`, `events`, `collisionWorld`, `timers`, `tweens`, `scenes`.

## Scene

- `gameObjects`
- `init()`, `start()`, `update(dt)`, `render(ctx)`, `destroy()`
- `preload(context)`, `onEnter(previousScene, context)`, `onExit(nextScene, context)`
- `onPause()`, `onResume()`
- `createLayer`, `removeLayer`, `setLayerOrder`, `getLayer`, `getLayers`, `getRenderList`

## GameObject

- `name`
- `transform`
- `components`
- `layer`, `zIndex`, `visible`, `renderMode`
- `addComponent(component)`, `bindComponent(component)`
- `findComponent(ComponentClass)`
- `setLayer`, `setZIndex`, `setVisible`, `setRenderMode`
- `delay(seconds, callback, options)`, `tween(target, props, duration, options)`
- `init()`, `start()`, `update(dt)`, `render(ctx)`, `destroy()`

## BaseComponent

- `parent`
- `params`
- `onAttach(gameObject)`, `onDetach(gameObject)`
- lifecycle: `init`, `start`, `update`, `render`, `destroy`

## SpriteComponent

- constructor params: `sprite`, `width`, `height`, `color`
- `width`, `height`
- `offsetX`, `offsetY`
- `alpha`
- `blendMode`
- `setSourceRect(x, y, width, height)`
- `clearSourceRect()`

## AnimationComponent

- constructor params: `sprite`, `states`, `fps`, `frameWidth`, `frameHeight`, `columns`
- `play(stateName, options)`
- `setState(stateName, options)`
- `pause()`, `resume()`, `stop(options)`
- `setPlaybackRate(value)`
- `setParam(name, value)`, `getParam(name)`
- `getState()`

## ColliderComponent

- constructor params: `width`, `height`, `radius`, `shape`, `isTrigger`, `bodyType`, `layer`, `mask`
- `getBounds()`
- `checkCollision(other)`
- event methods: `collisionEnter/Stay/Exit`, `triggerEnter/Stay/Exit`
- state: `collisions`, `contacts`, `touching`

## PhysicComponent

- `velocity`
- `force`
- `gravityScale`, `mass`, `drag`, `useGravity`, `isGrounded`
- `applyForce(x, y)`

## CameraComponent

- constructor params: `target`, `offsetX`, `offsetY`, `smoothness`, `deadZoneWidth`, `deadZoneHeight`, `bounds`
- `setTarget(target)`, `setOffset(x, y)`
- `setBounds(left, top, right, bottom)`, `clearBounds()`
- `setDeadZone(width, height)`
- `shake(duration, strength)`
- `snap()`

## InputSystem

- keyboard: `isKeyDown`, `isKeyPressed`, `isKeyReleased`
- actions: `mapAction`, `unmapAction`, `isActionDown/Pressed/Released`
- pointer: `isPointerDown/Pressed/Released`, `getPointerScreenPosition`, `getPointerWorldPosition`, `getPointerDelta`, `getPointerWheelDelta`
- touch: `getTouches`, `getTouchCount`, `isTouching`, `wasTapped`, `getSwipe`
- gamepad: `isGamepadButtonDown/Pressed/Released`, `getGamepadAxis`, `getConnectedGamepads`
- virtual controls: `addVirtualButton`, `removeVirtualButton`, `isVirtualButtonDown/Pressed/Released`, `addVirtualJoystick`, `getVirtualJoystick`

## AssetLoader

- `loadAssets(data)`
- `loadImages(imagePaths)`, `loadAudio(audioPaths)`
- `getImage(key)`, `getAudio(key)`, `getJson(key)`, `getFile(key)`
- maps: `images`, `audio`, `json`, `files`

## AudioManager

- `playMusic(key, params)`, `stopMusic(resetTime)`
- `playSfx(key, params)`, `stopSfx(resetTime)`
- `stopAll(resetTime)`
- `setVolume(channel, value)`, `getVolume(channel)`
- `mute(channel)`, `unmute(channel)`, `toggleMute(channel)`
- `pause(channel)`, `resume(channel)`

## EventSystem

- `EventSystem.instance`
- `on(eventName, callback, options)`
- `once(eventName, callback, options)`
- `off(eventName, callback)`
- `emit(eventName, ...args)`
- `clear(eventName)`
- `listenerCount(eventName)`
- `hasListeners(eventName)`
