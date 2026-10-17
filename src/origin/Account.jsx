export const ARROW_DOWN = 'M10.2349 3.48486C10.3813 3.33841 10.6187 3.33841 10.7651 3.48486C10.9116 3.6313 10.9116 3.86869 10.7651 4.01513L6.26513 8.51513C6.11869 8.66157 5.8813 8.66157 5.73486 8.51513L1.23486 4.01513L1.20898 3.98656C1.08895 3.83928 1.0976 3.62211 1.23486 3.48486C1.37211 3.3476 1.58928 3.33895 1.73656 3.45898L1.76513 3.48486L5.99999 7.71972L10.2349 3.48486Z';
export const ARROW_UP = 'M5.7634 3.45897C5.91069 3.33895 6.12786 3.3476 6.26511 3.48485L10.7651 7.98485L10.791 8.01341C10.911 8.1607 10.9023 8.37787 10.7651 8.51512C10.6279 8.65237 10.4107 8.66101 10.2634 8.541L10.2348 8.51512L5.99997 4.28026L1.76511 8.51512C1.61867 8.66156 1.38128 8.66155 1.23483 8.51512C1.08839 8.36868 1.08839 8.1313 1.23483 7.98485L5.73484 3.48485L5.7634 3.45897Z';

// accounts: [{ title, open, items: [{ name, bank, number }] }] — src/data/accounts.js 참고
export default function Account({ accounts }) {
  return (
    <div data-v-0f70ab0a="" id="section-account">
      <section data-v-a76b5a42="" data-v-0f70ab0a="" className="ft-gowundodum">
        <div data-v-a76b5a42="" className="top">
          <div data-v-81934de8="" data-v-a76b5a42="" className="wrap aos-init" data-aos="fade-up">
            <div data-v-1e830424="" data-v-81934de8="" className="eng_title theme_emp_color_purple gowundodum">
              {"ACCOUNT"}
            </div>
            <div data-v-58a15c77="" data-v-81934de8="" className="ko_title theme_emp_color_purple ft-gowundodum">
              {"마음 전하실 곳"}
            </div>
          </div>
          <div data-v-a76b5a42="" className="description aos-init" data-aos="fade-up" data-aos-delay="100">
            {"축하의 마음을 전하고 싶으신 분들을 위해"}
          </div>
        </div>
        <div data-v-74b0839a="" data-v-a76b5a42="" className="container aos-init" data-aos="fade-up">
          <div data-v-74b0839a="" className="inner">
            {accounts.map(({ title, open, items }) => (
              <div data-v-74b0839a="" className="list-wrap" key={title}>
                <button data-v-74b0839a="" className="list-head">
                  <span data-v-74b0839a="">{title}</span>
                  <span data-v-74b0839a="" className="icon-wrap">
                    <svg data-v-74b0839a="" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d={open ? ARROW_UP : ARROW_DOWN} fill="currentColor" />
                    </svg>
                  </span>
                </button>
                <ul data-v-74b0839a="" className={open ? 'item-list on' : 'item-list'}>
                  {items.map(({ name, bank, number }) => (
                    <li data-v-74b0839a="" className="item" key={`${name}-${number}`}>
                      <div data-v-74b0839a="" className="info ft-gowun-bold gowundodum">
                        <div data-v-74b0839a="" className="holder">
                          <span data-v-74b0839a="">{name}</span>
                        </div>
                        <div data-v-74b0839a="" className="account">
                          <span data-v-74b0839a="" className="bnk">{bank}</span>
                          <span data-v-74b0839a="" className="nmb">{number}</span>
                        </div>
                      </div>
                      <button data-v-74b0839a="" type="button" className="copy-btn">
                        {"복사"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
