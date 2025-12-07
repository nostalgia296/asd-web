import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// 这些是默认值，显示在这里以供参考
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',  // 对于SPA，设置fallback以支持客户端路由
			precompress: false,
			strict: true
		}),
		prerender: {
			// 对于 SPA，需要指定入口点
			entries: ['/']
		},
		paths: {
		    base: "asd-web"
		}
	}
};

export default config;
