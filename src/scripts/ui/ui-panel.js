class UiPanel extends UiElement
{
    #uiElements = [];

    constructor(name, params = {})
    {
        super(null, {
            selector: 'div',
            baseClass: 'ui-panel',
            anchors: 'left top',
            width: params.width ?? '100%',
            height: params.height ?? '100%',
            ...params
        });

        this.html.id = name ?? 'NoNamed';
        document.body.append(this.html);
    }

    createButton(params = {})
    {
        let element = new UiButton(this, params);
        this.#uiElements.push(element);
        return element;
    }

    createText(params = {})
    {
        let element = new UiText(this, params);
        this.#uiElements.push(element);
        return element;
    }

    createImage(params = {})
    {
        let element = new UiImage(this, params);
        this.#uiElements.push(element);
        return element;
    }

    hideToLeft() { console.log('toLeft'); this.html.style.right = '100%'; }
    hideToRight() { this.html.style.left = '100%'; }
    hideToBottom() { this.html.style.top = '100%'; }
    hideToTop() { this.html.style.bottom = '100%'; }

    show()
    {
        this.html.style.top = '0';
        this.html.style.bottom = '0';
        this.html.style.left = '0';
        this.html.style.right = '0';
    }

    set backgroundColor(value)
    {
        this.html.style.backgroundColor = value;
    }

    set index(value) { this.html.style.zIndex = value; }
}