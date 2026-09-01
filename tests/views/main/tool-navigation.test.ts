import { describe, expect, it } from 'vitest';
import { useToolNavigation } from '@/views/main/useToolNavigation';
import { getNextResultIndex, useToolSearch } from '@/views/main/useToolSearch';

describe('main view search and navigation helpers', () => {
  it('wraps keyboard result movement and resets selection', () => {
    expect(getNextResultIndex(-1, 3, 1)).toBe(0);
    expect(getNextResultIndex(0, 3, -1)).toBe(2);
    expect(getNextResultIndex(2, 3, 1)).toBe(0);
    expect(getNextResultIndex(0, 0, 1)).toBe(-1);
    expect(useToolSearch().resetSelection()).toBe(-1);
  });

  it('focuses a workspace and restores the previous trigger', () => {
    const heading = document.createElement('h2');
    heading.tabIndex = -1;
    const trigger = document.createElement('button');
    const fallback = document.createElement('input');
    document.body.append(heading, trigger, fallback);
    const focusHeading = () => heading.focus();
    const navigation = useToolNavigation();

    navigation.focusWorkspace({ focusHeading });
    expect(document.activeElement).toBe(heading);

    navigation.restoreHomeFocus(trigger, fallback);
    expect(document.activeElement).toBe(trigger);
    heading.remove();
    trigger.remove();
    fallback.remove();
  });
});
