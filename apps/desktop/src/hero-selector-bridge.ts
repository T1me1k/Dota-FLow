import { HERO_CATALOG } from '../../../packages/core/src/hero-catalog.mjs';

const HERO_LABEL = 'hero';

function findHeroSelect(): HTMLSelectElement | null {
  for (const label of document.querySelectorAll('label')) {
    const text = label.childNodes[0]?.textContent?.trim().toLowerCase();
    if (text === HERO_LABEL) {
      return label.querySelector('select');
    }
  }
  return null;
}

export function populateHeroSelector(select: HTMLSelectElement): void {
  const selected = select.value || 'luna';
  const expectedIds = HERO_CATALOG.map((hero) => hero.id);
  const currentIds = Array.from(select.options, (option) => option.value);

  if (
    currentIds.length === expectedIds.length &&
    currentIds.every((id, index) => id === expectedIds[index])
  ) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const hero of HERO_CATALOG) {
    const option = document.createElement('option');
    option.value = hero.id;
    option.textContent = hero.displayName;
    fragment.append(option);
  }

  select.replaceChildren(fragment);
  select.value = expectedIds.includes(selected) ? selected : 'luna';
  select.dataset.heroCatalog = String(HERO_CATALOG.length);
}

function syncHeroSelector(): void {
  const select = findHeroSelect();
  if (select) populateHeroSelector(select);
}

const observer = new MutationObserver(syncHeroSelector);
observer.observe(document.documentElement, { childList: true, subtree: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncHeroSelector, { once: true });
} else {
  syncHeroSelector();
}
