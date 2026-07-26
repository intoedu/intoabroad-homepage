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

/* 프로그램 카드 마감 리본.
   data-deadline="YYYY-MM-DD" — 출발일. 회차가 여러 개인 캠프는 '마지막 회차' 출발일을 씁니다.
     20일 전부터 '신청 마감 임박', 10일 전부터(지난 일정 포함) '신청 마감'.
   data-badge="정원 마감" — 날짜와 상관없이 직접 띄울 때. 선착순 마감 등 수동 처리용이며 날짜 계산보다 우선합니다.
   날짜가 확정되지 않은 프로그램(기수제 등)은 두 속성 다 넣지 않으면 리본이 안 붙습니다. */
const ribbonFor = (days) =>
  days > 20 ? null : days > 10 ? ['soon', '신청 마감 임박'] : ['closed', '신청 마감'];

const daysUntil = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
};

document.querySelectorAll('.prog-card[data-deadline], .prog-card[data-badge]').forEach((card) => {
  const manual = card.dataset.badge;
  const ribbon = manual ? ['closed', manual] : ribbonFor(daysUntil(card.dataset.deadline));
  if (!ribbon) return;

  const el = document.createElement('span');
  el.className = 'prog-ribbon prog-ribbon--' + ribbon[0];
  el.textContent = ribbon[1];
  card.classList.add('has-ribbon');
  card.prepend(el);
});

// 자기 점검: 주소 뒤에 ?selftest 를 붙이고 콘솔을 보면 경계값이 맞는지 확인됩니다.
if (location.search.includes('selftest')) {
  console.assert(ribbonFor(21) === null, '21일 전 — 리본 없음');
  console.assert(ribbonFor(20)[1] === '신청 마감 임박', '20일 전 — 마감 임박');
  console.assert(ribbonFor(11)[1] === '신청 마감 임박', '11일 전 — 마감 임박');
  console.assert(ribbonFor(10)[1] === '신청 마감', '10일 전 — 마감');
  console.assert(ribbonFor(0)[1] === '신청 마감', '당일 — 마감');
  console.assert(ribbonFor(-5)[1] === '신청 마감', '지난 일정 — 마감');
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
