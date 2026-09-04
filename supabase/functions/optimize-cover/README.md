# 一次转换、大小图分开加载

## 流程

管理员在作品表单粘贴链接或选择文件后点击保存。`optimize-cover` 先通过 Auth 验证访问令牌及 `app_metadata.role=admin`，再下载/接收图片。检查文件大小和头部尺寸后生成最长边不超过 1920px（quality 86）与 800px（quality 80）的 WebP，不放大、不裁切。原图保存到私有 `portfolio-originals` 桶；两种 WebP 保存到公开 `portfolio-covers` 桶。

源文件 SHA-256 与转换版本共同决定存储路径。manifest 最后写入，存在即代表全部输出完成；相同文件复用输出。后台只有获取完整结果后才更新作品。失败可能留下尚未引用的存储文件，但不会替换原有作品封面。

`portfolio_items.cover_url` 保留输入链接（直接上传时为预览图 URL）；`cover_assets` 保存匹配 source、大小图地址、尺寸、字节数和私有原图路径。前台只在 source 匹配时使用优化数据；列表加载 thumbnail，点击策划时才加载 preview。旧条目没有 metadata 时保持原回退逻辑；编辑旧条目并保存可逐条优化，未进行全库批量改写。

## 部署

- 数据库新增 `cover_assets jsonb`，两种 Storage bucket 和管理员原图读取策略；定义见 `supabase/schema.sql`。
- Function: `supabase/functions/optimize-cover/index.ts` 与 `core.mjs`。
- 函数网关 `verify_jwt=false` 是为了使用函数内 Auth `/user` 验证，**不是匿名转换服务**。没有有效管理员身份返回 401/403。
- 函数读取运行环境默认提供的 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`（或 `SUPABASE_SECRET_KEYS.default`）。不得将服务密钥放进前端。
- 依赖固定 `@imagemagick/magick-wasm@0.0.43`，加载包内 `dist/x86/magick.wasm`。Node 测试依赖和锁文件仅用于开发，不需要给静态站增加构建命令。
- 2026-09-04 已通过远程迁移 `add_optimized_cover_assets` 设置数据库和桶，部署了函数。网页代码尚待发布；已通过本机后台实际管理员保存完成云存储端到端验收。

## 限制与费用

- 最多 5MiB、800 万像素。支持 PNG/JPEG/静态 WebP，暂不支持动画或 SVG。
- 远程抓取只允许 ekhart.cn、原 pages.dev 域名和本人 chanyihan/chenyihan.github.io 仓库。每次重定向重新检查地址；不转发管理令牌。其他域名须下载文件后直接上传。
- 转换使用现有 Supabase 函数计算、Storage 容量及流量额度，并非承诺无限免费；没有自动升级付费套餐。
- 图片目前通过 Supabase Storage 公共地址分发，未配置 EdgeOne 同域代理/CDN，也没有改变现有 DNS。压缩减少传输量，但不能保证所有大陆网络的跨境连接时延。
- 私有原图可由管理员通过 Storage 控制台找回；服务不会自动删除历史文件。

## 验证

`npm ci --ignore-scripts` 后运行 `npm test`。涵盖三个真实策划封面的 WebP 输出、尺寸和压缩比，URL/跳转限制，大小限制，列表不加载大图，重复保存复用、转换失败阻止发布及脚本语法。

`node scripts/preview.mjs` 提供本机预览。`/admin/index.html?preview=1` 为只读；实际转换/保存须通过 `/admin/login.html` 登录。前台 `index.html?dynamic=1#planning` 可在本机读取实时数据。

云端烟测已确认 WASM 成功初始化且未登录请求返回 401。安全顾问仅报告已有 admins 表无策略（旧表刻意禁用）与已有泄露密码保护未启用；本次未更改登录安全设置。

真实保存验证：`佰维存储x太平洋汽车合作方案` 原封面 1,160,762 bytes，生成 800×450 小图 53,170 bytes 和 1920×1080 大图 234,212 bytes。数据库保留原标题、封面源链接和方案链接；浏览器确认列表使用 thumbnail.webp，点击后加载 preview.webp，并显示原百度网盘跳转链接。
