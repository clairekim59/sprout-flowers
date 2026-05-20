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
      return data;
    },

    async signIn({ email, password }) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      cachedProfile = null;
      return data;
    },

    async signOut() {
      cachedProfile = null;
      await sb.auth.signOut();
    },

    async findProfile(identifier) {
      // identifier may be email or sprout_id
      const isEmail = identifier.includes('@');
      const col = isEmail ? 'email' : 'sprout_id';
      const val = isEmail ? identifier.trim().toLowerCase() : identifier.trim();
      const { data, error } = await sb
        .from('profiles')
        .select('id, email, display_name, sprout_id')
        .eq(col, val)
        .maybeSingle();
      if (error) { console.error(error); return null; }
      return data;
    },

    async sendMessage({ recipientId, body, anon }) {
      const me = await this.currentProfile();
      if (!me) throw new Error('not logged in');
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
      const { data, error } = await sb
        .from('messages')
        .select('id, body, anon, created_at, sender:profiles!sender_id(display_name, sprout_id)')
        .eq('recipient_id', me.id)
        .order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []).map(m => ({
        id: m.id,
        msg: m.body,
        anon: m.anon,
        fromName: m.anon ? null : (m.sender ? m.sender.display_name : null),
        fromId:   m.anon ? null : (m.sender ? m.sender.sprout_id   : null),
        at: new Date(m.created_at).getTime(),
      }));
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

    async addFriend(identifier) {
      const me = await this.currentProfile();
      if (!me) throw new Error('not logged in');
      const target = await this.findProfile(identifier);
      if (!target) throw new Error('no sprout found with that id or email ✿');
      if (target.id === me.id) throw new Error('you’re already in your own garden ♡');
      const { error } = await sb.from('friends').insert({
        owner_id: me.id,
        friend_id: target.id,
      });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          throw new Error('they’re already in your garden ✿');
        }
        throw error;
      }
      return target;
    },

    async removeFriend(rowId) {
      const { error } = await sb.from('friends').delete().eq('id', rowId);
      if (error) throw error;
    },

    onAuth(cb) {
      return sb.auth.onAuthStateChange((event, session) => {
        cachedProfile = null;
        if (cb) cb(event, session);
      });
    },
  };

  window.db = db;
})();
