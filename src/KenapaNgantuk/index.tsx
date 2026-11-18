// Video v2 "kenapa habis makan ngantuk?" — 1080x1920, 60fps.
// Hook -> janji isi -> 5 poin -> makanan -> penutup -> closing pixel. Sumber = watermark.

import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BrandClosingPixel } from "../brand/BrandClosingPixel";
import { sec } from "../lib/motion";
import { HandleWatermark } from "../brand/HandleWatermark";
import { SourceWatermark } from "../brand/SourceWatermark";
import { VO_LEAD } from "../brand/voiceover";
import { WordText } from "../brand/WordText";
import { FoodTicker, PointCounter } from "./Overlay";
import { Scene3D } from "./Scene3D";
import { CLOSING_SECONDS, CONTENT_SECONDS, SCENES, SOURCE } from "./script";
import { VO } from "./vo.generated";

const CANVAS_TOP = 600;

export const KenapaNgantuk: React.FC = () => {
  const { width, height, fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 66%, #26357a 0%, rgba(20,28,70,0) 58%), linear-gradient(180deg, #0a0f2c 0%, #121a46 55%, #090d26 100%)",
      }}
    >
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="3d" layout="none">
        <div style={{ position: "absolute", left: 0, top: CANVAS_TOP }}>
          <Scene3D width={width} height={height - CANVAS_TOP} />
        </div>
      </Sequence>

      <PointCounter />
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="watermark sumber" layout="none">
        <SourceWatermark name={SOURCE.name} />
        <HandleWatermark cuts={SCENES.map((sc) => sc.start)} />
      </Sequence>

      {SCENES.filter((s) => s.lines.length > 0).map((s) => (
        <Sequence
          key={s.id}
          from={sec(s.start, fps)}
          durationInFrames={sec(s.duration, fps)}
          name={s.id}
        >
          <div style={{ position: "absolute", left: 80, right: 140, top: 320 }}>
            <WordText lines={s.lines} duration={s.duration} />
            {s.id === "food" ? <FoodTicker /> : null}
          </div>
        </Sequence>
      ))}

      {/* voiceover per scene (kosong sampai vo.generated.ts diisi) */}
      {SCENES.map((s) => {
        const clip = VO[s.id];
        if (!clip) return null;
        return (
          <Sequence key={`vo-${s.id}`} from={sec(s.start + VO_LEAD, fps)} name={`vo ${s.id}`} layout="none">
            <Audio src={staticFile(clip.file)} />
          </Sequence>
        );
      })}

      <Sequence
        from={sec(CONTENT_SECONDS, fps)}
        durationInFrames={sec(CLOSING_SECONDS, fps)}
        name="closing"
      >
        <BrandClosingPixel />
      </Sequence>
    </AbsoluteFill>
  );
};
