import { JSXElement } from "solid-js";

import { showCommandline } from "../../../states/commandline";
import { getIsScreenshotting } from "../../../states/core";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";
import { ScrollToTop } from "../footer/ScrollToTop";
import { Banners } from "./Banners";
import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";
import { Notifications } from "./Notifications";
import { SkillIssueFix } from "./SkillIssueFix";

export function Overlays(): JSXElement {
  return (
    <>
      <ScrollToTop />
      <button
        type="button"
        id="commandLineMobileButton"
        class={cn(
          "fixed bottom-8 left-8 z-99 hidden h-12 w-12 rounded-full bg-main text-center leading-12 text-bg",
          {
            "opacity-0": getIsScreenshotting(),
          },
        )}
        onClick={() => {
          showCommandline();
        }}
        tabIndex="-1"
      >
        <Fa icon="fa-terminal" />
      </button>
      <Banners />
      <Notifications />
      <LoaderBar />
      <FpsCounter />
      <SkillIssueFix />
    </>
  );
}
