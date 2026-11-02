// Kiểu dữ liệu của kịch bản (script.json). Mọi số liệu có thể là "keyframe": [[giây, giá trị], ...]
export type KF<T = number> = T | Array<[number, T]>;

export type Meta = {
  title?: string;
  channel?: string; // chữ bên phải "FILE 041 // CHANNEL"
  fileNo?: string | number; // "041"
  fileLabel?: string; // mặc định "FILE"
  fps?: number; // 30
  aspect?: '16:9' | '9:16' | '1:1';
  res?: 720 | 1080 | 1440; // 1080 => 1920x1080 (16:9)
  accent?: string; // đỏ nhấn, mặc định #e51939
  hud?: boolean; // mặc định true
  timecode?: boolean; // mặc định true
  ruleTotal?: number; // số luật, dùng cho thanh tiến độ
  autoGlitch?: boolean; // glitch ngẫu nhiên định kỳ (mặc định true)
  glitchEvery?: number; // giây, mặc định 8
  grain?: number; // 0..1 độ hạt phim (mặc định 1)
  dust?: number; // 0..1 bụi (mặc định 1)
  vignette?: number; // 0..1 (mặc định 1)
  glow?: number; // 0..1 độ bloom (mặc định 1)
  drift?: number; // 0..1 máy quay trôi chậm (mặc định 1)
  wpm?: number; // tốc độ đọc khi tự tính thời lượng (từ/phút), mặc định 150
  gap?: number; // khoảng nghỉ thêm giữa các cảnh (giây), mặc định 0
  introHold?: number; // giây đen trước cảnh 1, mặc định 0
  outroHold?: number; // giây đen sau cảnh cuối, mặc định 1
  music?: {src?: string; volume?: number} | false; // mặc định drone nội bộ
  autoSfx?: boolean; // mặc định true
  sfxVolume?: number; // 0..1
  voiceVolume?: number; // 0..1
};

export type Fx = {
  t: number; // giây trong cảnh
  type: 'glitch' | 'flash' | 'shake' | 'flicker' | 'zoom' | 'blackout';
  d?: number; // thời lượng giây
  s?: number; // cường độ 0..1
};

export type Sfx = {t?: number; name: string; vol?: number};

export type Visual = {tpl: string; [k: string]: any};

export type Scene = {
  id?: string;
  text?: string; // phụ đề (chữ kể chuyện). *từ* sẽ tô đỏ
  dur?: number; // giây (bỏ trống = tự tính hoặc theo voice)
  min?: number; // giây tối thiểu
  voice?: string; // public/voice/s01.mp3
  voiceDur?: number; // do tools/sync_voice.mjs ghi
  voiceDelay?: number; // giây trễ trước khi đọc (mặc định 0.15)
  visual?: Visual;
  fx?: Fx[];
  sfx?: Sfx[];
  transition?: 'cut' | 'glitch' | 'dip' | 'flash';
  caption?: boolean;
  captionAt?: number; // giây bắt đầu hiện phụ đề (mặc định 0.1)
  rule?: number; // ép thanh tiến độ HUD sáng ô này
  noGlitch?: boolean; // tắt glitch tự động ở cảnh này
  note?: string; // ghi chú đạo diễn (không hiển thị)
};

export type Script = {
  meta: Meta;
  scenes: Scene[];
  sheet?: {page: number; cols?: number; rows?: number};
};
