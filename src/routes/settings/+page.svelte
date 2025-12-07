<script lang="ts">
	import { loadSettings, saveSettings, setTheme, getTheme } from '$lib/utils/settings';
	import { onMount } from 'svelte';

	let mirrorUrl = $state('');
	let theme = $state<'blue' | 'pink'>('blue');
	let saved = $state(false);

	onMount(() => {
		const settings = loadSettings();
		mirrorUrl = settings.mirrorUrl || '';
		theme = settings.theme || 'blue';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Remove trailing spaces
		const trimmedUrl = mirrorUrl.trim();

		// Save settings
		saveSettings({
			mirrorUrl: trimmedUrl || null,
			theme: theme
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
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						主题颜色
					</label>
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
	</div>
</div>
