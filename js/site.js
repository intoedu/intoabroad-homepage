/* 인투유학 공용 스크립트 — 모바일 메뉴 + 상담 신청 폼 전송 */

// 모바일 햄버거 메뉴
document.querySelector('.nav-toggle')?.addEventListener('click', (e) => {
  const nav = document.querySelector('.nav');
  const open = nav.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

// 푸터 연도 자동 표기
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* 프로그램 카드 — 마감 리본 + 지난 캠프 자동 숨김.
   data-deadline="YYYY-MM-DD" — 출발일. 회차가 여러 개인 캠프는 '마지막 회차' 출발일을 씁니다.
     D-20 ~ D-11 '신청 마감 임박' · D-10 ~ 당일 '신청 마감' · 출발일이 지나면 카드를 아예 내립니다.
     출발한 캠프는 더 신청할 수 없으므로, 일정이 끝난 카드를 손으로 주석 처리할 필요가 없습니다.
   data-badge="정원 마감" — 날짜와 상관없이 직접 띄울 때. 선착순 마감 등 수동 처리용이며 날짜 계산보다 우선합니다.
     단 출발일이 지나면 숨김이 먼저입니다 — 이미 떠난 캠프를 광고하지 않기 위해서입니다.
   날짜가 확정되지 않은 프로그램(기수제 등)은 두 속성 다 넣지 않으면 아무것도 붙지 않습니다. */
const RIBBON = { soon: '신청 마감 임박', closed: '신청 마감' };

const cardState = (days) =>
  days < 0 ? 'past' : days > 20 ? 'open' : days > 10 ? 'soon' : 'closed';

const daysUntil = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
};

document.querySelectorAll('.prog-card[data-deadline], .prog-card[data-badge]').forEach((card) => {
  const { deadline, badge } = card.dataset;
  const state = deadline ? cardState(daysUntil(deadline)) : 'closed';

  if (state === 'past') return card.remove();
  if (state === 'open' && !badge) return;

  const el = document.createElement('span');
  el.className = 'prog-ribbon prog-ribbon--' + (badge ? 'closed' : state);
  el.textContent = badge || RIBBON[state];
  card.classList.add('has-ribbon');
  card.prepend(el);

  // 마감된 카드는 '전화 상담' 버튼을 눌리지 않는 '신청 마감' 버튼으로 교체합니다.
  if (badge || state === 'closed') {
    const tel = card.querySelector('.prog-actions a[href^="tel:"]');
    if (tel) tel.outerHTML = '<span class="btn btn-closed">신청 마감</span>';
  }
});

// 자기 점검: 주소 뒤에 ?selftest 를 붙이고 콘솔을 보면 경계값이 맞는지 확인됩니다.
if (location.search.includes('selftest')) {
  console.assert(cardState(21) === 'open', '21일 전 — 리본 없음');
  console.assert(cardState(20) === 'soon', '20일 전 — 마감 임박');
  console.assert(cardState(11) === 'soon', '11일 전 — 마감 임박');
  console.assert(cardState(10) === 'closed', '10일 전 — 마감');
  console.assert(cardState(0) === 'closed', '출발 당일 — 마감');
  console.assert(cardState(-1) === 'past', '출발 다음날 — 카드 숨김');

  // 날짜 계산이 시간대에 밀리지 않는지. 오늘 날짜를 넣으면 반드시 0 이어야 합니다.
  const t = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  console.assert(
    daysUntil(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`) === 0,
    '오늘 날짜 — 0일'
  );
  console.log('마감 리본 자기 점검 통과');
}

/* 상담 신청 폼.
   FORM_ENDPOINT 가 비어 있으면 전송하지 않고 전화·카톡으로 안내합니다.
   빈 채로 두면 문의가 조용히 사라지기 때문에, 절대 성공한 척하지 않습니다. */
const FORM_ENDPOINT = ''; // 예: https://formspree.io/f/xxxxxxxx

const form = document.getElementById('consult-form');
if (form) {
  const msg = document.getElementById('form-msg');

  const show = (text, kind) => {
    msg.textContent = text;
    msg.className = 'form-msg show ' + kind;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!FORM_ENDPOINT) {
      show('아직 온라인 접수가 연결되지 않았습니다. 031-334-2414 또는 카톡 상담으로 문의해 주세요.', 'err');
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show('상담 신청이 접수되었습니다. 영업일 기준 1일 이내에 연락드리겠습니다.', 'ok');
    } catch (err) {
      show('전송에 실패했습니다. 031-334-2414 또는 카톡 상담으로 문의해 주세요.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
}
