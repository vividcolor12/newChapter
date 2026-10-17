import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { photo } from '../data/photos.js';

const LOTTIE = `${import.meta.env.BASE_URL}assets/opening/v2.json`;

// 오프닝에 쓰는 사진(16: 확대되는 사진, 04: 먼저 보이는 사진)과 본문 메인 사진(01).
const PRELOAD = [photo('16'), photo('04'), photo('01')];
// 느린 네트워크에서도 오프닝이 영원히 멈추지 않도록 하는 상한(ms).
const PRELOAD_TIMEOUT = 4000;
// 애니메이션(5s)이 끝나지 않더라도 이 시간(ms) 뒤에는 오프닝을 닫습니다.
const SAFETY_TIMEOUT = 7000;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    if (img.decode) {
      img.decode().then(resolve, resolve);
    } else {
      img.onload = img.onerror = () => resolve();
    }
  });
}

export default function Opening({ onDone }) {
  const textRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const doneRef = useRef(false);
  const [ready, setReady] = useState(false);
  onDoneRef.current = onDone;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  // 사진이 모두 디코딩된 뒤에 애니메이션을 시작해야, 로딩 중인 사진이
  // 번쩍 나타나거나 확대가 중간부터 보이는 일이 없습니다.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) setReady(true);
    };
    const timer = setTimeout(start, PRELOAD_TIMEOUT);
    Promise.all(PRELOAD.map(loadImage)).then(() => {
      clearTimeout(timer);
      start();
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const anim = lottie.loadAnimation({
      container: textRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: LOTTIE,
    });
    const timer = setTimeout(finish, SAFETY_TIMEOUT);
    return () => {
      clearTimeout(timer);
      anim.destroy();
    };
  }, [ready]);

  // 전체 페이드아웃(.bg_div)이 끝나는 순간에 오프닝을 닫습니다.
  const handleAnimationEnd = (e) => {
    if (e.target === e.currentTarget) finish();
  };

  return (
    <div
      data-v-4d187d36=""
      data-v-6faeaaac=""
      className={`container overlay-color-purple${ready ? ' keys' : ''}`}
      style={{ display: 'block', background: 'transparent' }}
    >
      <div data-v-4d187d36="" className="opening_bg">
        <div data-v-4d187d36="" className="bg_div" onAnimationEnd={handleAnimationEnd}>
          <div data-v-4d187d36="" className="overlay-div"></div>
          {ready ? (
            <>
              <img data-v-4d187d36="" className="img_01" src={photo('16')} alt="" />
              <img data-v-4d187d36="" className="img_02" src={photo('04')} alt="" />
            </>
          ) : null}
        </div>
      </div>
      <div data-v-4d187d36="" className="opening_text" ref={textRef}></div>
    </div>
  );
}
