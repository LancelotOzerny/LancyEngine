class BaseComponent extends GameEntity
{
    parent = null;

    constructor(params = {})
    {
        super();
        this.params = params;
    }

    destroy()
    {
        this.parent?.components.remove(this);
        super.destroy();
    }
}