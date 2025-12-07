<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import DockBar from '$lib/components/DockBar.svelte';
	import { onMount } from 'svelte';
	import { initTheme } from '$lib/utils/settings';

	let { children } = $props();

	onMount(() => {
		initTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="md:pl-28">
	{@render children()}
</div>

<DockBar />
