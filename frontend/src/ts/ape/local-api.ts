import type { ApiFetcherArgs } from "@ts-rest/core";
import { getFunbox } from "@monkeytype/funbox";
import type { AddResultRequest } from "@monkeytype/contracts/results";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import type { CustomTheme } from "@monkeytype/schemas/users";
import type { PersonalBest } from "@monkeytype/schemas/shared";
import type { Configuration } from "@monkeytype/schemas/configuration";
import {
  LOCAL_ACCOUNT_UID,
  LocalUser,
  StoredResult,
  emptyPersonalBests,
  getLocalUser,
  getStoredResult,
  getStoredResults,
  putLocalUser,
  storeResultAndUser,
} from "./local-account";

/**
 * Answers the API routes the account needs from this browser's storage, so
 * results, personal bests and account data work without a server. Routes not
 * handled here are left to the caller.
 */

export type LocalResponse = {
  status: number;
  body: { message: string; data?: unknown };
  headers: Headers;
};

type Handler = (args: ApiFetcherArgs) => Promise<LocalResponse>;

function reply(status: number, message: string, data?: unknown): LocalResponse {
  return {
    status,
    body: data === undefined ? { message } : { message, data },
    headers: new Headers(),
  };
}

// The static build has no server configuration. These values turn off the
// server-side features and keep the local ones (results saving) on.
const localConfiguration: Configuration = {
  maintenance: false,
  dev: { responseSlowdownMs: 0 },
  quotes: {
    reporting: { enabled: false, maxReports: 0, contentReportLimit: 0 },
    submissionsEnabled: false,
    maxFavorites: 0,
  },
  results: {
    savingEnabled: true,
    objectHashCheckEnabled: false,
    filterPresets: { enabled: false, maxPresetsPerUser: 0 },
    limits: { regularUser: 1000, premiumUser: 1000 },
    maxBatchSize: 0,
  },
  users: {
    signUp: false,
    lastHashesCheck: { enabled: false, maxHashes: 0 },
    autoBan: { enabled: false, maxCount: 0, maxHours: 0 },
    profiles: { enabled: false },
    discordIntegration: { enabled: false },
    xp: {
      enabled: false,
      funboxBonus: 0,
      gainMultiplier: 0,
      maxDailyBonus: 0,
      minDailyBonus: 0,
      streak: { enabled: false, maxStreakDays: 0, maxStreakMultiplier: 0 },
    },
    inbox: { enabled: false, maxMail: 0 },
    premium: { enabled: false },
  },
  admin: { endpointsEnabled: false },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 0,
    apeKeySaltRounds: 0,
  },
  rateLimiting: {
    badAuthentication: { enabled: false, penalty: 0, flaggedStatusCodes: [] },
  },
  dailyLeaderboards: {
    enabled: false,
    leaderboardExpirationTimeInDays: 0,
    maxResults: 0,
    validModeRules: [],
    scheduleRewardsModeRules: [],
    topResultsToAnnounce: 1,
    xpRewardBrackets: [],
  },
  leaderboards: {
    minTimeTyping: 0,
    weeklyXp: { enabled: false, expirationTimeInDays: 0, xpRewardBrackets: [] },
  },
  connections: { enabled: false, maxPerUser: 0 },
};

function newResultId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function matchesPb(
  pb: PersonalBest,
  key: {
    punctuation: boolean;
    numbers: boolean;
    difficulty: string;
    language: string;
    lazyMode: boolean;
  },
): boolean {
  return (
    (pb.punctuation ?? false) === key.punctuation &&
    (pb.numbers ?? false) === key.numbers &&
    pb.difficulty === key.difficulty &&
    pb.language === key.language &&
    (pb.lazyMode ?? false) === key.lazyMode
  );
}

function findPb(user: LocalUser, result: CompletedEvent): PersonalBest | undefined {
  const list = (
    user.personalBests[result.mode] as Record<string, PersonalBest[] | undefined> | undefined
  )?.[result.mode2];
  return list?.find((pb) => matchesPb(pb, keyOf(result)));
}

function keyOf(result: CompletedEvent): {
  punctuation: boolean;
  numbers: boolean;
  difficulty: string;
  language: string;
  lazyMode: boolean;
} {
  return {
    punctuation: result.punctuation,
    numbers: result.numbers,
    difficulty: result.difficulty,
    language: result.language,
    lazyMode: result.lazyMode ?? false,
  };
}

/** Same rule as the server: quotes never count, and a PB must beat the old one. */
function isNewPb(user: LocalUser, result: CompletedEvent): boolean {
  if (result.mode === "quote") return false;
  if (!getFunbox(result.funbox).every((f) => f.canGetPb)) return false;
  const existing = findPb(user, result);
  return existing === undefined || result.wpm > existing.wpm;
}

function savePb(user: LocalUser, result: CompletedEvent): void {
  const pb = {
    wpm: result.wpm,
    acc: result.acc,
    raw: result.rawWpm,
    consistency: result.consistency,
    timestamp: Date.now(),
    lazyMode: result.lazyMode ?? false,
  };

  const byMode = (user.personalBests[result.mode] ??= {}) as Record<
    string,
    PersonalBest[] | undefined
  >;
  const list = (byMode[result.mode2] ??= []);
  const existing = list.find((it) => matchesPb(it, keyOf(result)));
  if (existing !== undefined) {
    Object.assign(existing, pb);
  } else {
    list.push({
      ...pb,
      language: result.language,
      difficulty: result.difficulty,
      punctuation: result.punctuation,
      numbers: result.numbers,
    });
  }
}

const handlers: Record<string, Handler> = {
  "users.get": async () => {
    const user = await getLocalUser();
    return reply(200, "ok", {
      uid: LOCAL_ACCOUNT_UID,
      name: user.name,
      email: "",
      addedAt: user.addedAt,
      personalBests: user.personalBests,
      completedTests: user.completedTests,
      startedTests: user.startedTests,
      timeTyping: user.timeTyping,
      allTimeLbs: {
        time: {
          15: { english: { count: 0, rank: 0 } },
          60: { english: { count: 0, rank: 0 } },
        },
      },
    });
  },

  "users.deletePersonalBests": async () => {
    const user = await getLocalUser();
    user.personalBests = emptyPersonalBests();
    await putLocalUser(user);
    return reply(200, "Personal bests deleted");
  },

  "users.getTags": async () => reply(200, "ok", []),

  "users.getCustomThemes": async () => {
    const user = await getLocalUser();
    return reply(200, "ok", user.customThemes ?? []);
  },

  "users.addCustomTheme": async (args) => {
    const body = args.rawBody as { name: string; colors: CustomTheme["colors"] };
    const user = await getLocalUser();
    const theme: CustomTheme = {
      _id: newResultId(),
      name: body.name,
      colors: body.colors,
    };
    user.customThemes = [...(user.customThemes ?? []), theme];
    await putLocalUser(user);
    return reply(200, "Theme added", { _id: theme._id, name: theme.name });
  },

  "users.editCustomTheme": async (args) => {
    const body = args.rawBody as {
      themeId: string;
      theme: { name: string; colors: CustomTheme["colors"] };
    };
    const user = await getLocalUser();
    const themes = user.customThemes ?? [];
    const theme = themes.find((t) => t._id === body.themeId);
    if (theme === undefined) return reply(404, "Theme not found");
    theme.name = body.theme.name;
    theme.colors = body.theme.colors;
    await putLocalUser(user);
    return reply(200, "Theme updated");
  },

  "users.deleteCustomTheme": async (args) => {
    const body = args.rawBody as { themeId: string };
    const user = await getLocalUser();
    user.customThemes = (user.customThemes ?? []).filter(
      (t) => t._id !== body.themeId,
    );
    await putLocalUser(user);
    return reply(200, "Theme deleted");
  },

  "presets.get": async () => reply(200, "ok", []),

  "configs.get": async () => reply(200, "ok", null),

  "configuration.get": async () => reply(200, "ok", localConfiguration),

  "results.add": async (args) => {
    // The client builds this result itself and the data stays in this browser,
    // so it is stored as sent; the server's strict schema is not repeated here.
    const body = args.rawBody as AddResultRequest | undefined;
    if (typeof body?.result !== "object" || body.result === null) {
      return reply(463, "Result data invalid");
    }
    const event: CompletedEvent = body.result;
    const user = await getLocalUser();

    const isPb = isNewPb(user, event);
    if (isPb) savePb(user, event);

    user.completedTests += 1;
    user.startedTests += event.restartCount + 1;
    user.timeTyping += event.testDuration + event.incompleteTestSeconds - event.afkDuration;

    const stored: StoredResult = {
      ...event,
      _id: newResultId(),
      isPb,
    };
    await storeResultAndUser(stored, user);

    // XP, streaks and leaderboards are server features; they are not sent,
    // so the client leaves those values unchanged.
    return reply(200, "Result saved", {
      insertedId: stored._id,
      isPb,
      tagPbs: [],
    });
  },

  "results.get": async () => reply(200, "ok", await getStoredResults()),

  "results.getById": async (args) => {
    const id = args.path.split("/").pop() ?? "";
    const result = await getStoredResult(id);
    if (result === undefined) return reply(404, "Result not found");
    return reply(200, "ok", result);
  },
};

/**
 * Serves `routeName` locally, or returns `undefined` when it is not a local
 * route. Errors become a 500 response.
 */
export async function handleLocalRequest(
  routeName: string | undefined,
  args: ApiFetcherArgs,
): Promise<LocalResponse | undefined> {
  if (routeName === undefined) return undefined;
  const handler = handlers[routeName];
  if (handler === undefined) return undefined;

  try {
    return await handler(args);
  } catch (e) {
    console.error(`Local account request ${routeName} failed`, e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return reply(500, `Local storage error: ${message}`);
  }
}
