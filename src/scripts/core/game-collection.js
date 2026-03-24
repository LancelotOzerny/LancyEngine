class GameCollection
{
    #items = [];

    start()
    {
        this.#items.forEach(item =>
        {
            if (typeof item.start === 'function')
            {
                item?.start()
            }
        })
    }
    update(deltaTime)
    {
        this.#items.forEach(item =>
        {
            if (typeof item.update === 'function')
            {
                item?.update(deltaTime)
            }
        })
    }
    render(ctx)
    {
        this.#items.forEach(item =>
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
            this.#items.push(item)
        }
    }

    remove(item)
    {
        if (this.contains(item))
        {
            this.#items.pop(item)
        }
    }

    contains = (item) => this.#items.indexOf(item) !== -1;

    get Count()
    {
        return this.#items.length;
    }
}