class GameObject extends GameEntity
{
    name = 'GameObject';
    components = new GameCollection();

    constructor()
    {
        super();
        this.transform = new TransformComponent();
        this.bindComponent(this.transform);
    }

    bindComponent(component)
    {
        component.parent = this;
        this.components.append(component);
    }

    start()
    {
        this.components.start();
    }
    update(deltaTime) { this.components.update(deltaTime) }
    render(ctx) { this.components.render(ctx) }
    init() { this.components.init() }
}