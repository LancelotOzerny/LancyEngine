# TileMap

Tile maps are built from a `TileMap`, one or more `TileSet` objects, a `TileMapComponent` for rendering, and an optional `TileMapColliderComponent` for platformer-style solid tiles.

## Loading Assets

```js
await Engine.instance.prepareData({
    images: [
        { key: "tiles", src: "assets/tiles.png" },
    ],
    json: [
        { key: "level1", src: "assets/level1.json" },
    ],
});
```

## Level JSON

```json
{
  "tileWidth": 32,
  "tileHeight": 32,
  "width": 100,
  "height": 20,
  "tilesets": [
    {
      "name": "main",
      "imageKey": "tiles",
      "tileWidth": 32,
      "tileHeight": 32,
      "columns": 8
    }
  ],
  "layers": [
    {
      "name": "background",
      "visible": true,
      "collision": false,
      "data": [0, 0, 1, 2]
    },
    {
      "name": "solid",
      "visible": true,
      "collision": true,
      "data": [1, 1, 1, 1]
    }
  ]
}
```

`tileId = 0` is empty and is not rendered or treated as solid.

## Creating A TileMap

```js
import { Engine, GameObject, Scene, TileMap } from "../scripts/core/index.js";
import { TileMapColliderComponent, TileMapComponent } from "../scripts/components/index.js";

const levelData = Engine.instance.jsonAssets.get("level1");
const tileMap = TileMap.fromJSON(levelData, {
    images: Engine.instance.assets,
});

const mapObject = new GameObject();
mapObject.name = "Level";
mapObject.setLayer("background");
mapObject.setZIndex(-100);
mapObject.addComponent(new TileMapComponent({
    tileMap,
    layerNames: ["background", "solid"],
}));
mapObject.addComponent(new TileMapColliderComponent({
    tileMap,
    layerNames: ["solid"],
}));

scene.gameObjects.add(mapObject);
```

## Solid Tile Queries

```js
const tileCollider = mapObject.findComponent(TileMapColliderComponent);

if (tileCollider.isSolidAtWorld(playerX, playerY + 48)) {
    console.log("ground below player");
}
```

## Platformer AABB Resolution

`resolveAABB(rect, velocity)` expects a movement delta for the current frame.

```js
const rect = {
    x: player.transform.position.x,
    y: player.transform.position.y,
    width: 32,
    height: 48,
};

const movement = {
    x: physics.velocity.x * deltaTime,
    y: physics.velocity.y * deltaTime,
};

const result = tileCollider.resolveAABB(rect, movement);

player.transform.position.set(result.rect.x, result.rect.y);
physics.velocity.x = result.velocity.x === 0 ? 0 : physics.velocity.x;
physics.velocity.y = result.velocity.y === 0 ? 0 : physics.velocity.y;
physics.isGrounded = result.touching.bottom;
```

## Render Culling

`TileMapComponent` only renders tiles inside the active camera view. A 100x100 map does not draw all 10,000 tiles every frame.
