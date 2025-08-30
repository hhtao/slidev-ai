function changeFavicon(iconUrl: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
    }
    link.href = iconUrl;
}

export function IamBusy() {
    changeFavicon('/busy.svg')
}

export function IamFree() {
    changeFavicon('/favicon.svg')
}