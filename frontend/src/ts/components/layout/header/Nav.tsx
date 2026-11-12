import { JSXElement } from "solid-js";
import { getRoutePage } from "../../../states/router";
import { isFocusMode } from "../../../states/test";
import { restartTest } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function Nav(): JSXElement {
  const buttonClass = () => cn("aspect-square", { "opacity-(--nav-focus-opacity)": isFocusMode() });
  return (
    <nav class="z-5 flex w-full items-center gap-1 md:gap-2">
      <Button
        variant="text"
        fa={{ icon: "fa-keyboard", fixedWidth: true }}
        to="/"
        class={buttonClass()}
        dataset={{ "data-nav-item": "test" }}
        onClick={() => {
          if (getRoutePage() === "test") void restartTest();
        }}
      />
      <Button
        variant="text"
        fa={{ icon: "fa-cog", fixedWidth: true }}
        to="/settings"
        class={buttonClass()}
        dataset={{ "data-nav-item": "settings" }}
      />
    </nav>
  );
}
