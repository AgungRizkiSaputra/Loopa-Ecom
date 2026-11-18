export interface AuthTransitionPayload {
  mode: "login" | "logout";
  name?: string;
  roleLabel?: string;
}

export function startAuthTransition(
  payload: AuthTransitionPayload,
  onNavigate: () => void,
  durationMs = 950
) {
  if (typeof window === "undefined") {
    onNavigate();
    return;
  }

  window.dispatchEvent(
    new CustomEvent("loopa_auth_transition", {
      detail: { ...payload, active: true },
    })
  );

  setTimeout(() => {
    onNavigate();
    // Keep overlay smoothly visible briefly during route transition, then fade out
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("loopa_auth_transition", {
          detail: { active: false },
        })
      );
    }, 350);
  }, durationMs);
}
