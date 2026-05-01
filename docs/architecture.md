# Architecture

## Engine

`Engine.instance` управляет canvas, fixed timestep, рендером, сценами и общими системами:

- `engine.input`
- `engine.audio`
- `engine.events`
- `engine.collisionWorld`
- `engine.timers`
- `engine.tweens`
- `engine.assets`, `engine.audioAssets`, `engine.jsonAssets`

`Engine.update(dt)` обновляет timers/tweens, затем активную сцену. Это значит, что delayed callbacks и tween values видны gameplay-коду в том же fixed step.

## SceneManager

`engine.scenes` регистрирует и переключает сцены:

```js
engine.scenes.add("menu", new MenuScene());
engine.switchScene("menu");
```

Менеджер умеет pause/resume, loading screen и lazy lifecycle активной сцены.

## Scene

`Scene` содержит `gameObjects` и lifecycle hooks:

- `preload(context)`
- `onEnter(previousScene, context)`
- `onExit(nextScene, context)`
- `onPause()`
- `onResume()`

Сцена также управляет render layers: `background`, `default`, `foreground`, `effects`, `ui`.

## GameObject

`GameObject` содержит:

- `transform`
- `components`
- `layer`, `zIndex`, `visible`, `renderMode`

Методы: `addComponent`, `bindComponent`, `findComponent`, `destroy`, `delay`, `tween`.

## Component

Компонент наследуется от `BaseComponent` и получает `parent` при добавлении в объект.

```js
class PlayerController extends BaseComponent {
    update(dt) {}
}
```

## AssetLoader

Загружает `images`, `audio`, `json`, `files`. `SpriteComponent` ищет изображения в `Engine.instance.assets`.

## InputSystem

Keyboard API совместим со старым кодом: `isKeyDown`, `isKeyPressed`, `isKeyReleased`. В v2 добавлены actions, pointer/touch, gamepad и virtual controls.

## CollisionSystem

Глобальная collision world работает с `ColliderComponent`. Поддержаны AABB, Circle, triggers, overlap/raycast queries.

## AudioManager

Работает с каналами `master`, `music`, `sfx`: play, stop, pause, resume, volume, mute.

## UI

DOM UI живет в `scripts/ui`: `UiPanel`, `UiButton`, `UiText`, `UiImage`. Canvas screen-space UI можно делать через `GameObject.renderMode = "screen"` или слой `ui`.

## Lifecycle

- `init()` - подготовка объекта/компонента.
- `start()` - первый запуск после init.
- `update(dt)` - логический fixed update.
- `render(ctx)` - Canvas render.
- `destroy()` - очистка и отвязка.

Lifecycle обернут в `GameEntity`: повторные `init/start/destroy` защищены от дублей.
