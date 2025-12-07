/**
 * 解析 GitHub URL 或 owner/repo 格式字符串
 * @param input GitHub URL 或 owner/repo 格式字符串
 * @returns 解析后的 owner 和 repo，如果解析失败返回 null
 *
 * @example
 * // 解析完整 URL
 * parseGitHubUrl('https://github.com/facebook/react')
 * // => { owner: 'facebook', repo: 'react' }
 *
 * @example
 * // 解析 owner/repo 格式
 * parseGitHubUrl('facebook/react')
 * // => { owner: 'facebook', repo: 'react' }
 *
 * @example
 * // 解析带 .git 的 URL
 * parseGitHubUrl('https://github.com/facebook/react.git')
 * // => { owner: 'facebook', repo: 'react' }
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
	const trimmed = input.trim();

	// 如果是 owner/repo 格式（不包含 http）
	if (trimmed.includes('/') && !trimmed.startsWith('http')) {
		const parts = trimmed.split('/');
		if (parts.length >= 2) {
			return {
				owner: parts[0],
				repo: parts[1].replace(/\.git$/, '')
			};
		}
	}

	// 如果是 GitHub URL
	try {
		const urlObj = new URL(trimmed);
		if (urlObj.hostname === 'github.com') {
			const parts = urlObj.pathname.split('/').filter(p => p);
			if (parts.length >= 2) {
				return {
					owner: parts[0],
					repo: parts[1].replace(/\.git$/, '')
				};
			}
		}
	} catch (e) {
		// 不是有效的URL，忽略
	}

	return null;
}

/**
 * 从当前页面的 URL 参数获取 owner 和 repo
 * @returns 从 URL 参数解析的 owner 和 repo，如果参数不存在返回 null
 */
export function getOwnerRepoFromUrl(): { owner: string; repo: string } | null {
	if (typeof window === 'undefined') {
		return null;
	}

	const urlParams = new URLSearchParams(window.location.search);
	const owner = urlParams.get('owner');
	const repo = urlParams.get('repo');

	if (owner && repo) {
		return { owner, repo };
	}

	return null;
}

/**
 * 构建带有 owner 和 repo 参数的 URL
 * @param owner 仓库所有者
 * @param repo 仓库名称
 * @returns 构建好的 URL 字符串
 */
export function buildOwnerRepoUrl(owner: string, repo: string): string {
	const params = new URLSearchParams();
	params.set('owner', owner);
	params.set('repo', repo);
	return `/?${params.toString()}`;
}
