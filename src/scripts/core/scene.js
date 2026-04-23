class Scene extends GameEntity
{
    gameObjects = new GameCollection(this, {
        onAttach: gameObject => this._onGameObjectAttached(gameObject),
        onDetach: gameObject => this._onGameObjectDetached(gameObject),
    });

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

    render(ctx)
    {
        this.gameObjects.render(ctx);
    }

    destroy()
    {
        this.gameObjects.destroy();
    }

    _onGameObjectAttached(gameObject)
    {
        if (!gameObject) return;

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
        gameObject?.onDetach?.(this);
    }

    async preload(context) {}
    onEnter(previousScene, context) {}
    onExit(nextScene, context) {}
    onPause() {}
    onResume() {}
}
