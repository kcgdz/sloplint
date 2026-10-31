import { phraseRule } from './helpers.js';
import type { Category, Rule } from '../types.js';

interface LanguageCatalog {
  code: string;
  why: string;
  suggestion: string;
  good: string[];
  groups: string[][];
}

const catalogs: LanguageCatalog[] = [
  {
    code: 'it',
    why: 'Questa formula generica ritarda i fatti e potrebbe comparire in un testo su qualsiasi argomento.',
    suggestion: 'Elimina la formula e indica il fatto, il risultato o la prossima azione concreta.',
    good: [
      'Abbiamo corretto il problema di accesso.',
      'Il file occupa due megabyte.',
      'Il modello funziona senza rete.',
    ],
    groups: [
      ['nel mondo frenetico di oggi', "nell'era digitale odierna"],
      ['sblocca tutto il tuo potenziale', 'porta la tua attività al livello successivo'],
      ['è importante sottolineare che', 'vale la pena notare che'],
      [
        'spero che queste informazioni ti siano state utili',
        'spero che queste informazioni vi siano state utili',
      ],
      ['condividi i tuoi pensieri nei commenti', 'facci sapere cosa ne pensi nei commenti'],
      [
        'come modello linguistico di intelligenza artificiale',
        'in quanto modello linguistico di IA',
      ],
    ],
  },
  {
    code: 'nl',
    why: 'Deze algemene formulering stelt concrete informatie uit en past bij vrijwel ieder onderwerp.',
    suggestion: 'Schrap de formulering en noem het concrete feit, resultaat of de volgende stap.',
    good: [
      'We hebben de inlogfout verholpen.',
      'Het bestand is twee megabyte groot.',
      'Het model werkt zonder netwerk.',
    ],
    groups: [
      ['in de snel veranderende wereld van vandaag', 'in het huidige digitale tijdperk'],
      ['ontgrendel je volledige potentieel', 'til je bedrijf naar een hoger niveau'],
      ['het is belangrijk om op te merken dat', 'het is vermeldenswaard dat'],
      [
        'ik hoop dat deze informatie nuttig voor je was',
        'ik hoop dat deze informatie u heeft geholpen',
      ],
      ['deel je gedachten in de reacties', 'laat je mening achter in de reacties'],
      ['als AI-taalmodel kan ik', 'als kunstmatig taalmodel kan ik'],
    ],
  },
  {
    code: 'ru',
    why: 'Этот шаблонный оборот откладывает конкретную информацию и подходит почти к любой теме.',
    suggestion: 'Уберите шаблон и укажите конкретный факт, результат или следующее действие.',
    good: [
      'Мы исправили ошибку входа.',
      'Размер файла — два мегабайта.',
      'Модель работает без сети.',
    ],
    groups: [
      ['в современном быстро меняющемся мире', 'в эпоху цифровых технологий'],
      ['раскройте весь свой потенциал', 'выведите свой бизнес на новый уровень'],
      ['важно отметить, что', 'стоит подчеркнуть, что'],
      ['надеюсь, эта информация была вам полезна', 'надеюсь, эта информация оказалась полезной'],
      ['поделитесь своими мыслями в комментариях', 'напишите своё мнение в комментариях'],
      ['как языковая модель искусственного интеллекта', 'как большая языковая модель я'],
    ],
  },
  {
    code: 'ar',
    why: 'هذه عبارة عامة تؤخر المعلومة المحددة ويمكن استخدامها في نص عن أي موضوع تقريبا.',
    suggestion: 'احذف العبارة واذكر المعلومة المحددة أو النتيجة أو الخطوة التالية.',
    good: [
      'أصلحنا خطأ تسجيل الدخول.',
      'حجم الملف اثنان ميغابايت.',
      'يعمل النموذج دون اتصال بالشبكة.',
    ],
    groups: [
      ['في عالم اليوم سريع التغير', 'في عصرنا الرقمي المتسارع'],
      ['أطلق العنان لإمكاناتك', 'ارتق بأعمالك إلى المستوى التالي'],
      ['من الجدير بالذكر أن', 'تجدر الإشارة إلى أن'],
      ['آمل أن تكون هذه المعلومات مفيدة لك', 'أتمنى أن تكون هذه المعلومات قد أفادتك'],
      ['شاركنا أفكارك في التعليقات', 'شاركنا رأيك في التعليقات'],
      ['بصفتي نموذج لغة للذكاء الاصطناعي', 'كنموذج لغوي للذكاء الاصطناعي'],
    ],
  },
  {
    code: 'es',
    why: 'Esta fórmula genérica retrasa la información concreta y puede aparecer en textos sobre cualquier tema.',
    suggestion: 'Elimina la fórmula y escribe el dato, el resultado o la acción concreta.',
    good: [
      'Hoy corregimos el error de acceso.',
      'El archivo ocupa dos megabytes.',
      'El modelo funciona sin conexión.',
    ],
    groups: [
      ['en el vertiginoso mundo actual', 'en la era digital actual'],
      ['desbloquea todo tu potencial', 'lleva tu negocio al siguiente nivel'],
      ['cabe destacar que', 'es importante señalar que'],
      [
        'espero que esta información te haya sido útil',
        'espero que esta información le haya sido útil',
      ],
      ['comparte tus pensamientos en los comentarios', 'déjanos tu opinión en los comentarios'],
      ['como modelo de lenguaje de inteligencia artificial', 'como modelo de lenguaje de IA'],
    ],
  },
  {
    code: 'fr',
    why: 'Cette formule générique retarde les faits et pourrait figurer dans un texte sur presque tous les sujets.',
    suggestion: 'Supprimez la formule et indiquez le fait, le résultat ou la prochaine action.',
    good: [
      'Nous avons corrigé l’erreur de connexion.',
      'Le fichier mesure deux mégaoctets.',
      'Le modèle fonctionne sans connexion.',
    ],
    groups: [
      ["dans le monde en constante évolution d'aujourd'hui", "à l'ère numérique actuelle"],
      ['libérez tout votre potentiel', 'propulsez votre entreprise vers de nouveaux sommets'],
      ['il est important de noter que', 'il convient de souligner que'],
      ["j'espère que ces informations vous seront utiles", "j'espère que cela vous a été utile"],
      [
        'partagez vos réflexions dans les commentaires',
        'partagez votre avis dans les commentaires',
      ],
      [
        "en tant que modèle de langage d'intelligence artificielle",
        'en tant que modèle de langage IA',
      ],
    ],
  },
  {
    code: 'de',
    why: 'Diese allgemeine Floskel verzögert die konkrete Information und passt zu fast jedem beliebigen Thema.',
    suggestion:
      'Streichen Sie die Floskel und nennen Sie die konkrete Information, das Ergebnis oder den nächsten Schritt.',
    good: [
      'Wir haben den Anmeldefehler behoben.',
      'Die Datei ist zwei Megabyte groß.',
      'Das Modell arbeitet ohne Netzwerk.',
    ],
    groups: [
      ['in der heutigen schnelllebigen Welt', 'im heutigen digitalen Zeitalter'],
      ['entfesseln Sie Ihr volles Potenzial', 'heben Sie Ihr Unternehmen auf das nächste Level'],
      ['es ist wichtig zu beachten, dass', 'es sollte hervorgehoben werden, dass'],
      [
        'ich hoffe, diese Informationen waren hilfreich',
        'ich hoffe, diese Informationen helfen Ihnen weiter',
      ],
      [
        'teilen Sie Ihre Gedanken in den Kommentaren',
        'hinterlassen Sie Ihre Meinung in den Kommentaren',
      ],
      ['als KI-Sprachmodell', 'als künstliches Sprachmodell'],
    ],
  },
  {
    code: 'pt',
    why: 'Esta fórmula genérica adia a informação concreta e poderia aparecer em textos sobre qualquer assunto.',
    suggestion: 'Remova a fórmula e apresente o dado, o resultado ou a ação concreta.',
    good: [
      'Corrigimos o erro de acesso hoje.',
      'O arquivo ocupa dois megabytes.',
      'O modelo funciona sem conexão.',
    ],
    groups: [
      ['no mundo acelerado de hoje', 'na era digital em que vivemos'],
      ['desbloqueie todo o seu potencial', 'leve seu negócio para o próximo nível'],
      ['é importante ressaltar que', 'vale a pena destacar que'],
      [
        'espero que estas informações tenham sido úteis',
        'espero que essas informações tenham sido úteis',
      ],
      ['compartilhe seus pensamentos nos comentários', 'partilhe a sua opinião nos comentários'],
      ['como modelo de linguagem de inteligência artificial', 'como um modelo de linguagem de IA'],
    ],
  },
];

const groups: [Category, string][] = [
  ['opener', 'stock-opening'],
  ['vocab', 'empty-hype'],
  ['hedge', 'worth-noting'],
  ['closer', 'template-ending'],
  ['closer', 'engagement-bait'],
  ['filler', 'assistant-preamble'],
];

/** Phrase catalogs are deliberately narrow; they do not infer authorship or grammar. */
export const languages: Rule[] = catalogs.flatMap((catalog) =>
  groups.map(([category, name], index) => {
    const patterns = catalog.groups[index]!;
    return phraseRule({
      id: `${category}/${catalog.code}-${name}`,
      category,
      severity: category === 'filler' ? 'error' : 'warning',
      title: patterns[0]!,
      why: catalog.why,
      suggestion: catalog.suggestion,
      patterns,
      examples: { bad: patterns.map((phrase) => `${phrase}.`), good: catalog.good },
    });
  }),
);
