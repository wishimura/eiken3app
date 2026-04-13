/**
 * ランダムに選ぶけど、プール内の全要素を1周するまで同じ要素を出さない「デッキ」方式のピッカー。
 *
 * 使い方:
 *   const recentRef = useRef<Set<string>>(new Set());
 *   const next = pickFromDeck(pool, recentRef.current, w => w.id);
 */
export function pickFromDeck<T>(
  pool: T[],
  recent: Set<string>,
  idOf: (item: T) => string,
): T | null {
  if (pool.length === 0) return null;

  // 1件しかなければそれを返す（履歴操作なし）
  if (pool.length === 1) return pool[0]!;

  // 直前に出した1件は次の1週目でも避ける
  const lastId = recent.size > 0 ? Array.from(recent).pop() : null;

  // 候補 = プールのうち「最近出してない」もの
  let candidates = pool.filter((item) => !recent.has(idOf(item)));

  // 全部出し尽くしたら履歴リセット（ただし直前のは除外）
  if (candidates.length === 0) {
    recent.clear();
    candidates = pool.filter(
      (item) => lastId === null || idOf(item) !== lastId,
    );
    // それでも0になるケース（poolが1件のとき）は直前のでも返す
    if (candidates.length === 0) candidates = pool;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
  recent.add(idOf(picked));
  return picked;
}
