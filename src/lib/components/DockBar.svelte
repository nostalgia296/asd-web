<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import PresetSelector from './PresetSelector.svelte';

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

	function openPresets() {
		showPresets = true;
	}

	function closePresets() {
		showPresets = false;
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<!-- Dock Bar -->
<div class="fixed bottom-0 md:bottom-auto md:left-0 md:top-0 left-0 right-0 z-40 w-full md:w-24">
	<!-- Background blur effect -->
	<div class="relative">
		<div class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-t md:border-r md:border-t-0 border-gray-200 dark:border-gray-700 md:rounded-none md:rounded-r-2xl"></div>

		<!-- Dock content -->
		<nav class="relative flex md:flex-col items-center justify-around md:justify-start px-1 md:px-0 py-2 md:py-8">
			{#each navItems as item}
				<a
					href={item.path}
					class="flex md:w-20 flex-col items-center md:justify-center px-3 md:px-0 py-1 md:py-6 transition-all duration-200 group {isActive(item.path)
						? 'bg-blue-100/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 md:rounded-none md:rounded-r-xl md:w-24'
						: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 md:rounded-xl'} rounded-xl w-full">
					<!-- Icon -->
					<div class="mb-0 md:mb-1 transition-transform group-hover:scale-110">
						{@html item.icon}
					</div>
					<!-- Label -->
					<span class="text-[10px] md:text-xs font-medium md:opacity-0 md:group-hover:opacity-100 md:absolute md:left-full md:ml-3 md:px-2 md:py-1 md:bg-gray-900 md:text-white md:rounded md:whitespace-nowrap md:dark:bg-gray-700 md:transition-opacity md:duration-200">{item.label}</span>
				</a>
			{/each}

			<!-- Presets Button -->
			<button
				type="button"
				onclick={openPresets}
				class="flex md:w-20 flex-col items-center md:justify-center px-3 md:px-0 py-1 md:py-6 transition-all duration-200 group text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl md:rounded-xl w-full">
				<div class="mb-0 md:mb-1 transition-transform group-hover:scale-110">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
				</div>
				<span class="text-[10px] md:text-xs font-medium md:opacity-0 md:group-hover:opacity-100 md:absolute md:left-full md:ml-3 md:px-2 md:py-1 md:bg-gray-900 md:text-white md:rounded md:whitespace-nowrap md:dark:bg-gray-700 md:transition-opacity md:duration-200">预设</span>
			</button>
		</nav>
	</div>
</div>

<!-- PresetSelector Component -->
<PresetSelector isOpen={showPresets} onClose={closePresets} />

<!-- Spacer for bottom content on mobile -->
<div class="h-20 md:h-0"></div>
