import {
  AppRouter,
  initClient,
  type ApiFetcherArgs,
} from "@ts-rest/core";

export const lastSeenServerCompatibility: number | undefined = undefined;

function buildApi(_timeout: number): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  return async () => ({
    status: 503,
    body: { message: "Server features are disabled in this static build." },
    headers: new Headers(),
  });
}

// oxlint-disable-next-line explicit-function-return-type
export function buildClient<T extends AppRouter>(
  contract: T,
  _baseUrl: string,
  timeout: number = 10_000,
) {
  return initClient(contract, {
    baseUrl: _baseUrl,
    jsonQuery: true,
    api: buildApi(timeout),
    baseHeaders: {
      Accept: "application/json",
      "X-Client-Version": "static",
    },
  });
}
