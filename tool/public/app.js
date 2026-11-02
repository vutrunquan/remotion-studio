/**
 * Unified Remotion Desktop Studio Frontend Controller
 * Supports:
 * 1. Creepy Rules Mode (Analog Horror, Rules, Pictograms, Glitches)
 * 2. 2D Story Studio Mode (Ball-head Characters, Sets, Camera moves, Transitions)
 */

// Application State
let activeMode = 'creepy_rules'; // 'creepy_rules' | 'story_studio'
let currentData = null;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let stillOverlayActive = false;

// DOM Elements
const brandLogo = document.getElementById('brand-logo');
const activeModeLabel = document.getElementById('active-mode-label');
const modeBtnCreepy = document.getElementById('mode-btn-creepy');
const modeBtnStory = document.getElementById('mode-btn-story');

// Subtabs
const tabBtnStoryboard = document.getElementById('tab-btn-storyboard');
const tabBtnScript = document.getElementById('tab-btn-script');
const tabBtnJson = document.getElementById('tab-btn-json');
const viewStoryboard = document.getElementById('view-storyboard');
const viewScript = document.getElementById('view-script');
const viewJson = document.getElementById('view-json');
const rawScriptInput = document.getElementById('raw-script-input');
const rawJsonInput = document.getElementById('raw-json-input');

// Fields
const metaTitle = document.getElementById('meta-title');
const metaChannel = document.getElementById('meta-channel');
const metaFilecode = document.getElementById('meta-filecode');
const metaRules = document.getElementById('meta-rules');
const metaAccent = document.getElementById('meta-accent');
const metaLang = document.getElementById('meta-lang');
const metaMusic = document.getElementById('meta-music');
const metaAspect = document.getElementById('meta-aspect');
const metaFps = document.getElementById('meta-fps');
const totalDurationBadge = document.getElementById('total-duration-badge');
const scenesContainer = document.getElementById('scenes-container');

// Viewport & Preview
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const stillPreviewImg = document.getElementById('still-preview-img');
const stillBadge = document.getElementById('still-badge');
const btnCaptureStill = document.getElementById('btn-capture-still');

// Transport
const btnPlayPause = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-icon');
const btnStepBack = document.getElementById('btn-step-back');
const btnStepFwd = document.getElementById('btn-step-fwd');
const timelineScrubber = document.getElementById('timeline-scrubber');
const timecodeDisplay = document.getElementById('timecode-display');
const btnFullscreen = document.getElementById('btn-fullscreen');

// Actions
const btnSave = document.getElementById('btn-save-scenario');
const btnRender = document.getElementById('btn-render-video');
const btnAddScene = document.getElementById('btn-add-scene');
const btnAddSceneBottom = document.getElementById('btn-add-scene-bottom');

// Modals
const templateModal = document.getElementById('template-modal');
const btnOpenTemplates = document.getElementById('btn-open-templates');
const btnCloseModal = document.getElementById('btn-close-modal');
const templateListContainer = document.getElementById('template-list-container');

const autoDirectorModal = document.getElementById('auto-director-modal');
const btnOpenAutoDirector = document.getElementById('btn-open-auto-director');
const btnCloseAutoModal = document.getElementById('btn-close-auto-modal');
const btnCancelAuto = document.getElementById('btn-cancel-auto');
const btnRunAutoDirector = document.getElementById('btn-run-auto-director');
const autoScriptInput = document.getElementById('auto-script-input');
const btnCompileScript = document.getElementById('btn-compile-script');
const btnApplyJson = document.getElementById('btn-apply-json');

const ttsModal = document.getElementById('tts-modal');
const btnGenerateTts = document.getElementById('btn-generate-tts');
const btnCloseTtsModal = document.getElementById('btn-close-tts-modal');
const btnPullSubtitles = document.getElementById('btn-pull-subtitles');
const btnDoGenerateTts = document.getElementById('btn-do-generate-tts');
const ttsVoiceSelect = document.getElementById('tts-voice-select');
const ttsScriptText = document.getElementById('tts-script-text');

// Render Dashboard
const renderDashboard = document.getElementById('render-dashboard');
const renderStatusIcon = document.getElementById('render-status-icon');
const renderStatusText = document.getElementById('render-status-text');
const renderPercentText = document.getElementById('render-percent-text');
const renderProgressFill = document.getElementById('render-progress-fill');
const renderStatFrame = document.getElementById('render-stat-frame');
const renderStatEta = document.getElementById('render-stat-eta');
const renderStatSpeed = document.getElementById('render-stat-speed');
const renderSuccessBox = document.getElementById('render-success-box');
const btnOpenRenderedVideo = document.getElementById('btn-open-rendered-video');
const btnRevealFolder = document.getElementById('btn-reveal-folder');

// -------------------------------------------------------------
// 1. Initial Setup & Mode Switching
// -------------------------------------------------------------
async function initApp() {
  bindEvents();
  setupSSE();
  await switchMode('creepy_rules');
}

async function switchMode(mode) {
  activeMode = mode;
  stillOverlayActive = false;
  stillPreviewImg.style.display = 'none';
  stillBadge.style.display = 'none';

  if (mode === 'creepy_rules') {
    modeBtnCreepy.className = 'mode-btn active creepy';
    modeBtnStory.className = 'mode-btn';
    brandLogo.textContent = '👁️';
    brandLogo.style.borderColor = '#ef4444';
    brandLogo.style.color = '#ef4444';
    activeModeLabel.textContent = 'CREEPY RULES STUDIO';
    activeModeLabel.style.color = '#ef4444';

    tabBtnStoryboard.className = 'subtab-btn active creepy';

    document.querySelectorAll('.creepy-field').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.story-field').forEach(el => el.style.display = 'none');
  } else {
    modeBtnStory.className = 'mode-btn active story';
    modeBtnCreepy.className = 'mode-btn';
    brandLogo.textContent = '🎭';
    brandLogo.style.borderColor = '#06b6d4';
    brandLogo.style.color = '#06b6d4';
    activeModeLabel.textContent = '2D STORY STUDIO';
    activeModeLabel.style.color = '#06b6d4';

    tabBtnStoryboard.className = 'subtab-btn active story';

    document.querySelectorAll('.creepy-field').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.story-field').forEach(el => el.style.display = 'block');
  }

  // Load current scenario data from backend
  try {
    const res = await fetch(`/api/current?mode=${mode}`);
    const json = await res.json();
    if (json.ok && json.data) {
      currentData = json.data;
      populateMetaFields();
      renderSceneList();
      syncScriptAndJsonViews();
      currentFrame = 0;
      updateScrubber();
      drawPreview();
    }
  } catch (err) {
    console.error('Failed to load mode data:', err);
  }
}

function bindEvents() {
  modeBtnCreepy.onclick = () => switchMode('creepy_rules');
  modeBtnStory.onclick = () => switchMode('story_studio');

  // Subtabs
  tabBtnStoryboard.onclick = () => switchSubtab('storyboard');
  tabBtnScript.onclick = () => switchSubtab('script');
  tabBtnJson.onclick = () => switchSubtab('json');

  // Actions
  btnSave.onclick = saveScenario;
  btnRender.onclick = startRender;
  btnAddScene.onclick = () => addScene();
  btnAddSceneBottom.onclick = () => addScene();

  // Transport
  btnPlayPause.onclick = togglePlayPause;
  btnStepBack.onclick = () => stepFrame(-1);
  btnStepFwd.onclick = () => stepFrame(1);
  timelineScrubber.oninput = onScrubberChange;
  btnFullscreen.onclick = toggleFullscreen;
  btnCaptureStill.onclick = captureRealRemotionStill;

  // Modals
  btnOpenTemplates.onclick = openTemplatesModal;
  btnCloseModal.onclick = () => templateModal.style.display = 'none';

  btnOpenAutoDirector.onclick = () => autoDirectorModal.style.display = 'flex';
  btnCloseAutoModal.onclick = () => autoDirectorModal.style.display = 'none';
  btnCancelAuto.onclick = () => autoDirectorModal.style.display = 'none';
  btnRunAutoDirector.onclick = runAutoDirector;
  btnCompileScript.onclick = compileScriptView;
  btnApplyJson.onclick = applyJsonView;

  btnGenerateTts.onclick = () => ttsModal.style.display = 'flex';
  btnCloseTtsModal.onclick = () => ttsModal.style.display = 'none';
  btnPullSubtitles.onclick = pullSubtitlesToTts;
  btnDoGenerateTts.onclick = doGenerateTts;

  btnOpenRenderedVideo.onclick = () => fetch('/api/open-file', { method: 'POST' });
  btnRevealFolder.onclick = () => fetch('/api/reveal-folder', { method: 'POST' });

  // Input changes
  metaTitle.onchange = onMetaChange;
  metaChannel.onchange = onMetaChange;
  metaFilecode.onchange = onMetaChange;
  metaRules.onchange = onMetaChange;
  metaAccent.onchange = onMetaChange;
  metaLang.onchange = onMetaChange;
  metaMusic.onchange = onMetaChange;
  metaAspect.onchange = onMetaChange;
  metaFps.onchange = onMetaChange;
}

function switchSubtab(tab) {
  tabBtnStoryboard.classList.remove('active', 'creepy', 'story');
  tabBtnScript.classList.remove('active', 'creepy', 'story');
  tabBtnJson.classList.remove('active', 'creepy', 'story');

  const activeColorClass = activeMode === 'creepy_rules' ? 'creepy' : 'story';

  viewStoryboard.style.display = 'none';
  viewScript.style.display = 'none';
  viewJson.style.display = 'none';

  if (tab === 'storyboard') {
    tabBtnStoryboard.classList.add('active', activeColorClass);
    viewStoryboard.style.display = 'block';
  } else if (tab === 'script') {
    tabBtnScript.classList.add('active', activeColorClass);
    viewScript.style.display = 'block';
    syncScriptAndJsonViews();
  } else if (tab === 'json') {
    tabBtnJson.classList.add('active', activeColorClass);
    viewJson.style.display = 'block';
    syncScriptAndJsonViews();
  }
}

// -------------------------------------------------------------
// 2. Data Synchronization & Meta Fields
// -------------------------------------------------------------
function populateMetaFields() {
  if (!currentData) return;
  const meta = currentData.meta || {};

  metaTitle.value = meta.title || '';
  metaAspect.value = meta.aspect || '16:9';
  metaFps.value = meta.fps || 30;

  if (activeMode === 'creepy_rules') {
    metaChannel.value = meta.channel || 'BRADIKININ';
    metaFilecode.value = meta.fileNo !== undefined ? meta.fileNo : 41;
    metaRules.value = meta.ruleTotal || 7;
    metaAccent.value = meta.accent || '#e51939';
  } else {
    metaLang.value = meta.lang || 'vi';
    metaMusic.value = meta.music || 'sfx/drone.wav';
  }

  updateTotalDuration();
}

function onMetaChange() {
  if (!currentData) return;
  if (!currentData.meta) currentData.meta = {};

  currentData.meta.title = metaTitle.value;
  currentData.meta.aspect = metaAspect.value;
  currentData.meta.fps = parseInt(metaFps.value, 10);

  if (activeMode === 'creepy_rules') {
    currentData.meta.channel = metaChannel.value;
    currentData.meta.fileNo = parseInt(metaFilecode.value, 10) || 41;
    currentData.meta.ruleTotal = parseInt(metaRules.value, 10) || 7;
    currentData.meta.accent = metaAccent.value;
  } else {
    currentData.meta.lang = metaLang.value;
    currentData.meta.music = metaMusic.value;
  }

  updateTotalDuration();
  syncScriptAndJsonViews();
  drawPreview();
}

function updateTotalDuration() {
  if (!currentData) return;
  const fps = currentData.meta?.fps || 30;
  let totalSec = 0;

  if (activeMode === 'creepy_rules') {
    const scenes = currentData.scenes || [];
    totalSec = scenes.reduce((acc, s) => acc + (s.dur || 2.5), 0);
  } else {
    const shots = currentData.shots || [];
    totalSec = shots.reduce((acc, s) => acc + (s.durationSec || 2.5), 0);
  }

  const totalFrames = Math.round(totalSec * fps);
  totalDurationBadge.textContent = `${totalSec.toFixed(1)}s (${totalFrames} frames)`;
  timelineScrubber.max = Math.max(1, totalFrames);
}

function syncScriptAndJsonViews() {
  if (!currentData) return;

  // JSON View
  rawJsonInput.value = JSON.stringify(currentData, null, 2);

  // Script View
  let scriptLines = [];
  if (activeMode === 'creepy_rules') {
    scriptLines.push(`# title: ${currentData.meta?.title || 'Creepy Rules'}`);
    scriptLines.push(`# channel: ${currentData.meta?.channel || 'CHANNEL'}`);
    scriptLines.push(`# file: ${currentData.meta?.fileNo || 1}`);
    scriptLines.push(`# rules: ${currentData.meta?.ruleTotal || 7}`);
    scriptLines.push(`# accent: ${currentData.meta?.accent || '#e51939'}`);
    scriptLines.push('---');
    (currentData.scenes || []).forEach(s => {
      let tag = '';
      if (s.visual?.tpl === 'rule') tag = ` @rule ${s.visual.n || 1} | ${s.visual.title || ''}`;
      else if (s.visual?.tpl === 'counter') tag = ` @counter ${s.visual.n || 7}`;
      else if (s.visual?.tpl === 'exhibit') tag = ` @exhibit A | ${s.visual.meta?.join(' | ') || ''}`;
      else if (s.visual?.tpl === 'stage') {
        const item = s.visual.items?.[0];
        if (item?.pose === 'scream') tag = ' @scream';
        else if (item?.pose === 'run') tag = ' @run';
        else if (item?.kind === 'eye') tag = ' @stare';
        else if (item?.kind === 'dog') tag = ' @dog';
      }
      scriptLines.push(`${s.text || '...'}${tag}`);
    });
  } else {
    scriptLines.push(`TITLE: ${currentData.meta?.title || 'Story Title'}`);
    scriptLines.push(`ASPECT: ${currentData.meta?.aspect || '16:9'}`);
    scriptLines.push('---');
    (currentData.shots || []).forEach(s => {
      const narr = s.narration?.text || s.caption || '';
      scriptLines.push(`--- ${s.id || 'shot'} | set=${s.set || 'street-dusk'} cam=${s.camera?.shot || 'wide'} dur=${s.durationSec || 2.5}`);
      if (s.title?.lines) scriptLines.push(`TITLE: ${s.title.lines.join(' ')}`);
      if (s.badge?.text) scriptLines.push(`BADGE: ${s.badge.text}`);
      if (narr) scriptLines.push(`NARR: ${narr}`);
    });
  }
  rawScriptInput.value = scriptLines.join('\n');
}

// -------------------------------------------------------------
// 3. Storyboard Rendering (Card-by-card visual editor)
// -------------------------------------------------------------
function renderSceneList() {
  scenesContainer.innerHTML = '';
  if (!currentData) return;

  if (activeMode === 'creepy_rules') {
    renderCreepyScenes();
  } else {
    renderStoryShots();
  }
}

// Render Creepy Rules Scenes
function renderCreepyScenes() {
  const scenes = currentData.scenes || [];
  scenes.forEach((scene, index) => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.style.borderLeft = '3px solid #ef4444';

    const tpl = scene.visual?.tpl || 'stage';
    const items = scene.visual?.items || [];

    card.innerHTML = `
      <div class="scene-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="scene-badge badge-creepy">#${index + 1} // ${scene.id || 's' + (index + 1)}</span>
          <span style="font-weight: 700; font-size: 13px; color: #f87171;">TPL: ${tpl.toUpperCase()}</span>
        </div>
        <div class="scene-actions">
          <button class="btn-icon" title="Lên" onclick="moveItem(${index}, -1)">▲</button>
          <button class="btn-icon" title="Xuống" onclick="moveItem(${index}, 1)">▼</button>
          <button class="btn-icon" title="Nhân bản" onclick="duplicateItem(${index})">📋</button>
          <button class="btn-icon" title="Xóa" onclick="deleteItem(${index})" style="color: #ef4444;">✕</button>
        </div>
      </div>

      <div class="form-grid" style="margin-bottom: 8px;">
        <div class="form-group">
          <label>Mẫu Cảnh (Template)</label>
          <select onchange="updateCreepyScene(${index}, 'tpl', this.value)">
            <option value="stage" ${tpl === 'stage' ? 'selected' : ''}>Stage (Đồ Họa Vector)</option>
            <option value="rule" ${tpl === 'rule' ? 'selected' : ''}>Rule Card (Thẻ Quy Tắc)</option>
            <option value="counter" ${tpl === 'counter' ? 'selected' : ''}>Counter (Đếm Quy Tắc)</option>
            <option value="exhibit" ${tpl === 'exhibit' ? 'selected' : ''}>Exhibit (Bằng Chứng/Ảnh)</option>
            <option value="cards" ${tpl === 'cards' ? 'selected' : ''}>Cards (Danh Sách Thẻ)</option>
            <option value="black" ${tpl === 'black' ? 'selected' : ''}>Black (Tối Đen/Im Lặng)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Thời lượng (giây)</label>
          <input type="number" step="0.1" value="${scene.dur || 2.5}" onchange="updateCreepyScene(${index}, 'dur', parseFloat(this.value))">
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 8px;">
        <label>Phụ đề / Lời thoại (Caption Subtitle)</label>
        <input type="text" value="${escapeHtml(scene.text || '')}" onchange="updateCreepyScene(${index}, 'text', this.value)">
      </div>

      ${tpl === 'rule' ? `
        <div class="form-grid" style="margin-bottom: 8px; background: #1a0f12; padding: 8px; border-radius: 6px;">
          <div class="form-group">
            <label>Số quy tắc (Rule No)</label>
            <input type="number" value="${scene.visual?.n || 1}" onchange="updateCreepyScene(${index}, 'rule_n', parseInt(this.value, 10))">
          </div>
          <div class="form-group">
            <label>Tiêu đề quy tắc (Title)</label>
            <input type="text" value="${escapeHtml(scene.visual?.title || '')}" onchange="updateCreepyScene(${index}, 'rule_title', this.value)">
          </div>
        </div>
      ` : ''}

      ${tpl === 'stage' ? `
        <div style="background: #11141d; padding: 8px; border-radius: 6px; margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">VẬT THỂ VECTOR (${items.length}):</span>
            <button class="btn" style="padding: 2px 8px; font-size: 10px;" onclick="addStageItem(${index})">+ Thêm Vật Thể</button>
          </div>
          <div>
            ${items.map((it, itIdx) => `
              <span class="item-tag">
                <b>${it.kind || 'item'}</b> (${it.pose || 'default'}) 
                <span style="cursor: pointer; color: #ef4444; margin-left: 4px;" onclick="removeStageItem(${index}, ${itIdx})">✕</span>
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    scenesContainer.appendChild(card);
  });
}

// Render Story Studio Shots
function renderStoryShots() {
  const shots = currentData.shots || [];
  shots.forEach((shot, index) => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.style.borderLeft = '3px solid #06b6d4';

    const char0 = shot.characters?.[0] || {};

    card.innerHTML = `
      <div class="scene-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="scene-badge badge-story">#${index + 1} // ${shot.id || 's' + (index + 1)}</span>
          <span style="font-weight: 700; font-size: 13px; color: #38bdf8;">SET: ${(shot.set || 'street-dusk').toUpperCase()}</span>
        </div>
        <div class="scene-actions">
          <button class="btn-icon" title="Lên" onclick="moveItem(${index}, -1)">▲</button>
          <button class="btn-icon" title="Xuống" onclick="moveItem(${index}, 1)">▼</button>
          <button class="btn-icon" title="Nhân bản" onclick="duplicateItem(${index})">📋</button>
          <button class="btn-icon" title="Xóa" onclick="deleteItem(${index})" style="color: #ef4444;">✕</button>
        </div>
      </div>

      <div class="form-grid" style="margin-bottom: 8px;">
        <div class="form-group">
          <label>Bối cảnh (Set)</label>
          <select onchange="updateStoryShot(${index}, 'set', this.value)">
            <option value="street-dusk" ${shot.set === 'street-dusk' ? 'selected' : ''}>Street Dusk (Phố hoàng hôn)</option>
            <option value="street-brick" ${shot.set === 'street-brick' ? 'selected' : ''}>Street Brick (Phố tường gạch)</option>
            <option value="street-night" ${shot.set === 'street-night' ? 'selected' : ''}>Street Night (Phố đêm vắng)</option>
            <option value="living-room" ${shot.set === 'living-room' ? 'selected' : ''}>Living Room (Phòng khách)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Góc máy (Camera)</label>
          <select onchange="updateStoryShot(${index}, 'camera_shot', this.value)">
            <option value="wide" ${shot.camera?.shot === 'wide' ? 'selected' : ''}>Wide (Toàn cảnh)</option>
            <option value="medium" ${shot.camera?.shot === 'medium' ? 'selected' : ''}>Medium (Trung cảnh)</option>
            <option value="close" ${shot.camera?.shot === 'close' ? 'selected' : ''}>Close (Cận cảnh)</option>
            <option value="xclose" ${shot.camera?.shot === 'xclose' ? 'selected' : ''}>Extra Close (Đặc tả)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Thời lượng (giây)</label>
          <input type="number" step="0.1" value="${shot.durationSec || 2.5}" onchange="updateStoryShot(${index}, 'durationSec', parseFloat(this.value))">
        </div>
      </div>

      <div class="form-grid" style="margin-bottom: 8px; background: #0c1824; padding: 8px; border-radius: 6px;">
        <div class="form-group">
          <label>Nhân vật (Preset)</label>
          <select onchange="updateStoryShot(${index}, 'char_preset', this.value)">
            <option value="hoodie" ${char0.preset === 'hoodie' ? 'selected' : ''}>Hoodie (Áo mũ)</option>
            <option value="beanie" ${char0.preset === 'beanie' ? 'selected' : ''}>Beanie (Mũ len)</option>
            <option value="pink" ${char0.preset === 'pink' ? 'selected' : ''}>Pink (Áo hồng)</option>
            <option value="suit" ${char0.preset === 'suit' ? 'selected' : ''}>Suit (Vest lịch lãm)</option>
            <option value="teal" ${char0.preset === 'teal' ? 'selected' : ''}>Teal (Áo lam)</option>
            <option value="boy" ${char0.preset === 'boy' ? 'selected' : ''}>Boy (Cậu bé)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tư thế (Pose)</label>
          <select onchange="updateStoryShot(${index}, 'char_pose', this.value)">
            <option value="stand" ${char0.pose === 'stand' ? 'selected' : ''}>Stand (Đứng)</option>
            <option value="sit" ${char0.pose === 'sit' ? 'selected' : ''}>Sit (Ngồi)</option>
            <option value="walk" ${char0.pose === 'walk' ? 'selected' : ''}>Walk (Đi bước)</option>
            <option value="hold" ${char0.pose === 'hold' ? 'selected' : ''}>Hold (Cầm đồ/ly)</option>
            <option value="kneel" ${char0.pose === 'kneel' ? 'selected' : ''}>Kneel (Quỳ)</option>
            <option value="slump" ${char0.pose === 'slump' ? 'selected' : ''}>Slump (Gục ngã/Mệt mỏi)</option>
            <option value="scratch" ${char0.pose === 'scratch' ? 'selected' : ''}>Scratch (Gãi đầu bối rối)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Biểu cảm (Emote)</label>
          <select onchange="updateStoryShot(${index}, 'char_emote', this.value)">
            <option value="neutral" ${char0.emote === 'neutral' ? 'selected' : ''}>Neutral (Bình thường)</option>
            <option value="tired" ${char0.emote === 'tired' ? 'selected' : ''}>Tired (Mệt mỏi)</option>
            <option value="sleepy" ${char0.emote === 'sleepy' ? 'selected' : ''}>Sleepy (Buồn ngủ)</option>
            <option value="happy" ${char0.emote === 'happy' ? 'selected' : ''}>Happy (Vui tươi)</option>
            <option value="smirk" ${char0.emote === 'smirk' ? 'selected' : ''}>Smirk (Cười nhếch)</option>
            <option value="worried" ${char0.emote === 'worried' ? 'selected' : ''}>Worried (Lo lắng)</option>
            <option value="surprised" ${char0.emote === 'surprised' ? 'selected' : ''}>Surprised (Kinh ngạc)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Đạo cụ (Prop)</label>
          <select onchange="updateStoryShot(${index}, 'char_prop', this.value)">
            <option value="none" ${(!char0.prop || char0.prop === 'none') ? 'selected' : ''}>Không có</option>
            <option value="umbrella" ${char0.prop === 'umbrella' ? 'selected' : ''}>Umbrella (Cây dù/ô)</option>
            <option value="cup" ${char0.prop === 'cup' ? 'selected' : ''}>Cup (Tách cà phê/trà)</option>
            <option value="letter" ${(char0.prop === 'letter' || char0.prop === 'envelope') ? 'selected' : ''}>Letter (Phong bì thư)</option>
            <option value="box" ${char0.prop === 'box' ? 'selected' : ''}>Box (Hộp gỗ/quà)</option>
            <option value="phone" ${char0.prop === 'phone' ? 'selected' : ''}>Phone (Điện thoại)</option>
            <option value="book" ${char0.prop === 'book' ? 'selected' : ''}>Book (Sách)</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 8px;">
        <label>Lời dẫn / Lời thoại (Narration)</label>
        <input type="text" value="${escapeHtml(shot.narration?.text || shot.caption || '')}" onchange="updateStoryShot(${index}, 'narration', this.value)">
      </div>
    `;
    scenesContainer.appendChild(card);
  });
}

// Update handlers
window.updateCreepyScene = function(index, field, value) {
  if (!currentData?.scenes?.[index]) return;
  const s = currentData.scenes[index];
  if (field === 'tpl') {
    if (!s.visual) s.visual = {};
    s.visual.tpl = value;
    if (value === 'stage' && !s.visual.items) s.visual.items = [{ kind: 'dog', pose: 'stand', x: 650, y: 438 }];
    renderSceneList();
  } else if (field === 'dur') {
    s.dur = value;
    updateTotalDuration();
  } else if (field === 'text') {
    s.text = value;
  } else if (field === 'rule_n') {
    if (!s.visual) s.visual = { tpl: 'rule' };
    s.visual.n = value;
  } else if (field === 'rule_title') {
    if (!s.visual) s.visual = { tpl: 'rule' };
    s.visual.title = value;
  }
  syncScriptAndJsonViews();
  drawPreview();
};

window.updateStoryShot = function(index, field, value) {
  if (!currentData?.shots?.[index]) return;
  const s = currentData.shots[index];
  if (field === 'set') s.set = value;
  else if (field === 'camera_shot') {
    if (!s.camera) s.camera = {};
    s.camera.shot = value;
  } else if (field === 'durationSec') {
    s.durationSec = value;
    updateTotalDuration();
  } else if (field === 'char_preset') {
    if (!s.characters?.[0]) s.characters = [{}];
    s.characters[0].preset = value;
  } else if (field === 'char_pose') {
    if (!s.characters?.[0]) s.characters = [{}];
    s.characters[0].pose = value;
  } else if (field === 'char_emote') {
    if (!s.characters?.[0]) s.characters = [{}];
    s.characters[0].emote = value;
  } else if (field === 'char_prop') {
    if (!s.characters?.[0]) s.characters = [{}];
    s.characters[0].prop = value;
  } else if (field === 'narration') {
    if (!s.narration) s.narration = {};
    s.narration.text = value;
  }
  syncScriptAndJsonViews();
  drawPreview();
};

window.moveItem = function(index, delta) {
  const arr = activeMode === 'creepy_rules' ? currentData.scenes : currentData.shots;
  const newIdx = index + delta;
  if (newIdx < 0 || newIdx >= arr.length) return;
  const temp = arr[index];
  arr[index] = arr[newIdx];
  arr[newIdx] = temp;
  renderSceneList();
  syncScriptAndJsonViews();
  drawPreview();
};

window.duplicateItem = function(index) {
  const arr = activeMode === 'creepy_rules' ? currentData.scenes : currentData.shots;
  const copy = JSON.parse(JSON.stringify(arr[index]));
  copy.id = `${copy.id}_copy`;
  arr.splice(index + 1, 0, copy);
  renderSceneList();
  syncScriptAndJsonViews();
  updateTotalDuration();
  drawPreview();
};

window.deleteItem = function(index) {
  const arr = activeMode === 'creepy_rules' ? currentData.scenes : currentData.shots;
  if (arr.length <= 1) {
    alert('Không thể xóa cảnh cuối cùng!');
    return;
  }
  arr.splice(index, 1);
  renderSceneList();
  syncScriptAndJsonViews();
  updateTotalDuration();
  drawPreview();
};

window.addStageItem = function(sceneIdx) {
  const s = currentData.scenes[sceneIdx];
  if (!s.visual) s.visual = { tpl: 'stage', items: [] };
  if (!s.visual.items) s.visual.items = [];
  const chosenKind = prompt('Chọn loại vật thể:\nelevator, cctv, mirror, phone, tape, creature, person, dog, door, clock, eye, cross, bed, lamp, tv, nightstand', 'elevator');
  if (!chosenKind) return;
  const k = chosenKind.trim().toLowerCase();
  if (k === 'elevator') {
    s.visual.items.push({ kind: 'elevator', x: 609, y: 440, scale: 1.45, floor: 'B4', open: 0.2, creature: true });
  } else if (k === 'cctv') {
    s.visual.items.push({ kind: 'cctv', x: 260, y: 150, scale: 1.2 });
  } else if (k === 'mirror') {
    s.visual.items.push({ kind: 'mirror', x: 609, y: 440, scale: 1.5, shadow: true });
  } else if (k === 'tape') {
    s.visual.items.push({ kind: 'tape', x: 609, y: 340, scale: 1.3, rot: -8 });
  } else if (k === 'creature') {
    s.visual.items.push({ kind: 'creature', x: 609, y: 440, scale: 1.4 });
  } else if (k === 'cross') {
    s.visual.items.push({ kind: 'cross', x: 609, y: 300, w: 260, h: 260, stroke: 14, t0: 0.2 });
  } else {
    s.visual.items.push({ kind: k, x: 609, y: 440, scale: 1.4 });
  }
  renderSceneList();
  drawPreview();
};

window.removeStageItem = function(sceneIdx, itemIdx) {
  const s = currentData.scenes[sceneIdx];
  if (s.visual?.items) {
    s.visual.items.splice(itemIdx, 1);
    renderSceneList();
    drawPreview();
  }
};

function addScene() {
  if (activeMode === 'creepy_rules') {
    const seq = (currentData.scenes || []).length + 1;
    currentData.scenes.push({
      id: `s${String(seq).padStart(2, '0')}`,
      dur: 2.5,
      text: 'NEW RULE // DO NOT PANIC',
      visual: {
        tpl: 'stage',
        set: 'room',
        items: [{ kind: 'dog', pose: 'stand', x: 650, y: 438 }],
      },
    });
  } else {
    const seq = (currentData.shots || []).length + 1;
    currentData.shots.push({
      id: `s${String(seq).padStart(2, '0')}`,
      durationSec: 2.5,
      set: 'street-dusk',
      camera: { shot: 'wide' },
      characters: [{ preset: 'hoodie', pose: 'stand', emote: 'neutral' }],
      narration: { text: 'Another mysterious encounter in the neighborhood.' },
    });
  }
  renderSceneList();
  syncScriptAndJsonViews();
  updateTotalDuration();
  drawPreview();
}

// -------------------------------------------------------------
// 4. Preview Canvas Engine & Remotion Still Overlay
// -------------------------------------------------------------
function drawPreview() {
  if (stillOverlayActive) return; // Remotion exact still is currently showing

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (activeMode === 'creepy_rules') {
    drawCreepyPreview(W, H);
  } else {
    drawStoryPreview(W, H);
  }
}

function drawCreepyPreview(W, H) {
  // Pure Black BG
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);

  const fps = currentData.meta?.fps || 30;
  const scenes = currentData.scenes || [];
  let elapsed = currentFrame / fps;
  let curScene = scenes[0];
  let curAccum = 0;

  for (const sc of scenes) {
    if (elapsed >= curAccum && elapsed < curAccum + (sc.dur || 2.5)) {
      curScene = sc;
      break;
    }
    curAccum += (sc.dur || 2.5);
  }
  if (!curScene) curScene = scenes[scenes.length - 1] || {};

  const tpl = curScene.visual?.tpl || 'stage';
  const accent = currentData.meta?.accent || '#e51939';

  // HUD Top
  ctx.fillStyle = accent;
  ctx.fillRect(50, 45, 12, 12);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#f8fafc';
  const fileNo = currentData.meta?.fileNo !== undefined ? currentData.meta.fileNo : 41;
  const channel = currentData.meta?.channel || 'CHANNEL';
  ctx.fillText(`FILE 0${fileNo} // ${channel}`, 75, 56);

  // Timecode
  const tc = formatTimecode(currentFrame, fps);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(tc, W - 220, 56);

  // Draw template contents
  if (tpl === 'rule') {
    const rn = curScene.visual?.n || 1;
    const title = curScene.visual?.title || 'ACT NORMAL';
    ctx.fillStyle = accent;
    ctx.fillRect(W / 2 - 250, H / 2 - 120, 500, 6);

    ctx.font = '800 64px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`RULE ${rn}`, W / 2, H / 2 - 40);

    ctx.font = '700 42px "Montserrat", sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(title.toUpperCase(), W / 2, H / 2 + 50);
    ctx.textAlign = 'start';
  } else if (tpl === 'counter') {
    const tot = curScene.visual?.n || currentData.meta?.ruleTotal || 7;
    ctx.font = '800 48px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`THERE ARE ${tot} RULES.`, W / 2, H / 2 - 50);

    // Draw crossed boxes
    const startX = W / 2 - (tot * 50) / 2;
    for (let i = 1; i <= tot; i++) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(startX + (i - 1) * 55, H / 2 + 10, 44, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(String(i), startX + (i - 1) * 55 + 22, H / 2 + 42);
    }
    ctx.textAlign = 'start';
  } else if (tpl === 'stage') {
    // Floor line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, H * 0.75);
    ctx.lineTo(W - 100, H * 0.75);
    ctx.stroke();

    // Draw dog or person pictogram
    const items = curScene.visual?.items || [{ kind: 'dog', pose: 'stand' }];
    items.forEach(it => {
      const x = it.x || W / 2;
      const y = it.y || H * 0.65;
      if (it.kind === 'dog') {
        drawPictogramDog(ctx, x, y, accent);
      } else if (it.kind === 'person') {
        drawPictogramPerson(ctx, x, y, it.pose, accent);
      } else if (it.kind === 'eye') {
        drawPictogramEye(ctx, x, y, accent);
      }
    });
  }

  // Subtitle Bar
  if (curScene.text) {
    ctx.font = '800 34px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(curScene.text.toUpperCase(), W / 2, H - 90);
    ctx.textAlign = 'start';
  }

  // Scanlines & Noise vignette
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawStoryPreview(W, H) {
  const fps = currentData.meta?.fps || 30;
  const shots = currentData.shots || [];
  let elapsed = currentFrame / fps;
  let curShot = shots[0];
  let curAccum = 0;

  for (const sh of shots) {
    if (elapsed >= curAccum && elapsed < curAccum + (sh.durationSec || 2.5)) {
      curShot = sh;
      break;
    }
    curAccum += (sh.durationSec || 2.5);
  }
  if (!curShot) curShot = shots[shots.length - 1] || {};

  const setKind = curShot.set || 'street-dusk';

  // Set Background
  if (setKind.includes('dusk')) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.6, '#312e81');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (setKind.includes('night')) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    // Living room
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, H);
    // Wall and floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }

  // Draw ball-head character
  const char = curShot.characters?.[0] || { preset: 'hoodie', pose: 'stand', emote: 'neutral' };
  drawBallHeadCharacter(ctx, W / 2, H * 0.72, char);

  // Title / Badge overlays
  if (curShot.title?.lines) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px "Montserrat", sans-serif';
    ctx.fillText(curShot.title.lines[0], 80, 100);
  }
  if (curShot.badge?.text) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W - 200, 60, 140, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W - 200, 60, 140, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(curShot.badge.text, W - 130, 86);
    ctx.textAlign = 'start';
  }

  // Narration Subtitle
  const narr = curShot.narration?.text || curShot.caption || '';
  if (narr) {
    ctx.font = '700 30px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(narr, W / 2, H - 75);
    ctx.textAlign = 'start';
  }
}

// Pictograms helpers
function drawPictogramDog(ctx, x, y, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Body standing upright on two legs
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -140);
  ctx.stroke();

  // Head and snout
  ctx.beginPath();
  ctx.arc(0, -170, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -170);
  ctx.lineTo(45, -165);
  ctx.lineTo(10, -155);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(-15, -190);
  ctx.lineTo(-30, -150);
  ctx.stroke();

  // Two upright legs
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-15, 70);
  ctx.moveTo(15, 0);
  ctx.lineTo(15, 70);
  ctx.stroke();

  // Front paws hanging
  ctx.beginPath();
  ctx.moveTo(-5, -90);
  ctx.lineTo(35, -70);
  ctx.stroke();

  ctx.restore();
}

function drawPictogramPerson(ctx, x, y, pose, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(0, -160, 28, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -130);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Arms and Legs
  if (pose === 'scream') {
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(-40, -150);
    ctx.lineTo(-20, -180);
    ctx.moveTo(0, -100);
    ctx.lineTo(40, -150);
    ctx.lineTo(20, -180);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.lineTo(-40, -30);
    ctx.moveTo(0, -90);
    ctx.lineTo(40, -30);
    ctx.stroke();
  }

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-25, 75);
  ctx.moveTo(0, 0);
  ctx.lineTo(25, 75);
  ctx.stroke();

  ctx.restore();
}

function drawPictogramEye(ctx, x, y, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 90, 50, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(8, -8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBallHeadCharacter(ctx, x, y, char) {
  ctx.save();
  ctx.translate(x, y);

  // Ball head
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, -120, 45, 0, Math.PI * 2);
  ctx.fill();

  // Eyes and emote
  ctx.fillStyle = '#0f172a';
  if (char.emote === 'sleepy' || char.emote === 'tired') {
    ctx.fillRect(-22, -125, 12, 3);
    ctx.fillRect(10, -125, 12, 3);
  } else {
    ctx.beginPath();
    ctx.arc(-16, -125, 5, 0, Math.PI * 2);
    ctx.arc(16, -125, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (char.emote === 'happy') {
    ctx.arc(0, -115, 14, 0.2 * Math.PI, 0.8 * Math.PI);
  } else if (char.emote === 'worried') {
    ctx.arc(0, -100, 14, 1.2 * Math.PI, 1.8 * Math.PI);
  } else {
    ctx.moveTo(-10, -110);
    ctx.lineTo(10, -110);
  }
  ctx.stroke();

  // Clothes / Body
  const color = char.preset === 'pink' ? '#ec4899' : char.preset === 'teal' ? '#0d9488' : '#3b82f6';
  ctx.fillStyle = color;
  ctx.fillRect(-35, -70, 70, 80);

  // Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-30, 10, 22, 60);
  ctx.fillRect(8, 10, 22, 60);

  ctx.restore();
}

// Real Remotion Still Frame Rendering
async function captureRealRemotionStill() {
  btnCaptureStill.disabled = true;
  btnCaptureStill.textContent = '⏳ Đang render...';

  try {
    const res = await fetch('/api/render-still', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: activeMode,
        frame: currentFrame,
        data: currentData,
      }),
    });
    const json = await res.json();
    if (json.ok && json.imageUrl) {
      stillPreviewImg.src = json.imageUrl;
      stillPreviewImg.style.display = 'block';
      stillBadge.style.display = 'block';
      stillOverlayActive = true;
    } else {
      alert('Lỗi render still: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  } finally {
    btnCaptureStill.disabled = false;
    btnCaptureStill.textContent = '📸 Chụp Frame Thật';
  }
}

// -------------------------------------------------------------
// 5. Transport Controls
// -------------------------------------------------------------
function togglePlayPause() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    stillOverlayActive = false;
    stillPreviewImg.style.display = 'none';
    stillBadge.style.display = 'none';
    playIcon.textContent = '⏸ Pause';
    playInterval = setInterval(() => {
      stepFrame(1);
    }, 1000 / (currentData.meta?.fps || 30));
  } else {
    playIcon.textContent = '▶ Play';
    clearInterval(playInterval);
  }
}

function stepFrame(delta) {
  const max = parseInt(timelineScrubber.max, 10) || 100;
  currentFrame += delta;
  if (currentFrame > max) currentFrame = 0;
  if (currentFrame < 0) currentFrame = max;
  updateScrubber();
  drawPreview();
}

function onScrubberChange(e) {
  currentFrame = parseInt(e.target.value, 10);
  stillOverlayActive = false;
  stillPreviewImg.style.display = 'none';
  stillBadge.style.display = 'none';
  updateScrubber();
  drawPreview();
}

function updateScrubber() {
  timelineScrubber.value = currentFrame;
  const fps = currentData.meta?.fps || 30;
  const max = parseInt(timelineScrubber.max, 10) || 1;
  timecodeDisplay.textContent = `${formatTimecode(currentFrame, fps)} / ${formatTimecode(max, fps)}`;
}

function formatTimecode(frame, fps = 30) {
  const totalSec = Math.floor(frame / fps);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  const f = String(frame % fps).padStart(2, '0');
  return `${m}:${s}:${f}`;
}

function toggleFullscreen() {
  const wrapper = document.getElementById('viewport-wrapper');
  if (!document.fullscreenElement) {
    wrapper.requestFullscreen().catch(err => alert(err.message));
  } else {
    document.exitFullscreen();
  }
}

// -------------------------------------------------------------
// 6. Save, Render & Presets
// -------------------------------------------------------------
async function saveScenario() {
  btnSave.disabled = true;
  btnSave.textContent = '⏳ Đang lưu...';
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: activeMode, data: currentData }),
    });
    const json = await res.json();
    if (json.ok) {
      alert('✓ Đã lưu kịch bản thành công!');
    } else {
      alert('Lỗi lưu: ' + json.error);
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = '💾 Lưu';
  }
}

async function startRender() {
  if (!confirm(`Bắt đầu xuất video MP4 bằng Remotion cho chế độ: [${activeModeLabel.textContent}]?`)) return;

  btnRender.disabled = true;
  btnRender.textContent = '⏳ Đang khởi tạo...';
  renderSuccessBox.style.display = 'none';

  try {
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: activeMode,
        data: currentData,
        crf: 18,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert('Lỗi bắt đầu render: ' + json.error);
      btnRender.disabled = false;
      btnRender.textContent = '🚀 Xuất Video MP4';
    }
  } catch (err) {
    alert('Lỗi kết nối render: ' + err.message);
    btnRender.disabled = false;
    btnRender.textContent = '🚀 Xuất Video MP4';
  }
}

function setupSSE() {
  const evtSource = new EventSource('/api/render-progress');
  evtSource.onmessage = (e) => {
    try {
      const state = JSON.parse(e.data);
      updateRenderUI(state);
    } catch {}
  };
}

function updateRenderUI(state) {
  if (state.status === 'rendering') {
    renderStatusIcon.textContent = '🟡';
    renderStatusText.textContent = `ĐANG RENDER [${state.mode?.toUpperCase() || ''}]...`;
    renderPercentText.textContent = `${state.progress}%`;
    renderProgressFill.style.width = `${state.progress}%`;
    renderStatFrame.textContent = `Khung hình: ${state.currentFrame} / ${state.totalFrames}`;
    renderStatEta.textContent = `File: ${state.outFileName || ''}`;
    btnRender.disabled = true;
    btnRender.textContent = `⏳ Đang xuất (${state.progress}%)`;
  } else if (state.status === 'completed') {
    renderStatusIcon.textContent = '🟢';
    renderStatusText.textContent = 'HOÀN THÀNH 100%';
    renderPercentText.textContent = '100%';
    renderProgressFill.style.width = '100%';
    renderSuccessBox.style.display = 'flex';
    btnRender.disabled = false;
    btnRender.textContent = '🚀 Xuất Video MP4';
  } else if (state.status === 'error') {
    renderStatusIcon.textContent = '🔴';
    renderStatusText.textContent = 'LỖI RENDER';
    btnRender.disabled = false;
    btnRender.textContent = '🚀 Xuất Video MP4';
  } else {
    renderStatusIcon.textContent = '⚪';
    renderStatusText.textContent = 'SẴN SÀNG';
    btnRender.disabled = false;
    btnRender.textContent = '🚀 Xuất Video MP4';
  }
}

// Presets Modal
async function openTemplatesModal() {
  templateModal.style.display = 'flex';
  templateListContainer.innerHTML = '<div style="color: #94a3b8;">Đang tải danh sách mẫu...</div>';

  try {
    const res = await fetch('/api/presets');
    const json = await res.json();
    if (json.ok && json.presets) {
      templateListContainer.innerHTML = '';
      json.presets.forEach(p => {
        const item = document.createElement('div');
        item.style.cssText = 'background: #151822; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s;';
        item.onmouseenter = () => item.style.borderColor = '#3b82f6';
        item.onmouseleave = () => item.style.borderColor = 'var(--border-color)';
        item.onclick = () => loadPreset(p.id, p.mode);

        const badge = p.mode === 'creepy_rules' ? '<span class="badge-creepy">CREEPY RULES</span>' : '<span class="badge-story">2D STORY</span>';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <b style="font-size: 14px; color: #fff;">${p.name}</b>
            ${badge}
          </div>
          <div style="font-size: 12px; color: #94a3b8;">${p.desc}</div>
        `;
        templateListContainer.appendChild(item);
      });
    }
  } catch (err) {
    templateListContainer.innerHTML = `<div style="color: #ef4444;">Lỗi tải mẫu: ${err.message}</div>`;
  }
}

async function loadPreset(presetId, mode) {
  try {
    const res = await fetch(`/api/presets/${presetId}`);
    const json = await res.json();
    if (json.ok && json.data) {
      templateModal.style.display = 'none';
      if (mode !== activeMode) {
        await switchMode(mode);
      }
      currentData = json.data;
      populateMetaFields();
      renderSceneList();
      syncScriptAndJsonViews();
      currentFrame = 0;
      updateScrubber();
      drawPreview();
      alert(`✓ Đã nạp kịch bản mẫu thành công!`);
    }
  } catch (err) {
    alert('Lỗi nạp mẫu: ' + err.message);
  }
}

// Auto-Director
async function runAutoDirector() {
  const text = autoScriptInput.value;
  if (!text || !text.trim()) {
    alert('Vui lòng nhập văn bản kịch bản!');
    return;
  }
  btnRunAutoDirector.disabled = true;
  btnRunAutoDirector.textContent = '⏳ Đang phân tích...';

  try {
    const res = await fetch('/api/auto-director', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode: activeMode }),
    });
    const json = await res.json();
    if (json.ok && json.result) {
      currentData = json.result;
      autoDirectorModal.style.display = 'none';
      populateMetaFields();
      renderSceneList();
      syncScriptAndJsonViews();
      switchSubtab('storyboard');
      currentFrame = 0;
      updateScrubber();
      drawPreview();
      alert(`✓ Đã tự động tạo ${(currentData.scenes || currentData.shots || []).length} phân cảnh!`);
    } else {
      alert('Lỗi phân tích: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  } finally {
    btnRunAutoDirector.disabled = false;
    btnRunAutoDirector.textContent = '⚡ Phân Tích & Tự Động Tạo Cảnh';
  }
}

async function compileScriptView() {
  const text = rawScriptInput.value;
  if (!text.trim()) return;
  try {
    const res = await fetch('/api/auto-director', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode: activeMode }),
    });
    const json = await res.json();
    if (json.ok && json.result) {
      currentData = json.result;
      populateMetaFields();
      renderSceneList();
      switchSubtab('storyboard');
      drawPreview();
    }
  } catch (err) {
    alert('Lỗi biên dịch kịch bản: ' + err.message);
  }
}

function applyJsonView() {
  try {
    const parsed = JSON.parse(rawJsonInput.value);
    currentData = parsed;
    populateMetaFields();
    renderSceneList();
    switchSubtab('storyboard');
    drawPreview();
    alert('✓ Đã áp dụng JSON thành công!');
  } catch (err) {
    alert('JSON không hợp lệ: ' + err.message);
  }
}

// TTS Generation
function pullSubtitlesToTts() {
  if (!currentData) return;
  let lines = [];
  if (activeMode === 'creepy_rules') {
    lines = (currentData.scenes || []).map(s => s.text).filter(Boolean);
  } else {
    lines = (currentData.shots || []).map(s => s.narration?.text || s.caption).filter(Boolean);
  }
  ttsScriptText.value = lines.join('. ');
}

async function doGenerateTts() {
  const text = ttsScriptText.value;
  if (!text.trim()) {
    alert('Vui lòng nhập văn bản lồng tiếng!');
    return;
  }
  btnDoGenerateTts.disabled = true;
  btnDoGenerateTts.textContent = '⏳ Đang tạo file âm thanh...';

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: ttsVoiceSelect.value,
      }),
    });
    const json = await res.json();
    if (json.ok && json.audioSrc) {
      alert(`✓ Đã tạo file giọng đọc thành công: ${json.audioSrc}`);
      ttsModal.style.display = 'none';
    } else {
      alert('Lỗi tạo giọng đọc: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Lỗi kết nối TTS: ' + err.message);
  } finally {
    btnDoGenerateTts.disabled = false;
    btnDoGenerateTts.textContent = '⚡ Tạo File Âm Thanh (.AIFF)';
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Start application
window.onload = initApp;
