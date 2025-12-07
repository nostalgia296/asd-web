<script lang="ts">
	import { getRepo } from '$lib/services/github.js';

	interface Props {
		owner: string;
		repo: string;
	}

	let { owner, repo }: Props = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let repoData = $state<any>(null);

	// Language color mapping (GitHub's official colors)
	const languageColors: Record<string, string> = {
		JavaScript: '#f1e05a',
		TypeScript: '#2b7489',
		Python: '#3572A5',
		Go: '#00ADD8',
		Rust: '#dea584',
		Java: '#b07219',
		'C++': '#f34b7d',
		'C#': '#178600',
		Vue: '#41b883',
		Svelte: '#ff3e00',
		Ruby: '#701516',
		PHP: '#4F5D95',
		Shell: '#89e051',
		HTML: '#e34c26',
		CSS: '#563d7c',
		Swift: '#fa7343',
		Kotlin: '#A97BFF',
		Dart: '#00B4AB',
		Scala: '#c22d40',
		R: '#198CE7',
		Objective: '#6866fb'
	};

	function getLanguageColor(lang: string | undefined): string {
		if (!lang) return '#9CA3AF';
		return languageColors[lang] || '#9CA3AF';
	}

	async function loadRepo() {
		try {
			loading = true;
			error = null;
			repoData = await getRepo(owner, repo);
		} catch (e) {
			error = e instanceof Error ? e.message : '加载失败';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadRepo();
	});
</script>

<div class="w-full max-w-md">
	{#if loading}
		<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
			<div class="flex items-center space-x-4">
				<div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
				<div class="flex-1">
					<div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
					<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2"></div>
				</div>
			</div>
			<div class="mt-4 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
			<div class="mt-2 h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
			<div class="flex justify-between mt-4">
				<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
				<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
			<div class="flex items-start">
				<div class="text-red-600 dark:text-red-400 mt-0.5">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3 text-sm text-red-700 dark:text-red-300">
					<p class="font-medium mb-1">加载失败</p>
					<p class="text-xs opacity-80">仓库: {owner}/{repo}</p>
					<p class="text-xs opacity-80 mt-1">{error}</p>
					<p class="text-xs opacity-80 mt-2">提示：可能是 GitHub API 速率限制，请稍后再试</p>
				</div>
			</div>
		</div>
	{:else if repoData}
		<div class="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
			<div class="p-4">
				<div class="flex items-start justify-between mb-2">
					<div class="flex-1">
						<div class="flex items-center space-x-2">
							{#if repoData.owner?.avatar_url}
								<img
									src={repoData.owner.avatar_url}
									alt={repoData.owner.login}
									class="w-6 h-6 rounded-full flex-shrink-0"
								/>
							{/if}
							<a
								href={repoData.html_url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-lg font-semibold text-gray-900 dark:text-white hover:text-[#2563eb] dark:hover:text-[#60a5fa] transition-colors"
							>
								{repoData.owner?.login}/{repoData.name}
							</a>
						</div>
					</div>
				</div>

				{#if repoData.description}
					<p class="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
						{repoData.description}
					</p>
				{/if}

				<div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
					<div class="flex items-center space-x-4">
						{#if repoData.language}
							<span class="flex items-center text-sm text-gray-500 dark:text-gray-400">
								<span class="w-3 h-3 rounded-full mr-1.5" style:background-color={getLanguageColor(repoData.language)}></span>
								{repoData.language}
							</span>
						{/if}
						<div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
							<svg class="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							{repoData.stargazers_count.toLocaleString()}
						</div>
						<div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
							<svg class="w-4 h-4 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							{repoData.forks_count.toLocaleString()}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
