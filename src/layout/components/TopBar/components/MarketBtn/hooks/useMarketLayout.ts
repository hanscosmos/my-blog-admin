import type { MarketGroupType, MarketItemType } from '@/api/market/type';
import type { MaybeRefOrGetter } from 'vue';
import { useStorage } from '@vueuse/core';

export const FAVORITE_GROUP_KEY = 'favorites';

export type FavoriteRefType = {
  groupKey: string;
  itemKey: string;
};

export type MarketLayoutType = {
  /** 普通板块顺序（不含固定置顶的自选板块） */
  groupOrder: string[];
  /** groupKey -> 指标 uid 顺序 */
  itemOrder: Record<string, string[]>;
  /** 自选指标，数组顺序即自选板块内的展示顺序 */
  favorites: FavoriteRefType[];
};

export type MarketDisplayItemType = MarketItemType & {
  uid: string;
  sourceGroupKey: string;
};

export type MarketDisplayGroupType = Omit<MarketGroupType, 'items'> & {
  items: MarketDisplayItemType[];
  isFavorite: boolean;
};

export type MarketItemMovePayloadType = {
  groupKey: string;
  fromUid: string;
  toUid: string;
};

export const marketItemUid = (groupKey: string, itemKey: string) =>
  `${groupKey}:${itemKey}`;

const createDefaultLayout = (): MarketLayoutType => ({
  groupOrder: [],
  itemOrder: {},
  favorites: [],
});

const sortByOrder = <T>(
  items: T[],
  order: string[],
  getKey: (item: T) => string
) => {
  if (!order.length) return items;
  const orderMap = new Map(order.map((key, index) => [key, index]));
  return [...items].sort((a, b) => {
    const aIndex = orderMap.get(getKey(a)) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.get(getKey(b)) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
};

/** 保留已存在的顺序，把新增项追加到末尾 */
const normalizeOrder = (order: string[], keys: string[]) => {
  const valid = order.filter((key) => keys.includes(key));
  const missing = keys.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
};

const swapOrder = (order: string[], fromKey: string, toKey: string) => {
  const fromIndex = order.indexOf(fromKey);
  const toIndex = order.indexOf(toKey);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return false;
  [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
  return true;
};

const toDisplayItem = (
  item: MarketItemType,
  groupKey: string
): MarketDisplayItemType => ({
  ...item,
  uid: marketItemUid(groupKey, item.key),
  sourceGroupKey: groupKey,
});

export function useMarketLayout(
  groupsSource: MaybeRefOrGetter<MarketGroupType[]>
) {
  const layout = useStorage<MarketLayoutType>(
    'market-overview-layout',
    createDefaultLayout(),
    undefined,
    { mergeDefaults: true }
  );

  const sourceGroups = computed(() => toValue(groupsSource));
  const groupMap = computed(
    () => new Map(sourceGroups.value.map((group) => [group.key, group]))
  );

  // 板块调整（如国内金价从贵金属移到外汇）后，按 itemKey 迁移旧自选
  watch(
    sourceGroups,
    (groups) => {
      if (!groups.length || !layout.value.favorites.length) return;
      const seen = new Set<string>();
      const next: FavoriteRefType[] = [];
      let changed = false;
      layout.value.favorites.forEach((ref) => {
        const directGroup = groups.find((group) => group.key === ref.groupKey);
        const fallbackGroup = directGroup?.items.some(
          (item) => item.key === ref.itemKey
        )
          ? directGroup
          : groups.find((group) =>
              group.items.some((item) => item.key === ref.itemKey)
            );
        if (!fallbackGroup) {
          next.push(ref);
          return;
        }
        const resolved =
          fallbackGroup.key === ref.groupKey
            ? ref
            : { groupKey: fallbackGroup.key, itemKey: ref.itemKey };
        const uid = marketItemUid(resolved.groupKey, resolved.itemKey);
        if (seen.has(uid)) {
          changed = true;
          return;
        }
        seen.add(uid);
        if (resolved !== ref) changed = true;
        next.push(resolved);
      });
      if (changed) layout.value.favorites = next;
    },
    { immediate: true }
  );

  const favoriteUids = computed<Set<string>>(
    () =>
      new Set(
        layout.value.favorites.map((ref) =>
          marketItemUid(ref.groupKey, ref.itemKey)
        )
      )
  );

  const favoriteItems = computed<MarketDisplayItemType[]>(() =>
    layout.value.favorites.flatMap((ref) => {
      const item = groupMap.value
        .get(ref.groupKey)
        ?.items.find((groupItem) => groupItem.key === ref.itemKey);
      return item ? [toDisplayItem(item, ref.groupKey)] : [];
    })
  );

  const favoriteGroup = computed<MarketDisplayGroupType>(() => ({
    key: FAVORITE_GROUP_KEY,
    name: '自选行情',
    status: 'closed',
    statusText: `${favoriteItems.value.length} 项`,
    isFavorite: true,
    items: favoriteItems.value,
  }));

  const displayGroups = computed<MarketDisplayGroupType[]>(() => {
    const ordered = sortByOrder(
      sourceGroups.value,
      layout.value.groupOrder,
      (group) => group.key
    );
    return [
      favoriteGroup.value,
      ...ordered.map((group) => ({
        ...group,
        isFavorite: false,
        items: sortByOrder(
          group.items.map((item) => toDisplayItem(item, group.key)),
          layout.value.itemOrder[group.key] ?? [],
          (item) => item.uid
        ),
      })),
    ];
  });

  const moveGroup = (fromKey: string, toKey: string) => {
    const keys = sourceGroups.value.map((group) => group.key);
    const order = normalizeOrder(layout.value.groupOrder, keys);
    if (!swapOrder(order, fromKey, toKey)) return;
    layout.value.groupOrder = order;
  };

  const moveItem = (
    groupKey: string,
    fromUid: string,
    toUid: string
  ) => {
    if (groupKey === FAVORITE_GROUP_KEY) {
      const favorites = [...layout.value.favorites];
      const fromIndex = favorites.findIndex(
        (ref) => marketItemUid(ref.groupKey, ref.itemKey) === fromUid
      );
      const toIndex = favorites.findIndex(
        (ref) => marketItemUid(ref.groupKey, ref.itemKey) === toUid
      );
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
      [favorites[fromIndex], favorites[toIndex]] = [
        favorites[toIndex],
        favorites[fromIndex],
      ];
      layout.value.favorites = favorites;
      return;
    }

    const group = sourceGroups.value.find((item) => item.key === groupKey);
    if (!group) return;
    const uids = group.items.map((item) => marketItemUid(groupKey, item.key));
    const order = normalizeOrder(layout.value.itemOrder[groupKey] ?? [], uids);
    if (!swapOrder(order, fromUid, toUid)) return;
    layout.value.itemOrder = { ...layout.value.itemOrder, [groupKey]: order };
  };

  const toggleFavorite = (groupKey: string, itemKey: string) => {
    const exists = layout.value.favorites.some(
      (ref) => ref.groupKey === groupKey && ref.itemKey === itemKey
    );
    layout.value.favorites = exists
      ? layout.value.favorites.filter(
          (ref) => !(ref.groupKey === groupKey && ref.itemKey === itemKey)
        )
      : [...layout.value.favorites, { groupKey, itemKey }];
  };

  return {
    displayGroups,
    favoriteItems,
    favoriteUids,
    moveGroup,
    moveItem,
    toggleFavorite,
  };
}
