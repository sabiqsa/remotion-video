// Video "kenapa suka gigitin kuku?" — 1080x1920, 60fps.
// Hook (nonton horor → gigi kelinci + KRIUK) -> onikofagia (3 dari 10 orang) -> 3 pemicu (cemas,
// bosan, mikir keras) -> sarang kuman (macro mikroskop) + gigi retak -> tips -> minta bantuan ->
// kamu gigit kuku pas apa?

import { Audio } from "@remotion/media";
import React, { useEffect } from "react";
import { AbsoluteFill, prefetch, Sequence, staticFile, useVideoConfig } from "remotion";
import { BrandClosingPixel } from "../brand/BrandClosingPixel";
import { HandleWatermark } from "../brand/HandleWatermark";
import { PointCounter } from "../brand/PointCounter";
import { SourceWatermark } from "../brand/SourceWatermark";
import { VO_LEAD } from "../brand/voiceover";
import { WordText } from "../brand/WordText";
import { sec } from "../lib/motion";
import { SFX } from "./sfx";
import { Overlay } from "./Overlay";
import { Scene3D } from "./Scene3D";
import { CLOSING_SECONDS, CONTENT_SECONDS, sceneById, SCENES, SOURCE } from "./script";
import { VO } from "./vo.generated";


/** Gain global efek suara (menjaga true peak ≤ −1.5 dBTP). */
const SFX_GAIN = 0.9;

/** Ducking: narasi turun ±4.4 dB selama 0.25 dtk saat efek suara berbunyi (dengan transisi halus). */
const DUCK = 0.6;
const voDuck = (t: number) => {
  let g = 1;
  for (const [at] of SFX) {
    const d = t - at;
    if (d > -0.05 && d < 0.3) {
      const k = d < 0 ? (d + 0.05) / 0.05 : d > 0.2 ? 1 - (d - 0.2) / 0.1 : 1;
      g = Math.min(g, 1 - (1 - DUCK) * Math.max(0, Math.min(1, k)));
    }
  }
  return g;
};

/** Muat semua file audio lebih dulu supaya preview Studio tidak telat/terlewat saat bunyi pertama kali diputar. */
const usePrefetchAudio = (files: string[]) => {
  useEffect(() => {
    const handles = files.map((f) => prefetch(staticFile(f)));
    return () => handles.forEach((h) => h.free());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.join("|")]);
};

export const GigitKuku: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  usePrefetchAudio([
    ...new Set(SFX.map(([, f]) => `sfx/${f}.wav`)),
    ...SCENES.flatMap((s) => (VO[s.id] ? [VO[s.id]!.file] : [])),
    "sfx/click.wav",
    "sfx/closing-vo.wav",
  ]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1638 0%, #2a2550 60%, #120f26 100%)",
      }}
    >
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="3d + overlay" layout="none">
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Scene3D width={width} height={height} />
        </div>
        <Overlay />
      </Sequence>

      <PointCounter scenes={SCENES} showFrom={sceneById("promise").start} total={3} />
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="watermark" layout="none">
        <SourceWatermark name={SOURCE.name} note={SOURCE.note} />
        <HandleWatermark
          cuts={SCENES.map((s) => s.start)}
          spots={[
            { right: 160, top: 1500 },
            { left: 90, top: 1180 },
            { left: 90, top: 1500 },
            { right: 160, top: 1180 },
          ]}
        />
      </Sequence>

      {SCENES.filter((s) => s.lines.length > 0).map((s) => (
        <Sequence key={s.id} from={sec(s.start, fps)} durationInFrames={sec(s.duration, fps)} name={s.id}>
          <div style={{ position: "absolute", left: 80, right: 140, top: 320 }}>
            <WordText lines={s.lines} duration={s.duration} />
          </div>
        </Sequence>
      ))}

      {/* voiceover per scene (kosong sampai vo.generated.ts diisi) */}
      {SCENES.map((s) => {
        const clip = VO[s.id];
        if (!clip) return null;
        return (
          <Sequence key={`vo-${s.id}`} from={sec(s.start + VO_LEAD, fps)} name={`vo ${s.id}`} layout="none">
            <Audio src={staticFile(clip.file)} volume={(f) => voDuck(s.start + VO_LEAD + f / fps)} />
          </Sequence>
        );
      })}

      {SFX.map(([at, file, volume], i) => (
        <Sequence key={`sfx-${i}`} from={sec(at, fps)} name={`sfx ${file}`} layout="none">
          <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume * SFX_GAIN} />
        </Sequence>
      ))}

      <Sequence from={sec(CONTENT_SECONDS, fps)} durationInFrames={sec(CLOSING_SECONDS, fps)} name="closing">
        <BrandClosingPixel />
      </Sequence>
    </AbsoluteFill>
  );
};
