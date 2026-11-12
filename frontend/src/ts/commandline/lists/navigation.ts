import { navigate } from "../../router/navigate";
import { toggleFullscreen } from "../../utils/misc";
import { Command } from "../types";
const commands: Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    fa: { icon: "fa-keyboard" },
    exec: () => {
      void navigate({ to: "/" });
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    fa: { icon: "fa-cog" },
    exec: () => {
      void navigate({ to: "/settings" });
    },
  },
  {
    id: "toggleFullscreen",
    display: "Toggle Fullscreen",
    fa: { icon: "fa-expand" },
    exec: () => {
      toggleFullscreen();
    },
  },
];
export default commands;
