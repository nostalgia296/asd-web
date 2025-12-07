export interface GitHubRepo {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	updated_at: string;
	owner: {
		login: string;
		avatar_url: string;
		html_url: string;
	};
}

export interface GitHubUser {
	login: string;
	avatar_url: string;
	html_url: string;
}

export interface GitHubRelease {
	id: number;
	tag_name: string;
	name: string | null;
	body: string | null;
	created_at: string;
	published_at: string;
	prerelease: boolean;
	draft: boolean;
	assets: GitHubAsset[];
	author: GitHubUser;
	html_url: string;
}

export interface GitHubAsset {
	id: number;
	name: string;
	size: number;
	download_count: number;
	created_at: string;
	browser_download_url: string;
	content_type: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

// Get GitHub token from environment (if available)
const GITHUB_TOKEN = import.meta.env.PUBLIC_GITHUB_TOKEN;

// Common headers
const headers: Record<string, string> = {
	'Accept': 'application/vnd.github.v3+json',
	'User-Agent': 'GitHub-Repo-Card-App'
};

// Add auth token if available
if (GITHUB_TOKEN) {
	headers['Authorization'] = `token ${GITHUB_TOKEN}`;
}

/**
 * 获取仓库信息
 * @param owner 仓库所有者
 * @param repo 仓库名称
 */
export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
	const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
		headers
	});

	if (!response.ok) {
		// Try to get more detailed error message
		let errorMessage = response.statusText;
		if (response.status === 403) {
			errorMessage = 'API 速率限制，请稍后再试或配置 GitHub Token';
		} else if (response.status === 404) {
			errorMessage = '仓库不存在或无权访问';
		}
		throw new Error(`HTTP ${response.status}: ${errorMessage}`);
	}

	return response.json();
}

/**
 * 获取用户信息
 * @param username GitHub用户名
 */
export async function getUser(username: string): Promise<GitHubUser> {
	const response = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
		headers
	});

	if (!response.ok) {
		let errorMessage = response.statusText;
		if (response.status === 403) {
			errorMessage = 'API 速率限制，请稍后再试或配置 GitHub Token';
		} else if (response.status === 404) {
			errorMessage = '用户不存在';
		}
		throw new Error(`HTTP ${response.status}: ${errorMessage}`);
	}

	return response.json();
}

/**
 * 获取用户的仓库列表
 * @param username GitHub用户名
 * @param per_page 每页数量，默认30
 */
export async function getUserRepos(
	username: string,
	per_page: number = 30
): Promise<GitHubRepo[]> {
	const response = await fetch(
		`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=${per_page}`,
		{ headers }
	);

	if (!response.ok) {
		let errorMessage = response.statusText;
		if (response.status === 403) {
			errorMessage = 'API 速率限制，请稍后再试或配置 GitHub Token';
		} else if (response.status === 404) {
			errorMessage = '用户不存在';
		}
		throw new Error(`HTTP ${response.status}: ${errorMessage}`);
	}

	return response.json();
}

/**
 * 获取仓库的 releases
 * @param owner 仓库所有者
 * @param repo 仓库名称
 * @param per_page 每页数量，默认30
 */
export async function getReleases(
	owner: string,
	repo: string,
	per_page: number = 30
): Promise<GitHubRelease[]> {
	const response = await fetch(
		`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=${per_page}`,
		{ headers }
	);

	if (!response.ok) {
		let errorMessage = response.statusText;
		if (response.status === 403) {
			errorMessage = 'API 速率限制，请稍后再试或配置 GitHub Token';
		} else if (response.status === 404) {
			errorMessage = '仓库不存在或无权访问';
		}
		throw new Error(`HTTP ${response.status}: ${errorMessage}`);
	}

	return response.json();
}

/**
 * 下载 GitHub Release Asset - 直接跳转到浏览器下载链接
 * @param downloadUrl 浏览器下载 URL (asset.browser_download_url)
 */
export async function downloadAsset(downloadUrl: string) {
	// 直接打开新窗口跳转到下载链接
	window.open(downloadUrl, '_blank');
}
