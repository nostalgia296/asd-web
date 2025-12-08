<script lang="ts">
	import { loadSettings, saveSettings, setTheme, getTheme } from '$lib/utils/settings';
	import {
		createBackup,
		getBackupList,
		deleteBackup,
		restoreBackup,
		exportBackup,
		importBackup,
		clearAllBackups,
		type BackupMetadata
	} from '$lib/utils/backup';
	import { onMount } from 'svelte';

	let mirrorUrl = $state('');
	let theme = $state<'blue' | 'pink'>('blue');
	let accessToken = $state('');
	let saved = $state(false);

	// 备份相关状态
	let backupName = $state('');
	let backupDescription = $state('');
	let backupList = $state<Array<{ id: string; metadata: BackupMetadata }>>([]);
	let showBackupDialog = $state(false);
	let showRestoreConfirm = $state(false);
	let selectedBackupId = $state('');
	let restoreMessage = $state('');
	let restoreError = $state('');
	let importFile = $state<File | null>(null);

	onMount(() => {
		const settings = loadSettings();
		mirrorUrl = settings.mirrorUrl || '';
		theme = settings.theme || 'blue';
		accessToken = settings.accessToken || '';
		loadBackupList();
	});

	function loadBackupList() {
		backupList = getBackupList();
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Remove trailing spaces
		const trimmedUrl = mirrorUrl.trim();
		const trimmedToken = accessToken.trim();

		// Save settings
		saveSettings({
			mirrorUrl: trimmedUrl || null,
			theme: theme,
			accessToken: trimmedToken || null
		});

		saved = true;
		setTimeout(() => {
			saved = false;
		}, 2000);
	}

	function useDefaultMirror() {
		mirrorUrl = 'https://gh-proxy.com';
	}

	function handleThemeChange(newTheme: 'blue' | 'pink') {
		theme = newTheme;
		setTheme(newTheme);
	}

	// 备份相关函数
	function openBackupDialog() {
		backupName = '';
		backupDescription = '';
		showBackupDialog = true;
	}

	function closeBackupDialog() {
		showBackupDialog = false;
	}

	function handleCreateBackup() {
		if (!backupName.trim()) {
			alert('请输入备份名称');
			return;
		}

		try {
			const backup = createBackup(backupName, backupDescription);
			loadBackupList();
			closeBackupDialog();
			saved = true;
			setTimeout(() => {
				saved = false;
			}, 2000);
		} catch (e) {
			alert('创建备份失败: ' + (e instanceof Error ? e.message : '未知错误'));
		}
	}

	function handleDeleteBackup(id: string, name: string) {
		if (confirm(`确定要删除备份 "${name}" 吗？`)) {
			try {
				deleteBackup(id);
				loadBackupList();
			} catch (e) {
				alert('删除备份失败: ' + (e instanceof Error ? e.message : '未知错误'));
			}
		}
	}

	function handleExportBackup(id: string) {
		try {
			exportBackup(id);
		} catch (e) {
			alert('导出备份失败: ' + (e instanceof Error ? e.message : '未知错误'));
		}
	}

	function openRestoreConfirm(id: string) {
		selectedBackupId = id;
		restoreMessage = '';
		restoreError = '';
		showRestoreConfirm = true;
	}

	function closeRestoreConfirm() {
		showRestoreConfirm = false;
		selectedBackupId = '';
		restoreMessage = '';
		restoreError = '';
	}

	function handleRestoreBackup() {
		if (!selectedBackupId) return;

		try {
			restoreBackup(selectedBackupId);
			restoreMessage = '恢复成功！页面将刷新以应用新设置...';
			restoreError = '';

			// 延迟刷新页面以应用新设置
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (e) {
			restoreError = '恢复失败: ' + (e instanceof Error ? e.message : '未知错误');
			restoreMessage = '';
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			importFile = target.files[0];
		}
	}

	async function handleImportBackup() {
		if (!importFile) {
			alert('请选择要导入的备份文件');
			return;
		}

		try {
			await importBackup(importFile);
			loadBackupList();
			importFile = null;
			// 重置文件输入
			const fileInput = document.getElementById('import-file') as HTMLInputElement;
			if (fileInput) fileInput.value = '';
			saved = true;
			setTimeout(() => {
				saved = false;
			}, 2000);
		} catch (e) {
			alert('导入备份失败: ' + (e instanceof Error ? e.message : '未知错误'));
		}
	}

	function handleClearAllBackups() {
		if (confirm('确定要清空所有备份吗？此操作不可恢复！')) {
			try {
				clearAllBackups();
				loadBackupList();
			} catch (e) {
				alert('清空备份失败: ' + (e instanceof Error ? e.message : '未知错误'));
			}
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString('zh-CN');
	}
</script>

<svelte:head>
	<title>设置 - GitHub Release 下载工具</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 md:py-12">
	<div class="max-w-3xl mx-auto px-4 sm:px-8 lg:px-10">
		<!-- Header -->
		<div class="mb-10">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
			<p class="mt-3 text-gray-600 dark:text-gray-400 text-lg">自定义 GitHub Release 下载工具的配置</p>
		</div>

		<!-- Settings Form -->
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6">
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Theme Selection -->
				<div>
					<div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						主题颜色
					</div>
					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => handleThemeChange('blue')}
							class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md transition-colors flex items-center justify-center gap-2 {theme === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}"
						>
							<div class="w-6 h-6 rounded-full bg-blue-500"></div>
							<span class="font-medium text-gray-900 dark:text-white">蓝色</span>
						</button>
						<button
							type="button"
							onclick={() => handleThemeChange('pink')}
							class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md transition-colors flex items-center justify-center gap-2 {theme === 'pink' ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}"
						>
							<div class="w-6 h-6 rounded-full bg-pink-500"></div>
							<span class="font-medium text-gray-900 dark:text-white">粉色</span>
						</button>
					</div>
				</div>

				<!-- Mirror URL -->
				<div>
					<label for="mirrorUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						下载镜像源
					</label>
					<input
						id="mirrorUrl"
						type="url"
						placeholder="https://gh-proxy.com"
						bind:value={mirrorUrl}
						class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>

					<div class="mt-3">
						<button
							type="button"
							onclick={useDefaultMirror}
							class="px-4 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
						>
							使用默认镜像源
						</button>
					</div>

					<!-- Preset Mirrors -->
					<div class="mt-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">其他镜像源</h3>
						<div class="space-y-2 text-sm">
							<div class="flex items-center justify-between">
								<span class="font-mono text-gray-700 dark:text-gray-300">https://gh.xmly.dev</span>
								<button
									type="button"
									onclick={() => mirrorUrl = 'https://gh.xmly.dev'}
									class="text-blue-600 dark:text-blue-400 hover:underline text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
								>
									使用
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Access Token -->
				<div>
					<label for="accessToken" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						GitHub访问令牌
					</label>
					<input
						id="accessToken"
						type="password"
						placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
						bind:value={accessToken}
						class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>

					<div class="mt-3">
						<a
							href="https://github.com/settings/tokens"
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
						>
							生成 Personal Access Token (classic)
						</a>
					</div>
				</div>

				<!-- Save Button -->
				<div class="flex items-center space-x-4">
					<button
						type="submit"
						class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
					>
						保存设置
					</button>

					{#if saved}
						<span class="text-green-600 dark:text-green-400 text-sm font-medium">设置已保存！</span>
					{/if}
				</div>
			</form>
		</div>

		<!-- 备份和恢复 -->
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 md:p-8">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">备份和恢复</h2>

			<!-- 创建备份 -->
			<div class="mb-8">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">创建备份</h3>
				<div class="flex flex-wrap gap-3">
					<button
						type="button"
						onclick={openBackupDialog}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
					>
						创建新备份
					</button>
					<button
						type="button"
						onclick={handleClearAllBackups}
						class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium rounded-md transition-colors"
					>
						清空所有备份
					</button>
				</div>
			</div>

			<!-- 导入备份 -->
			<div class="mb-8">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">导入备份</h3>
				<div class="flex flex-wrap items-center gap-3">
					<input
						id="import-file"
						type="file"
						accept=".json"
						onchange={handleFileSelect}
						class="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
					/>
					<button
						type="button"
						onclick={handleImportBackup}
						disabled={!importFile}
						class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						导入
					</button>
				</div>
			</div>

			<!-- 备份列表 -->
			<div>
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
					备份列表 ({backupList.length})
				</h3>
				{#if backupList.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-sm">暂无备份</p>
				{:else}
					<div class="space-y-3">
						{#each backupList as backup (backup.id)}
							<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 dark:text-white">
											{backup.metadata.name}
										</h4>
										{#if backup.metadata.description}
											<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
												{backup.metadata.description}
											</p>
										{/if}
									</div>
									<span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-3">
										v{backup.metadata.version}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<div class="text-xs text-gray-500 dark:text-gray-400">
										{formatDate(backup.metadata.timestamp)} •
										{backup.metadata.settingsCount} 项设置 •
										{backup.metadata.presetsCount} 个预设
									</div>
									<div class="flex gap-2">
										<button
											type="button"
											onclick={() => handleExportBackup(backup.id)}
											class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
										>
											导出
										</button>
										<button
											type="button"
											onclick={() => openRestoreConfirm(backup.id)}
											class="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded transition-colors"
										>
											恢复
										</button>
										<button
											type="button"
											onclick={() => handleDeleteBackup(backup.id, backup.metadata.name)}
											class="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors"
										>
											删除
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- 创建备份对话框 -->
{#if showBackupDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">创建备份</h3>
			<div class="space-y-4">
				<div>
					<label for="backup-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						备份名称 *
					</label>
					<input
						id="backup-name"
						type="text"
						bind:value={backupName}
						placeholder="例如: 我的配置备份"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="backup-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						备份描述
					</label>
					<textarea
						id="backup-description"
						bind:value={backupDescription}
						placeholder="可选：描述这个备份的用途或内容"
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button
					type="button"
					onclick={closeBackupDialog}
					class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
				>
					取消
				</button>
				<button
					type="button"
					onclick={handleCreateBackup}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
				>
					创建备份
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- 恢复备份确认对话框 -->
{#if showRestoreConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">恢复备份</h3>
			<div class="mb-4">
				{#if restoreMessage}
					<div class="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
						<p class="text-green-700 dark:text-green-300 text-sm">{restoreMessage}</p>
					</div>
				{:else if restoreError}
					<div class="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
						<p class="text-red-700 dark:text-red-300 text-sm">{restoreError}</p>
					</div>
				{:else}
					<p class="text-gray-600 dark:text-gray-400 text-sm">
						确定要恢复这个备份吗？当前的所有设置和预设将被覆盖。
					</p>
				{/if}
			</div>
			{#if !restoreMessage && !restoreError}
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={closeRestoreConfirm}
						class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						取消
					</button>
					<button
						type="button"
						onclick={handleRestoreBackup}
						class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md transition-colors"
					>
						确认恢复
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
