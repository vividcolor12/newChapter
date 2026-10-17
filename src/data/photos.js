// 사진은 public/photos/<번호>.jpg 에 있습니다. 교체하려면 같은 이름으로 덮어쓰세요.
const BASE = `${import.meta.env.BASE_URL}photos`;

export const photo = (id) => `${BASE}/${id}.jpg`;

// 갤러리 순서(그리드에 보이는 순서). span: 가로 2칸을 차지하는 사진
export const GALLERY = [
  { id: '01', span: true },
  { id: '07' },
  { id: '04', span: true },
  { id: '10', span: true },
  { id: '02', span: true },
  { id: '03', span: true },
  { id: '06', span: true },
  { id: '12', span: true },
  { id: '08', span: true },
  { id: '05', span: true },
  { id: '11', span: true },
  { id: '14', span: true },
  { id: '13', span: true },
  { id: '09' },
  { id: '15', span: true },
  { id: '20', span: true },
  { id: '17' },
  { id: '16', span: true },
  { id: '18', span: true },
  { id: '19' },
];
