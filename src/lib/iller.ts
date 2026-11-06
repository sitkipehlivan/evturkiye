// Şehir sayfaları (/sarj-istasyonlari/{il}) için iller: bölge ve rotalarda geçen ilçe/yer adları
export interface Il { ad: string; bolge: string; ilceler?: string[] }
export const ILLER: Il[] = [
  { ad: 'İstanbul', bolge: 'Marmara' }, { ad: 'Kocaeli', bolge: 'Marmara' }, { ad: 'Bursa', bolge: 'Marmara' },
  { ad: 'Sakarya', bolge: 'Marmara', ilceler: ['Sapanca'] }, { ad: 'Tekirdağ', bolge: 'Marmara' }, { ad: 'Balıkesir', bolge: 'Marmara', ilceler: ['Ayvalık'] },
  { ad: 'Çanakkale', bolge: 'Marmara' }, { ad: 'Edirne', bolge: 'Marmara' },
  { ad: 'İzmir', bolge: 'Ege', ilceler: ['Çeşme'] }, { ad: 'Muğla', bolge: 'Ege', ilceler: ['Bodrum', 'Marmaris', 'Fethiye'] },
  { ad: 'Aydın', bolge: 'Ege', ilceler: ['Kuşadası'] }, { ad: 'Denizli', bolge: 'Ege', ilceler: ['Pamukkale'] }, { ad: 'Manisa', bolge: 'Ege' },
  { ad: 'Afyonkarahisar', bolge: 'Ege' },
  { ad: 'Antalya', bolge: 'Akdeniz', ilceler: ['Kaş', 'Alanya'] }, { ad: 'Adana', bolge: 'Akdeniz' }, { ad: 'Mersin', bolge: 'Akdeniz' }, { ad: 'Hatay', bolge: 'Akdeniz' },
  { ad: 'Ankara', bolge: 'İç Anadolu' }, { ad: 'Konya', bolge: 'İç Anadolu' }, { ad: 'Eskişehir', bolge: 'İç Anadolu' }, { ad: 'Kayseri', bolge: 'İç Anadolu' },
  { ad: 'Nevşehir', bolge: 'İç Anadolu', ilceler: ['Kapadokya'] },
  { ad: 'Bolu', bolge: 'Karadeniz' }, { ad: 'Samsun', bolge: 'Karadeniz' }, { ad: 'Trabzon', bolge: 'Karadeniz' }, { ad: 'Düzce', bolge: 'Karadeniz' },
  { ad: 'Gaziantep', bolge: 'Güneydoğu Anadolu' }, { ad: 'Diyarbakır', bolge: 'Güneydoğu Anadolu' }, { ad: 'Erzurum', bolge: 'Doğu Anadolu' },
  { ad: 'Şanlıurfa', bolge: 'Güneydoğu Anadolu' }, { ad: 'Kahramanmaraş', bolge: 'Akdeniz' }, { ad: 'Malatya', bolge: 'Doğu Anadolu' },
  { ad: 'Van', bolge: 'Doğu Anadolu' }, { ad: 'Elazığ', bolge: 'Doğu Anadolu' }, { ad: 'Sivas', bolge: 'İç Anadolu' },
  { ad: 'Kütahya', bolge: 'Ege' }, { ad: 'Uşak', bolge: 'Ege' }, { ad: 'Isparta', bolge: 'Akdeniz' }, { ad: 'Zonguldak', bolge: 'Karadeniz' },
];
const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u' };
export const ilSlug = (ad: string) => ad.toLocaleLowerCase('tr').replace(/[çğıiöşü]/g, (c) => TR[c]).replace(/[^a-z0-9]+/g, '-');
