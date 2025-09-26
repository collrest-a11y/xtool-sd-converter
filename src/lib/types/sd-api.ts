// Base types for Stable Diffusion WebUI API

export interface SDError {
  error: string
  detail?: string
}

export interface SDResponse<T = any> {
  images?: string[]
  parameters?: T
  info?: string
}

// Text-to-Image request parameters
export interface Txt2ImgRequest {
  prompt: string
  negative_prompt?: string
  styles?: string[]
  seed?: number
  subseed?: number
  subseed_strength?: number
  seed_resize_from_h?: number
  seed_resize_from_w?: number
  sampler_name?: string
  batch_size?: number
  n_iter?: number
  steps?: number
  cfg_scale?: number
  width?: number
  height?: number
  restore_faces?: boolean
  tiling?: boolean
  do_not_save_samples?: boolean
  do_not_save_grid?: boolean
  eta?: number
  denoising_strength?: number
  s_min_uncond?: number
  s_churn?: number
  s_tmax?: number
  s_tmin?: number
  s_noise?: number
  override_settings?: Record<string, any>
  override_settings_restore_afterwards?: boolean
  script_args?: any[]
  sampler_index?: string
  script_name?: string
  send_images?: boolean
  save_images?: boolean
}

// Image-to-Image request parameters
export interface Img2ImgRequest extends Omit<Txt2ImgRequest, 'width' | 'height'> {
  init_images: string[]
  resize_mode?: number
  denoising_strength: number
  mask?: string
  mask_blur?: number
  inpainting_fill?: number
  inpaint_full_res?: boolean
  inpaint_full_res_padding?: number
  inpainting_mask_invert?: number
  initial_noise_multiplier?: number
  include_init_images?: boolean
}

// Response types
export interface Txt2ImgResponse extends SDResponse {
  images: string[]
  parameters: Txt2ImgRequest
  info: string
}

export interface Img2ImgResponse extends SDResponse {
  images: string[]
  parameters: Img2ImgRequest
  info: string
}

// Progress and status
export interface ProgressResponse {
  progress: number
  eta_relative: number
  state: {
    skipped: boolean
    interrupted: boolean
    job: string
    job_count: number
    job_timestamp: string
    job_no: number
  }
  current_image?: string
  textinfo?: string
}

// Model and sampler information
export interface SDModel {
  title: string
  model_name: string
  hash: string
  sha256?: string
  filename: string
  config?: string
}

export interface Sampler {
  name: string
  aliases: string[]
  options: Record<string, any>
}

// WebUI options and settings
export interface WebUIOptions {
  samples_save?: boolean
  samples_format?: string
  samples_filename_pattern?: string
  save_images_add_number?: boolean
  grid_save?: boolean
  grid_format?: string
  grid_extended_filename?: boolean
  grid_only_if_multiple?: boolean
  grid_prevent_empty_spots?: boolean
  n_rows?: number
  [key: string]: any
}

// API info endpoints
export interface APIInfo {
  version: string
  build_hash?: string
  api_version: string
  timestamp?: string
}

// Memory and system info
export interface MemoryInfo {
  ram: {
    free: number
    used: number
    total: number
  }
  cuda?: {
    system: {
      free: number
      used: number
      total: number
    }
    active: {
      free: number
      used: number
      total: number
    }
  }
}

// ControlNet types (if extension is available)
export interface ControlNetArgs {
  input_image?: string
  mask?: string
  module?: string
  model?: string
  weight?: number
  resize_mode?: number
  lowvram?: boolean
  processor_res?: number
  threshold_a?: number
  threshold_b?: number
  guidance_start?: number
  guidance_end?: number
  pixel_perfect?: boolean
  control_mode?: number
}

// Client configuration
export interface SDClientConfig {
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  enableLogging?: boolean
}

// Connection health check
export interface HealthCheckResult {
  isHealthy: boolean
  latency: number
  version?: string
  error?: string
  timestamp: number
}