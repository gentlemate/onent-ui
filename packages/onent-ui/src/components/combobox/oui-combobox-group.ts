import { css } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiMenuGroupElement } from "../../oui-menu-group-element.js";

/**
 * @element oui-combobox-group
 * @slot - The grouped `oui-combobox-option` elements.
 * @csspart label - The group heading, rendered when `label` is set.
 */
@customElement("oui-combobox-group")
export class OuiComboboxGroup extends OuiMenuGroupElement {
    static override styles = [
        OuiMenuGroupElement.styles,
        css`
            :host([hidden]) {
                display: none;
            }
        `,
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-combobox-group": OuiComboboxGroup;
    }
}
