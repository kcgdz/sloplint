import { phraseRule } from './helpers.js';
import type { Category, Rule } from '../types.js';

const definitions: [Category, string, string, string[], string[], string[]][] = [
  [
    'opener',
    'stock-opening',
    'Konudan önce gelen genel giriş',
    [
      'günümüzün hızla değişen dünyasında',
      'günümüzün dijital çağında',
      'her geçen gün gelişen teknoloji',
    ],
    [
      'Günümüzün hızla değişen dünyasında araçlar önemlidir.',
      'Günümüzün dijital çağında veriler değerlidir.',
    ],
    [
      'Bugün giriş hatasını düzelttik.',
      'Dijital çağ arşivin adıdır.',
      'Teknoloji bütçesi yüzde beş arttı.',
    ],
  ],
  [
    'vocab',
    'empty-hype',
    'Somut bilgi vermeyen pazarlama kalıbı',
    [
      'potansiyelinizi açığa çıkarın',
      'oyunun kurallarını değiştiren',
      'benzersiz bir deneyim sunuyor',
    ],
    ['Potansiyelinizi açığa çıkarın ve başlayın.', 'Oyunun kurallarını değiştiren bir çözüm.'],
    [
      'Oyun kurallarını menüden okuyun.',
      'Dosyaları iki saniyede sıkıştırır.',
      'Deneyim süresi on dakikadır.',
    ],
  ],
  [
    'hedge',
    'worth-noting',
    'Bilgiyi geciktiren vurgu kalıbı',
    ['belirtmekte fayda var', 'altını çizmek gerekir', 'vurgulamak gerekir ki'],
    ['Belirtmekte fayda var, işlem ücretsiz.', 'Altını çizmek gerekir: dosya silinmez.'],
    ['İşlem ücretsizdir.', 'Satırın altını çizmek için düğmeye basın.', 'Dosya diskte kalır.'],
  ],
  [
    'closer',
    'template-ending',
    'İçeriğe katkı yapmayan kapanış',
    [
      'sonuç olarak söylemek gerekirse',
      'umarım bu bilgiler faydalı olmuştur',
      'bir sonraki yazımızda görüşmek üzere',
    ],
    ['Sonuç olarak söylemek gerekirse, seçim sizin.', 'Umarım bu bilgiler faydalı olmuştur.'],
    ['Sonuç dosyasını kaydedin.', 'Yarın saat onda görüşürüz.', 'Kurulum için komutu çalıştırın.'],
  ],
  [
    'closer',
    'engagement-bait',
    'Genel etkileşim çağrısı',
    ['düşüncelerinizi yorumlarda paylaşın', 'siz bu konuda ne düşünüyorsunuz'],
    ['Düşüncelerinizi yorumlarda paylaşın!', 'Siz bu konuda ne düşünüyorsunuz?'],
    [
      'Hata raporuna sürüm numarasını ekleyin.',
      'Yorumlarda üç hata bildirildi.',
      'Bu konuda yarın karar vereceğiz.',
    ],
  ],
  [
    'filler',
    'assistant-preamble',
    'Metinde kalmış asistan açıklaması',
    [
      'bir yapay zeka modeli olarak',
      'bir yapay zekâ modeli olarak',
      'işte sizin için hazırladığım',
    ],
    ['Bir yapay zekâ modeli olarak bunu yapamam.', 'İşte sizin için hazırladığım metin:'],
    [
      'Yapay zekâ modeli diskte çalışır.',
      'Metni dün hazırladım.',
      'Modelin bellek kullanımı ölçüldü.',
    ],
  ],
];

/** Explicit Turkish phrases also work in mixed-language documents. */
export const turkish: Rule[] = definitions.map(([category, name, title, patterns, bad, good]) => {
  const base = phraseRule({
    id: `${category}/tr-${name}`,
    category,
    severity: category === 'filler' ? 'error' : 'warning',
    title,
    why: `${title}. Bu ifade, somut bilgi yerine hazır bir anlatım kalıbı kullanıyor.`,
    suggestion: 'Kalıbı kaldırın; yerine somut bilgiyi, sonucu veya yapılacak işi yazın.',
    patterns,
    examples: { bad, good },
  });
  return {
    ...base,
    check(doc, options) {
      // Turkish casing is length-preserving, so original finding offsets remain valid.
      const text = doc.text.replace(/İ/g, 'i').replace(/I/g, 'ı');
      return base.check({ ...doc, text }, options);
    },
  };
});
