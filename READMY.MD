# LancyEngine: Полная Техническая Документация

## 1. Структура движка

Движок разделен на модули:

- `math`: математика (`Vector2`)
- `common`: базовые сущности и UI-абстракции
- `core`: цикл игры, сцены, объекты, загрузка ассетов, звук, ввод, коллизии
- `components`: компоненты ECS-подхода (transform, sprite, collider, physic, camera)
- `ui`: DOM-UI поверх canvas

## 2. Подключение и запуск

### 2.1 Порядок подключения бандлов

```html
<link rel="stylesheet" href="./engine/styles.min.css" />

<script src="./engine/math.min.js"></script>
<script src="./engine/common.min.js"></script>
<script src="./engine/core.min.js"></script>
<script src="./engine/components.min.js"></script>
<script src="./engine/ui.min.js"></script>
```

### 2.2 Базовый bootstrap

```js
const engine = Engine.instance;

engine.init("#game", {
    width: 1920,
    height: 1080,
    backgroundColor: "#0f1720",
    screenMode: "expand",
});

class MainScene extends Scene {
    init() {
        const player = new GameObject();
        player.bindComponent(new SpriteComponent({ width: 64, height: 64, color: "#22c55e" }));
        player.transform.setPosition(300, 300);
        this.gameObjects.append(player);
    }
}

engine.scenes.append(new MainScene());

engine.run(() => {
    console.log("Game started");
}, {
    images: [],
    audio: [],
});
```

## 3. Жизненный цикл

У всех игровых сущностей (`GameEntity`, `Scene`, `GameObject`, `BaseComponent`) используются единые методы:

- `init()` — первичная инициализация
- `start()` — запуск логики
- `update(deltaTime)` — апдейт логики
- `render(ctx)` — рендер
- `destroy()` — освобождение ресурсов

Внутри `Engine` цикл кадра:

1. логические апдейты по фиксированному шагу (`frameTime`, по умолчанию 60 FPS),
2. `CollisionSystem.instance.updateCollisions()`,
3. `renderFrame()`,
4. `InputSystem.update()` (очистка `pressed/released` после логического шага).

## 4. Полное описание классов

## 4.1 Math

### `Vector2` (`src/scripts/math/vector2.js`)

Назначение: вектор 2D для позиций, скоростей, смещений и интерполяции.

Ключевые методы:

- `set(x, y)`
- `clone()`
- `add(vector2)`
- `sub(vector2)`
- `mul(number | Vector2)`
- `length()`
- `normalize()`
- `distance(vector2)`
- `lerp(vector2, t)`

Пример:

```js
const velocity = new Vector2(10, -4);
velocity.normalize().mul(120); // нормализуем и масштабируем
```

## 4.2 Common

### `GameEntity` (`src/scripts/common/game-entity.js`)

Назначение: базовый абстрактный класс жизненного цикла для всех сущностей движка.

Особенности:

- содержит пустые методы `init/start/update/render/destroy`,
- используется как единый контракт для коллекций.

### `UiElement` (`src/scripts/common/ui-element.js`)

Назначение: базовый DOM-элемент UI с якорями, позиционированием и видимостью.

Ключевые возможности:

- создание `HTMLElement` по `params.selector`,
- классы: `baseClass` + `additionalClasses`,
- якоря: `setAnchors("left top" | "center center" | ...)`,
- позиция: `setPosition(x, y)`,
- флаги: `active`, `visible`,
- `getHtml()` возвращает DOM-узел.

Пример:

```js
const panel = new UiPanel("HUD");
const raw = new UiElement(panel, {
    selector: "div",
    baseClass: "debug-box",
    anchors: "left top",
    x: 10,
    y: 10,
});
```

### `UiTextElement` (`src/scripts/common/ui-text-element.js`)

Назначение: текстовый UI-элемент поверх `UiElement`.

Ключевые свойства:

- `text` getter/setter (`textContent` DOM-узла).

Пример:

```js
const t = new UiTextElement(panel, { selector: "p" });
t.text = "HP: 100";
```

## 4.3 Core

### `Engine` (`src/scripts/core/engine.js`)

Назначение: главный singleton движка (canvas, game loop, сцены, ассеты, ввод, звук, камера, адаптация экрана).

Ключевые поля:

- `scenes: GameCollection`
- `assetLoader`, `assets`, `audioAssets`
- `audioManager`, алиас `audio`
- `input`
- параметры экрана: `designWidth/designHeight`, `viewWidth/viewHeight`, `screenWidth/screenHeight`, `scale`
- камера: `camera`, `worldOffset`
- режимы: `screenMode` (`expand`/`contain`), `fitToWindow`, `autoResize`, `pixelArt`

Ключевые методы:

- `init(selector, params)`
- `resize()`, `updateView()`
- `setCameraPosition()`, `moveCamera()`, `centerCameraOn()`
- `worldToScreen()`, `screenToWorld()`
- `setResolution()`
- `run(prepareFunc, data)`
- `prepareData({ images, audio })`
- `stopGameLoop()`, `destroy()`
- `getViewRect()`
- `Engine.instance` (singleton getter)

Пример:

```js
Engine.instance.init("#game", { width: 1280, height: 720, screenMode: "contain" });
Engine.instance.run(() => {}, {
    images: ["./assets/player.png"],
    audio: ["./assets/music.mp3"],
});
```

### `GameCollection` (`src/scripts/core/game-collection.js`)

Назначение: универсальная коллекция игровых сущностей с каскадным вызовом lifecycle.

Ключевые методы:

- `append(item)`
- `remove(item)`
- `contains(item)`
- `init()/start()/update(deltaTime)/render(ctx)/destroy()`
- `Count` (getter количества элементов)

Особенность:

- при `append` назначает `item.parent = this.parent`, если `parent` у коллекции задан.

### `GameObject` (`src/scripts/core/gameobject.js`)

Назначение: игровая сущность в сцене (Entity в ECS), хост для компонентов.

Ключевые поля/методы:

- `transform` добавляется автоматически (`TransformComponent`)
- `components: GameCollection`
- `bindComponent(component)`
- `findComponent(ComponentClass)`
- lifecycle делегируется компонентам
- `destroy()` удаляет компоненты и себя из `parent.gameObjects`

Особенность:

- если `Engine.instance.isInitialized === true`, то в конструкторе сразу вызываются `init()` и `start()`.

Пример:

```js
class Player extends GameObject {
    constructor() {
        super();
        this.bindComponent(new SpriteComponent({ width: 64, height: 64, color: "#f59e0b" }));
    }
}
```

### `Scene` (`src/scripts/core/scene.js`)

Назначение: контейнер игровых объектов уровня/экрана.

Ключевые поля/методы:

- `gameObjects: GameCollection`
- `init/start/update/render` делегируются в `gameObjects`

Пример:

```js
class GameScene extends Scene {
    init() {
        const player = new Player();
        this.gameObjects.append(player);
    }
}
```

### `CollisionSystem` (`src/scripts/core/collision-system.js`)

Назначение: глобальная система проверки пересечений коллайдеров (AABB).

Ключевые методы:

- `append(collider)` / `remove(collider)`
- `shouldCheck(a, b)` с учетом `layer/mask/isEnabled`
- `getOverlaps(collider, posX, posY)` — список пересечений с деталями overlap
- `updateCollisions()` — массовое обновление массива `collisions` у каждого коллайдера

Использование:

- `ColliderComponent` сам регистрируется/удаляется в системе на `init/destroy`.
- обычно напрямую не вызывается, кроме спец-логики.

### `InputSystem` (`src/scripts/core/input-system.js`)

Назначение: ввод с клавиатуры.

Состояния:

- `keys` — удерживаемые клавиши
- `pressedKeys` — нажаты в этом шаге
- `releasedKeys` — отпущены в этом шаге

Ключевые методы:

- `isKeyDown(code)`
- `isKeyPressed(code)`
- `isKeyReleased(code)`
- `update()` (очистка pressed/released)

Особенность:

- блокирует стандартное поведение `Space` и стрелок.

Пример:

```js
const input = Engine.instance.input;
if (input.isKeyPressed("Space")) {
    // действие один раз на нажатие
}
```

### `AssetLoader` (`src/scripts/core/asset-loader.js`)

Назначение: загрузка image/audio ассетов в `Map`.

Ключевые поля:

- `assets` (совместимость со старыми местами, указывает на images),
- `images`, `audio`,
- `loadProgress`, `totalAssets`, `loadedAssets`.

Ключевые методы:

- `loadAssets({ images, audio })`
- `loadImages(imagePaths)`
- `loadAudio(audioPaths)`
- `loadImage(path)`
- `loadAudio(path)`
- `getAssetKey(path)` (имя файла без расширения)
- `getImage(key)`, `getAudio(key)`

Пример:

```js
await Engine.instance.prepareData({
    images: ["./assets/player.png"],
    audio: ["./assets/theme.mp3"],
});

const playerImage = Engine.instance.assets.get("player");
```

### `AudioManager` (`src/scripts/core/audio-manager.js`)

Назначение: управление каналами звука (`master`, `music`, `sfx`), громкостью, mute/pause, воспроизведением музыки и эффектов.

Ключевые методы:

- `setAudioAssets(map)`
- `playMusic(key, { loop, restart, volume, playbackRate })`
- `stopMusic(resetTime = true)`
- `playSfx(key, { loop, volume, playbackRate })`
- `stopSfx(resetTime = true)`
- `stopAll(resetTime = true)`
- `setVolume(channel, value)`, `getVolume(channel)`
- `mute(channel)`, `unmute(channel)`, `toggleMute(channel)`, `isMuted(channel)`
- `pause(channel)`, `resume(channel)`, `isPaused(channel)`

Пример:

```js
Engine.instance.audio.playMusic("theme", { loop: true, volume: 0.5 });
Engine.instance.audio.playSfx("jump", { volume: 0.8 });
```

### `BaseComponent` (`src/scripts/core/base-component.js`)

Назначение: базовый класс для всех компонентов ECS.

Ключевые свойства:

- `parent` (объект-владелец),
- `params` (набор параметров конструктора).

Особенность:

- `destroy()` удаляет компонент из `parent.components`.

### `EventSystem` (`src/scripts/core/event-system.js`)

Назначение: заготовка под событийную систему.

Текущее состояние:

- содержит только `#onKeyDownEvent = new Event('onKeyDown', );`,
- не используется остальным движком,
- API фактически не реализован.

## 4.4 Components

### `TransformComponent` (`src/scripts/components/transform-component.js`)

Назначение: позиция и поворот объекта.

Поля/методы:

- `position: Vector2`
- `rotation: number`
- `setPosition(x, y)`
- `translate(dx, dy)`

Пример:

```js
player.transform.setPosition(100, 200);
player.transform.translate(10, -5);
player.transform.rotation = 15;
```

### `SpriteComponent` (`src/scripts/components/sprite-component.js`)

Назначение: отрисовка спрайта или цветного прямоугольника.

Ключевые параметры конструктора:

- `sprite` — ключ ассета (имя файла без расширения),
- `width`, `height`,
- `color`.

Ключевые свойства:

- `alpha` (прозрачность),
- `blendMode` (режим наложения цвета),
- `offsetX`, `offsetY`,
- `width`, `height`.

Пример:

```js
obj.bindComponent(new SpriteComponent({
    sprite: "player", // загрузить через Engine.prepareData/run
    width: 96,
    height: 96,
}));
```

### `ColliderComponent` (`src/scripts/components/collider-component.js`)

Назначение: AABB-коллайдер, контакты, фильтрация слоев.

Ключевые параметры:

- `width`, `height`
- `offsetX`, `offsetY`
- `isTrigger`
- `isStatic`
- `isEnabled`
- `layer`
- `mask` (массив разрешенных слоев)

Ключевые данные:

- `collisions` — массив пересечений за текущий кадр
- `contacts` — детальная контактная информация
- `touching` — флаги сторон (`left/right/top/bottom`)
- `isCollision` / `collision` (геттеры)

Ключевые методы:

- `getBounds()`, `getOverlap()`, `checkCollision()`
- `canCollideWith(other)`
- `resetFrameState()`

Пример:

```js
const collider = new ColliderComponent({
    width: 48,
    height: 48,
    layer: 1,
    mask: [2, 3],
});
obj.bindComponent(collider);
```

### `PhysicComponent` (`src/scripts/components/physic-component.js`)

Назначение: интеграция движения, силы, гравитация, резолв столкновений по осям X/Y.

Ключевые параметры/поля:

- `gravityScale`
- `mass`
- `drag`
- `useGravity`
- `isGrounded`
- `velocity: Vector2`
- `force: Vector2`
- `prevPosition: Vector2`

Ключевые методы:

- `applyForce(x, y)`
- `update(dt)`
- `moveAxisX(dt, collider)`
- `moveAxisY(dt, collider)`

Поведение:

- если нет коллайдера или он trigger, объект просто двигается по скорости,
- при обычном коллайдере происходит осевой резолв и выставляются `touching`/`isGrounded`,
- trigger-контакты собираются отдельно.

Пример:

```js
const body = new PhysicComponent({ gravityScale: 2.0, drag: 0.15 });
player.bindComponent(body);
body.applyForce(1200, 0);
```

### `CameraComponent` (`src/scripts/components/camera-component.js`)

Назначение: следящая камера с сглаживанием, dead-zone, bounds и shake.

Ключевые параметры:

- `isMain`, `isEnabled`
- `target`
- `offsetX`, `offsetY`
- `smoothness`
- `deadZoneWidth`, `deadZoneHeight`
- `bounds: { left, top, right, bottom }`

Ключевые методы:

- `setTarget(target)`
- `setOffset(x, y)`
- `setBounds(left, top, right, bottom)`
- `clearBounds()`
- `setDeadZone(width, height)`
- `shake(duration, strength)`
- `snap()`
- `update(dt)`

Пример:

```js
const camObj = new GameObject();
camObj.bindComponent(new CameraComponent({
    isMain: true,
    target: player,
    smoothness: 10,
    deadZoneWidth: 320,
    deadZoneHeight: 180,
    bounds: { left: 0, top: 0, right: 5000, bottom: 2000 },
}));
scene.gameObjects.append(camObj);
```

## 4.5 UI

### `UiPanel` (`src/scripts/ui/ui-panel.js`)

Назначение: корневая панель UI (DOM-контейнер), добавляется в `document.body`.

Ключевые методы:

- `createButton(params)`
- `createText(params)`
- `createImage(params)`
- `hideToLeft()/hideToRight()/hideToBottom()/hideToTop()`
- `show()`

Сеттеры:

- `backgroundColor`
- `index` (`z-index`)

Пример:

```js
const hud = new UiPanel("HUD", { width: "100%", height: "100%" });
hud.backgroundColor = "transparent";
```

### `UiText` (`src/scripts/ui/ui-text.js`)

Назначение: текстовый элемент (`<p>`), наследник `UiTextElement`.

Параметры:

- `text`
- якоря и позиция из `UiElement`.

Пример:

```js
const scoreText = hud.createText({
    text: "Score: 0",
    anchors: "left top",
    x: 24,
    y: 20,
});
```

### `UiButton` (`src/scripts/ui/ui-button.js`)

Назначение: кнопка (`<button>`) для интерфейсных действий.

Параметры:

- `text`
- `click` callback.

Метод:

- `setClickAction(callback)`

Пример:

```js
hud.createButton({
    text: "Pause",
    anchors: "right top",
    x: 20,
    y: 20,
    click: () => Engine.instance.stopGameLoop(),
});
```

### `UiImage` (`src/scripts/ui/ui-image.js`)

Назначение: UI-картинка (`<img>`).

Параметры:

- `src`
- `width`
- `height`

Пример:

```js
hud.createImage({
    src: "./assets/logo.png",
    width: 180,
    height: 64,
    anchors: "center top",
    x: 0,
    y: 16,
});
```

## 5. Компоненты: какой, для чего, как использовать

### `TransformComponent`

Для чего:

- базовая пространственная трансформация объекта.

Как использовать:

```js
const obj = new GameObject();
obj.transform.setPosition(100, 100);
obj.transform.rotation = 45;
```

### `SpriteComponent`

Для чего:

- отображение сущности в Canvas.

Как использовать:

```js
obj.bindComponent(new SpriteComponent({
    width: 80,
    height: 80,
    color: "#38bdf8",
}));
```

или со спрайтом:

```js
obj.bindComponent(new SpriteComponent({ sprite: "hero" }));
```

### `ColliderComponent`

Для чего:

- детект пересечений, контактов и фильтрация по слоям.

Как использовать:

```js
obj.bindComponent(new ColliderComponent({
    width: 70,
    height: 70,
    layer: 1,
    mask: [2],
}));
```

Проверка:

```js
const col = obj.findComponent(ColliderComponent);
if (col.isCollision) {
    console.log(col.collision?.parent?.name);
}
```

### `PhysicComponent`

Для чего:

- движение по силам/скорости, гравитация, реакция на коллизии.

Как использовать:

```js
const body = new PhysicComponent({
    gravityScale: 1.5,
    drag: 0.1,
});
obj.bindComponent(body);

body.applyForce(0, -2200);
```

### `CameraComponent`

Для чего:

- следовать за целью, ограничивать видимую область, тряска камеры.

Как использовать:

```js
const camHost = new GameObject();
const camera = new CameraComponent({ target: player, isMain: true });
camHost.bindComponent(camera);
scene.gameObjects.append(camHost);

camera.shake(0.25, 12);
```

## 6. Практические примеры

### 6.1 Игрок с физикой и коллизией

```js
class Player extends GameObject {
    constructor() {
        super();
        this.name = "Player";

        this.bindComponent(new SpriteComponent({
            width: 56,
            height: 56,
            color: "#fbbf24",
        }));

        this.bindComponent(new ColliderComponent({
            width: 50,
            height: 50,
            offsetX: 3,
            offsetY: 3,
            layer: 1,
            mask: [2],
        }));

        this.body = new PhysicComponent({
            gravityScale: 2.2,
            drag: 0.1,
        });
        this.bindComponent(this.body);
    }

    update(dt) {
        super.update(dt);

        const input = Engine.instance.input;
        if (input.isKeyPressed("Space")) {
            this.body.velocity.y = -480;
        }
    }
}
```

### 6.2 Загрузка ассетов и звук

```js
await Engine.instance.run(() => {
    Engine.instance.audio.playMusic("theme", { loop: true, volume: 0.4 });
}, {
    images: ["./assets/player.png", "./assets/enemy.png"],
    audio: ["./assets/theme.mp3", "./assets/hit.wav"],
});
```

### 6.3 HUD поверх игры

```js
const hud = new UiPanel("HUD");
hud.backgroundColor = "transparent";

const hpText = hud.createText({
    text: "HP: 3",
    anchors: "left top",
    x: 16,
    y: 16,
});

hud.createButton({
    text: "Mute",
    anchors: "right top",
    x: 16,
    y: 16,
    click: () => Engine.instance.audio.toggleMute("master"),
});
```

## 7. Ограничения текущей реализации

- `EventSystem` пока не реализован как полноценный event bus.
- `CollisionSystem` работает с AABB (без SAT/rotation-collider физики).
- `UiElement.active` устанавливает `display: hidden` (не стандартное значение CSS, лучше использовать `visible` или кастомное управление `display`).
- Физика рассчитана на простой arcade-стиль, не на точную симуляцию.

## 8. Планы по расширению

- Добавить полноценный `EventSystem` (subscribe/emit/off).
- Добавить менеджер сцен (смена сцен, пауза сцены, unloading).
- Добавить анимационный компонент (спрайт-листы, state machine).
- Улучшить коллизии: continuous collision detection, отдельные broad-phase структуры.
- Добавить официальный Debug Overlay (collider bounds, velocity, fps, camera rect).
