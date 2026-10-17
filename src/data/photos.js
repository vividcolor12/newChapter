const SITE = 'https://vividcolor12.github.io/newChapter/photos';
const ORIGIN = 'https://images.theirmood.com/resources/46097/card/vzUGuBO4E1';

// 값을 비워두면 원본 시안 사진을 사용합니다. 우리 사진으로 바꾸려면 public/photos/ 에 넣고 SITE 주소로 적으세요.
export const photos = {
  '01': '',
  '02': '', 
  '03': '', 
  '04': '', 
  '05': '',
  '06': '',
  '07': '', 
  '08': '',
  '09': '', 
  '10': '', 
  '11': '', 
  '12': '', 
  '13': '', 
  '14': '', 
  '15': '', 
  '16': '', 
  '17': '', 
  '18': '', 
  '19': '', 
  '20': '', 
};

export function photo(id, query = '', ext = 'jpg') {
  return photos[id] || `${SITE}/${id}.${ext}${query}`;
}
