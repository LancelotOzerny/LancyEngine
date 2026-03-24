class GameCollection
{
    #items = [];

    start = () => this.#items.forEach(item => item.start());
    update = (deltaTime) => this.#items.forEach(item => item.update(deltaTime));
    render = (ctx) => this.#items.forEach(item => item.render());

    append(item)
    {
        if (this.contains(item) === false)
        {
            this.#items.pop(item)
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