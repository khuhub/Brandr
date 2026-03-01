/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_email from "../actions/email.js";
import type * as actions_gemini from "../actions/gemini.js";
import type * as actions_runAudit from "../actions/runAudit.js";
import type * as actions_scoring from "../actions/scoring.js";
import type * as audits from "../audits.js";
import type * as campaigns from "../campaigns.js";
import type * as findings from "../findings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/email": typeof actions_email;
  "actions/gemini": typeof actions_gemini;
  "actions/runAudit": typeof actions_runAudit;
  "actions/scoring": typeof actions_scoring;
  audits: typeof audits;
  campaigns: typeof campaigns;
  findings: typeof findings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
