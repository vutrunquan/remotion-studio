import {loadFont} from '@remotion/google-fonts/Montserrat';

// Montserrat (Latin + Latin mở rộng + tiếng Việt). Cần internet lần đầu khi render để tải font từ Google Fonts.
loadFont('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin', 'latin-ext', 'vietnamese']});
