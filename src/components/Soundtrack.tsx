import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import {
  SFX_TELEPORT_POP,
  SFX_BODY_THUD,
  SFX_BUS_ENGINE,
  SFX_HUD_BEEP,
  SFX_QUANTUM_BEAM,
  SFX_DATA_SCAN,
} from '../utils/synthSfx';

interface SoundtrackProps {
  /** Đặt thành true sau khi có file public/voiceover.mp3 */
  enableVoiceover?: boolean;
}

export const Soundtrack: React.FC<SoundtrackProps> = ({ enableVoiceover = true }) => {
  return (
    <>
      {/* =======================================================
          1. LỒNG TIẾNG GỐC (VOICEOVER MP3 TRONG THƯ MỤC PUBLIC)
         ======================================================= */}
      {enableVoiceover && <Audio src={staticFile('voiceover.mp3')} volume={1.0} />}

      {/* =======================================================
          2. HIỆU ỨNG ÂM THANH (SFX) ĐỒNG BỘ CHÍNH XÁC TỪNG FRAME
         ======================================================= */}

      {/* [00:00 - Frame 0] Tiếng động cơ xe buýt rời khỏi góc phố */}
      <Sequence durationInFrames={105}>
        <Audio src={SFX_BUS_ENGINE} volume={0.55} />
      </Sequence>

      {/* [00:03 - Frame 95] Tiếng bíp cảnh báo thiếu 1 chiếc giày trên hiên nhà */}
      <Sequence from={95} durationInFrames={15}>
        <Audio src={SFX_HUD_BEEP} volume={0.6} />
      </Sequence>

      {/* [00:05.8 - Frame 175] Tiếng bíp kép khóa mục tiêu ghế sau xe buýt */}
      <Sequence from={175} durationInFrames={15}>
        <Audio src={SFX_HUD_BEEP} volume={0.65} />
      </Sequence>
      <Sequence from={183} durationInFrames={15}>
        <Audio src={SFX_HUD_BEEP} volume={0.75} />
      </Sequence>

      {/* [00:11.1 - Frame 333] *BLINK!* Tiếng nổ POP dịch chuyển lên xe buýt */}
      <Sequence from={333} durationInFrames={20}>
        <Audio src={SFX_TELEPORT_POP} volume={0.95} />
      </Sequence>

      {/* [00:11.5 - Frame 345] Tiếng rơi bịch lên đùi hành khách áo cam */}
      <Sequence from={345} durationInFrames={20}>
        <Audio src={SFX_BODY_THUD} volume={0.9} />
      </Sequence>

      {/* [00:25.1 - Frame 753] Tiếng nổ POP chuyển sang Title Card "WHAT IF YOU COULD TELEPORT?" */}
      <Sequence from={753} durationInFrames={20}>
        <Audio src={SFX_TELEPORT_POP} volume={0.9} />
      </Sequence>

      {/* [00:27.6 & 00:30.1 - Frame 830 & 905] Nhân vật nhảy qua 3 cổng Portal trong Title Card */}
      <Sequence from={830} durationInFrames={15}>
        <Audio src={SFX_TELEPORT_POP} volume={0.65} />
      </Sequence>
      <Sequence from={905} durationInFrames={15}>
        <Audio src={SFX_TELEPORT_POP} volume={0.65} />
      </Sequence>

      {/* [00:35.0 - Frame 1050] Tiếng tia Laser lượng tử thí nghiệm Innsbruck 1997 */}
      <Sequence from={1050} durationInFrames={90}>
        <Audio src={SFX_QUANTUM_BEAM} volume={0.6} />
      </Sequence>

      {/* [00:45.5 - Frame 1365] Tiếng chùm tia lượng tử từ vệ tinh Micius (1,400 KM) */}
      <Sequence from={1365} durationInFrames={90}>
        <Audio src={SFX_QUANTUM_BEAM} volume={0.7} />
      </Sequence>

      {/* [00:52.0 - Frame 1560] Tiếng Bíp so sánh 1 Photon vs Cơ thể người */}
      <Sequence from={1560} durationInFrames={15}>
        <Audio src={SFX_HUD_BEEP} volume={0.7} />
      </Sequence>

      {/* [00:56.0 - Frame 1680] Tiếng quét dữ liệu cơ thể người 43 chữ số */}
      <Sequence from={1680} durationInFrames={120}>
        <Audio src={SFX_DATA_SCAN} volume={0.55} />
      </Sequence>

      {/* [01:00.6 - Frame 1820] Tiếng bíp kích hoạt đồng hồ 350,000x tuổi vũ trụ */}
      <Sequence from={1820} durationInFrames={15}>
        <Audio src={SFX_HUD_BEEP} volume={0.8} />
      </Sequence>
    </>
  );
};
