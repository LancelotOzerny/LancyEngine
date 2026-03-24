class UiButton extends UiTextElement
{
    constructor(panel, options)
    {
        super(panel, {
            selector: 'button',
            baseClass: 'ui-btn',
            ...options
        });

        this.setClickAction(this.options.click ?? (()  => { console.log('Click!') }))
        this.html.textContent = this.options.text ?? 'Button';
    }

    setClickAction(callback)
    {
        this.html.onclick = callback;
    }
}