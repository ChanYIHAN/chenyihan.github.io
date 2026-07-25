(function initPortfolioContentDefaults() {
  window.PORTFOLIO_CONTENT_STORAGE_KEY = 'chenyihan_portfolio_content_preview_v1';
  window.PORTFOLIO_SUPABASE_CONFIG = {
    url: 'https://zgyhnlsfyytjunktsefz.supabase.co',
    publishableKey: 'sb_publishable_dGK7GApR2snMW5qtqdC7WQ_i3CvIX33'
  };
  window.PORTFOLIO_CONTENT_RECORDS = {
    resume: {
      id: '00000000-0000-4000-8000-000000000101',
      title: '__site_content_resume__'
    },
    ipCases: {
      id: '00000000-0000-4000-8000-000000000102',
      title: '__site_content_ip_cases__'
    }
  };

  window.PORTFOLIO_CONTENT_DEFAULTS = {
    version: 1,
    resume: {
      hero: {
        name: '陈奕翰',
        role: '数码 3C 资深编辑 · 内容创作者 · IP 运营',
        location: '广州 / 深圳 / 东莞',
        company: '太平洋科技 PConline · 资深编辑',
        education: '27 岁 · 本科 · 网络工程',
        readerReach: 1500,
        readerSubtitle: '截至 2026.07 · 图文评测、视频脚本、IP 栏目与展会报道'
      },
      stats: [
        { value: '5', suffix: '年', label: '媒体工作经验' },
        { value: '300', suffix: '+', label: '原创图文内容' },
        { value: '20', suffix: '+', label: '服务头部品牌' },
        { value: '10W', suffix: '+', label: '多篇文章曝光量', accent: true }
      ],
      basicInfo: [
        { label: '姓名', value: '陈奕翰' },
        { label: '性别', value: '男' },
        { label: '年龄', value: '27 岁' },
        { label: '学历', value: '大学本科' },
        { label: '工作年限', value: '5 年' },
        { label: '期望城市', value: '广州 / 深圳 / 东莞' }
      ],
      contactInfo: [
        { label: '电话', value: '136-1008-9696' },
        { label: '邮箱', value: 'cyh991008@gmail.com' },
        { label: '领域', value: '数码 3C · DIY 硬件 · AIGC' },
        { label: '擅长', value: '图文评测 · 视频脚本 · IP 运营 · 展会报道' }
      ],
      advantages: [
        '媒体行业 5 年工作经验，对数码 3C 行业有浓厚兴趣与深入了解，在职期间服务过 Intel、NVIDIA、AMD、微星、技嘉、七彩虹、影驰、一加、OPPO 等 DIY 硬件与 3C 数码头部品牌。',
        '拥有出色的执行和沟通能力，曾多次协助策划和执行 AWE、CES、台北电脑展等行业大型展会的线上线下报道工作，能够很好处理各种复杂大型项目。',
        '对行业热点有敏锐的直觉，善于结合时下热点，从不同角度提供创意方案和内容选题；逻辑思维严密，文字功底扎实。',
        '对时下最新科技、AIGC 领域有深入了解，能从专业角度产出各种深度内容，沟通能力良好，具备较强的团队意识。'
      ],
      experiences: [
        {
          period: '2022.06 — 至今',
          company: '广州太平洋电脑信息咨询有限公司',
          companyNote: '港股上市企业',
          role: '资深编辑 · 太平洋科技 PConline · DIY 频道',
          accent: 'green',
          groups: [
            {
              title: '3C 数码内容策划与创作',
              bullets: [
                '负责太平洋科技网 3C 数码的内容创作工作，撰写新闻资讯、种草导购、行业洞察、技术科普等原创图文内容，任职期间产出 300+ 篇图文内容，多篇全平台曝光量超 10W+，并频繁被同行媒体转发，文章多次获公司内部“金笔奖”等奖项。',
                '负责 DIY 硬件产品的商业评测工作，包括前期选题策划、产品测试与拍摄、评测图文与视频脚本撰写，先后服务过 Intel、NVIDIA、微星、技嘉、七彩虹等知名头部品牌，多次获得客户高度认可。',
                '多次协同负责国内外大型展会（AWE、CES、BW、CJ、台北电脑展）的专题报道和内容策划，同时协助公司线下商超巡展等大型活动策划执行。'
              ]
            },
            {
              title: 'IP 账号运营',
              bullets: [
                '运营公司 B 站独立 IP 账号“搞机猛男”（现改名“太评甄选”），用最低运营成本在一年内做出多支 8W+ 播放量长视频，竖版短视频栏目“猛男快报”整体播放量突破 280W+，实现 3W+ 粉丝增长。',
                '持续运营原创栏目“硬件编年史”与“AI 时刻”，深入探讨硬件科普与 AIGC 前沿技术，创作 20+ 篇深度内容，被钛媒体、快科技等知名科技网站转发。'
              ]
            },
            {
              title: '频道运营管理',
              bullets: [
                '负责 DIY 硬件频道的运营管理工作，包括选题策划、频道发展规划、创意栏目策划；曾负责实习生招聘与培养等工作。'
              ]
            }
          ]
        },
        {
          period: '2021.06 — 2022.05',
          company: '广州盖得排行信息科技有限公司',
          companyNote: '',
          role: '内容运营编辑',
          accent: 'purple',
          groups: [
            {
              title: '',
              bullets: [
                '参与品牌排行榜、单品排行榜的内容维护与更新迭代，主要负责电脑整机、装机组件、存储设备等大类，深度分析数据，输出 10+ 篇有影响力的行业调研报告。',
                '参与 618、双 11 等电商大促节点运营工作，包括电脑整机、DIY 组件大类的商品盘点、热卖型号榜选品，撰写 10+ 篇用户选购手册及若干降价专题文章。',
                '测评多种电子数码产品（硬盘、手机、电脑配件等），撰写上手体验及详细测评报告，协助拍摄工作并参与视频后期制作。'
              ]
            }
          ]
        }
      ],
      education: {
        school: '仲恺农业工程学院',
        major: '网络工程 · 本科',
        period: '2017.07 — 2021.06'
      }
    },
    ipCases: [
      {
        name: '搞机猛男 · 太评甄选',
        description: 'B 站 & 抖音双平台 IP 账号。横屏视频涵盖横评科普、首发测试、商业合作；竖屏资讯栏目“猛男快报”聚焦数码前沿，一周双更。',
        metrics: 'B站获赞 46.2w · 播放量 1408.6w · 实现 3W+ 粉丝增长',
        links: [
          { label: '📺 B 站主页', url: 'https://space.bilibili.com/374914737' },
          { label: '🎵 抖音主页', url: 'https://www.douyin.com/user/MS4wLjABAAAAuS4-e6WG2W8bexnUzqKuJwrqKxmxZHSL9pSscz1ZjpWgN4XbjdPZKQbJdwqc-hQl' }
        ],
        articles: []
      },
      {
        name: '硬件编年史',
        description: '深入剖析各类数码科技硬件的发展历程，从最早的计算机雏形到当今智能终端，一窥科技创新脉络。入职至今更新原创内容 20+ 篇，多篇被友媒转发。',
        metrics: '',
        links: [
          { label: '🔗 栏目主页', url: 'https://www.pconline.com.cn/video/iphome/?id=5203' }
        ],
        articles: [
          { icon: '📄', title: '从小到更小，从大到更大 · 硬盘风云 70 年', url: 'https://new.qq.com/rain/a/20240318A0253100' },
          { icon: '📄', title: '平平无奇到各领风骚 · 显卡外观设计大盘点', url: 'https://diy.pconline.com.cn/1618/16183245.html' },
          { icon: '📄', title: '带你认识 PCIe 插槽！除了插显卡它还能插什么？', url: 'https://diy.pconline.com.cn/1709/17094968.html' },
          { icon: '📄', title: 'DLSS 技术到底有什么用 · 大力真的能出奇迹？', url: 'https://diy.pconline.com.cn/1633/16337985.html' }
        ]
      },
      {
        name: 'AI 时刻',
        description: '汇集 AI 领域最新鲜的产品、动态和创新趋势，全面评测各类 AI 产品的性能与实用性。入职至今更新原创内容 40+ 篇，涵盖 AI 实用教程、AI 趋势分析等领域，多篇被友媒转发。',
        metrics: '',
        links: [
          { label: '🔗 栏目主页', url: 'https://www.pconline.com.cn/video/iphome/?id=5201' }
        ],
        articles: [
          { icon: '🤖', title: '回顾 NVIDIA GTC 2024，Blackwell 算力核弹问世', url: 'https://www.163.com/dy/article/ITKNKCV905118VMB.html' },
          { icon: '🎨', title: '看完这篇文章，你也能当插画师 · Midjourney 教学局', url: 'https://www.163.com/dy/article/IC4DI44O05118VMB.html' },
          { icon: '🌪️', title: '华为化身追风少年 · 借盘古 AI 之力瞥台风行踪', url: 'https://diy.pconline.com.cn/1639/16399531.html' },
          { icon: '🎮', title: '不止游戏，AI 杀疯了！体验史上最强游戏显卡的 AI 性能', url: 'https://diy.pconline.com.cn/1635/16350684.html' }
        ]
      }
    ]
  };
})();
