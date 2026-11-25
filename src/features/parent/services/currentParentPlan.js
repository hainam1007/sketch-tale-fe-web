export function getCurrentParentPlan(user) {
  const profile = user?.parentProfile ?? user?.ParentProfile;
  const plan = profile?.subscriptionPlan ?? profile?.SubscriptionPlan;
  return {
    id: profile?.subscriptionPlanId ?? profile?.SubscriptionPlanId ?? plan?.id ?? plan?.Id ?? null,
    name: plan?.name ?? plan?.Name ?? profile?.currentPlan ?? profile?.CurrentPlan ?? null,
  };
}

export function hasProPlan(user) {
  const { name } = getCurrentParentPlan(user);
  return String(name ?? "").trim().toLowerCase() === "pro";
}
