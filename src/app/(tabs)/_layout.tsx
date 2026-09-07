import AppTabs from '@/components/app-tabs';

/**
 * The tab shell. `AppTabs` resolves to the native `NativeTabs` navigator on
 * iOS/Android and the `expo-router/ui` tab bar on web. Non-tab screens
 * (auth, detail pages, modals) live one level up under the root `<Stack>` so
 * they can be pushed over the tabs.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
