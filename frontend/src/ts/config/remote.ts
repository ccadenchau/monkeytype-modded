import * as ConfigSchemas from "@monkeytype/schemas/configs";

import { migrateConfig } from "./utils";
import Ape from "../ape";
import { UserDataLoadError } from "../utils/user-data-load-error";
import { getDefaultConfig } from "../constants/default-config";

// Static build: the config lives in this browser's localStorage and there is
// no server copy, so nothing is applied over it. (The local "server" config is
// only the defaults, applying it would reset the user's settings on every load.)
export async function applyFromServer(
  _remoteConfig: ConfigSchemas.Config,
): Promise<void> {
  // intentionally empty
}

export async function fetchFromServer(): Promise<ConfigSchemas.Config> {
  const response = await Ape.configs.get();

  if (response.status !== 200) {
    throw new UserDataLoadError(
      `${response.body.message} (config)`,
      response.status,
    );
  }

  const configData = response.body.data;
  if (configData !== null && "config" in configData) {
    throw new Error(
      "Config data is not in the correct format. Please refresh the page or contact support.",
    );
  }

  if (configData === undefined || configData === null) {
    return {
      ...getDefaultConfig(),
    };
  } else {
    return migrateConfig(configData);
  }
}
