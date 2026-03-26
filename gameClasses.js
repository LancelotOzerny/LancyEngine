class GroundBlock extends GameObject
{
    constructor()
    {
        super();

        this.sprite = new SpriteComponent({
            width: params.blockSize,
            height: params.blockSize,
        });
        this.sprite.color = 'black';
        this.bindComponent(this.sprite);
    }
}

class Player extends GameObject
{
    ui = new UiPanel();

    constructor()
    {
        super();

        this.text = this.ui.createText({
            content: 'Test Out',
            anchors: 'right top',
            x: 50,
            y: 50,
            additionalClasses: 'upper'
        })

        this.sprite = new SpriteComponent({
            width: 100,
            height: 100
        });

        this.sprite.color = 'gray';
        this.transform.position.set(100, 1080 - this.sprite.height * 2);
        this.bindComponent(this.sprite);

        this.collider = new ColliderComponent();
        this.bindComponent(this.collider);

        this.physic = new PhysicComponent();
        this.bindComponent(this.physic);
    }

    update(deltaTime)
    {
        this.text.text = `Colliders count: ${this.collider.collisions.length}`;
        super.update(deltaTime);
    }
}