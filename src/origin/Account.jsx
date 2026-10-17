export const ARROW_DOWN = 'M10.2349 3.48486C10.3813 3.33841 10.6187 3.33841 10.7651 3.48486C10.9116 3.6313 10.9116 3.86869 10.7651 4.01513L6.26513 8.51513C6.11869 8.66157 5.8813 8.66157 5.73486 8.51513L1.23486 4.01513L1.20898 3.98656C1.08895 3.83928 1.0976 3.62211 1.23486 3.48486C1.37211 3.3476 1.58928 3.33895 1.73656 3.45898L1.76513 3.48486L5.99999 7.71972L10.2349 3.48486Z';
export const ARROW_UP = 'M5.7634 3.45897C5.91069 3.33895 6.12786 3.3476 6.26511 3.48485L10.7651 7.98485L10.791 8.01341C10.911 8.1607 10.9023 8.37787 10.7651 8.51512C10.6279 8.65237 10.4107 8.66101 10.2634 8.541L10.2348 8.51512L5.99997 4.28026L1.76511 8.51512C1.61867 8.66156 1.38128 8.66155 1.23483 8.51512C1.08839 8.36868 1.08839 8.1313 1.23483 7.98485L5.73484 3.48485L5.7634 3.45897Z';

function CopyIcon() {
  return (
    <svg data-v-74b0839a="" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M10.2078 7.50008C11.4735 7.50008 12.4995 8.5261 12.4995 9.79175V15.2084C12.4995 16.4741 11.4735 17.5001 10.2078 17.5001H4.79118C3.52553 17.5001 2.49951 16.4741 2.49951 15.2084V9.79175C2.49951 8.5261 3.52553 7.50008 4.79118 7.50008H10.2078ZM4.79118 8.75008C4.21588 8.75008 3.74951 9.21645 3.74951 9.79175V15.2084C3.74951 15.7837 4.21588 16.2501 4.79118 16.2501H10.2078C10.7831 16.2501 11.2495 15.7837 11.2495 15.2084V9.79175C11.2495 9.21645 10.7831 8.75008 10.2078 8.75008H4.79118Z" fill="#4D4C4C" />
      <path d="M15.2083 2.50171C16.4739 2.50171 17.4999 3.52772 17.4999 4.79338V10.21C17.4999 11.4757 16.4739 12.5017 15.2083 12.5017H14.1772C13.832 12.5017 13.5522 12.2219 13.5522 11.8767C13.5522 11.5315 13.832 11.2517 14.1772 11.2517H15.2083C15.7835 11.2517 16.2499 10.7853 16.2499 10.21V4.79338C16.2499 4.21808 15.7835 3.75171 15.2083 3.75171H9.79159C9.21629 3.75171 8.74992 4.21808 8.74992 4.79338V5.82446C8.74992 6.16964 8.4701 6.44946 8.12492 6.44946C7.77974 6.44946 7.49992 6.16964 7.49992 5.82446V4.79338C7.49992 3.52772 8.52593 2.50171 9.79159 2.50171H15.2083Z" fill="#4D4C4C" />
    </svg>
  );
}

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
                        <button data-v-74b0839a="" className="holder">
                          <CopyIcon />
                          <span data-v-74b0839a="">{name}</span>
                        </button>
                        <button data-v-74b0839a="" className="account">
                          <span data-v-74b0839a="" className="bnk">{bank}</span>
                          <span data-v-74b0839a="" className="nmb">{number}</span>
                        </button>
                      </div>
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
