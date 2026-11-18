import { Composition, Folder, Still } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { KenapaNgantuk } from "./KenapaNgantuk";
import { KopiNgantuk } from "./KopiNgantuk";
import { FPS as KN_FPS, TOTAL_SECONDS as KN_TOTAL } from "./KopiNgantuk/script";
import { MasukAngin } from "./MasukAngin";
import { FPS as MA_FPS, TOTAL_SECONDS as MA_TOTAL } from "./MasukAngin/script";
import { BrandClosing, BRAND_CLOSING_SECONDS } from "./brand/BrandClosing";
import { BrandClosingPixel, PIXEL_CLOSING_SECONDS } from "./brand/BrandClosingPixel";
import { CharacterLineup } from "./brand/CharacterLineup";
import { ChannelBanner, ChannelWatermark, ProfilePicture } from "./brand/ChannelArt";
import { FaceSheet } from "./brand/FaceSheet";
import { WardrobeSheet } from "./brand/WardrobeSheet";
import { FPS, TOTAL_SECONDS } from "./KenapaNgantuk/script";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KenapaNgantuk"
        component={KenapaNgantuk}
        durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="MasukAngin"
        component={MasukAngin}
        durationInFrames={Math.round(MA_TOTAL * MA_FPS)}
        fps={MA_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KopiNgantuk"
        component={KopiNgantuk}
        durationInFrames={Math.round(KN_TOTAL * KN_FPS)}
        fps={KN_FPS}
        width={1080}
        height={1920}
      />
      <Folder name="Brand">
        <Composition
          id="BrandClosing"
          component={BrandClosing}
          durationInFrames={BRAND_CLOSING_SECONDS * 60}
          fps={60}
          width={1080}
          height={1920}
          defaultProps={{}}
        />
        <Composition
          id="BrandClosingPixel"
          component={BrandClosingPixel}
          durationInFrames={PIXEL_CLOSING_SECONDS * 60}
          fps={60}
          width={1080}
          height={1920}
          defaultProps={{}}
        />
        <Still id="FaceSheet" component={FaceSheet} width={1600} height={900} />
        <Still id="WardrobeSheet" component={WardrobeSheet} width={2400} height={1800} />
        <Composition
          id="CharacterLineup"
          component={CharacterLineup}
          durationInFrames={240}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{}}
        />
      </Folder>
      <Folder name="YouTube">
        <Still id="ChannelBanner" component={ChannelBanner} width={2560} height={1440} defaultProps={{ showGuides: false }} />
        <Still id="ProfilePicture" component={ProfilePicture} width={800} height={800} />
        <Still id="ChannelWatermark" component={ChannelWatermark} width={150} height={150} />
      </Folder>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};
