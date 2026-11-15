import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";
import type { OuiRadioElement } from "../../oui-radio-element.js";
import "./oui-radio-card.js";
import "./oui-radio.js";

export type OuiRadioGroupOrientation = "vertical" | "horizontal";

const layouts: Record<"radio" | "card", Record<OuiRadioGroupOrientation, string>> = {
    radio: {
        vertical: "flex-col items-start gap-3",
        horizontal: "flex-wrap gap-x-4 gap-y-3",
    },
    card: {
        vertical: "flex-col gap-3",
        horizontal: "flex-wrap gap-3",
    },
};

/**
 * @element oui-radio-group
 * @property name - Name submitted with the form.
 * @property value - Value of the checked `oui-radio` or `oui-radio-card`.
 * @property orientation - Radios stacked (`vertical`) or side by side (`horizontal`), wrapping on several lines if needed. Side by side, the `oui-radio-card` elements share the width equally.
 * @property disabled - Prevents user interaction.
 * @property required - Marks the group as required for form validation.
 * @property invalid - Marks the field as invalid without displaying a message.
 * @property focusTarget - The radio that receives the focus (read-only).
 * @slot - The `oui-radio` or `oui-radio-card` elements.
 * @fires input - The user checked another radio.
 * @fires change - The user checked another radio.
 * @csspart radios - The wrapper of the radios.
 */
@customElement("oui-radio-group")
export class OuiRadioGroup extends OuiElement {
    static formAssociated = true;
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
            :host([orientation="horizontal"]) ::slotted(oui-radio-card) {
                flex: 1;
            }
            :host([disabled]) {
                cursor: not-allowed;
            }
            :host([disabled]) [part="radios"] {
                pointer-events: none;
                opacity: 0.5;
            }
        `,
    ];

    @property({ reflect: true }) name = "";
    @property() value = "";
    @property({ reflect: true }) orientation: OuiRadioGroupOrientation = "vertical";
    @property({ type: Boolean, reflect: true }) disabled = false;
    @property({ type: Boolean, reflect: true }) required = false;
    @property({ type: Boolean, reflect: true }) invalid = false;

    @state() private hasCards = false;

    private internals = this.attachInternals();

    constructor() {
        super();
        this.internals.role = "radiogroup";
        this.addEventListener("click", (event) => {
            const radio = this.radioFrom(event.target);
            if (radio) this.select(radio);
        });
        this.addEventListener("keydown", (event) => this.onKeyDown(event));
    }

    private get radios() {
        return [...this.querySelectorAll<OuiRadioElement>(":scope > :is(oui-radio, oui-radio-card)")];
    }

    get focusTarget() {
        const enabled = this.radios.filter((radio) => !radio.disabled);
        return enabled.find((radio) => radio.value === this.value) ?? enabled[0];
    }

    private radioFrom(target: EventTarget | null) {
        const radio = target instanceof Element ? target.closest<OuiRadioElement>("oui-radio, oui-radio-card") : null;
        return radio && radio.parentElement === this && !radio.disabled && !this.disabled ? radio : null;
    }

    private select(radio: OuiRadioElement) {
        if (radio.value === this.value) return;
        this.value = radio.value;
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }

    private onKeyDown(event: KeyboardEvent) {
        const radio = this.radioFrom(event.target);
        if (!radio) return;
        const enabled = this.radios.filter((radio) => !radio.disabled);
        const index = enabled.indexOf(radio);
        const last = enabled.length - 1;
        const next: OuiRadioElement | undefined = {
            " ": radio,
            ArrowDown: enabled[index === last ? 0 : index + 1],
            ArrowRight: enabled[index === last ? 0 : index + 1],
            ArrowUp: enabled[index === 0 ? last : index - 1],
            ArrowLeft: enabled[index === 0 ? last : index - 1],
            Home: enabled[0],
            End: enabled[last],
        }[event.key];
        if (!next) return;
        event.preventDefault();
        next.focus();
        this.select(next);
    }

    private sync() {
        const target = this.focusTarget;
        for (const radio of this.radios) {
            radio.checked = radio.value === this.value;
            radio.invalid = this.invalid;
            radio.tabIndex = radio === target && !this.disabled ? 0 : -1;
        }
    }

    protected override updated() {
        this.sync();
        this.internals.setFormValue(this.value);
        if (this.required && !this.value)
            this.internals.setValidity({ valueMissing: true }, "Please select one of these options.", this.focusTarget);
        else this.internals.setValidity({});
        this.internals.ariaRequired = String(this.required);
        this.internals.ariaInvalid = String(this.invalid);
        this.internals.ariaDisabled = String(this.disabled);
        this.internals.ariaOrientation = this.orientation;
    }

    private onSlotChange() {
        this.hasCards = this.radios.some((radio) => radio.localName === "oui-radio-card");
        this.sync();
    }

    formResetCallback() {
        this.value = this.getAttribute("value") ?? "";
    }

    override render() {
        return html`<div part="radios" class="${layouts[this.hasCards ? "card" : "radio"][this.orientation]} flex">
            <slot @slotchange=${this.onSlotChange}></slot>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-radio-group": OuiRadioGroup;
    }
}
