export function firstNameFromValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.split(/\s+/)[0] : null;
}

export function resolveDisplayFirstName(
  preferredName: string | null | undefined,
  fullName: string | null | undefined,
  profileFirstName: string | null | undefined,
) {
  return preferredName?.trim() || firstNameFromValue(fullName) || firstNameFromValue(profileFirstName) || null;
}
