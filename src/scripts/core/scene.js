class Scene extends GameEntity
{
    gameObjects = new GameCollection();
    start = () => this.gameObjects.start();
    update = (deltaTime) => this.gameObjects.update(deltaTime);
    render = (ctx) => this.gameObjects.render(ctx);
}