import { AppRoute, AppRouter, initClient, type ApiFetcherArgs } from "@ts-rest/core";
import { handleLocalRequest } from "../local-api";

export const lastSeenServerCompatibility: number | undefined = undefined;

function isAppRoute(value: unknown): value is AppRoute {
  return typeof value === "object" && value !== null && "method" in value && "path" in value;
}

/** Maps every route object in the contract to its dotted name, e.g. "results.add". */
function nameRoutes(
  router: unknown,
  prefix: string[] = [],
  names = new Map<AppRoute, string>(),
): Map<AppRoute, string> {
  for (const [key, value] of Object.entries(router as Record<string, unknown>)) {
    if (isAppRoute(value)) {
      names.set(value, [...prefix, key].join("."));
    } else if (typeof value === "object" && value !== null) {
      nameRoutes(value, [...prefix, key], names);
    }
  }
  return names;
}

function buildApi(
  _timeout: number,
  routeNames: Map<AppRoute, string>,
): (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  return async (args) => {
    const local = await handleLocalRequest(routeNames.get(args.route), args);
    if (local !== undefined) return local;

    return {
      status: 503,
      body: { message: "Server features are disabled in this static build." },
      headers: new Headers(),
    };
  };
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
    api: buildApi(timeout, nameRoutes(contract)),
    baseHeaders: {
      Accept: "application/json",
      "X-Client-Version": "static",
    },
  });
}
