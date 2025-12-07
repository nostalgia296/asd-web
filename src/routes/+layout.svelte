<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import DockBar from '$lib/components/DockBar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="md:pl-28">
	{@render children()}
</div>

<DockBar />
