# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`huagao-sdk` 是一个 TypeScript SDK，封装了华高 WebService（一个本地运行的文档扫描/图像处理后台服务）。SDK 通过 WebSocket（默认 `ws://127.0.0.1:38999`）以 JSON 消息与该服务通信。

后端协议的完整规范在仓库根目录的 `WebService_Help.md` —— **它是所有接口字段、消息形态、错误码的事实来源**。新增/修改 API 时务必先对照此文档，而不是按照客户端方法的形态自由发挥。

## 常用命令

包管理使用 **pnpm**（`pnpm-workspace.yaml` 仅声明 `allowBuilds.esbuild: true`，与 tsup 配合）。

```bash
pnpm install       # 安装依赖
pnpm run build     # 通过 tsup 构建 dist/（CJS + ESM + .d.ts + sourcemap）
```

仓库当前**没有**测试套件、lint、format 脚本。`prepublishOnly` 钩子会在发布前自动构建。

## 架构

代码集中在 `src/` 三个文件，且耦合紧密：

### `src/types.ts` — 协议契约
- 以 `BaseMessage` / `BaseRequest` / `BaseResponseOk` / `BaseResponseErr` 为基础，按服务端 `func` 字段命名导出每个接口的 Request/Response 类型。
- 通过判别联合（`Request`、`Response`、`Event`、`ReceivedMessage`）覆盖全部消息。
- `FuncResponseMap` 将 `func` 字符串映射到对应响应类型，是客户端 `send<T>()` 强类型推断的核心。
- 错误响应的判断点：`ret === 0` 表示成功；非 0 时 `err_info` 携带错误描述。

### `src/client.ts` — `HuaGaoClient`
- 持有一个 WebSocket，可以由 SDK 自建（传 `url`）或外部注入（传 `socket`，通常是 Node.js 端 `ws` 包的实例）。`ownedSocket` 字段控制 `disconnect()` 是否会关闭底层连接。
- 请求/响应配对机制：`nextIden()` 生成 4 位十六进制 `iden`，`send()` 把 Promise 的 resolve/reject 放进 `pending: Map<iden, PendingRequest>`，并附 `timeout` 定时器（默认 30s）。消息到达时按 `iden + func` 匹配——匹配上则按 `ret` 决定 resolve/reject；匹配不上视为服务端推送事件，分发给通过 `on()` 注册的监听器。
- 事件类型（`device_arrive` / `device_remove` / `scan_begin` / `scan_end` / `scan_info` / `scan_image`）只通过 `on()` 接收，不会产生 Promise 结果。
- `send()` 是私有泛型方法，所有公开 API 方法都是它的薄包装；不要绕开它直接 `socket.send`，否则会绕过超时与 pending 跟踪。

### `src/index.ts` — 公共桶（barrel）
逐项 re-export 类型与类。新增类型时**必须**在此追加导出，否则发布产物里看不到。

## 添加新 API 的工作流

当 `WebService_Help.md` 出现新接口时，按下面顺序改动以保持类型完整：

1. 在 `src/types.ts` 中添加 `XxxRequest`（继承 `BaseRequest` 并固定 `func: 'xxx'`）和对应 `XxxResponse`（或复用 `BaseResponseOk` / 已有的共享响应如 `LocalImageResultResponse` / `ImageResultResponse`）。
2. 把请求加入 `Request` 联合、把响应加入 `Response` 联合。
3. 在 `FuncResponseMap` 中添加 `func → response` 映射，**否则 `client.send` 的返回类型会退化**。
4. 在 `src/client.ts` 添加一个公开方法，统一形态为 `methodName(params: Omit<XxxRequest, 'func' | 'iden'>) { return this.send('xxx', params); }`。无参接口传 `{}`。
5. 在 `src/index.ts` re-export 新类型。

## 跨环境注意点

- **浏览器 / Node ≥ 22**：直接 `new HuaGaoClient({ url })`，全局 `WebSocket` 已就位，SDK 自管 `connect()` / `disconnect()`。
- **Node ≤ 21（含 Node 16/18/20）**：**没有全局 `WebSocket`**，直接传 `url` 会在 `connect()` 里抛 `WebSocket is not defined`。必须通过 `ws` 包注入：

  ```ts
  import WebSocket from 'ws';                   // pnpm add ws && pnpm add -D @types/ws
  const ws = new WebSocket('ws://127.0.0.1:38999');
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
  const client = new HuaGaoClient({ socket: ws as unknown as WebSocket });
  // 用完后由调用方关闭：ws.close();
  ```

  这种模式下 `ownedSocket = false`：`client.connect()` 仅校验已 OPEN，`client.disconnect()` 不会关底层连接，需要自己 `ws.close()`。SDK 内部不会 `new WebSocket(...)`，因此缺失全局对象无影响。
- 构建目标是 `es2020`，输出 `dist/index.cjs`、`dist/index.mjs`、对应 `.d.ts` / `.d.mts`，由 `package.json` 的 `exports` 字段按 `import` / `require` 双入口暴露。
