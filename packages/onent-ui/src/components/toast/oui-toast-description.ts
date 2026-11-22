import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";

/**
 * @element oui-toast-description
 * @slot - The toast message (text, links, lists…).
 */
@customElement("oui-toast-description")
export class OuiToastDescription extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
        `,
    ];

    override render() {
        return html`<div class="text-current/70"><slot></slot></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-toast-description": OuiToastDescription;
    }
}
