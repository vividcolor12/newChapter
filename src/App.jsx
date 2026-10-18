import { useEffect, useRef, useState } from 'react';
import Main from './origin/Main.jsx';
import Intro from './origin/Intro.jsx';
import Gallery from './origin/Gallery.jsx';
import Account, { ARROW_DOWN, ARROW_UP } from './origin/Account.jsx';
import EndingV2Area from './origin/EndingV2Area.jsx';
import GalleryViewer from './components/GalleryViewer.jsx';
import CopyAlert from './origin/popups/CopyAlert.jsx';
import Opening from './origin/Opening.jsx';
import { GALLERY, photo } from './data/photos.js';
import { ACCOUNTS, DEFAULT_PAGE, getPageKey } from './data/accounts.js';
import { INTRO } from './data/intro.js';

// 이 페이지(/p, /j, /z)의 계좌 정보. null 이면 계좌 섹션을 그리지 않습니다.
const PAGE_KEY = getPageKey();
const ACCOUNT_LIST = ACCOUNTS[PAGE_KEY];
// 이 페이지의 인트로 문구. 전용 문구가 없으면 default 를 씁니다. (src/data/intro.js)
const INTRO_TEXT = INTRO[PAGE_KEY] ?? INTRO.default;
// 기본 페이지(z)에서는 인트로의 부모님 이름(.section-footer)도 생략합니다.
const SHOW_INTRO_FOOTER = PAGE_KEY !== DEFAULT_PAGE;
const GALLERY_IMAGES = GALLERY.map(({ id }) => photo(id));

// data-aos 요소가 화면에 들어오면 aos-animate 클래스를 붙여 페이드인시킵니다.
function useAos(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    const seen = new WeakSet();
    const observe = (el) => {
      if (seen.has(el) || el.classList.contains('aos-animate')) return;
      seen.add(el);
      io.observe(el);
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.hasAttribute('data-aos')) observe(node);
      node.querySelectorAll('[data-aos]').forEach(observe);
    };
    scan(root);

    // 나중에 렌더링되거나 data-aos 가 나중에 붙는 요소(핫 리로드 등)도 관찰해야
    // opacity: 0 상태로 남지 않습니다.
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') scan(m.target);
        else m.addedNodes.forEach(scan);
      });
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-aos'],
    });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [rootRef]);
}

export default function App() {
  const rootRef = useRef(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [opening, setOpening] = useState(true);
  useAos(rootRef);

  // 오프닝 애니메이션이 끝날 때까지 페이지 스크롤을 막습니다.
  useEffect(() => {
    if (!opening) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const stop = (e) => e.preventDefault();
    const stopKey = (e) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
    };
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('wheel', stop, { passive: false });
    document.addEventListener('keydown', stopKey);
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      document.removeEventListener('touchmove', stop);
      document.removeEventListener('wheel', stop);
      document.removeEventListener('keydown', stopKey);
    };
  }, [opening]);

  useEffect(() => {
    if (!copyOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [copyOpen]);

  const handleClick = (e) => {
    const t = e.target;

    const item = t.closest('.gallGridWrapper .item');
    if (item) {
      setViewerIndex([...item.parentElement.children].indexOf(item));
      return;
    }

    // 계좌번호 아코디언
    const head = t.closest('#section-account .list-head');
    if (head) {
      const list = head.parentElement.querySelector('.item-list');
      const open = list.classList.toggle('on');
      head.querySelector('path').setAttribute('d', open ? ARROW_UP : ARROW_DOWN);
      return;
    }

    // 계좌번호 복사
    const copyBtn = t.closest('#section-account .copy-btn');
    if (copyBtn) {
      const li = copyBtn.closest('.item');
      const text = `${li.querySelector('.bnk').textContent} ${li.querySelector('.nmb').textContent}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopyOpen(true);
    }
  };

  return (
    <div className="clone-shell" onClick={handleClick}>
      {opening ? <Opening onDone={() => setOpening(false)} /> : null}
      <div
        ref={rootRef}
        data-v-0f70ab0a=""
        data-v-0fac639e=""
        className={`container bg_theme_white theme_emp_color_purple ft-gowundodum bg_pattern_small_flower${viewerIndex !== null ? ' blur-active' : ''}`}
      >
        <Main />
        <Intro text={INTRO_TEXT} showFooter={SHOW_INTRO_FOOTER} />
        <Gallery />
        {ACCOUNT_LIST ? <Account accounts={ACCOUNT_LIST} /> : null}
        <EndingV2Area />
      </div>

      {viewerIndex !== null ? (
        <GalleryViewer images={GALLERY_IMAGES} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      ) : null}

      {copyOpen ? (
        <div
          data-v-9742d2b2=""
          className="popup-stack bg_theme_white"
          onClick={(e) => {
            if (e.target.closest('.pop-alert button, .pop-alert .background')) setCopyOpen(false);
          }}
        >
          <CopyAlert />
        </div>
      ) : null}
    </div>
  );
}
