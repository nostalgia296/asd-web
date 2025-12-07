# GitHub 仓库卡片

使用 GitHub REST API 显示仓库信息的 Svelte 组件。

## 功能

- 🎨 美观的卡片设计，支持深色模式
- 📊 显示仓库名称、描述、语言、stars、forks
- 👤 显示仓库所有者头像
- 🌐 点击链接直接跳转到 GitHub
- 🎨 语言标签显示彩色圆点
- 📱 响应式设计

## 开始使用

### 安装依赖

```sh
pnpm install
```

### 配置 GitHub Token（可选但推荐）

复制环境文件并填写你的 GitHub Token：

```sh
cp .env.example .env
```

然后编辑 `.env` 文件，添加你的 GitHub Personal Access Token：

```env
PUBLIC_GITHUB_TOKEN=your_token_here
```

获取 Token：[GitHub Settings > Tokens](https://github.com/settings/tokens)

> 为什么需要 Token？
> - 未认证用户：60次/小时API请求限制
> - 认证用户：5,000次/小时API请求限制

### 开发

启动开发服务器：

```sh
pnpm dev
```

打开浏览器访问 http://localhost:5173

## 使用方法

在 Svelte 组件中导入并使用：

```svelte
<script>
  import GitHubRepoCard from '$lib/components/GitHubRepoCard.svelte';
</script>

<GitHubRepoCard owner="sveltejs" repo="kit" />
<GitHubRepoCard owner="facebook" repo="react" />
```

## 构建

构建生产版本：

```sh
pnpm build
```

预览生产版本：

```sh
pnpm preview
```

## 技术栈

- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub REST API](https://docs.github.com/en/rest)
