document.addEventListener('DOMContentLoaded', async () => {
    let game = new Game();
    game.loadAssets({
        images: [
            'assets/sprites/sheep.webp',
        ]
    })
        .then(() => {
            game.init()
            game.start();
        });
});

class Hero extends GameObject
{
    init()
    {
        this.sprite = new SpriteComponent({
            sprite: 'sheep',
            width: 256,
            height: 256
        });
        this.sprite.color = 'rgba(255, 255, 0, 1)';
        this.bindComponent(this.sprite);

        super.init();
    }

    moveSpeed = 1_000;
    moveX = 0;

    start()
    {
        super.start();
        this.transform.position.set(
            Engine.instance.canvas.width / 2 - this.sprite.width / 2,
            Engine.instance.canvas.height - this.sprite.height - 50
        )
    }

    update(deltaTime)
    {
        if (Engine.instance.input.isKeyDown('KeyD')) this.moveX = 1;
        else if (Engine.instance.input.isKeyDown('KeyA')) this.moveX = -1;
        else this.moveX = 0;

        if (this.transform.position.x > Engine.instance.options.width - this.sprite.width && this.moveX > 0 ||
            this.transform.position.x < 0 && this.moveX < 0)
        {
            this.moveX = 0;
        }

        this.transform.translate(this.moveX * this.moveSpeed * deltaTime, 0);
    }
}

class Game
{
    engine = Engine.instance;

    init()
    {
        /* HERO SET */
        let hero = new Hero();

        /* SCENE SET */
        let scene__main = new Scene();
        scene__main.gameObjects.append(hero);

        this.engine.scenes.append(scene__main);
        this.engine.init('#game-canvas');
    }

    async loadAssets(assets = {
        images: []
    })
    {
        let loadedAssets = await this.engine.assetLoader.loadImages(assets.images);
        Engine.instance.assets = loadedAssets;
    }

    start()
    {
        this.engine.startGameLoop();
    }
}