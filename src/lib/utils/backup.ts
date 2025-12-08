import type { Settings } from './settings';
import type { Preset } from './presets';
import { loadSettings, saveSettings, applyTheme } from './settings';
import { loadPresets, savePresets } from './presets';

export interface BackupData {
	version: string;
	timestamp: number;
	settings: Settings;
	presets: Preset[];
}

export interface BackupMetadata {
	name: string;
	description?: string;
	timestamp: number;
	version: string;
	settingsCount: number;
	presetsCount: number;
}

const BACKUPS_KEY = 'github-release-backups';
const BACKUP_VERSION = '1.0.0';

/**
 * 创建当前设置和预设的备份
 */
export function createBackup(name: string, description?: string): { id: string; data: BackupData; metadata: BackupMetadata } {
	if (typeof window === 'undefined') {
		throw new Error('备份功能只能在浏览器中使用');
	}

	const settings = loadSettings();
	const presets = loadPresets();

	const backupData: BackupData = {
		version: BACKUP_VERSION,
		timestamp: Date.now(),
		settings,
		presets
	};

	const metadata: BackupMetadata = {
		name: name.trim(),
		description: description?.trim() || '',
		timestamp: backupData.timestamp,
		version: backupData.version,
		settingsCount: Object.keys(settings).length,
		presetsCount: presets.length
	};

	const backupId = `backup_${Date.now()}`;

	// 保存到localStorage
	saveBackup(backupId, backupData, metadata);

	return { id: backupId, data: backupData, metadata };
}

/**
 * 保存备份到localStorage
 */
function saveBackup(id: string, data: BackupData, metadata: BackupMetadata): void {
	try {
		const backups = getAllBackups();
		backups[id] = { data, metadata };

		// 限制备份数量，最多保留10个
		const backupEntries = Object.entries(backups);
		if (backupEntries.length > 10) {
			// 按时间排序，删除最旧的
			backupEntries.sort(([, a], [, b]) => a.metadata.timestamp - b.metadata.timestamp);
			const toDelete = backupEntries.slice(0, backupEntries.length - 10);
			toDelete.forEach(([key]) => delete backups[key]);
		}

		localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
	} catch (e) {
		console.error('保存备份失败:', e);
		throw new Error('保存备份失败');
	}
}

/**
 * 获取所有备份
 */
export function getAllBackups(): Record<string, { data: BackupData; metadata: BackupMetadata }> {
	if (typeof window === 'undefined') {
		return {};
	}

	try {
		const saved = localStorage.getItem(BACKUPS_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			return typeof parsed === 'object' ? parsed : {};
		}
	} catch (e) {
		console.error('加载备份列表失败:', e);
	}

	return {};
}

/**
 * 获取备份元数据列表
 */
export function getBackupList(): Array<{ id: string; metadata: BackupMetadata }> {
	const backups = getAllBackups();
	return Object.entries(backups).map(([id, { metadata }]) => ({
		id,
		metadata
	})).sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
}

/**
 * 删除指定备份
 */
export function deleteBackup(id: string): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const backups = getAllBackups();
		delete backups[id];
		localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
	} catch (e) {
		console.error('删除备份失败:', e);
		throw new Error('删除备份失败');
	}
}

/**
 * 恢复备份
 */
export function restoreBackup(id: string): void {
	if (typeof window === 'undefined') {
		throw new Error('恢复功能只能在浏览器中使用');
	}

	const backups = getAllBackups();
	const backup = backups[id];

	if (!backup) {
		throw new Error('备份不存在');
	}

	const { data } = backup;

	// 验证备份数据
	if (!data.version || !data.settings || !Array.isArray(data.presets)) {
		throw new Error('备份数据格式错误');
	}

	try {
		// 恢复设置
		saveSettings(data.settings);

		// 恢复预设
		savePresets(data.presets);

		// 应用主题设置
		if (data.settings.theme) {
			applyTheme(data.settings.theme);
		}
	} catch (e) {
		console.error('恢复备份失败:', e);
		throw new Error('恢复备份失败');
	}
}

/**
 * 导出备份为JSON文件
 */
export function exportBackup(id: string): void {
	if (typeof window === 'undefined') {
		throw new Error('导出功能只能在浏览器中使用');
	}

	const backups = getAllBackups();
	const backup = backups[id];

	if (!backup) {
		throw new Error('备份不存在');
	}

	const { data, metadata } = backup;
	const exportData = {
		...data,
		metadata
	};

	const jsonString = JSON.stringify(exportData, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `github-release-backup-${metadata.name}-${new Date(metadata.timestamp).toISOString().split('T')[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * 从JSON文件导入备份
 */
export async function importBackup(file: File): Promise<{ id: string; data: BackupData; metadata: BackupMetadata }> {
	if (typeof window === 'undefined') {
		throw new Error('导入功能只能在浏览器中使用');
	}

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		// 验证导入数据格式
		let data: BackupData;
		let metadata: BackupMetadata;

		if (importData.data && importData.metadata) {
			// 导出的文件格式
			data = importData.data;
			metadata = importData.metadata;
		} else if (importData.version && importData.settings && Array.isArray(importData.presets)) {
			// 直接的备份数据格式
			data = importData;
			metadata = {
				name: `导入备份_${new Date().toLocaleString()}`,
				timestamp: data.timestamp || Date.now(),
				version: data.version,
				settingsCount: Object.keys(data.settings).length,
				presetsCount: data.presets.length
			};
		} else {
			throw new Error('不支持的备份文件格式');
		}

		// 验证版本兼容性
		if (data.version !== BACKUP_VERSION) {
			console.warn(`备份版本 ${data.version} 与当前版本 ${BACKUP_VERSION} 不匹配，尝试兼容恢复`);
		}

		const backupId = `backup_import_${Date.now()}`;

		// 保存导入的备份
		saveBackup(backupId, data, metadata);

		return { id: backupId, data, metadata };
	} catch (e) {
		console.error('导入备份失败:', e);
		throw new Error('导入备份失败：' + (e instanceof Error ? e.message : '未知错误'));
	}
}

/**
 * 清空所有备份
 */
export function clearAllBackups(): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.removeItem(BACKUPS_KEY);
	} catch (e) {
		console.error('清空备份失败:', e);
		throw new Error('清空备份失败');
	}
}