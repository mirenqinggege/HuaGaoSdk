import type {
  Request,
  ReceivedMessage,
  Event,
  FuncName,
  FuncResponseMap,
  BaseResponseOk,
  SetGlobalConfigRequest,
  LoadLocalImageRequest,
  SaveLocalImageRequest,
  DeleteLocalFileRequest,
  UploadLocalFileRequest,
  MergeLocalImageRequest,
  LocalMakeMultiImageRequest,
  SplitLocalImageRequest,
  LocalMakeZipFileRequest,
  LocalImageDeskewRequest,
  LocalImageAddWatermarkRequest,
  LocalImageDecontaminationRequest,
  LocalImageDirectionCorrectRequest,
  LocalImageClipRequest,
  LocalImageFadeBkcolorRequest,
  LocalImageAdjustColorsRequest,
  LocalImageBinarizationRequest,
  OpenDeviceRequest,
  SetDeviceParamRequest,
  StartScanRequest,
  OpenBatchRequest,
  DeleteBatchRequest,
  NewBatchRequest,
  ModifyBatchIdRequest,
  BindFolderRequest,
  LoadImageRequest,
  SaveImageRequest,
  InsertLocalImageRequest,
  InsertImageRequest,
  ModifyImageTagRequest,
  DeleteImageRequest,
  ModifyImageRequest,
  ModifyImageByLocalRequest,
  MoveImageRequest,
  ExchangeImageRequest,
  UploadImageRequest,
  MergeImageRequest,
  MakeMultiImageRequest,
  SplitImageRequest,
  MakeZipFileRequest,
  ImageDeskewRequest,
  ImageAddWatermarkRequest,
  ImageDecontaminationRequest,
  ImageDirectionCorrectRequest,
  ImageClipRequest,
  ImageFadeBkcolorRequest,
  ImageAdjustColorsRequest,
  ImageBinarizationRequest,
} from './types.js';

type EventHandler<T extends Event = Event> = (event: T) => void;

/**
 * WHATWG WebSocket `readyState` constants. Hard-coded so we never touch the
 * global `WebSocket` at runtime — Node ≤ 21 doesn't expose it and would throw
 * `ReferenceError: WebSocket is not defined` even on a successful injection
 * path (e.g. `socket.readyState === WebSocket.OPEN`).
 */
const WS_OPEN = 1;

interface PendingRequest {
  resolve: (value: BaseResponseOk) => void;
  reject: (error: Error) => void;
  func: string;
  timer: ReturnType<typeof setTimeout>;
}

export interface HuaGaoClientOptions {
  /** WebSocket server URL, e.g. ws://127.0.0.1:38999 */
  url?: string;
  /** Timeout for each request in ms (default 30000) */
  timeout?: number;
  /**
   * Provide a WebSocket instance directly. **Required on Node.js ≤ 21**
   * (Node 16/18/20 do not expose a global `WebSocket`); typically use the
   * `ws` package: `import WebSocket from 'ws'`.
   *
   * When given, `url` is ignored. The caller owns the socket lifecycle:
   * open it before passing in, close it yourself when done. `connect()`
   * becomes a no-op (and rejects if the socket isn't open yet);
   * `disconnect()` will NOT close it.
   */
  socket?: WebSocket;
  /**
   * Auto-connect when creating the client with a `url`.
   * Default: true. Set to false to call `connect()` manually.
   */
  autoConnect?: boolean;
}

/**
 * TypeScript SDK for HuaGao WebService.
 *
 * Communicates with the HuaGao document-scanning/image-processing backend
 * over a WebSocket connection using JSON messages.
 *
 * ## Usage
 *
 * **Browser, or Node.js ≥ 22 (global `WebSocket` available):**
 * ```ts
 * const client = new HuaGaoClient({ url: 'ws://127.0.0.1:38999' });
 * await client.connect();
 * await client.setGlobalConfig({ image_format: 'jpg' });
 * ```
 *
 * **Node.js ≤ 21 (including Node 16/18/20 — no global `WebSocket`):**
 *
 * Install the `ws` package and inject the socket. The SDK will NOT call
 * `new WebSocket(...)` internally in this mode, so the missing global is
 * irrelevant. You own the socket lifecycle (wait for `open`, call `close`).
 *
 * ```ts
 * import WebSocket from 'ws';                   // pnpm add ws && pnpm add -D @types/ws
 * const ws = new WebSocket('ws://127.0.0.1:38999');
 * await new Promise<void>((resolve, reject) => {
 *   ws.once('open', () => resolve());
 *   ws.once('error', reject);
 * });
 * // Cast: `ws` package's WebSocket is structurally compatible enough for our use.
 * const client = new HuaGaoClient({ socket: ws as unknown as WebSocket });
 * await client.setGlobalConfig({ image_format: 'jpg' });
 * // When done:
 * ws.close();
 * ```
 *
 * Note: with an externally-provided socket, `client.connect()` is a no-op
 * (it rejects if the socket isn't already open) and `client.disconnect()`
 * will NOT close the underlying socket — you must close it yourself.
 */
export class HuaGaoClient {
  private socket: WebSocket | null = null;
  private url: string;
  private timeout: number;
  private autoConnect: boolean;
  private ownedSocket: boolean;

  private idenCounter = 0;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Map<string, Set<EventHandler<any>>>();

  constructor(options: HuaGaoClientOptions = {}) {
    this.url = options.url ?? 'ws://127.0.0.1:38999';
    this.timeout = options.timeout ?? 30000;
    this.autoConnect = options.autoConnect ?? true;
    if (options.socket) {
      this.socket = options.socket;
      this.ownedSocket = false;
      this._setupSocket();
    } else {
      this.ownedSocket = true;
      if (this.autoConnect) {
        this.connect();
      }
    }
  }

  // ============================================================
  // Connection management
  // ============================================================

  /** Open a WebSocket connection. No-op if already connected. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WS_OPEN) {
        resolve();
        return;
      }
      if (!this.ownedSocket) {
        reject(new Error('Socket externally provided but not open'));
        return;
      }
      const ws = new WebSocket(this.url);
      ws.addEventListener('open', () => {
        this.socket = ws;
        resolve();
      });
      ws.addEventListener('error', (err) => {
        reject(new Error(`WebSocket connection failed: ${JSON.stringify(err)}`));
      });
      // If the socket fails to connect, the 'error' event above will fire.
      // In some environments, `onerror` fires without `onclose`, so we
      // also guard with a close handler before open.
      ws.addEventListener('close', (ev) => {
        if (!this.socket || this.socket !== ws) {
          reject(new Error(`WebSocket closed before open (code ${ev.code})`));
        }
      });
      this._setupSocketOn(ws);
    });
  }

  /** Close the connection. */
  disconnect(): void {
    if (this.ownedSocket && this.socket) {
      this.socket.close();
    }
    this.socket = null;
    // Reject all pending requests
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error('Connection closed'));
    }
    this.pending.clear();
  }

  /** Whether the underlying WebSocket is in OPEN state. */
  get isConnected(): boolean {
    return this.socket?.readyState === WS_OPEN;
  }

  // ============================================================
  // Event handling
  // ============================================================

  /**
   * Listen for server-pushed events (device_arrive, scan_image, etc.).
   * Returns an unsubscribe function.
   */
  on<T extends Event>(func: T['func'], handler: EventHandler<T>): () => void {
    let set = this.listeners.get(func);
    if (!set) {
      set = new Set();
      this.listeners.set(func, set);
    }
    set.add(handler);
    return () => set?.delete(handler);
  }

  private emit(func: string, data: Event): void {
    const set = this.listeners.get(func);
    if (set) {
      for (const handler of set) {
        try {
          handler(data);
        } catch {
          // Swallow handler errors
        }
      }
    }
  }

  // ============================================================
  // Internal plumbing
  // ============================================================

  private _setupSocket(): void {
    if (!this.socket) return;
    this._setupSocketOn(this.socket);
  }

  private _setupSocketOn(ws: WebSocket): void {
    ws.addEventListener('message', (ev: MessageEvent) => {
      let msg: ReceivedMessage;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return; // Ignore unparseable messages
      }
      const { func, iden } = msg;

      // Check if this is a response to a pending request
      const pending = this.pending.get(iden);
      if (pending && pending.func === func) {
        clearTimeout(pending.timer);
        this.pending.delete(iden);
        if ('ret' in msg && (msg as BaseResponseOk).ret !== 0) {
          const err = msg as { ret: number; err_info: string };
          pending.reject(
            new Error(`[${func}] error code ${err.ret}: ${err.err_info}`),
          );
        } else {
          pending.resolve(msg as BaseResponseOk);
        }
        return;
      }

      // Otherwise treat as a server event
      this.emit(func, msg as Event);
    });

    ws.addEventListener('close', () => {
      // Clean up pending requests that were not resolved
      for (const [, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(new Error('Connection closed'));
      }
      this.pending.clear();
    });
  }

  private nextIden(): string {
    this.idenCounter = (this.idenCounter + 1) & 0xffff;
    return this.idenCounter.toString(16).padStart(4, '0');
  }

  private send<T extends FuncName>(
    func: T,
    params: Omit<Request & { func: T }, 'func' | 'iden'>,
  ): Promise<FuncResponseMap[T]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WS_OPEN) {
        reject(new Error('Not connected'));
        return;
      }
      const iden = this.nextIden();
      const message = JSON.stringify({ func, iden, ...params });
      const timer = setTimeout(() => {
        this.pending.delete(iden);
        reject(new Error(`Request "${func}" (iden=${iden}) timed out`));
      }, this.timeout);
      this.pending.set(iden, { resolve: resolve as (v: BaseResponseOk) => void, reject, func, timer });
      this.socket!.send(message);
    });
  }

  // ============================================================
  // Section 2 — Global config
  // ============================================================

  setGlobalConfig(config: Omit<SetGlobalConfigRequest, 'func' | 'iden'>) {
    return this.send('set_global_config', config);
  }

  getGlobalConfig() {
    return this.send('get_global_config', {});
  }

  // ============================================================
  // Section 2 — Local image operations
  // ============================================================

  loadLocalImage(params: Omit<LoadLocalImageRequest, 'func' | 'iden'>) {
    return this.send('load_local_image', params);
  }

  saveLocalImage(params: Omit<SaveLocalImageRequest, 'func' | 'iden'>) {
    return this.send('save_local_image', params);
  }

  deleteLocalFile(params: Omit<DeleteLocalFileRequest, 'func' | 'iden'>) {
    return this.send('delete_local_file', params);
  }

  clearGlobalFileSavePath() {
    return this.send('clear_global_file_save_path', {});
  }

  uploadLocalFile(params: Omit<UploadLocalFileRequest, 'func' | 'iden'>) {
    return this.send('upload_local_file', params);
  }

  mergeLocalImage(params: Omit<MergeLocalImageRequest, 'func' | 'iden'>) {
    return this.send('merge_local_image', params);
  }

  localMakeMultiImage(params: Omit<LocalMakeMultiImageRequest, 'func' | 'iden'>) {
    return this.send('local_make_multi_image', params);
  }

  splitLocalImage(params: Omit<SplitLocalImageRequest, 'func' | 'iden'>) {
    return this.send('split_local_image', params);
  }

  localMakeZipFile(params: Omit<LocalMakeZipFileRequest, 'func' | 'iden'>) {
    return this.send('local_make_zip_file', params);
  }

  localImageDeskew(params: Omit<LocalImageDeskewRequest, 'func' | 'iden'>) {
    return this.send('local_image_deskew', params);
  }

  localImageAddWatermark(params: Omit<LocalImageAddWatermarkRequest, 'func' | 'iden'>) {
    return this.send('local_image_add_watermark', params);
  }

  localImageDecontamination(params: Omit<LocalImageDecontaminationRequest, 'func' | 'iden'>) {
    return this.send('local_image_decontamination', params);
  }

  localImageDirectionCorrect(params: Omit<LocalImageDirectionCorrectRequest, 'func' | 'iden'>) {
    return this.send('local_image_direction_correct', params);
  }

  localImageClip(params: Omit<LocalImageClipRequest, 'func' | 'iden'>) {
    return this.send('local_image_clip', params);
  }

  localImageFadeBkcolor(params: Omit<LocalImageFadeBkcolorRequest, 'func' | 'iden'>) {
    return this.send('local_image_fade_bkcolor', params);
  }

  localImageAdjustColors(params: Omit<LocalImageAdjustColorsRequest, 'func' | 'iden'>) {
    return this.send('local_image_adjust_colors', params);
  }

  localImageBinarization(params: Omit<LocalImageBinarizationRequest, 'func' | 'iden'>) {
    return this.send('local_image_binarization', params);
  }

  // ============================================================
  // Section 3 — Device
  // ============================================================

  initDevice() {
    return this.send('init_device', {});
  }

  deinitDevice() {
    return this.send('deinit_device', {});
  }

  isDeviceInit() {
    return this.send('is_device_init', {});
  }

  getDeviceNameList() {
    return this.send('get_device_name_list', {});
  }

  openDevice(params: Omit<OpenDeviceRequest, 'func' | 'iden'> = {}) {
    return this.send('open_device', params);
  }

  closeDevice() {
    return this.send('close_device', {});
  }

  getDeviceSn() {
    return this.send('get_device_sn', {});
  }

  getDeviceFwVersion() {
    return this.send('get_device_fwversion', {});
  }

  setDeviceParam(params: Omit<SetDeviceParamRequest, 'func' | 'iden'>) {
    return this.send('set_device_param', params);
  }

  getDeviceParam() {
    return this.send('get_device_param', {});
  }

  resetDeviceParam() {
    return this.send('reset_device_param', {});
  }

  getCurrDeviceName() {
    return this.send('get_curr_device_name', {});
  }

  startScan(params: Omit<StartScanRequest, 'func' | 'iden'>) {
    return this.send('start_scan', params);
  }

  stopScan() {
    return this.send('stop_scan', {});
  }

  isDeviceScanning() {
    return this.send('is_device_scanning', {});
  }

  // ============================================================
  // Section 4 — Batch / image business
  // ============================================================

  getBatchIdList() {
    return this.send('get_batch_id_list', {});
  }

  openBatch(params: Omit<OpenBatchRequest, 'func' | 'iden'>) {
    return this.send('open_batch', params);
  }

  deleteBatch(params: Omit<DeleteBatchRequest, 'func' | 'iden'>) {
    return this.send('delete_batch', params);
  }

  newBatch(params: Omit<NewBatchRequest, 'func' | 'iden'> = {}) {
    return this.send('new_batch', params);
  }

  getCurrBatchId() {
    return this.send('get_curr_batch_id', {});
  }

  modifyBatchId(params: Omit<ModifyBatchIdRequest, 'func' | 'iden'>) {
    return this.send('modify_batch_id', params);
  }

  bindFolder(params: Omit<BindFolderRequest, 'func' | 'iden'>) {
    return this.send('bind_folder', params);
  }

  stopBindFolder() {
    return this.send('stop_bind_folder', {});
  }

  getImageThumbnailList() {
    return this.send('get_image_thumbnail_list', {});
  }

  getImageCount() {
    return this.send('get_image_count', {});
  }

  loadImage(params: Omit<LoadImageRequest, 'func' | 'iden'>) {
    return this.send('load_image', params);
  }

  saveImage(params: Omit<SaveImageRequest, 'func' | 'iden'>) {
    return this.send('save_image', params);
  }

  insertLocalImage(params: Omit<InsertLocalImageRequest, 'func' | 'iden'>) {
    return this.send('insert_local_image', params);
  }

  insertImage(params: Omit<InsertImageRequest, 'func' | 'iden'>) {
    return this.send('insert_image', params);
  }

  modifyImageTag(params: Omit<ModifyImageTagRequest, 'func' | 'iden'>) {
    return this.send('modify_image_tag', params);
  }

  deleteImage(params: Omit<DeleteImageRequest, 'func' | 'iden'>) {
    return this.send('delete_image', params);
  }

  clearImageList() {
    return this.send('clear_image_list', {});
  }

  modifyImage(params: Omit<ModifyImageRequest, 'func' | 'iden'>) {
    return this.send('modify_image', params);
  }

  modifyImageByLocal(params: Omit<ModifyImageByLocalRequest, 'func' | 'iden'>) {
    return this.send('modify_image_by_local', params);
  }

  moveImage(params: Omit<MoveImageRequest, 'func' | 'iden'>) {
    return this.send('move_image', params);
  }

  exchangeImage(params: Omit<ExchangeImageRequest, 'func' | 'iden'>) {
    return this.send('exchange_image', params);
  }

  imageBookSort() {
    return this.send('image_book_sort', {});
  }

  uploadImage(params: Omit<UploadImageRequest, 'func' | 'iden'>) {
    return this.send('upload_image', params);
  }

  mergeImage(params: Omit<MergeImageRequest, 'func' | 'iden'>) {
    return this.send('merge_image', params);
  }

  makeMultiImage(params: Omit<MakeMultiImageRequest, 'func' | 'iden'>) {
    return this.send('make_multi_image', params);
  }

  splitImage(params: Omit<SplitImageRequest, 'func' | 'iden'>) {
    return this.send('split_image', params);
  }

  makeZipFile(params: Omit<MakeZipFileRequest, 'func' | 'iden'>) {
    return this.send('make_zip_file', params);
  }

  imageDeskew(params: Omit<ImageDeskewRequest, 'func' | 'iden'>) {
    return this.send('image_deskew', params);
  }

  imageAddWatermark(params: Omit<ImageAddWatermarkRequest, 'func' | 'iden'>) {
    return this.send('image_add_watermark', params);
  }

  imageDecontamination(params: Omit<ImageDecontaminationRequest, 'func' | 'iden'>) {
    return this.send('image_decontamination', params);
  }

  imageDirectionCorrect(params: Omit<ImageDirectionCorrectRequest, 'func' | 'iden'>) {
    return this.send('image_direction_correct', params);
  }

  imageClip(params: Omit<ImageClipRequest, 'func' | 'iden'>) {
    return this.send('image_clip', params);
  }

  imageFadeBkcolor(params: Omit<ImageFadeBkcolorRequest, 'func' | 'iden'>) {
    return this.send('image_fade_bkcolor', params);
  }

  imageAdjustColors(params: Omit<ImageAdjustColorsRequest, 'func' | 'iden'>) {
    return this.send('image_adjust_colors', params);
  }

  imageBinarization(params: Omit<ImageBinarizationRequest, 'func' | 'iden'>) {
    return this.send('image_binarization', params);
  }
}
