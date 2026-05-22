/* ============================================================
   Sprout ✿ — Supabase data layer
   ============================================================ */

(function () {
  const cfg = window.SPROUT_CONFIG || {};
  const placeholder =
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_URL.includes('YOUR-PROJECT') ||
    cfg.SUPABASE_ANON_KEY.includes('YOUR-ANON');

  // create the client (placeholder values still produce a client; calls just fail)
  const sb = window.supabase.createClient(
    cfg.SUPABASE_URL || 'https://placeholder.supabase.co',
    cfg.SUPABASE_ANON_KEY || 'placeholder',
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  let cachedProfile = null;
  let cachedPlant = null;

  function normalizeSharedPlantPayload(data) {
    if (Array.isArray(data)) data = data[0] || null;
    if (data && data.get_shared_plant) data = data.get_shared_plant;
    return data || null;
  }

  const db = {
    client: sb,
    needsSetup: placeholder,

    async session() {
      const { data: { session } } = await sb.auth.getSession();
      return session;
    },

    async currentProfile() {
      if (cachedProfile) return cachedProfile;
      const session = await this.session();
      if (!session) return null;
      const { data, error } = await sb
        .from('profiles')
        .select('id, email, display_name, sprout_id, leaf_count, created_at')
        .eq('id', session.user.id)
        .maybeSingle();
      if (error) { console.error(error); return null; }
      cachedProfile = data;
      return data;
    },

    async currentPlant() {
      if (cachedPlant) return cachedPlant;
      const session = await this.session();
      if (!session) return null;
      const { data, error } = await sb
        .from('plants')
        .select('id, name, created_at, species')
        .eq('owner_id', session.user.id)
        .is('archived_at', null)
        .maybeSingle();
      if (error) { console.error(error); return null; }
      cachedPlant = data;
      return data;
    },

    async chooseSeed(plantId, species, name) {
      const trimmed = (name || '').trim().slice(0, 40) || null;
      const { error } = await sb
        .from('plants')
        .update({ species, name: trimmed })
        .eq('id', plantId);
      if (error) throw error;
      cachedPlant = null;
    },

    async renamePlant(name) {
      const plant = await this.currentPlant();
      if (!plant) throw new Error(window.i18n ? window.i18n.t('db.error.noplant') : 'no active plant');
      const trimmed = (name || '').trim().slice(0, 40) || null;
      const { error } = await sb
        .from('plants')
        .update({ name: trimmed })
        .eq('id', plant.id);
      if (error) throw error;
      cachedPlant = null;
      return trimmed;
    },

    async graduatePlant() {
      const { data, error } = await sb.rpc('graduate_plant');
      if (error) throw error;
      cachedPlant = null;
      cachedProfile = null; // leaf_count was reset
      return data;
    },

    async enablePlantShare(plantId) {
      const { data, error } = await sb.rpc('enable_plant_share', { p_plant_id: plantId });
      if (error) throw error;
      return data; // share_id (uuid)
    },

    async getSharedPlant(shareId) {
      // Public, read-only view: always call as the anonymous role. Going
      // through sb.rpc() would attach the viewer's session JWT, and a logged-in
      // owner with a stale/expired token gets a 401 ("could not decode the
      // JWT") that hides the plant. A direct anon fetch behaves identically for
      // everyone, signed in or not.
      try {
        const resp = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/get_shared_plant`, {
          method: 'POST',
          headers: {
            apikey: cfg.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_share_id: shareId }),
        });
        if (!resp.ok) { console.error('getSharedPlant', resp.status); return null; }
        return normalizeSharedPlantPayload(await resp.json()); // { name, owner_name, archived, species, leaf_count, messages } or null
      } catch (err) { console.error(err); return null; }
    },

    async deletePlant(plantId) {
      const { data, error } = await sb.rpc('delete_plant', { p_plant_id: plantId });
      if (error) throw error;
      cachedPlant = null;   // active plant may have been replaced
      cachedProfile = null; // leaf_count may have been reset
      return data; // new active plant id if the active plant was deleted, else null
    },

    async plantHistory() {
      const session = await this.session();
      if (!session) return [];
      const { data, error } = await sb
        .from('plants')
        .select('id, name, created_at, archived_at, final_leaf_count, species')
        .eq('owner_id', session.user.id)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
    },

    async signUp({ email, password, displayName, sproutId }) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, sprout_id: sproutId },
        },
      });
      if (error) throw error;
      cachedProfile = null;
      cachedPlant = null;
      return data;
    },

    async signIn({ email, password }) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      cachedProfile = null;
      cachedPlant = null;
      return data;
    },

    async signOut() {
      cachedProfile = null;
      cachedPlant = null;
      await sb.auth.signOut();
    },

    async nicknameTaken(name) {
      const trimmed = (name || '').trim();
      if (!trimmed) return false;
      const escaped = trimmed.replace(/[\\%_]/g, '\\$&');
      const { data, error } = await sb
        .from('profiles')
        .select('id')
        .ilike('display_name', escaped)
        .limit(1);
      if (error) { console.error(error); return false; }
      return !!(data && data.length);
    },

    async findProfile(identifier) {
      // identifier may be email or display_name (case-insensitive, first match)
      const trimmed = identifier.trim();
      if (!trimmed) return null;
      if (trimmed.includes('@')) {
        const { data, error } = await sb
          .from('profiles')
          .select('id, email, display_name, sprout_id')
          .eq('email', trimmed.toLowerCase())
          .maybeSingle();
        if (error) { console.error(error); return null; }
        return data;
      }
      // nickname lookup, case-insensitive (escape ilike wildcards)
      const escaped = trimmed.replace(/[\\%_]/g, '\\$&');
      const { data, error } = await sb
        .from('profiles')
        .select('id, email, display_name, sprout_id')
        .ilike('display_name', escaped)
        .limit(1);
      if (error) { console.error(error); return null; }
      return (data && data[0]) || null;
    },

    async sendMessage({ recipientId, body, anon }) {
      const me = await this.currentProfile();
      if (!me) throw new Error(window.i18n ? window.i18n.t('db.error.notlogged') : 'not logged in');
      const { error } = await sb.from('messages').insert({
        sender_id: me.id,
        recipient_id: recipientId,
        body,
        anon,
      });
      if (error) throw error;
    },

    async inbox() {
      const me = await this.currentProfile();
      if (!me) return [];
      const plant = await this.currentPlant();
      if (!plant) return [];
      return this.plantInbox(plant.id);
    },

    async plantInbox(plantId) {
      if (!plantId) return [];
      const cols = 'id, body, anon, created_at, read_at, sender:profiles!sender_id(id, display_name, sprout_id)';
      let { data, error } = await sb
        .from('messages')
        .select(cols)
        .eq('plant_id', plantId)
        .order('created_at', { ascending: true });
      // graceful fallback if the read_at migration hasn't been run yet
      if (error && /read_at/.test(error.message || '')) {
        ({ data, error } = await sb
          .from('messages')
          .select(cols.replace(', read_at', ''))
          .eq('plant_id', plantId)
          .order('created_at', { ascending: true }));
      }
      if (error) { console.error(error); return []; }
      return (data || []).map(m => ({
        id: m.id,
        msg: m.body,
        anon: m.anon,
        read: !!m.read_at,
        fromName:      m.anon ? null : (m.sender ? m.sender.display_name : null),
        fromSproutId:  m.anon ? null : (m.sender ? m.sender.sprout_id   : null),
        fromProfileId: m.anon ? null : (m.sender ? m.sender.id          : null),
        // legacy alias
        fromId:        m.anon ? null : (m.sender ? m.sender.sprout_id   : null),
        at: new Date(m.created_at).getTime(),
      }));
    },

    async markMessageRead(messageId) {
      if (!messageId) return;
      const { error } = await sb.rpc('mark_message_read', { p_message_id: messageId });
      if (error) console.error(error);
    },

    async sentBox() {
      const me = await this.currentProfile();
      if (!me) return [];
      const { data, error } = await sb
        .from('messages')
        .select('id, body, anon, created_at, recipient:profiles!recipient_id(display_name, sprout_id)')
        .eq('sender_id', me.id)
        .order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(m => ({
        id: m.id,
        msg: m.body,
        anon: m.anon,
        toName: m.recipient ? m.recipient.display_name : '(deleted user)',
        toId:   m.recipient ? m.recipient.sprout_id   : '?',
        at: new Date(m.created_at).getTime(),
      }));
    },

    async myFriends() {
      const me = await this.currentProfile();
      if (!me) return [];
      const { data, error } = await sb
        .from('friends')
        .select('id, created_at, friend:profiles!friend_id(id, display_name, sprout_id, leaf_count)')
        .eq('owner_id', me.id)
        .order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(row => ({
        rowId: row.id,
        addedAt: row.created_at,
        id: row.friend ? row.friend.id : null,
        name: row.friend ? row.friend.display_name : '(deleted)',
        sproutId: row.friend ? row.friend.sprout_id : '?',
        leafCount: row.friend ? row.friend.leaf_count : 0,
      }));
    },

    async sendFriendRequest(identifier, note) {
      const t = (k) => (window.i18n ? window.i18n.t(k) : k);
      const me = await this.currentProfile();
      if (!me) throw new Error(t('db.error.notlogged'));

      let target;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      if (isUuid) {
        const { data } = await sb.from('profiles')
          .select('id, email, display_name, sprout_id').eq('id', identifier).maybeSingle();
        target = data;
      } else {
        target = await this.findProfile(identifier);
      }
      if (!target) throw new Error(t('db.error.notfound'));
      if (target.id === me.id) throw new Error(t('db.error.selfinvite'));

      // already friends?
      const { data: existing } = await sb.from('friends')
        .select('id').eq('owner_id', me.id).eq('friend_id', target.id).maybeSingle();
      if (existing) throw new Error(t('db.error.alreadyfriend'));

      // is there an incoming request from this person? auto-accept it.
      const { data: incoming } = await sb.from('friend_requests')
        .select('id').eq('from_id', target.id).eq('to_id', me.id).maybeSingle();
      if (incoming) {
        await sb.rpc('accept_friend_request', { req_id: incoming.id });
        return { target, autoAccepted: true };
      }

      const { error } = await sb.from('friend_requests').insert({
        from_id: me.id,
        to_id:   target.id,
        message: note || null,
      });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          throw new Error(t('db.error.alreadyinvited'));
        }
        throw error;
      }
      return { target, autoAccepted: false };
    },

    async incomingRequests() {
      const me = await this.currentProfile();
      if (!me) return [];
      const { data, error } = await sb
        .from('friend_requests')
        .select('id, message, created_at, from:profiles!from_id(id, display_name, sprout_id, leaf_count)')
        .eq('to_id', me.id)
        .order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(r => ({
        id: r.id,
        message: r.message,
        createdAt: r.created_at,
        fromId:        r.from ? r.from.id           : null,
        fromName:      r.from ? r.from.display_name : '(deleted)',
        fromSproutId:  r.from ? r.from.sprout_id    : '?',
        fromLeafCount: r.from ? r.from.leaf_count   : 0,
      }));
    },

    async outgoingRequests() {
      const me = await this.currentProfile();
      if (!me) return [];
      const { data, error } = await sb
        .from('friend_requests')
        .select('id, created_at, to:profiles!to_id(id, display_name, sprout_id)')
        .eq('from_id', me.id);
      if (error) { console.error(error); return []; }
      return (data || []).map(r => ({
        id: r.id,
        createdAt: r.created_at,
        toId:        r.to ? r.to.id           : null,
        toName:      r.to ? r.to.display_name : '(deleted)',
        toSproutId:  r.to ? r.to.sprout_id    : '?',
      }));
    },

    async acceptRequest(reqId) {
      const { error } = await sb.rpc('accept_friend_request', { req_id: reqId });
      if (error) throw error;
    },

    async declineRequest(reqId) {
      const { error } = await sb.from('friend_requests').delete().eq('id', reqId);
      if (error) throw error;
    },

    async cancelOutgoingRequest(reqId) {
      const { error } = await sb.from('friend_requests').delete().eq('id', reqId);
      if (error) throw error;
    },

    async relationshipTo(profileId) {
      // returns one of 'self' | 'friend' | 'request_sent' | 'request_received' | 'none'
      const me = await this.currentProfile();
      if (!me) return 'none';
      if (me.id === profileId) return 'self';

      const { data: friend } = await sb.from('friends')
        .select('id').eq('owner_id', me.id).eq('friend_id', profileId).maybeSingle();
      if (friend) return 'friend';

      const { data: out } = await sb.from('friend_requests')
        .select('id').eq('from_id', me.id).eq('to_id', profileId).maybeSingle();
      if (out) return 'request_sent';

      const { data: incoming } = await sb.from('friend_requests')
        .select('id').eq('from_id', profileId).eq('to_id', me.id).maybeSingle();
      if (incoming) return 'request_received';

      return 'none';
    },

    async removeFriend(rowId) {
      const { error } = await sb.from('friends').delete().eq('id', rowId);
      if (error) throw error;
    },

    onAuth(cb) {
      return sb.auth.onAuthStateChange((event, session) => {
        cachedProfile = null;
        cachedPlant = null;
        if (cb) cb(event, session);
      });
    },
  };

  window.db = db;
})();
