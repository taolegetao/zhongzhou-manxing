# 永定门修复记接入记录

日期：2026-11-26；基于主分支 74731f54bdf6b42c9063928f34d417bcc99b555b。

## 行为

永定门资料卡显示“走进《永定门修复记》”。同站点 iframe 打开 games/yongdingmen/index.html，继承现有顶部返回按钮；关闭时 about:blank 卸载游戏，重新进入创建全新会话。资料卡答题与徽章规则沿用原行为。

所有游戏资源随仓库托管，支持 GitHub Pages /zhongzhou-manxing/ 子路径，无外部游戏链接依赖。附带 Phaser MIT 许可。当前仍为阶段1程序化像素占位，不代表正式美术或历史建筑复原。

## 实际检查

- `npm run build`（修复游戏源工程）：退出0，包含 TypeScript strict 检查。
- `npm run test:unit`：8用例通过。
- `node --check js/main.js`、`node --check js/data/pois.js`：退出0。
- Edge 390×844 浏览器回归：永定门介绍卡入口、iframe资源加载、开始修复、返回卸载、重进回到0分、生产测试桥 undefined、回音壁与定更仍能打开，全部通过。仅用地图 debug API 设置初始点位，其余点击均走真实按钮；没有将此项当作完整地图行走验收。
- 浏览器 pageerror 与 HTTP 400+ 均无异常。
- 根工程复现脚本：scripts/test-map-integration.mjs；截图：docs/screenshots/map-integration.png。
- 手机真机触控、Safari及性能未执行。该接入不修改修复游戏规则，完整胜负规则测试证据见修复游戏工程原报告。

## 发布方式

GitHub 连接器首次返回403，无仓库写权限。本次通过用户授权的独立凭据同步已验证源码，凭据仅通过进程标准输入传递，不随源码保存。main 更新后由 GitHub Pages 发布；最终公网是否生效以网页检查为准。
