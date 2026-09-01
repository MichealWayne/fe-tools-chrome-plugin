import { restoreFocus } from '@/utils/focus';

type WorkspaceRef = { focusHeading?: () => void } | undefined;

export const useToolNavigation = () => ({
  focusWorkspace: (workspace: WorkspaceRef): void => {
    workspace?.focusHeading?.();
  },
  restoreHomeFocus: (trigger: HTMLElement | null | undefined, fallback: HTMLElement | null) => {
    restoreFocus(trigger, fallback);
  },
});
