
// 使用：const app = useAppStore();  app.setLocale('zh-CN')

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// 可根据项目需要扩展支持的语言
export const SUPPORTED_LOCALES = ['en', 'zh-CN'];

// 从浏览器或 localStorage 推断初始语言
function resolveInitialLocale(): string {
	if (typeof window === 'undefined') return 'en';
	const saved = localStorage.getItem('app.locale');
	if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
	const nav = navigator.language || 'en';
	// 简单归一化：如果是 zh 系列都用 zh-CN
	if (nav.toLowerCase().startsWith('zh')) return 'zh-CN';
	return 'en';
}

export const useAppStore = defineStore('app', () => {
	const locale = ref<string>(resolveInitialLocale());

	// 供可能的后续界面显示使用
	const availableLocales = SUPPORTED_LOCALES;

	const setLocale = (val: string) => {
		if (!SUPPORTED_LOCALES.includes(val)) return;
		locale.value = val;
	};

	watch(locale, (v) => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('app.locale', v);
	});

	return {
		locale,
		availableLocales,
		setLocale,
	};
});

