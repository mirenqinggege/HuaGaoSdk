// ============================================================
// Base / Common types
// ============================================================

/** Base message shared by all WebSocket messages */
export interface BaseMessage {
  func: string;
  iden: string;
}

/** Base request sent to the server */
export interface BaseRequest extends BaseMessage {
  [key: string]: unknown;
}

/** Successful response from the server (ret === 0) */
export interface BaseResponseOk extends BaseMessage {
  ret: 0;
  err_info: '';
}

/** Error response from the server (ret !== 0) */
export interface BaseResponseErr extends BaseMessage {
  ret: number;
  err_info: string;
}

/** Union response type */
export type BaseResponse = BaseResponseOk | BaseResponseErr;

// ============================================================
// Global config types
// ============================================================

export type FileNameMode =
  | 'date_time'
  | 'random'
  | 'sn_date_time'
  | 'folder_time_img_order';

export type ImageFormat =
  | 'jpg'
  | 'bmp'
  | 'png'
  | 'tif'
  | 'pdf'
  | 'ofd'
  | 'ocr-pdf'
  | 'ocr-ofd';

export type TiffCompression = 'none' | 'lzw' | 'jpeg';

export interface GlobalConfig {
  file_save_path: string;
  file_name_prefix: string;
  file_name_mode: FileNameMode;
  image_format: ImageFormat;
  image_jpeg_quality: number;
  image_tiff_compression: TiffCompression;
  image_tiff_jpeg_quality: number;
  image_jp2_ratio: number;
}

export interface SetGlobalConfigRequest extends BaseRequest {
  func: 'set_global_config';
  file_save_path?: string;
  file_name_prefix?: string;
  file_name_mode?: FileNameMode;
  image_format?: ImageFormat;
  image_jpeg_quality?: number;
  image_tiff_compression?: TiffCompression;
  image_tiff_jpeg_quality?: number;
  image_jp2_ratio?: number;
}

export interface GetGlobalConfigResponse extends BaseResponseOk {
  func: 'get_global_config';
  file_save_path: string;
  file_name_prefix: string;
  file_name_mode: FileNameMode;
  image_format: ImageFormat;
  image_jpeg_quality: number;
  image_tiff_compression: TiffCompression;
  image_tiff_jpeg_quality: number;
  image_jp2_ratio: number;
}

// ============================================================
// Local image operation types
// ============================================================

export interface LoadLocalImageRequest extends BaseRequest {
  func: 'load_local_image';
  image_path: string;
}

export interface LoadLocalImageResponse extends BaseResponseOk {
  func: 'load_local_image';
  image_base64: string;
}

export interface SaveLocalImageRequest extends BaseRequest {
  func: 'save_local_image';
  image_base64: string;
}

export interface SaveLocalImageResponse extends BaseResponseOk {
  func: 'save_local_image';
  image_path: string;
}

export interface DeleteLocalFileRequest extends BaseRequest {
  func: 'delete_local_file';
  file_path: string;
}

export interface UploadLocalFileRequest extends BaseRequest {
  func: 'upload_local_file';
  file_path: string;
  remote_file_path: string;
  upload_mode: 'http' | 'ftp';
  http_host?: string;
  http_port?: number;
  http_path?: string;
  ftp_user?: string;
  ftp_password?: string;
  ftp_host?: string;
  ftp_port?: number;
}

export interface MergeLocalImageRequest extends BaseRequest {
  func: 'merge_local_image';
  image_path_list: string[];
  mode: 'horz' | 'vert';
  align: 'top' | 'bottom' | 'center' | 'left' | 'right';
  interval: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface MergeLocalImageResponse extends BaseResponseOk {
  func: 'merge_local_image';
  image_path: string;
  image_base64: string;
}

export interface LocalMakeMultiImageRequest extends BaseRequest {
  func: 'local_make_multi_image';
  image_path_list: string[];
  format: 'tif' | 'pdf' | 'ofd';
  tiff_compression: TiffCompression;
  tiff_jpeg_quality: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalMakeMultiImageResponse extends BaseResponseOk {
  func: 'local_make_multi_image';
  image_path: string;
  image_base64: string;
}

export interface SplitLocalImageRequest extends BaseRequest {
  func: 'split_local_image';
  image_path: string;
  mode: 'horz' | 'vert';
  location: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface SplitLocalImageResponse extends BaseResponseOk {
  func: 'split_local_image';
  image_path_list: string[];
  image_base64_list: string[];
}

export interface LocalMakeZipFileRequest extends BaseRequest {
  func: 'local_make_zip_file';
  file_path_list: string[];
  local_save: boolean;
  get_base64: boolean;
  zip_path: string;
}

export interface LocalMakeZipFileResponse extends BaseResponseOk {
  func: 'local_make_zip_file';
  zip_path: string;
  zip_base64: string;
}

export interface LocalImageDeskewRequest extends BaseRequest {
  func: 'local_image_deskew';
  image_path: string;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageDeskewResponse extends BaseResponseOk {
  func: 'local_image_deskew';
  image_path: string;
  image_base64: string;
}

export type WatermarkTextPos =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'left_top'
  | 'right_top'
  | 'left_bottom'
  | 'right_bottom'
  | 'center'
  | 'location';

export interface LocalImageAddWatermarkRequest extends BaseRequest {
  func: 'local_image_add_watermark';
  image_path: string;
  text: string;
  text_color: string;
  text_opacity: number;
  text_pos: WatermarkTextPos;
  margin_left: number;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  location_x: number;
  location_y: number;
  font_name: string;
  font_size: number;
  font_bold: boolean;
  font_underline: boolean;
  font_italic: boolean;
  font_strikeout: boolean;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageDecontaminationRequest extends BaseRequest {
  func: 'local_image_decontamination';
  image_path: string;
  mode: 'inside' | 'outside';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageDirectionCorrectRequest extends BaseRequest {
  func: 'local_image_direction_correct';
  image_path: string;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageClipRequest extends BaseRequest {
  func: 'local_image_clip';
  image_path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageFadeBkcolorRequest extends BaseRequest {
  func: 'local_image_fade_bkcolor';
  image_path: string;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageAdjustColorsRequest extends BaseRequest {
  func: 'local_image_adjust_colors';
  image_path: string;
  brightness: number;
  contrast: number;
  gamma: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface LocalImageBinarizationRequest extends BaseRequest {
  func: 'local_image_binarization';
  image_path: string;
  local_save: boolean;
  get_base64: boolean;
}

/** Shared response for single-output local image ops */
export interface LocalImageResultResponse extends BaseResponseOk {
  func:
    | 'local_image_deskew'
    | 'local_image_add_watermark'
    | 'local_image_decontamination'
    | 'local_image_direction_correct'
    | 'local_image_clip'
    | 'local_image_fade_bkcolor'
    | 'local_image_adjust_colors'
    | 'local_image_binarization';
  image_path: string;
  image_base64: string;
}

// ============================================================
// Device types
// ============================================================

export interface DeviceParamItem {
  name: string;
  value: string | number | boolean;
}

export interface SetDeviceParamRequest extends BaseRequest {
  func: 'set_device_param';
  device_param: DeviceParamItem[];
}

export interface DeviceParamInfo {
  group_name: string;
  group_param: DeviceParamDetail[];
}

export interface DeviceParamDetail {
  name: string;
  value_type: 'string' | 'int' | 'float' | 'bool';
  value: string | number | boolean;
  range_type?: 'list' | 'min_max';
  value_list?: (string | number)[];
  value_min?: number;
  value_max?: number;
}

export interface GetDeviceParamResponse extends BaseResponseOk {
  func: 'get_device_param';
  device_param: DeviceParamInfo[];
}

export interface GetDeviceNameListResponse extends BaseResponseOk {
  func: 'get_device_name_list';
  device_name_list: string[];
}

export interface OpenDeviceRequest extends BaseRequest {
  func: 'open_device';
  device_name?: string;
}

export interface GetDeviceSnResponse extends BaseResponseOk {
  func: 'get_device_sn';
  sn: string;
}

export interface GetDeviceFwVersionResponse extends BaseResponseOk {
  func: 'get_device_fwversion';
  fwversion: string;
}

export interface GetCurrDeviceNameResponse extends BaseResponseOk {
  func: 'get_curr_device_name';
  device_name: string;
}

export interface StartScanRequest extends BaseRequest {
  func: 'start_scan';
  blank_check: boolean;
  local_save: boolean;
  get_base64: boolean;
  save_path_name?: string;
}

// ============================================================
// Device event types
// ============================================================

export interface DeviceArriveEvent extends BaseMessage {
  func: 'device_arrive';
  device_name: string;
}

export interface DeviceRemoveEvent extends BaseMessage {
  func: 'device_remove';
  device_name: string;
}

export interface ScanBeginEvent extends BaseMessage {
  func: 'scan_begin';
}

export interface ScanEndEvent extends BaseMessage {
  func: 'scan_end';
}

export interface ScanInfoEvent extends BaseMessage {
  func: 'scan_info';
  is_error: boolean;
  info: string;
}

export interface ScanImageEvent extends BaseMessage {
  func: 'scan_image';
  is_blank: boolean;
  image_path: string;
  image_base64: string;
}

// ============================================================
// Batch / image business types
// ============================================================

export interface GetBatchIdListResponse extends BaseResponseOk {
  func: 'get_batch_id_list';
  batch_id_list: string[];
}

export interface OpenBatchRequest extends BaseRequest {
  func: 'open_batch';
  batch_id: string;
}

export interface DeleteBatchRequest extends BaseRequest {
  func: 'delete_batch';
  batch_id: string;
}

export interface NewBatchRequest extends BaseRequest {
  func: 'new_batch';
  batch_id?: string;
}

export interface NewBatchResponse extends BaseResponseOk {
  func: 'new_batch';
  batch_id: string;
}

export interface GetCurrBatchIdResponse extends BaseResponseOk {
  func: 'get_curr_batch_id';
  batch_id: string;
}

export interface ModifyBatchIdRequest extends BaseRequest {
  func: 'modify_batch_id';
  batch_id: string;
  new_batch_id: string;
}

export interface BindFolderRequest extends BaseRequest {
  func: 'bind_folder';
  folder: string;
  name_mode: string;
  name_width: number;
  name_base: number;
}

export interface ImageThumbnail {
  image_tag: string;
  image_base64: string;
}

export interface GetImageThumbnailListResponse extends BaseResponseOk {
  func: 'get_image_thumbnail_list';
  image_thumbnail_list: ImageThumbnail[];
}

export interface GetImageCountResponse extends BaseResponseOk {
  func: 'get_image_count';
  image_count: number;
}

export interface LoadImageRequest extends BaseRequest {
  func: 'load_image';
  image_index: number;
}

export interface LoadImageResponse extends BaseResponseOk {
  func: 'load_image';
  image_tag: string;
  image_base64: string;
}

export interface SaveImageRequest extends BaseRequest {
  func: 'save_image';
  image_index: number;
}

export interface SaveImageResponse extends BaseResponseOk {
  func: 'save_image';
  image_path: string;
}

export interface InsertLocalImageRequest extends BaseRequest {
  func: 'insert_local_image';
  image_path: string;
  insert_pos: number;
  image_tag?: string;
}

export interface InsertImageRequest extends BaseRequest {
  func: 'insert_image';
  image_base64: string;
  insert_pos: number;
  image_tag?: string;
}

export interface ModifyImageTagRequest extends BaseRequest {
  func: 'modify_image_tag';
  image_index_list: number[];
  image_tag_list: string[];
}

export interface DeleteImageRequest extends BaseRequest {
  func: 'delete_image';
  image_index_list: number[];
}

export interface ModifyImageRequest extends BaseRequest {
  func: 'modify_image';
  image_index: number;
  image_base64: string;
}

export interface ModifyImageByLocalRequest extends BaseRequest {
  func: 'modify_image_by_local';
  image_index: number;
  image_path: string;
}

export interface MoveImageRequest extends BaseRequest {
  func: 'move_image';
  image_index_list: number[];
  mode: 'pos' | 'index';
  target: number;
}

export interface ExchangeImageRequest extends BaseRequest {
  func: 'exchange_image';
  image_index_1: number;
  image_index_2: number;
}

export interface UploadImageRequest extends BaseRequest {
  func: 'upload_image';
  image_index: number;
  remote_file_path: string;
  upload_mode: 'http' | 'ftp';
  http_host?: string;
  http_port?: number;
  http_path?: string;
  ftp_user?: string;
  ftp_password?: string;
  ftp_host?: string;
  ftp_port?: number;
}

export interface MergeImageRequest extends BaseRequest {
  func: 'merge_image';
  image_index_list: number[];
  mode: 'horz' | 'vert';
  align: 'top' | 'bottom' | 'center' | 'left' | 'right';
  interval: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface MakeMultiImageRequest extends BaseRequest {
  func: 'make_multi_image';
  image_index_list: number[];
  format: 'tif' | 'pdf' | 'ofd';
  tiff_compression: TiffCompression;
  tiff_jpeg_quality: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface SplitImageRequest extends BaseRequest {
  func: 'split_image';
  image_index: number;
  mode: 'horz' | 'vert';
  location: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface SplitImageResponse extends BaseResponseOk {
  func: 'split_image';
  image_path_list: string[];
  image_base64_list: string;
}

export interface MakeZipFileRequest extends BaseRequest {
  func: 'make_zip_file';
  image_index_list: number[];
  local_save: boolean;
  get_base64: boolean;
}

export interface MakeZipFileResponse extends BaseResponseOk {
  func: 'make_zip_file';
  zip_path: string;
  zip_base64: string;
}

export interface ImageDeskewRequest extends BaseRequest {
  func: 'image_deskew';
  image_index: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageDeskewResponse extends BaseResponseOk {
  func: 'image_deskew';
  image_path: string;
  image_base64: string;
}

export interface ImageAddWatermarkRequest extends BaseRequest {
  func: 'image_add_watermark';
  image_index: number;
  text: string;
  text_color: string;
  text_opacity: number;
  text_pos: WatermarkTextPos;
  margin_left: number;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  location_x: number;
  location_y: number;
  font_name: string;
  font_size: number;
  font_bold: boolean;
  font_underline: boolean;
  font_italic: boolean;
  font_strikeout: boolean;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageDecontaminationRequest extends BaseRequest {
  func: 'image_decontamination';
  image_index: number;
  mode: 'inside' | 'outside';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageDirectionCorrectRequest extends BaseRequest {
  func: 'image_direction_correct';
  image_index: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageClipRequest extends BaseRequest {
  func: 'image_clip';
  image_index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageFadeBkcolorRequest extends BaseRequest {
  func: 'image_fade_bkcolor';
  image_index: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageAdjustColorsRequest extends BaseRequest {
  func: 'image_adjust_colors';
  image_index: number;
  brightness: number;
  contrast: number;
  gamma: number;
  local_save: boolean;
  get_base64: boolean;
}

export interface ImageBinarizationRequest extends BaseRequest {
  func: 'image_binarization';
  image_index: number;
  local_save: boolean;
  get_base64: boolean;
}

/** Shared single-output response for image business ops */
export interface ImageResultResponse extends BaseResponseOk {
  func:
    | 'merge_image'
    | 'make_multi_image'
    | 'image_deskew'
    | 'image_add_watermark'
    | 'image_decontamination'
    | 'image_direction_correct'
    | 'image_clip'
    | 'image_fade_bkcolor'
    | 'image_adjust_colors'
    | 'image_binarization';
  image_path: string;
  image_base64: string;
}

// ============================================================
// All request / response unions
// ============================================================

export type Request =
  | SetGlobalConfigRequest
  | { func: 'get_global_config'; iden: string }
  | { func: 'clear_global_file_save_path'; iden: string }
  | LoadLocalImageRequest
  | SaveLocalImageRequest
  | DeleteLocalFileRequest
  | UploadLocalFileRequest
  | MergeLocalImageRequest
  | LocalMakeMultiImageRequest
  | SplitLocalImageRequest
  | LocalMakeZipFileRequest
  | LocalImageDeskewRequest
  | LocalImageAddWatermarkRequest
  | LocalImageDecontaminationRequest
  | LocalImageDirectionCorrectRequest
  | LocalImageClipRequest
  | LocalImageFadeBkcolorRequest
  | LocalImageAdjustColorsRequest
  | LocalImageBinarizationRequest
  | { func: 'init_device'; iden: string }
  | { func: 'deinit_device'; iden: string }
  | { func: 'is_device_init'; iden: string }
  | { func: 'get_device_name_list'; iden: string }
  | OpenDeviceRequest
  | { func: 'close_device'; iden: string }
  | { func: 'get_device_sn'; iden: string }
  | { func: 'get_device_fwversion'; iden: string }
  | SetDeviceParamRequest
  | { func: 'get_device_param'; iden: string }
  | { func: 'reset_device_param'; iden: string }
  | { func: 'get_curr_device_name'; iden: string }
  | StartScanRequest
  | { func: 'stop_scan'; iden: string }
  | { func: 'is_device_scanning'; iden: string }
  | { func: 'get_batch_id_list'; iden: string }
  | OpenBatchRequest
  | DeleteBatchRequest
  | NewBatchRequest
  | { func: 'get_curr_batch_id'; iden: string }
  | ModifyBatchIdRequest
  | BindFolderRequest
  | { func: 'stop_bind_folder'; iden: string }
  | { func: 'get_image_thumbnail_list'; iden: string }
  | { func: 'get_image_count'; iden: string }
  | LoadImageRequest
  | SaveImageRequest
  | InsertLocalImageRequest
  | InsertImageRequest
  | ModifyImageTagRequest
  | DeleteImageRequest
  | { func: 'clear_image_list'; iden: string }
  | ModifyImageRequest
  | ModifyImageByLocalRequest
  | MoveImageRequest
  | ExchangeImageRequest
  | { func: 'image_book_sort'; iden: string }
  | UploadImageRequest
  | MergeImageRequest
  | MakeMultiImageRequest
  | SplitImageRequest
  | MakeZipFileRequest
  | ImageDeskewRequest
  | ImageAddWatermarkRequest
  | ImageDecontaminationRequest
  | ImageDirectionCorrectRequest
  | ImageClipRequest
  | ImageFadeBkcolorRequest
  | ImageAdjustColorsRequest
  | ImageBinarizationRequest;

export type Response =
  | GetGlobalConfigResponse
  | LoadLocalImageResponse
  | SaveLocalImageResponse
  | MergeLocalImageResponse
  | LocalMakeMultiImageResponse
  | SplitLocalImageResponse
  | LocalMakeZipFileResponse
  | LocalImageDeskewResponse
  | LocalImageResultResponse
  | GetDeviceParamResponse
  | GetDeviceNameListResponse
  | GetDeviceSnResponse
  | GetDeviceFwVersionResponse
  | GetCurrDeviceNameResponse
  | GetBatchIdListResponse
  | NewBatchResponse
  | GetCurrBatchIdResponse
  | GetImageThumbnailListResponse
  | GetImageCountResponse
  | LoadImageResponse
  | SaveImageResponse
  | SplitImageResponse
  | MakeZipFileResponse
  | ImageDeskewResponse
  | ImageResultResponse
  | BaseResponseOk;

export type Event =
  | DeviceArriveEvent
  | DeviceRemoveEvent
  | ScanBeginEvent
  | ScanEndEvent
  | ScanInfoEvent
  | ScanImageEvent;

export type ReceivedMessage = Response | Event;

// Function name union
export type FuncName = Request['func'];

// Map func name → response type
export interface FuncResponseMap {
  set_global_config: BaseResponseOk;
  get_global_config: GetGlobalConfigResponse;
  clear_global_file_save_path: BaseResponseOk;
  load_local_image: LoadLocalImageResponse;
  save_local_image: SaveLocalImageResponse;
  delete_local_file: BaseResponseOk;
  upload_local_file: BaseResponseOk;
  merge_local_image: MergeLocalImageResponse;
  local_make_multi_image: LocalMakeMultiImageResponse;
  split_local_image: SplitLocalImageResponse;
  local_make_zip_file: LocalMakeZipFileResponse;
  local_image_deskew: LocalImageDeskewResponse;
  local_image_add_watermark: LocalImageResultResponse;
  local_image_decontamination: LocalImageResultResponse;
  local_image_direction_correct: LocalImageResultResponse;
  local_image_clip: LocalImageResultResponse;
  local_image_fade_bkcolor: LocalImageResultResponse;
  local_image_adjust_colors: LocalImageResultResponse;
  local_image_binarization: LocalImageResultResponse;
  init_device: BaseResponseOk;
  deinit_device: BaseResponseOk;
  is_device_init: BaseResponseOk;
  get_device_name_list: GetDeviceNameListResponse;
  open_device: BaseResponseOk;
  close_device: BaseResponseOk;
  get_device_sn: GetDeviceSnResponse;
  get_device_fwversion: GetDeviceFwVersionResponse;
  set_device_param: BaseResponseOk;
  get_device_param: GetDeviceParamResponse;
  reset_device_param: BaseResponseOk;
  get_curr_device_name: GetCurrDeviceNameResponse;
  start_scan: BaseResponseOk;
  stop_scan: BaseResponseOk;
  is_device_scanning: BaseResponseOk;
  get_batch_id_list: GetBatchIdListResponse;
  open_batch: BaseResponseOk;
  delete_batch: BaseResponseOk;
  new_batch: NewBatchResponse;
  get_curr_batch_id: GetCurrBatchIdResponse;
  modify_batch_id: BaseResponseOk;
  bind_folder: BaseResponseOk;
  stop_bind_folder: BaseResponseOk;
  get_image_thumbnail_list: GetImageThumbnailListResponse;
  get_image_count: GetImageCountResponse;
  load_image: LoadImageResponse;
  save_image: SaveImageResponse;
  insert_local_image: BaseResponseOk;
  insert_image: BaseResponseOk;
  modify_image_tag: BaseResponseOk;
  delete_image: BaseResponseOk;
  clear_image_list: BaseResponseOk;
  modify_image: BaseResponseOk;
  modify_image_by_local: BaseResponseOk;
  move_image: BaseResponseOk;
  exchange_image: BaseResponseOk;
  image_book_sort: BaseResponseOk;
  upload_image: BaseResponseOk;
  merge_image: ImageResultResponse;
  make_multi_image: ImageResultResponse;
  split_image: SplitImageResponse;
  make_zip_file: MakeZipFileResponse;
  image_deskew: ImageDeskewResponse;
  image_add_watermark: ImageResultResponse;
  image_decontamination: ImageResultResponse;
  image_direction_correct: ImageResultResponse;
  image_clip: ImageResultResponse;
  image_fade_bkcolor: ImageResultResponse;
  image_adjust_colors: ImageResultResponse;
  image_binarization: ImageResultResponse;
}
