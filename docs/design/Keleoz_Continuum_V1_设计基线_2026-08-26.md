# Keleoz Continuum V1 设计基线

> 状态：待最终评审
>
> 日期：2026-08-26
>
> 用途：记录本轮讨论已经确认的产品、视觉、架构与部署决策。
> 说明：本文是首个可上线版本的约束，不替代《产品总纲》《产品功能规格》《视觉设计规范》中的长期愿景。

---

## 1. 产品定位

正式名称：**Keleoz Continuum**

品牌副标题：*A Personal Digital Space.*

中文定义的方向为：

> 一个持续生长的个人数字空间。

上述中文不是最终首页文案。品牌与文案遵循：

> 该双语的地方双语，该英文的地方英文，该中文的地方中文；以可读性、操作效率、视觉效果和语境为最高优先级。

V1 采用“内容优先的氛围型个人网站”定位：

- Blog、Projects、Moments、About 构成公开内容骨架；
- Room、Music、Letters 构成标志性体验；
- Timeline / Archive 提供基础时间连续性；
- Owner 在同一空间内拥有在线创作、审核和管理能力；
- 不把私人 InternalBeyond 直接公开部署，也不把首页做成 Dashboard。

---

## 2. 与 InternalBeyond 的关系

正式参考源码：

- Desktop：`D:\study\blog\example_pro\InternalBeyond-main\InternalBeyond-main`
- Mobile：`https://github.com/Sui-IB/InternalBeyond-Mobile`

已确认采用：

> **新架构 + 适配复用。**

两套源码均是一等实现来源，不只作为截图或灵感参考。

### 2.1 复用原则

| 处理方式 | 范围 |
|---|---|
| 尽量原样复用 | 图片、精灵、SVG、动画参数、颜色、排版、窗口交互、Room 寻路和状态机 |
| 抽成共享模块 | AI 流式解析、Markdown、Memory 评分、Calendar 算法、Music 分析、文档处理、数据转换 |
| 加适配层复用 | Tea、Story、Tarot、Letters、Circle、Chat、Memory、Calendar、ICode |
| 必须重新实现 | 登录权限、服务端存储、Owner CMS、Exposure、访客额度、审核、稳定 URL、SEO |
| 不再沿用 | 浏览器明文保存站点 API Key、用本地锁屏代替登录、客户端直连敏感工具、巨型全局脚本启动顺序 |

功能行为优先。模块化不得成为删功能或重新做低配版本的理由。迁入的原功能应建立契约测试，验证关键规则与原版一致。

### 2.2 许可边界

项目保持完全非商业：无广告、无付费会员、无收费服务。

- 原代码遵循 PolyForm Noncommercial License 1.0.0；
- 原视觉素材与文档在作者可授权范围内遵循 CC BY-NC-SA 4.0；
- 保留许可、Required Notice、项目地址、修改说明与作者署名；
- 不使用 Internal Beyond、Sui、IB 或原 Logo 冒充官方版本；
- Keleoz Continuum 使用自己的品牌与原创角色；
- 正式站提供独立 Credits / License 页面。

若未来出现商业化意图，应先重新评估许可并取得必要授权。

---

## 3. V1 正式范围

### 3.1 公开内容

- Home
- Blog
- Projects
- Moments
- About / Profile
- Timeline（基础自动聚合）
- Archive（作为 Timeline / 内容长期回看能力，不占独立一级导航）
- Global Search

### 3.2 公开体验

- Desktop Room
- Wardrobe
- Sleep
- Tea
- Story
- Tarot
- Music
- Letters

### 3.3 Owner 能力

- 单一 Owner 登录
- Owner Studio
- 在线块编辑器
- 草稿、自动保存、预览、发布、版本历史
- Blog / Projects / Moments / Pages 管理
- 媒体库
- Letters 审核与公开回复
- AI Persona 动态、评论和转发审核
- Persona、Room、Music 与视觉配置
- AI 额度、费用和熔断控制
- 数据导出与备份状态

### 3.4 明确延后但保留边界

- Member 注册与邮箱登录
- Member 评论、回复、收藏和 AI 历史
- Public AI 通用问答入口
- Public Memory / Emotion Projection
- 完整 Continuum 关系层
- Owner Chat、完整 Calendar、Memory、Auto Memory
- ICode、MCP、DIY 与深层 Owner 工作台

延后能力不在 V1 公共页面放“即将上线”的空入口，但数据库与权限边界不得阻碍以后加入。

---

## 4. 身份与互动

### 4.1 V1 身份

- Guest：无需登录；
- Owner：单一管理账号；
- Member：V1 不实现，最终形态使用邮箱登录。

Owner V1 登录采用用户名＋强密码，登录会话默认保持 30 天。修改密码、密钥、清空数据等危险操作要求重新输入密码。V1 不强制 TOTP；Passkey、TOTP 与恢复码作为后续增强。

### 4.2 评论

V1 不开放 Guest 公开评论。

Blog、Project、Moment 可以保留评论入口。Guest 点击后提示：

> 评论仅对登录成员开放。第一版暂未开放成员注册，你可以前往 Letters 留下一封匿名或署名来信。

不得显示当前无法完成的登录流程。

### 4.3 Letters

Letters 是 V1 主要访客交流入口，采用公开信件墙＋私人投递：

- 匿名公开信；
- 署名公开信；
- 私人信；
- 公开信先审核，Owner 批准后展示；
- Owner 回信可与公开信一起公开；
- 其他访客不能在公开信下面继续评论；
- 联系方式、IP 与风控信息永不公开；
- 保留信封、邮编、火漆、拆信与等待的仪式感。

### 4.4 Moments 与 AI Persona

Owner 与 AI Persona 共用一条公开动态流：

- AI Persona 必须有清晰身份标识；
- AI 动态、评论、回复、转发和配图全部先进入审核箱；
- Owner 可批准、编辑后发布、退回或删除；
- 每个 Persona 分别控制发布、评论、转发和配图权限；
- V1 不允许 AI 自动绕过审核公开内容。

---

## 5. 内容模型与在线编辑

不为技术、摄影、随笔、旅行、比赛分别建立顶级内容类型。

稳定实体为：

- Blog：所有长内容；
- Project：有状态、时间、成果和持续更新过程的项目；
- Moment：短动态、照片、临时想法和近况；
- Page：About、专题说明等固定页面；
- Media：共享图片、音频、视频和附件；
- Collection / Tag：跨主题组织内容。

Timeline、Archive、Search 从正式发布实体派生，不要求重复发布同一内容。

### 5.1 块编辑器

使用 Tiptap 构建 Keleoz Continuum 风格的在线块编辑器。V1 基础块：

- 正文、标题、列表、待办、引用、分隔线；
- 图片、相册、视频、音频、附件；
- 代码块、行内代码；
- 提示框、折叠区；
- Project、Moment、Timeline 条目引用；
- 自动文章目录。

正文权威格式为结构化 JSON，同时生成 HTML、纯文本与摘要，用于渲染、搜索、SEO 与未来 Public AI。

### 5.2 V1 Exposure

V1 不一次实现全部公开投影系统，只实现内容发布真正需要的三档：

- Full：公开完整内容；
- Summary：列表、Timeline 和公开页面只展示 Owner 编写的摘要与允许公开的媒体；
- Hidden：服务端不向 Guest 返回该实体，不采用“前端拿到后再隐藏”。

Abstract 与 Aggregate 预留给未来 Memory、Emotion、Auto Memory 和 Continuum Projection。Owner 可用 Guest Preview 查看最终公开结果。

---

## 6. 信息架构

### 6.1 Desktop 主导航

- Logo / Brand：Home
- Blog
- Projects
- Moments
- Timeline
- About
- Room：单独强调
- Search：工具入口
- Letters：工具入口
- Music：常驻播放器入口

Archive 收入 Timeline 与各内容页的长期回看，不占一级导航。

### 6.2 Home 向下顺序

1. Scene：雾窗、蝴蝶、品牌与进入提示；
2. Current Focus：一个 Featured Project；
3. Writing：近期 Blog，采用编辑式排版；
4. Moments：近期 Owner / Persona 动态；
5. Experience：Room、Letters、Music；
6. Continuity：Timeline 摘要与 About。

首页第一屏不放文章卡片、大型玻璃面板或 Dashboard 数据。

### 6.3 Mobile

移动端继承 InternalBeyond-Mobile 的 Desk、App Grid、Space、Circle、Bottom Navigation、Fullscreen App、Widget 与 PWA 语言。

- Blog、Projects、Moments、Timeline、Letters、Music 作为 App；
- Tea、Story、Tarot 作为全屏互动 App；
- Character 承载 Wardrobe / Sleep；
- 手机端不硬塞 1672×941 像素 Room；
- Desktop 与 Mobile 使用同一产品、同一代码库、同一后端和数据模型，但拥有不同界面壳。

---

## 7. 视觉与角色

### 7.1 首页视觉硬约束

- 采用 Scene-first；
- 保留原参考首屏的雾窗、蝴蝶、蓝色光感、大面积留白和安静气质；
- 不因增加 Blog 功能而改成传统博客模板；
- 除非现有构图无法承载新功能，不主动大改首屏；
- 内容从首屏下方开始；
- 阅读页面比 Home 更安静，Glass 主要用于窗口、导航、上下文和控制。

### 7.2 原创角色

Room 主角色是“数字空间中的 Keleoz”：

- 代表站主欢迎访客、介绍内容和带路；
- Profile、Room 与 Persona 共享同一身份设定；
- 复用原行走、待机、睡眠、寻路、碰撞、换装和演出系统；
- 正式公开前替换 Sui 名称、立绘、精灵、台词和 Tour 文案；
- 开发阶段允许原素材作为功能验证参考，但不得作为未署名的新原创资产发布。

---

## 8. Room 与访客 AI

五项玩法均保留：Tea、Story、Tarot、Wardrobe、Sleep。

Guest AI 使用站点固定模型，费用由站点承担并受限制：

- Tarot：按完整解读与追问计额；
- Tea：按会话和轮数计额；
- Story：按完整故事会话计额；
- 限制并发、输入长度、输出 Token、单次超时与冷却；
- 设置全站每日费用硬上限与熔断；
- API Key 永远不发送给浏览器。

精确额度与默认模型属于上线运营参数，不写死在产品模型中；发布前通过成本测试确定。

### 8.1 Guest 私人记录

Guest 的以下内容只保存在当前浏览器的版本化 IndexedDB：

- Tea 对话；
- Story 进度与记录；
- Tarot 记录；
- Wardrobe / Sleep 状态。

服务端只保存额度计数与必要风控信息，不长期保存正文。未来 Member 登录时可在明确征得同意后导入当前设备的 Guest 记录；未经确认不得自动上传。

---

## 9. 技术架构

正式技术基线：

- Next.js + React + TypeScript；
- PostgreSQL；
- Tiptap；
- LightCOS；
- 单代码库、Desktop / Mobile 双界面壳；
- 单个 Node 应用进程；
- 反向代理负责 HTTPS、上传限制和基础防护。

V1 不引入：

- Redis；
- Elasticsearch；
- 微服务；
- Kubernetes；
- 独立消息队列；
- 多实例缓存协调。

公开 Blog、Project、Moment 与 About 尽量预渲染并缓存。Room 动画与玩法在访客浏览器运行；服务器只承担数据、权限、审核和 AI 网关。

### 9.1 数据边界

| 数据 | 权威位置 |
|---|---|
| 公开内容、草稿、版本、关系、审核、额度台账 | PostgreSQL |
| Owner 私人层、Persona 与系统配置 | PostgreSQL |
| 图片、音频、附件、Room 素材 | LightCOS |
| Guest 私人互动正文 | 浏览器 IndexedDB |
| AI 与云服务密钥 | 服务端加密配置 |

发布流程：Studio 编辑 → 自动保存草稿 → 媒体上传成功 → 生成发布版本 → 更新 Search / Timeline → 失效公开页面缓存。

---

## 10. Owner Studio

Owner Studio 延续 Continuum 视觉，不套通用 Admin 模板。

导航分组：

- Create：Overview、Blog、Projects、Moments、Pages；
- Inbox：Letters、AI Review；
- Space：Media、Persona、Room & Music、Appearance；
- System：AI & Quotas、Data & Backup。

Overview 展示：

- 最近草稿与继续编辑；
- Letters / AI 审核队列；
- 公开内容概况；
- 当日 AI 成本与访客额度；
- LightCOS 占用；
- 最近管理活动。

Owner 登录后在公共内容页面看到克制的 Contextual Controls：Edit、Exposure、Relations 与更多菜单；Guest 完全不可见。

---

## 11. 服务器与云资源

目标环境：腾讯云中国大陆，4 核 4G，3Mbps。

硬约束：单机稳定运行，不以未来扩容作为功能设计前提。

### 11.1 已选资源方向

- 国内轻量服务器；
- LightCOS Lighthouse 版：100GB 标准存储＋10GB / 套餐周期的外网下行额度，实际周期口径以购买后的资源包详情为准；
- 域名待购买并完成 ICP 备案；
- 暂不购买传统 CDN、COS 套餐、CDN 回源包、CLB 或额外云硬盘；
- EdgeOne 个人版在正式上线前根据访问速度与安全需求决定。

推荐域名结构：

```text
www.<domain>    -> 主站 / 服务器（未来可接 EdgeOne）
media.<domain>  -> LightCOS 自定义域名与内置加速
```

### 11.2 资源控制

- 单 Node 进程；
- PostgreSQL 控制连接数和内存；
- 构建在本地或 CI 完成；
- 图片上传时生成 WebP / AVIF 与多尺寸变体；
- Room 资源按需加载；
- 大视频不作为 V1 直接托管重点；
- 目标整机常态内存约 2–2.5GB，最终以等效环境压测为准。

---

## 12. 安全、错误恢复与备份

### 12.1 安全

- Owner 密码使用专用密码哈希；
- 全站 HTTPS；
- 会话 Cookie 使用 HttpOnly、Secure、SameSite；
- 登录限速与失败延迟；
- 上传执行类型白名单、真实 MIME 检查、随机文件名与大小限制；
- AI / LightCOS 等密钥在服务端加密保存；
- 删除、密钥修改和清空数据需重新验证密码；
- API 对超限、负载过大和限流使用明确状态码，不返回堆栈或内部秘密。

### 12.2 降级

- PostgreSQL 暂时异常：缓存公共页面继续可读，Studio 暂停写入；
- LightCOS 上传失败：内容保留草稿，不产生坏媒体发布版本；
- AI 异常：内容浏览与非 AI Room 功能正常；
- 达到费用上限：只关闭 Guest AI；
- 发布失败：线上旧版本不变；
- 深层功能拥有独立开关与熔断。

### 12.3 备份

- 每日 PostgreSQL 压缩备份；
- 保留 7 份日备份、4 份周备份、6 份月备份；
- 每周生成内容和配置的可读 JSON 导出；
- 每月提醒 Owner 下载一份独立本地副本；
- 正式上线、重大升级前和周期性维护时进行恢复演练。

---

## 13. 测试与验收

### 13.1 测试层次

- 单元测试：Exposure、额度、Memory / Calendar / Timeline 等规则；
- 契约测试：Room、Tea、Story、Tarot 与原版功能行为；
- 集成测试：登录、草稿、媒体、发布、审核、AI 网关；
- 端到端测试：Desktop / Mobile 关键访客和 Owner 流程；
- 资源测试：4 核 4G 等效环境、3Mbps 与冷缓存首访；
- 故障演练：数据库、LightCOS、AI、备份恢复与费用熔断。

### 13.2 V1 产品验收

V1 必须同时满足：

1. 访客第一眼能理解这是 Keleoz 的个人数字空间；
2. Blog、Projects、Moments、About 可稳定阅读和搜索；
3. Owner 可以完全通过网页创作和发布；
4. Room 五项玩法均可用，不能以“源码复杂”为由降级为空入口；
5. Desktop 和 Mobile 各自发挥原参考设计优势；
6. Letters 审核、公开回信和 AI Persona 审核流程可用；
7. Guest 私人互动不被服务端长期保存；
8. Guest AI 有费用硬上限且可熔断；
9. 服务器在目标资源预算内稳定运行；
10. 备份经过实际恢复验证；
11. Credits / License 清晰，不暗示原作者背书；
12. 公共页面不存在不可完成的 Member 登录流程。

---

## 14. 实施拆分原则

本产品规模不适合用一份巨型实施计划一次完成。后续应拆为相互衔接的子项目：

1. 工程基础、数据库、认证、媒体与部署基线；
2. Owner Studio、块编辑器与内容发布；
3. 公共 Home / Blog / Projects / Moments / About / Search；
4. Letters、审核、Persona Moments 与基础 Timeline；
5. Desktop Room 与五项玩法适配；
6. Mobile Shell、互动 App 与 PWA；
7. Guest AI 网关、额度、成本和故障演练；
8. 上线验收、备案域名接入、备份与监控。

每个子项目单独形成规格、实施计划和验收证据，不将“页面能打开”视为整个产品完成。

---

## 15. 有意延后确定的运营参数

以下项目不影响架构基线，在对应子项目开始前确定：

- 最终域名；
- 首页最终中文定义与品牌微文案；
- 原创 Keleoz 角色造型与精灵资产；
- Guest 默认 AI 服务商和模型；
- Tea / Story / Tarot 的具体访客额度；
- EdgeOne 是否购买；
- Member 邮箱登录采用密码还是 Magic Link。

这些不是未完成的 V1 需求，而是有明确决策时点的运营与设计参数。
