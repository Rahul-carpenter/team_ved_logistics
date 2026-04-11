/* ══════════════════════════════════════════
   Ved Logistics — Data Store (localStorage)
   ══════════════════════════════════════════ */

const Store = (() => {
  const PREFIX = 'ved_';

  const _get = (collection) => {
    try { return JSON.parse(localStorage.getItem(PREFIX + collection)) || []; }
    catch { return []; }
  };
  const _set = (collection, data) => {
    localStorage.setItem(PREFIX + collection, JSON.stringify(data));
  };

  // ── Generic CRUD ──
  const getAll = (col) => _get(col);

  const getById = (col, id) => _get(col).find(r => r.id === id) || null;

  const query = (col, filterFn) => _get(col).filter(filterFn);

  const create = (col, data) => {
    const all = _get(col);
    const record = { id: Utils.uid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    all.push(record);
    _set(col, all);
    return record;
  };

  const update = (col, id, data) => {
    const all = _get(col);
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    _set(col, all);
    return all[idx];
  };

  const remove = (col, id) => {
    const all = _get(col);
    _set(col, all.filter(r => r.id !== id));
  };

  const count = (col, filterFn) => {
    const all = _get(col);
    return filterFn ? all.filter(filterFn).length : all.length;
  };

  // ── Settings (key-value) ──
  const getSetting = (key, defaultVal) => {
    const settings = JSON.parse(localStorage.getItem(PREFIX + 'settings') || '{}');
    return settings[key] !== undefined ? settings[key] : defaultVal;
  };

  const setSetting = (key, val) => {
    const settings = JSON.parse(localStorage.getItem(PREFIX + 'settings') || '{}');
    settings[key] = val;
    localStorage.setItem(PREFIX + 'settings', JSON.stringify(settings));
  };

  // ── Session ──
  const setSession = (user) => sessionStorage.setItem('ved_session', JSON.stringify(user));
  const getSession = () => {
    try { return JSON.parse(sessionStorage.getItem('ved_session')); } catch { return null; }
  };
  const clearSession = () => sessionStorage.removeItem('ved_session');

  // ── Check if seeded ──
  const isSeeded = () => localStorage.getItem(PREFIX + 'seeded') === 'true';
  const markSeeded = () => localStorage.setItem(PREFIX + 'seeded', 'true');

  // ── Clear all data ──
  const clearAll = () => {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem('ved_session');
  };

  return {
    getAll, getById, query, create, update, remove, count,
    getSetting, setSetting, setSession, getSession, clearSession,
    isSeeded, markSeeded, clearAll
  };
})();
