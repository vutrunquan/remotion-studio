export const COLORS = {
  bg: '#000',
  white: '#ffffff',
  soft: '#e9e9e9',
  gray: '#9b9b9b',
  dim: 'rgba(255,255,255,0.5)',
  red: '#e51939',
  yellow: '#f4cf4d',
  green: '#43d65b',
  blue: '#a9d4ff',
  ink: '#0b0b0b',
};

export const FONT = "'Montserrat','DejaVu Sans',Arial,sans-serif";

// Toạ độ "ref" lấy từ video mẫu: lưới 1218 x 666, tâm (609, 333). Mọi pictogram vẽ trong toạ độ này.
export const REF = {w: 1218, h: 666, cx: 609, cy: 333};

// Bloom (phát sáng trắng) quanh mọi nét trắng
export const glowFilter = (k = 1) =>
  k <= 0
    ? 'none'
    : `drop-shadow(0 0 ${2.5 * k}px rgba(255,255,255,0.75)) drop-shadow(0 0 ${14 * k}px rgba(255,255,255,0.28))`;
