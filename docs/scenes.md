# Scenes

## Создание сцены

```js
class LevelScene extends Scene {
    start() {
        const player = new GameObject();
        this.gameObjects.add(player);
    }
}
```

## Регистрация

```js
engine.scenes.add("level1", new LevelScene());
```

Первая добавленная сцена становится активной по умолчанию.

## Переключение сцен

```js
await engine.switchScene("level1");
```

или:

```js
await engine.scenes.switchTo("level1");
```

## Preload

```js
class LevelScene extends Scene {
    async preload(context) {
        await context.engine.prepareData({
            images: [{ key: "hero", src: "assets/hero.png" }],
        });
    }
}
```

`preload` вызывается перед входом в сцену при переключении.

## onEnter / onExit

```js
onEnter(previousScene, context) {}
onExit(nextScene, context) {}
```

## Pause / Resume

```js
engine.pauseScene();
engine.resumeScene();
engine.toggleScenePause();
```

Pause останавливает `scene.update`, но глобальные timers/tweens по умолчанию продолжают обновляться.

## Loading Screen

```js
engine.showLoadingScreen({ text: "Loading..." });
engine.hideLoadingScreen();
```

`switchScene` может показывать loading screen автоматически через options.

## Layers

Сцена имеет слои `background`, `default`, `foreground`, `effects`, `ui`.

```js
scene.createLayer("far-bg", { order: -100, parallaxX: 0.25, parallaxY: 0.25 });
scene.setLayerOrder("effects", 500);
console.table(scene.getRenderList());
```
