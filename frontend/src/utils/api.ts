import axios from "axios";

const domain = import.meta.env.VITE_DOMAIN || 'localhost';
const port = import.meta.env.VITE_PORT || 3001;
const enableHttps = import.meta.env.VITE_ENABLE_HTTPS === 'true';

function isIpOrLocalhost(host: string) {
    return (
        host === "localhost" ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(host) // 简单匹配 IPv4
    );
}

function getEntryUrl(domain: string, port: number, enableHttps: boolean) {
    const protocol = enableHttps ? "https" : "http";
    if (isIpOrLocalhost(domain)) {
        return `${protocol}://${domain}:${port}`;
    }
    return `${protocol}://${domain}`;
}

const entryUrl = getEntryUrl(domain, port, enableHttps);

export const API_BASE_URL = entryUrl + '/api';
export const UPLOADS_BASE_URL = entryUrl + '/uploads';
export const PREVIEW_URL = (enableHttps ? "https" : "http") + '://' + domain;

axios.defaults.withCredentials = true;