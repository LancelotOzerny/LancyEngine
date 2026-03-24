class GameObject extends GameActions
{
    name = 'GameObject';
    components = []; // Массив компонентов

    addComponent(component)
    {
        component.gameObject = this; // Связываем компонент с GameObject
        this.components.push(component);
        return component;
    }

    getComponent(componentClass)
    {
        return this.components.find(comp => comp instanceof componentClass);
    }

    start()
    {
        this.components.forEach(component => component.start?.());
    }

    update(deltaTime)
    {
        this.components.forEach(component => component.update?.(deltaTime));
    }

    render(ctx)
    {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, this.frameWidth, this.frameHeight);

        console.log('Sprite dimensions:', this.spriteSheet.width, 'x', this.spriteSheet.height);
        console.log('Frame dimensions:', this.frameWidth, 'x', this.frameHeight);


        console.log('Rendering at:', this.position.x, this.position.y);

        this.components.forEach(component => component.render?.(ctx));
    }
}