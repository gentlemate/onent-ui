import type { IconNode } from "lucide";
import type { OuiButtonVariant } from "../button/oui-button.js";
import type { OuiToast, OuiToastLive, OuiToastTone, OuiToastVariant } from "./oui-toast.js";
import type { OuiToaster, OuiToasterPlacement } from "./oui-toaster.js";
import "../button/oui-button.js";
import "./oui-toast.js";
import "./oui-toast-action.js";
import "./oui-toast-description.js";
import "./oui-toast-title.js";
import "./oui-toaster.js";

export interface OuiToastActionOptions {
    label: string;
    variant?: OuiButtonVariant;
    onClick?: (event: MouseEvent) => void;
}

export interface OuiToastOptions {
    title?: string;
    description?: string;
    actions?: OuiToastActionOptions | OuiToastActionOptions[];
    tone?: OuiToastTone;
    variant?: OuiToastVariant;
    icon?: IconNode;
    withoutIcon?: boolean;
    withoutClose?: boolean;
    duration?: number;
    closeLabel?: string;
    live?: OuiToastLive;
    toaster?: OuiToaster;
    placement?: OuiToasterPlacement;
}

function textElement(tag: "oui-toast-title" | "oui-toast-description", text: string) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
}

function buttonElement({ label, variant, onClick }: OuiToastActionOptions) {
    const button = document.createElement("oui-button");
    button.textContent = label;
    button.dataset.close = "";
    if (variant) button.variant = variant;
    if (onClick) button.addEventListener("click", onClick);
    return button;
}

function actionElement(actions: OuiToastActionOptions[]) {
    const action = document.createElement("oui-toast-action");
    action.append(...actions.map(buttonElement));
    return action;
}

function findToaster(placement?: OuiToasterPlacement) {
    const toasters = [...document.querySelectorAll("oui-toaster")];
    const found = placement ? toasters.find((toaster) => toaster.placement === placement) : toasters[0];
    if (found) return found;
    const created = document.createElement("oui-toaster");
    if (placement) created.placement = placement;
    return document.body.appendChild(created);
}

/**
 * Shows a toast in `toaster`, or else in the first `oui-toaster` of the page with `placement` (any placement without
 * it), created if there is none. A string is used as the title. The toast is removed from the page once closed.
 */
export function toast(options: OuiToastOptions | string): OuiToast {
    const {
        title,
        description,
        actions = [],
        toaster,
        placement,
        ...properties
    } = typeof options === "string" ? { title: options } : options;
    const element = document.createElement("oui-toast");
    for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) Object.assign(element, { [key]: value });
    }
    if (title) element.append(textElement("oui-toast-title", title));
    if (description) element.append(textElement("oui-toast-description", description));
    const buttons = [actions].flat();
    if (buttons.length) element.append(actionElement(buttons));
    element.addEventListener("oui-after-hide", (event) => {
        if (event.target === element) element.remove();
    });
    (toaster ?? findToaster(placement)).append(element);
    element.show();
    return element;
}
