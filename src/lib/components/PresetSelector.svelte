<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		loadPresets,
		addPreset,
		deletePreset,
		type Preset
	} from '$lib/utils/presets';

	let { isOpen = false, onClose = () => {} } = $props();

	function handleBackdropClick() {
		onClose();
	}

	let presets: Preset[] = $state([]);
	let filteredPresets: Preset[] = $state([]);
	let searchQuery = $state('');
	let newPresetName = $state('');
	let newOwner = $state('');
	let newRepo = $state('');
	let addingPreset = $state(false);

	onMount(() => {
		loadPresetsFromStorage();
	});

	// 监听搜索查询变化
	$effect(() => {
		if (searchQuery.trim() === '') {
			filteredPresets = presets;
		} else {
			const query = searchQuery.toLowerCase();
			filteredPresets = presets.filter(preset =>
				preset.name.toLowerCase().includes(query) ||
				preset.owner.toLowerCase().includes(query) ||
				preset.repo.toLowerCase().includes(query) ||
				`${preset.owner}/${preset.repo}`.toLowerCase().includes(query)
			);
		}
	});

	function loadPresetsFromStorage() {
		presets = loadPresets();
		filteredPresets = presets;
	}

	function handleAddPreset() {
		if (newPresetName.trim() && newOwner.trim() && newRepo.trim()) {
			addPreset(newPresetName.trim(), newOwner.trim(), newRepo.trim());
			loadPresetsFromStorage();
			newPresetName = '';
			newOwner = '';
			newRepo = '';
			addingPreset = false;
			searchQuery = ''; // 清空搜索以显示新添加的预设
		}
	}

	function handleDeletePreset(id: string) {
		deletePreset(id);
		loadPresetsFromStorage();
	}

	function loadPreset(preset: Preset) {
		window.location.href = `${base}/?owner=${encodeURIComponent(preset.owner)}&repo=${encodeURIComponent(preset.repo)}`;
		onClose();
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
	}

	function clearSearch() {
		searchQuery = '';
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
		role="button"
		tabindex="0"
		aria-label="关闭"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && onClose()}
	></div>

	<!-- Presets Popover -->
	<div class="fixed bottom-20 md:bottom-auto md:left-24 md:top-4 left-0 right-0 z-50 px-4 md:px-0">
		<div class="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">仓库预设</h3>
				<button
					type="button"
					onclick={() => onClose()}
					aria-label="关闭"
					class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Search Bar -->
			<div class="p-4 border-b border-gray-200 dark:border-gray-700">
				<div class="relative">
					<input
						type="text"
						placeholder="搜索预设名称、仓库或作者..."
						value={searchQuery}
						oninput={handleSearchInput}
						class="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
					/>
					<!-- Search Icon -->
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2">
						<svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
						</svg>
					</div>
					<!-- Clear Button -->
					{#if searchQuery}
						<button
							type="button"
							onclick={clearSearch}
							aria-label="清除搜索"
							class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					{/if}
				</div>
				{#if searchQuery && filteredPresets.length === 0}
					<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
						未找到匹配的预设
					</div>
				{:else if searchQuery}
					<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
						找到 {filteredPresets.length} 个预设
					</div>
				{/if}
			</div>

			<!-- Preset List -->
			<div class="max-h-60 overflow-y-auto">
				{#if filteredPresets.length === 0}
					<div class="p-4 text-center text-gray-500 dark:text-gray-400">
						{searchQuery ? '未找到匹配的预设' : '暂无预设'}
					</div>
				{/if}

				{#each filteredPresets as preset}
					<div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
						<div class="flex-1">
							<button
								type="button"
								onclick={() => loadPreset(preset)}
								class="text-left w-full">
								<div class="font-medium text-gray-900 dark:text-white">{preset.name}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">{preset.owner}/{preset.repo}</div>
							</button>
						</div>
						<button
							type="button"
							onclick={() => handleDeletePreset(preset.id)}
							aria-label="删除预设"
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
							onclick={() => {
								addingPreset = false;
								newPresetName = '';
								newOwner = '';
								newRepo = '';
							}}
							class="flex-1 py-2 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors">
							取消
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}