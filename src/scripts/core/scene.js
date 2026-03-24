class Scene extends GameActions
{
    gameObjects = [];
    addGameObject(obj)
    {
        this.gameObjects.push(obj);
    }

    start = () => this.gameObjects.forEach(item => item.start())
    update = () => this.gameObjects.forEach(item => item.update())
    render = (ctx) => this.gameObjects.forEach(item => item.render(ctx))
}