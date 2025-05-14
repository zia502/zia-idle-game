---
### Decision (Debug)
[2025-05-14 22:53:00] - [技能导入问题：修复策略确定]

**Rationale:**
用户报告 ES6 模块导入技能 JSON 文件时出现问题。经过检查 `index.html` (script type="module" 正确), `package.json` ("type": "module" 正确), 以及技能 JSON 文件本身 (格式有效)，问题最可能出在 `src/js/core/skill-loader.js` 中动态导入 JSON 的方式。当前的 `import(filePath)).default` 依赖于浏览器对动态导入 JSON 的特定处理，这可能不够健壮或存在兼容性问题。
决定采用更通用的 `fetch` API 结合 `response.json()` 的方式来加载和解析 JSON 数据，并统一浏览器端的异步代码风格为 `async/await`。

**Details:**
- 受影响文件: [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js)
- 更改范围: 修改 `loadRSkills`, `loadSRSkills`, `loadSSRSkills`, `loadBossSkills` 函数中浏览器环境下的文件加载逻辑。