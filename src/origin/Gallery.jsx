import { GALLERY, photo } from '../data/photos.js';

export default function Gallery() {
  return (
    <div data-v-0f70ab0a="" id="section-gallery">
      <section data-v-24d61f37="" data-v-0f70ab0a="" className="ft-gowundodum">
        <div data-v-81934de8="" data-v-24d61f37="" className="wrap aos-init" data-aos="fade-up">
          <div data-v-1e830424="" data-v-81934de8="" className="eng_title theme_emp_color_purple gowundodum">
            {"GALLERY"}
          </div>
          <div data-v-58a15c77="" data-v-81934de8="" className="ko_title theme_emp_color_purple ft-gowundodum">
            {"웨딩 갤러리"}
          </div>
        </div>
        <div data-v-71ec9210="" data-v-24d61f37="" className="gallLayerWrapper aos-init" data-aos="fade-up">
          <div data-v-71ec9210="" className="gallGridWrapper ratio multiple">
            {GALLERY.map(({ id, span }) => (
              <div
                key={id}
                data-v-71ec9210=""
                className="item"
                style={{ ...(span ? { gridArea: 'span 2' } : null), backgroundImage: `url("${photo(id)}")` }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
