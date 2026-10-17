import { useEffect, useRef, useState } from 'react';
import Main from './origin/Main.jsx';
import Intro from './origin/Intro.jsx';
import Profile from './origin/Profile.jsx';
import Video from './origin/Video.jsx';
import Calendar from './origin/Calendar.jsx';
import Together from './origin/Together.jsx';
import Timeline from './origin/Timeline.jsx';
import Interview from './origin/Interview.jsx';
import MiddleImage1 from './origin/MiddleImage1.jsx';
import Location from './origin/Location.jsx';
import Notice1 from './origin/Notice1.jsx';
import Gallery from './origin/Gallery.jsx';
import Guestbook from './origin/Guestbook.jsx';
import Account from './origin/Account.jsx';
import Rsvp from './origin/Rsvp.jsx';
import Snap from './origin/Snap.jsx';
import Flower from './origin/Flower.jsx';
import MiddleImage2 from './origin/MiddleImage2.jsx';
import MiddleImage3 from './origin/MiddleImage3.jsx';
import MiddleImage4 from './origin/MiddleImage4.jsx';
import MiddleImage5 from './origin/MiddleImage5.jsx';
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

const NAVI_LINKS = {
  네이버지도: 'navermaps://?menu=location&pinType=place&lat=37.5222644&lng=127.0390162&title=%EC%84%9C%EC%9A%B8%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EC%84%A0%EB%A6%89%EB%A1%9C%20757',
  티맵: 'tmap://route?goalx=127.0390162&goaly=37.5222644&goalname=%EC%84%9C%EC%9A%B8%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EC%84%A0%EB%A6%89%EB%A1%9C%20757',
};

const MENU_SECTIONS = {
  인사말: 'section-intro',
  '신랑/신부 프로필': 'section-profile',
  '달력, 디데이': 'section-calendar',
  '함께한 시간': 'section-together',
  타임라인: 'section-timeline',
  인터뷰: 'section-interview',
  '중간 디자인 1': 'section-middle-image1',
  '오시는 길, 교통수단': 'section-location',
  '포토부스 이용안내': 'section-notice1',
  갤러리: 'section-gallery',
  방명록: 'section-guestbook',
  '마음전하실 곳': 'section-account',
  참석의사: 'section-rsvp',
  '축하 사진 공유': 'section-snap',
  '중간 디자인 2': 'section-middle-image2',
  '중간 디자인 3': 'section-middle-image3',
  '중간 디자인 4': 'section-middle-image4',
};

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
  'mRXE6cy9D1', 'uoROFzOsTT', 'GSCWyFMnxv', 'dOQT7LerCJ', 'kYLpP444zT', 'eXlFWiyhnn', 'l1RNEDwHZz',
  '5h4Yk5Kx4l', '3GKEVh4Sbl', 'RYGkCtMtSk', 'cA3DIg46kw', 'OVAvqns4nX', 'NGkpHR24wP', 'IcUPCg5PRX',
];

const slots = {
  map: <img src="/assets/location/map.png" alt="지도" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
};

function useAos(rootRef) {
  useEffect(() => {
    const els = rootRef.current.querySelectorAll('[data-aos]');
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
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
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

    if (t.closest('#section-guestbook .remove')) {
      window.alert('샘플 청첩장에는 방명록 삭제가 불가능합니다.');
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

    if (t.closest('.drawer-close')) {
      setMenuOpen(false);
      return;
    }

    const sectionItem = t.closest('.section-item');
    if (sectionItem) {
      const id = MENU_SECTIONS[sectionItem.textContent.trim()];
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
      return;
    }

    const actionItem = t.closest('.action-item');
    if (actionItem) {
      const label = actionItem.textContent.trim();
      if (label === '참석의사 전달하기') setPopup('rsvp');
      if (label === '축하 사진 공유 하기') document.getElementById('section-snap')?.scrollIntoView({ behavior: 'smooth' });
      if (label === '축하화환 보내기') setPopup('flower');
      setMenuOpen(false);
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

    const navi = t.closest('.navi_button_wrap > button');
    if (navi) {
      const label = navi.textContent.trim();
      window.alert('앱이 설치되어 있지 않은 경우 길 안내가 실행되지 않을 수 있습니다');
      if (NAVI_LINKS[label]) window.location.assign(NAVI_LINKS[label]);
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
        <Snap />
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
