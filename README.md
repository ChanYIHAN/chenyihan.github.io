# chenyihan.github.io

个人作品集与简历展示站点，用于在线展示个人项目、技能与经历，支持静态部署与动态内容加载。

项目介绍
本项目是基于 GitHub Pages 搭建的个人简历与作品集展示网站，以简洁、现代的页面呈现个人信息、项目案例、技术能力等内容，适合求职、学术申请及个人品牌展示使用。站点采用纯前端技术实现，支持静态托管，同时可对接 CMS 实现内容动态管理。

技术栈
HTML：页面结构与语义化布局
CSS：页面样式与响应式适配
JavaScript：交互逻辑与动态加载
Supabase：提供后端 CMS 与数据加载能力
GitHub Pages：免费静态站点部署

功能特性
个人信息展示：头像、简介、联系方式、教育与工作经历
作品集模块：项目封面、分类标签、视频 / 图片预览、排序展示
动态内容加载：支持从 Supabase 拉取项目数据，无服务时优雅降级为静态内容
响应式布局：适配 PC、平板、手机等不同设备访问
轻量化部署：直接部署在 GitHub Pages，无需服务器，访问稳定

项目结构
plaintext
chenyihan.github.io/
├── index.html              # 主入口页面
├── portfolio-loader.js     # 作品集动态加载与降级逻辑
├── covers/                 # 项目封面图资源
├── portfolio_pages/        # 项目详情页面
├── supabase/               # Supabase 相关配置与脚本
├── .gitattributes          # Git 属性配置
├── .gitignore              # Git 忽略文件
└── README.md               # 项目说明

部署与使用
Fork 本项目到你的 GitHub 账号
修改 index.html 与相关资源，替换为个人信息、项目案例
如需启用 Supabase 动态加载，配置 supabase 目录下的连接信息
开启 GitHub Pages：Settings → Pages → Branch 选择 main /root
访问 https:// 你的用户名.github.io/chenyihan.github.io 查看站点

开发说明
本地直接打开 index.html 即可预览效果
portfolio-loader.js 会自动检测 Supabase 连接状态
项目封面、视频封面统一放在 covers 目录，便于管理与替换

更新日志
优化第二行视频封面循环切换与标签排序逻辑
新增 Supabase CMS 管理后台与作品集加载器
完善静态降级策略，提升页面稳定性
更新项目说明文档与基础结构

许可证
本项目仅供个人展示使用，如需借鉴或修改请保留原作者信息。
