# 原项目功能差异审查（2026-09-08）

后续交付更新：本机存档查看/搜索/导出与站内原播放器持续播放已在 `3bd52a5` 实现并上线，详见 `SOURCE_REUSE_LEDGER.md`。下表保留审查时发现的差异作为历史依据；“恢复游戏回合”、音乐 AI 联动等未随这两项一起实现。

范围：当前代码对照 `upstream/InternalBeyond-Desktop/InternalBeyond.html`、Desktop `game/game_module.js` 与 `upstream/InternalBeyond-Mobile/index.html`。本轮为静态功能链路审查，不修改产品、不调用付费 AI、不声称已逐项完成真机验证。复用台账含历史阶段记录，以下结论以实际路由、适配器和数据读写为准。

## 已确认未闭环的能力

| 优先级 | 原项目能力 | 当前情况 | 证据与建议边界 |
|---|---|---|---|
| P1 | Tea / Story / Tarot 存档后在日记本回看 | 已写入访客 IndexedDB，但没有找到这些记录的列表、打开、导出和恢复入口；“保存成功”不等于用户能再次找到 | 三个 `src/modules/*/local-history-browser.ts` 负责写入；全局检索 `experience-state` 只找到这些写入与 Room 状态适配。`room/source-ai-adapter.ts:323` 的原版 `dbGetAll` 返回空列表，`ensureDiaryInit` 是空适配。应先补本机历史查看/导出，不能擅自上传访客私人记录。Story 的完整游戏恢复还需要明确记录结构，不可把文本进度存档宣称为可继续游玩。 |
| P1 | 同一空间内切换模块，音乐和浮窗持续运行 | 播放器保留在 Home 的原版 iframe 内；前往 Blog / Letters / Chat 等独立路由会销毁该 iframe。根布局没有持续播放器，原单页连续体验未等价迁入 | `app/page.tsx` 挂载 `SourceHomeFrame`，`app/layout.tsx` 只有 children；`home/source-home-frame.tsx`、`home/mobile-public-patch.ts` 使用 parent.location 跳转。`app/music/page.tsx` 只重定向回首页打开播放器。应保留原播放器并解决生命周期，而不是再造一个播放器。 |
| P2 | Music Together：选择 AI、歌词/当前播放注入聊天、AI 控制播放 | 首页原版音乐 UI 尚在，默认歌单已接入，但公开 Home 与受保护 Chat 使用不同文档和数据上下文，未找到把播放状态及同行者跨页面连起来的桥接 | 原版 Desktop 24925–25030、Mobile 2959+ / 17831+；`site-config/source-patch.ts` 只注入站点歌单；Owner `source-native/contracts.ts` 的 store 列表不含 music。不能把原文件中保留的按钮/函数等同于端到端功能。应限定 Owner 同行者联动；语音转写不在此次补齐范围。 |
| P2 | 选择 AI 主动寄来一封信 | 当前 Letters 是访客投稿、审核、站主回复及公开信墙，没有原版 AI 来信入口与生成保存链路 | 原版 Desktop `requestLetterFromSelected`（11163+）、Mobile `requestLetterM`（11898+）；当前 `letters/letters-client.tsx` 与 `api/letters` 是投稿流程，native store 白名单不含 letters。建议作为 Owner 私人来信实现；不可自动生成并公开。 |
| P2 | Room 内选择自己的不同 AI，带着个人资料/记忆参与互动，并回到同一日记本 | 当前访客玩法使用固定站点同行者；没有复用 Owner 的完整个人关系/记忆链路 | `room/source-ai-adapter.ts:135+` 创建站点同行者，317+ 的资料读取固定返回 Visitor，其他 store 读取为空，保存转向访客本机。访客隔离本身正确；缺口是尚无独立 Owner 私人玩法链路，不能通过给访客加载 Owner 资料补齐。 |
| P2 | 原项目整份数据包导入、继续使用旧数据 | 当前有站点备份、导出、恢复演练；未找到从原版整库包到当前 PostgreSQL / 媒体对象的完整可用导入流程 | `api/studio/export` 为导出，`studio/operations` 为运维；native `dbClear` 禁止通用清库，store 白名单和 posts 格式也与原包不同。单模块 Memory 导入和服务器备份恢复不能证明整库迁移已完成。若用户没有旧数据，可后置。 |

## 部分实现或有意不同，不能简单说“完全没做”

- **Circle / InternetBeyond → Moments**：已有站主动态、AI Persona 待审提案、批准后的评论/回复/转发等。公开 UI 是 `content/public-moments.tsx` 的新渲染，不是原版 Circle 全套运行时；native navigation 把 beyond 跳到 `/moments`，原 `feed` store 没有映射到当前内容库。原聊天指令/心跳直接驱动 Circle 的整套体验不等价。公开内容必须保留审核，不能为了复刻恢复 AI 自动公开。
- **文章 AI 批注、陪读、生成记忆**：Owner 原版工作区及 `blogAnnotations` / `blogComments` store 有接入，不能列为全站未做。公开 `/blog/[slug]` 只渲染文章、阅读控制和相邻文章，没有完整原版 AI 陪读/批注 UI；若要公开展示批注，需单独发布权限，不可泄露 Owner 私人批注。
- **独立 Music 页面**：现在 `/music` 返回首页原播放器，这是已有决策，不是缺一张新设计的音乐页面。旧 `music-client.tsx`、`source-music-client.tsx` 等文件仍在，但没有当前路由挂载，不应拿它们当正在使用的实现。
- **手机 Room**：没有硬塞 Desktop 像素场景；手机用 Tea / Story / Tarot / Character 独立 App，这是已确认设计。Room 引导页的可读性和链接已修复；普通 `/room` 仍需确认 EdgeOne 旧页面缓存被刷新。缓存问题不是原版功能缺口。

## 已有实际实现，不应再当“整块缺失”

- Home 原版桌面/手机运行时与公开适配、原图和主题。
- 原版纯文本/Markdown 写日志、自动保存、媒体附件；结构化文章使用原版外壳加独立块编辑引擎。
- Owner Chat、群组/线程/摘要、Memory 星图、Auto Memory 和 Calendar 的服务端记录适配。
- Tea、Story、Tarot 的主交互与站点 AI 网关；Wardrobe、Sleep 与访客本机状态。
- Profile 发布、两套主题各自头像/封面/相册、DIY、移动桌面布局及默认歌单配置。
- 访客信件投递、审核、公开回复；公共内容发布/隐藏、媒体、备份和权限。

这里的“已有实现”不表示全部原版按钮都已经逐一在线验收。尤其 AI 联动应区分源码保留、适配已接、真实调用已验证三个层次。

## 排除或需明确产品决策

- 用户明确不做：生图、ICode、语音转写；通用 MCP 不列为遗漏，已保留的是限定用途的免 Key 搜索。
- 会员注册/公开评论在原 V1 中延期；不能因为原版有本地社交功能就自动恢复到公开网站。
- 原版多供应商/浏览器保存 API Key 不照搬：当前为服务器统一持钥、指定模型。
- 原版手机壳、蓝牙/硬件控制、沙箱等不是当前网站的既定交付能力，不顺带扩展。
- 未填写头像、简介、音乐和未发布文章是配置/内容空缺，不是开发缺口。

建议顺序：本机存档回看 → 跨页面音乐连续性 → Owner 音乐/Chat 联动 → Owner AI 来信 → 私人 Room 关系链路 → 旧数据迁移。Circle 原版交互补齐和公开批注需要保留审核/隐私边界后再排期。
