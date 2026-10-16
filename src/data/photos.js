const ORIGIN = 'https://images.theirmood.com/resources/46097/card/vzUGuBO4E1';

// 값을 비워두면 원본 시안 사진을 사용합니다. 우리 사진으로 바꾸려면 public/photos/ 에 넣고 '/photos/파일명.jpg' 처럼 적으세요.
export const photos = {
  PgLLadCeRE: '', // 메인(첫 화면)
  CiyjEVyacK: '', // 프로필 - 신랑
  e6U2i5Bt7l: '', // 프로필 - 신부
  SQEVmW0fNC: '', // 타임라인 1
  lNeALNHrNJ: '', // 타임라인 2
  lGyYyv12A2: '', // 중간 배너 (JOIN US)
  mRXE6cy9D1: '', // 갤러리 1
  uoROFzOsTT: '', // 갤러리 2
  GSCWyFMnxv: '', // 갤러리 3
  dOQT7LerCJ: '', // 갤러리 4 (가로)
  kYLpP444zT: '', // 갤러리 5
  eXlFWiyhnn: '', // 갤러리 6
  l1RNEDwHZz: '', // 갤러리 7
  '5h4Yk5Kx4l': '', // 갤러리 8
  '3GKEVh4Sbl': '', // 갤러리 9
  RYGkCtMtSk: '', // 갤러리 10
  cA3DIg46kw: '', // 갤러리 11
  OVAvqns4nX: '', // 갤러리 12
  NGkpHR24wP: '', // 갤러리 13
  IcUPCg5PRX: '', // 갤러리 14 (가로)
  nbdfh15Piz: '', // 축하 사진 공유 1
  '1KqFH3G07s': '', // 축하 사진 공유 2
  g2v6tP7lZe: '', // 액자 배너 1
  OSWncOwBDQ: '', // 액자 배너 2
  LNOSO0Ksbg: '', // 액자 배너 3
  DDMfed2SD1: '', // 엔딩
  jVsCdPqCXV: '', // 약도 (오시는 길 > 약도 팝업)
  MPMwdMvauB: '', // 오프닝 배경
  vFjGssjYrw: '', // 오프닝 인물
};

export function photo(id, query = '', ext = 'png') {
  return photos[id] || `${ORIGIN}/${id}.${ext}${query}`;
}
