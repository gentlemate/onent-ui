import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";

/**
 * @element oui-toast-title
 * @slot - The toast title.
 */
@customElement("oui-toast-title")
export class OuiToastTitle extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
        `,
    ];

    override render() {
        return html`<div><slot></slot></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-toast-title": OuiToastTitle;
    }
}
