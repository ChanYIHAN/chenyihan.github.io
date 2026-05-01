-- ============================================================
-- 陈奕翰个人简历 - 作品集后台管理系统 Supabase Schema
-- 请在 Supabase Dashboard > SQL Editor 中执行此脚本
-- ============================================================

-- 1. 作品集主表
CREATE TABLE IF NOT EXISTS portfolio_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  cover_url     TEXT,
  link          TEXT,
  section       TEXT NOT NULL CHECK (section IN ('graphic', 'video', 'ip', 'planning')),
  category      TEXT,           -- 子分类名称，如 "商业评测 · DIY 硬件类"
  category_icon TEXT,           -- 子分类图标 emoji
  tags          TEXT[],         -- 标签数组，如 ['评测', 'DIY硬件']
  tag_colors    TEXT[],         -- 标签颜色数组，对应 tag-blue / tag-purple 等
  sort_order    INTEGER DEFAULT 0,
  is_visible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 分类表（管理各大版块下的子分类）
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section     TEXT NOT NULL CHECK (section IN ('graphic', 'video', 'ip', 'planning')),
  name        TEXT NOT NULL,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 标签预设表（便于复用常用标签）
CREATE TABLE IF NOT EXISTS portfolio_tags (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT 'tag-blue'
             CHECK (color IN ('tag-blue','tag-purple','tag-green','tag-amber','tag-pink','tag-teal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 管理员表（用于登录验证）
CREATE TABLE IF NOT EXISTS admins (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,   -- 使用 bcrypt 哈希存储
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_portfolio_section    ON portfolio_items(section);
CREATE INDEX IF NOT EXISTS idx_portfolio_category   ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_visible    ON portfolio_items(is_visible);
CREATE INDEX IF NOT EXISTS idx_portfolio_sort       ON portfolio_items(section, sort_order);

-- ============================================================
-- updated_at 自动更新触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) 配置
-- ============================================================

-- 开启 RLS
ALTER TABLE portfolio_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_tags        ENABLE ROW LEVEL SECURITY;

-- 前端公开读取（所有可见作品）
CREATE POLICY "Public can read visible portfolio items"
  ON portfolio_items FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can read categories"
  ON portfolio_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can read tags"
  ON portfolio_tags FOR SELECT
  USING (true);

-- 管理员完整权限（通过 Service Role Key 操作，无需额外策略）
-- 后台管理使用 service_role key，绕过 RLS

-- ============================================================
-- 预置标签数据
-- ============================================================
INSERT INTO portfolio_tags (name, color) VALUES
  ('评测',     'tag-blue'),
  ('DIY硬件',  'tag-teal'),
  ('外设',     'tag-green'),
  ('游戏',     'tag-purple'),
  ('视频',     'tag-purple'),
  ('开箱',     'tag-amber'),
  ('科普',     'tag-blue'),
  ('热点',     'tag-pink'),
  ('专访',     'tag-pink'),
  ('横评',     'tag-blue'),
  ('显卡',     'tag-amber'),
  ('主板',     'tag-teal'),
  ('散热',     'tag-teal'),
  ('AI',       'tag-amber'),
  ('展会',     'tag-amber'),
  ('创意',     'tag-purple'),
  ('IP',       'tag-pink'),
  ('策划',     'tag-blue'),
  ('传播',     'tag-blue')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 预置分类数据
-- ============================================================
INSERT INTO portfolio_categories (section, name, icon, sort_order) VALUES
  ('graphic', '商业评测 · DIY 硬件类',          '🖥️', 1),
  ('graphic', '商业评测 · 外设硬件类',          '🖱️', 2),
  ('graphic', '游戏体验内容',                    '🎮', 3),
  ('graphic', '原创选题 · 科普类文章',          '🔬', 4),
  ('graphic', '原创选题 · 热点资讯 & 品牌专访', '📡', 5),
  ('video',   '评测视频 & 开箱视频',            '📦', 1),
  ('video',   '横评项目 & 自主创意视频',         '🎬', 2),
  ('ip',      'IP 案例',                         '💡', 1),
  ('planning','策划方案',                         '📋', 1)
ON CONFLICT DO NOTHING;
