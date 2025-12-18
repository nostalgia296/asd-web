export interface WebDAVConfig {
	baseUrl: string;
	username: string;
	password: string;
	remotePath: string;
}

export interface BackupFile {
	name: string;
	size: number;
	lastModified: string;
}

export class WebDAVService {
	private config: WebDAVConfig;

	constructor(config: WebDAVConfig) {
		// 确保 baseUrl 以斜杠结尾
		this.config = {
			...config,
			baseUrl: config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`
		};
	}

	private getAuthHeaders(): HeadersInit {
		const credentials = `${this.config.username}:${this.config.password}`;
		const encoded = btoa(credentials);
		return {
			'Authorization': `Basic ${encoded}`,
			'User-Agent': 'asd-webdav-client/1.0'
		};
	}

	private normalizePath(path: string): string {
		return path.endsWith('/') ? path : `${path}/`;
	}

	async uploadFile(file: File, remoteFileName: string): Promise<boolean> {
		const normalizedPath = this.normalizePath(this.config.remotePath);
		const url = `${this.config.baseUrl}${normalizedPath.replace(/^\//, '')}${remoteFileName}`;

		try {
			// 尝试确保目录存在，但如果失败也不影响上传
			try {
				await this.createDirectory(this.config.remotePath);
			} catch (dirError) {
				console.warn('目录创建失败，但继续尝试上传:', dirError);
				// 某些 WebDAV 服务器可能不支持 MKCOL，但允许直接上传到不存在的目录
			}

			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					...this.getAuthHeaders(),
					'Content-Type': 'application/octet-stream'
				},
				body: file
			});

			if (response.status === 201 || response.status === 204 || response.status === 200) {
				return true;
			} else if (response.status === 409) {
				// 如果是冲突错误，可能是目录不存在，再尝试一次创建目录
				try {
					await this.createDirectory(this.config.remotePath);
					// 重新尝试上传
					const retryResponse = await fetch(url, {
						method: 'PUT',
						headers: {
							...this.getAuthHeaders(),
							'Content-Type': 'application/octet-stream'
						},
						body: file
					});
					return retryResponse.status === 201 || retryResponse.status === 204 || retryResponse.status === 200;
				} catch (retryError) {
					throw new Error(`上传失败: 目录冲突且无法创建 - ${retryError instanceof Error ? retryError.message : '未知错误'}`);
				}
			} else {
				const errorText = await response.text();
				throw new Error(`上传失败: HTTP ${response.status} - ${errorText}`);
			}
		} catch (error) {
			console.error('上传失败:', error);
			throw error;
		}
	}

	async createDirectory(path: string): Promise<boolean> {
		if (!path || path === '/') {
			return true; // 根目录不需要创建
		}

		const normalizedPath = this.normalizePath(path);
		const url = `${this.config.baseUrl}${normalizedPath.replace(/^\//, '')}`;

		try {
			const response = await fetch(url, {
				method: 'MKCOL',
				headers: this.getAuthHeaders()
			});

			// 201: Created, 405: Method Not Allowed (目录已存在或不支持MKCOL)
			// 409: Conflict (父目录不存在), 204: No Content (某些服务器返回)
			if (response.status === 201 || response.status === 204 || response.status === 405) {
				return true;
			} else if (response.status === 409) {
				// 尝试创建父目录
				const parentPath = path.substring(0, path.lastIndexOf('/'));
				if (parentPath && parentPath !== path && parentPath !== '') {
					await this.createDirectory(parentPath);
					return await this.createDirectory(path);
				}
				throw new Error('无法创建目录，父目录不存在');
			} else if (response.status === 404) {
				// 某些服务器在父目录不存在时返回404
				const parentPath = path.substring(0, path.lastIndexOf('/'));
				if (parentPath && parentPath !== path && parentPath !== '') {
					await this.createDirectory(parentPath);
					return await this.createDirectory(path);
				}
				throw new Error('目录路径不存在');
			} else {
				const errorText = await response.text();
				throw new Error(`创建目录失败: HTTP ${response.status} - ${errorText}`);
			}
		} catch (error) {
			console.error('创建目录失败:', error);
			throw error;
		}
	}

	async downloadFile(remoteFileName: string): Promise<Blob> {
		const normalizedPath = this.normalizePath(this.config.remotePath);
		const url = `${this.config.baseUrl}${normalizedPath.replace(/^\//, '')}${remoteFileName}`;

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: this.getAuthHeaders()
			});

			if (response.status === 200) {
				return await response.blob();
			} else if (response.status === 404) {
				throw new Error('文件不存在');
			} else {
				throw new Error(`下载失败: HTTP ${response.status}`);
			}
		} catch (error) {
			console.error('下载失败:', error);
			throw error;
		}
	}

	async listFiles(): Promise<BackupFile[]> {
		const normalizedPath = this.normalizePath(this.config.remotePath);
		const url = `${this.config.baseUrl}${normalizedPath.replace(/^\//, '')}`;

		try {
			const response = await fetch(url, {
				method: 'PROPFIND',
				headers: {
					...this.getAuthHeaders(),
					'Depth': '1',
					'Content-Type': 'application/xml'
				},
				body: `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <allprop/>
</propfind>`
			});

			if (response.status === 207) {
				const text = await response.text();
				return this.parsePropFindResponse(text);
			} else if (response.status === 404) {
				// 目录不存在，返回空列表
				return [];
			} else if (response.status === 200) {
				// 某些服务器可能返回200而不是207
				const text = await response.text();
				try {
					return this.parsePropFindResponse(text);
				} catch {
					return []; // 解析失败也返回空列表
				}
			} else {
				const errorText = await response.text();
				throw new Error(`列出文件失败: HTTP ${response.status} - ${errorText}`);
			}
		} catch (error) {
			console.error('列出文件失败:', error);
			throw error;
		}
	}

	async fileExists(remoteFileName: string): Promise<boolean> {
		const normalizedPath = this.normalizePath(this.config.remotePath);
		const url = `${this.config.baseUrl}${normalizedPath.replace(/^\//, '')}${remoteFileName}`;

		try {
			const response = await fetch(url, {
				method: 'HEAD',
				headers: this.getAuthHeaders()
			});

			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	private parsePropFindResponse(xmlText: string): BackupFile[] {
		const files: BackupFile[] = [];

		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

			// 尝试多种命名空间方式获取响应元素
			let responses: HTMLCollectionOf<Element>;

			if (xmlDoc.getElementsByTagName('d:response').length > 0) {
				responses = xmlDoc.getElementsByTagName('d:response');
			} else if (xmlDoc.getElementsByTagName('D:response').length > 0) {
				responses = xmlDoc.getElementsByTagName('D:response');
			} else if (xmlDoc.getElementsByTagNameNS('DAV:', 'response').length > 0) {
				responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response');
			} else {
				responses = xmlDoc.getElementsByTagName('response');
			}

			for (let i = 0; i < responses.length; i++) {
				const response = responses[i];

				// 获取 href 元素，尝试多种命名空间
				let hrefElement: Element | null = null;
				const hrefSelectors = ['d:href', 'D:href', 'href'];

				for (const selector of hrefSelectors) {
					const elements = response.getElementsByTagName(selector);
					if (elements.length > 0) {
						hrefElement = elements[0];
						break;
					}
				}

				if (hrefElement) {
					const href = hrefElement.textContent || '';
					const fileName = href.includes('/') ? href.substring(href.lastIndexOf('/') + 1) : href;

					// 只关注备份文件
					if (fileName && (fileName.startsWith('backup-') && fileName.endsWith('.json'))) {
						let size = 0;
						let lastModified = '';

						// 尝试获取属性信息
						const propStatSelectors = ['d:propstat', 'D:propstat', 'propstat'];
						for (const selector of propStatSelectors) {
							const propStats = response.getElementsByTagName(selector);
							if (propStats.length > 0) {
								const propStat = propStats[0];

								// 获取大小
								const sizeSelectors = ['d:getcontentlength', 'D:getcontentlength', 'getcontentlength'];
								for (const sizeSelector of sizeSelectors) {
									const sizeElements = propStat.getElementsByTagName(sizeSelector);
									if (sizeElements.length > 0) {
										size = parseInt(sizeElements[0].textContent || '0');
										break;
									}
								}

								// 获取修改时间
								const modifiedSelectors = ['d:getlastmodified', 'D:getlastmodified', 'getlastmodified'];
								for (const modifiedSelector of modifiedSelectors) {
									const modifiedElements = propStat.getElementsByTagName(modifiedSelector);
									if (modifiedElements.length > 0) {
										lastModified = modifiedElements[0].textContent || '';
										break;
									}
								}
								break;
							}
						}

						files.push({
							name: fileName,
							size,
							lastModified
						});
					}
				}
			}
		} catch (error) {
			console.error('解析 WebDAV 响应失败:', error);
		}

		return files;
	}

	async testConnection(): Promise<boolean> {
		try {
			// 首先尝试简单的 OPTIONS 请求来测试连接
			const response = await fetch(this.config.baseUrl, {
				method: 'OPTIONS',
				headers: this.getAuthHeaders()
			});

			// 如果服务器支持 OPTIONS，检查响应状态
			if (response.status === 200 || response.status === 204 || response.status === 405) {
				return true;
			}

			// 如果不支持 OPTIONS，尝试 PROPFIND
			const propfindResponse = await fetch(this.config.baseUrl, {
				method: 'PROPFIND',
				headers: {
					...this.getAuthHeaders(),
					'Depth': '0',
					'Content-Type': 'application/xml'
				},
				body: `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <allprop/>
</propfind>`
			});

			return propfindResponse.status === 207 || propfindResponse.status === 200;
		} catch (error) {
			console.error('连接测试失败:', error);
			return false;
		}
	}
}