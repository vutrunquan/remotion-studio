const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const PORT = 4567;
const ROOT_DIR = path.resolve(__dirname, '..');
const PRESETS_DIR = path.join(__dirname, 'presets');
const CURRENT_CREEPY_PATH = path.join(__dirname, 'current_creepy.json');
const CURRENT_STORY_PATH = path.join(__dirname, 'current_story.json');
const SRC_CREEPY_SAMPLE = path.join(ROOT_DIR, 'src', 'creepy_rules', 'sample.json');
const SRC_STORY_SAMPLE = path.join(ROOT_DIR, 'src', 'story_studio', 'story.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const TOOL_PUBLIC_DIR = path.join(__dirname, 'public');
const COMPOSITOR_LIB_PATH = path.join(ROOT_DIR, 'node_modules', '@remotion', 'compositor-darwin-x64');

// Ensure directories exist
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(path.join(PUBLIC_DIR, 'audio'))) fs.mkdirSync(path.join(PUBLIC_DIR, 'audio'), { recursive: true });

// Active render process tracking
let activeRenderProcess = null;
let renderState = {
  status: 'idle',
  mode: 'creepy_rules',
  progress: 0,
  currentFrame: 0,
  totalFrames: 0,
  fps: 0,
  eta: '',
  outputFile: '',
  outFileName: '',
  log: '',
};

// Server-Sent Events subscribers
const sseClients = new Set();
function broadcastRenderState() {
  const data = `data: ${JSON.stringify(renderState)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(data);
    } catch {
      sseClients.delete(res);
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aiff': 'audio/aiff',
  '.mp4': 'video/mp4',
};

function serveStatic(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// -------------------------------------------------------------
// Auto-Director for Mode 1: Creepy Rules (based on draft.mjs)
// -------------------------------------------------------------
const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  một: 1, hai: 2, ba: 3, bốn: 4, năm: 5, sáu: 6, bảy: 7, tám: 8, chín: 9, mười: 10
};
const toN = (w) => (/^\d+$/.test(w) ? parseInt(w, 10) : NUM_WORDS[w.toLowerCase()]);

function parseCreepyRulesText(rawText) {
  const meta = {
    channel: 'CHANNEL // ARCHIVE',
    fileNo: '089',
    fps: 30,
    aspect: '16:9',
    res: 1080,
    accent: '#e51939',
    autoGlitch: true,
    glitchEvery: 8,
    outroHold: 0.6,
    ruleTotal: 6,
  };

  const scenes = [];
  let seq = 0;
  let ruleTotal = 0;

  function guessVisual(text, tag) {
    const t = text.trim();
    const tLower = t.toLowerCase();

    // 1. Explicit tags override
    if (tag) {
      const [name, ...rest] = tag.split('|').map((x) => x.trim());
      const [kind, arg] = name.split(/\s+/);
      if (kind === 'exhibit') {
        const img = rest.find((r) => r.startsWith('img='));
        return {
          tpl: 'exhibit',
          label: `EXHIBIT ${arg ?? 'A'}`,
          meta: rest.filter((r) => !r.startsWith('img=')),
          image: img ? img.slice(4) : undefined,
        };
      }
      if (kind === 'elevator') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'elevator', x: 609, y: 440, scale: 1.45, floor: arg || 'B4', open: 0.18, buttonDown: true, creature: true },
            { kind: 'cctv', x: 260, y: 150, scale: 1.2 },
          ],
        };
      }
      if (kind === 'mirror') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'mirror', x: 609, y: 440, scale: 1.5, shadow: true },
            { kind: 'cross', x: 609, y: 300, w: 260, h: 260, stroke: 14, t0: 0.3 },
          ],
        };
      }
      if (kind === 'phone') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'phone', x: 609, y: 360, scale: 1.6, ring: true, waves: true, label: arg || 'UNKNOWN', buttons: true },
          ],
        };
      }
      if (kind === 'creature') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'creature', x: 609, y: 440, scale: 1.4 },
            { kind: 'eye', x: 609, y: 220, scale: 1.4 },
          ],
        };
      }
      if (kind === 'scream') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'person', pose: 'scream', x: 609, y: 440, scale: 1.6 },
            { kind: 'cross', x: 609, y: 296, w: 290, h: 300, stroke: 14, t0: 0.25 },
          ],
        };
      }
      if (kind === 'run') {
        return {
          tpl: 'stage',
          items: [
            { kind: 'door', x: 800, y: 440, scale: 1.3 },
            { kind: 'person', pose: 'run', x: 520, y: 440, scale: 1.5 },
            { kind: 'speed', x: 400, y: 330, scale: 1.2 },
          ],
        };
      }
      if (kind === 'counter') {
        return { tpl: 'counter', n: parseInt(arg || '6', 10), crossed: [2], classified: [parseInt(arg || '6', 10)] };
      }
      if (kind === 'black') return { tpl: 'black' };
    }

    // 2. Rule Title Match ("QUY TẮC 1", "RULE 01", "ĐIỀU 1")
    let m;
    if ((m = /^(?:RULE|QUY TẮC|ĐIỀU)\s+(\w+)\b[.:\-–]?\s*(.*)$/i.exec(t)) && toN(m[1])) {
      const num = toN(m[1]);
      const title = m[2].replace(/[.!]+$/, '');
      return { tpl: 'rule', n: num, title: title || `ĐIỀU SỐ ${num}` };
    }

    // 3. Counter Match ("CÓ 6 QUY TẮC", "THERE ARE 6 RULES")
    if ((m = /(?:THERE ARE|CÓ)\s+(\w+)\s+(?:RULES|QUY TẮC|ĐIỀU)/i.exec(t)) && toN(m[1])) {
      ruleTotal = toN(m[1]);
      return {
        tpl: 'counter',
        n: ruleTotal,
        crossed: [2],
        classified: [ruleTotal],
      };
    }

    // 4. Elevator / Basement / Tầng Hầm / Thang Máy
    if (/(?:thang máy|elevator|tầng hầm|tầng b|b4|b3|b1|nút bấm)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'elevator', x: 609, y: 440, scale: 1.45, floor: 'B4', open: 0.22, buttonDown: true, creature: true },
          { kind: 'cctv', x: 260, y: 150, scale: 1.2 },
        ],
      };
    }

    // 5. Mirror / Reflection / Gương Soi
    if (/(?:gương|mirror|phản chiếu|nhìn lại|quay đầu|sau lưng)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'mirror', x: 609, y: 440, scale: 1.5, shadow: true },
          { kind: 'eye', x: 380, y: 260, scale: 1.3 },
          { kind: 'cross', x: 609, y: 300, w: 260, h: 260, stroke: 14, t0: 0.4 },
        ],
      };
    }

    // 6. Phone / Incoming Call / Chuông Reo / Điện Thoại
    if (/(?:điện thoại|phone|cuộc gọi|chuông reo|bắt máy|gọi tên)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'phone', x: 609, y: 360, scale: 1.6, ring: true, waves: true, label: 'KHÔNG NGHE', buttons: true },
          { kind: 'nightstand', x: 609, y: 470, scale: 1.3 },
        ],
      };
    }

    // 7. Creature / Uncanny Figure / Sinh Vật / Bóng Đen / Hai Chân
    if (/(?:quái vật|creature|bóng đen|sinh vật|hai chân|two legs|thực thể|quỷ)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'creature', x: 609, y: 440, scale: 1.45 },
          { kind: 'eye', x: 609, y: 200, scale: 1.5, pupil: true },
        ],
      };
    }

    // 8. Evidence / Polaroid Exhibit / Camera An Ninh / Sự Cố / Năm 19xx
    if (/(?:exhibit|vật chứng|bằng chứng|sự cố|hồ sơ|camera an ninh|năm 19|mất tích)/i.test(tLower)) {
      return {
        tpl: 'exhibit',
        label: 'HỒ SƠ AN NINH',
        meta: [
          'VỤ VIỆC: MẤT TÍCH B4',
          'THỜI GIAN: 03:14 AM',
          'TRẠNG THÁI: CHƯA TÌM THẤY',
        ],
      };
    }

    // 9. Caution / Restricted / Cấm / Nguy Hiểm
    if (/(?:cấm|nguy hiểm|phong tỏa|đừng bước|không được vào)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'tape', x: 609, y: 340, scale: 1.3, rot: -7 },
          { kind: 'person', pose: 'stand', x: 609, y: 440, scale: 1.4 },
          { kind: 'cross', x: 609, y: 320, w: 260, h: 260, stroke: 14, t0: 0.3 },
        ],
      };
    }

    // 10. Bed / Nightstand / Đêm Khuya / Phòng Ngủ
    if (/(?:giường|bed|phòng ngủ|nằm|ngủ|03:00|nửa đêm)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'bed', x: 609, y: 440, scale: 1.3 },
          { kind: 'lamp', x: 380, y: 440, scale: 1.1, flicker: true },
          { kind: 'clock', x: 820, y: 260, scale: 1.2, time: '03:00' },
        ],
      };
    }

    // 11. Run / Scream
    if (/(?:chạy|run|bỏ chạy)/i.test(tLower)) {
      return {
        tpl: 'stage',
        items: [
          { kind: 'door', x: 800, y: 440, scale: 1.3 },
          { kind: 'person', pose: 'run', x: 520, y: 440, scale: 1.5 },
          { kind: 'speed', x: 400, y: 330, scale: 1.2 },
        ],
      };
    }

    // Fallback: Suspenseful black stage with creepy eye
    return {
      tpl: 'stage',
      items: [
        { kind: 'eye', x: 609, y: 330, scale: 1.6, blink: true },
      ],
    };
  }

  for (const raw of rawText.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === '---') continue;
    let m;
    if ((m = /^#\s*(\w+)\s*:\s*(.+)$/.exec(line))) {
      const k = m[1].toLowerCase();
      if (k === 'channel') meta.channel = m[2];
      else if (k === 'file') meta.fileNo = m[2];
      else if (k === 'rules') meta.ruleTotal = parseInt(m[2], 10);
      else if (k === 'title') meta.title = m[2];
      else if (k === 'accent') meta.accent = m[2];
      else if (k === 'aspect') meta.aspect = m[2];
      continue;
    }
    if (line.startsWith('//')) continue;

    const [textPart, ...tagParts] = line.split(/\s+@/);
    const tag = tagParts.join(' @') || undefined;
    const visual = guessVisual(textPart, tag);
    seq++;

    const wordCount = textPart.trim().split(/\S+/).length;
    const duration = visual.tpl === 'rule' ? 2.5 : visual.tpl === 'counter' ? 3.0 : Math.max(2.0, +(wordCount / 2.8 + 0.6).toFixed(1));

    scenes.push({
      id: `s${String(seq).padStart(2, '0')}`,
      text: textPart.trim(),
      dur: duration,
      visual,
    });
  }

  if (ruleTotal) meta.ruleTotal = ruleTotal;
  return { meta, scenes };
}

// -------------------------------------------------------------
// Auto-Director for Mode 2: 2D Story Studio
// -------------------------------------------------------------
function parseStoryStudioText(rawText) {
  const meta = {
    title: 'Câu Chuyện 2D Minimalist',
    aspect: '16:9',
    resolution: '1080p',
    fps: 30,
    lang: 'vi',
    grain: 0.35,
    letterbox: 0.03,
  };

  const lines = rawText.split(/\r?\n/);
  const shots = [];
  let seq = 0;

  for (const raw of lines) {
    const l = raw.trim();
    if (!l || l.startsWith('#') || l === '---' || l.startsWith('//')) continue;

    const sLower = l.toLowerCase();
    const wordCount = l.split(/\s+/).length;
    const dur = Math.max(2.4, +(wordCount / 2.6 + 0.5).toFixed(1));

    // 1. Choose Environment / Set
    let set = 'living-room';
    if (/mưa|rain|đường|phố|street|walk|ngoài|đèn đường|dusk/i.test(sLower)) {
      set = /mưa|đêm|khuya|tối/i.test(sLower) ? 'street-night' : 'street-brick';
    } else if (/quán|cà phê|cafe|bàn|sofa|nhà|phòng/i.test(sLower)) {
      set = 'living-room';
    } else if (/gạch|bậc thềm|ghế đá/i.test(sLower)) {
      set = 'street-brick';
    }

    // 2. Camera Choreography (establishing -> medium -> close -> punchy xclose -> wide)
    let shot = 'wide';
    let roll = 0;
    if (seq === 0) shot = 'wide';
    else if (seq % 4 === 1) shot = 'medium';
    else if (seq % 4 === 2) { shot = 'close'; roll = 5; }
    else if (seq % 4 === 3) { shot = 'xclose'; roll = -6; }
    else shot = 'wide';

    // 3. Characters & Multi-character composition
    const hasMultipleChars = /chúng tôi|chúng ta|bạn tôi|hai người|cô ấy|cậu ấy|anh ấy|gặp nhau|ngồi cùng/i.test(sLower);

    // Primary character pose and emote
    let pose1 = 'stand';
    let emote1 = 'neutral';
    let prop1 = 'none';

    // Props detection
    if (/ô|dù|umbrella|mưa/i.test(sLower)) prop1 = 'umbrella';
    else if (/thư|bức thư|phong bì|letter/i.test(sLower)) prop1 = 'letter';
    else if (/hộp|chiếc hộp|box/i.test(sLower)) prop1 = 'box';
    else if (/cà phê|trà|tách|cup|uống/i.test(sLower)) prop1 = 'cup';
    else if (/điện thoại|phone|tin nhắn|gọi/i.test(sLower)) prop1 = 'phone';
    else if (/sách|nhật ký|book/i.test(sLower)) prop1 = 'book';

    // Pose and Emote
    if (/ngồi|sofa|ghế|sit/i.test(sLower)) pose1 = 'sit';
    else if (/đi|walk|bước|chạy/i.test(sLower)) pose1 = 'walk';
    else if (prop1 !== 'none') pose1 = 'hold';

    if (/sợ|lo|hoảng|giật mình|surprised/i.test(sLower)) emote1 = 'surprised';
    else if (/vui|cười|mỉm cười|happy/i.test(sLower)) emote1 = 'happy';
    else if (/mệt|mỏi|đói|buồn|tired/i.test(sLower)) emote1 = 'tired';

    seq++;

    const characters = [];
    if (set.includes('street')) {
      characters.push({
        id: 'char1',
        preset: 'suit',
        at: 'walkL',
        pose: pose1,
        emote: emote1,
        prop: prop1,
      });
      if (hasMultipleChars) {
        characters.push({
          id: 'char2',
          preset: 'pink',
          at: set === 'street-brick' ? 'bench1' : 'walkR',
          pose: set === 'street-brick' ? 'sit' : 'stand',
          emote: 'happy',
        });
      }
    } else {
      // living-room (cafe / room setup)
      characters.push({
        id: 'char1',
        preset: 'suit',
        at: 'sofaL',
        pose: pose1 === 'walk' ? 'stand' : 'sit',
        emote: emote1,
        prop: prop1,
      });
      if (hasMultipleChars) {
        characters.push({
          id: 'char2',
          preset: 'pink',
          at: 'sofaR',
          pose: 'sit',
          emote: emote1 === 'surprised' ? 'surprised' : 'happy',
          prop: prop1 === 'cup' ? 'cup' : 'none',
        });
      }
    }

    const shotObj = {
      id: `s${String(seq).padStart(2, '0')}`,
      durationSec: dur,
      set,
      camera: { shot, ...(roll && { roll }) },
      characters,
      narration: { text: l },
    };

    // Transition for cinematic flow
    if (seq === 2) shotObj.transition = 'dissolve';
    if (seq === 4) shotObj.transition = 'blinds';

    // Cinematic Overlays
    if (seq === 1) {
      shotObj.title = { lines: [l.slice(0, 32).toUpperCase()], at: 0.15 };
      shotObj.badge = { text: '09:00 P.M.', at: 0.5 };
    }

    // Number / year counter stamp detection
    let yearMatch;
    if ((yearMatch = /(?:năm\s+|year\s+)?(19\d\d|20\d\d)/i.exec(l))) {
      shotObj.counter = { value: parseInt(yearMatch[1], 10), from: parseInt(yearMatch[1], 10) - 10, countSec: 1.0, at: 0.4 };
      shotObj.fx = ['dust', 'sparkles'];
    }

    shots.push(shotObj);
  }

  return { meta, shots };
}

// -------------------------------------------------------------
// HTTP Server
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. Status API
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, renderState }));
    return;
  }

  // 2. Presets API
  if (pathname === '/api/presets' && req.method === 'GET') {
    const presets = [
      {
        id: 'creepy_dog_rules',
        mode: 'creepy_rules',
        name: 'Mẫu 1: If Your Dog Ever Stands On Two Legs (Bản chuẩn 100% video gốc)',
        desc: 'Hồ sơ cảnh báo Analog Horror, pictogram chó đứng 2 chân, đèn hazard đỏ, HUD radar và đếm quy tắc sinh tồn.',
        file: 'creepy_dog_rules.json',
      },
      {
        id: 'creepy_3h07',
        mode: 'creepy_rules',
        name: 'Mẫu 2: 3:07 A.M. House Rules (Quy tắc ngôi nhà nửa đêm)',
        desc: 'Danh sách quy tắc rùng rợn khi thức dậy lúc 3:07 sáng, các bằng chứng EXHIBIT và cảnh báo nguy hiểm.',
        file: 'creepy_3h07.json',
      },
      {
        id: 'creepy_standard',
        mode: 'creepy_rules',
        name: 'Mẫu 3: 7 Rules of Survival (Quy tắc tiêu chuẩn)',
        desc: 'Bản mẫu quy chuẩn với đầy đủ thẻ đếm Counter, Rule Card, Cross Warning và Glitch.',
        file: 'creepy_standard.json',
      },
      {
        id: 'story_midnight_walk',
        mode: 'story_studio',
        name: 'Mẫu 4: A Midnight Walk (Hoạt hình 2D tham chiếu chuẩn 100%)',
        desc: 'Kể chuyện nhân vật hoạt hình ball-head, đổi bối cảnh Street/Room, chuyển cảnh blinds/dissolve, góc máy pan/zoom/roll.',
        file: 'story_midnight_walk.json',
      },
      {
        id: 'creepy_elevator',
        mode: 'creepy_rules',
        name: 'Mẫu 5: Thang Máy Tầng Hầm B4 - Khách Sạn Cũ (Hình ảnh thang máy, CCTV, quái vật, gương)',
        desc: 'Kịch bản kinh dị hoàn toàn mới với vector thang máy đóng mở, bảng tầng B4, camera an ninh LIVE, bóng đen trong gương và hồ sơ án tích 1989.',
        file: 'creepy_elevator.json',
      },
      {
        id: 'story_rainy_cafe',
        mode: 'story_studio',
        name: 'Mẫu 6: Cuộc Hẹn Dưới Mưa Ở Quán Cũ (Hình ảnh cầm ô, tách cà phê, 2 nhân vật, phong bì thư)',
        desc: 'Kịch bản 2D hoàn toàn mới: nhân vật cầm ô đi dưới mưa đêm, bước vào quán cà phê ấm cúng, 2 bạn thân ngồi đối diện uống cà phê và trao lá thư kỷ niệm.',
        file: 'story_rainy_cafe.json',
      },
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, presets }));
    return;
  }

  // 3. Load Preset by ID
  if (pathname.startsWith('/api/presets/') && req.method === 'GET') {
    const presetId = pathname.replace('/api/presets/', '');
    const presetFilePath = path.join(PRESETS_DIR, `${presetId}.json`);
    if (fs.existsSync(presetFilePath)) {
      const data = JSON.parse(fs.readFileSync(presetFilePath, 'utf-8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Preset not found' }));
    }
    return;
  }

  // 4. GET Current Scenario
  if (pathname === '/api/current' && req.method === 'GET') {
    const mode = url.searchParams.get('mode') || 'creepy_rules';
    try {
      const targetPath = mode === 'creepy_rules' ? CURRENT_CREEPY_PATH : CURRENT_STORY_PATH;
      const fallbackPath = mode === 'creepy_rules'
        ? path.join(PRESETS_DIR, 'creepy_dog_rules.json')
        : path.join(PRESETS_DIR, 'story_midnight_walk.json');

      const fileToRead = fs.existsSync(targetPath) ? targetPath : fallbackPath;
      const data = JSON.parse(fs.readFileSync(fileToRead, 'utf-8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode, data }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 5. POST Save Scenario
  if (pathname === '/api/save' && req.method === 'POST') {
    try {
      const { mode = 'creepy_rules', data } = await parseJsonBody(req);
      const jsonStr = JSON.stringify(data, null, 2);

      if (mode === 'creepy_rules') {
        fs.writeFileSync(CURRENT_CREEPY_PATH, jsonStr, 'utf-8');
        fs.writeFileSync(SRC_CREEPY_SAMPLE, jsonStr, 'utf-8');
      } else {
        fs.writeFileSync(CURRENT_STORY_PATH, jsonStr, 'utf-8');
        fs.writeFileSync(SRC_STORY_SAMPLE, jsonStr, 'utf-8');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Saved successfully' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 6. POST Auto-Director (Text -> Structured Scenes)
  if (pathname === '/api/auto-director' && req.method === 'POST') {
    try {
      const { text, mode = 'creepy_rules' } = await parseJsonBody(req);
      if (!text || !text.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Text cannot be empty' }));
        return;
      }

      let result;
      if (mode === 'creepy_rules') {
        result = parseCreepyRulesText(text);
      } else {
        result = parseStoryStudioText(text);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode, result }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 7. POST Render Still Frame (Pixel-perfect Remotion Preview)
  if (pathname === '/api/render-still' && req.method === 'POST') {
    try {
      const { mode = 'creepy_rules', frame = 30, data } = await parseJsonBody(req);

      // Save props temporarily
      const tempPropsPath = path.join(OUT_DIR, `temp_${mode}_props.json`);
      if (data) {
        fs.writeFileSync(tempPropsPath, JSON.stringify(data, null, 2), 'utf-8');
      } else {
        const fallbackPath = mode === 'creepy_rules' ? CURRENT_CREEPY_PATH : CURRENT_STORY_PATH;
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, tempPropsPath);
        } else {
          fs.writeFileSync(tempPropsPath, '{}', 'utf-8');
        }
      }

      const compId = mode === 'creepy_rules' ? 'CreepyRules' : 'StoryStudio';
      const outStillName = `preview_still_${mode}.png`;
      const outStillPath = path.join(OUT_DIR, outStillName);

      const stillCmd = `DYLD_LIBRARY_PATH="${COMPOSITOR_LIB_PATH}" npx remotion still src/index.ts ${compId} "${outStillPath}" --props="${tempPropsPath}" --frame=${Math.max(0, parseInt(frame, 10))}`;

      exec(stillCmd, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
        if (err) {
          console.error('[Still Error]:', stderr || err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: stderr || err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            imageUrl: `/out/${outStillName}?t=${Date.now()}`,
          }));
        }
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 8. Render Progress SSE Stream
  if (pathname === '/api/render-progress') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    sseClients.add(res);
    broadcastRenderState();
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 9. POST Full Video Render (MP4)
  if (pathname === '/api/render' && req.method === 'POST') {
    if (renderState.status === 'rendering') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Render already in progress' }));
      return;
    }

    try {
      const { mode = 'creepy_rules', data, crf = 18 } = await parseJsonBody(req);
      const compId = mode === 'creepy_rules' ? 'CreepyRules' : 'StoryStudio';
      const outFileName = `${mode}_${Date.now()}.mp4`;
      const outFilePath = path.join(OUT_DIR, outFileName);

      // Save props file for rendering
      const renderPropsPath = path.join(OUT_DIR, `render_${mode}_props.json`);
      if (data) {
        fs.writeFileSync(renderPropsPath, JSON.stringify(data, null, 2), 'utf-8');
      } else {
        const fallbackPath = mode === 'creepy_rules' ? CURRENT_CREEPY_PATH : CURRENT_STORY_PATH;
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, renderPropsPath);
        } else {
          fs.writeFileSync(renderPropsPath, '{}', 'utf-8');
        }
      }

      renderState = {
        status: 'rendering',
        mode,
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        fps: 30,
        eta: 'Calculating...',
        outputFile: outFilePath,
        outFileName,
        log: `Starting Remotion render for [${compId}]...\n`,
      };
      broadcastRenderState();

      const remotionArgs = [
        'render',
        'src/index.ts',
        compId,
        outFilePath,
        `--props=${renderPropsPath}`,
        '--codec=h264',
        `--crf=${crf}`,
        '--overwrite',
        '--log=verbose',
      ];

      const env = { ...process.env, DYLD_LIBRARY_PATH: COMPOSITOR_LIB_PATH };
      activeRenderProcess = spawn('npx', ['remotion', ...remotionArgs], { cwd: ROOT_DIR, env });

      activeRenderProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        renderState.log += text;

        const frameMatch = text.match(/(?:Rendered|Rendering|Encoding)\s*(?:video|frame|frames)?\s*[\u2500-\u257f\s]*(\d+)\/(\d+)/i);
        if (frameMatch) {
          const current = parseInt(frameMatch[1], 10);
          const total = parseInt(frameMatch[2], 10);
          renderState.currentFrame = current;
          renderState.totalFrames = total;
          renderState.progress = Math.min(100, Math.round((current / total) * 100));
        }

        const pctMatch = text.match(/(\d+)%/);
        if (pctMatch && !frameMatch) {
          renderState.progress = parseInt(pctMatch[1], 10);
        }

        broadcastRenderState();
      });

      activeRenderProcess.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        renderState.log += text;
        broadcastRenderState();
      });

      activeRenderProcess.on('close', (code) => {
        activeRenderProcess = null;
        if (code === 0) {
          renderState.status = 'completed';
          renderState.progress = 100;
          renderState.log += '\n✓ Render completed successfully!';
        } else {
          renderState.status = 'error';
          renderState.log += `\n✗ Render process exited with code ${code}`;
        }
        broadcastRenderState();
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Render started', outputFile: outFilePath }));
    } catch (err) {
      renderState.status = 'error';
      renderState.log += err.message;
      broadcastRenderState();
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 10. POST TTS
  if (pathname === '/api/tts' && req.method === 'POST') {
    try {
      const { text, voice = 'Daniel' } = await parseJsonBody(req);
      if (!text || !text.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Text cannot be empty' }));
        return;
      }

      const safeText = text.replace(/"/g, '\\"');
      const filename = `tts_${Date.now()}.aiff`;
      const outAudioPath = path.join(PUBLIC_DIR, 'audio', filename);

      exec(`/usr/bin/say -v "${voice}" -o "${outAudioPath}" "${safeText}"`, (error) => {
        if (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: error.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, audioSrc: `audio/${filename}` }));
        }
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 11. Open Rendered Video
  if (pathname === '/api/open-file' && req.method === 'POST') {
    const targetFile = renderState.outputFile || path.join(OUT_DIR, 'sample_creepy_dog.mp4');
    exec(`open "${targetFile}"`, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Opened video in player' }));
      }
    });
    return;
  }

  // 12. Reveal in Finder
  if (pathname === '/api/reveal-folder' && req.method === 'POST') {
    const targetFile = renderState.outputFile || path.join(OUT_DIR, 'sample_creepy_dog.mp4');
    exec(`open -R "${targetFile}"`, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Revealed in Finder' }));
      }
    });
    return;
  }

  // Static files in public/
  if (pathname.startsWith('/public/')) {
    serveStatic(req, res, path.join(PUBLIC_DIR, pathname.replace('/public/', '')));
    return;
  }
  const directPublicFile = path.join(PUBLIC_DIR, pathname.slice(1));
  if (fs.existsSync(directPublicFile) && !fs.statSync(directPublicFile).isDirectory()) {
    serveStatic(req, res, directPublicFile);
    return;
  }

  // Static files in out/
  if (pathname.startsWith('/out/')) {
    serveStatic(req, res, path.join(OUT_DIR, pathname.replace('/out/', '')));
    return;
  }

  // Tool UI Static Assets
  const toolFilePath = path.join(TOOL_PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  serveStatic(req, res, toolFilePath);
});

server.listen(PORT, () => {
  console.log(`[Unified Remotion Desktop Studio] Running at http://localhost:${PORT}`);
});
