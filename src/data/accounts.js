// 페이지별 계좌 정보. 주소의 마지막 경로(/newChapter/p, /j, /z)가 키가 됩니다.
//  - 값이 null 이면 그 페이지에는 "마음 전하실 곳"(계좌) 섹션이 나오지 않습니다.
//  - open: true 면 처음부터 펼쳐진 상태로 보입니다.
export const DEFAULT_PAGE = 'z';

export const ACCOUNTS = {
  p: [
    {
      title: '신랑측 계좌번호',
      open: false,
      items: [{ name: '이남용', bank: '신한은행', number: '110-377-375862' }],
    },
    {
      title: '신부측 계좌번호',
      open: true,
      items: [{ name: '박소현', bank: '토스뱅크', number: '1002-7025-6226' }],
    },
  ],
  // TODO: j 페이지의 실제 계좌 정보로 바꿔 주세요.
  j: [
    {
      title: '신랑측 계좌번호',
      open: false,
      items: [{ name: '이남용', bank: '신한은행', number: '110-377-375862' }],
    },
    {
      title: '신부측 계좌번호',
      open: true,
      items: [{ name: '조아라', bank: '농협은행', number: '217-01-456068-193' }],
    },
  ],
  z: null,
};

// 현재 주소에서 페이지 키를 구합니다. 알 수 없는 주소는 기본 페이지(z)로 처리합니다.
export function getPageKey(pathname = window.location.pathname) {
  const base = import.meta.env.BASE_URL;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '');
  const key = rest.split('/')[0];
  return Object.hasOwn(ACCOUNTS, key) ? key : DEFAULT_PAGE;
}
