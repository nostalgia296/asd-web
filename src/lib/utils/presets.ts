export interface Preset {
	id: string;
	name: string;
	owner: string;
	repo: string;
}

const defaultPresets: Preset[] = [];

const PRESETS_KEY = 'github-release-presets';

/**
 * 加载所有预设
 */
export function loadPresets(): Preset[] {
	if (typeof window === 'undefined') {
		return defaultPresets;
	}

	try {
		const saved = localStorage.getItem(PRESETS_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			return Array.isArray(parsed) ? parsed : defaultPresets;
		}
	} catch (e) {
		console.error('加载预设失败:', e);
	}

	return defaultPresets;
}

/**
 * 保存所有预设
 */
export function savePresets(presets: Preset[]): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
	} catch (e) {
		console.error('保存预设失败:', e);
	}
}

/**
 * 添加一个预设
 */
export function addPreset(name: string, owner: string, repo: string): Preset {
	const presets = loadPresets();
	const newPreset: Preset = {
		id: Date.now().toString(),
		name: name.trim(),
		owner: owner.trim(),
		repo: repo.trim()
	};

	const updatedPresets = [...presets, newPreset];
	savePresets(updatedPresets);

	return newPreset;
}

/**
 * 删除一个预设
 */
export function deletePreset(id: string): void {
	const presets = loadPresets();
	const updatedPresets = presets.filter(p => p.id !== id);
	savePresets(updatedPresets);
}

/**
 * 更新一个预设
 */
export function updatePreset(id: string, updates: Partial<Omit<Preset, 'id'>>): void {
	const presets = loadPresets();
	const updatedPresets = presets.map(p => {
		if (p.id === id) {
			return { ...p, ...updates };
		}
		return p;
	});
	savePresets(updatedPresets);
}

/**
 * 通过ID查找预设
 */
export function findPresetById(id: string): Preset | undefined {
	const presets = loadPresets();
	return presets.find(p => p.id === id);
}

/**
 * 获取预设数量
 */
export function getPresetCount(): number {
	const presets = loadPresets();
	return presets.length;
}

/**
 * 清空所有预设
 */
export function clearPresets(): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.removeItem(PRESETS_KEY);
	} catch (e) {
		console.error('清空预设失败:', e);
	}
}
