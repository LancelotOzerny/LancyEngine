class UiText extends UiTextElement
{
    constructor(panel, options = {})
    {
        super(panel, {
            selector: 'p',
            baseClass: 'ui-text',
            ...options
        });

        this.html.textContent = this.options.text ?? 'Simple Text';
    }
}