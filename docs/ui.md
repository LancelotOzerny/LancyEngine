# UI

LancyEngine has a small DOM UI layer in `scripts/ui` and Canvas screen-space rendering through `GameObject.renderMode`.

## UiPanel

```js
import { UiPanel } from "../scripts/ui/index.js";

const panel = new UiPanel("main-menu", {
    anchors: "left top",
});

panel.backgroundColor = "rgba(0,0,0,0.5)";
panel.index = 10;
```

## UiText

```js
const title = panel.createText({
    text: "LancyEngine",
    anchors: "center top",
    y: 32,
});

title.text = "Ready";
```

## UiButton

```js
panel.createButton({
    text: "Play",
    anchors: "center center",
    click: () => engine.switchScene("game"),
});
```

## UiImage

```js
panel.createImage({
    src: "assets/logo.png",
    width: 128,
    height: 128,
});
```

## Visibility

```js
panel.visible = false;
panel.active = false;
panel.show();
```

## Canvas Screen-Space UI

Available since v2 layers/renderMode:

```js
const hud = new GameObject();
hud.setLayer("ui"); // default renderMode becomes "screen"
hud.transform.position.set(24, 24);
hud.addComponent(new SpriteComponent({ color: "#ffffff", width: 160, height: 32 }));
scene.gameObjects.add(hud);
```

Screen-space objects are rendered without camera transform.
