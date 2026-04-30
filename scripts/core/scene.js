import { GameEntity } from "../common/game-entity.js";
import { GameCollection } from "./game-collection.js";

const DEFAULT_LAYERS = [
    { name: "background", order: 0, parallaxX: 1, parallaxY: 1 },
    { name: "default", order: 100, parallaxX: 1, parallaxY: 1 },
    { name: "foreground", order: 200, parallaxX: 1, parallaxY: 1 },
    { name: "effects", order: 300, parallaxX: 1, parallaxY: 1 },
    { name: "ui", order: 1000, parallaxX: 1, parallaxY: 1 },
];

export class Scene extends GameEntity
{
    gameObjects = new GameCollection(this, {
        onAttach: gameObject => this._onGameObjectAttached(gameObject),
        onDetach: gameObject => this._onGameObjectDetached(gameObject),
    });

    constructor()
    {
        super();

        this.layers = new Map();
        this._renderOrderCounter = 0;
        this._renderListDirty = true;
        this._sortedRenderList = [];

        DEFAULT_LAYERS.forEach(layer => this.createLayer(layer.name, layer));
    }

    init()
    {
        this.gameObjects.init();
    }

    start()
    {
        this.gameObjects.start();
    }

    update(deltaTime)
    {
        this.gameObjects.update(deltaTime);
    }

    render(ctx, renderMode = null, beforeRender = null)
    {
        if (typeof renderMode === "function")
        {
            beforeRender = renderMode;
            renderMode = null;
        }

        const renderList = this.getRenderList();

        renderList.forEach(gameObject =>
        {
            if (renderMode !== null && gameObject.renderMode !== renderMode)
            {
                return;
            }

            if (!this._isRenderable(gameObject))
            {
                return;
            }

            beforeRender?.(gameObject, this.resolveLayer(gameObject.layer));
            gameObject.render(ctx);
        });
    }

    renderWorld(ctx, renderer = null)
    {
        const renderList = this.getRenderList();
        let activeLayer = null;

        renderList.forEach(gameObject =>
        {
            if (gameObject.renderMode !== "world") return;
            if (!this._isRenderable(gameObject)) return;

            const layer = this.resolveLayer(gameObject.layer);

            if (renderer && layer !== activeLayer)
            {
                renderer(layer);
                activeLayer = layer;
            }

            gameObject.render(ctx);
        });
    }

    renderScreen(ctx)
    {
        this.render(ctx, "screen");
    }

    destroy()
    {
        this.gameObjects.destroy();
    }

    createLayer(name, options = {})
    {
        const layerName = String(name ?? "default");
        const existing = this.layers.get(layerName);
        const scene = this;

        const state = {
            name: layerName,
            order: options.order ?? existing?.order ?? 100,
            visible: options.visible ?? existing?.visible ?? true,
            parallaxX: options.parallaxX ?? existing?.parallaxX ?? 1,
            parallaxY: options.parallaxY ?? existing?.parallaxY ?? 1,
        };

        const layer = {
            name: state.name,
            get order() { return state.order; },
            set order(value)
            {
                state.order = Number(value) || 0;
                scene.markRenderListDirty();
            },
            get visible() { return state.visible; },
            set visible(value)
            {
                state.visible = Boolean(value);
                scene.markRenderListDirty();
            },
            get parallaxX() { return state.parallaxX; },
            set parallaxX(value)
            {
                state.parallaxX = Number(value);
                if (Number.isNaN(state.parallaxX)) state.parallaxX = 1;
            },
            get parallaxY() { return state.parallaxY; },
            set parallaxY(value)
            {
                state.parallaxY = Number(value);
                if (Number.isNaN(state.parallaxY)) state.parallaxY = 1;
            },
        };

        this.layers.set(layerName, layer);
        this.markRenderListDirty();
        return layer;
    }

    removeLayer(name)
    {
        const layerName = String(name);
        const removed = this.layers.delete(layerName);

        if (removed)
        {
            this.markRenderListDirty();
        }

        return removed;
    }

    setLayerOrder(name, order)
    {
        const layer = this.getLayer(name) ?? this.createLayer(name);
        layer.order = Number(order) || 0;
        this.markRenderListDirty();
        return layer;
    }

    getLayer(name)
    {
        return this.layers.get(String(name)) ?? null;
    }

    getLayers()
    {
        return [...this.layers.values()]
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }

    sortRenderList()
    {
        this._sortedRenderList = this.gameObjects.items
            .filter(gameObject => this._isRenderable(gameObject))
            .sort((a, b) =>
            {
                const layerA = this.resolveLayer(a.layer);
                const layerB = this.resolveLayer(b.layer);

                return layerA.order - layerB.order
                    || a.zIndex - b.zIndex
                    || this._getRenderOrder(a) - this._getRenderOrder(b);
            });

        this._renderListDirty = false;
        return this._sortedRenderList;
    }

    getRenderList()
    {
        if (this._renderListDirty)
        {
            this.sortRenderList();
        }

        return [...this._sortedRenderList];
    }

    markRenderListDirty()
    {
        this._renderListDirty = true;
    }

    resolveLayer(name)
    {
        return this.getLayer(name) ?? this.getLayer("default") ?? this.createLayer("default");
    }

    _onGameObjectAttached(gameObject)
    {
        if (!gameObject) return;

        gameObject._renderOrder = this._renderOrderCounter++;

        if (gameObject.layer === "ui" && !gameObject._renderModeExplicit)
        {
            gameObject.renderMode = "screen";
        }

        this.markRenderListDirty();
        gameObject.onAttach?.(this);

        // Architectural fix: objects added to an already-running scene must catch up lifecycle.
        if (this._isInitialized)
        {
            gameObject.init?.();
        }

        if (this._isStarted)
        {
            gameObject.start?.();
        }
    }

    _onGameObjectDetached(gameObject)
    {
        this.markRenderListDirty();
        gameObject?.onDetach?.(this);
    }

    _isRenderable(gameObject)
    {
        if (!gameObject) return false;
        if (!this.gameObjects.contains(gameObject)) return false;
        if (gameObject.visible === false) return false;
        if (gameObject._isDestroyed) return false;
        if (gameObject._isStarted === false) return false;

        const layer = this.resolveLayer(gameObject.layer);
        return layer.visible !== false;
    }

    _getRenderOrder(gameObject)
    {
        if (typeof gameObject._renderOrder !== "number")
        {
            gameObject._renderOrder = this._renderOrderCounter++;
        }

        return gameObject._renderOrder;
    }

    async preload(context) {}
    onEnter(previousScene, context) {}
    onExit(nextScene, context) {}
    onPause() {}
    onResume() {}
}
