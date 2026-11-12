// Static build: settings are kept in this browser's localStorage only, and
// there is no server to save them to.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveConfig(_config: unknown): Promise<void> {
  // nothing to do: the config is already in localStorage
}

export async function deleteConfig(): Promise<void> {
  // nothing to do: resetting only touches localStorage
}
