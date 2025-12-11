<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { loadSettings, saveSettings } from '$lib/utils/settings';
	import { savePresets } from '$lib/utils/presets';
	import {
		loadWebDAVSettings,
		saveWebDAVSettings,
		backupToWebDAV,
		restoreFromWebDAV,
		listWebDAVBackups,
		type WebDAVSettings,
		type BackupData
	} from '$lib/utils/backup';

	// WebDAV 配置
	let webdavSettings = $state<WebDAVSettings>({
		url: '',
		username: '',
		password: '',
		remotePath: '/backups'
	});

	// UI 状态
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let isBackingUp = $state(false);
	let isRestoring = $state(false);
	let isListing = $state(false);

	// 消息提示
	let message = $state('');
	let messageType = $state<'success' | 'error' | 'info'>('info');

	// 备份列表
	let backupList = $state<Array<{name: string, size: number, lastModified: string}>>([]);

	// 调试模式
	let debugMode = $state(false);
	let debugInfo = $state('');

	onMount(() => {
		webdavSettings = loadWebDAVSettings();
	});

	function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
		}, 5000);
	}

	function updateDebugInfo(info: string) {
		const timestamp = new Date().toLocaleTimeString();
		debugInfo = `[${timestamp}] ${info}\n${debugInfo}`;
	}

	async function testConnection() {
		if (!webdavSettings.url || !webdavSettings.username || !webdavSettings.password) {
			showMessage('请填写完整的 WebDAV 配置信息', 'error');
			return;
		}

		isConnecting = true;
		updateDebugInfo(`开始连接测试: ${webdavSettings.url}`);

		try {
			updateDebugInfo('发送 PROPFIND 请求...');
			const response = await fetch(webdavSettings.url, {
				method: 'PROPFIND',
				headers: {
					'Authorization': `Basic ${btoa(`${webdavSettings.username}:${webdavSettings.password}`)}`,
					'Depth': '0',
					'Content-Type': 'application/xml'
				},
				body: `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <allprop/>
</propfind>`
			});

			updateDebugInfo(`响应状态: ${response.status} ${response.statusText}`);
			console.log('WebDAV 连接测试响应:', response.status, response.statusText);

			if (response.status === 207) {
				isConnected = true;
				updateDebugInfo('连接成功 (Multi-Status)');
				showMessage('连接成功！', 'success');
				await loadBackupList();
			} else if (response.status === 200) {
				// 某些服务器返回200而不是207
				isConnected = true;
				updateDebugInfo('连接成功 (OK)');
				showMessage('连接成功！（服务器返回状态码200）', 'success');
				await loadBackupList();
			} else if (response.status === 401) {
				isConnected = false;
				updateDebugInfo('认证失败');
				showMessage('认证失败，请检查用户名和密码', 'error');
			} else if (response.status === 404) {
				isConnected = false;
				updateDebugInfo('服务器地址不存在');
				showMessage('服务器地址不存在，请检查 URL', 'error');
			} else if (response.status === 405) {
				updateDebugInfo('PROPFIND 不被支持，尝试 OPTIONS...');
				// 如果 PROPFIND 不被支持，尝试 OPTIONS
				try {
					const optionsResponse = await fetch(webdavSettings.url, {
						method: 'OPTIONS',
						headers: {
							'Authorization': `Basic ${btoa(`${webdavSettings.username}:${webdavSettings.password}`)}`
						}
					});

					updateDebugInfo(`OPTIONS 响应: ${optionsResponse.status} ${optionsResponse.statusText}`);

					if (optionsResponse.status === 200 || optionsResponse.status === 204) {
						isConnected = true;
						updateDebugInfo('连接成功 (通过 OPTIONS)');
						showMessage('连接成功！（服务器不支持 PROPFIND，但支持 OPTIONS）', 'success');
					} else {
						isConnected = false;
						updateDebugInfo('服务器不支持 WebDAV 协议');
						showMessage('服务器不支持 WebDAV 协议', 'error');
					}
				} catch (optionsError) {
					updateDebugInfo(`OPTIONS 请求失败: ${optionsError instanceof Error ? optionsError.message : '未知错误'}`);
					isConnected = false;
					showMessage('服务器不支持 WebDAV 协议', 'error');
				}
			} else {
				isConnected = false;
				const errorText = await response.text();
				updateDebugInfo(`连接失败: ${response.status} - ${errorText}`);
				console.error('WebDAV 错误响应:', errorText);
				showMessage(`连接失败: HTTP ${response.status} - ${response.statusText}`, 'error');
			}
		} catch (error) {
			isConnected = false;
			updateDebugInfo(`连接异常: ${error instanceof Error ? error.message : '网络错误'}`);
			console.error('WebDAV 连接错误:', error);
			showMessage(`连接失败: ${error instanceof Error ? error.message : '网络错误'}`, 'error');
		} finally {
			isConnecting = false;
		}
	}

	async function saveWebDAVConfig() {
		saveWebDAVSettings(webdavSettings);
		showMessage('WebDAV 配置已保存', 'success');
	}

	async function loadBackupList() {
		if (!isConnected) {
			showMessage('请先测试连接', 'error');
			return;
		}

		isListing = true;
		try {
			const backups = await listWebDAVBackups(webdavSettings);
			backupList = backups.filter(file => file.name.startsWith('backup-') && file.name.endsWith('.json'));
		} catch (error) {
			showMessage('获取备份列表失败', 'error');
		} finally {
			isListing = false;
		}
	}

	async function createBackup() {
		if (!isConnected) {
			showMessage('请先测试连接', 'error');
			return;
		}

		isBackingUp = true;
		try {
			const settings = loadSettings();
			await backupToWebDAV(settings, webdavSettings);
			showMessage('备份创建成功！', 'success');
			await loadBackupList();
		} catch (error) {
			showMessage(`备份失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
		} finally {
			isBackingUp = false;
		}
	}

	async function restoreBackup(fileName: string) {
		if (!isConnected) {
			showMessage('请先测试连接', 'error');
			return;
		}

		if (!confirm('恢复备份将覆盖当前设置和预设仓库，确定要继续吗？')) {
			return;
		}

		isRestoring = true;
		try {
			const backupData = await restoreFromWebDAV(fileName, webdavSettings);

			// 恢复设置
			saveSettings(backupData.settings);

			// 恢复预设仓库
			savePresets(backupData.presets);

			showMessage('备份恢复成功！页面将在3秒后刷新', 'success');

			setTimeout(() => {
				window.location.href = `${ base }`;
			}, 3000);
		} catch (error) {
			showMessage(`恢复失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
		} finally {
			isRestoring = false;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatDate(dateString: string): string {
		if (!dateString) return '未知';
		try {
			return new Date(dateString).toLocaleString('zh-CN');
		} catch {
			return '未知';
		}
	}
</script>

<div class="space-y-8">
	<!-- 消息提示 -->
	{#if message}
		<div class="p-4 rounded-md {messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}">
			{message}
		</div>
	{/if}

	<!-- 调试信息 -->
	{#if debugMode}
		<div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-sm font-medium text-gray-900 dark:text-white">调试信息</h3>
				<button
					type="button"
					onclick={() => debugMode = false}
					class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{debugInfo || '暂无调试信息'}</pre>
		</div>
	{/if}

	<!-- WebDAV 配置 -->
	<div class="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">WebDAV 配置</h2>
			<button
				type="button"
				onclick={() => debugMode = !debugMode}
				class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
			>
				{debugMode ? '关闭调试' : '开启调试'}
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<label for="webdavUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					WebDAV 服务器地址
				</label>
				<input
					id="webdavUrl"
					type="url"
					placeholder="https://example.com/webdav"
					bind:value={webdavSettings.url}
					class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="webdavUsername" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						用户名
					</label>
					<input
						id="webdavUsername"
						type="text"
						placeholder="username"
						bind:value={webdavSettings.username}
						class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="webdavPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						密码
					</label>
					<input
						id="webdavPassword"
						type="password"
						placeholder="password"
						bind:value={webdavSettings.password}
						class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
			</div>

			<div>
				<label for="remotePath" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					远程路径
				</label>
				<input
					id="remotePath"
					type="text"
					placeholder="/backups"
					bind:value={webdavSettings.remotePath}
					class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div class="flex items-center space-x-4">
				<button
					type="button"
					onclick={testConnection}
					disabled={isConnecting}
					class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
				>
					{isConnecting ? '连接中...' : '测试连接'}
				</button>

				<button
					type="button"
					onclick={saveWebDAVConfig}
					class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
				>
					保存配置
				</button>

				{#if isConnected}
					<span class="text-green-600 dark:text-green-400 text-sm font-medium">✓ 已连接</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- 备份操作 -->
	{#if isConnected}
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">备份操作</h2>

			<div class="flex items-center space-x-4 mb-6">
				<button
					type="button"
					onclick={createBackup}
					disabled={isBackingUp}
					class="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
				>
					{isBackingUp ? '备份中...' : '创建备份'}
				</button>

				<button
					type="button"
					onclick={loadBackupList}
					disabled={isListing}
					class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
				>
					{isListing ? '加载中...' : '刷新列表'}
				</button>
			</div>

			<!-- 备份列表 -->
			{#if backupList.length > 0}
				<div class="space-y-3">
					<h3 class="text-lg font-medium text-gray-900 dark:text-white">可用备份</h3>
					<div class="space-y-2">
						{#each backupList as backup}
							<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div class="flex-1">
									<div class="font-medium text-gray-900 dark:text-white">{backup.name}</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">
										{formatFileSize(backup.size)} • {formatDate(backup.lastModified)}
									</div>
								</div>
								<button
									type="button"
									onclick={() => restoreBackup(backup.name)}
									disabled={isRestoring}
									class="px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
								>
									{isRestoring ? '恢复中...' : '恢复'}
								</button>
							</div>
						{/each}
					</div>
				</div>
			{:else if backupList.length === 0}
				<div class="text-gray-500 dark:text-gray-400 text-center py-8">
					暂无备份文件
				</div>
			{/if}
		</div>
	{/if}
</div>