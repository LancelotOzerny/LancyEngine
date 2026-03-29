class UiPanel
{
    #uiElements = [];

    constructor(name)
    {
        this.html = document.createElement('div');
        this.html.className = 'ui-panel';
        this.html.id = name;
        document.body.append(this.html);
    }

    createButton(options = {})
    {
        let element = new UiButton(this, options);
        this.#uiElements.push(element);
        return element;
    }

    createText(options = {})
    {
        let element = new UiText(this, options);
        this.#uiElements.push(element);
        return element;
    }

    createImage(options = {})
    {
        let element = new UiImage(this, options);
        this.#uiElements.push(element);
        return element;
    }

    getHtml = () => this.html;
}