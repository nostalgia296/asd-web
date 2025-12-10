import { WebDAVService, type WebDAVConfig } from '$lib/services/webdav';
import type { Settings } from './settings';
import { loadPresets, type Preset } from './presets';

export interface BackupData {
	settings: Settings;
	presets: Preset[];
	timestamp: string;
	version: string;
}

export interface WebDAVSettings {
	url: string;
	username: string;
	password: string;
	remotePath: string;
}

const BACKUP_VERSION = '1.0';
const WEBDAV_SETTINGS_KEY = 'webdav-backup-settings';

export function generateBackupFileName(): string {
	const now = new Date();
	const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
	return `backup-${timestamp}.json`;
}

export async function createBackupData(settings: Settings): Promise<string> {
	const presets = loadPresets();
	const backupData: BackupData = {
		settings,
		presets,
		timestamp: new Date().toISOString(),
		version: BACKUP_VERSION
	};

	return JSON.stringify(backupData, null, 2);
}

export function parseBackupData(jsonString: string): BackupData {
	const data = JSON.parse(jsonString);

	// 验证备份数据格式
	if (!data.settings || !data.timestamp || !data.version) {
		throw new Error('无效的备份数据格式');
	}

	// 确保 presets 字段存在，如果不存在则设为空数组
	if (!data.presets || !Array.isArray(data.presets)) {
		data.presets = [];
	}

	return data as BackupData;
}

export function loadWebDAVSettings(): WebDAVSettings {
	if (typeof window === 'undefined') {
		return getDefaultWebDAVSettings();
	}

	try {
		const saved = localStorage.getItem(WEBDAV_SETTINGS_KEY);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (e) {
		console.error('加载 WebDAV 设置失败:', e);
	}

	return getDefaultWebDAVSettings();
}

export function saveWebDAVSettings(settings: WebDAVSettings): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(WEBDAV_SETTINGS_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('保存 WebDAV 设置失败:', e);
	}
}

export function getDefaultWebDAVSettings(): WebDAVSettings {
	return {
		url: '',
		username: '',
		password: '',
		remotePath: '/backups'
	};
}

export function createWebDAVService(settings: WebDAVSettings): WebDAVService {
	const config: WebDAVConfig = {
		baseUrl: settings.url,
		username: settings.username,
		password: settings.password,
		remotePath: settings.remotePath
	};

	return new WebDAVService(config);
}

export async function backupToWebDAV(settings: Settings, webdavSettings: WebDAVSettings): Promise<void> {
	if (!webdavSettings.url || !webdavSettings.username || !webdavSettings.password) {
		throw new Error('WebDAV 配置不完整');
	}

	const webdavService = createWebDAVService(webdavSettings);

	// 测试连接
	const connected = await webdavService.testConnection();
	if (!connected) {
		throw new Error('无法连接到 WebDAV 服务器');
	}

	// 确保远程目录存在
	await webdavService.createDirectory(webdavSettings.remotePath);

	// 创建备份数据
	const backupJson = await createBackupData(settings);
	const fileName = generateBackupFileName();

	// 上传备份文件
	const blob = new Blob([backupJson], { type: 'application/json' });
	const file = new File([blob], fileName, { type: 'application/json' });

	const success = await webdavService.uploadFile(file, fileName);
	if (!success) {
		throw new Error('备份上传失败');
	}
}

export async function restoreFromWebDAV(fileName: string, webdavSettings: WebDAVSettings): Promise<BackupData> {
	if (!webdavSettings.url || !webdavSettings.username || !webdavSettings.password) {
		throw new Error('WebDAV 配置不完整');
	}

	const webdavService = createWebDAVService(webdavSettings);

	// 下载备份文件
	const blob = await webdavService.downloadFile(fileName);
	const jsonString = await blob.text();

	// 解析备份数据
	return parseBackupData(jsonString);
}

export async function listWebDAVBackups(webdavSettings: WebDAVSettings) {
	if (!webdavSettings.url || !webdavSettings.username || !webdavSettings.password) {
		throw new Error('WebDAV 配置不完整');
	}

	const webdavService = createWebDAVService(webdavSettings);
	return await webdavService.listFiles();
}