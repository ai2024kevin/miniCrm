import minimalism from "../../../JSON_design_systems/minimalism-2.0-design-tokens.json";

export const branchTheme = {
  name: minimalism.name,
  accent: minimalism.colors.accent.primary,
  background: minimalism.colors.background.primary,
  surface: minimalism.components.cards.background,
  border: "#e5e5e5",
  text: minimalism.colors.text.primary,
  muted: minimalism.colors.text.secondary,
} as const;
