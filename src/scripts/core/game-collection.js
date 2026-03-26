class GameCollection
{
    items = [];

    constructor(parent = null)
    {
        if (parent) this.parent = parent;
    }

    init()
    {
        this.items.forEach(item =>
        {
            if (typeof item.init === 'function')
            {
                item?.init()
            }
        })
    }

    destroy()
    {
        this.items.forEach(item =>
        {
            if (typeof item.destroy === 'function')
            {
                item?.destroy()
            }
        })
    }

    start()
    {
        this.items.forEach(item =>
        {
            if (typeof item.start === 'function')
            {
                item?.start()
            }
        })
    }
    update(deltaTime)
    {
        this.items.forEach(item =>
        {
            if (typeof item.update === 'function')
            {
                item?.update(deltaTime)
            }
        })
    }
    render(ctx)
    {
        this.items.forEach(item =>
        {
            if (typeof item.render === 'function')
            {
                item?.render(ctx)
            }
        })
    }

    append(item)
    {
        if (this.contains(item) === false)
        {
            this.items.push(item);
            if (typeof(this.parent) !== 'undefined')
            {
                item.parent = this.parent;
            }
        }
    }

    remove(item)
    {
        const index = this.items.indexOf(item);
        if (index !== -1) this.items.splice(index, 1);
    }

    contains = (item) => this.items.indexOf(item) !== -1;

    get Count()
    {
        return this.items.length;
    }
}