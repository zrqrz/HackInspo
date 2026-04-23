# Devpost 爬取数据说明

本文档根据 `pipeline/sources/devpost/` 下三阶段源码整理，描述 **当前 pipeline 从 Devpost 实际获取并写入 JSON 的字段**、数据来源与输出文件结构。Stage 4（`pipeline/db/ingest.py`）数据库映射不在此展开，仅注明衔接关系。

---

## 总览

| 阶段 | 脚本 | 数据源 | 输出文件 |
|------|------|--------|----------|
| Stage 1 | `stage1_hackathon_discovery.py` | Devpost 列表 JSON API | `pipeline/data/hackathons.json` |
| Stage 2 | `stage2_winner_discovery.py` | 各 Hackathon 作品画廊 HTML | `pipeline/data/winners.json` |
| Stage 3 | `stage3_detail_extraction.py` | 单个作品详情页 HTML | `pipeline/data/projects.json` |

编排入口：`pipeline/run_pipeline.py`（Stage 1–3 按源执行，Stage 4 读取 `hackathons.json` + `projects.json` 入库）。

---

## Stage 1：Hackathon 发现（JSON API）

### 请求

- **URL**：`https://devpost.com/api/hackathons`
- **查询参数**：`status[]=ended`、`page`（从 1 递增）
- **分页规模**：每页 9 条（代码常量 `PER_PAGE = 9`）
- **请求头**：自定义 `User-Agent`、`Accept: application/json` 等

说明：`/hackathons`（不带 `/api`）在 `Accept: application/json` 请求下可能返回 `406 Not Acceptable`，当前实现已切换到 `/api/hackathons`。

### 处理逻辑（摘要）

- 按页拉取已结束的 hackathon，直到超出 `lookback_days` 构成的截止日期（用每条记录的 `submission_end` 与 cutoff 比较）。
- 全量结果中，**仅 `winners_announced == true` 的条目**会在 Stage 2 被进一步处理（Stage 2 内过滤）。

### 每条 Hackathon 对象字段（`process_hackathon`）

| 字段 | 类型/说明 | Devpost 来源 |
|------|-----------|----------------|
| `devpost_id` | 数值/字符串，API 的 `id` | `raw["id"]` |
| `title` | 字符串，strip | `raw["title"]` |
| `devpost_url` | URL，去尾 `/` | `raw["url"]` |
| `gallery_url` | 字符串，可能为空 | `raw["submission_gallery_url"]`（供 Stage 2 爬画廊） |
| `location` | 字符串 | `raw["displayed_location"]["location"]` |
| `submission_start` | ISO 日期字符串或 `null` | 由 `submission_period_dates` 文本解析 |
| `submission_end` | ISO 日期字符串或 `null` | 同上 |
| `registrations_count` | 整数或 API 原样 | `raw["registrations_count"]` |
| `organization` | 字符串 | `raw["organization_name"]` |
| `themes` | 字符串数组 | `raw["themes"]` 中每项的 `name` |
| `prize_amount` | 整数（美元）或 `null` | 从 `raw["prize_amount"]` 的 HTML 片段中用正则提取数字 |
| `prize_cash_count` | 整数 | `raw["prizes_counts"]["cash"]`，缺省为 0 |
| `prize_other_count` | 整数 | `raw["prizes_counts"]["other"]`，缺省为 0 |
| `winners_announced` | 布尔 | `raw["winners_announced"]` |
| `invite_only` | 布尔 | `raw["invite_only"]` |

### `hackathons.json` 顶层结构

除 `hackathons` 数组外，保存时还会写入元数据，例如：

- `scraped_at`：ISO 时间戳  
- `total_count`：列表长度  
- `with_winners_count`：已宣布获奖者的数量  

（以 `stage1_hackathon_discovery.py` 中 `save()` 为准。）

---

## Stage 2：获奖者发现（画廊 HTML）

### 范围

- 读取 Stage 1 产出的 `hackathons.json`。
- **只处理** `winners_announced` 为真的 hackathon。
- 若无 `gallery_url`，跳过该活动。

### 请求

- **URL**：每条 hackathon 的 `gallery_url`（及分页后的下一页 URL）
- **解析**：BeautifulSoup，Chrome 风格 `User-Agent`

### 单页画廊解析

- **容器选择器**：`.gallery-item:has(img.winner)`（仅保留带 winner 图标的作品卡片）。
- **分页**：查找 `a.next_page`、`li.next a`、`a[rel='next']` 等得到下一页 URL，循环直到没有下一页。

### 每条 Winner 对象字段（卡片内）

| 字段 | 说明 |
|------|------|
| `devpost_software_id` | 卡片根节点属性 `data-software-id` |
| `title` | `h5` 文本 |
| `tagline` | `p.small.tagline` 文本 |
| `project_url` | `a.block-wrapper-link` 的 `href`，相对路径则补全为 `https://devpost.com` 前缀 |

### 附加上下文（写入同一条目）

对同一 hackathon 下所有 winner 批量附加：

| 字段 | 来源 |
|------|------|
| `hackathon_title` | 当前 hackathon 的 `title` |
| `hackathon_url` | 当前 hackathon 的 `devpost_url` |
| `hackathon_devpost_id` | 当前 hackathon 的 `devpost_id` |

### `winners.json` 顶层结构

- `scraped_at`  
- `total_winners`  
- `winners`：上述对象数组  

---

## Stage 3：作品详情（详情页 HTML）

### 范围

- 读取 `winners.json` 中的 `winners`。
- 对每条记录的 `project_url` 请求详情页；失败则跳过并计入错误数（控制台输出）。

### 详情页解析字段

| 字段 | 说明 | DOM / 逻辑 |
|------|------|----------------|
| `title` | 作品标题 | `#app-title` |
| `tagline` | 一句话介绍 | `.app-tagline` 或 `p.large` |
| `full_desc` | 长描述纯文本（降级 / 搜索） | 同上第二个子 `div` 的 `get_text`，`\n` 分隔 |
| `description_sections` | 有序小节数组（入库为 `descriptionSections` JSONB；空则 DB `NULL`） | 每项 `{"title": string \| null, "html": string}`：`title` 为顶层 `h1`/`h2`/`h3` 文本，无标题块为 `null`；`html` 为该段 inner HTML（已去 script/style/iframe） |
| `built_with` | 技术栈标签列表 | `.built-with a`、`#built-with span.cp-tag`、`a.cp-tag` 的文本集合 |
| `thumbnail_url` | 项目封面图 URL 或 `null` | 按回退顺序：`meta[property='og:image']` → `meta[name='twitter:image']` → `meta[itemprop='image']` → `meta[itemprop='screenshot']` → 首张截图 |
| `video_url` | 主视频链接或 `null` | `#gallery iframe.video-embed`，若无则回退 `#gallery iframe[src*='youtube'/'vimeo']` |
| `screenshot_urls` | 截图 URL 数组（可空） | 优先 `#gallery a[data-lightbox] href`，回退 `#gallery img.software_photo_image src`，并规范为绝对 URL |
| `screenshot_captions` | 截图说明数组（可空） | 从同一 `li` 下的 `p i`/`p` 抽取，与 `screenshot_urls` 索引对齐 |
| `demo_url` | 演示链接或 `null` | `#app-links` / `.app-links` / `nav.app-links` 下链接：第一个「非 GitHub/GitLab 的 http(s)」作为 demo |
| `repo_url` | 仓库链接或 `null` | 同上区域中第一个含 `github.com` 或 `gitlab.com` 的链接 |
| `other_links` | 其余链接数组 | 未被识别为 demo/repo 的链接 |
| `team_members` | 成员名称数组 | 优先 `#app-team .member`、`.software-team-member`；若无则 `.members a.member-link`、`.software-team a` |
| `award_labels_raw` | 奖项原文数组（可空） | `#submissions .software-list-content ul li` 文本去重 |
| `award_tiers_normalized` | 归一化奖项层级数组（可空） | 映射到 `WINNER`/`RUNNER_UP`/`HONORABLE_MENTION`/`OTHER` |

### 缺失字段备选策略（容错）

- `thumbnail_url`、`video_url` 缺失时写 `null`，不中断流程。
- `screenshot_urls`、`screenshot_captions` 缺失时写空数组 `[]`。
- 所有媒体 URL 统一做规范化：`//` 前缀补 `https:`，相对路径补全为绝对 URL。

### 与 Stage 2 的合并

最终每条 **project** 为：`{ **winner 条目**, **详情字段**, "project_url": url }`  
即：保留画廊阶段的 `devpost_software_id`、hackathon 上下文等，详情页的 `title`/`tagline` 会覆盖画廊同名键。

### `projects.json` 顶层结构

- `scraped_at`  
- `total_projects`  
- `projects`：合并后的对象数组  

---

## 与下游的关系（简述）

- `run_pipeline.py` 在 Stage 4 调用 `pipeline.db.ingest`，读取 **`hackathons.json`** 与 **`projects.json`**，将数据写入 PostgreSQL（与 Prisma schema 对应）。
- Stage 4 当前已将 `thumbnail_url` 映射到 `Project.thumbnailUrl`；`full_desc` → `Project.description`；`description_sections`（非空数组）→ `Project.descriptionSections`（JSONB），空数组或缺失 → `NULL`。
- Stage 4 奖项写入为双轨：优先使用 `award_labels_raw` + `award_tiers_normalized`；若缺失则回退写入默认 `Winner / WINNER`。
- **Track / ProjectTrack** 不由上述 Devpost 阶段填充；设计上是后续 **AI classification** 的职责。
- Stage 1 中的 `prize_cash_count`、`prize_other_count` 等若未在 `ingest.py` 中映射，则可能仅存在于 JSON，而不进入数据库（以 `ingest.py` 实际 SQL 为准）。

---

## 维护提示

若 Devpost 改版导致 DOM 或 API 字段变化，应优先检查：

1. Stage 1：`submission_period_dates` 格式、`prize_amount` HTML 结构。  
2. Stage 2：`.gallery-item`、`img.winner`、分页选择器。  
3. Stage 3：`#app-title`、`#app-details-left`、`#gallery`、`#submissions` 结构，以及链接区与团队成员区选择器。

修改爬取字段时，请同步更新本文件与（如需要）`ingest.py` 与 Prisma schema。
