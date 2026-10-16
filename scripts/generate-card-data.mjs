import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c = JSON.parse(fs.readFileSync(path.join(root, 'out', 'card-props.json'), 'utf8'));

function stripHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const card = {
  couple: {
    groom: {
      familyName: c.basicInfo.maleFamilyName,
      givenName: c.basicInfo.maleGivenName,
      fullName: `${c.basicInfo.maleFamilyName}${c.basicInfo.maleGivenName}`,
      order: c.basicInfo.maleOrder,
      father: c.basicInfo.maleFatherName,
      mother: c.basicInfo.maleMatherName,
      fatherDeceased: c.basicInfo.maleFatherDeceased,
      motherDeceased: c.basicInfo.maleMatherDeceased,
      phone: c.contact.male,
      fatherPhone: c.contact.maleFather,
      motherPhone: c.contact.maleMather,
    },
    bride: {
      familyName: c.basicInfo.femaleFamilyName,
      givenName: c.basicInfo.femaleGivenName,
      fullName: `${c.basicInfo.femaleFamilyName}${c.basicInfo.femaleGivenName}`,
      order: c.basicInfo.femaleOrder,
      father: c.basicInfo.femaleFatherName,
      mother: c.basicInfo.femaleMatherName,
      fatherDeceased: c.basicInfo.femaleFatherDeceased,
      motherDeceased: c.basicInfo.femaleMatherDeceased,
      phone: c.contact.female,
      fatherPhone: c.contact.femaleFather,
      motherPhone: c.contact.femaleMather,
    },
    showDeceasedMark: c.basicInfo.deceasedMark,
  },
  wedding: {
    date: c.weddingDate.date,
    hour: c.weddingDate.hour,
    minute: c.weddingDate.minute,
    hallName: c.weddingLocation.hallName,
    floorName: c.weddingLocation.floorName,
    address: c.weddingLocation.displayAddress,
    tel: c.weddingLocation.tel,
    lat: c.weddingLocation.positionY,
    lng: c.weddingLocation.positionX,
    sketchPhoto: c.weddingLocation.sketchPhotoPath,
    mapTitle: c.weddingLocation.title,
  },
  hero: {
    image: c.mainScreen.imagePath[0],
  },
  invitation: {
    title: 'INVITATION',
    subtitle: c.introMent.title,
    body: stripHtml(c.introMent.description),
  },
  profile: {
    title: 'PROFILE',
    subtitle: c.profile.title,
    groom: {
      label: c.profile.male.label,
      content: c.profile.male.content,
      image: c.profile.male.imagePath,
    },
    bride: {
      label: c.profile.female.label,
      content: c.profile.female.content,
      image: c.profile.female.imagePath,
    },
  },
  together: {
    enabled: c.together.enabled,
    startDate: c.together.startDate,
    title: '함께 보낸 소중한 날',
  },
  timeline: {
    enabled: c.timeline.enabled,
    title: c.timeline.title,
    subtitle: c.timeline.subtitle,
    coverImage: c.timeline.coverImage,
    ctaLabel: '이야기 시작하기',
    items: c.timeline.list.map((item) => ({
      id: item.id,
      year: item.year,
      title: item.title,
      description: item.description,
      image: item.image,
    })),
  },
  interview: {
    enabled: c.interview.enabled,
    title: 'INTERVIEW',
    subtitle: c.interview.title,
    description: c.interview.description,
    buttonLabel: '신랑 & 신부의 인터뷰 읽어보기',
    items: c.interview.list.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    })),
  },
  midBanner: {
    image: c.middleImages?.[0]?.middleImagePath || '',
    line1: 'JOIN US AS WE BECOME ONE',
    line2Date: '23 OCTOBER 2027',
    line2Day: 'SATURDAY',
    line2Time: 'PM 12:30',
  },
  transportation: c.transportation
    .filter((t) => t.title)
    .map((t) => ({
      title: t.title,
      descriptionHtml: t.description,
    })),
  notice: (c.noticeSeparated || []).map((n) => ({
    title: n.title,
    body: stripHtml(n.description),
    image: n.image,
  })),
  gallery: {
    title: 'GALLERY',
    subtitle: c.gallery.title,
    images: c.gallery.imageList,
  },
  guestbook: {
    title: 'GUESTBOOK',
    subtitle: c.guestBook.title,
    entries: (c.guestBookEntries || []).map((e) => ({
      id: e.id,
      writer: e.writer,
      message: e.message,
      createdAt: e.createdAt,
    })),
  },
  account: {
    title: 'ACCOUNT',
    subtitle: c.account.title,
    description: c.account.description,
    groups: c.account.groupList.map((g) => ({
      id: g.id,
      title: g.title,
      accounts: g.accountList.map((a) => ({
        name: a.name,
        bank: a.bank,
        number: a.number,
        kakao: a.kakaoLink || a.kakao,
      })),
    })),
  },
  rsvp: {
    title: 'R.S.V.P.',
    subtitle: c.rsvp.title,
    description: c.rsvp.description,
    buttonLabel: c.rsvp.buttonName,
  },
  snap: {
    title: 'CAPTURE OUR MOMENTS',
    subtitle: '축하 사진 공유',
    description: c.snap.description,
    images: (c.snap.customVisualImages || []).filter((u) => u.startsWith('http')),
    openAt: `${c.weddingDate.date} ${String(c.weddingDate.hour).padStart(2, '0')}:${String(c.weddingDate.minute).padStart(2, '0')}`,
  },
  ending: {
    images: (c.middleImages || [])
      .slice(1)
      .map((m) => m.middleImagePathCrop || m.middleImagePath)
      .filter(Boolean),
    quote: stripHtml(c.endingPhoto.ment),
    image: c.endingPhoto.image,
  },
};

const out = `/** Auto-generated from out/card-props.json — edit freely for your wedding */
const card = ${JSON.stringify(card, null, 2)};

export default card;
`;

const dest = path.join(root, 'src', 'data', 'card.js');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log('Wrote', dest);
