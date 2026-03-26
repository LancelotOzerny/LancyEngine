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

let enemyMoveDirection = 1;
let newEnemyMoveDirection = 1;

let score = 0;

let ui = new UiPanel();
let scoreText = ui.createText({
    anchors: 'left bottom',
    x: 50,
    y: 50,
    text: 'Счет: ' + score,
    additionalClasses: 'title upper warning'
})

class Game
{
    engine = Engine.instance;

    init()
    {
        /* HERO SET */
        let hero = new Hero();

        /* SCENE SET */
        let scene__main = new GameScene();
        scene__main.gameObjects.append(hero);


        for (let i = 0; i < 10; ++i)
        {
            for (let j = 0; j < 4; ++j)
            {
                let enemy = new Enemy();

                let enemyWidth = enemy.sprite.width + 15;
                let enemyOffset = (1920 - 10 * enemyWidth) / 2;

                enemy.transform.position.set(
                    i * enemyWidth + enemyOffset,
                    j * (enemy.sprite.height + 15) + 25
                );

                scene__main.gameObjects.append(enemy);
            }
        }

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

class GameScene extends Scene
{
    update(deltaTime)
    {
        enemyMoveDirection = newEnemyMoveDirection;
        super.update(deltaTime);
    }
}

class Hero extends GameObject
{
    init()
    {
        this.sprite = new SpriteComponent({
            sprite: 'sheep',
            width: 200,
            height: 200
        });
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

        if (Engine.instance.input.isKeyPressed('Space'))
        {
            let bullet = new Bullet();
            bullet.transform.position.set(
                this.transform.position.x + this.sprite.width / 2 - bullet.sprite.width / 2,
                this.transform.position.y - bullet.sprite.height / 2,
            );
            this.parent.gameObjects.append(bullet);
        }

        if (this.transform.position.x > Engine.instance.options.width - this.sprite.width && this.moveX > 0 ||
            this.transform.position.x < 0 && this.moveX < 0)
        {
            this.moveX = 0;
        }

        this.transform.translate(this.moveX * this.moveSpeed * deltaTime, 0);
    }
}

class Enemy extends GameObject
{
    speed = 0;

    constructor()
    {
        super();

        this.sprite = new SpriteComponent({
            width: 100,
            height: 100
        });
        this.sprite.color = 'red';
        this.bindComponent(this.sprite);
        this.bindComponent(new ColliderComponent());
    }

    update()
    {
        this.transform.translate(enemyMoveDirection * 5, 0);

        let posX = this.transform.position.x;
        let spriteWidth = this.sprite.width;
        let engineWidth = Engine.instance.canvas.width;

        if (posX + spriteWidth >= engineWidth && enemyMoveDirection > 0)
        {
            newEnemyMoveDirection = -1;
        }
        else if (posX < 0 && enemyMoveDirection < 0)
        {
            newEnemyMoveDirection = 1;
        }

        super.update();
    }
}

class Bullet extends GameObject
{
    speed = 10;
    init()
    {
        this.sprite = new SpriteComponent({
            width: 6,
            height: 12
        });
        this.bindComponent(this.sprite);

        this.collider = new ColliderComponent();
        this.bindComponent(this.collider);

        super.init();
    }

    update(deltaTime)
    {
        if (this.collider.isCollision)
        {
            this.collider.collision.parent.destroy();
            this.destroy();
            scoreText.text = `Счет: ${++score}`;
            return;
        }

        this.transform.translate(0, -this.speed);
        super.update(deltaTime);
    }
}