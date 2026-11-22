import { css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";
import { tones } from "../../tone.js";
import type { OuiToast } from "./oui-toast.js";

export type OuiToasterPlacement =
    "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

const top = "top-[calc(var(--inset-toaster)-0.375rem)] flex-col-reverse [--toast-enter-y:-1rem]";
const bottom = "bottom-[calc(var(--inset-toaster)-0.375rem)] flex-col [--toast-enter-y:1rem]";

const placements: Record<OuiToasterPlacement, string> = {
    "top-start": `${top} start-(--inset-toaster)`,
    "top-center": `${top} inset-x-0 mx-auto`,
    "top-end": `${top} end-(--inset-toaster)`,
    "bottom-start": `${bottom} start-(--inset-toaster)`,
    "bottom-center": `${bottom} inset-x-0 mx-auto`,
    "bottom-end": `${bottom} end-(--inset-toaster)`,
};

const announceDelay = 150;
const announcementLifetime = 7000;

interface Timer {
    remaining: number;
    started: number;
    id?: ReturnType<typeof setTimeout>;
}

/**
 * @element oui-toaster
 * @property placement - Corner or edge of the screen where the toasts stack. The newest toast is the closest to the
 * edge.
 * @property max - Maximum number of open toasts: opening one more closes the oldest. `0` removes the limit.
 * @property label - Accessible name of the region holding the toasts.
 * @slot - The `oui-toast` elements.
 * @cssprop [--oui-width-toaster=22rem] - Width of the toasts.
 * @cssprop [--oui-inset-toaster=1rem] - Distance from the edges of the screen.
 * @csspart base - The region holding the toasts.
 */
@customElement("oui-toaster")
export class OuiToaster extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: contents;
            }
        `,
    ];

    @property({ reflect: true }) placement: OuiToasterPlacement = "bottom-end";
    @property({ type: Number }) max = 3;
    @property() label = "Notifications";

    @query("[part=base]") private base!: HTMLElement;
    @query("#polite") private polite!: HTMLElement;
    @query("#assertive") private assertive!: HTMLElement;

    private timers = new Map<OuiToast, Timer>();
    private sequence = 0;
    private hovered = false;
    private focused = false;

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener("visibilitychange", this.sync);
        if (this.hasUpdated) this.present();
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener("visibilitychange", this.sync);
        for (const timer of this.timers.values()) clearTimeout(timer.id);
        this.timers.clear();
    }

    protected override firstUpdated() {
        this.present();
    }

    /** @internal */
    register(toast: OuiToast) {
        toast.style.order = String(++this.sequence);
        this.schedule(toast);
        this.announce(toast);
        if (this.max <= 0) return;
        const open = this.toasts().filter((item) => item.open);
        for (const oldest of open.slice(0, Math.max(0, open.length - this.max))) oldest.hide();
    }

    /** @internal */
    unregister(toast: OuiToast) {
        clearTimeout(this.timers.get(toast)?.id);
        this.timers.delete(toast);
    }

    private present() {
        if (this.base.isConnected && !this.base.matches(":popover-open")) this.base.showPopover();
    }

    private toasts() {
        return [...this.children]
            .filter((child): child is OuiToast => child.localName === "oui-toast")
            .sort((a, b) => Number(a.style.order) - Number(b.style.order));
    }

    private get paused() {
        return this.hovered || this.focused || document.hidden;
    }

    private schedule(toast: OuiToast) {
        this.unregister(toast);
        if (!Number.isFinite(toast.duration) || toast.duration <= 0) return;
        this.timers.set(toast, { remaining: toast.duration, started: 0 });
        if (!this.paused) this.run(toast);
    }

    private run(toast: OuiToast) {
        const timer = this.timers.get(toast);
        if (!timer) return;
        timer.started = Date.now();
        timer.id = setTimeout(() => {
            this.timers.delete(toast);
            toast.hide();
        }, timer.remaining);
    }

    private sync = () => {
        for (const [toast, timer] of this.timers) {
            if (this.paused && timer.id !== undefined) {
                clearTimeout(timer.id);
                timer.id = undefined;
                timer.remaining -= Date.now() - timer.started;
            } else if (!this.paused && timer.id === undefined) {
                this.run(toast);
            }
        }
    };

    private announce(toast: OuiToast) {
        const live = toast.live ?? tones[toast.tone]?.live ?? "polite";
        if (live === "off") return;
        const parts = [...toast.querySelectorAll(":scope > oui-toast-title, :scope > oui-toast-description")];
        const text = (parts.length ? parts : [toast])
            .map((part) => part.textContent?.replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .join(" ");
        if (!text) return;
        setTimeout(() => {
            const message = document.createElement("div");
            message.textContent = text;
            (live === "assertive" ? this.assertive : this.polite).append(message);
            setTimeout(() => message.remove(), announcementLifetime);
        }, announceDelay);
    }

    private onPointer(event: PointerEvent) {
        this.hovered = event.type === "pointerenter" && event.pointerType !== "touch";
        this.sync();
    }

    private onFocus() {
        this.focused = this.matches(":focus-within");
        this.sync();
    }

    private onSlotChange() {
        for (const toast of this.timers.keys()) if (toast.parentElement !== this) this.unregister(toast);
    }

    override render() {
        return html`<div
            part="base"
            popover="manual"
            role="region"
            aria-label=${this.label}
            class="${
                placements[this.placement] ?? placements["bottom-end"]
            } text-foreground pointer-events-none fixed inset-auto m-0 flex w-[min(var(--width-toaster),100%-2*var(--inset-toaster))] overflow-visible border-0 bg-transparent p-0"
            @pointerenter=${this.onPointer}
            @pointerleave=${this.onPointer}
            @focusin=${this.onFocus}
            @focusout=${() => setTimeout(() => this.onFocus())}
        >
            <slot @slotchange=${this.onSlotChange}></slot>
            <div id="polite" aria-live="polite" class="sr-only"></div>
            <div id="assertive" aria-live="assertive" class="sr-only"></div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-toaster": OuiToaster;
    }
}
