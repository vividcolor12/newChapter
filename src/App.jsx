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
        <Profile />
        <Video />
        <Calendar />
        <Together />
        <Timeline />
        <Interview />
        <MiddleImage1 />
        <Location slots={slots} />
        <Notice1 />
        <Gallery />
        <Guestbook />
        <Account />
        <Rsvp />
        <Snap />
        <Flower />
        <MiddleImage2 />
        <MiddleImage3 />
        <MiddleImage4 />
        <MiddleImage5 />
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

      <div className="clone-floats">
        <button type="button" className="floating-menu-btn bg_theme_white is-hi" style={{ background: 'rgba(250, 250, 250, 0.6)' }} aria-label="메뉴">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12.668 18.5002C13.0822 18.5002 13.418 18.836 13.418 19.2502C13.4179 19.6643 13.0821 20.0002 12.668 20.0002H3.75C3.33583 20.0002 3.00007 19.6643 3 19.2502C3 18.836 3.33579 18.5002 3.75 18.5002H12.668Z" fill="var(--label-primary)" />
            <path fillRule="evenodd" clipRule="evenodd" d="M11.0205 5.82099C12.6083 3.07086 16.1249 2.12827 18.875 3.71601C21.6252 5.30384 22.5677 8.82081 20.98 11.571C20.5901 12.2462 20.083 12.8114 19.5005 13.258L20.7358 15.3981C20.9429 15.7568 20.82 16.2154 20.4614 16.4225C20.1027 16.6296 19.6441 16.5068 19.437 16.1481L18.2007 14.0065C16.6063 14.6658 14.7346 14.6048 13.125 13.6755C10.375 12.0876 9.43286 8.57111 11.0205 5.82099ZM18.125 5.01532C16.0923 3.84171 13.4929 4.53827 12.3193 6.57099C11.1459 8.60368 11.8424 11.2031 13.875 12.3766C15.9077 13.5503 18.5071 12.8536 19.6807 10.821C20.8542 8.78825 20.1577 6.18894 18.125 5.01532Z" fill="var(--label-primary)" />
            <path d="M8.78955 14.5002C9.20376 14.5002 9.53955 14.836 9.53955 15.2502C9.53948 15.6643 9.20372 16.0002 8.78955 16.0002H3.75049C3.33632 16.0002 3.00056 15.6643 3.00049 15.2502C3.00049 14.836 3.33627 14.5002 3.75049 14.5002H8.78955Z" fill="var(--label-primary)" />
            <path d="M8.78955 10.4997C9.20376 10.4997 9.53955 10.8355 9.53955 11.2497C9.53949 11.638 9.24446 11.9575 8.86621 11.9958L8.78955 11.9997H3.75C3.33583 11.9997 3.00007 11.6639 3 11.2497C3 10.8355 3.33579 10.4997 3.75 10.4997H8.78955Z" fill="var(--label-primary)" />
          </svg>
        </button>
        <a data-v-7727513a="" className="floatingBox bg_theme_white see hi" style={{ background: 'rgba(250, 250, 250, 0.6)' }}>
          <svg data-v-7727513a="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path data-v-7727513a="" d="M16.5182 7.48176C16.8897 7.85331 16.8897 8.45537 16.5182 8.82692C16.1466 9.19847 15.5442 9.19881 15.1727 8.82727C14.8011 8.45571 14.8011 7.85297 15.1727 7.48141C15.5442 7.10986 16.1466 7.11021 16.5182 7.48176Z" fill="var(--label-primary)" />
            <path data-v-7727513a="" fillRule="evenodd" clipRule="evenodd" d="M19.6863 4.52075C20.4552 5.36852 20.5677 6.47715 20.2892 7.43411C20.8447 8.25032 21.0803 9.32652 20.6289 10.3613C21.0934 10.9356 21.2562 11.6507 21.2024 12.3234C21.7713 12.9878 22.091 13.924 21.7683 14.9181L21.7251 15.04C21.3777 15.9589 20.6012 16.4909 19.7858 16.6859C19.3296 17.4326 18.5371 18.0253 17.4918 18.0255L17.4908 18.0252C17.4774 18.248 17.4481 18.4727 17.4003 18.6978C17.359 18.8923 17.2418 19.0624 17.0751 19.1708C16.9084 19.279 16.7054 19.317 16.5109 19.2757L11.0136 18.1067L11.6347 19.6144L10.7101 19.9956L9.97604 18.2147V21.2959L8.9758 21.2955V18.6225L7.51532 20.083C6.52037 21.0779 4.90712 21.0778 3.91211 20.083C2.91748 19.088 2.91716 17.4747 3.91211 16.4798L6.15428 14.2376L4.719 7.48452C4.67778 7.29006 4.71569 7.08707 4.82396 6.92036C4.9323 6.75361 5.10248 6.63646 5.29698 6.59511C5.52345 6.54702 5.74975 6.51761 5.97405 6.50431C5.97563 5.46078 6.56782 4.66947 7.31368 4.21381C7.50866 3.39841 8.04072 2.6219 8.95957 2.27444L9.0811 2.23163C10.0752 1.90892 11.0118 2.22832 11.6761 2.79718C12.3488 2.74342 13.064 2.9062 13.6383 3.37067C14.6729 2.91935 15.7491 3.15502 16.5655 3.71041C17.5632 3.42003 18.7257 3.55475 19.5855 4.41441L19.6863 4.52075ZM4.97277 17.5404C4.56371 17.9495 4.56376 18.613 4.97277 19.0223C5.38199 19.4314 6.0455 19.4315 6.45466 19.0223L8.39023 17.0867L6.90834 15.6049L4.97277 17.5404ZM14.6074 12.2989C14.1697 11.8613 13.6444 11.5792 13.1042 11.4496C12.83 11.3837 12.6155 11.1692 12.5497 10.8951C12.428 10.3886 12.1729 9.89536 11.7811 9.47533L11.701 9.39247C10.8777 8.56926 9.75228 8.29919 8.79695 8.55105L8.60843 8.60837C8.41305 8.6758 8.19962 8.65917 8.01837 8.56521L7.94276 8.51998C7.48097 8.20693 6.93517 8.02118 6.36178 7.99828L7.69693 14.2811L7.70142 14.2766L9.71985 16.295L9.7164 16.2985L15.9968 17.6326C15.9759 17.1124 15.8212 16.6148 15.5587 16.1821L15.4779 16.0565C15.3624 15.8855 15.3232 15.6755 15.3667 15.4764L15.3905 15.3918C15.7229 14.43 15.5004 13.2532 14.6879 12.3821L14.6074 12.2989Z" fill="var(--label-primary)" />
          </svg>
          <span data-v-7727513a="">축하 화환 보내기</span>
        </a>
      </div>

      {menuOpen ? <MenuDrawer /> : null}
    </div>
  );
}
