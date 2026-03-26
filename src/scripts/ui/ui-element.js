class UiElement
{
    x = 0;
    y = 0;

    constructor(panel, options = {
        selector: 'div',
        anchor: 'center center',
    })
    {
        this.options = options;
        this.ui_panel = panel;
        this.html = document.createElement(this.options.selector ?? 'div');
        this.options.additionalClasses = this.options.additionalClasses ?? '';
        this.options.baseClass = this.options.baseClass ?? '';
        this.html.classList = `${this.options.baseClass} ${this.options.additionalClasses}`;

        this.ui_panel.getHtml().append(this.html);

        this.setAnchors(this.options.anchors ?? 'center center');
        this.setPosition(this.options.x ?? 0, this.options.y ?? 0);
    }

    setPosition(x, y)
    {
        let xValue = x;
        let yValue = y;

        if (typeof(x) === 'number' || x[x.length - 1] !== '%') xValue += 'px';
        if (typeof(y) === 'number' || y[y.length - 1] !== '%') yValue += 'px';

        this.html.style.removeProperty('top');
        this.html.style.removeProperty('left');
        this.html.style.removeProperty('right');
        this.html.style.removeProperty('bottom');
        this.html.style.removeProperty('transform');

        if (this.anchors.horizonal === 'left') this.html.style.left = xValue;
        if (this.anchors.horizonal === 'right') this.html.style.right = xValue;
        if (this.anchors.horizonal === 'center')
        {
            this.html.style.left = `calc(50% + ${xValue})`;
            this.html.style.transform = `translateX(-50%)`;
        }

        if (this.anchors.vertical === 'top') this.html.style.top = yValue;
        if (this.anchors.vertical === 'bottom') this.html.style.bottom = yValue;
        if (this.anchors.vertical === 'center')
        {
            this.html.style.top = `calc(50% + ${yValue})`;
            this.html.style.transform += ` translateY(-50%)`;
        }
    }

    setAnchors(anchorsStr)
    {
        let [anchorHor, anchorVert] = anchorsStr.trim().split(' ');
        this.anchors = {
            horizonal: anchorHor,
            vertical: anchorVert
        }
    }
}