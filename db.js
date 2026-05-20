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
        .select('id, body, anon, created_at, sender:profiles!sender_id(id, display_name, sprout_id)')
        .eq('recipient_id', me.id)
        .order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []).map(m => ({
        id: m.id,
        msg: m.body,
        anon: m.anon,
        fromName:      m.anon ? null : (m.sender ? m.sender.display_name : null),
        fromSproutId:  m.anon ? null : (m.sender ? m.sender.sprout_id   : null),
        fromProfileId: m.anon ? null : (m.sender ? m.sender.id          : null),
        // legacy alias
        fromId:        m.anon ? null : (m.sender ? m.sender.sprout_id   : null),
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

    async sendFriendRequest(identifier, note) {
      const me = await this.currentProfile();
      if (!me) throw new Error('not logged in');

      let target;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      if (isUuid) {
        const { data } = await sb.from('profiles')
          .select('id, email, display_name, sprout_id').eq('id', identifier).maybeSingle();
        target = data;
      } else {
        target = await this.findProfile(identifier);
      }
      if (!target) throw new Error('no sprout found with that id or email ✿');
      if (target.id === me.id) throw new Error('you can’t invite yourself ♡');

      // already friends?
      const { data: existing } = await sb.from('friends')
        .select('id').eq('owner_id', me.id).eq('friend_id', target.id).maybeSingle();
      if (existing) throw new Error('they’re already in your garden ✿');

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
          throw new Error('you’ve already sent them an invitation ✿');
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
        if (cb) cb(event, session);
      });
    },
  };

  window.db = db;
})();
