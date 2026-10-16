import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { photo } from '../data/photos.js';

const LOTTIE = '/assets/opening/v2.json';

export default function Opening({ onDone }) {
  const textRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: textRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: LOTTIE,
    });
    const timer = setTimeout(() => onDoneRef.current(), 5500);
    return () => {
      clearTimeout(timer);
      anim.destroy();
    };
  }, []);

  return (
    <div data-v-4d187d36="" data-v-6faeaaac="" className="container overlay-color-purple keys" style={{ display: 'block', background: 'transparent' }}>
      <div data-v-4d187d36="" className="opening_bg">
        <div data-v-4d187d36="" className="bg_div">
          <div data-v-4d187d36="" className="overlay-div" />
          <img data-v-4d187d36="" className="img_02" src={photo('MPMwdMvauB', '?f=webp&w=1280')} alt="" />
          <img data-v-4d187d36="" className="img_01" src={photo('vFjGssjYrw', '?f=webp&w=1280')} alt="" />
        </div>
      </div>
      <div data-v-4d187d36="" className="opening_text" ref={textRef} />
    </div>
  );
}
