class GameObject extends GameEntity
{
    name = 'GameObject';
    components = new GameCollection();

    start = () => this.components.start();
    update = (deltaTime) => this.components.update(deltaTime);
    render = (ctx) => this.components.render(ctx);
}