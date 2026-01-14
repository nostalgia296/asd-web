<script lang="ts">
	import { getReleases, downloadAsset, type GitHubRelease } from '$lib/services/github';
	import { Marked } from 'marked';
	import markedAlert from 'marked-alert';
	import DOMPurify from 'dompurify';
	import { getMirrorUrl } from '$lib/utils/settings';
	import { tick } from 'svelte';

	interface Props {
		owner: string;
		repo: string;
	}

	let { owner, repo }: Props = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let releases = $state<GitHubRelease[]>([]);
	let downloading = $state<Record<string, boolean>>({});

	const markedInstance = new Marked({
		breaks: true
	}).use(markedAlert());

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function truncateText(text: string, maxLength: number): string {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	// Cache for rendered markdown
	let renderedBodies = $state<Record<string, string>>({});

	// Track expanded state for releases with long bodies
	let expandedReleases = $state<Record<string, boolean>>({});
	// Track scroll positions when expanding, to restore when collapsing
	let expandScrollPositions = $state<Record<string, number>>({});

	// Toggle expanded state with scroll position preservation
	async function toggleExpanded(releaseId: string, event: MouseEvent) {
		// Get the button element and its release card
		const button = event.currentTarget as HTMLElement;
		const releaseCard = button.closest('.release-card') as HTMLElement | null;

		const isCurrentlyExpanded = expandedReleases[releaseId];

		if (!isCurrentlyExpanded) {
			// About to expand - save current scroll position
			expandScrollPositions[releaseId] = window.scrollY;
		}

		// Toggle the expanded state
		expandedReleases[releaseId] = !isCurrentlyExpanded;

		// Wait for DOM to update
		await tick();

		// After DOM update, handle scroll position
		if (isCurrentlyExpanded && expandScrollPositions[releaseId] !== undefined) {
			// Was expanded, now collapsing - restore to expand position
			const savedPosition = expandScrollPositions[releaseId];
			// Use smooth scroll for better UX
			window.scrollTo({
				top: savedPosition,
				behavior: 'smooth'
			});
		}
	}

	// Render markdown bodies when releases change
	$effect(() => {
		if (releases.length > 0) {
			(async () => {
				const cache: Record<string, string> = {};
				for (const release of releases) {
					if (release.body) {
						try {
							const html = await markedInstance.parse(release.body);
							cache[release.id] = DOMPurify.sanitize(html);
						} catch (e) {
							console.error('Failed to render markdown:', e);
							cache[release.id] = '';
						}
					}
				}
				renderedBodies = cache;
			})();
		} else {
			renderedBodies = {};
		}
	});

	async function loadReleases() {
		try {
			loading = true;
			error = null;
			releases = await getReleases(owner, repo);
		} catch (e) {
			error = e instanceof Error ? e.message : '加载失败';
		} finally {
			loading = false;
		}
	}

	async function handleDownload(browserUrl: string, assetId: string) {
		try {
			downloading[assetId] = true;

			// Check if mirror is configured
			const mirrorUrl = getMirrorUrl();
			const finalUrl = mirrorUrl ? mirrorUrl + browserUrl : browserUrl;

			// Log for debugging
			console.log('下载链接:', finalUrl);

			await downloadAsset(finalUrl);
		} catch (e) {
			alert(`下载失败: ${e instanceof Error ? e.message : '未知错误'}`);
		} finally {
			downloading[assetId] = false;
		}
	}

	function handleCopyUrl(url: string) {
		navigator.clipboard.writeText(url).then(() => {
			alert('下载链接已复制到剪贴板');
		}).catch(() => {
			alert('复制失败，请手动复制');
		});
	}

	// Load releases on component mount
	$effect(() => {
		if (owner && repo) {
			loadReleases();
		}
	});
</script>

<div class="w-full">
	{#if loading}
		<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
			<div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
			<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
			<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-6"></div>
			<div class="space-y-2">
				<div class="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
				<div class="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
	{:else if releases.length > 0}
		<div class="space-y-6">
			{#each releases as release, index}
				<div class="release-card bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
					<div class="p-6">
						<!-- Release Header -->
						<div class="mb-4">
							<!-- First row: Title and avatar -->
							<div class="flex items-start justify-between mb-2">
								<h3 class="text-xl font-bold text-gray-900 dark:text-white flex-1 pr-3 break-words" title={release.name || release.tag_name}>
									{release.name || release.tag_name}
								</h3>
								{#if release.author?.avatar_url}
									<img
										src={release.author.avatar_url}
										alt={release.author.login}
										title={`发布者: ${release.author.login}`}
										class="w-10 h-10 rounded-full flex-shrink-0 ml-3"
									/>
								{/if}
							</div>
							<!-- Second row: Tags and meta info -->
							<div class="flex items-center flex-wrap gap-2 mt-3">
								<!-- Tags -->
								<div class="flex items-center gap-2">
									{#if release.prerelease}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
											预发布
										</span>
									{/if}
									{#if release.draft}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
											草稿
										</span>
									{/if}
									{#if index === 0}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
											最新
										</span>
									{/if}
								</div>
								<!-- Meta info -->
								<div class="flex items-center flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
									<span>标签: {release.tag_name}</span>
									<span class="text-gray-300 dark:text-gray-600">•</span>
									<span>发布于 {formatDate(release.published_at)}</span>
									<span class="text-gray-300 dark:text-gray-600">•</span>
									<a href={release.html_url} target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">
										在 GitHub 查看
									</a>
								</div>
							</div>
						</div>

						<!-- Release Notes -->
						{#if release.body}
							<div class="mb-6">
								{#if release.body.length > 100 && !expandedReleases[release.id]}
									<!-- 收起状态：限制高度并添加渐变遮罩 -->
									<div class="relative">
										<div class="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100
											prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1 prose-code:rounded prose-code:text-sm
											prose-pre:bg-gray-100 prose-pre:dark:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
											prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
											prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-td:border prose-td:p-2
											prose-th:bg-gray-50 prose-th:dark:bg-gray-800 max-h-96 overflow-hidden">
											{#if renderedBodies[release.id] !== undefined}
												{@html renderedBodies[release.id]}
											{/if}
										</div>
										<div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white dark:to-gray-900 pointer-events-none"></div>
									</div>
									<div class="mt-3 text-center">
										<button onclick={(event) => toggleExpanded(String(release.id), event)} class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
											展开查看更多
											<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
											</svg>
										</button>
									</div>
								{:else}
									<!-- 展开状态或无限制 -->
									<div class="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100
										prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1 prose-code:rounded prose-code:text-sm
										prose-pre:bg-gray-100 prose-pre:dark:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
										prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
										prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-td:border prose-td:p-2
										prose-th:bg-gray-50 prose-th:dark:bg-gray-800">
										{#if renderedBodies[release.id] !== undefined}
											{@html renderedBodies[release.id]}
										{/if}
									</div>
									{#if release.body.length > 100}
										<div class="mt-3 text-center">
											<button onclick={(event) => toggleExpanded(String(release.id), event)} class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
												收起
												<svg class="w-4 h-4 ml-1 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
												</svg>
											</button>
										</div>
									{/if}
								{/if}
							</div>
						{/if}

						<!-- Assets -->
						{#if release.assets.length > 0}
							<div class="border-t border-gray-200 dark:border-gray-700 pt-4">
								<h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
									下载资源 ({release.assets.length})
								</h4>
								<div class="space-y-2">
									{#each release.assets as asset}
										<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
											<div class="flex-1 min-w-0">
												<div class="flex items-center space-x-2">
													<svg class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
													</svg>
													<span class="text-sm font-medium text-gray-900 dark:text-white truncate" title={asset.name}>
														{asset.name}
													</span>
												</div>
												<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
													<span>{formatFileSize(asset.size)}</span>
													<span class="mx-2">•</span>
													<span>{asset.download_count} 次下载</span>
												</div>
											</div>
										<div class="flex flex-col sm:flex-row gap-2 sm:gap-3 ml-0 sm:ml-4 mt-3 sm:mt-0">												<button													onclick={() => handleCopyUrl(asset.browser_download_url)}													class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors order-2 sm:order-1"													title="复制下载链接"												>													复制链接												</button>												<button													onclick={() => handleDownload(asset.browser_download_url, asset.id.toString())}													disabled={downloading[asset.id.toString()]}													class="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"													title="直接下载"												>													{#if downloading[asset.id.toString()]}														<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">															<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>															<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>														</svg>													{:else}														下载													{/if}												</button>											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
								该 release 没有可下载的资源
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			<svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<p>没有找到任何 release</p>
			<p class="text-xs mt-2">该仓库还没有发布任何版本</p>
		</div>
	{/if}
</div>
