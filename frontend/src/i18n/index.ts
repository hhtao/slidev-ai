// 浏览器 / Vite 环境下的简易 i18n 工具
// 特点：
// 1. 按需异步加载各语言 JSON 文件 (放在同目录 locales/ 下)
// 2. localStorage 记忆用户选择
// 3. 占位符 {0} {1} ... 替换
// 4. 缺失 key 回退到默认语言(en) 或原 key
// 5. 与 Pinia store (useAppStore) 可协同，store 改语言后调用 setLanguage

import { ref, shallowRef } from 'vue';

// 支持的语言列表，可与 Pinia 中 SUPPORTED_LOCALES 保持一致
export const SUPPORTED_LOCALES = ['en','zh-CN'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// 默认语言
const DEFAULT_LOCALE: Locale = 'en';

// 已加载的语言包缓存
const bundles: Record<string, Record<string, string>> = {};

// 当前语言（响应式）
const currentLocale = ref<Locale>(resolveInitialLocale());
// 当前 bundle （响应式，方便在组件里 computed 触发）
const currentBundle = shallowRef<Record<string, string>>({});

// 解析初始语言：localStorage -> 浏览器 navigator -> 默认
function resolveInitialLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    const saved = localStorage.getItem('app.locale');
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) return saved as Locale;
    const nav = navigator.language || DEFAULT_LOCALE;
    if (nav.toLowerCase().startsWith('zh')) return 'zh-CN';
    return DEFAULT_LOCALE;
}

// 动态导入映射：Vite 会基于静态字符串分包；如需新增语言，添加一行即可
// 确保在同目录创建 ./locales/en.json, ./locales/zh-CN.json 等文件
const loaders: Record<Locale, () => Promise<Record<string, string>>> = {
    'en': async () => (await import('./locales/bundle.l10n.en.json')).default as Record<string, string>,
    'zh-CN': async () => (await import('./locales/bundle.l10n.zh.json')).default as Record<string, string>,
};

let initPromise: Promise<void> | null = null;

/**
 * 初始化（可在应用启动时调用）。若已初始化会复用同一个 promise。
 */
export function initI18n(lang?: Locale): Promise<void> {
    if (!initPromise) {
        initPromise = internalSetLanguage(lang || currentLocale.value, { silent: true });
    }
    return initPromise;
}

/**
 * 切换语言（外部可由 Pinia store 变化时调用）
 */
export async function setLanguage(lang: string): Promise<void> {
    if (!SUPPORTED_LOCALES.includes(lang as Locale)) return;
    await internalSetLanguage(lang as Locale);
}

async function internalSetLanguage(lang: Locale, opts?: { silent?: boolean }) {
    if (currentLocale.value === lang && bundles[lang]) {
        currentBundle.value = bundles[lang];
        return;
    }
    try {
        const bundle = await loadBundle(lang);
        bundles[lang] = bundle;
        currentLocale.value = lang;
        currentBundle.value = bundle;
        if (typeof window !== 'undefined') localStorage.setItem('app.locale', lang);
        if (!opts?.silent) notifyListeners(lang);
    } catch (e) {
        console.warn('[i18n] 加载语言包失败，回退到默认语言', lang, e);
        if (lang !== DEFAULT_LOCALE) {
            await internalSetLanguage(DEFAULT_LOCALE, opts);
        }
    }
}

async function loadBundle(lang: Locale): Promise<Record<string, string>> {
    if (bundles[lang]) return bundles[lang];
    const loader = loaders[lang];
    if (!loader) throw new Error(`No loader for locale ${lang}`);
    return await loader();
}

/**
 * 翻译函数：支持 {0} {1} ... 占位符；若 key 不存在尝试默认语言；仍不存在返回原 key。
 */
export function t(key: string, ...args: Array<string | number>): string {
    let msg = currentBundle.value[key];
    if (msg == null) {
        const fallback = bundles[DEFAULT_LOCALE]?.[key];
        msg = fallback != null ? fallback : key; // 双重回退
    }
    if (args.length) {
        msg = msg.replace(/\{(\d+)\}/g, (m, idx) => {
            const i = Number(idx);
            return args[i] != null ? String(args[i]) : m;
        });
    }
    return msg;
}

export function getCurrentLanguage(): Locale {
    return currentLocale.value;
}

export function getAvailableKeys(): string[] {
    return Object.keys(currentBundle.value);
}

export function hasTranslation(key: string): boolean {
    return key in currentBundle.value || key in (bundles[DEFAULT_LOCALE] || {});
}

// 监听语言变化的回调集合（可选功能）
type Listener = (lang: Locale) => void;
const listeners = new Set<Listener>();

export function onLanguageChange(cb: Listener): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

function notifyListeners(lang: Locale) {
    listeners.forEach((cb) => {
        try { cb(lang); } catch (e) { console.error(e); }
    });
}

// 提供给组件直接使用的响应式引用
export const i18nLocaleRef = currentLocale;
export const i18nBundleRef = currentBundle;

// 立即尝试初始化（可在 main.ts 更显式地调用 initI18n 以等待完成）
// 不 await，避免阻塞首屏；需要保证首屏文本提供合理回退。
initI18n();

// 使用示例：
// await initI18n();
// console.log(t('app.welcome', 'User')); // 假设 JSON 中: "app.welcome": "Hello, {0}!"

// 建议在 src/i18n/locales/en.json 与 zh-CN.json 中维护 key-value：
// { "app.welcome": "Hello, {0}!" }