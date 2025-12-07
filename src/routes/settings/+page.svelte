<script lang="ts">
	import { loadSettings, saveSettings } from '$lib/utils/settings';
	import { onMount } from 'svelte';

	let mirrorUrl = $state('');
	let saved = $state(false);

	onMount(() => {
		const settings = loadSettings();
		mirrorUrl = settings.mirrorUrl || '';
	});

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Remove trailing spaces
		const trimmedUrl = mirrorUrl.trim();

		// Save settings
		saveSettings({
			mirrorUrl: trimmedUrl || null
		});

		saved = true;
		setTimeout(() => {
			saved = false;
		}, 2000);
	}

	function useDefaultMirror() {
		mirrorUrl = 'https://gh-proxy.com';
	}
</script>

<svelte:head>
	<title>设置 - GitHub Release 下载工具</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">自定义 GitHub Release 下载工具的配置</p>
		</div>

		<!-- Settings Form -->
		<div class="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Mirror URL -->
				<div>
					<label for="mirrorUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						下载镜像源
					</label>
					<input
						id="mirrorUrl"
						type="url"
						placeholder="https://gh-proxy.com"
						bind:value={mirrorUrl}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>

					<div class="mt-3">
						<button
							type="button"
							onclick={useDefaultMirror}
							class="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
						>
							使用默认镜像源
						</button>
					</div>

					<!-- Preset Mirrors -->
					<div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">其他镜像源</h3>
						<div class="space-y-2 text-sm">
							<div class="flex items-center justify-between">
								<span class="font-mono text-gray-700 dark:text-gray-300">https://gh.xmly.dev</span>
								<button
									type="button"
									onclick={() => mirrorUrl = 'https://gh.xmly.dev'}
									class="text-blue-600 dark:text-blue-400 hover:underline text-xs"
								>
									使用
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Save Button -->
				<div class="flex items-center space-x-3">
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
					>
						保存设置
					</button>

					{#if saved}
						<span class="text-green-600 dark:text-green-400 text-sm">设置已保存！</span>
					{/if}
				</div>
			</form>
		</div>
	</div>
</div>
