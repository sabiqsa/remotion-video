// Video "kenapa hujan sering turun sore?" — 1080x1920, 60fps.
// Hook (santai berjemur → diguyur) -> awan punya jam kerja -> 3 langkah (panas, naik &
// ngembun, numpuk → tumpah) -> data puncak sore -> tiap daerah beda -> payung -> petir -> komen.

import { Audio } from "@remotion/media";
import React, { useEffect } from "react";
import { AbsoluteFill, prefetch, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandClosingPixel } from "../brand/BrandClosingPixel";
import { HandleWatermark } from "../brand/HandleWatermark";
import { PointCounter } from "../brand/PointCounter";
import { SourceWatermark } from "../brand/SourceWatermark";
import { VO_LEAD } from "../brand/voiceover";
import { WordText } from "../brand/WordText";
import { sec } from "../lib/motion";
import { SFX } from "./sfx";
import { Overlay } from "./Overlay";
import { CANVAS_TOP, Scene3D, skyAt } from "./Scene3D";
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

/** Langit: terik (default) ↔ mendung sore ↔ malam; berganti hanya pada ketukan cerita. */
const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sky = skyAt(frame / fps);
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 66%, #3f6fa8 0%, rgba(30,60,110,0) 60%), linear-gradient(180deg, #2a3f63 0%, #3a5a85 55%, #1d2c46 100%)",
          opacity: sky.grey,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 66%, #26357a 0%, rgba(20,28,70,0) 58%), linear-gradient(180deg, #050816 0%, #0c1233 55%, #04060f 100%)",
          opacity: sky.night,
        }}
      />
    </>
  );
};

export const HujanSore: React.FC = () => {
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
        background:
          "radial-gradient(circle at 50% 66%, #7fc8ff 0%, rgba(90,170,240,0) 60%), linear-gradient(180deg, #1f78d1 0%, #47a3ec 55%, #1a5fa8 100%)",
      }}
    >
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="langit" layout="none">
        <Sky />
      </Sequence>
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="3d + overlay" layout="none">
        <div style={{ position: "absolute", left: 0, top: CANVAS_TOP }}>
          <Scene3D width={width} height={height - CANVAS_TOP} />
        </div>
        <Overlay />
      </Sequence>

      <PointCounter scenes={SCENES} showFrom={sceneById("promise").start} total={3} />
      <Sequence durationInFrames={sec(CONTENT_SECONDS, fps)} name="watermark" layout="none">
        <SourceWatermark name={SOURCE.name} />
        <HandleWatermark
          cuts={SCENES.map((s) => s.start)}
          spots={[
            { left: 90, top: 1540 },
            { right: 160, top: 1540 },
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
