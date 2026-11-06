import * as ExpoHaptics from "expo-haptics";

/** Fire-and-forget haptics; never throws on devices or simulators without a motor. */
export const haptics = {
  tap: () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  success: () => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => undefined),
  error: () => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error).catch(() => undefined),
};
