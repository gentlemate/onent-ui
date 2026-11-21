import type { Placement } from "@floating-ui/dom";
import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { ChevronDown, X } from "lucide";
import { FloatingController } from "../../controllers/floating-controller.js";
import { ListNavigation } from "../../controllers/list-navigation.js";
import { OuiElement } from "../../oui-element.js";
import { OuiOverlayElement } from "../../oui-overlay-element.js";
import "../badge/oui-badge.js";
import "../icon/oui-icon.js";
import "./oui-combobox-group.js";
import "./oui-combobox-separator.js";
import { OuiComboboxOption } from "./oui-combobox-option.js";

export type OuiComboboxPlacement = Placement;

/**
 * @element oui-combobox
 * @property name - Name submitted with the form.
 * @property value - Value of the selected option, or the array of selected values when `multiple` is set.
 * @property query - Text typed to filter the options.
 * @property placeholder - Text shown when nothing is selected or typed.
 * @property placement - Position of the listbox relative to the field.
 * @property distance - Gap in pixels between the field and the listbox.
 * @property multiple - Allows selecting several options, shown as tags in the field.
 * @property ignoreFilter - Shows every option whatever the query, to filter them yourself.
 * @property allowCustomValue - Accepts the typed text as a value, even if no option matches it.
 * @property openOnFocus - Opens the listbox when the field gets the focus.
 * @property emptyText - Message shown when no option matches the query, unless the `empty` slot is filled.
 * @property disabled - Prevents user interaction.
 * @property required - Marks the field as required for form validation.
 * @property invalid - Marks the field as invalid without displaying a message.
 * @property ariaLabel - Accessible name of the field, set with the `aria-label` attribute.
 * @property focusTarget - The inner element that receives the focus (read-only).
 * @slot - The `oui-combobox-option`, `oui-combobox-group` and `oui-combobox-separator` elements.
 * @slot empty - Content shown when no option matches the query, in place of `emptyText`.
 * @fires input - The user changed the selection.
 * @fires change - The user changed the selection.
 * @fires oui-search - The user changed the query.
 * @fires oui-show - The listbox is about to open. Cancelable.
 * @fires oui-after-show - The listbox is open and its enter animation finished.
 * @fires oui-hide - The listbox is about to close. Cancelable.
 * @fires oui-after-hide - The listbox is closed and its exit animation finished.
 * @cssprop [--oui-height-combobox=var(--oui-height-field)] - Minimum height of the field.
 * @cssprop [--oui-spacing-combobox=var(--oui-spacing-field)] - Horizontal padding of the field.
 * @cssprop [--oui-radius-combobox=var(--oui-radius-field)] - Border radius of the field.
 * @csspart field - The box holding the tags, the input and the chevron.
 * @csspart control - The inner `<input>` element.
 * @csspart tag - The `oui-badge` of a selected value, when `multiple` is set.
 * @csspart tag-remove - The button removing a tag.
 * @csspart chevron - The button toggling the listbox.
 * @csspart popup - The listbox panel.
 * @csspart empty - The wrapper of the `empty` slot.
 */
@customElement("oui-combobox")
export class OuiCombobox extends OuiOverlayElement {
    static formAssociated = true;
    static override shadowRootOptions: ShadowRootInit = { ...OuiElement.shadowRootOptions, delegatesFocus: true };
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
            oui-badge::part(base) {
                background-color: var(--color-background);
            }
        `,
    ];

    @property({ reflect: true }) name = "";
    @property() value: string | string[] = "";
    @property() query = "";
    @property() placeholder = "";
    @property({ reflect: true }) placement: OuiComboboxPlacement = "bottom-start";
    @property({ type: Number }) distance = 4;
    @property({ type: Boolean, reflect: true }) multiple = false;
    @property({ type: Boolean, attribute: "ignore-filter" }) ignoreFilter = false;
    @property({ type: Boolean, attribute: "allow-custom-value" }) allowCustomValue = false;
    @property({ type: Boolean, attribute: "open-on-focus" }) openOnFocus = false;
    @property({ attribute: "empty-text" }) emptyText = "No results.";
    @property({ type: Boolean, reflect: true }) disabled = false;
    @property({ type: Boolean, reflect: true }) required = false;
    @property({ type: Boolean, reflect: true }) invalid = false;
    @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

    @query("#control") focusTarget!: HTMLInputElement;
    @query("#field") private field!: HTMLElement;
    @query("#popup") protected overlay!: HTMLElement;

    @state() private highlighted?: OuiComboboxOption;
    @state() private searching = false;

    private hasResults = true;
    private openOnMouseDown = false;
    private internals = this.attachInternals();
    private navigation = new ListNavigation(
        () => this.visibleOptions,
        (option) => option.label,
    );
    private observer = new MutationObserver(() => this.requestUpdate());

    private floating = new FloatingController(this, () => ({
        anchor: this.field,
        floating: this.overlay,
        placement: this.placement,
        distance: this.distance,
        fit: true,
        matchWidth: true,
    }));

    override connectedCallback() {
        super.connectedCallback();
        this.observer.observe(this, {
            subtree: true,
            childList: true,
            characterData: true,
            attributeFilter: ["value", "disabled"],
        });
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this.observer.disconnect();
    }

    private get options() {
        return [...this.querySelectorAll("oui-combobox-option")];
    }

    private get visibleOptions() {
        return this.options.filter((option) => !option.hidden);
    }

    private get values() {
        if (Array.isArray(this.value)) return this.value;
        return this.value ? [this.value] : [];
    }

    private labelOf(value: string) {
        return this.options.find((option) => option.value === value)?.label ?? value;
    }

    private get displayText() {
        if (this.multiple || this.searching) return this.query;
        const [value] = this.values;
        if (value === undefined) return "";
        const option = this.options.find((option) => option.value === value);
        return option ? option.label : this.allowCustomValue ? value : "";
    }

    private optionFrom(target: EventTarget | null) {
        return target instanceof Element ? (target.closest("oui-combobox-option") ?? undefined) : undefined;
    }

    private commit(value: string | string[]) {
        const next = Array.isArray(value) ? value : value ? [value] : [];
        const current = this.values;
        if (next.length === current.length && next.every((item, index) => item === current[index])) return;
        this.value = value;
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }

    private resetQuery() {
        this.searching = false;
        this.query = "";
    }

    private select(option: OuiComboboxOption) {
        if (option.disabled) return;
        this.resetQuery();
        if (!this.multiple) {
            this.commit(option.value);
            return this.hide();
        }
        const values = this.values;
        this.commit(
            values.includes(option.value)
                ? values.filter((value) => value !== option.value)
                : [...values, option.value],
        );
    }

    private removeValue(value: string) {
        this.commit(this.values.filter((item) => item !== value));
    }

    private commitQuery() {
        const text = this.query.trim();
        if (!this.allowCustomValue || !text) return;
        this.resetQuery();
        if (!this.multiple) {
            this.commit(text);
            return this.hide();
        }
        if (!this.values.includes(text)) this.commit([...this.values, text]);
    }

    private settle() {
        if (this.searching && !this.multiple) {
            const text = this.query.trim();
            if (!text) this.commit("");
            else if (this.allowCustomValue) this.commit(text);
        }
        this.resetQuery();
    }

    private filter() {
        const text = this.searching && !this.ignoreFilter ? this.query.trim().toLowerCase() : "";
        for (const option of this.options) option.hidden = !option.label.toLowerCase().includes(text);
        for (const group of this.querySelectorAll("oui-combobox-group"))
            group.hidden = !group.querySelector("oui-combobox-option:not([hidden])");

        let separator: HTMLElement | undefined;
        let seen = false;
        for (const item of this.querySelectorAll<HTMLElement>("oui-combobox-option, oui-combobox-separator")) {
            if (item.localName === "oui-combobox-separator") {
                item.hidden = true;
                if (seen) separator = item;
            } else if (!item.hidden) {
                if (separator) separator.hidden = false;
                separator = undefined;
                seen = true;
            }
        }
        this.hasResults = this.options.some((option) => !option.hidden);
    }

    private initialHighlight() {
        const options = this.visibleOptions.filter((option) => !option.disabled);
        if (this.searching) return this.allowCustomValue ? undefined : options[0];
        const values = this.values;
        return options.find((option) => values.includes(option.value)) ?? options[0];
    }

    private onInput(event: Event) {
        event.stopPropagation();
        this.query = this.focusTarget.value;
        this.searching = true;
        this.emit("oui-search", false);
        this.show();
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.isComposing) return;
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
                event.preventDefault();
                if (!this.open) return this.show();
                this.highlighted = this.navigation.target(event, this.highlighted) ?? this.highlighted;
                return;
            case "Enter":
                if (!this.open) return this.internals.form?.requestSubmit();
                event.preventDefault();
                if (this.highlighted) return this.select(this.highlighted);
                return this.commitQuery();
            case "Escape":
                if (!this.open) return;
                event.preventDefault();
                event.stopPropagation();
                this.resetQuery();
                return this.hide();
            case "Backspace": {
                const last = this.values.at(-1);
                if (this.multiple && !this.focusTarget.value && last !== undefined) this.removeValue(last);
            }
        }
    }

    private onFocus() {
        if (this.openOnFocus) this.show();
    }

    private onControlClick() {
        if (this.openOnFocus) this.show();
    }

    private onFieldMouseDown(event: MouseEvent) {
        this.openOnMouseDown = this.open;
        if (this.disabled || event.composedPath()[0] === this.focusTarget) return;
        event.preventDefault();
        this.focusTarget.focus();
    }

    private onChevronClick(event: MouseEvent) {
        const wasOpen = event.detail > 0 ? this.openOnMouseDown : this.open;
        if (wasOpen) this.hide();
        else this.show();
    }

    private onPopupClick(event: MouseEvent) {
        const option = this.optionFrom(event.target);
        if (option) this.select(option);
    }

    private onPopupPointerMove(event: PointerEvent) {
        const option = this.optionFrom(event.target);
        if (option && !option.disabled && option !== this.highlighted) this.highlighted = option;
    }

    override show() {
        if (!this.disabled) super.show();
    }

    protected override present() {
        super.present();
        this.floating.start();
    }

    protected override dismiss() {
        super.dismiss();
        this.floating.stop();
    }

    protected override willUpdate(changed: PropertyValues<this>) {
        const closed = changed.has("open") && !this.open && changed.get("open") !== undefined;
        if (closed) this.settle();
        this.filter();

        const highlighted = this.highlighted;
        const stale = !highlighted || !highlighted.isConnected || highlighted.hidden || highlighted.disabled;
        if (!this.open) this.highlighted = undefined;
        else if (changed.has("open") || (changed.has("query") && this.searching) || stale)
            this.highlighted = this.initialHighlight();
    }

    protected override updated(changed: PropertyValues<this>) {
        super.updated(changed);
        const values = this.values;
        for (const option of this.options) {
            option.selected = values.includes(option.value);
            option.highlighted = option === this.highlighted;
        }
        this.focusTarget.ariaActiveDescendantElement = this.highlighted ?? null;
        const highlighted = this.highlighted;
        if ((changed as PropertyValues).has("highlighted") && highlighted)
            requestAnimationFrame(() => highlighted.scrollIntoView({ block: "nearest" }));

        if (this.multiple) {
            const data = new FormData();
            if (this.name) for (const value of values) data.append(this.name, value);
            this.internals.setFormValue(data);
        } else this.internals.setFormValue(values[0] ?? "");
        if (this.required && !values.length)
            this.internals.setValidity({ valueMissing: true }, "Please select an item in the list.", this.focusTarget);
        else this.internals.setValidity({});

        if (changed.has("disabled") && this.disabled) this.hide();
    }

    formResetCallback() {
        this.value = this.getAttribute("value") ?? "";
        this.resetQuery();
    }

    private renderTag(value: string) {
        const label = this.labelOf(value);
        return html`<oui-badge part="tag" variant="outline"
            >${label}<button
                part="tag-remove"
                type="button"
                tabindex="-1"
                aria-label=${`Remove ${label}`}
                class="-me-1 flex cursor-pointer items-center rounded-sm opacity-70 hover:opacity-100 disabled:pointer-events-none"
                ?disabled=${this.disabled}
                @click=${() => this.removeValue(value)}
            >
                <oui-icon .icon=${X} size="12"></oui-icon></button
        ></oui-badge>`;
    }

    override render() {
        const values = this.values;
        const placeholder = this.multiple && values.length ? "" : this.placeholder;
        return html`
            <div
                id="field"
                part="field"
                class="text-foreground border-border bg-field focus-within:border-ring focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-destructive/20 rounded-combobox min-h-combobox px-combobox flex w-full cursor-text flex-wrap items-center gap-1 border py-1 shadow-xs focus-within:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50 data-has-tags:py-[max(0.25rem,var(--spacing-combobox)*0.5)] data-has-tags:ps-[max(0.25rem,var(--spacing-combobox)*0.5)]"
                ?data-invalid=${this.invalid}
                ?data-disabled=${this.disabled}
                ?data-has-tags=${this.multiple && values.length > 0}
                @mousedown=${this.onFieldMouseDown}
            >
                ${this.multiple ? values.map((value) => this.renderTag(value)) : nothing}
                <input
                    id="control"
                    part="control"
                    type="text"
                    role="combobox"
                    autocomplete="off"
                    aria-autocomplete="list"
                    aria-controls="popup"
                    aria-expanded=${this.open ? "true" : "false"}
                    aria-label=${ifDefined(this.ariaLabel || undefined)}
                    aria-required=${this.required ? "true" : "false"}
                    aria-invalid=${this.invalid ? "true" : "false"}
                    class="placeholder:text-muted-foreground min-w-16 flex-1 self-stretch bg-transparent outline-none disabled:cursor-not-allowed"
                    .value=${live(this.displayText)}
                    placeholder=${ifDefined(placeholder || undefined)}
                    ?disabled=${this.disabled}
                    @input=${this.onInput}
                    @keydown=${this.onKeyDown}
                    @focus=${this.onFocus}
                    @click=${this.onControlClick}
                    @blur=${() => this.hide()}
                />
                <button
                    part="chevron"
                    type="button"
                    tabindex="-1"
                    aria-hidden="true"
                    class="text-muted-foreground flex cursor-pointer items-center disabled:cursor-not-allowed"
                    ?disabled=${this.disabled}
                    @click=${this.onChevronClick}
                >
                    <oui-icon .icon=${ChevronDown}></oui-icon>
                </button>
            </div>
            <div
                part="popup"
                id="popup"
                popover="manual"
                role="listbox"
                aria-multiselectable=${this.multiple ? "true" : "false"}
                aria-label=${ifDefined(this.ariaLabel || undefined)}
                data-state=${this.open ? "open" : "closed"}
                class="bg-surface text-surface-foreground border-border animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-popup p-popup inset-auto m-0 overflow-x-hidden overflow-y-auto border shadow-md outline-none"
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${this.onPopupClick}
                @pointermove=${this.onPopupPointerMove}
            >
                <slot @slotchange=${() => this.requestUpdate()}></slot>
                <div
                    part="empty"
                    class="text-muted-foreground px-option py-6 text-center text-sm"
                    ?hidden=${this.hasResults}
                >
                    <slot name="empty">${this.emptyText}</slot>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-combobox": OuiCombobox;
    }
}
