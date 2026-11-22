import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";

/**
 * @element oui-alert-description
 * @slot - The alert message (text, links, lists…).
 */
@customElement("oui-alert-description")
export class OuiAlertDescription extends OuiElement {
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
        "oui-alert-description": OuiAlertDescription;
    }
}
