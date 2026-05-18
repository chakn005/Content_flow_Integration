/**
 * Shared dashboard state via Supabase (read + realtime; publish via RPC + edit key).
 * # SECURITY-REVIEW: external API; edit key in sessionStorage only; never log keys.
 */
(function () {
  const EDIT_KEY_STORAGE = "contentFlowEditKey";
  const CONFIG = () => window.CONTENT_FLOW_SUPABASE || {};
  const DEBOUNCE_MS = 400;

  let client = null;
  let channel = null;
  let enabled = false;
  let status = "local";
  let lastRemoteUpdatedAt = null;
  let publishTimer = null;
  let suppressRealtimeUntil = 0;
  let onRemoteChange = null;
  let onStatusChange = null;

  function getConfig() {
    const c = CONFIG();
    const url = (c.url || "").trim();
    const anonKey = (c.anonKey || "").trim();
    const stateId = (c.stateId || "default").trim() || "default";
    return { url, anonKey, stateId };
  }

  function setStatus(next) {
    status = next;
    if (typeof onStatusChange === "function") onStatusChange(next);
  }

  function getSupabaseGlobal() {
    return window.supabase;
  }

  function init() {
    const { url, anonKey } = getConfig();
    if (!url || !anonKey) {
      enabled = false;
      setStatus("local");
      return false;
    }

    const lib = getSupabaseGlobal();
    if (!lib || typeof lib.createClient !== "function") {
      enabled = false;
      setStatus("error");
      return false;
    }

    try {
      client = lib.createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      enabled = true;
      setStatus("loading");
      return true;
    } catch {
      enabled = false;
      setStatus("error");
      return false;
    }
  }

  function scopedEditKeyStorage() {
    try {
      const path = window.location.pathname || "/";
      return `${EDIT_KEY_STORAGE}:${path.replace(/\/index\.html$/i, "").replace(/\/$/, "") || "/"}`;
    } catch {
      return EDIT_KEY_STORAGE;
    }
  }

  function getEditKey() {
    try {
      return sessionStorage.getItem(scopedEditKeyStorage()) || "";
    } catch {
      return "";
    }
  }

  function setEditKey(key) {
    try {
      const trimmed = (key || "").trim();
      if (!trimmed) {
        sessionStorage.removeItem(scopedEditKeyStorage());
        return;
      }
      sessionStorage.setItem(scopedEditKeyStorage(), trimmed);
    } catch {
      /* ignore quota / private mode */
    }
  }

  function canPublish() {
    return enabled && !!getEditKey();
  }

  function normalizePayload(row) {
    if (!row || typeof row.state !== "object" || row.state === null) {
      return { heatmap: {}, kpi: {}, updatedAt: row?.updated_at || null };
    }
    const s = row.state;
    return {
      heatmap: typeof s.heatmap === "object" && s.heatmap ? s.heatmap : {},
      kpi: typeof s.kpi === "object" && s.kpi ? s.kpi : {},
      updatedAt: row.updated_at || s.updatedAt || null
    };
  }

  async function fetchRemote() {
    if (!enabled || !client) return null;
    const { stateId } = getConfig();
    try {
      const { data, error } = await client
        .from("dashboard_state")
        .select("state, updated_at")
        .eq("id", stateId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setStatus(canPublish() ? "live-editor" : "live");
        return null;
      }

      lastRemoteUpdatedAt = data.updated_at || null;
      const payload = normalizePayload(data);
      setStatus(canPublish() ? "live-editor" : "live");
      return payload;
    } catch {
      setStatus("error");
      return null;
    }
  }

  async function publish(snapshot) {
    if (!enabled || !client || !canPublish()) return false;

    const { stateId } = getConfig();
    const body = {
      v: 1,
      heatmap: snapshot.heatmap || {},
      kpi: snapshot.kpi || {},
      updatedAt: new Date().toISOString()
    };

    try {
      suppressRealtimeUntil = Date.now() + 1200;
      const { data, error } = await client.rpc("publish_dashboard_state", {
        p_id: stateId,
        p_state: body,
        p_edit_key: getEditKey()
      });

      if (error) throw error;
      lastRemoteUpdatedAt = data || body.updatedAt;
      setStatus("live-editor");
      return true;
    } catch (err) {
      const msg = err && err.message ? String(err.message) : "";
      if (/unauthorized/i.test(msg)) {
        setEditKey("");
        setStatus("live");
      } else {
        setStatus("error");
      }
      return false;
    }
  }

  function schedulePublish(snapshot) {
    if (!canPublish()) return;
    clearTimeout(publishTimer);
    publishTimer = setTimeout(() => {
      publish(snapshot);
    }, DEBOUNCE_MS);
  }

  function subscribeRemote(handler) {
    if (!enabled || !client) return;
    onRemoteChange = handler;
    const { stateId } = getConfig();

    if (channel) {
      try {
        client.removeChannel(channel);
      } catch {
        /* ignore */
      }
    }

    channel = client
      .channel(`dashboard_state:${stateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dashboard_state",
          filter: `id=eq.${stateId}`
        },
        (payload) => {
          if (Date.now() < suppressRealtimeUntil) return;
          const row = payload.new || payload.old;
          if (!row) return;
          const remote = normalizePayload(row);
          lastRemoteUpdatedAt = remote.updatedAt;
          if (typeof onRemoteChange === "function") onRemoteChange(remote);
        }
      )
      .subscribe();
  }

  function promptForEditKey() {
    const entered = window.prompt(
      "Enter the team edit key to publish status changes for everyone.\n\n" +
        "This is set in Supabase (dashboard_config.edit_key), not in the repo."
    );
    if (entered === null) return false;
    const trimmed = entered.trim();
    if (!trimmed) return false;
    setEditKey(trimmed);
    setStatus(enabled ? "live-editor" : "local");
    return true;
  }

  window.ContentFlowSharedState = {
    init,
    fetchRemote,
    publish,
    schedulePublish,
    subscribeRemote,
    canPublish,
    getEditKey,
    setEditKey,
    promptForEditKey,
    isEnabled: () => enabled,
    getStatus: () => status,
    onStatusChange(fn) {
      onStatusChange = fn;
    }
  };
})();
