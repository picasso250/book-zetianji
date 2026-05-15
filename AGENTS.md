# AGENTS.md

- 不要向前兼容

## 图片资产

- 项目内位图资产默认使用 JPG。
- JPG 必须使用 quality 85。
- JPG 必须启用渐进式加载（progressive JPEG）。
- 写入项目前必须去除 EXIF、ICC、XMP 等 metadata。
- 不保留未被页面引用的 PNG 原图，除非用户明确要求保留。

## 关于并行执行

- Default to serial shell execution.
- Only clearly read-only inspection commands may run in parallel.
- Never run `git` state-changing commands in parallel.
- Never run file-writing, process-management, package-manager, or migration commands in parallel.
- If unsure whether a command is read-only, run it serially.

## 关于 Wrangler

- `wrangler whoami` 会超时，但这不代表权限有问题。
- 你拥有权限，并且其他 `wrangler` 子命令都能成功。

## 关于错误处理

- "Don’t fight errors! Whenever you encounter the same error twice, research the web and find 3-5 possible ways to fix it. Then choose the most efficient solution and implement it."
