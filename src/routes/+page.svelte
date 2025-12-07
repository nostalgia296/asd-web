<script lang="ts">
	import GitHubReleaseCard from '$lib/components/GitHubReleaseCard.svelte';
	import GitHubRepoCard from '$lib/components/GitHubRepoCard.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		parseGitHubUrl,
		getOwnerRepoFromUrl
	} from '$lib/utils/github-url';

	let owner = $state('');
	let repo = $state('');
	let showReleases = $state(false);
	let inputMode = $state<'manual' | 'url'>('manual');
	let repoUrl = $state('');

	// 快照，用于在组件显示后锁定值
	let ownerSnapshot = $state('');
	let repoSnapshot = $state('');

	// 从URL参数加载
	onMount(() => {
		if (browser) {
			const params = getOwnerRepoFromUrl();
			if (params) {
				owner = params.owner;
				repo = params.repo;
				inputMode = 'manual';
				// 延迟加载以确保组件渲染完成
				setTimeout(() => {
					if (owner.trim() && repo.trim()) {
						// 保存快照并显示
						ownerSnapshot = owner.trim();
						repoSnapshot = repo.trim();
						showReleases = true;
					}
				}, 100);
			}
		}
	});

	function loadReleases() {
		if (owner.trim() && repo.trim()) {
			// 保存快照，锁定当前值
			ownerSnapshot = owner.trim();
			repoSnapshot = repo.trim();
			showReleases = true;
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (inputMode === 'url') {
			const parsed = parseGitHubUrl(repoUrl);
			if (parsed) {
				owner = parsed.owner;
				repo = parsed.repo;
				// 保存快照
				ownerSnapshot = parsed.owner;
				repoSnapshot = parsed.repo;
				showReleases = true;
			}
		} else {
			loadReleases();
		}
	}

	function switchMode(mode: 'manual' | 'url') {
		inputMode = mode;
		if (mode === 'url') {
			// 清空原有的输入
			owner = '';
			repo = '';
		} else {
			repoUrl = '';
		}
		showReleases = false;
	}
</script>

<svelte:head>
	<title>GitHub Release 下载工具</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 md:py-12">
	<div class="max-w-5xl mx-auto px-4 sm:px-8 lg:px-10">
		<!-- Header -->
		<div class="mb-10 md:mb-12">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">asd</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">GitHub Release 文件下载工具</p>
		</div>

		<!-- Input Form -->
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8 md:mb-10">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">输入仓库信息</h2>

			<!-- Mode Switcher -->
			<div class="flex mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
				<button
					type="button"
					onclick={() => switchMode('manual')}
					class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors {inputMode === 'manual' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
				>
					手动输入
				</button>
				<button
					type="button"
					onclick={() => switchMode('url')}
					class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors {inputMode === 'url' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
				>
					GitHub 地址
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if inputMode === 'manual'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="owner" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								仓库所有者 (Owner)
							</label>
							<input
								id="owner"
								type="text"
								placeholder="例如: nostalgia296"
								bind:value={owner}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>
						<div>
							<label for="repo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								仓库名称 (Repo)
							</label>
							<input
								id="repo"
								type="text"
								placeholder="例如: asd"
								bind:value={repo}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>
					</div>
					<div class="mt-5">
						<button
							type="submit"
							class="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
							disabled={!owner || !repo}
						>
							<span class="text-sm">加载 Releases</span>
						</button>
					</div>
				{:else}
					<div class="mb-5">
						<label for="repoUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							GitHub 仓库地址或 owner/repo
						</label>
						<input
							id="repoUrl"
							type="text"
							placeholder="例如: https://github.com/nostalgia296/asd 或 nostalgia296/asd"
							bind:value={repoUrl}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							required
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							支持完整 GitHub URL 或 owner/repo 格式
						</p>
					</div>
					<button
						type="submit"
						class="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
						disabled={!repoUrl}
					>
						<span class="text-sm">加载 Releases</span>
					</button>
				{/if}
			</form>
		</div>

		<!-- Release Cards -->
		{#if showReleases}
			<div>
				<div class="mb-4 flex items-center justify-between">
                   <GitHubRepoCard owner={ownerSnapshot} repo={repoSnapshot}/>
				</div>
				<GitHubReleaseCard owner={ownerSnapshot} repo={repoSnapshot} />
			</div>
		{:else}
			<div class="hidden"></div>
		{/if}
	</div>
</div>
