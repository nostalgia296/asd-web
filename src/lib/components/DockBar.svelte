<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		loadPresets,
		addPreset,
		deletePreset,
		type Preset
	} from '$lib/utils/presets';

	const navItems = [
		{
			label: '首页',
			path: `${base}/`,
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
			</svg>`
		},
		{
			label: '设置',
			path: `${base}/settings`,
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
			</svg>`
		}
	];

	let showPresets = $state(false);
	let presets: Preset[] = $state([]);
	let newPresetName = $state('');
	let newOwner = $state('');
	let newRepo = $state('');
	let addingPreset = $state(false);

	onMount(() => {
		loadPresetsFromStorage();
	});

	function loadPresetsFromStorage() {
		presets = loadPresets();
	}

	function handleAddPreset() {
		if (newPresetName.trim() && newOwner.trim() && newRepo.trim()) {
			addPreset(newPresetName.trim(), newOwner.trim(), newRepo.trim());
			presets = loadPresets(); // Reload from storage
			newPresetName = '';
			newOwner = '';
			newRepo = '';
			addingPreset = false;
		}
	}

	function handleDeletePreset(id: string) {
		deletePreset(id);
		presets = loadPresets(); // Reload from storage
	}

	function loadPreset(preset: Preset) {
		// 跳转到首页并添加参数
		window.location.href = `${base}/?owner=${encodeURIComponent(preset.owner)}&repo=${encodeURIComponent(preset.repo)}`;
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<!-- Dock Bar -->
<div class="fixed bottom-0 md:bottom-4 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-40 w-full md:w-auto">
	<!-- Background blur effect -->
	<div class="relative">
		<div class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md md:rounded-2xl shadow-lg border-t md:border border-gray-200 dark:border-gray-700"></div>

		<!-- Dock content -->
		<nav class="relative flex items-center justify-around md:space-x-1 md:justify-start px-1 md:px-2 py-2">
			{#each navItems as item}
				<a
					href={item.path}
					class="flex flex-col items-center px-3 md:px-4 py-1 md:py-2 rounded-xl transition-all duration-200 group {isActive(item.path)
						? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
						: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}">
					<!-- Icon -->
					<div class="mb-0 md:mb-1 transition-transform group-hover:scale-110">
						{@html item.icon}
					</div>
					<!-- Label -->
					<span class="text-[10px] md:text-xs font-medium">{item.label}</span>
				</a>
			{/each}

			<!-- Presets Button -->
			<button
				type="button"
				onclick={() => showPresets = !showPresets}
				class="flex flex-col items-center px-3 md:px-4 py-1 md:py-2 rounded-xl transition-all duration-200 group text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 {showPresets ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}">
				<div class="mb-0 md:mb-1 transition-transform group-hover:scale-110">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
				</div>
				<span class="text-[10px] md:text-xs font-medium">预设</span>
			</button>
		</nav>
	</div>
</div>

<!-- Presets Popover -->
{#if showPresets}
	<div class="fixed bottom-20 md:bottom-24 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-50 px-4 md:px-0">
		<div class="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">仓库预设</h3>
				<button
					type="button"
					onclick={() => showPresets = false}
					class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Preset List -->
			<div class="max-h-60 overflow-y-auto">
				{#if presets.length === 0}
					<div class="p-4 text-center text-gray-500 dark:text-gray-400">
						暂无预设
					</div>
				{/if}

				{#each presets as preset}
					<div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
						<div class="flex-1">
							<button
								type="button"
								onclick={() => {
									loadPreset(preset);
									showPresets = false;
								}}
								class="text-left w-full">
								<div class="font-medium text-gray-900 dark:text-white">{preset.name}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">{preset.owner}/{preset.repo}</div>
							</button>
						</div>
						<button
							type="button"
							onclick={() => handleDeletePreset(preset.id)}
							class="ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
							</svg>
						</button>
					</div>
				{/each}
			</div>

			<!-- Add Preset Button -->
			{#if !addingPreset}
				<div class="p-4 border-t border-gray-200 dark:border-gray-700">
					<button
						type="button"
						onclick={() => addingPreset = true}
						class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
						+ 添加预设
					</button>
				</div>
			{/if}

			<!-- Add Preset Form -->
			{#if addingPreset}
				<div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
					<input
						type="text"
						placeholder="预设名称"
						bind:value={newPresetName}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
					/>
					<div class="grid grid-cols-2 gap-2">
						<input
							type="text"
							placeholder="Owner"
							bind:value={newOwner}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
						/>
						<input
							type="text"
							placeholder="Repo"
							bind:value={newRepo}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
						/>
					</div>
					<div class="flex space-x-2">
						<button
							type="button"
							onclick={handleAddPreset}
							class="flex-1 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-sm font-medium rounded-md transition-colors">
							保存
						</button>
						<button
							type="button"
							onclick={() => addingPreset = false}
							class="flex-1 py-2 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors">
							取消
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Spacer for bottom content -->
<div class="h-20 md:h-24"></div>
