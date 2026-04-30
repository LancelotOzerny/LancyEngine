import { GameEntity } from "../common/game-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { GameCollection } from "./game-collection.js";
import { Engine } from "./engine.js";

export class GameObject extends GameEntity
{
    name = 'GameObject';
    layer = "default";
    zIndex = 0;
    visible = true;
    renderMode = "world";
    _renderModeExplicit = false;

    components = new GameCollection(this, {
        onAttach: component => this._onComponentAttached(component),
        onDetach: component => this._onComponentDetached(component),
    });

    constructor()
    {
        super();

        this.transform = new TransformComponent();
        this.bindComponent(this.transform);

        if (Engine.hasInstance && Engine.instance.isInitialized)
        {
            // Compatibility path for old behavior: object can still auto-initialize
            // when created after engine init, but lifecycle wrappers prevent duplicates.
            this.init();
            this.start();
        }
    }

    setLayer(layerName)
    {
        this.layer = String(layerName ?? "default");

        if (this.layer === "ui" && !this._renderModeExplicit)
        {
            this.renderMode = "screen";
        }

        this.parent?.markRenderListDirty?.();
        return this;
    }

    setZIndex(value)
    {
        this.zIndex = Number(value) || 0;
        this.parent?.markRenderListDirty?.();
        return this;
    }

    setVisible(value)
    {
        this.visible = Boolean(value);
        this.parent?.markRenderListDirty?.();
        return this;
    }

    setRenderMode(mode)
    {
        if (mode !== "world" && mode !== "screen")
        {
            throw new Error(`Unsupported renderMode "${mode}". Use "world" or "screen".`);
        }

        this.renderMode = mode;
        this._renderModeExplicit = true;
        this.parent?.markRenderListDirty?.();
        return this;
    }

    bindComponent(component)
    {
        return this.addComponent(component);
    }

    addComponent(component)
    {
        this.components.add(component);
        return component;
    }

    _onComponentAttached(component)
    {
        if (!component) return;

        component.onAttach?.(this);

        // Architectural fix: late-added components get missed lifecycle stages automatically.
        if (this._isInitialized)
        {
            component.init?.();
        }

        if (this._isStarted)
        {
            component.start?.();
        }
    }

    _onComponentDetached(component)
    {
        component?.onDetach?.(this);
    }

    findComponent(componentClass)
    {
        for (const item of this.components.items)
        {
            if (item instanceof componentClass)
            {
                return item;
            }
        }

        return null;
    }

    start()
    {
        this.components.start();
    }
    update(deltaTime) { this.components.update(deltaTime) }
    render(ctx) { this.components.render(ctx) }
    init() { this.components.init() }
    destroy()
    {
        this.components.destroy();
        this.parent?.gameObjects?.remove(this);
        super.destroy();
    }
}
