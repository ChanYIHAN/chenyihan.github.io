chenyihan.github.io
个人简历与作品集展示站点（求职专用），部署于GitHub Pages，简洁呈现个人技能与项目能力。

项目简介
  基于GitHub Pages搭建的个人展示站点，用于求职场景下，快速向面试官呈现个人技术栈、项目经验及个人信息，支持静态部署，可快速访问。
  
核心技术栈
  - 前端：HTML（92.1%）、JavaScript（4.2%）
  - 后端辅助：Supabase（CMS管理、数据加载）
  - 部署：GitHub Pages（免费、稳定）
  - 数据库相关：PLpgSQL（3.7%）
    
核心功能（求职重点）
  - 个人信息展示：简洁呈现个人简介、技能、经历，适配求职场景
  - 作品集展示：包含项目封面、分类标签，支持视频/图片预览
  - 稳定兼容：动态加载降级策略，无服务时正常展示静态内容
  - 快速部署：无需服务器，GitHub Pages一键启用
    
项目结构（精简版）
  chenyihan.github.io/

      ├── index.html              # 主页面（个人信息+作品集入口）
      ├── portfolio-loader.js     # 动态加载与降级逻
      ├── covers/                 # 项目封面资源
      ├── portfolio_pages/        # 项目详情页
      ├── supabase/               # Supabase配置（可选启用）
      └── 基础配置文件（.gitattributes/.gitignore）
    
部署说明（快速上手）
  1. Fork本项目至个人GitHub账号
  2. 替换index.html及相关资源为个人信息、项目案例
  3. GitHub仓库设置 → Pages → 选择main分支/root路径，启用部署
  4. 访问个人站点，完成求职展示准备
  注：本项目仅供个人求职展示使用，借鉴请保留原作者信息。
