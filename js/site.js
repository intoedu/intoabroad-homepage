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
