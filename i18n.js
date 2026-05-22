/* ============================================================
   Sprout ✿ — i18n (English + Korean)
   ============================================================ */

(function () {
  const KEY = 'sprout.lang';
  const subscribers = [];

  const STRINGS = {
    en: {
      'app.tagline.login': 'grow a plant with kind words ♡',
      'app.tagline.signup': 'plant your seed ✿',

      'login.email': 'email',
      'login.password': 'password',
      'login.submit': 'log in ✿',
      'login.submitting': 'logging in…',
      'login.swap': 'no account yet? ',
      'login.swap.link': 'sign up here',
      'login.error.creds': 'email or password doesn’t match ♡',
      'login.error.confirm': 'please confirm your email first ✿',
      'login.error.noprofile': 'your profile row is missing — ask the host to recreate it ✿',
      'login.welcome': 'welcome back, {name} ✿',
      'login.email.placeholder': 'hello@sprout.cute',
      'login.pass.placeholder': '••••••••',

      'signup.name': 'display name ',
      'signup.name.hint': '(leave blank to use the suggestion)',
      'signup.submit': 'create my sprout 🌱',
      'signup.submitting': 'planting…',
      'signup.swap': 'already growing? ',
      'signup.swap.link': 'log in here',
      'signup.error.shortpass': 'password must be at least 6 characters ♡',
      'signup.error.nickname': 'that nickname is already taken — try another ✿',
      'signup.error.email': 'this email is already growing a plant ✿',
      'signup.confirm.email': 'check your email to confirm ✿',
      'signup.welcome': 'welcome, {name} 🌱',
      'signup.pass.placeholder': 'at least 6 chars',

      'nav.garden': 'neighbors 🏡',
      'nav.send': 'send a note ✉',
      'nav.sent': 'my sent ♡',
      'nav.logout': 'log out',
      'nav.menu': 'menu',
      'theme.toggle': 'light / dark mode',
      'theme.light': 'light',
      'theme.dark': 'dark',
      'logout.bye': 'see you soon ♡',
      'main.title': 'my garden 🌷',

      'account.delete.menu': 'delete account',
      'account.delete.title': 'delete account',
      'account.delete.body': 'This removes your profile, plants, neighbors, and login. Notes you sent stay on recipients’ plants without your profile info. Notes sent to you stay only in each sender’s sent box.',
      'account.delete.confirmLabel': 'Type DELETE to confirm',
      'account.delete.confirmError': 'type DELETE to confirm',
      'account.delete.cancel': 'keep account',
      'account.delete.submit': 'delete my account',
      'account.delete.success': 'account deleted',
      'account.delete.fail': 'could not delete account ✿',

      'profile.leaves': 'leaves 🍃',
      'profile.stage': 'stage',
      'profile.hint': 'share your nickname or email so friends can water your plant with kind words ♡',
      'profile.fallbackName': 'your name',
      'profile.icon.menu': 'change icon',
      'profile.icon.title': 'choose your icon',
      'profile.icon.initial': 'use my initial',
      'profile.icon.choice': 'choose {icon}',
      'profile.icon.saved': 'profile icon updated ✿',
      'profile.icon.fail': 'could not update icon — try again ✿',

      'plant.hint': 'tap a leaf to read the message it grew from ✿',

      'stage.seed': 'seed',
      'stage.sprout': 'sprout',
      'stage.sapling': 'sapling',
      'stage.bush': 'bush',
      'stage.blooming': 'blooming',
      'stage.flourishing': 'flourishing',
      'stage.banner.seed': 'a tiny seed sleeps 💤  send yourself some friends and watch it grow ✿',
      'stage.banner.sprout': 'a sprout pokes through the soil 🌱',
      'stage.banner.sapling': 'leaves unfurl, one for each kind word 🍃',
      'stage.banner.bush': 'your plant is thriving ♡',
      'stage.banner.blooming': 'tiny flowers begin to bloom ✿',
      'stage.banner.flourishing': 'a whole garden of love grows here ❀✿❀',

      'send.title': 'send a kind note ✉',
      'send.subtitle': 'your words will grow a new leaf on their plant ♡',
      'send.to': 'to (email or nickname)',
      'send.to.placeholder': 'friend@sprout.cute or leafyMochi',
      'send.msg': 'your message ',
      'send.msg.hint': '(leave blank to use the suggestion)',
      'send.anon': 'send anonymously (they won’t see who, but your sent box will remember)',
      'send.submit': 'send & sprout 🌱',
      'send.submitting': 'sending…',
      'send.error.notfound': 'no plant found with that email or nickname ✿',
      'send.error.self': 'you can’t water your own plant ♡',
      'send.success': 'a new leaf sprouted on {name}’s plant! 🌱',
      'send.toast': 'message sent ✿',
      'send.fallback': 'hi ✿',

      'sent.title': 'your sent notes ♡',
      'sent.subtitle': 'a little garden of kindness you’ve planted',
      'sent.loading': 'loading…',
      'sent.empty': 'no notes sent yet — go plant some kindness ✿',
      'sent.anonTag': 'sent anonymously',
      'sent.deleted': '(deleted user)',
      'sent.to': 'to ',

      'garden.title': 'neighbors 🏡',
      'garden.subtitle': 'sprouts you’d like to keep close — peek at their plants & send a note ✿',
      'garden.invitations': '🌱 invitations for you',
      'garden.invite.title': '💌 invite a sprout',
      'garden.invite.placeholder': 'email or nickname',
      'garden.invite.submit': 'invite ♡',
      'garden.invite.sending': 'sending…',
      'garden.pending': '⏳ waiting for them to accept',
      'garden.your': '🏡 your neighbors',
      'garden.loading': 'loading your neighbors…',
      'garden.empty': 'no neighbors here yet — invite someone above ✿',
      'garden.accept': 'accept ✿',
      'garden.decline': 'decline',
      'garden.send': 'send a note ✉',
      'garden.removeTitle': 'remove neighbor',
      'garden.removeConfirm': 'remove this neighbor? ✿',
      'garden.removedToast': 'neighbor removed ♡',
      'garden.removeFail': 'could not remove',
      'garden.acceptToast': 'a new neighbor moved in 🌱',
      'garden.acceptFail': 'could not accept',
      'garden.declineToast': 'invitation declined ♡',
      'garden.declineFail': 'could not decline',
      'garden.cancelToast': 'invitation cancelled ♡',
      'garden.cancelFail': 'could not cancel',
      'notify.newLeaf.one': 'a new leaf just sprouted on your plant 🍃',
      'notify.newLeaf.many': '{count} new leaves just sprouted on your plant 🍃',
      'notify.unread.one': 'you have 1 unread leaf — tap it to read ✿',
      'notify.unread.many': 'you have {count} unread leaves — tap them to read ✿',
      'garden.inviteSent': 'invitation sent to {name} 💌',
      'garden.inviteAuto': '{name} moved in next door 🌱 (they had already invited you!)',

      'leaf.from.anon': 'from someone anonymous ✿',
      'leaf.from.named': 'from {name}',
      'leaf.from.friend': 'from a friend',
      'leaf.invite.title': 'add as neighbor',
      'leaf.invite.default': 'be my neighbor 💌',
      'leaf.invite.friend': 'already your neighbor ✿',
      'leaf.invite.pending': 'invitation pending ⏳',
      'leaf.invite.accept': 'accept their invitation ♡',
      'leaf.invite.self': 'this is you ✿',
      'leaf.invite.checking': 'checking…',
      'leaf.invite.sending': 'sending…',
      'leaf.joinedToast': '{name} moved in next door 🌱',
      'leaf.sentToast': 'invitation sent 💌',
      'leaf.sendFail': 'could not send',

      'db.error.notfound': 'no sprout found with that email or nickname ✿',
      'db.error.selfinvite': 'you can’t invite yourself ♡',
      'db.error.alreadyfriend': 'they’re already your neighbor ✿',
      'db.error.alreadyinvited': 'you’ve already sent them an invitation ✿',
      'db.error.notlogged': 'not logged in',

      'common.error': 'something went wrong ✿',
      'common.error.generic': 'something went wrong',

      'lang.en': 'EN',
      'lang.ko': '한',

      'footer.madeBy': 'made with ♡ by Claire Kim',
      'footer.license': 'MIT license',
      'footer.github': 'GitHub',

      'copy.title': 'click to copy',
      'copy.success': 'copied to clipboard ♡',
      'copy.fail': 'could not copy ✿',

      'plant.name.fallback': 'name your plant ✿',
      'plant.name.title': 'click to rename your plant',
      'plant.rename.prompt': 'what should we call your plant?',
      'plant.rename.toast': 'plant renamed ♡',
      'plant.rename.fail': 'could not rename ✿',
      'plant.graduate.btn': 'graduate & plant a new seed 🌱',
      'plant.graduate.confirm': 'your plant is flourishing! graduate this plant and start a fresh seed?',
      'plant.graduate.toast': 'a new seed is sleeping in the soil 🌱',
      'plant.graduate.fail': 'could not graduate ✿',
      'plant.planted': 'planted {date}',
      'plant.planted.today': 'planted today',
      'plant.planted.dayAgo': 'planted 1 day ago',
      'plant.planted.daysAgo': 'planted {count} days ago',
      'plant.planted.date': 'planted {date}',
      'plant.age.today': 'today',
      'plant.age.dayAgo': '1 day ago',
      'plant.age.daysAgo': '{count} days ago',

      'db.error.noplant': 'no active plant',

      'plant.history.title': '🌿 garden memories',
      'plant.history.unnamed': 'unnamed plant',
      'plant.history.leaves': '{count} 🍃 · graduated {date}',
      'plant.history.meta': 'planted {start} · graduated {end} · {count} 🍃',
      'plant.history.count': '{count} 🍃',

      'share.btn': 'share my plant 🔗',
      'share.title': 'Sprout ✿',
      'share.text': 'come see my plant on Sprout ✿',
      'share.copied': 'link copied — paste it anywhere ♡',
      'share.fail': 'could not share ✿',
      'shared.subtitle': '{name}’s plant, grown with kind words ✿',
      'shared.meta': '{count} 🍃 of kindness',
      'shared.cta': 'grow your own plant ✿',
      'shared.send': 'send a kind word ✿',
      'shared.sendNamed': 'send {name} a kind word ✿',
      'shared.notfound': 'this plant could not be found — the link may have expired ✿',

      'plant.delete.title': 'remove this plant forever',
      'plant.delete.btn': 'remove this plant 🥀',
      'plant.delete.confirm': 'permanently remove “{name}” and all its messages? this cannot be undone.',
      'plant.delete.toast': 'plant removed forever 🥀',
      'plant.delete.fail': 'could not remove ✿',

      'onboard.welcome': 'welcome to Sprout ✿ a little garden that grows on kindness',
      'onboard.point1': '🌱 friends water your plant with kind words — every note grows a new leaf',
      'onboard.point2': '✉ send notes back to grow their plants too',
      'onboard.point3': '🌷 when it flourishes, graduate it and start a fresh seed',
      'onboard.start': 'plant my seed 🌱',
      'onboard.seed.title': 'choose a seed ✿',
      'onboard.seed.sub': 'each seed grows into a different plant — pick one and watch it bloom ♡',
      'onboard.seed.item': 'mystery seed',
      'onboard.next': 'next ✿',
      'onboard.name.title': 'name your seed ♡',
      'onboard.name.sub': 'you can rename it anytime',
      'onboard.name.placeholder': 'leave blank for a cute name',
      'onboard.finish': 'start growing 🌱',
      'onboard.fail': 'could not plant your seed ✿',
    },

    ko: {
      'app.tagline.login': '다정한 말로 식물을 키워요 ♡',
      'app.tagline.signup': '씨앗을 심어보세요 ✿',

      'login.email': '이메일',
      'login.password': '비밀번호',
      'login.submit': '로그인 ✿',
      'login.submitting': '로그인 중…',
      'login.swap': '아직 계정이 없나요? ',
      'login.swap.link': '여기서 가입하기',
      'login.error.creds': '이메일 또는 비밀번호가 일치하지 않아요 ♡',
      'login.error.confirm': '먼저 이메일을 확인해 주세요 ✿',
      'login.error.noprofile': '프로필 정보가 사라졌어요 — 다시 만들어달라고 요청해 주세요 ✿',
      'login.welcome': '다시 만나서 반가워요, {name}님 ✿',
      'login.email.placeholder': 'hello@sprout.cute',
      'login.pass.placeholder': '••••••••',

      'signup.name': '닉네임 ',
      'signup.name.hint': '(비워두면 추천 이름이 사용돼요)',
      'signup.submit': '내 새싹 만들기 🌱',
      'signup.submitting': '심는 중…',
      'signup.swap': '이미 키우고 있나요? ',
      'signup.swap.link': '로그인하기',
      'signup.error.shortpass': '비밀번호는 최소 6자 이상이어야 해요 ♡',
      'signup.error.nickname': '이미 사용 중인 닉네임이에요 — 다른 이름을 시도해 보세요 ✿',
      'signup.error.email': '이 이메일은 이미 식물을 키우고 있어요 ✿',
      'signup.confirm.email': '이메일을 확인해 주세요 ✿',
      'signup.welcome': '환영해요, {name}님 🌱',
      'signup.pass.placeholder': '최소 6자',

      'nav.garden': '이웃 🏡',
      'nav.send': '쪽지 보내기 ✉',
      'nav.sent': '보낸 쪽지 ♡',
      'nav.logout': '로그아웃',
      'nav.menu': '메뉴',
      'theme.toggle': '라이트 / 다크 모드',
      'theme.light': '라이트',
      'theme.dark': '다크',
      'logout.bye': '또 만나요 ♡',
      'main.title': '내 정원 🌷',

      'account.delete.menu': '계정 삭제',
      'account.delete.title': '계정 삭제',
      'account.delete.body': '프로필, 식물, 이웃, 로그인 정보가 삭제돼요. 내가 보낸 쪽지는 받는 사람의 식물에 남지만 내 프로필 정보는 사라져요. 나에게 온 쪽지는 보낸 사람의 보낸 쪽지함에만 남아요.',
      'account.delete.confirmLabel': '삭제하려면 DELETE를 입력하세요',
      'account.delete.confirmError': 'DELETE를 입력해야 해요',
      'account.delete.cancel': '계정 유지',
      'account.delete.submit': '내 계정 삭제',
      'account.delete.success': '계정이 삭제됐어요',
      'account.delete.fail': '계정을 삭제하지 못했어요 ✿',

      'profile.leaves': '잎사귀 🍃',
      'profile.stage': '단계',
      'profile.hint': '닉네임이나 이메일을 공유하면 친구들이 다정한 말로 식물에 물을 줄 수 있어요 ♡',
      'profile.fallbackName': '이름',
      'profile.icon.menu': '아이콘 바꾸기',
      'profile.icon.title': '아이콘 선택',
      'profile.icon.initial': '이니셜 사용',
      'profile.icon.choice': '{icon} 선택',
      'profile.icon.saved': '프로필 아이콘을 바꿨어요 ✿',
      'profile.icon.fail': '아이콘을 바꾸지 못했어요 — 다시 시도해 주세요 ✿',

      'plant.hint': '잎사귀를 눌러 그 안의 메시지를 읽어보세요 ✿',

      'stage.seed': '씨앗',
      'stage.sprout': '새싹',
      'stage.sapling': '묘목',
      'stage.bush': '덤불',
      'stage.blooming': '개화',
      'stage.flourishing': '만개',
      'stage.banner.seed': '작은 씨앗이 잠들어 있어요 💤  친구들에게 쪽지를 보내며 자라는 모습을 지켜보세요 ✿',
      'stage.banner.sprout': '흙을 뚫고 새싹이 돋아났어요 🌱',
      'stage.banner.sapling': '다정한 말마다 잎사귀가 펼쳐져요 🍃',
      'stage.banner.bush': '식물이 무럭무럭 자라고 있어요 ♡',
      'stage.banner.blooming': '작은 꽃들이 피기 시작해요 ✿',
      'stage.banner.flourishing': '사랑이 가득한 정원이 자라났어요 ❀✿❀',

      'send.title': '다정한 쪽지 보내기 ✉',
      'send.subtitle': '당신의 말이 그들의 식물에 새 잎사귀를 틔워요 ♡',
      'send.to': '받는 사람 (이메일 또는 닉네임)',
      'send.to.placeholder': 'friend@sprout.cute 또는 leafyMochi',
      'send.msg': '메시지 ',
      'send.msg.hint': '(비워두면 추천 메시지가 사용돼요)',
      'send.anon': '익명으로 보내기 (받는 사람은 누가 보냈는지 모르지만, 보낸 쪽지함에는 남아요)',
      'send.submit': '보내기 & 새싹 🌱',
      'send.submitting': '보내는 중…',
      'send.error.notfound': '해당 이메일이나 닉네임의 식물을 찾을 수 없어요 ✿',
      'send.error.self': '자기 식물에는 물을 줄 수 없어요 ♡',
      'send.success': '{name}님의 식물에 새 잎사귀가 자랐어요! 🌱',
      'send.toast': '쪽지를 보냈어요 ✿',
      'send.fallback': '안녕 ✿',

      'sent.title': '보낸 쪽지 ♡',
      'sent.subtitle': '당신이 심은 다정한 작은 정원',
      'sent.loading': '불러오는 중…',
      'sent.empty': '아직 보낸 쪽지가 없어요 — 다정함을 심어보세요 ✿',
      'sent.anonTag': '익명으로 보냄',
      'sent.deleted': '(삭제된 사용자)',
      'sent.to': '받는 사람 ',

      'garden.title': '이웃 🏡',
      'garden.subtitle': '가까이 두고 싶은 새싹들 — 식물을 구경하고 쪽지를 보내세요 ✿',
      'garden.invitations': '🌱 받은 초대',
      'garden.invite.title': '💌 새싹 초대하기',
      'garden.invite.placeholder': '이메일 또는 닉네임',
      'garden.invite.submit': '초대 ♡',
      'garden.invite.sending': '보내는 중…',
      'garden.pending': '⏳ 수락 대기 중',
      'garden.your': '🏡 내 이웃',
      'garden.loading': '이웃을 불러오는 중…',
      'garden.empty': '아직 이웃이 없어요 — 위에서 초대해 보세요 ✿',
      'garden.accept': '수락 ✿',
      'garden.decline': '거절',
      'garden.send': '쪽지 보내기 ✉',
      'garden.removeTitle': '이웃 제거',
      'garden.removeConfirm': '이 이웃을 제거할까요? ✿',
      'garden.removedToast': '이웃을 제거했어요 ♡',
      'garden.removeFail': '제거할 수 없어요',
      'garden.acceptToast': '새 이웃이 이사 왔어요 🌱',
      'garden.acceptFail': '수락할 수 없어요',
      'garden.declineToast': '초대를 거절했어요 ♡',
      'garden.declineFail': '거절할 수 없어요',
      'garden.cancelToast': '초대를 취소했어요 ♡',
      'garden.cancelFail': '취소할 수 없어요',
      'notify.newLeaf.one': '새 잎이 화분에 돋아났어요 🍃',
      'notify.newLeaf.many': '새 잎 {count}장이 화분에 돋아났어요 🍃',
      'notify.unread.one': '읽지 않은 잎이 1장 있어요 — 잎을 눌러 읽어보세요 ✿',
      'notify.unread.many': '읽지 않은 잎이 {count}장 있어요 — 잎을 눌러 읽어보세요 ✿',
      'garden.inviteSent': '{name}님에게 초대를 보냈어요 💌',
      'garden.inviteAuto': '{name}님이 옆집으로 이사 왔어요 🌱 (이미 당신을 초대해 두었어요!)',

      'leaf.from.anon': '익명의 누군가에게서 ✿',
      'leaf.from.named': '{name}님이 보냄',
      'leaf.from.friend': '친구가 보냄',
      'leaf.invite.title': '이웃으로 추가',
      'leaf.invite.default': '내 이웃이 되어주세요 💌',
      'leaf.invite.friend': '이미 이웃이에요 ✿',
      'leaf.invite.pending': '초대 대기 중 ⏳',
      'leaf.invite.accept': '초대 수락 ♡',
      'leaf.invite.self': '당신이에요 ✿',
      'leaf.invite.checking': '확인 중…',
      'leaf.invite.sending': '보내는 중…',
      'leaf.joinedToast': '{name}님이 이사 왔어요 🌱',
      'leaf.sentToast': '초대를 보냈어요 💌',
      'leaf.sendFail': '보낼 수 없어요',

      'db.error.notfound': '해당 이메일이나 닉네임의 새싹을 찾을 수 없어요 ✿',
      'db.error.selfinvite': '자기 자신은 초대할 수 없어요 ♡',
      'db.error.alreadyfriend': '이미 이웃이에요 ✿',
      'db.error.alreadyinvited': '이미 초대를 보냈어요 ✿',
      'db.error.notlogged': '로그인되어 있지 않아요',

      'common.error': '문제가 생겼어요 ✿',
      'common.error.generic': '문제가 생겼어요',

      'lang.en': 'EN',
      'lang.ko': '한',

      'footer.madeBy': 'Claire Kim이 ♡으로 만들었어요',
      'footer.license': 'MIT 라이선스',
      'footer.github': 'GitHub',

      'copy.title': '클릭해서 복사',
      'copy.success': '클립보드에 복사됐어요 ♡',
      'copy.fail': '복사할 수 없어요 ✿',

      'plant.name.fallback': '식물 이름을 지어주세요 ✿',
      'plant.name.title': '클릭해서 이름 바꾸기',
      'plant.rename.prompt': '식물에게 어떤 이름을 지어줄까요?',
      'plant.rename.toast': '이름이 바뀌었어요 ♡',
      'plant.rename.fail': '이름을 바꿀 수 없어요 ✿',
      'plant.graduate.btn': '졸업하고 새 씨앗 심기 🌱',
      'plant.graduate.confirm': '식물이 만개했어요! 졸업하고 새 씨앗을 심을까요?',
      'plant.graduate.toast': '새 씨앗이 흙 속에서 잠들어 있어요 🌱',
      'plant.graduate.fail': '졸업할 수 없어요 ✿',
      'plant.planted': '심은 날 {date}',
      'plant.planted.today': '오늘 심었어요',
      'plant.planted.dayAgo': '어제 심었어요',
      'plant.planted.daysAgo': '{count}일 전에 심었어요',
      'plant.planted.date': '{date}에 심었어요',
      'plant.age.today': '오늘',
      'plant.age.dayAgo': '어제',
      'plant.age.daysAgo': '{count}일 전',

      'db.error.noplant': '활성 식물이 없어요',

      'plant.history.title': '🌿 정원의 추억',
      'plant.history.unnamed': '이름 없는 식물',
      'plant.history.leaves': '🍃 {count}장 · {date} 졸업',
      'plant.history.meta': '{start} 심음 · {end} 졸업 · 🍃 {count}장',
      'plant.history.count': '🍃 {count}장',

      'share.btn': '내 식물 공유하기 🔗',
      'share.title': 'Sprout ✿',
      'share.text': 'Sprout에서 내 식물을 구경해보세요 ✿',
      'share.copied': '링크가 복사됐어요 — 어디든 붙여넣으세요 ♡',
      'share.fail': '공유할 수 없어요 ✿',
      'shared.subtitle': '{name}님의 식물, 다정한 말로 자랐어요 ✿',
      'shared.meta': '다정함 🍃 {count}장',
      'shared.cta': '나도 식물 키우기 ✿',
      'shared.send': '다정한 한마디 보내기 ✿',
      'shared.sendNamed': '{name}님에게 다정한 한마디 보내기 ✿',
      'shared.notfound': '식물을 찾을 수 없어요 — 링크가 만료되었을 수 있어요 ✿',

      'plant.delete.title': '이 식물 영구 삭제',
      'plant.delete.btn': '이 식물 삭제하기 🥀',
      'plant.delete.confirm': '“{name}”과(와) 모든 메시지를 영구히 삭제할까요? 되돌릴 수 없어요.',
      'plant.delete.toast': '식물을 영구히 삭제했어요 🥀',
      'plant.delete.fail': '삭제할 수 없어요 ✿',

      'onboard.welcome': 'Sprout에 오신 걸 환영해요 ✿ 다정함으로 자라는 작은 정원이에요',
      'onboard.point1': '🌱 친구들이 다정한 말로 물을 줘요 — 쪽지 하나가 잎 하나가 돼요',
      'onboard.point2': '✉ 답장을 보내 친구의 식물도 키워줘요',
      'onboard.point3': '🌷 만개하면 졸업하고 새 씨앗을 받아요',
      'onboard.start': '씨앗 심으러 가기 🌱',
      'onboard.seed.title': '씨앗을 골라요 ✿',
      'onboard.seed.sub': '씨앗마다 다른 식물로 자라요 — 하나 골라 지켜봐요 ♡',
      'onboard.seed.item': '신비한 씨앗',
      'onboard.next': '다음 ✿',
      'onboard.name.title': '씨앗 이름을 지어요 ♡',
      'onboard.name.sub': '언제든 다시 바꿀 수 있어요',
      'onboard.name.placeholder': '비워두면 귀여운 이름 추천',
      'onboard.finish': '키우기 시작 🌱',
      'onboard.fail': '씨앗을 심을 수 없어요 ✿',
    },
  };

  // random cute messages, localized — used as send.msg placeholder
  const CUTE_MSGS = {
    en: [
      'you make the world brighter ✿',
      'thinking of you today ♡',
      'you’re a tiny ray of sunshine 🌞',
      'sending a little leaf of love 🍃',
      'you’re doing amazing, sweetie ✿',
      'hope your day is soft and cozy ☁',
      'you bloom so beautifully ❀',
      'just because — i appreciate you ♡',
      'a little hi from a friend ✿',
      'remember to drink some water today 🌱',
      'your kindness is contagious ♡',
    ],
    ko: [
      '너 덕분에 세상이 더 환해 ✿',
      '오늘 너 생각이 났어 ♡',
      '너는 작은 햇살 같아 🌞',
      '작은 잎사귀에 사랑을 담아 보내 🍃',
      '너 정말 잘하고 있어, 예뻐 ✿',
      '오늘 하루가 포근하길 ☁',
      '너의 꽃이 정말 예쁘게 피어 ❀',
      '그냥 — 너에게 고마워 ♡',
      '친구가 보내는 작은 인사 ✿',
      '오늘 물 마시는 거 잊지 마 🌱',
      '너의 다정함은 전염돼 ♡',
    ],
  };

  function pickRandomMsg(lang) {
    const pool = CUTE_MSGS[lang] || CUTE_MSGS.en;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const i18n = {
    lang: 'en',

    t(key, vars) {
      const dict = STRINGS[this.lang] || STRINGS.en;
      let s = dict[key];
      if (s === undefined) s = STRINGS.en[key] !== undefined ? STRINGS.en[key] : key;
      if (vars) {
        for (const k in vars) {
          s = s.split('{' + k + '}').join(vars[k]);
        }
      }
      return s;
    },

    randomMsg() { return pickRandomMsg(this.lang); },

    set(lang) {
      if (!STRINGS[lang]) lang = 'en';
      this.lang = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      document.documentElement.setAttribute('lang', lang);
      this.apply();
      this._updateToggle();
      subscribers.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
    },

    apply(root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = this.t(el.dataset.i18n);
      });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = this.t(el.dataset.i18nPlaceholder);
      });
      root.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = this.t(el.dataset.i18nTitle);
      });
    },

    on(cb) { subscribers.push(cb); },

    _updateToggle() {
      document.querySelectorAll('.lang-opt').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === this.lang);
      });
    },

    init() {
      let saved;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      // default to English on first visit; user can opt into Korean via toggle
      if (!saved) saved = 'en';
      this.lang = STRINGS[saved] ? saved : 'en';
      document.documentElement.setAttribute('lang', this.lang);
      this.apply();
      this._updateToggle();

      document.addEventListener('click', e => {
        const opt = e.target.closest('.lang-opt');
        if (!opt) return;
        e.preventDefault();
        this.set(opt.dataset.lang);
      });
    },
  };

  window.i18n = i18n;
})();
