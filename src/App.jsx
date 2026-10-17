import { useEffect, useRef, useState } from 'react';
import Main from './origin/Main.jsx';
import Intro from './origin/Intro.jsx';
import Gallery from './origin/Gallery.jsx';
import Account from './origin/Account.jsx';
import EndingV2Area from './origin/EndingV2Area.jsx';
import GalleryViewer from './components/GalleryViewer.jsx';
import ContactPopup from './origin/popups/ContactPopup.jsx';
import InterviewPopup from './origin/popups/InterviewPopup.jsx';
import SketchPopup from './origin/popups/SketchPopup.jsx';
import GuestbookWritePopup from './origin/popups/GuestbookWritePopup.jsx';
import GuestbookListPopup from './origin/popups/GuestbookListPopup.jsx';
import CopyAlert from './origin/popups/CopyAlert.jsx';
import RsvpPopup from './origin/popups/RsvpPopup.jsx';
import FlowerPopup from './origin/popups/FlowerPopup.jsx';
import MenuDrawer from './origin/popups/MenuDrawer.jsx';
import Opening from './origin/Opening.jsx';
import { photo } from './data/photos.js';

const POPUPS = {
  contact: ContactPopup,
  interview: InterviewPopup,
  sketch: SketchPopup,
  guestbookWrite: GuestbookWritePopup,
  guestbookList: GuestbookListPopup,
  copy: CopyAlert,
  rsvp: RsvpPopup,
  flower: FlowerPopup,
};

const BGM = 'https://theirmood.com/src/bgm/romantic-memories.mp3';

const POPUP_TRIGGERS = [
  ['#section-intro button', 'contact'],
  ['.interview-open-btn', 'interview'],
  ['.sketch-map', 'sketch'],
  ['#section-guestbook .open-all', 'guestbookList'],
  ['#section-guestbook button', 'guestbookWrite'],
  ['#section-rsvp button', 'rsvp'],
];

const POPUP_CLOSERS = '.close-btn, .x_button, .pop-alert button, .pop-alert .background, .popup-wrapper.bottom-sheet-mode .overlay';

const ARROW_DOWN = 'M10.2349 3.48486C10.3813 3.33841 10.6187 3.33841 10.7651 3.48486C10.9116 3.6313 10.9116 3.86869 10.7651 4.01513L6.26513 8.51513C6.11869 8.66157 5.8813 8.66157 5.73486 8.51513L1.23486 4.01513L1.20898 3.98656C1.08895 3.83928 1.0976 3.62211 1.23486 3.48486C1.37211 3.3476 1.58928 3.33895 1.73656 3.45898L1.76513 3.48486L5.99999 7.71972L10.2349 3.48486Z';
const ARROW_UP = 'M5.7634 3.45897C5.91069 3.33895 6.12786 3.3476 6.26511 3.48485L10.7651 7.98485L10.791 8.01341C10.911 8.1607 10.9023 8.37787 10.7651 8.51512C10.6279 8.65237 10.4107 8.66101 10.2634 8.541L10.2348 8.51512L5.99997 4.28026L1.76511 8.51512C1.61867 8.66156 1.38128 8.66155 1.23483 8.51512C1.08839 8.36868 1.08839 8.1313 1.23483 7.98485L5.73484 3.48485L5.7634 3.45897Z';

function showTimelineSlide(slides, next) {
  slides.forEach((s, i) => {
    s.style.display = i === next ? '' : 'none';
  });
}

// #region agent log
const dbg = (message, data) => fetch('http://127.0.0.1:7745/ingest/da6d8c34-7722-40f6-b626-687107da8c65',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8edb7f'},body:JSON.stringify({sessionId:'8edb7f',runId:'interactions',hypothesisId:'D',location:'App.jsx:handleClick',message,data,timestamp:Date.now()})}).catch(()=>{});
// #endregion

const GALLERY_IDS = [
  '01', '07', '04', '10', '02', '03', '06',
  '12', '08', '05', '11', '14', '13', '09',
  '15', '20', '17', '16', '18', '19',
];

const slots = {
  map: <img src="/assets/location/map.png" alt="지도" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
};

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

    // Elements rendered later (or given data-aos later, e.g. on hot reload) must be observed too,
    // otherwise they stay at opacity: 0 forever.
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
  const [popup, setPopup] = useState(null);
  const [opening, setOpening] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  useAos(rootRef);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const finishOpening = () => {
    setOpening(false);
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  useEffect(() => {
    if (!popup) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [popup]);

  // #region agent log
  useEffect(() => {
    const blocks = [...rootRef.current.children].map((el) => ({ id: el.id || el.className, h: Math.round(el.getBoundingClientRect().height) }));
    fetch('http://127.0.0.1:7745/ingest/da6d8c34-7722-40f6-b626-687107da8c65',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8edb7f'},body:JSON.stringify({sessionId:'8edb7f',runId:'post-fix-2',hypothesisId:'C',location:'App.jsx:mount',message:'block heights',data:{viewport:window.innerWidth,rootFontSize:getComputedStyle(document.documentElement).fontSize,blocks},timestamp:Date.now()})}).catch(()=>{});
  }, []);
  // #endregion

  const handleClick = (e) => {
    const t = e.target;
    const item = t.closest('.gallGridWrapper .item');
    if (item) {
      setViewerIndex([...item.parentElement.children].indexOf(item));
      return;
    }

    const tlBtn = t.closest('.timeline-v2 .action-btn, .timeline-v2 .nav-btn');
    if (tlBtn) {
      const slides = [...rootRef.current.querySelectorAll('.timeline-v2 .slide')];
      const current = slides.indexOf(tlBtn.closest('.slide'));
      let next = current + 1;
      if (tlBtn.classList.contains('nav-btn')) {
        const isPrev = tlBtn === tlBtn.parentElement.querySelector('.nav-btn');
        next = isPrev ? current - 1 : current + 1;
      }
      next = Math.max(0, Math.min(slides.length - 1, next));
      showTimelineSlide(slides, next);
      dbg('timeline', { current, next, total: slides.length });
      return;
    }

    const head = t.closest('#section-account .list-head');
    if (head) {
      const list = head.parentElement.querySelector('.item-list');
      const open = list.classList.toggle('on');
      head.querySelector('path').setAttribute('d', open ? ARROW_UP : ARROW_DOWN);
      dbg('account accordion', { open });
      return;
    }

    const copyBtn = t.closest('#section-account .holder, #section-account .account');
    if (copyBtn) {
      const li = copyBtn.closest('.item');
      const text = `${li.querySelector('.bnk').textContent} ${li.querySelector('.nmb').textContent}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      setPopup('copy');
      dbg('account copy', { text });
      return;
    }


    if (t.closest('.sound')) {
      toggleAudio();
      return;
    }

    if (t.closest('.floating-menu-btn')) {
      setMenuOpen((open) => !open);
      return;
    }

    if (t.closest('.floatingBox')) {
      setPopup('flower');
      return;
    }

    const tabItem = t.closest('.tab-item');
    if (tabItem) {
      const label = tabItem.textContent.replace(/\s+/g, '');
      if (label.includes('링크복사')) {
        navigator.clipboard?.writeText(window.location.href).catch(() => {});
        setPopup('copy');
      }
      if (label.includes('카카오톡')) window.open('https://sharer.kakao.com/picker/link');
      setMenuOpen(false);
      return;
    }

    const trigger = POPUP_TRIGGERS.find(([sel]) => t.closest(sel));
    dbg('click', { cls: t.className?.baseVal ?? t.className, popup: trigger?.[1] ?? null });
    if (trigger) setPopup(trigger[1]);
  };

  const handlePopupClick = (e) => {
    if (e.target.closest(POPUP_CLOSERS)) setPopup(null);
  };

  const Popup = popup ? POPUPS[popup] : null;

  return (
    <div className="clone-shell" onClick={handleClick}>
      {/* Entrance RSVP popup intentionally omitted */}
      {opening ? <Opening onDone={finishOpening} /> : null}
      <audio ref={audioRef} src={BGM} loop />
      <div className="bgm-wrapper bg_theme_white">
        <div className="bgm-banner">
          <button type="button" className="sound" aria-label="배경음악">
            {['no-1', 'no-2', 'no-3', 'no-4'].map((name) => (
              <span key={name} className={playing ? name : `${name} paused`} />
            ))}
          </button>
        </div>
      </div>
      <div
        ref={rootRef}
        data-v-0f70ab0a=""
        data-v-0fac639e=""
        className={`container bg_theme_white theme_emp_color_purple ft-gowundodum bg_pattern_small_flower${(popup && popup !== 'copy') || viewerIndex !== null ? ' blur-active' : ''}`}
      >
        <Main />
        <Intro />
        <Gallery />
        <Account />
        <EndingV2Area />
      </div>

      {viewerIndex !== null ? (
        <GalleryViewer
          images={GALLERY_IDS.map((id) => photo(id, '?f=webp&w=1280'))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}

      {Popup ? (
        <div data-v-9742d2b2="" className="popup-stack bg_theme_white" onClick={handlePopupClick}>
          <Popup />
        </div>
      ) : null}


      {menuOpen ? <MenuDrawer /> : null}
    </div>
  );
}
