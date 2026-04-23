class GameEntity
{
    constructor()
    {
        this._isInitialized = false;
        this._isStarted = false;
        this._isDestroyed = false;

        this._wrapLifecycleMethods();
    }

    _wrapLifecycleMethods()
    {
        const initImpl = this.init;
        const startImpl = this.start;
        const destroyImpl = this.destroy;

        this.init = (...args) =>
        {
            if (this._isDestroyed || this._isInitialized)
            {
                return;
            }

            this._isInitialized = true;

            try
            {
                return initImpl.apply(this, args);
            }
            catch (error)
            {
                this._isInitialized = false;
                throw error;
            }
        };

        this.start = (...args) =>
        {
            if (this._isDestroyed || this._isStarted)
            {
                return;
            }

            this.init();
            this._isStarted = true;

            try
            {
                return startImpl.apply(this, args);
            }
            catch (error)
            {
                this._isStarted = false;
                throw error;
            }
        };

        this.destroy = (...args) =>
        {
            if (this._isDestroyed)
            {
                return;
            }

            this._isDestroyed = true;
            return destroyImpl.apply(this, args);
        };
    }

    init() {}
    start() {}
    update(deltaTime) {}
    render(ctx) {}
    destroy() {}
}
