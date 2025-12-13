export interface Settings {
	mirrorUrl: string | null;
	theme?: 'blue' | 'pink';
	accessToken?: string | null;
}

const defaultSettings: Settings = {
	mirrorUrl: null, // https://gh-proxy.com
	theme: 'blue',
	accessToken: null
};

const SETTINGS_KEY = 'github-release-downloader-settings';

export function loadSettings(): Settings {
	if (typeof window === 'undefined') {
		return defaultSettings;
	}

	try {
		const saved = localStorage.getItem(SETTINGS_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			return {
				...defaultSettings,
				...parsed
			};
		}
	} catch (e) {
		console.error('加载设置失败:', e);
	}

	return defaultSettings;
}

export function saveSettings(settings: Settings): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('保存设置失败:', e);
	}
}

export function getMirrorUrl(): string | null {
	const settings = loadSettings();
	if (!settings.mirrorUrl) {
		return null;
	}

	// Ensure the mirror URL ends with /
	let url = settings.mirrorUrl;
	if (!url.endsWith('/') && !url.endsWith('=')) {
		url += '/';
	}

	return url;
}

export function setMirrorUrl(url: string | null): void {
	const settings = loadSettings();
	settings.mirrorUrl = url;
	saveSettings(settings);
}

export function getAccessToken(): string | null {
	const settings = loadSettings();
	return settings.accessToken || null;
}

export function setAccessToken(token: string | null): void {
	const settings = loadSettings();
	settings.accessToken = token;
	saveSettings(settings);
}

export function setTheme(theme: 'blue' | 'pink'): void {
	const settings = loadSettings();
	settings.theme = theme;
	saveSettings(settings);
	applyTheme(theme);
}

export function getTheme(): 'blue' | 'pink' {
	const settings = loadSettings();
	return settings.theme || 'blue';
}

export function applyTheme(theme: 'blue' | 'pink'): void {
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', theme);
	}
}

export function initTheme(): void {
	const theme = getTheme();
	applyTheme(theme);
}
