import { createAuthRouter } from "./api/router.js";

export function initAuthModule() {
  return {
    router: createAuthRouter(),
  };
}
