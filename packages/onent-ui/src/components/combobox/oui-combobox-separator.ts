import { css } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiMenuSeparatorElement } from "../../oui-menu-separator-element.js";

/**
 * @element oui-combobox-separator
 * @csspart line - The separator line.
 */
@customElement("oui-combobox-separator")
export class OuiComboboxSeparator extends OuiMenuSeparatorElement {
    static override styles = [
        OuiMenuSeparatorElement.styles,
        css`
            :host([hidden]) {
                display: none;
            }
        `,
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-combobox-separator": OuiComboboxSeparator;
    }
}
