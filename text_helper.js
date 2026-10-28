// Stealth Lyrics Cloaker Engine (100% Offline & Zero Server Load)
// Unified Syllabification & Hyphenation Formula for rtrw_ ReSu Studio
//
// 1. Indonesian (ID) & Javanese (JV): Suku kata baku (PUEBI/EYD) dipenggal dengan tanda hubung (-)
//    Menghasilkan token suku kata (Ja-ngan per-nah kau ra-gu-kan / mé-mang ke-se-ti-a-an-ku)
// 2. English (EN): Morphological & phonotactic hyphenation (won-der-ful, for-ev-er)
// 3. Mandarin (ZH): Auto-conversion of Chinese characters to capitalized hyphenated Pinyin
//    (Wo-Men-De-Ai, Qi-Li-Xiang, Bie-Zou) yang 100% melumpuhkan filter LyricFind/Tencent Suno
// 4. Struktur tag [Verse], [Chorus], [Bridge], [Outro], [主歌], [副歌] 100% terlindungi utuh!

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StealthLyricsCloaker = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- 1. INDONESIAN CURATED HIGH-FREQUENCY DICTIONARY ---
  const ID_SYLLABLE_MAP = {
    'memang': 'mé-mang',
    'kesetiaanku': 'ke-se-ti-a-an-ku',
    'hanyalah': 'ha-nya-lah',
    'ketulusan': 'ke-tu-lu-san',
    'pribadiku': 'pri-ba-di-ku',
    'segalanya': 'se-ga-la-nya',
    'kehidupan': 'ke-hi-du-pan',
    'ragukan': 'ra-gu-kan',
    'sangsikan': 'sang-si-kan',
    'sikapku': 'si-kap-ku',
    'bibirku': 'bi-bir-ku',
    'berkata': 'ber-ka-ta',
    'cintaku': 'cin-ta-ku',
    'cintamu': 'cin-ta-mu',
    'untukmu': 'un-tuk-mu',
    'untukku': 'un-tuk-ku',
    'biarlah': 'bi-ar-lah',
    'dirimu': 'di-ri-mu',
    'diriku': 'di-ri-ku',
    'padamu': 'pa-da-mu',
    'padaku': 'pa-da-ku',
    'hatiku': 'ha-ti-ku',
    'hatimu': 'ha-ti-mu',
    'bagiku': 'ba-gi-ku',
    'bagimu': 'ba-gi-mu',
    'tentang': 'ten-tang',
    'wajar': 'wa-jar',
    'dalam': 'da-lam',
    'atas': 'a-tas',
    'sayang': 'sa-yang',
    'sayangku': 'sa-yang-ku',
    'biasa': 'bi-a-sa',
    'begitu': 'be-gi-tu',
    'selalu': 'se-la-lu',
    'kembali': 'kem-ba-li',
    'semua': 'se-mu-a',
    'seperti': 'se-per-ti',
    'karena': 'ka-re-na',
    'karna': 'kar-na',
    'dengan': 'de-ngan',
    'denganmu': 'de-ngan-mu',
    'dengan ku': 'de-ngan-ku',
    'mereka': 'me-re-ka',
    'mungkin': 'mung-kin',
    'selamanya': 'se-la-ma-nya',
    'senyuman': 'se-nyu-man',
    'terlalu': 'ter-la-lu',
    'terbang': 'ter-bang',
    'sendiri': 'sen-di-ri',
    'bersama': 'ber-sa-ma',
    'sekarang': 'se-ka-rang',
    'kemarin': 'ke-ma-rin',
    'menunggu': 'me-nung-gu',
    'wujudkan': 'wu-jud-kan',
    'pergi': 'per-gi',
    'datang': 'da-tang',
    'malam': 'ma-lam',
    'waktu': 'wak-tu',
    'tiada': 'ti-a-da',
    'bukan': 'bu-kan',
    'rinduku': 'rin-du-ku',
    'rindumu': 'rin-du-mu',
    'hancur': 'han-cur',
    'terluka': 'ter-lu-ka',
    'bahagia': 'ba-ha-gi-a',
    'selamanya': 'se-la-ma-nya'
  };

  /**
   * Syllabifier Fonotaktik Bahasa Indonesia (PUEBI/EYD)
   */
  function syllabifyIndonesianWord(word) {
    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (core.length <= 2 || core.includes('-')) {
      return prefix + core + suffix;
    }

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (ID_SYLLABLE_MAP[lower]) {
      const res = ID_SYLLABLE_MAP[lower];
      let formatted = res;
      if (isAllCap) formatted = res.toUpperCase();
      else if (isCap) formatted = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + formatted + suffix;
    }

    let s = lower.replace(/ng/g, 'ŋ')
                 .replace(/ny/g, 'ñ')
                 .replace(/sy/g, 'š')
                 .replace(/kh/g, 'x');

    const V = '[aiueoéè]';
    const C = '[^aiueoéè-]';

    // Rule 1: Non-diphthong V-V split
    s = s.replace(/([aiueoéè])([aiueoéè])/gi, function (m, v1, v2) {
      const pair = (v1 + v2).toLowerCase();
      if (['ai', 'au', 'oi', 'ei'].includes(pair)) return m;
      return v1 + '-' + v2;
    });

    // Rule 2: V-CV split
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // Rule 3: V-CC-V split
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['pr','kr','tr','br','dr','gr','pl','kl','bl','gl'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    s = s.replace(/-+/g, '-');
    s = s.replace(/ŋ/g, 'ng')
         .replace(/ñ/g, 'ny')
         .replace(/š/g, 'sy')
         .replace(/x/g, 'kh');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  // --- 2. ENGLISH (EN) CURATED PURE SYLLABIFICATION DICTIONARY ---
  // Formula: 100% original English spelling preserved, only standard hyphenation (-) applied
  const EN_HYPHEN_MAP = {
    // Common 2+ syllable song words - pure standard English spelling
    'going': 'go-ing',
    'trying': 'try-ing',
    "tryin'": "try-in'",
    'tryin': 'try-in',
    'twenty': 'twen-ty',
    'twenty-five': 'twen-ty-five',
    'sometimes': 'some-times',
    'sometime': 'some-time',
    'brotherhood': 'broth-er-hood',
    'brother': 'broth-er',
    'sister': 'sis-ter',
    'destination': 'des-ti-na-tion',
    'institution': 'in-sti-tu-tion',
    'revolution': 'rev-o-lu-tion',
    'realized': 're-al-ized',
    'realize': 're-al-ize',
    'quickly': 'quick-ly',
    'whatever': 'what-ev-er',
    'outside': 'out-side',
    'inside': 'in-side',
    'morning': 'morn-ing',
    'feeling': 'feel-ing',
    'peculiar': 'pe-cu-liar',
    'screaming': 'scream-ing',
    'praying': 'pray-ing',
    'crying': 'cry-ing',
    'lying': 'ly-ing',
    'dying': 'dy-ing',
    'living': 'liv-ing',
    'forever': 'for-ev-er',
    'together': 'to-geth-er',
    'never': 'nev-er',
    'always': 'al-ways',
    'away': 'a-way',
    'again': 'a-gain',
    'until': 'un-til',
    'every': 'ev-ery',
    'single': 'sin-gle',
    'even': 'e-ven',
    'ever': 'ev-er',
    'little': 'lit-tle',
    'understand': 'un-der-stand',
    'understanding': 'un-der-stand-ing',
    'pretend': 'pre-tend',
    'tiptoe': 'tip-toe',
    'story': 'sto-ry',
    'stories': 'sto-ries',
    'papers': 'pa-pers',
    'paper': 'pa-per',
    'monstrous': 'mon-strous',
    'wanna': 'wan-na',
    'gonna': 'gon-na',
    'gotta': 'got-ta',
    'because': 'be-cause',
    'before': 'be-fore',
    'behind': 'be-hind',
    'between': 'be-tween',
    'belong': 'be-long',
    'believe': 'be-lieve',
    'country': 'coun-try',
    'mountain': 'moun-tain',
    'heaven': 'heav-en',
    'angel': 'an-gel',
    'angels': 'an-gels',
    'devil': 'dev-il',
    'shadow': 'shad-ow',
    'shadows': 'shad-ows',
    'nothing': 'noth-ing',
    'something': 'some-thing',
    'everything': 'ev-ery-thing',
    'anything': 'an-y-thing',
    'someone': 'some-one',
    'somebody': 'some-bod-y',
    'nobody': 'no-bod-y',
    'anyone': 'an-y-one',
    'everybody': 'ev-ery-bod-y',
    'everyone': 'ev-ery-one',
    'beautiful': 'beau-ti-ful',
    'wonderful': 'won-der-ful',
    'yesterday': 'yes-ter-day',
    'tomorrow': 'to-mor-row',
    'tonight': 'to-night',
    'midnight': 'mid-night',
    'sunshine': 'sun-shine',
    'moonlight': 'moon-light',
    'rainbow': 'rain-bow',
    'highway': 'high-way',
    'freedom': 'free-dom',
    'broken': 'bro-ken',
    'water': 'wa-ter',
    'river': 'riv-er',
    'ocean': 'o-cean',
    'music': 'mu-sic',
    'melody': 'mel-o-dy',
    'rhythm': 'rhyth-m',
    'silence': 'si-lence',
    'memory': 'mem-o-ry',
    'memories': 'mem-o-ries',
    'promise': 'prom-ise',
    'promises': 'prom-is-es',
    'whisper': 'whis-per',
    'whispering': 'whis-per-ing',

    // High-frequency single-syllable & short song keywords to eliminate "polosan" lines
    'that': 'th-at',
    'this': 'th-is',
    'great': 'gre-at',
    'big': 'b-ig',
    'hill': 'hi-ll',
    'hope': 'ho-pe',
    'world': 'wor-ld',
    'made': 'ma-de',
    'man': 'm-an',
    'ooh': 'o-oh',
    'god': 'G-od',
    'try': 'tr-y',
    'pray': 'pr-ay',
    'time': 'ti-me',
    'cry': 'cr-y',
    'wake': 'wa-ke',
    'take': 'ta-ke',
    'step': 'st-ep',
    'deep': 'de-ep',
    'breath': 'bre-ath',
    'scream': 'scre-am',
    'lungs': 'lu-ngs',
    'high': 'hi-gh',
    'real': 're-al',
    'life': 'li-fe',
    'still': 'st-ill',
    'head': 'he-ad',
    'bed': 'b-ed',
    'years': 'ye-ars',
    'year': 'ye-ar',
    'means': 'me-ans',
    'knew': 'kn-ew',
    'when': 'wh-en',
    'what': 'wh-at',
    "what's": "wh-at's",
    'said': 'sa-id',
    'say': 's-ay',
    'day': 'd-ay',
    'just': 'ju-st',
    'from': 'fr-om'
  };

  /**
   * Syllabifier Fonotaktik Bahasa Inggris (Pure Syllabification v2.2)
   * Hanya menyematkan tanda hubung (-) sesuai kaidah suku kata tanpa mengubah ejaan asli
   * Memastikan tidak ada baris yang polosan agar lolos filter sensor Suno AI
   */
  function syllabifyEnglishWord(word) {
    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (!core) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    // 1. Direct Curated Pure Syllable Map Lookup
    if (EN_HYPHEN_MAP[lower]) {
      const res = EN_HYPHEN_MAP[lower];
      let formatted = res;
      if (isAllCap) formatted = res.toUpperCase();
      else if (isCap) formatted = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + formatted + suffix;
    }

    // Skip kata sangat pendek (<=2 seperti: I, to, in, of, my, up, on, he, me) atau kata yang sudah memiliki tanda hubung
    if (core.length <= 2 || core.includes('-')) {
      return prefix + core + suffix;
    }

    // 2. Proteksi Kata Pendek Berakhiran -ing (cling, sing, ring, bring, string, spring, thing)
    // DILARANG dipotong konsonannya menjadi cl-ing, s-ing
    if (lower.endsWith('ing')) {
      const root = lower.slice(0, -3);
      if (root.length <= 2 || !/[aeiouy]/i.test(root)) {
        return prefix + core + suffix;
      }
    }

    // 3. Algorithmic Suffix Hyphenation (Menjaga ejaan asli 100%)
    let s = lower;

    if (s.length >= 7) {
      s = s.replace(/([a-z]{3,})(ing)\b/g, '$1-ing')
           .replace(/([a-z]{3,})(ful)\b/g, '$1-ful')
           .replace(/([a-z]{3,})(less)\b/g, '$1-less')
           .replace(/([a-z]{3,})(ment)\b/g, '$1-ment')
           .replace(/([a-z]{3,})(ness)\b/g, '$1-ness')
           .replace(/([a-z]{3,})(tion)\b/g, '$1-tion')
           .replace(/([a-z]{3,})(sion)\b/g, '$1-sion')
           .replace(/([a-z]{3,})(able)\b/g, '$1-a-ble');
    }

    // 4. Pemenggalan antar-konsonan vokal dengan Proteksi Digraph (th, sh, ch, ph, wh, ng, ck tidak boleh dibelah)
    if (!s.includes('-')) {
      s = s.replace(/([aeiouy])([^aeiouy])(?=[aeiouy])/gi, function(m, v, c) {
        return v + '-' + c;
      });
      s = s.replace(/([aeiouy])([^aeiouy])([^aeiouy])(?=[aeiouy])/gi, function(m, v, c1, c2) {
        const pair = (c1 + c2).toLowerCase();
        if (['th', 'sh', 'ch', 'ph', 'wh', 'ng', 'ck'].includes(pair)) {
          return v + '-' + c1 + c2;
        }
        return v + c1 + '-' + c2;
      });
    }

    // 5. Fallback untuk kata 4+ huruf yang belum terpenggal sama sekali
    if (s.length >= 4 && !s.includes('-')) {
      if (/^[bcdfghjklmnpqrstvwxz]+[aeiouy][bcdfghjklmnpqrstvwxz]e$/i.test(s)) {
        s = s.slice(0, -2) + '-' + s.slice(-2);
      } else if (/([aeiouy]{2})/i.test(s)) {
        s = s.replace(/([aeiouy])([aeiouy])/i, '$1-$2');
      } else {
        const mid = Math.floor(s.length / 2);
        s = s.slice(0, mid) + '-' + s.slice(mid);
      }
    }

    s = s.replace(/-+/g, '-');
    s = s.replace(/^-+|-+$/g, '');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  // --- 2. SPANISH (ES) CURATED HIGH-FREQUENCY SONG VOCABULARY & PHONOTACTICS ---
  const ES_SYLLABLE_MAP = {
    'corazon': 'co-ra-zón',
    'corazón': 'co-ra-zón',
    'despacito': 'des-pa-ci-to',
    'contigo': 'con-ti-go',
    'conmigo': 'con-mi-go',
    'siempre': 'siem-pre',
    'tiempo': 'tiem-po',
    'quiero': 'quie-ro',
    'siento': 'sien-to',
    'besos': 'be-sos',
    'noches': 'no-ches',
    'manana': 'ma-ña-na',
    'mañana': 'ma-ña-na',
    'cuerpo': 'cuer-po',
    'alma': 'al-ma',
    'vida': 'vi-da',
    'mirada': 'mi-ra-da',
    'olvidar': 'ol-vi-dar',
    'perder': 'per-der',
    'quedate': 'qué-da-te',
    'abrazame': 'a-brá-za-me',
    'abrázame': 'a-brá-za-me',
    'bailando': 'bai-lan-do',
    'cancion': 'can-ción',
    'canción': 'can-ción',
    'esperando': 'es-pe-ran-do',
    'enamorado': 'e-na-mo-ra-do',
    'pensando': 'pen-san-do',
    'sueno': 'sue-ño',
    'sueño': 'sue-ño',
    'fuego': 'fue-go',
    'dolor': 'do-lor',
    'recuerdo': 're-cuer-do',
    'silencio': 'si-len-cio',
    'deseo': 'de-se-o',
    'solamente': 'so-la-men-te',
    'perdoname': 'per-dó-na-me',
    'perdóname': 'per-dó-na-me',
    'prometo': 'pro-me-to',
    'destino': 'des-ti-no',
    'estamos': 'es-ta-mos',
    'bailar': 'bai-lar',
    'volver': 'vol-ver',
    'llorar': 'llo-rar',
    'cantar': 'can-tar',
    'amar': 'a-mar',
    'amarte': 'a-mar-te',
    'quererte': 'que-rer-te',
    'besarte': 'be-sar-te',
    'olvidarte': 'ol-vi-dar-te',
    'abrazarte': 'a-bra-zar-te',
    'mirarte': 'mi-rar-te',
    'tocarte': 'to-car-te',
    'sabiendo': 'sa-bien-do',
    'diciendo': 'di-cien-do',
    'mirando': 'mi-ran-do',
    'viviendo': 'vi-vien-do',
    'muriendo': 'mu-rien-do',
    'buscando': 'bus-can-do',
    'palabras': 'pa-la-bras',
    'hermosa': 'her-mo-sa',
    'maravillosa': 'ma-ra-vi-llo-sa',
    'estrellas': 'es-tre-llas',
    'universo': 'u-ni-ver-so',
    'caminando': 'ca-mi-nan-do',
    'despertar': 'des-per-tar',
    'amanecer': 'a-ma-ne-cer',
    'esperanza': 'es-pe-ran-za',
    'tristeza': 'tris-te-za',
    'locura': 'lo-cu-ra',
    'ternura': 'ter-nu-ra',
    'pasion': 'pa-sión',
    'pasión': 'pa-sión',
    'carino': 'ca-ri-ño',
    'cariño': 'ca-ri-ño',
    'mentira': 'men-ti-ra',
    'mentiras': 'men-ti-ras',
    'verdad': 'ver-dad',
    'razon': 'ra-zón',
    'razón': 'ra-zón',
    'sentido': 'sen-ti-do',
    'olvido': 'ol-vi-do',
    'herida': 'he-ri-da',
    'heridas': 'he-ri-das',
    'cicatriz': 'ci-ca-triz',
    'lagrimas': 'lá-gri-mas',
    'lágrimas': 'lá-gri-mas',
    'sonrisa': 'son-ri-sa',
    'labios': 'la-bios',
    'ojos': 'o-jos',
    'manos': 'ma-nos',
    'abrazos': 'a-bra-zos',
    'cielos': 'cie-los',
    'mundo': 'mun-do',
    'noche': 'no-che',
    'tarde': 'tar-de',
    'fuerza': 'fuer-za',
    'suerte': 'suer-te',
    'muerte': 'muer-te',
    'camino': 'ca-mi-no',
    'latidos': 'la-ti-dos',
    'respiro': 'res-pi-ro',
    'suspiro': 'sus-pi-ro',
    'despacio': 'des-pa-cio',
    'poquito': 'po-qui-to',
    'canciones': 'can-cio-nes',
    'momentos': 'mo-men-tos',
    'recuerdos': 're-cuer-dos',
    'pensamientos': 'pen-sa-mien-tos',
    'sentimientos': 'sen-ti-mien-tos',
    'abismo': 'a-bis-mo',
    'ilusiones': 'i-lu-sio-nes',
    'corazones': 'co-ra-zo-nes',
    'promesas': 'pro-me-sas',
    'secreto': 'se-cre-to',
    'secretos': 'se-cre-tos',
    'loco': 'lo-co',
    'loca': 'lo-ca',
    'nuestro': 'nues-tro',
    'nuestra': 'nues-tra',
    'vuestro': 'vues-tro',
    'amores': 'a-mo-res',
    'pasado': 'pa-sa-do',
    'futuro': 'fu-tu-ro',
    'presente': 'pre-sen-te',
    'infinito': 'in-fi-ni-to',
    'profundo': 'pro-fun-do',
    'eterno': 'e-ter-no',
    'eterna': 'e-ter-na'
  };

  /**
   * Syllabifier Fonotaktik Bahasa Spanyol (Silabeo Español)
   */
  function syllabifySpanishWord(word) {
    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (core.length <= 3 || core.includes('-')) {
      return prefix + core + suffix;
    }

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (ES_SYLLABLE_MAP[lower]) {
      const res = ES_SYLLABLE_MAP[lower];
      let formatted = res;
      if (isAllCap) formatted = res.toUpperCase();
      else if (isCap) formatted = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + formatted + suffix;
    }

    // Lindungi digraf Spanyol sebelum dipisah
    let s = lower
      .replace(/ch/g, '¢')
      .replace(/ll/g, '£')
      .replace(/rr/g, '§')
      .replace(/qu/g, 'µ')
      .replace(/gu([eiéí])/g, '¥$1');

    const V = '[aeiouáéíóúü]';
    const C = '[^aeiouáéíóúü-]';

    // 1. Pemisahan Hiatus vokal kuat-kuat (a, e, o, á, é, ó)
    s = s.replace(/([aeoáéó])([aeoáéó])/gi, '$1-$2');

    // 2. Pemisahan vokal kuat + vokal lemah beraksen (í, ú)
    s = s.replace(/([aeiouáéíóú])([íú])/gi, '$1-$2');
    s = s.replace(/([íú])([aeiouáéíóú])/gi, '$1-$2');

    // 3. V - C - V (Konsonan tunggal ikut vokal berikutnya)
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // 4. Kluster konsonan tak terpisahkan (pr, br, tr, dr, cr, gr, fr, pl, bl, cl, gl, fl)
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['pr','br','tr','dr','cr','gr','fr','kr','pl','bl','cl','gl','fl','kl'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    // 5. Tiga konsonan V-CCC-V
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v, c1, c2, c3) {
      const cluster = (c2 + c3).toLowerCase();
      if (['pr','br','tr','dr','cr','gr','fr','pl','bl','cl','gl','fl'].includes(cluster)) {
        return v + c1 + '-' + c2 + c3;
      }
      return v + c1 + c2 + '-' + c3;
    });

    // Kembalikan digraf
    s = s.replace(/¢/g, 'ch')
         .replace(/£/g, 'll')
         .replace(/§/g, 'rr')
         .replace(/µ/g, 'qu')
         .replace(/¥/g, 'gu')
         .replace(/-+/g, '-');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  // --- 3. PORTUGUESE (PT) CURATED HIGH-FREQUENCY SONG VOCABULARY & PHONOTACTICS ---
  const PT_SYLLABLE_MAP = {
    'coracao': 'co-ra-ção',
    'coração': 'co-ra-ção',
    'coracoes': 'co-ra-ções',
    'corações': 'co-ra-ções',
    'saudade': 'sau-da-de',
    'saudades': 'sau-da-des',
    'amor': 'a-mor',
    'amores': 'a-mo-res',
    'comigo': 'co-mi-go',
    'contigo': 'con-ti-go',
    'sempre': 'sem-pre',
    'tempo': 'tem-po',
    'quero': 'que-ro',
    'sinto': 'sin-to',
    'beijo': 'bei-jo',
    'beijos': 'bei-jos',
    'noite': 'noi-te',
    'noites': 'noi-tes',
    'amanha': 'a-ma-nhã',
    'amanhã': 'a-ma-nhã',
    'corpo': 'cor-po',
    'alma': 'al-ma',
    'vida': 'vi-da',
    'olhar': 'o-lhar',
    'olhares': 'o-lha-res',
    'esquecer': 'es-que-cer',
    'perder': 'per-der',
    'fica': 'fi-ca',
    'abraco': 'a-bra-ço',
    'abraço': 'a-bra-ço',
    'abracos': 'a-bra-ços',
    'abraços': 'a-bra-ços',
    'dancando': 'dan-çan-do',
    'dançando': 'dan-çan-do',
    'cancao': 'can-ção',
    'canção': 'can-ção',
    'musica': 'mú-si-ca',
    'música': 'mú-si-ca',
    'esperando': 'es-pe-ran-do',
    'apaixonado': 'a-pai-xo-na-do',
    'pensando': 'pen-san-do',
    'sonho': 'so-nho',
    'sonhos': 'so-nhos',
    'fogo': 'fo-go',
    'lembranca': 'lem-bran-ça',
    'lembrança': 'lem-bran-ça',
    'silencio': 'si-lên-cio',
    'silêncio': 'si-lên-cio',
    'desejo': 'de-se-jo',
    'somente': 'so-men-te',
    'perdao': 'per-dão',
    'perdão': 'per-dão',
    'prometo': 'pro-me-to',
    'destino': 'des-ti-no',
    'estamos': 'es-ta-mos',
    'dancar': 'dan-çar',
    'dançar': 'dan-çar',
    'voltar': 'vol-tar',
    'chorar': 'cho-rar',
    'cantar': 'can-tar',
    'beijar': 'bei-jar',
    'tocar': 'to-car',
    'sabendo': 'sa-ben-do',
    'dizendo': 'di-zen-do',
    'olhando': 'o-lhan-do',
    'vivendo': 'vi-ven-do',
    'morrendo': 'mor-ren-do',
    'buscando': 'bus-can-do',
    'palavras': 'pa-la-vras',
    'linda': 'lin-da',
    'maravilhosa': 'ma-ra-vi-lho-sa',
    'estrelas': 'es-tre-las',
    'universo': 'u-ni-ver-so',
    'caminho': 'ca-mi-nho',
    'acordar': 'a-cor-dar',
    'amanhecer': 'a-ma-nhe-cer',
    'esperanca': 'es-pe-ran-ça',
    'esperança': 'es-pe-ran-ça',
    'tristeza': 'tris-te-za',
    'loucura': 'lou-cu-ra',
    'paixao': 'pai-xão',
    'paixão': 'pai-xão',
    'carinho': 'ca-ri-nho',
    'mentira': 'men-ti-ra',
    'verdade': 'ver-da-de',
    'razao': 'ra-zão',
    'razão': 'ra-zão',
    'sentido': 'sen-ti-do',
    'lagrimas': 'lá-gri-mas',
    'lágrimas': 'lá-gri-mas',
    'sorriso': 'sor-ri-so',
    'labios': 'lá-bios',
    'lábios': 'lá-bios',
    'olhos': 'o-lhos',
    'mundo': 'mun-do',
    'forca': 'for-ça',
    'força': 'for-ça',
    'sorte': 'sor-te',
    'morte': 'mor-te',
    'momentos': 'mo-men-tos',
    'sentimentos': 'sen-ti-men-tos',
    'voce': 'vo-cê',
    'você': 'vo-cê',
    'voces': 'vo-cês',
    'vocês': 'vo-cês',
    'tambem': 'tam-bém',
    'também': 'tam-bém',
    'agora': 'a-go-ra',
    'depois': 'de-pois',
    'nunca': 'nun-ca',
    'quando': 'quan-do',
    'quanto': 'quan-to',
    'onde': 'on-de',
    'jeito': 'jei-to',
    'beijinho': 'bei-ji-nho',
    'gostoso': 'gos-to-so',
    'gostosa': 'gos-to-sa',
    'menina': 'me-ni-na',
    'menino': 'me-ni-no',
    'garota': 'ga-ro-ta',
    'garoto': 'ga-ro-to'
  };

  /**
   * Syllabifier Fonotaktik Bahasa Portugis (Silabação em Português)
   */
  function syllabifyPortugueseWord(word) {
    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (core.length <= 3 || core.includes('-')) {
      return prefix + core + suffix;
    }

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (PT_SYLLABLE_MAP[lower]) {
      const res = PT_SYLLABLE_MAP[lower];
      let formatted = res;
      if (isAllCap) formatted = res.toUpperCase();
      else if (isCap) formatted = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + formatted + suffix;
    }

    // Digraf Portugis yang memisah: rr -> r-r, ss -> s-s, sc -> s-c, xc -> x-c
    let s = lower
      .replace(/rr/g, 'r-r')
      .replace(/ss/g, 's-s')
      .replace(/sç/g, 's-ç')
      .replace(/sc([eiéêí])/g, 's-c$1')
      .replace(/xc([eiéêí])/g, 'x-c$1')
      .replace(/ch/g, '¢')
      .replace(/lh/g, '£')
      .replace(/nh/g, '¥')
      .replace(/qu/g, 'µ')
      .replace(/gu([eiéêí])/g, '§$1');

    const V = '[aeiouáéíóúâêôãõü]';
    const C = '[^aeiouáéíóúâêôãõü-]';

    // 1. Hiatus vokal kuat-kuat (a, e, o, á, é, ó, â, ê, ô)
    s = s.replace(/([aeoáéóâêô])([aeoáéóâêô])/gi, '$1-$2');

    // 2. Vokal + vokal lemah beraksen (í, ú)
    s = s.replace(/([aeiouáéíóúâêôãõ])([íú])/gi, '$1-$2');
    s = s.replace(/([íú])([aeiouáéíóúâêôãõ])/gi, '$1-$2');

    // 3. V - C - V
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // 4. Kluster konsonan (pr, br, tr, dr, cr, gr, fr, vr, pl, bl, cl, gl, fl)
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['pr','br','tr','dr','cr','gr','fr','vr','pl','bl','cl','gl','fl'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    // 5. Tiga konsonan V-CCC-V
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v, c1, c2, c3) {
      const cluster = (c2 + c3).toLowerCase();
      if (['pr','br','tr','dr','cr','gr','fr','vr','pl','bl','cl','gl','fl'].includes(cluster)) {
        return v + c1 + '-' + c2 + c3;
      }
      return v + c1 + c2 + '-' + c3;
    });

    // Restore digraf
    s = s.replace(/¢/g, 'ch')
         .replace(/£/g, 'lh')
         .replace(/¥/g, 'nh')
         .replace(/µ/g, 'qu')
         .replace(/§/g, 'gu')
         .replace(/-+/g, '-');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  // --- 4. MANDARIN PINYIN ACOUSTIC ENGINE (>3,000 POP SONG CHARACTERS) ---
  const PINYIN_GROUPS = {
    "a": "阿啊呵腌吖嗄",
    "ai": "爱艾哀矮挨蔼隘癌皑碍呆捱嗳嗌嫒瑷暧愛靄曖礙",
    "an": "安按暗案俺岸鞍氨胺铵桉谙闇銨諳",
    "ang": "昂盎",
    "ao": "奥傲熬凹嗷坳袄翱拗鳌襖鰲",
    "ba": "把八吧拔巴罢霸坝爸芭跋疤靶粑钯壩罷耙鈀",
    "bai": "白百败拜柏摆佰稗敗擺",
    "ban": "半办班般板伴搬斑扮版颁拌绊瓣辦頒絆",
    "bang": "帮棒榜绑邦膀磅蚌梆镑幫綁鎊",
    "bao": "包抱报宝保暴薄胞饱爆炮刨豹鲍雹葆堡報寶飽鮑",
    "bei": "被北倍杯背贝辈碑卑备臂钡狈悖蓓備輩貝鋇狽",
    "ben": "本奔笨苯夯畚",
    "beng": "崩蹦绷泵迸",
    "bi": "比必避闭笔鼻碧壁币臂毕彼逼毙庇鄙弊璧痹婢哔閉筆幣畢斃嗶",
    "bian": "变便边编扁遍辩匾蝙鞭卞砭變邊編辯",
    "biao": "表标彪膘镖飙裱杓鳔標鏢飆鰾",
    "bie": "别憋瘪蹩別癟",
    "bin": "宾彬斌濒滨鬓摈賓瀕濱鬢擯",
    "bing": "并病冰丙饼屏秉柄炳摒餅並",
    "bo": "波伯播博薄泊驳玻脖搏剥菠舶箔礴跛駁剝",
    "bu": "不部步布补捕卜簿哺怖埠補",
    "ca": "擦嚓",
    "cai": "才采财材彩裁踩猜菜蔡採財",
    "can": "参残餐惨灿蚕惭殘慘燦蠶慚參",
    "cang": "藏苍仓舱沧蒼倉艙滄",
    "cao": "草操糙槽曹嘈",
    "ce": "册侧策测厕側測廁冊",
    "ceng": "曾层蹭層",
    "cha": "查差茶叉插察拆岔诧刹楂茬詫剎",
    "chai": "柴拆差豺",
    "chan": "产缠单阐颤谄谗禅纏單闡顫諂讒禪產",
    "chang": "长常场唱尝敞畅倡肠偿倘裳猖鲳長場嘗暢腸償徜鯧",
    "chao": "朝超抄潮吵炒巢绰綽",
    "che": "车扯撤澈掣車",
    "chen": "陈沉晨尘衬趁忱秤嗔稱塵陳襯",
    "cheng": "成城称程承乘诚呈撑澄惩秤逞骋稱誠盛懲撐",
    "chi": "吃尺持赤池翅迟痴耻驰齿匙斥弛齒馳遲恥侈嗤",
    "chong": "冲充重虫宠崇涌憧沖衝蟲寵",
    "chou": "抽愁臭仇丑筹绸稠酬踌籌綢醜疇惆",
    "chu": "出处初除楚储触础雏厨锄橱處觸儲礎雛廚芻",
    "chuan": "穿船传川串喘椽钏傳",
    "chuang": "创床窗闯疮創闖瘡",
    "chui": "吹垂炊锤捶錘",
    "chun": "春纯唇蠢醇淳純",
    "chuo": "戳绰",
    "ci": "此次词刺辞雌赐慈磁瓷茨詞辭賜",
    "cong": "从聪葱匆丛囱從叢聰蔥",
    "cou": "凑辏",
    "cu": "促粗醋卒簇蹙徂",
    "cuan": "窜篡蹿攒竄攢",
    "cui": "催脆摧翠瘁淬粹衰悴",
    "cun": "村存寸蹲忖",
    "cuo": "错撮搓磋挫措錯蹉",
    "da": "大打达答搭塔靼怛達",
    "dai": "带代待呆戴贷袋歹逮怠岱帶貸殆",
    "dan": "但单担蛋丹淡弹胆耽旦惮單擔彈膽誕啖",
    "dang": "当党挡荡档宕铛當黨擋檔蕩盪鐺",
    "dao": "到道倒刀导岛稻盗蹈叨悼導島盜",
    "de": "的得德地底",
    "deng": "等地灯登瞪邓凳噔燈鄧蹬",
    "di": "第地低底抵帝弟递敌滴迪狄缔遞敵笛締蒂",
    "dian": "电点店颠典垫殿奠惦沾點電墊顛巔玷",
    "diao": "掉钓调吊雕刁凋調釣碉",
    "die": "跌叠爹碟蝶迭谍疊牒",
    "ding": "定订顶钉盯丁鼎锭町頂訂釘錠",
    "diu": "丢",
    "dong": "动东冬懂洞冻栋胴咚恫動東凍棟",
    "dou": "都斗豆兜抖逗窦鬥陡",
    "du": "度都读独毒肚督赌杜镀渡笃讀獨堵賭犢篤",
    "duan": "断段短端锻缎斷鍛緞",
    "dui": "对队堆兑敦對隊兌懟",
    "dun": "顿吨盾蹲敦沌墩炖頓噸鈍遁",
    "duo": "多朵夺舵躲堕咄哆掇奪墮踱跺",
    "e": "恶额娥鹅蛾饿峨俄愕婀餓惡額鵝扼",
    "en": "恩嗯摁",
    "er": "而二儿尔耳饵贰洱兒爾餌",
    "fa": "发法罚乏伐阀筏發罰閥",
    "fan": "反饭翻凡犯繁范烦返贩帆藩飯煩販範樊",
    "fang": "方放防房访芳仿纺妨坊舫訪紡",
    "fei": "非飞肥费废肺啡菲匪诽沸斐翡飛費廢誹霏",
    "fen": "分份纷粉芬愤奋盆氛焚吩紛奮憤墳忿",
    "feng": "风封逢丰疯峰锋讽奉凤蜂缝風瘋豐鋒鳳諷縫",
    "fo": "佛",
    "fou": "否",
    "fu": "服务复付府夫父负副富浮幅福扶符辅腐伏抚覆拂俘復複負撫婦附輔俯赴芙",
    "ga": "嘎尬",
    "gai": "该改盖概钙芥丐赅該蓋溉鈣",
    "gan": "感干敢赶甘杆肝柑竿乾趕幹尷尬",
    "gang": "刚钢港岗纲杠缸肛剛鋼崗槓綱",
    "gao": "告高搞稿膏睾糕镐皋鎬",
    "ge": "个各格歌割哥隔革阁盖胳鸽搁咯個閣鴿擱骼",
    "gei": "给給",
    "gen": "跟根更亘",
    "geng": "更耕颈梗耿羹",
    "gong": "工共公贡功攻供宫恭弓巩躬拱汞宮貢",
    "gou": "够狗沟构购钩苟垢枸夠購溝構鉤",
    "gu": "古骨故顾姑鼓谷固孤股雇辜估咕顧",
    "gua": "挂刮瓜寡褂卦呱掛",
    "guai": "怪拐乖",
    "guan": "关管观馆官贯冠灌罐棺纶關觀館慣貫",
    "guang": "光广逛廣",
    "gui": "贵归规鬼轨柜桂跪硅闺诡刽貴歸規軌櫃瑰龜詭閨",
    "gun": "滚棍辊滾",
    "guo": "国过果郭锅裹涡過國鍋",
    "ha": "哈蛤",
    "hai": "海还害孩嗨骸咳亥還駭",
    "han": "汉汗喊寒含涵旱捍函撼罕憨漢憾韓",
    "hang": "行航巷杭",
    "hao": "好号毫豪浩耗壕郝蒿嚎號皓",
    "he": "和喝何合河盒核贺荷赫褐鹤呵禾賀鶴涸",
    "hei": "黑嘿",
    "hen": "很恨狠痕",
    "heng": "恒横衡哼橫恆",
    "hong": "红洪轰哄虹宏鸿烘紅轟鴻",
    "hou": "后候厚猴喉吼逅後",
    "hu": "乎呼护虎湖户互狐忽胡弧琥葫糊戶護蝴壺",
    "hua": "话华画花化滑划哗猾桦話畫華劃嘩",
    "huai": "坏怀淮槐壞懷踝",
    "huan": "换还欢环缓幻唤患焕涣痪還換歡環緩喚煥渙",
    "huang": "黄荒晃慌皇煌恍凰簧谎黃惶幌",
    "hui": "会回灰挥辉毁徽惠慧悔贿汇讳彗會毀揮恢輝繪匯諱賄晦",
    "hun": "昏婚浑混魂荤馄渾",
    "huo": "或活火获货伙惑霍祸豁夥獲貨禍穫",
    "ji": "机制计基己即极季级寄记集急及给继吉挤鸡疾积寂既籍激肌忌嫉绩缉纪幾記機級計極積擊雞際績濟繼脊技紀繫劑棘稽羈祭姬磯",
    "jia": "加家价假架甲佳嫁嘉夹驾颊枷價駕夾稼",
    "jian": "件见建间简坚健渐尖监减剪检践鉴键箭兼艰肩捡歼煎剑碱茧見間簡鍵漸減撿劍堅檢監薦艦檻艱踐柬",
    "jiang": "将强讲江奖降疆浆蒋匠酱姜缰將講獎蔣漿僵醬薑",
    "jiao": "教交角叫脚较焦胶浇骄娇缴搅矫轿嚼铰跤狡腳膠繳攪覺矯轎礁椒",
    "jie": "解结节界接借介阶街捷截洁劫杰竭届戒姐秸節結階潔藉",
    "jin": "进今近金仅紧禁斤尽津劲锦谨晋巾烬進僅緊盡晉浸筋錦",
    "jing": "经精惊竞静净镜警境景井径晶荆茎靖睛颈經靜驚鏡敬競竟淨頸荊",
    "jiong": "窘迥炅",
    "jiu": "就九酒旧久救纠究韭疚舅玖灸舊糾啾揪",
    "ju": "局具据车举居剧聚拒矩巨句惧拘俱菊距沮锯炬據舉劇懼鋸鞠",
    "juan": "卷捐圈倦眷绢絹",
    "jue": "决绝觉角掘爵倔抉崛嚼覺絕決腳訣",
    "jun": "军均君俊菌峻骏郡軍駿",
    "ka": "卡咖喀咔",
    "kai": "开凯恺楷慨锴開凱揩",
    "kan": "看砍堪刊坎勘檻",
    "kang": "康抗慷炕亢糠扛",
    "kao": "考烤靠拷铐",
    "ke": "可克科课刻客渴颗壳咳磕柯苛瞌課顆恪殼",
    "ken": "肯垦恳啃懇墾",
    "keng": "坑铿鏗",
    "kong": "空恐控孔",
    "kou": "口扣寇叩抠摳",
    "ku": "苦库哭裤枯窟酷褲",
    "kua": "跨夸垮挎胯誇",
    "kuai": "快块筷会侩脍塊儈獪膾",
    "kuan": "款宽髋寬",
    "kuang": "况狂矿框匡眶旷筐況礦曠",
    "kui": "亏愧葵窥魁盔溃匮奎虧饋窺匱",
    "kun": "困捆昆坤鯤",
    "kuo": "阔括扩廓擴闊",
    "la": "拉落啦辣蜡腊喇蠟臘",
    "lai": "来赖莱睐籁來賴籟",
    "lan": "蓝兰览烂拦栏懒浪滥缆揽澜藍覽爛濫欄懶蘭婪嵐瀾",
    "lang": "浪郎朗狼廊琅榔",
    "lao": "老捞牢劳落姥唠络烙酪撈勞潦",
    "le": "了乐勒肋叻樂",
    "lei": "类累雷泪勒蕾磊儡類淚壘",
    "leng": "冷愣棱",
    "li": "理利里历立力例离丽礼李励黎粒璃厉隶栗沥鲤莉痢裡離歷麗禮厲勵笠慄梨履隸籬",
    "lian": "连练联脸链恋莲怜帘廉敛",
    "liang": "两量良亮粮凉梁辆谅粱兩涼糧樑輛諒",
    "liao": "了料疗撩聊辽燎廖寥僚嘹潦鐐療",
    "lie": "列烈裂猎劣冽獵",
    "lin": "林临邻淋磷鳞吝琳赁凛臨鱗賃麟凜",
    "ling": "令领另零灵岭铃龄凌陵聆菱翎領靈鈴伶玲嶺",
    "liu": "六留流刘溜柳瘤硫琉馏榴",
    "long": "隆龙笼聋拢陇龍籠朧聾嚨",
    "lou": "楼露漏搂陋喽蝼樓摟簍",
    "lu": "路露录陆芦炉卢鲁颅卤禄戮潞陸錄魯爐廬綠鹿蘆盧碌顱",
    "luan": "乱卵孪峦挛栾亂巒攣",
    "lue": "略掠",
    "lun": "论轮伦仑沦抡輪論倫淪崙",
    "luo": "罗落络螺洛逻骆咯羅絡邏裸蘿駱",
    "lv": "绿律率旅滤驴铝履缕吕侣綠慮呂侶鋁",
    "ma": "么马吗妈嘛骂麻抹码蚂玛嗎媽馬罵碼螞",
    "mai": "买卖迈麦脉埋霾買賣邁麥",
    "man": "满慢漫蛮瞒曼馒蔓滿蠻瞞饅",
    "mang": "忙盲茫芒莽氓",
    "mao": "毛贸冒猫貌矛帽茂茅锚耄貓髦",
    "me": "么麼麽",
    "mei": "没美每妹煤梅媒枚霉昧酶魅眉沒媚莓黴",
    "men": "们门闷扪們門悶捫",
    "meng": "梦蒙盟猛萌盲懵朦锰夢檬",
    "mi": "米密秘迷蜜弥谜觅咪泌糜謎彌覓靡",
    "mian": "面免绵眠勉冕腼缅棉緬娩",
    "miao": "秒妙苗描庙瞄藐渺廟",
    "mie": "灭蔑篾滅",
    "min": "民敏泯皿闽悯",
    "ming": "名明命鸣铭冥瞑鳴銘",
    "mo": "模莫默磨末摸漠墨抹魔沫膜蓦馍寞陌",
    "mou": "某谋眸缪謀",
    "mu": "木目母每幕墓模暮牧穆募姆拇沐慕睦",
    "na": "那南哪纳拿呐捺钠娜吶鈉",
    "nai": "乃奶耐奈鼐氖",
    "nan": "难南男喃腩難",
    "nang": "囊",
    "nao": "脑闹恼挠瑙腦鬧惱撓",
    "ne": "呢呐",
    "nei": "内那馁內餒",
    "nen": "嫩",
    "neng": "能",
    "ni": "你妳泥拟逆腻溺霓倪匿妮睨铌擬膩",
    "nian": "年念粘撵辗碾捻",
    "niang": "娘酿釀",
    "niao": "鸟尿袅鳥裊",
    "nie": "捏涅聂镊镍聶孽鑷",
    "nin": "您",
    "ning": "宁凝拧咛柠檬寧擰濘嚀",
    "niu": "牛扭纽钮鈕紐",
    "nong": "农浓弄侬農濃膿",
    "nu": "怒奴努弩駑",
    "nuan": "暖",
    "nue": "虐疟",
    "nuo": "挪诺懦糯諾",
    "nv": "女",
    "ou": "欧偶呕区鸥歐嘔鷗毆藕",
    "pa": "怕爬啪趴琶帕",
    "pai": "排牌派拍湃迫徘",
    "pan": "判盘盼攀潘畔盤叛磐",
    "pang": "旁胖庞膀龐",
    "pao": "跑泡抛袍炮砲拋刨",
    "pei": "配培陪赔佩胚裴沛賠珮",
    "pen": "喷盆噴",
    "peng": "朋碰棚蓬澎膨捧烹彭篷",
    "pi": "批皮披疲匹劈辟屁脾僻坯砒琵譬痞",
    "pian": "片篇骗扁偏騙翩蹁",
    "piao": "漂票飘嫖瓢飄",
    "pie": "瞥撇",
    "pin": "品频拼贫聘貧頻顰",
    "ping": "平评凭瓶苹屏乒坪萍憑評蘋",
    "po": "破迫婆坡魄泼颇潑頗泊",
    "pou": "剖",
    "pu": "普谱埔铺扑朴仆葡浦曝瀑撲鋪譜樸圃",
    "qi": "起其气七期齐器妻奇契骑企泣旗歧欺戚凄漆棋乞祈氣齊汽騎悽淒憩",
    "qia": "恰卡掐洽",
    "qian": "前千钱签欠浅潜遣牵铅嵌迁纤谦歉乾錢牽淺簽潛遷鉛纖鉗",
    "qiang": "强枪墙抢腔呛羌強槍搶牆嗆薔鏘",
    "qiao": "桥瞧巧敲悄俏翘窍壳鞘荞橋翹僑峭竅雀",
    "qie": "切且窃怯妾箧竊篋",
    "qin": "亲琴侵勤秦擒禽浸钦寝芹親寢",
    "qing": "情请清轻青庆倾晴卿氢請輕傾慶擎氫蜻",
    "qiong": "穷穹窮",
    "qiu": "求球秋丘仇囚邱酋蚯",
    "qu": "去取区曲趣趋躯驱屈渠娶祛蛆趨區驅軀",
    "quan": "全权圈劝泉券犬痊诠權勸拳詮",
    "que": "却确缺雀鹊阙卻確鵲瘸",
    "qun": "群裙",
    "ran": "然染燃冉髯",
    "rang": "让嚷壤攘瓤讓",
    "rao": "绕扰饶繞擾饒",
    "re": "热惹熱",
    "ren": "人任认忍仁韧刃饪認韌飪",
    "reng": "仍扔",
    "ri": "日",
    "rong": "容荣融溶绒茸熔榮蓉絨",
    "rou": "肉柔揉蹂",
    "ru": "如果入乳儒辱褥孺汝濡",
    "ruan": "软阮軟",
    "rui": "锐瑞睿蕊銳芮",
    "run": "润闰潤",
    "ruo": "若弱箬偌",
    "sa": "撒萨洒飒灑薩",
    "sai": "塞思赛鳃賽鰓",
    "san": "三散伞叁傘",
    "sang": "丧桑嗓搡喪",
    "sao": "扫骚嫂臊掃騷",
    "se": "色塞涩瑟澀嗇",
    "sen": "森",
    "seng": "僧",
    "sha": "杀沙傻啥砂刹煞厦纱杉殺剎紗廈",
    "shai": "晒筛曬篩",
    "shan": "山闪善衫珊扇煽陕删膳閃傷跚陝擅",
    "shang": "上商伤赏尚晌裳墒殇傷賞殤",
    "shao": "少烧绍稍勺哨捎韶芍紹燒梢",
    "she": "设社涉舍射蛇舌摄折赦麝設奢",
    "shei": "谁誰",
    "shen": "身深什神沈甚审伸慎申渗砷審呻紳",
    "sheng": "生声省升胜盛圣绳剩牲甥聲勝聖繩笙",
    "shi": "是事实使世时式示市十石失视室施识试士食师始史饰释誓适嗜恃侍逝氏時實師試視識釋拾飾矢勢詩",
    "shou": "手表受首收授售守瘦寿兽壽獸",
    "shu": "数书术树属输熟署束殊梳叔鼠暑舒抒述戍書數樹輸屬服贖疏漱",
    "shua": "刷耍唰",
    "shuai": "衰帅甩率摔帥",
    "shuan": "栓闩閂",
    "shuang": "双霜爽孀雙",
    "shui": "水睡税谁誰稅",
    "shun": "顺瞬舜順吮",
    "shuo": "说数硕朔烁說碩爍",
    "si": "死四思斯私似司丝寺撕厮祀絲肆嘶",
    "song": "送松宋颂诵耸誦聳頌嵩",
    "sou": "搜艘嗽叟",
    "su": "素速诉宿苏塑俗肃稣粟簌訴肅甦",
    "suan": "算酸蒜",
    "sui": "随岁虽碎穗遂祟歲隨雖髓隧",
    "sun": "孙损笋損筍",
    "suo": "所缩锁索唆琐梭唢鎖縮瑣",
    "ta": "他她它踏塔拓塌榻挞獭嗒獺",
    "tai": "太台态抬胎泰汰苔臺態颱",
    "tan": "谈探叹弹贪炭摊毯坛坦潭檀瘫談灘壇嘆歎攤貪痰碳",
    "tang": "堂唐糖汤躺淌倘烫趟膛湯燙塘",
    "tao": "套逃桃讨陶淘涛掏韬討滔",
    "te": "特忒忑",
    "teng": "疼腾藤誊騰",
    "ti": "提体题替梯踢啼剃惕涕體題蹄剔",
    "tian": "天田填甜添舔恬佃腆殄",
    "tiao": "条跳挑调眺條調迢窕",
    "tie": "铁贴帖餮鐵貼",
    "ting": "听挺停厅庭亭艇廷聽廳",
    "tong": "同通统痛童桶铜桐筒瞳彤恸統銅慟",
    "tou": "投透头偷頭",
    "tu": "土图途突徒涂兔吐秃屠圖塗禿",
    "tuan": "团湍疃團",
    "tui": "推退腿褪蜕蛻",
    "tun": "吞屯褪臀",
    "tuo": "脱拖妥托驼拓舵唾椭脫託駝橢",
    "wa": "挖瓦娃哇洼蛙袜窪襪",
    "wai": "外歪",
    "wan": "完万晚玩湾弯腕丸挽碗烷萬灣彎",
    "wang": "望往王忘网旺狂妄汪芒網",
    "wei": "为位未委唯微伟威围危味维违卫尾慰喂蔚娓為爲偉圍維違衛餵",
    "wen": "问文闻稳温吻蚊纹紊問聞穩溫紋",
    "weng": "翁嗡瓮甕",
    "wo": "我握窝卧蜗涡喔沃斡倭窩臥蝸渦",
    "wu": "无五物务屋武午误舞乌雾伍污吴呜吾巫晤無務烏霧嗚",
    "xi": "系西细喜席吸洗戏稀息希夕惜膝习嬉溪昔锡析悉徙嘻熄係細戲習錫",
    "xia": "下夏吓峡虾辖瞎狭霞暇嚇峽蝦轄狹",
    "xian": "先线现显限险县仙闲鲜贤纤献咸嫌陷弦掀腺馅線現顯險縣閑賢纖獻餡",
    "xiang": "想相向象响项详香乡箱享降翔橡巷祥像鄉",
    "xiao": "小笑消校效销肖啸萧晓宵嚣孝硝箫銷嘯蕭曉囂簫",
    "xie": "写些鞋协谢斜血歇泄邪携谐解屑懈寫協謝洩攜諧",
    "xin": "心新信辛欣薪芯馨锌鋅",
    "xing": "行性形星兴醒型幸姓刑腥省邢猩興",
    "xiong": "胸雄凶熊兄汹洶",
    "xiu": "修休秀袖羞嗅朽绣锈繡鏽",
    "xu": "需许多虚续叙蓄旭绪序恤婿戌許虛續敘緒",
    "xuan": "选宣玄悬旋绚暄喧癣炫選懸絢癬",
    "xue": "学雪血靴穴削薛學",
    "xun": "寻迅讯训循逊勋熏询尋訊訓遜勳詢",
    "ya": "压呀亚牙押哑雅鸭讶崖衙壓啞鴨訝",
    "yan": "言眼严验演烟研沿盐延宴艳掩淹颜阎咽嚴驗煙鹽艷顏閻豔",
    "yang": "样养阳羊洋扬仰氧痒央杨秧泱樣養陽揚癢楊",
    "yao": "要咬摇药遥谣腰邀耀窑舀钥匙夭搖藥遙謠窯鑰",
    "ye": "也夜业野叶页爷液冶拽谒業葉頁爺謁",
    "yi": "一以意已义议衣移依医疑易异宜艺忆役遗亿翼逸溢乙仪裔義議醫異藝憶遺億儀",
    "yin": "因引音隐印银饮阴尹殷吟姻茵荫隱銀飲陰蔭",
    "ying": "应影英硬迎营赢盈映婴鹰樱莹萤鹦應營贏嬰鷹櫻瑩螢鸚",
    "yo": "哟唷",
    "yong": "用永勇涌拥泳蛹庸臃湧擁",
    "you": "有又由右油游友优幼诱忧尤邮悠犹幽遊優誘憂郵猶",
    "yu": "于与语雨育域遇羽宇余鱼预玉欲愉愚榆娱浴御俞舆逾誉於與語魚預娛輿譽",
    "yuan": "远原员愿院源圆元园缘怨援鸳辕遠願圓園緣鴛轅",
    "yue": "月越约乐阅跃岳钥約樂閱躍鑰",
    "yun": "运云允匀晕孕陨韵蕴運雲勻暈隕韻蘊",
    "za": "杂砸咋雜",
    "zai": "在再灾载仔宰災載",
    "zan": "赞暂咱瓒贊暫讚",
    "zang": "脏葬藏奘髒",
    "zao": "早造遭糟澡藻灶燥皂",
    "ze": "则择责泽啧仄則擇責澤嘖",
    "zei": "贼賊",
    "zen": "怎谮譖",
    "zeng": "增赠综贈",
    "zha": "扎炸查眨渣栅诈榨柵詐",
    "zhai": "摘债宅窄斋寨債齋",
    "zhan": "站战展占沾粘斩栈盏瞻绽湛戰斬棧盞綻",
    "zhang": "张长掌章障帐涨丈账胀樟張長帳漲賬脹",
    "zhao": "找照招召兆朝爪沼",
    "zhe": "这着者折遮哲蔗辙蛰這著轍蟄",
    "zhen": "真阵针振镇珍震枕斟侦疹陣針鎮偵",
    "zheng": "整正争政证征挣蒸症睁狰爭證掙睜獰",
    "zhi": "知只之指直制治至纸职支织质值植执志置止智致枝芝脂滞掷峙紙職織質執滯擲",
    "zhong": "中重种终众钟忠衷仲肿種終眾鐘腫",
    "zhou": "周洲舟州轴宙昼皱骤帚軸晝皺驟",
    "zhu": "主住注著助猪逐祝竹珠蛛筑柱烛贮豬築燭貯",
    "zhua": "抓",
    "zhuai": "拽",
    "zhuan": "转专赚砖传轉專賺磚傳",
    "zhuang": "装壮状撞庄桩妆裝壯狀莊樁妝",
    "zhui": "追坠缀赘墜綴贅",
    "zhun": "准準",
    "zhuo": "着捉桌拙灼琢酌啄著",
    "zi": "自子字资紫姿仔咨滋吱姊資",
    "zong": "总从宗踪纵棕综總從蹤縱綜",
    "zou": "走揍奏邹鄒",
    "zu": "组足族祖阻卒租诅組詛",
    "zuan": "钻纂攥鑽",
    "zui": "最嘴醉罪",
    "zun": "尊遵樽",
    "zuo": "做作坐座左昨佐撮柞"
  };

  // Priority Song Overrides for Polyphones & Missing Characters (Mandopop Standard)
  const MANDARIN_PRIORITY_MAP = {
    '单': 'dan', '單': 'dan',
    '思': 'si',
    '么': 'me', '麼': 'me',
    '更': 'geng',
    '落': 'luo',
    '行': 'xing',
    '圈': 'quan',
    '强': 'qiang', '強': 'qiang',
    '呆': 'dai',
    '伤': 'shang', '傷': 'shang',
    '南': 'nan',
    '盆': 'pen',
    '血': 'xue',
    '谁': 'shui', '誰': 'shui',
    '降': 'jiang',
    '藏': 'cang',
    '重': 'zhong',
    '区': 'qu', '區': 'qu',
    '裳': 'shang',
    '拆': 'chai',
    '差': 'cha',
    '著': 'zhu',
    '几': 'ji', '幾': 'ji',
    '迹': 'ji', '跡': 'ji',
    '弃': 'qi', '棄': 'qi',
    '悲': 'bei',
    '伪': 'wei', '偽': 'wei',
    '辨': 'bian',
    '绞': 'jiao', '絞': 'jiao',
    '褴': 'lan', '襤': 'lan',
    '褛': 'lv', '褸': 'lv',
    '咏': 'yong', '詠': 'yong',
    '诸': 'zhu', '諸': 'zhu',
    '皆': 'jie',
    '涧': 'jian', '澗': 'jian',
    '屿': 'yu', '嶼': 'yu',
    '粘': 'zhan',
    '泡': 'pao',
    '沫': 'mo',

    // Additional Traditional, Poetic & High-Frequency Song Vocabulary
    '鞦': 'qiu', '韆': 'qian',
    '赋': 'fu', '賦': 'fu',
    '芜': 'wu', '蕪': 'wu',
    '绵': 'mian', '綿': 'mian',
    '茧': 'jian', '繭': 'jian',
    '筝': 'zheng', '箏': 'zheng',
    '窒': 'zhi',
    '谧': 'mi', '謐': 'mi',
    '涟': 'lian', '漪': 'yi',
    '缥': 'piao', '缈': 'miao', '緲': 'miao', '飄': 'piao',
    '邃': 'sui',
    '炽': 'chi', '熾': 'chi',
    '惆': 'chou', '怅': 'chang', '悵': 'chang',
    '惘': 'wang',
    '徊': 'huai', '徘': 'pai',
    '蹒': 'pan', '跚': 'shan',
    '朦': 'meng', '胧': 'long', '朧': 'long',
    '坎': 'kan', '坷': 'ke',
    '羁': 'ji', '羈': 'ji', '绊': 'ban', '絆': 'ban',
    '蹉': 'cuo', '跎': 'tuo',
    '峥': 'zheng', '嵘': 'rong', '崢': 'zheng', '嶸': 'rong',
    '嶙': 'lin', '峋': 'xun',
    '吻': 'wen',
    '撼': 'han',
    '畔': 'pan',
    '峦': 'luan', '巒': 'luan',
    '骤': 'zhou', '驟': 'zhou',
    '颤': 'chan', '顫': 'chan', '抖': 'dou',
    '眸': 'mou',
    '魅': 'mei', '惑': 'huo',
    '痕': 'hen',
    '荒': 'huang', '漠': 'mo',
    '誓': 'shi',
    '眷': 'juan', '恋': 'lian', '戀': 'lian',
    '弦': 'xian',
    '旋': 'xuan', '律': 'lv',
    '溺': 'ni', '漫': 'man',
    '藉': 'jie',
    '缠': 'chan', '纏': 'chan',
    '纠': 'jiu', '糾': 'jiu',
    '结': 'jie', '結': 'jie',
    '融': 'rong',
    '挣': 'zheng', '掙': 'zheng',
    '脱': 'tuo', '脫': 'tuo',
    '释': 'shi', '釋': 'shi',
    '怀': 'huai', '懷': 'huai',
    '塌': 'ta', '崩': 'beng'
  };

  // Polyphone Song Phrase Exceptions (e.g. 长大 = Zhang-Da, not Chang-Da; 什么 = Shen-Me, not Shen-Ma)
  const ZH_PHRASE_PINYIN = {
    '长大': ['zhang', 'da'],
    '長大': ['zhang', 'da'],
    '成长': ['cheng', 'zhang'],
    '成長': ['cheng', 'zhang'],
    '什么': ['shen', 'me'],
    '什麼': ['shen', 'me'],
    '怎么': ['zen', 'me'],
    '怎麼': ['zen', 'me'],
    '那么': ['na', 'me'],
    '那麼': ['na', 'me'],
    '多么': ['duo', 'me'],
    '多麼': ['duo', 'me'],
    '思念': ['si', 'nian'],
    '落叶': ['luo', 'ye'],
    '落葉': ['luo', 'ye'],
    '落泪': ['luo', 'lei'],
    '落淚': ['luo', 'lei'],
    '发呆': ['fa', 'dai'],
    '發呆': ['fa', 'dai'],
    '圈圈': ['quan', 'quan'],
    '银行': ['yin', 'hang'],
    '銀行': ['yin', 'hang'],
    '秋千': ['qiu', 'qian'],
    '鞦韆': ['qiu', 'qian'],
    '涟漪': ['lian', 'yi'],
    '缥缈': ['piao', 'miao'],
    '深邃': ['shen', 'sui'],
    '炽热': ['chi', 're'],
    '惆怅': ['chou', 'chang'],
    '迷惘': ['mi', 'wang'],
    '徘徊': ['pai', 'huai'],
    '蹒跚': ['pan', 'shan'],
    '朦胧': ['meng', 'long'],
    '坎坷': ['kan', 'ke'],
    '羁绊': ['ji', 'ban'],
    '蹉跎': ['cuo', 'tuo'],
    '荒芜': ['huang', 'wu'],
    '荒蕪': ['huang', 'wu'],
    '天赋': ['tian', 'fu'],
    '天賦': ['tian', 'fu']
  };

  // Build static fast lookup map with priority overrides first
  const MANDARIN_CHAR_MAP = new Map();
  for (const [ch, py] of Object.entries(MANDARIN_PRIORITY_MAP)) {
    MANDARIN_CHAR_MAP.set(ch, py);
  }

  for (const [pinyin, chars] of Object.entries(PINYIN_GROUPS)) {
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (!MANDARIN_CHAR_MAP.has(ch)) {
        MANDARIN_CHAR_MAP.set(ch, pinyin);
      }
    }
  }

  /**
   * Mengonversi baris teks Mandarin menjadi Pinyin bertanda hubung (Hyphenated Pinyin v2.0)
   * Dilengkapi resolusi polifonis musikal & pengecualian frasa lagu Mandarin
   * Contoh: 故事的小黄花 -> Gu-Shi-De-Xiao-Huang-Hua
   */
  function cloakMandarinLine(line) {
    let result = '';
    let i = 0;
    let currentPhrase = [];

    while (i < line.length) {
      // 1. Cek kamus frasa lagu (2 karakter berpasangan seperti 长大, 什么, 思念)
      if (i + 2 <= line.length) {
        const two = line.slice(i, i + 2);
        if (ZH_PHRASE_PINYIN[two]) {
          currentPhrase.push(...ZH_PHRASE_PINYIN[two]);
          i += 2;
          continue;
        }
      }

      const ch = line[i];
      if (MANDARIN_CHAR_MAP.has(ch)) {
        const py = MANDARIN_CHAR_MAP.get(ch);
        currentPhrase.push(py);
        i++;
      } else {
        if (currentPhrase.length > 0) {
          result += currentPhrase.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
          currentPhrase = [];
        }
        result += ch;
        i++;
      }
    }

    if (currentPhrase.length > 0) {
      result += currentPhrase.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
    }
    return result;
  }

  // --- 5. JAPANESE ACOUSTIC ENGINE (J-POP & ANIME MORA CLOAKER) ---
  const JA_KANJI_WORDS = {
    // 4+ characters / expressions
    'ありがとう': 'A-ri-ga-tou',
    '愛してる': 'Ai-shi-te-ru',
    '大嫌い': 'Dai-ki-rai',
    '大好き': 'Dai-su-ki',
    'さよなら': 'Sa-yo-na-ra',
    'ごめんね': 'Go-men-ne',
    '忘れないで': 'Wa-su-re-nai-de',
    '忘れない': 'Wa-su-re-nai',
    '抱きしめて': 'Da-ki-shi-me-te',
    '抱きしめ': 'Da-ki-shi-me',
    '離さないで': 'Ha-na-sa-nai-de',
    '離さない': 'Ha-na-sa-nai',
    '見つめて': 'Mi-tsu-me-te',
    '強くなれる': 'Tsu-yo-ku-na-re-ru',
    '振り返る': 'Fu-ri-ka-e-ru',
    '見上げて': 'Mi-a-ge-te',
    '泣かないで': 'Na-ka-nai-de',
    '信じてる': 'Shin-ji-te-ru',
    '信じて': 'Shin-ji-te',
    '届かない': 'To-do-ka-nai',
    '届いて': 'To-do-i-te',
    '消えない': 'Ki-e-nai',
    '溢れて': 'A-fu-re-te',
    '溢れる': 'A-fu-re-ru',
    '叫んで': 'Sa-ken-de',
    '教えて': 'O-shi-e-te',
    '輝いて': 'Ka-ga-ya-i-te',
    '輝く': 'Ka-ga-ya-ku',
    '感じて': 'Kan-ji-te',
    '連れて': 'Tsu-re-te',
    '触れて': 'Fu-re-te',
    '歩いて': 'A-rui-te',
    '生きる': 'I-ki-ru',
    '知った': 'Shi-t-ta',
    '進め': 'Su-su-me',
    '響け': 'Hi-bi-ke',
    '走れ': 'Ha-shi-re',
    '飛べ': 'To-be',
    '沈む': 'Shi-zu-mu',
    '溶けて': 'To-ke-te',
    '溶ける': 'To-ke-ru',
    '広がる': 'Hi-ro-ga-ru',
    '守る': 'Ma-mo-ru',
    '守って': 'Ma-mo-t-te',
    '探して': 'Sa-ga-shi-te',
    '願い': 'Ne-ga-i',
    '祈り': 'I-no-ri',
    '果て': 'Ha-te',

    // 2-3 characters (High-Frequency J-Pop / Anime Songs Vocabulary)
    '世界': 'Se-kai',
    '未来': 'Mi-rai',
    '過去': 'Ka-ko',
    '運命': 'Un-mei',
    '永遠': 'Ei-en',
    '奇跡': 'Ki-se-ki',
    '心': 'Ko-ko-ro',
    '気持ち': 'Ki-mo-chi',
    '想い': 'O-mo-i',
    '思い': 'O-mo-i',
    '笑顔': 'E-ga-o',
    '涙': 'Na-mi-da',
    '空': 'So-ra',
    '青空': 'Ao-zo-ra',
    '夜空': 'Yo-zo-ra',
    '星': 'Ho-shi',
    '月': 'Tsu-ki',
    '太陽': 'Tai-you',
    '光': 'Hi-ka-ri',
    '闇': 'Ya-mi',
    '風': 'Ka-ze',
    '雨': 'A-me',
    '虹': 'Ni-ji',
    '海': 'U-mi',
    '波': 'Na-mi',
    '桜': 'Sa-ku-ra',
    '花': 'Ha-na',
    '命': 'I-no-chi',
    '宇宙': 'U-chuu',
    '地球': 'Chi-kyuu',
    '今日': 'Kyou',
    '明日': 'A-shi-ta',
    '昨日': 'Ki-nou',
    '今': 'I-ma',
    '夜': 'Yo-ru',
    '朝': 'A-sa',
    '時間': 'Ji-kan',
    '瞬間': 'Shun-kan',
    '毎日': 'Mai-ni-chi',
    '季節': 'Ki-se-tsu',
    '声': 'Ko-e',
    '歌': 'U-ta',
    '音楽': 'On-ga-ku',
    '約束': 'Ya-ku-so-ku',
    '夢': 'Yu-me',
    '希望': 'Ki-bou',
    '道': 'Mi-chi',
    '旅': 'Ta-bi',
    '羽': 'Ha-ne',
    '翼': 'Tsu-ba-sa',
    '自由': 'Ji-yuu',
    '絆': 'Ki-zu-na',
    '本当': 'Hon-tou',
    '真実': 'Shin-ji-tsu',
    '愛': 'Ai',
    '恋': 'Ko-i',
    '好き': 'Su-ki',
    '君': 'Ki-mi',
    'あなた': 'A-na-ta',
    '僕': 'Bo-ku',
    '私': 'Wa-ta-shi',
    '二人': 'Fu-ta-ri',
    '一人': 'Hi-to-ri',
    '誰': 'Da-re',
    '友達': 'To-mo-da-chi',
    '仲間': 'Na-ka-ma',
    '優しさ': 'Ya-sa-shi-sa',
    '温もり': 'Nu-ku-mo-ri',
    '痛み': 'I-ta-mi',
    '悲しみ': 'Ka-na-shi-mi',
    '寂しさ': 'Sa-bi-shi-sa',
    '孤独': 'Ko-do-ku',
    '情熱': 'Jou-ne-tsu',
    '勇気': 'Yuu-ki',
    '力': 'Chi-ka-ra',
    '強さ': 'Tsu-yo-sa',
    '弱さ': 'Yo-wa-sa',
    '理由': 'Ri-yuu',
    '幻': 'Ma-bo-ro-shi',
    '秘密': 'Hi-mi-tsu',
    '記憶': 'Ki-o-ku',
    '物語': 'Mo-no-ga-ta-ri',
    '言葉': 'Ko-to-ba',
    '景色': 'Ke-shi-ki',
    '場所': 'Ba-sho',
    '魔法': 'Ma-hou',
    '誇り': 'Ho-ko-ri',
    '影': 'Ka-ge',
    '瞳': 'Hi-to-mi',
    '手': 'Te',
    '指': 'Yu-bi',
    '胸': 'Mu-ne',
    '背中': 'Se-na-ka',
    '肩': 'Ka-ta',
    '足': 'A-shi',
    '息': 'I-ki',
    '血': 'Chi',
    '頬': 'Ho-ho',

    // Fallback Common J-Pop Kanji
    '白': 'Shi-ro', '黒': 'Ku-ro', '赤': 'A-ka', '青': 'A-o',
    '神': 'Ka-mi', '鬼': 'O-ni', '人': 'Hi-to', '女': 'On-na', '男': 'O-to-ko',
    '春': 'Ha-ru', '夏': 'Na-tsu', '秋': 'A-ki', '冬': 'Fu-yu',
    '雪': 'Yu-ki', '雷': 'Ka-mi-na-ri', '炎': 'Ho-no-o', '氷': 'Koo-ri',
    '森': 'Mo-ri', '川': 'Ka-wa', '山': 'Ya-ma', '鳥': 'To-ri',

    // High-Frequency J-Pop & Anime Songs Extended Vocabulary
    '一言': 'Hi-to-ko-to',
    '全て': 'Su-be-te',
    'すべて': 'Su-be-te',
    '分かった': 'Wa-kat-ta',
    '分かる': 'Wa-ka-ru',
    '分かり': 'Wa-ka-ri',
    '分かって': 'Wa-kat-te',
    '落ちて': 'O-chi-te',
    '落ちる': 'O-chi-ru',
    '限り': 'Ka-gi-ri',
    '大事': 'Dai-ji',
    '去りゆく': 'Sa-ri-yu-ku',
    '去り': 'Sa-ri',
    '伝えたくて': 'Tsu-ta-e-ta-ku-te',
    '伝えて': 'Tsu-ta-e-te',
    '伝える': 'Tsu-ta-e-ru',
    '伝え': 'Tsu-ta-e',
    '間に合う': 'Ma-ni-a-u',
    '間に': 'Ma-ni',
    '未だに': 'I-ma-da-ni',
    '未だ': 'I-ma-da',
    '忘れた': 'Wa-su-re-ta',
    '忘れて': 'Wa-su-re-te',
    '忘れる': 'Wa-su-re-ru',
    '取りに': 'To-ri-ni',
    '取る': 'To-ru',
    '取って': 'Tot-te',
    '取り': 'To-ri',
    '帰る': 'Ka-e-ru',
    '帰り': 'Ka-e-ri',
    '帰って': 'Ka-et-te',
    '古びた': 'Fu-ru-bi-ta',
    '古い': 'Fu-ru-i',
    '思い出': 'O-mo-i-de',
    '最後': 'Sai-go',
    '最初に': 'Sai-sho-ni',
    '最初': 'Sai-sho',
    '苦くて': 'Ni-ga-ku-te',
    '苦い': 'Ni-ga-i',
    '切ない': 'Se-tsu-nai',
    '切なく': 'Se-tsu-na-ku',
    '香り': 'Ka-o-ri',
    '匂い': 'Ni-o-i',
    '今頃': 'I-ma-go-ro',
    '想ってる': 'O-mot-te-ru',
    '想い': 'O-mo-i',
    '想う': 'O-mo-u',
    '予想通り': 'Yo-sou-doo-ri',
    '予想': 'Yo-sou',
    '通り': 'Too-ri',
    '始まれば': 'Ha-ji-ma-re-ba',
    '始まる': 'Ha-ji-ma-ru',
    '始まり': 'Ha-ji-ma-ri',
    '始まって': 'Ha-ji-mat-te',
    'ひとり芝居': 'Hi-to-ri-shi-bai',
    '芝居': 'Shi-bai',
    '観客': 'Kan-kya-ku',
    '結局': 'Kek-kyo-ku',
    '埃': 'Ho-ko-ri',
    '払う': 'Ha-ra-u',
    '払って': 'Ha-rat-te',
    '物': 'Mo-no',
    '音': 'O-to',
    '色': 'I-ro',
    '何': 'Na-ni',
    '何度': 'Nan-do',
    '何故': 'Na-ze',
    'いつ': 'I-tsu',
    'どこ': 'Do-ko',
    '部屋': 'He-ya',
    '窓': 'Ma-do',
    '街': 'Ma-chi',
    '駅': 'E-ki',
    '電車': 'Den-sha',
    '電話': 'Den-wa'
  };

  // Single Kanji Fallback Map for Isolated / Inflected Kanji Characters
  const JA_SINGLE_KANJI_MAP = {
    '日': 'Hi', '月': 'Tsu-ki', '火': 'Hi', '水': 'Mi-zu', '木': 'Ki', '金': 'Ka-ne', '土': 'Tsu-chi',
    '大': 'Oo', '小': 'Ko', '中': 'Na-ka', '上': 'U-e', '下': 'Shi-ta', '前': 'Ma-e', '後': 'A-to',
    '左': 'Hi-da-ri', '右': 'Mi-gi', '物': 'Mo-no', '事': 'Ko-to', '時': 'To-ki', '分': 'Wa-ke',
    '出': 'De', '入': 'I-ri', '見': 'Mi', '聞': 'Ki', '言': 'I', '話': 'Ha-na-shi', '読': 'Yo-mi',
    '書': 'Ka-ki', '行': 'I-ki', '来': 'Ki', '帰': 'Ka-e-ri', '食': 'Ta-be', '飲': 'No-mi',
    '生': 'I-ki', '死': 'Shi', '会': 'A-i', '待': 'Ma-chi', '思': 'O-mo-i', '考': 'Kan-ga-e',
    '知': 'Shi-ri', '歩': 'A-ru-ki', '走': 'Ha-shi-ri', '止': 'To-me',
    '手': 'Te', '足': 'A-shi', '目': 'Me', '耳': 'Mi-mi', '口': 'Ku-chi', '顔': 'Ka-o',
    '心': 'Ko-ko-ro', '頭': 'A-ta-ma', '体': 'Ka-ra-da', '声': 'Ko-e', '音': 'O-to',
    '光': 'Hi-ka-ri', '影': 'Ka-ge', '色': 'I-ro', '風': 'Ka-ze', '空': 'So-ra', '雨': 'A-me',
    '雪': 'Yu-ki', '雲': 'Ku-mo', '星': 'Ho-shi', '海': 'U-mi', '山': 'Ya-ma', '川': 'Ka-wa',
    '道': 'Mi-chi', '街': 'Ma-chi', '家': 'I-e', '夜': 'Yo-ru', '朝': 'A-sa',
    '花': 'Ha-na', '草': 'Ku-sa', '森': 'Mo-ri', '鳥': 'To-ri', '魚': 'Sa-ka-na',
    '恋': 'Ko-i', '愛': 'Ai', '夢': 'Yu-me', '歌': 'U-ta',
    '君': 'Ki-mi', '僕': 'Bo-ku', '私': 'Wa-ta-shi', '誰': 'Da-re', '何': 'Na-ni',
    '古': 'Fu-ru', '新': 'A-ta-ra', '苦': 'Ni-ga', '切': 'Se-tsu', '香': 'Ka-o-ri', '落': 'O-chi',
    '取': 'To-ri', '払': 'Ha-ra-i', '埃': 'Ho-ko-ri', '限': 'Ka-gi-ri', '伝': 'Tsu-ta-e',
    '去': 'Sa-ri', '間': 'Ma', '合': 'A-i', '想': 'O-mo-i', '頃': 'Ko-ro', '始': 'Ha-ji-ma',
    '通': 'Too-ri', '予': 'Yo', '結': 'Ketsu', '局': 'Kyoku', '観': 'Kan', '客': 'Kyaku',
    '芝': 'Shi', '居': 'I', '背': 'Se', '明': 'A-ka'
  };

  const JA_YOON_MAP = {
    'きゃ':'kya', 'きゅ':'kyu', 'きょ':'kyo',
    'しゃ':'sha', 'しゅ':'shu', 'しょ':'sho',
    'ちゃ':'cha', 'ちゅ':'chu', 'ちょ':'cho',
    'にゃ':'nya', 'にゅ':'nyu', 'にょ':'nyo',
    'ひゃ':'hya', 'ひゅ':'hyu', 'ひょ':'hyo',
    'みゃ':'mya', 'みゅ':'myu', 'みょ':'myo',
    'りゃ':'rya', 'りゅ':'ryu', 'りょ':'ryo',
    'ぎゃ':'gya', 'ぎゅ':'gyu', 'ぎょ':'gyo',
    'じゃ':'ja',  'じゅ':'ju',  'じょ':'jo',
    'びゃ':'bya', 'びゅ':'byu', 'びょ':'byo',
    'ぴゃ':'pya', 'ぴゅ':'pyu', 'ぴょ':'pyo',
    'ふぁ':'fa',  'ふぃ':'fi',  'ふぇ':'fe', 'ふぉ':'fo',
    'てぃ':'ti',  'でぃ':'di',  'とぅ':'tu', 'どぅ':'du',
    'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo',
    'シャ':'sha', 'シュ':'shu', 'ショ':'sho',
    'チャ':'cha', 'チュ':'chu', 'チョ':'cho',
    'ニャ':'nya', 'ニュ':'nyu', 'ニョ':'nyo',
    'ヒャ':'hya', 'ヒュ':'hyu', 'ヒョ':'hyo',
    'ミャ':'mya', 'ミュ':'myu', 'ミョ':'myo',
    'リャ':'rya', 'リュ':'ryu', 'リョ':'ryo',
    'ギャ':'gya', 'ギュ':'gyu', 'ギョ':'gyo',
    'ジャ':'ja',  'ジュ':'ju',  'ジョ':'jo',
    'ビャ':'bya', 'ビュ':'byu', 'ビョ':'byo',
    'ピャ':'pya', 'ピュ':'pyu', 'ピョ':'pyo',
    'ファ':'fa',  'フィ':'fi',  'フェ':'fe', 'フォ':'fo',
    'ティ':'ti',  'ディ':'di',  'トゥ':'tu', 'ドゥ':'du',
    'ウィ':'wi',  'ウェ':'we',  'ウォ':'wo',
    'ヴァ':'va',  'ヴィ':'vi',  'ヴェ':'ve', 'ヴォ':'vo'
  };

  const JA_KANA_MAP = {
    'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o',
    'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
    'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so',
    'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
    'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
    'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
    'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
    'や':'ya', 'ゆ':'yu', 'よ':'yo',
    'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
    'わ':'wa', 'ゐ':'wi', 'ゑ':'we', 'を':'wo', 'ん':'n',
    'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
    'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
    'だ':'da', 'ぢ':'ji', 'づ':'zu', 'デ':'de', 'で':'de', 'ど':'do',
    'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
    'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
    'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o',
    'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
    'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so',
    'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to',
    'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no',
    'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho',
    'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo',
    'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo',
    'ラ':'ra', 'リ':'ri', 'ル':'ru', 'レ':'re', 'ロ':'ro',
    'ワ':'wa', 'ヰ':'wi', 'ヱ':'we', 'ヲ':'wo', 'ン':'n',
    'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go',
    'ザ':'za', 'ジ':'ji', 'ズ':'zu', 'ゼ':'ze', 'ゾ':'zo',
    'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'ド':'do',
    'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'ベ':'be', 'ボ':'bo',
    'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po',
    'ヴ':'vu', 'ー':'-'
  };

  /**
   * Syllabifier Romaji Jepang (Mora Splitting)
   */
  function syllabifyJapaneseRomaji(word) {
    if (!word || word.length <= 2 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 2 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    const moraRegex = /^(kya|kyu|kyo|sha|shu|sho|cha|chu|cho|nya|nyu|nyo|hya|hyu|hyo|mya|myu|myo|rya|ryu|ryo|gya|gyu|gyo|ja|ju|jo|bya|byu|byo|pya|pyu|pyo|tsu|chi|shi|fu|fa|fi|fe|fo|ti|di|du|wi|we|wo|va|vi|ve|vo|n(?=[^aiueoy]|$)|[ksthmyrwnzdbpgfvj]?(ai|ou|ei|oi|ui)|[ksthmyrwnzdbpgfvj]?[aiueo]|[aiueo])/i;

    const morae = [];
    let rem = core;

    while (rem.length > 0) {
      if (rem.length >= 2 && rem[0].toLowerCase() === rem[1].toLowerCase() && /^[bcdfghjklmpqrstvwxyz]$/i.test(rem[0])) {
        morae.push(rem[0]);
        rem = rem.slice(1);
        continue;
      }
      if (rem.toLowerCase().startsWith('tch')) {
        morae.push(rem[0]);
        rem = rem.slice(1);
        continue;
      }

      const m = rem.match(moraRegex);
      if (m && m[0]) {
        morae.push(m[0]);
        rem = rem.slice(m[0].length);
      } else {
        morae.push(rem[0]);
        rem = rem.slice(1);
      }
    }

    let formatted = morae.join('-');
    if (isAllCap) formatted = formatted.toUpperCase();
    else if (isCap) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks Jepang (Kanji, Kana, atau Romaji) menjadi Lirik Siluman (Anti-Sensor)
   */
  function cloakJapaneseLine(line) {
    if (!line) return '';

    // 1. Ganti kata majemuk Kanji (Greedy Longest Match)
    const kanjiKeys = Object.keys(JA_KANJI_WORDS).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < kanjiKeys.length; k++) {
      const key = kanjiKeys[k];
      if (s.includes(key)) {
        s = s.split(key).join(' ' + JA_KANJI_WORDS[key] + ' ');
      }
    }

    // 1b. Ganti karakter Kanji tunggal lepasan (Single Kanji Fallback)
    for (const [k, v] of Object.entries(JA_SINGLE_KANJI_MAP)) {
      if (s.includes(k)) {
        s = s.split(k).join(' ' + v + ' ');
      }
    }

    // 2. Konversi Hiragana & Katakana ke Romaji
    let romajiOut = [];
    let i = 0;
    while (i < s.length) {
      // Cek Yoon (2 karakter)
      if (i + 1 < s.length) {
        const pair = s.substr(i, 2);
        if (JA_YOON_MAP[pair]) {
          romajiOut.push(JA_YOON_MAP[pair]);
          i += 2;
          continue;
        }
      }
      const ch = s[i];
      // Cek Sokuon (っ / ッ)
      if (ch === 'っ' || ch === 'ッ') {
        if (i + 1 < s.length) {
          const nextPair = i + 2 < s.length ? JA_YOON_MAP[s.substr(i + 1, 2)] : null;
          const nextSingle = JA_KANA_MAP[s[i + 1]];
          const nextRomaji = nextPair || nextSingle || '';
          if (nextRomaji && nextRomaji[0]) {
            romajiOut.push(nextRomaji[0] + '-');
          }
        }
        i++;
        continue;
      }
      // Partikel 'は' di batas kata -> 'wa'
      if (ch === 'は' && (i === 0 || /\s/.test(s[i - 1])) && (i + 1 === s.length || /\s/.test(s[i + 1]))) {
        romajiOut.push('wa');
        i++;
        continue;
      }
      if (JA_KANA_MAP[ch]) {
        romajiOut.push(JA_KANA_MAP[ch]);
        i++;
        continue;
      }
      romajiOut.push(ch);
      i++;
    }

    const converted = romajiOut.join('');

    // 3. Syllabify setiap token kata Romaji
    const tokens = converted.split(/(\s+)/);
    const cloakedTokens = tokens.map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;
      if (tok.includes('-')) return tok; // Sudah disamarkan dari kamus
      if (/^[a-zA-Z0-9À-ž]+$/.test(tok)) {
        return syllabifyJapaneseRomaji(tok);
      }
      return tok;
    });

    return cloakedTokens.join('').replace(/\s+/g, ' ').trim();
  }

  // --- 6. KOREAN ACOUSTIC ENGINE (K-POP HANGUL & ROMAJA CLOAKER) ---
  const KO_CHOSEONG = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  const KO_JUNGSEONG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  const KO_JONGSEONG = ['', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h'];

  const KO_KPOP_DICT = {
    '보고 싶어': 'Bo-go Si-peo',
    '보고싶어': 'Bo-go-si-peo',
    '보고 싶다': 'Bo-go Sip-da',
    '보고싶다': 'Bo-go-sip-da',
    '사랑해요': 'Sa-rang-hae-yo',
    '사랑해': 'Sa-rang-hae',
    '사랑이란': 'Sa-rang-i-ran',
    '사랑': 'Sa-rang',
    '영원히': 'Yeong-won-hi',
    '영원': 'Yeong-won',
    '함께해': 'Ham-kke-hae',
    '함께': 'Ham-kke',
    '괜찮아요': 'Gwaen-cha-na-yo',
    '괜찮아': 'Gwaen-cha-na',
    '미안해': 'Mi-an-hae',
    '고마워': 'Go-ma-wo',
    '좋아해': 'Jo-a-hae',
    '행복해': 'Haeng-bok-hae',
    '눈물이': 'Nun-mu-ri',
    '눈물': 'Nun-mul',
    '마음이': 'Ma-eu-mi',
    '마음': 'Ma-eum',
    '기억해': 'Gi-eok-hae',
    '기억': 'Gi-eok',
    '약속해': 'Yak-sok-hae',
    '약속': 'Yak-sok',
    '시간이': 'Si-ga-ni',
    '시간': 'Si-gan',
    '세상이': 'Se-sang-i',
    '세상': 'Se-sang',
    '하늘': 'Ha-neul',
    '바람': 'Ba-ram',
    '별': 'Byeol',
    '달': 'Dal',
    '빛': 'Bit',
    '노래': 'No-rae',
    '목소리': 'Mok-so-ri',
    '미소': 'Mi-so',
    '추억': 'Chu-eok',
    '심장': 'Sim-jang',
    '가슴': 'Ga-seum',
    '숨': 'Sum',
    '손': 'Son',
    '입술': 'Ip-sul',
    '너를': 'Neo-reul',
    '나를': 'Na-reul',
    '너의': 'Neo-ui',
    '나의': 'Na-ui',
    '우리': 'U-ri',
    '오늘': 'O-neul',
    '내일': 'Nae-il',
    '어제': 'Eo-je',
    '지금': 'Ji-geum',
    '하루': 'Ha-ru',
    '매일': 'Mae-il',
    '다시': 'Da-si',
    '언제나': 'Eon-je-na',
    '항상': 'Hang-sang',
    '정말': 'Jeong-mal',
    '진짜': 'Jin-jja',
    '너무': 'Neo-mu',
    '절대': 'Jeol-dae',
    '시작': 'Si-jak',
    '끝': 'Kkeut',

    // K-Pop High-Frequency Phonetic Assimilations (Eum-un Byeon-hwa)
    '어떻게': 'Eo-tteo-ke',
    '이렇게': 'I-reo-ke',
    '그렇게': 'Geu-reo-ke',
    '어떡해': 'Eo-tteo-kae',
    '있잖아': 'It-ja-na',
    '있어서': 'I-sseo-seo',
    '있어도': 'I-sseo-do',
    '있었어': 'I-sseot-seo',
    '있어요': 'I-sseo-yo',
    '있어': 'I-sseo',
    '없어서': 'Eop-seo-seo',
    '없어도': 'Eop-seo-do',
    '없었어': 'Eop-seot-seo',
    '없어요': 'Eop-seo-yo',
    '없어': 'Eop-seo',
    '좋아서': 'Jo-a-seo',
    '좋아요': 'Jo-a-yo',
    '좋아': 'Jo-a',
    '같이': 'Ga-chi',
    '굳이': 'Gu-ji',
    '끝나': 'Kkeun-na',
    '빛나': 'Bin-na',
    '몰라': 'Mol-la',
    '몰랐어': 'Mol-lat-seo',
    '꽃이': 'Kko-chi',
    '맞춰': 'Ma-chwo',
    '어디야': 'Eo-di-ya',
    '진짜로': 'Jin-jja-ro',
    '거짓말': 'Geo-jit-mal',
    '눈부셔': 'Nun-bu-syeo',
    '떠나지마': 'Tteo-na-ji-ma',
    '가지마': 'Ga-ji-ma',
    '돌아와': 'Dol-a-wa',
    '바보처럼': 'Ba-bo-cheo-reom',
    '바보': 'Ba-bo',
    '미쳤어': 'Mi-chyeot-seo',
    '미쳐': 'Mi-chyeo',
    '설레': 'Seol-le',
    '두근두근': 'Du-geun-du-geun',
    '반짝반짝': 'Ban-jjak-ban-jjak',
    '초라해지잖아': 'Cho-ra-hae-ji-ja-na',
    '초라해져': 'Cho-ra-hae-jyeo',
    '거침없이': 'Geo-chim-eop-si'
  };

  /**
   * Dekomposisi 1 Karakter Hangul (Unicode Syllabic Blocks) ke Romaja
   */
  function decomposeHangulChar(ch) {
    const code = ch.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return null;
    const sIndex = code - 0xAC00;
    const jong = sIndex % 28;
    const jung = Math.floor(sIndex / 28) % 21;
    const cho = Math.floor(Math.floor(sIndex / 28) / 21);
    return KO_CHOSEONG[cho] + KO_JUNGSEONG[jung] + KO_JONGSEONG[jong];
  }

  /**
   * Syllabifier Romaja Korea (Jika User Input Huruf Latin)
   */
  function syllabifyKoreanRomaja(word) {
    if (!word || word.length <= 2 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 2 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    // Lindungi kata-kata serapan/lirik bahasa Inggris yang sering muncul di K-Pop
    const commonEngWords = new Set([
      'cause','know','what','you','like','boy','girl','love','yeah','baby','dont','stop',
      'let','go','come','on','the','my','me','we','see','get','feel','night','day','all',
      'right','good','bad','just','can','so','it','is','to','in','for','with','this','that',
      'one','time','music','play','dance','heart','star','sun','sky','fly','shine','world'
    ]);
    if (commonEngWords.has(core.toLowerCase())) {
      return word;
    }

    const vowelPattern = '(wae|yeo|yae|wa|wo|we|wi|oe|ui|eu|ae|ya|ye|yo|yu|eo|a|e|i|o|u)';
    const initConsPattern = '(kk|tt|pp|ss|jj|ch|ng|[gndrmbsjkthp])';
    const sylRegex = new RegExp('^(' + initConsPattern + '?' + vowelPattern + '(ng|kk|ss|[kntlmph])?(?=' + initConsPattern + '?' + vowelPattern + '|$))', 'i');

    const syllables = [];
    let rem = core;

    while (rem.length > 0) {
      const m = rem.match(sylRegex);
      if (m && m[0]) {
        syllables.push(m[0]);
        rem = rem.slice(m[0].length);
      } else {
        // Jika karakter tidak cocok dengan aturan suku kata Korea, anggap kata asing dan biarkan utuh
        return word;
      }
    }

    let formatted = syllables.join('-');
    if (isAllCap) formatted = formatted.toUpperCase();
    else if (isCap) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks Korea (Hangul atau Romaja) menjadi Lirik Siluman (Anti-Sensor)
   */
  function cloakKoreanLine(line) {
    if (!line) return '';

    // 1. Ganti frasa K-Pop populer (Greedy Longest Match)
    const dictKeys = Object.keys(KO_KPOP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      if (s.includes(key)) {
        s = s.split(key).join(' ' + KO_KPOP_DICT[key] + ' ');
      }
    }

    // 2. Dekomposisi blok suku kata Hangul ke Romaja bertanda hubung
    let romajaTokens = [];
    let currentHangul = [];

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const romaja = decomposeHangulChar(ch);

      if (romaja !== null) {
        currentHangul.push(romaja);
      } else {
        if (currentHangul.length > 0) {
          const tokenStr = currentHangul.map((syl, sIdx) => sIdx === 0 ? syl.charAt(0).toUpperCase() + syl.slice(1) : syl).join('-');
          romajaTokens.push(tokenStr);
          currentHangul = [];
        }
        romajaTokens.push(ch);
      }
    }
    if (currentHangul.length > 0) {
      const tokenStr = currentHangul.map((syl, sIdx) => sIdx === 0 ? syl.charAt(0).toUpperCase() + syl.slice(1) : syl).join('-');
      romajaTokens.push(tokenStr);
    }

    const converted = romajaTokens.join('');

    // 3. Syllabify setiap token kata Romaja (jika ada kata Latin yang belum bertanda hubung)
    const tokens = converted.split(/(\s+)/);
    const cloakedTokens = tokens.map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;
      if (tok.includes('-')) return tok;
      if (/^[a-zA-Z0-9À-ž]+$/.test(tok)) {
        return syllabifyKoreanRomaja(tok);
      }
      return tok;
    });

    return cloakedTokens.join('').replace(/\s+/g, ' ').trim();
  }

  // --- 7. ARABIC ACOUSTIC ENGINE (ARABIC SCRIPT & ARABIZI CLOAKER) ---
  const AR_POP_DICT = {
    // Frasa & Gabungan Kata Populer Lagu Arab
    'حبيبي يا نور عيني': 'Ha-bi-bi Ya Noor Ei-ni',
    'يا ساكن خيالي': 'Ya Sa-ken Khe-ya-li',
    'ساكن خيالي': 'Sa-ken Khe-ya-li',
    'تملي معاك': 'Ta-mal-li Ma-\'ak',
    'بعيد عني': 'Ba-\'eed \'An-ni',
    'في قلبي': 'Fee Qal-bi',
    'في قلبي هواك': 'Fee Qal-bi Ha-wak',
    'يا ليل يا عين': 'Ya Leil Ya Ein',
    'على حبيبي': '\'A-la Ha-bi-bi',
    'حبيبي يا غالي': 'Ha-bi-bi Ya Gha-li',
    'يا حبيب قلبي': 'Ya Ha-beeb Qal-bi',
    'حبيب قلبي': 'Ha-beeb Qal-bi',
    'اشتقت لك': 'Esh-taqt Lak',
    'وحشتني': 'Wa-hash-ti-ni',
    'أنت عمري': 'En-ta Om-ri',
    'انت عمري': 'En-ta Om-ri',
    'يا نور عيني': 'Ya Noor Ei-ni',
    'نور عيني': 'Noor Ei-ni',
    'يا سيدي': 'Ya See-di',
    'يا روحي': 'Ya Roo-hi',
    'يا غالي': 'Ya Gha-li',
    'يا قمر': 'Ya Qa-mar',
    'يا جميل': 'Ya Ja-meel',

    // Kosakata Inti Lagu Pop Arab / Rai / Mahraganat
    'بحبك': 'Ba-he-bbak',
    'أحبك': 'U-hib-bak',
    'احبك': 'U-hib-bak',
    'حبيبي': 'Ha-bi-bi',
    'حبيبتي': 'Ha-bi-ba-ti',
    'حبيبه': 'Ha-bi-boh',
    'قلبي': 'Qal-bi',
    'روحي': 'Roo-hi',
    'عمري': 'Om-ri',
    'حياتي': 'Ha-ya-ti',
    'عيوني': 'E-yoo-ni',
    'عيني': 'Ei-ni',
    'مشتاق': 'Mosh-taq',
    'ولهان': 'Wal-han',
    'سهران': 'Sah-ran',
    'غالي': 'Gha-li',
    'حلوة': 'Hel-wa',
    'جميل': 'Ja-meel',
    'قمر': 'Qa-mar',
    'شمس': 'Shams',
    'دنيا': 'Don-ya',
    'عالم': '\'A-lam',
    'شوق': 'Shawq',
    'عشق': '\'Eshq',
    'غرام': 'Gha-ram',
    'سلام': 'Sa-lam',
    'كلام': 'Ka-lam',
    'صوتك': 'Saw-tak',
    'ليالي': 'La-ya-li',
    'ليلة': 'Lei-la',
    'ليل': 'Leil',
    'عين': 'Ein',
    'زمان': 'Za-man',
    'مكان': 'Ma-kan',
    'أيام': 'Ay-yam',
    'ايام': 'Ay-yam',
    'سنين': 'Si-neen',
    'طريق': 'Ta-reeq',
    'نار': 'Nar',
    'نور': 'Noor',
    'دموع': 'Do-moo\'',
    'ضحكة': 'Deh-ka',
    'خلاص': 'Kha-las',
    'والله': 'Wal-lah',
    'يلا': 'Yal-la',
    'تعال': 'Ta-\'a-la',
    'معاك': 'Ma-\'ak',
    'معايا': 'Ma-\'a-ya',
    'عشانك': '\'A-sha-nak',
    'أنا': 'A-na',
    'انا': 'A-na',
    'إنت': 'En-ta',
    'انت': 'En-ta',
    'إحنا': 'Eh-na',
    'احنا': 'Eh-na',
    'كل': 'Kull',
    'يوم': 'Yom',
    'حلم': 'Hilm',
    'هوى': 'Ha-wa',
    'هواك': 'Ha-wak',
    'تملي': 'Ta-mal-li',
    'ولو': 'Wa-law',
    'حتى': 'Hat-ta',
    'بعيد': 'Ba-\'eed',
    'عني': '\'An-ni',
    'في': 'Fee',
    'ساكن': 'Sa-ken',
    'خيالي': 'Khe-ya-li',
    'على': '\'A-la',
    'حنان': 'Ha-nan',
    'حنين': 'Ha-neen',
    'فرح': 'Fa-rah',
    'حزن': 'Hozn',
    'صبر': 'Sabr',
    'قدر': 'Qa-dar',
    'وداع': 'Wa-da\'',
    'عيون': 'E-yoon',
    'قريب': 'Qa-reeb',
    'دايما': 'Dai-man',
    'دائما': 'Da-i-man',
    'في بالي': 'Fee Ba-li',
    'عاشق': '\'A-sheq',
    'بالي': 'Ba-li',
    'ولا': 'Wa-la',
    'بنساك': 'Ban-sak',
    'غيرك': 'Ghei-rak',
    'شفتك': 'Shof-tak',
    'ليك': 'Leek',
    'لي': 'Lee',

    // Extended High-Frequency Song Vocabulary & Vocalizations
    'واحشني': 'Wah-ish-ni',
    'اسمعيني': 'Es-ma-\'ee-ni',
    'اسمعني': 'Es-ma\'-ni',
    'حبيتك': 'Hab-bay-tak',
    'نتكلم': 'Net-kal-lem',
    'نتعلم': 'Net-\'al-lem',
    'معلم': 'M\'al-lem',
    'علينا': '\'A-lai-na',
    'عائشة': 'A-i-cha',
    'كلام الناس': 'Ka-lam El-Nas',
    'الناس': 'El-Nas',
    'بتصدق': 'Bet-sad-daq',
    'هسيبك': 'Ha-see-bak',
    'مش هسيبك': 'Mish Ha-see-bak',
    'مش': 'Mish',
    'مهما': 'Mah-ma',
    'يحصل': 'Yeh-sal',
    'بكون': 'Ba-koon',
    'وياك': 'Way-yak',
    'نسم': 'Nas-sam',
    'الهوى': 'El-Ha-wa',
    'هوى': 'Ha-wa',
    'مفرق': 'Maf-raq',
    'الوادي': 'El-Wa-di',
    'بلادي': 'Bela-di',
    'طاير': 'Ta-yer',
    'بالهوى': 'Bel-Ha-wa',
    'ياللي': 'Yal-li',
    'واللي': 'Wal-li',
    'صحابو': 'Sha-ba-bo',
    'أحبابو': 'Ah-ba-bo',
    'موجود': 'Maw-jood',
    'نسكت': 'Nos-kot',
    'نرضى': 'Nar-da',
    'نارك': 'Na-rak',
    'كل': 'Kull',
    'على': '\'A-la',
    'حتى': 'Hat-ta',
    'ولو': 'Wa-law',
    'لو': 'Law',
    'إنت': 'En-ta',
    'انت': 'En-ta',
    'أنا': 'A-na',
    'انا': 'A-na',
    'وإحنا': 'We-eh-na',
    'إحنا': 'Eh-na',
    'إيه': 'Eh',
    'ده': 'Dah',
    'هو': 'Hu-wa'
  };

  const AR_LETTER_MAP = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ء': '\'', 'ئ': 'e', 'ؤ': 'o',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': '\'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a', 'ى': 'a',
    'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ْ': '', 'ّ': ''
  };

  /**
   * Transliterasi Fonetik Kata Arab (Jika Tidak Ada di Kamus Pop)
   */
  function transliterateArabicToken(word) {
    if (!word) return '';
    let prefix = '';
    let core = word;
    if (core.startsWith('ال')) {
      prefix = 'El-';
      core = core.slice(2);
    }
    let res = '';
    for (let i = 0; i < core.length; i++) {
      const ch = core[i];
      if (AR_LETTER_MAP[ch] !== undefined) {
        res += AR_LETTER_MAP[ch];
      } else {
        res += ch;
      }
    }
    // Jika ada kata transliterasi polos, beri pemenggalan suku kata
    if (res.length > 3 && !res.includes('-')) {
      res = res.replace(/([aeiouy])([bcdfghjklmnpqrstvwxz])(?=[aeiouy])/gi, '$1-$2');
    }
    return prefix + res;
  }

  /**
   * Syllabifier Arabizi / Latin Arab (e.g. habibi -> ha-bi-bi, tamally -> ta-mal-ly)
   */
  function syllabifyArabicLatin(word) {
    if (!word || word.length <= 2 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 2 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    // Lindungi kata bahasa Inggris
    const commonEng = new Set(['cause','know','what','you','like','boy','girl','love','yeah','baby','dont','stop','let','go','come','on','the','my','me','we','see','get','feel','night','day','all','right','just','can','so','it','is','to','in','for','with']);
    if (commonEng.has(core.toLowerCase())) {
      return word;
    }

    // Pemenggalan fonotaktik suku kata Arabizi
    let s = core.toLowerCase();
    s = s.replace(/(sh|kh|gh|th|dh|ch)/g, '§$1§');
    s = s.replace(/([aeiouy]+)([bcdfghjklmnpqrstvwxz])(?=[aeiouy])/gi, '$1-$2');
    s = s.replace(/([bcdfghjklmnpqrstvwxz])([bcdfghjklmnpqrstvwxz])(?=[aeiouy])/gi, '$1-$2');
    s = s.replace(/§/g, '');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks Arab (Aksara Arab atau Arabizi) menjadi Lirik Siluman (Anti-Sensor)
   */
  function cloakArabicLine(line) {
    if (!line) return '';

    let s = line;

    // 1. Ganti frasa majemuk (yang mengandung spasi) terlebih dahulu dari yang terpanjang
    const phraseKeys = Object.keys(AR_POP_DICT).filter(k => k.includes(' ')).sort((a, b) => b.length - a.length);
    for (let k = 0; k < phraseKeys.length; k++) {
      const key = phraseKeys[k];
      if (s.includes(key)) {
        s = s.split(key).join(' ' + AR_POP_DICT[key] + ' ');
      }
    }

    // 2. Tokenisasi kata untuk mencegah tabrakan substring pada kata tunggal (misal: 'نتكلم' memuat 'كل', 'علينا' memuat 'لي')
    const tokens = s.split(/(\s+)/);
    const convertedTokens = tokens.map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;

      // Jika token sudah berupa teks bertanda hubung hasil pemetaan frasa
      if (tok.includes('-')) return tok;

      // 2a. Cek kecocokan langsung di kamus kata tunggal
      if (AR_POP_DICT[tok]) {
        return AR_POP_DICT[tok];
      }

      // 2b. Cek imbuhan awalan konjungsi Arab: و (Wa-), ف (Fa-), ب (Bi-), ل (Li-)
      if (tok.startsWith('و') && tok.length > 2 && AR_POP_DICT[tok.slice(1)]) {
        return 'Wa-' + AR_POP_DICT[tok.slice(1)];
      }
      if (tok.startsWith('ف') && tok.length > 2 && AR_POP_DICT[tok.slice(1)]) {
        return 'Fa-' + AR_POP_DICT[tok.slice(1)];
      }
      if (tok.startsWith('ب') && tok.length > 2 && AR_POP_DICT[tok.slice(1)]) {
        return 'Bi-' + AR_POP_DICT[tok.slice(1)];
      }
      if (tok.startsWith('ل') && tok.length > 2 && AR_POP_DICT[tok.slice(1)]) {
        return 'Li-' + AR_POP_DICT[tok.slice(1)];
      }

      // 2c. Transliterasi kata Arab tersisa yang belum dipetakan
      if (/[\u0600-\u06FF]/.test(tok)) {
        return transliterateArabicToken(tok);
      }

      // 2d. Jika token Latin Arabizi murni, terapkan syllabifier Arabizi
      if (/^[a-zA-Z0-9À-ž']+$/.test(tok) && !tok.includes('-')) {
        return syllabifyArabicLatin(tok);
      }

      return tok;
    });

    return convertedTokens.join('').replace(/\s+/g, ' ').trim();
  }

  // --- 8. HINDI & INDIC ACOUSTIC ENGINE (DEVANAGARI, TELUGU & HINGLISH CLOAKER) ---
  const HI_POP_DICT = {
    // Frasa & Gabungan Kata Populer Lagu Bollywood & Musik India
    'तुम ही हो': 'Tum Hi Ho',
    'अब तुम ही हो': 'Ab Tum Hi Ho',
    'ज़िन्दगी अब तुम ही हो': 'Zin-da-gi Ab Tum Hi Ho',
    'मेरी आशिकी अब तुम ही हो': 'Me-ri Aa-shi-qi Ab Tum Hi Ho',
    'चैन भी मेरा दर्द भी': 'Chain Bhi Me-ra Dard Bhi',
    'मेरी आशिकी': 'Me-ri Aa-shi-qi',
    'तेरे वास्ते': 'Te-re Vaas-te',
    'दिलवाले': 'Dil-wa-le',
    'दिलबर': 'Dil-bar',
    'केसरिया': 'Ke-sa-ri-ya',
    'पहला नशा': 'Peh-la Na-sha',
    'तुझे देखा तो': 'Tu-jhe De-kha To',
    'कल हो ना हो': 'Kal Ho Naa Ho',
    'कभी खुशी कभी ग़म': 'Kabh-i Khu-shi Kabh-i Gham',
    'जय हो': 'Jai Ho',
    'तौबा तौबा': 'Tau-ba Tau-ba',
    'आशिकी': 'Aa-shi-qi',
    'दीवाना': 'Dee-wa-na',
    'सनम': 'Sa-nam',
    'जानम': 'Jaa-nam',
    'मोहब्बत': 'Mo-hab-bat',
    'इश्क़': 'Ishq',
    'प्यार': 'Pyaar',
    'यार': 'Yaar',
    'जिगर': 'Ji-gar',
    'नैना': 'Nai-na',
    'अंखियां': 'An-khi-yan',
    'राधा': 'Raa-dha',
    'सांवरिया': 'Saan-wa-ri-ya',
    'माही': 'Maa-hi',
    'रब्बा': 'Rab-ba',
    'शायद': 'Shaa-yad',
    'हवाएं': 'Ha-wa-yein',
    'लुट गए': 'Lut Ga-ye',
    'बेखयाली': 'Be-kha-ya-li',
    'अपना बना ले': 'Ap-na Ba-na Le',
    'तेरी मिट्टी': 'Te-ri Mit-ti',
    'तुझ में रब दिखता है': 'Tujh Mein Rab Dikh-ta Hai',
    'नाटू नाटू': 'Naa-tu Naa-tu',
    'నాటు నాటు': 'Naa-tu Naa-tu',
    'ఊ అంటావా': 'Oo An-taa-vaa',
    'సామి సామి': 'Saa-mi Saa-mi',
    'శ్రీవల్లి': 'Sree-val-li',

    // High-Frequency Hinglish (Latin India) Song Vocabulary
    'tum hi ho': 'Tum Hi Ho',
    'ab tum hi ho': 'Ab Tum Hi Ho',
    'zindagi': 'Zin-da-gi',
    'aashiqui': 'Aa-shi-qui',
    'kesariya': 'Ke-sa-ri-ya',
    'raataan lambiyan': 'Raa-taan Lam-bi-yan',
    'raataan': 'Raa-taan',
    'lambiyan': 'Lam-bi-yan',
    'tujhe dekha to': 'Tu-jhe De-kha To',
    'pehla nasha': 'Peh-la Na-sha',
    'kal ho naa ho': 'Kal Ho Naa Ho',
    'kabhi khushi kabhie gham': 'Kabh-i Khu-shi Kabh-i Gham',
    'deewana': 'Dee-wa-na',
    'sanam': 'Sa-nam',
    'jaana': 'Jaa-na',
    'jaayenge': 'Jaa-yen-ge',
    'kyunki': 'Kyun-ki',
    'tujhse': 'Tujh-se',
    'wajood': 'Wa-jood',
    'kya': 'Kya',
    'mera': 'Me-ra',
    'meri': 'Me-ri',
    'tere': 'Te-re',
    'teri': 'Te-ri',
    'bina': 'Bi-na',
    'pyaar': 'Pyaar',
    'pyar': 'Pyaar',
    'ishq': 'Ishq',
    'hota': 'Ho-ta',
    'haath': 'Haath',
    'piya': 'Pi-ya',
    'sangiyan': 'San-gi-yan',
    'apna bana le': 'Ap-na Ba-na Le',
    'tujhe': 'Tu-jhe',
    'dekha': 'De-kha'
  };

  const HI_DEVANAGARI_VOWELS = {
    '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee',
    '\u0909': 'u', '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'e',
    '\u0910': 'ai', '\u0913': 'o', '\u0914': 'au', '\u0911': 'o',
    '\u090D': 'e'
  };

  const HI_DEVANAGARI_MATRAS = {
    '\u093E': 'aa', '\u093F': 'i', '\u0940': 'ee', '\u0941': 'u',
    '\u0942': 'oo', '\u0943': 'ri', '\u0947': 'e', '\u0948': 'ai',
    '\u094B': 'o', '\u094C': 'au', '\u0949': 'o', '\u0945': 'e'
  };

  const HI_DEVANAGARI_CONSONANTS = {
    '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
    '\u091A': 'ch', '\u091B': 'chh', '\u091C': 'j', '\u091D': 'jh', '\u091E': 'ny',
    '\u091F': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
    '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
    '\u092A': 'p', '\u092B': 'ph', '\u092C': 'b', '\u092D': 'bh', '\u092E': 'm',
    '\u092F': 'y', '\u0930': 'r', '\u0932': 'l', '\u0933': 'l', '\u0935': 'v',
    '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
    // Nukta consonants
    '\u0958': 'q', '\u0959': 'kh', '\u095A': 'gh', '\u095B': 'z',
    '\u095C': 'r', '\u095D': 'rh', '\u095E': 'f', '\u095F': 'y'
  };

  const TE_VOWELS = {
    '\u0C05': 'a', '\u0C06': 'aa', '\u0C07': 'i', '\u0C08': 'ee',
    '\u0C09': 'u', '\u0C0A': 'oo', '\u0C0B': 'ru', '\u0C0E': 'e',
    '\u0C0F': 'ee', '\u0C10': 'ai', '\u0C12': 'o', '\u0C13': 'oo', '\u0C14': 'au'
  };

  const TE_MATRAS = {
    '\u0C3E': 'aa', '\u0C3F': 'i', '\u0C40': 'ee', '\u0C41': 'u',
    '\u0C42': 'oo', '\u0C43': 'ru', '\u0C46': 'e', '\u0C47': 'ee',
    '\u0C48': 'ai', '\u0C4A': 'o', '\u0C4B': 'oo', '\u0C4C': 'au'
  };

  const TE_CONSONANTS = {
    '\u0C15': 'k', '\u0C16': 'kh', '\u0C17': 'g', '\u0C18': 'gh', '\u0C19': 'ng',
    '\u0C1A': 'ch', '\u0C1B': 'chh', '\u0C1C': 'j', '\u0C1D': 'jh', '\u0C1E': 'ny',
    '\u0C1F': 't', '\u0C20': 'th', '\u0C21': 'd', '\u0C22': 'dh', '\u0C23': 'n',
    '\u0C24': 't', '\u0C25': 'th', '\u0C26': 'd', '\u0C27': 'dh', '\u0C28': 'n',
    '\u0C2A': 'p', '\u0C2B': 'ph', '\u0C2C': 'b', '\u0C2D': 'bh', '\u0C2E': 'm',
    '\u0C2F': 'y', '\u0C30': 'r', '\u0C31': 'r', '\u0C32': 'l', '\u0C33': 'l',
    '\u0C35': 'v', '\u0C36': 'sh', '\u0C37': 'sh', '\u0C38': 's', '\u0C39': 'h'
  };

  /**
   * Transliterasi 1 kata aksara India (Devanagari / Telugu) ke fonetik Latin bertanda hubung
   */
  function transliterateIndicToken(word) {
    if (!word) return '';

    const isDevanagari = /[\u0900-\u097F]/.test(word);
    const isTelugu = /[\u0C00-\u0C7F]/.test(word);

    if (!isDevanagari && !isTelugu) {
      return word;
    }

    const vowelMap = isDevanagari ? HI_DEVANAGARI_VOWELS : TE_VOWELS;
    const matraMap = isDevanagari ? HI_DEVANAGARI_MATRAS : TE_MATRAS;
    const consMap = isDevanagari ? HI_DEVANAGARI_CONSONANTS : TE_CONSONANTS;
    const viramaCode = isDevanagari ? '\u094D' : '\u0C4D';
    const anusvaraCode = isDevanagari ? '\u0902' : '\u0C02';
    const candrabinduCode = isDevanagari ? '\u0901' : '';
    const visargaCode = isDevanagari ? '\u0903' : '\u0C03';
    const nuktaCode = '\u093C';

    const syllables = [];
    let i = 0;
    let clusterConsonants = '';

    while (i < word.length) {
      const ch = word[i];

      // 1. Independent Vowel
      if (vowelMap[ch]) {
        let v = vowelMap[ch];
        i++;
        let mod = '';
        if (i < word.length && (word[i] === anusvaraCode || (candrabinduCode && word[i] === candrabinduCode))) {
          mod = 'n';
          i++;
        } else if (i < word.length && word[i] === visargaCode) {
          mod = 'h';
          i++;
        }
        syllables.push({ text: clusterConsonants + v + mod, hasVowel: true });
        clusterConsonants = '';
        continue;
      }

      // 2. Consonant
      if (consMap[ch]) {
        let cons = consMap[ch];
        i++;

        // Check nukta
        if (isDevanagari && i < word.length && word[i] === nuktaCode) {
          if (cons === 'k') cons = 'q';
          else if (cons === 'kh') cons = 'kh';
          else if (cons === 'g') cons = 'gh';
          else if (cons === 'j') cons = 'z';
          else if (cons === 'd') cons = 'r';
          else if (cons === 'dh') cons = 'rh';
          else if (cons === 'ph') cons = 'f';
          i++;
        }

        // Check virama (conjunct consonant)
        if (i < word.length && word[i] === viramaCode) {
          i++;
          clusterConsonants += cons;
          continue;
        }

        // Check dependent matra
        let matra = '';
        let hasExplicitMatra = false;
        if (i < word.length && matraMap[word[i]]) {
          matra = matraMap[word[i]];
          hasExplicitMatra = true;
          i++;
        } else {
          const isEnd = (i >= word.length || !/[\u0900-\u097F\u0C00-\u0C7F]/.test(word[i]));
          if (isEnd && syllables.length > 0) {
            matra = '';
          } else {
            matra = 'a';
          }
        }

        let mod = '';
        if (i < word.length && (word[i] === anusvaraCode || (candrabinduCode && word[i] === candrabinduCode))) {
          mod = 'n';
          i++;
        } else if (i < word.length && word[i] === visargaCode) {
          mod = 'h';
          i++;
        }

        const fullSyl = clusterConsonants + cons + matra + mod;
        clusterConsonants = '';

        if (!hasExplicitMatra && matra === '' && syllables.length > 0) {
          syllables[syllables.length - 1].text += cons + mod;
        } else {
          syllables.push({ text: fullSyl, hasVowel: Boolean(matra) });
        }
        continue;
      }

      // Punctuation
      if (clusterConsonants) {
        if (syllables.length > 0) {
          syllables[syllables.length - 1].text += clusterConsonants;
        } else {
          syllables.push({ text: clusterConsonants, hasVowel: false });
        }
        clusterConsonants = '';
      }
      syllables.push({ text: ch, hasVowel: false });
      i++;
    }

    if (clusterConsonants) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1].text += clusterConsonants;
      } else {
        syllables.push({ text: clusterConsonants, hasVowel: false });
      }
    }

    const cleanTokens = [];
    for (let s of syllables) {
      const t = s.text.trim();
      if (t) {
        cleanTokens.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
      }
    }

    return cleanTokens.join('-');
  }

  /**
   * Syllabifier Lirik Latin India (Hinglish)
   */
  function syllabifyHindiLatin(word) {
    if (!word || word.length <= 2 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 2 || core.includes('-')) return word;

    const lower = core.toLowerCase();
    if (HI_POP_DICT[lower]) {
      return prefix + HI_POP_DICT[lower] + suffix;
    }

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    const vowelPattern = '(aa|ee|oo|ai|au|ia|ya|a|e|i|o|u)';
    const initConsPattern = '(kh|gh|chh|ch|jh|th|dh|ph|bh|sh|zh|[b-df-hj-np-tv-z]|q)';
    const sylRegex = new RegExp('^(' + initConsPattern + '?' + vowelPattern + '(n|m|r|l|s)?(?=' + initConsPattern + '?' + vowelPattern + '|$))', 'i');

    const syllables = [];
    let rem = core;

    while (rem.length > 0) {
      const m = rem.match(sylRegex);
      if (m && m[0]) {
        syllables.push(m[0]);
        rem = rem.slice(m[0].length);
      } else {
        syllables.push(rem);
        break;
      }
    }

    let formatted = syllables.join('-');
    if (isAllCap) formatted = formatted.toUpperCase();
    else if (isCap) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks India (Devanagari / Telugu / Hinglish) menjadi Lirik Siluman (Anti-Sensor)
   */
  function cloakHindiLine(line) {
    if (!line) return '';

    let s = line;

    // 1. Ganti frasa majemuk Bollywood/India (yang mengandung spasi) terlebih dahulu dari terpanjang
    const dictKeys = Object.keys(HI_POP_DICT).sort((a, b) => b.length - a.length);
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      if (key.includes(' ')) {
        const isLatin = /^[a-zA-Z\s]+$/.test(key);
        if (isLatin) {
          const reg = new RegExp('\\b' + key + '\\b', 'gi');
          s = s.replace(reg, HI_POP_DICT[key]);
        } else if (s.includes(key)) {
          s = s.split(key).join(' ' + HI_POP_DICT[key] + ' ');
        }
      }
    }

    // 2. Transliterasi kata India atau pemenggalan suku kata Hinglish
    const tokens = s.split(/(\s+)/);
    const convertedTokens = tokens.map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;
      if (tok.includes('-')) return tok;

      const lower = tok.toLowerCase();
      if (HI_POP_DICT[lower]) {
        return HI_POP_DICT[lower];
      }

      if (/[\u0900-\u097F\u0C00-\u0C7F]/.test(tok)) {
        return transliterateIndicToken(tok);
      }
      if (/^[a-zA-Z0-9À-ž']+$/.test(tok) && !tok.includes('-')) {
        return syllabifyHindiLatin(tok);
      }
      return tok;
    });

    return convertedTokens.join('').replace(/\s+/g, ' ').trim();
  }

  // --- 9. VIETNAMESE COMPOUND & METER ACOUSTIC ENGINE (TIẾNG VIỆT / V-POP v2.0) ---
  const VI_COMPOUND_WORDS = new Set([
    // Core V-Pop Compounds (Từ ghép chuẩn)
    'cắt đôi', 'nỗi sầu', 'buông tay', 'chấm dứt', 'đoạn tình', 'tình đầu', 'tan vỡ',
    'người yêu', 'trái tim', 'hạnh phúc', 'nước mắt', 'cô đơn', 'mãi mãi', 'bình yên',
    'thương nhớ', 'cuộc đời', 'bên cạnh', 'nụ cười', 'kỷ niệm', 'quá khứ', 'tương lai',
    'bầu trời', 'cơn mưa', 'ánh sáng', 'bóng tối', 'giấc mơ', 'thời gian', 'yêu thương',
    'nhung nhớ', 'vấn vương', 'chia tay', 'lặng thầm', 'vội vàng', 'dịu dàng', 'say đắm',
    'ngọt ngào', 'chua xót', 'đau đớn', 'tổn thương', 'lạc lối', 'tìm kiếm', 'hẹn ước',
    'bên trên', 'tầng lầu', 'hai phút', 'see tình', 'nắng ấm', 'xa dần', 'em gái',
    'lạc trôi', 'chạy ngay', 'nơi này', 'có anh', 'chúng ta', 'của anh', 'của em',
    'ngày đầu', 'hết thương', 'cạn nhớ', 'hoa nở', 'không màu', 'bước qua',
    'từng quen', 'chìm sâu', 'sau lời', 'từ khước', 'đừng làm', 'anh đau',
    'thanh xuân', 'suốt đời', 'bên nhau', 'cùng nhau', 'ấm áp', 'mưa giông',
    'trước mắt', 'cay đắng', 'đôi môi', 'bao giờ', 'gặp nhau', 'bóng đêm',
    'ngày mai', 'xua tan', 'dành cả', 'giây phút', 'về nhà', 'đừng lo', 'đừng khóc',
    'bắt em', 'chỉ còn', 'riêng anh', 'không thể', 'đến cuối', 'giờ đây',
    'còn lại', 'rơi trên', 'mới lại', 'đoạn đường', 'mùa đông', 'nắng vàng',
    'hoa rơi', 'lá bay', 'nguyện cầu', 'bên anh', 'bên em', 'yêu em', 'yêu anh',
    'thầm thương', 'trộm nhớ', 'dẫu cho', 'dù cho', 'mai sau', 'muôn đời', 'ngàn năm'
  ]);

  const VI_POP_DICT = {
    'cắt đôi nỗi sầu': 'Cắt-đôi Nỗi-sầu',
    'bên trên tầng lầu': 'Bên-trên Tầng-lầu',
    'hai phút hơn': 'Hai-phút-hơn',
    'tình tình tình tang tang tính': 'Tình-tình-tình Tang-tang-tính',
    'sau lời từ khước': 'Sau-lời Từ-khước',
    'bước qua nhau': 'Bước-qua-nhau',
    'nơi này có anh': 'Nơi-này Có-anh',
    'lạc trôi': 'Lạc-trôi',
    'ngày đầu tiên': 'Ngày-đầu-tiên',
    'em gái mưa': 'Em-gái-mưa',
    'chúng ta của hiện tại': 'Chúng-ta Của-hiện-tại',
    'hết thương cạn nhớ': 'Hết-thương Cạn-nhớ',
    'hoa nở không màu': 'Hoa-nở Không-màu',
    'từng quen': 'Từng-quen',
    'đừng làm trái tim anh đau': 'Đừng-làm Trái-tim Anh-đau',
    'chạy ngay đi': 'Chạy-ngay-đi',
    'ánh nắng của anh': 'Ánh-nắng Của-anh',
    'waiting for you': 'Wai-ting For You',
    'bước qua mùa cô đơn': 'Bước-qua Mùa-cô-đơn'
  };

  /**
   * Mengonversi baris teks Vietnam (Tiếng Việt) menjadi Lirik Siluman (Anti-Sensor) v2.0
   * Menggunakan Two-Pass Compound Locking agar kata majemuk (từ ghép) terlindungi utuh
   * dan intonasi vokal V-Pop tetap mengalir alami tanpa merusak kosakata asli.
   */
  function cloakVietnameseLine(line) {
    if (!line) return '';

    // 1. Ganti frasa & judul lagu V-Pop populer dari kamus (Greedy Longest Match)
    const dictKeys = Object.keys(VI_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      const reg = new RegExp(key, 'gi');
      s = s.replace(reg, VI_POP_DICT[key]);
    }

    // 2. Tokenisasi kata
    const tokens = s.split(/\s+/).filter(Boolean);
    const isPaired = new Array(tokens.length).fill(false);
    const pairs = [];

    // Pass 1: Kunci kata majemuk resmi (Từ ghép) terlebih dahulu di seluruh baris
    for (let i = 0; i < tokens.length - 1; i++) {
      if (isPaired[i] || isPaired[i + 1]) continue;
      if (tokens[i].includes('-') || tokens[i + 1].includes('-')) continue;
      const clean1 = tokens[i].toLowerCase().replace(/[.,!?;:"'()[\]]/g, '');
      const clean2 = tokens[i + 1].toLowerCase().replace(/[.,!?;:"'()[\]]/g, '');
      const candidate = clean1 + ' ' + clean2;
      if (VI_COMPOUND_WORDS.has(candidate)) {
        isPaired[i] = true;
        isPaired[i + 1] = true;
        pairs.push({ start: i, text: tokens[i] + '-' + tokens[i + 1] });
      }
    }

    // Pass 2: Pasangkan kata tunggal tersisa berdampingan (ritme vokal meter)
    for (let i = 0; i < tokens.length - 1; i++) {
      if (isPaired[i] || isPaired[i + 1]) continue;
      if (tokens[i].startsWith('[') || tokens[i].includes('-') || /[.,!?;:]/.test(tokens[i])) continue;
      if (tokens[i + 1].startsWith('[') || tokens[i + 1].includes('-')) continue;
      isPaired[i] = true;
      isPaired[i + 1] = true;
      pairs.push({ start: i, text: tokens[i] + '-' + tokens[i + 1] });
    }

    // Pass 3: Susun kembali urutan token
    const out = [];
    let i = 0;
    while (i < tokens.length) {
      const pair = pairs.find(p => p.start === i);
      if (pair) {
        out.push(pair.text);
        i += 2;
      } else {
        out.push(tokens[i]);
        i++;
      }
    }

    return out.join(' ');
  }

  // --- 10. THAI ACOUSTIC ENGINE (THAI SCRIPT & KARAOKE CLOAKER) ---
  const TH_CONSONANTS = {
    '\u0E01': { init: 'k', fin: 'k' },
    '\u0E02': { init: 'kh', fin: 'k' },
    '\u0E03': { init: 'kh', fin: 'k' },
    '\u0E04': { init: 'kh', fin: 'k' },
    '\u0E05': { init: 'kh', fin: 'k' },
    '\u0E06': { init: 'kh', fin: 'k' },
    '\u0E07': { init: 'ng', fin: 'ng' },
    '\u0E08': { init: 'ch', fin: 't' },
    '\u0E09': { init: 'ch', fin: 't' },
    '\u0E0A': { init: 'ch', fin: 't' },
    '\u0E0B': { init: 's', fin: 't' },
    '\u0E0C': { init: 'ch', fin: 't' },
    '\u0E0D': { init: 'y', fin: 'n' },
    '\u0E0E': { init: 'd', fin: 't' },
    '\u0E0F': { init: 't', fin: 't' },
    '\u0E10': { init: 'th', fin: 't' },
    '\u0E11': { init: 'th', fin: 't' },
    '\u0E12': { init: 'th', fin: 't' },
    '\u0E13': { init: 'n', fin: 'n' },
    '\u0E14': { init: 'd', fin: 't' },
    '\u0E15': { init: 't', fin: 't' },
    '\u0E16': { init: 'th', fin: 't' },
    '\u0E17': { init: 'th', fin: 't' },
    '\u0E18': { init: 'th', fin: 't' },
    '\u0E19': { init: 'n', fin: 'n' },
    '\u0E1A': { init: 'b', fin: 'p' },
    '\u0E1B': { init: 'p', fin: 'p' },
    '\u0E1C': { init: 'ph', fin: 'p' },
    '\u0E1D': { init: 'f', fin: 'p' },
    '\u0E1E': { init: 'ph', fin: 'p' },
    '\u0E1F': { init: 'f', fin: 'p' },
    '\u0E20': { init: 'ph', fin: 'p' },
    '\u0E21': { init: 'm', fin: 'm' },
    '\u0E22': { init: 'y', fin: 'y' },
    '\u0E23': { init: 'r', fin: 'n' },
    '\u0E24': { init: 'rue', fin: '' },
    '\u0E25': { init: 'l', fin: 'n' },
    '\u0E26': { init: 'lue', fin: '' },
    '\u0E27': { init: 'w', fin: 'w' },
    '\u0E28': { init: 's', fin: 't' },
    '\u0E29': { init: 's', fin: 't' },
    '\u0E2A': { init: 's', fin: 't' },
    '\u0E2B': { init: 'h', fin: '' },
    '\u0E2C': { init: 'l', fin: 'n' },
    '\u0E2D': { init: '', fin: '' },
    '\u0E2E': { init: 'h', fin: '' }
  };

  const TH_LEADING_VOWELS = {
    '\u0E40': 'e',
    '\u0E41': 'ae',
    '\u0E42': 'o',
    '\u0E43': 'ai',
    '\u0E44': 'ai'
  };

  const TH_FOLLOWING_VOWELS = {
    '\u0E30': 'a',
    '\u0E31': 'a',
    '\u0E32': 'aa',
    '\u0E33': 'am',
    '\u0E34': 'i',
    '\u0E35': 'ee',
    '\u0E36': 'ue',
    '\u0E37': 'uee',
    '\u0E38': 'u',
    '\u0E39': 'oo',
    '\u0E45': 'a'
  };

  const TH_POP_DICT = {
    // Viral T-Pop Hits & Titles
    'รักเธอที่สุด': 'Rak-thoe Thee-sut',
    'ไม่เป็นไร': 'Mai-pen-rai',
    'ยินดีที่ไม่รู้จัก': 'Yin-dee Thee-mai Roo-jak',
    'ถ้าเธอรักฉันจริง': 'Thaa-thoe Rak-chan Jing',
    'ถ้าเธอรักใครคนหนึ่ง': 'Thaa-thoe Rak-khrai Khon-nueng',
    'โต๊ะริม': 'To-rim',
    'นะหน้าทอง': 'Na-naa-thong',
    'วาดไว้': 'Waat-wai',
    'บานปลาย': 'Baan-plaai',
    'คิดแต่ไม่ถึง': 'Khit-tae-mai-theung',
    'เพื่อนเล่น ไม่เล่นเพื่อน': 'Phuean-len Mai-len-phuean',
    'เพื่อนเล่นไม่เล่นเพื่อน': 'Phuean-len Mai-len-phuean',
    'กลิ่นดอกไม้': 'Klin-dawk-maai',
    'ซ่อนกลิ่น': 'Sawn-klin',
    'ฝนตกไหม': 'Fon-tok-mai',
    'ดวงใจ': 'Duang-jai',
    'ตลอดไป': 'Tlaawt-pai',
    'น้ำตา': 'Nam-taa',
    'จริงจริง': 'Jring-jring',
    'เธอคือดวงใจของฉัน': 'Thoe-khue Duang-jai Khaawng-chan',
    'คนละชั้น': 'Khon-la-chan',
    'สองรัก': 'Saawng-rak',
    'คิดถึงเธอทุกทีที่อยู่คนเดียว': 'Khit-theung Thoe Thuk-thee Thee-yoo Khon-diao',

    // Core High-Frequency T-Pop Vocabulary (Pronouns, Verbs, Heart)
    'ตัวเอง': 'Tua-eeng',
    'คนหนึ่ง': 'Khon-nueng',
    'คนเดียว': 'Khon-diao',
    'คนรัก': 'Khon-rak',
    'ทุกคน': 'Thuk-khon',
    'คิดถึง': 'Khit-theung',
    'เข้าใจ': 'Khao-jai',
    'ขอโทษ': 'Khaaw-thoht',
    'ขอบคุณ': 'Khaawp-khun',
    'หัวใจ': 'Hua-jai',
    'ความรัก': 'Khwaam-rak',
    'ความรู้สึก': 'Khwaam-roo-seuk',
    'ความสุข': 'Khwaam-suk',
    'ความทรงจำ': 'Khwaam-song-jam',
    'รอยยิ้ม': 'Raawy-yim',
    'สายตา': 'Saai-taa',
    'เสียใจ': 'Sia-jai',
    'ทรมาน': 'Thaaw-ra-maan',
    'ท้องฟ้า': 'Thaawng-faa',
    'ดวงดาว': 'Duang-daao',
    'พระจันทร์': 'Phra-jan',
    'ดวงอาทิตย์': 'Duang-aa-thit',
    'ดอกไม้': 'Dawk-maai',
    'คืนนี้': 'Kheun-nee',
    'วันนี้': 'Wan-nee',
    'วันพรุ่งนี้': 'Wan-phrung-nee',
    'ดวงเดือน': 'Duang-duean',
    'มากกว่า': 'Maak-kwaa',
    'ที่สุด': 'Thee-sut',

    // Common Monosyllabic / Disyllabic Words
    'เธอ': 'Thoe', 'ฉัน': 'Chan', 'คุณ': 'Khun', 'เรา': 'Rao', 'เขา': 'Khao', 'ผม': 'Phom',
    'เพื่อน': 'Phuean', 'ใคร': 'Khrai', 'รัก': 'Rak', 'รู้': 'Roo', 'เห็น': 'Hen',
    'มอง': 'Maawng', 'ฟัง': 'Fang', 'พูด': 'Phoot', 'บอก': 'Baawk', 'กอด': 'Gawt',
    'รอ': 'Raaw', 'เดิน': 'Doen', 'วิ่ง': 'Wing', 'บิน': 'Bin',
    'หลับ': 'Lap', 'ตื่น': 'Teun', 'ลืม': 'Leum', 'จำ': 'Jam', 'อยู่': 'Yoo',
    'ไป': 'Pai', 'มา': 'Maa', 'มี': 'Mee', 'ให้': 'Hai', 'ได้': 'Dai',
    'เป็น': 'Pen', 'คือ': 'Khue', 'ทำ': 'Tham', 'วาด': 'Waat', 'ไว้': 'Wai',
    'ฝน': 'Fon', 'ลม': 'Lom', 'ใจ': 'Jai', 'เจ็บ': 'Jep', 'เหงา': 'Ngao',
    'ของ': 'Khaawng', 'กับ': 'Kap', 'และ': 'Lae', 'แต่': 'Tae', 'ถ้า': 'Thaa',
    'อย่า': 'Yaa', 'ไหม': 'Mai', 'มั้ย': 'Mai', 'เคย': 'Khoei', 'เปลี่ยน': 'Plian',
    'สุด': 'Sut', 'หอม': 'Haawm', 'ที่': 'Thee', 'ใน': 'Nai', 'เอา': 'Ao',
    'ยัง': 'Yang', 'กลับ': 'Klap', 'กลาย': 'Klaai', 'สบตา': 'Sop-taa', 'โปรด': 'Prot',
    'ทิ้ง': 'Thing', 'ว่า': 'Waa', 'มัน': 'Man', 'บ้าง': 'Baang',

    // Common Romanized Karaoke Phrases
    'mai pen rai': 'Mai-pen-rai',
    'rak thoe thee sut': 'Rak-thoe Thee-sut',
    'khit theung': 'Khit-theung',
    'khit theung thoe': 'Khit-theung Thoe',
    'yin dee thee mai roo jak': 'Yin-dee Thee-mai Roo-jak',
    'hua jai': 'Hua-jai',
    'duang jai': 'Duang-jai',
    'khwaam rak': 'Khwaam-rak'
  };

  /**
   * Transliterasi 1 kata aksara Thai ke fonetik Latin bertanda hubung v2.0
   * Menangani kluster konsonan, vokal atas/bawah, diftong, dan membisukan karakter garan (์)
   */
  function transliterateThaiWord(word) {
    if (!word) return '';

    let res = [];
    let i = 0;

    while (i < word.length) {
      let leadingVowel = '';
      if (TH_LEADING_VOWELS[word[i]]) {
        leadingVowel = TH_LEADING_VOWELS[word[i]];
        i++;
      }

      if (i < word.length && TH_CONSONANTS[word[i]]) {
        const consChar = word[i];
        let consObj = TH_CONSONANTS[consChar];
        i++;

        // Konsonan kluster (กร, กล, ปร, ปล, พร, พล, ตร, คว, ขว)
        let cluster = '';
        if (i < word.length && (word[i] === '\u0E23' || word[i] === '\u0E25' || word[i] === '\u0E27')) {
          const nextChar = word[i];
          if (['\u0E01', '\u0E02', '\u0E04', '\u0E1B', '\u0E1C', '\u0E1E', '\u0E15'].includes(consChar)) {
            cluster = nextChar === '\u0E23' ? 'r' : nextChar === '\u0E25' ? 'l' : 'w';
            i++;
          }
        }

        // Cek tanda karan bisu (์)
        if (i < word.length && word[i] === '\u0E4C') {
          i++;
          continue;
        }

        // Cek tanda nada / mai taikhu (็)
        if (i < word.length && /[\u0E47-\u0E4B]/.test(word[i])) {
          i++;
        }

        // Cek vokal pengikut / atas / bawah
        let fv = '';
        if (i < word.length && TH_FOLLOWING_VOWELS[word[i]]) {
          fv = TH_FOLLOWING_VOWELS[word[i]];
          i++;
        }

        // Cek tanda nada setelah vokal
        if (i < word.length && /[\u0E47-\u0E4B]/.test(word[i])) {
          i++;
        }

        // Cek konsonan penutup
        let fin = '';
        if (i < word.length && TH_CONSONANTS[word[i]]) {
          // Jika karakter setelahnya adalah karan (์), konsonan ini dan karan dibisukan
          if (i + 1 < word.length && word[i + 1] === '\u0E4C') {
            i += 2;
          } else if (!TH_FOLLOWING_VOWELS[word[i + 1]] && !TH_LEADING_VOWELS[word[i + 1]]) {
            fin = TH_CONSONANTS[word[i]].fin;
            i++;
          }
        }

        let vowel = leadingVowel || fv || 'o';
        if (leadingVowel && fv) {
          if (leadingVowel === 'e' && fv === 'aa') vowel = 'ao';
          else if (leadingVowel === 'e' && fv === 'a') vowel = 'e';
          else if (leadingVowel === 'e' && fv === 'ue') vowel = 'uea';
          else if (leadingVowel === 'e' && fv === 'ee') vowel = 'ia';
          else vowel = leadingVowel + fv;
        }

        let init = consObj.init + cluster;
        let syl = init + vowel + fin;
        if (syl) {
          res.push(syl.charAt(0).toUpperCase() + syl.slice(1).toLowerCase());
        }
        continue;
      }

      // Karakter non-Thai
      res.push(word[i]);
      i++;
    }

    return res.join('-');
  }

  /**
   * Syllabifier Lirik Latin Thai (Karaoke)
   */
  function syllabifyThaiLatin(word) {
    if (!word || word.length <= 2 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 2 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    const vowelPattern = '(aew|aaw|aai|oey|uea|ia|ua|aao|ae|oe|ee|oo|ue|ai|ao|ui|oi|a|e|i|o|u)';
    const initConsPattern = '(kh|ng|ch|th|ph|kl|kr|khl|khr|pl|pr|phl|phr|tr|[kctdnpbfmyrwshz])';
    const sylRegex = new RegExp('^(' + initConsPattern + '?' + vowelPattern + '(k|t|p|n|m|ng|w|y)?(?=' + initConsPattern + '?' + vowelPattern + '|$))', 'i');

    const syllables = [];
    let rem = core;

    while (rem.length > 0) {
      const m = rem.match(sylRegex);
      if (m && m[0]) {
        syllables.push(m[0]);
        rem = rem.slice(m[0].length);
      } else {
        syllables.push(rem);
        break;
      }
    }

    let formatted = syllables.join('-');
    if (isAllCap) formatted = formatted.toUpperCase();
    else if (isCap) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks Thailand (Aksara Thai atau Karaoke) menjadi Lirik Siluman (Anti-Sensor) v2.0
   */
  function cloakThaiLine(line) {
    if (!line) return '';

    // 1. Ganti frasa & judul lagu T-Pop populer dari kamus (Greedy Longest Match)
    const dictKeys = Object.keys(TH_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      if (s.toLowerCase().includes(key.toLowerCase())) {
        const reg = new RegExp(key, 'gi');
        s = s.replace(reg, ' ' + TH_POP_DICT[key] + ' ');
      }
    }

    // 2. Tokenisasi kata dan transliterasi aksara Thai atau penggalan Latin Thai
    const tokens = s.split(/(\s+)/);
    const converted = [];
    let i = 0;

    while (i < tokens.length) {
      const tok = tokens[i];
      if (/^\s+$/.test(tok) || !tok) {
        i++;
        continue;
      }

      if (tok.startsWith('[') || tok.startsWith('(')) {
        converted.push(tok);
        i++;
        continue;
      }

      if (/[\u0E00-\u0E7F]/.test(tok)) {
        converted.push(transliterateThaiWord(tok));
        i++;
        continue;
      }

      // Jika kata Latin karaoke pendek berdampingan, pasangkan bertanda hubung
      if (/^[a-zA-Z0-9À-ž']+$/i.test(tok) && !tok.includes('-')) {
        let nextIdx = i + 1;
        while (nextIdx < tokens.length && /^\s+$/.test(tokens[nextIdx])) {
          nextIdx++;
        }
        if (nextIdx < tokens.length) {
          const nextTok = tokens[nextIdx];
          if (/^[a-zA-Z0-9À-ž']+$/i.test(nextTok) && !nextTok.includes('-') && !nextTok.startsWith('[')) {
            if (tok.length <= 6 && nextTok.length <= 6) {
              converted.push(tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase() + '-' +
                             nextTok.charAt(0).toUpperCase() + nextTok.slice(1).toLowerCase());
              i = nextIdx + 1;
              continue;
            }
          }
        }
        converted.push(syllabifyThaiLatin(tok));
        i++;
        continue;
      }

      converted.push(tok);
      i++;
    }

    return converted.join(' ').replace(/\s+/g, ' ').trim();
  }

  // --- 11. RUSSIAN ACOUSTIC ENGINE (CYRILLIC CLOAKER) ---
  const RU_CYRILLIC_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  const RU_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я',
                            'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']);

  const RU_POP_DICT = {
    // Viktor Tsoi & KINO Classics
    'группа крови на рукаве': 'Grup-pa Kro-vi Na Ru-ka-ve',
    'группа крови': 'Grup-pa Kro-vi',
    'пачка сигарет': 'Pach-ka Si-ga-ret',
    'спокойная ночь': 'Spo-koy-na-ya Noch',
    'звезда по имени солнце': 'Zvez-da Po I-me-ni Soln-tse',
    'кукушка': 'Ku-kush-ka',
    'хочу перемен': 'Kho-chu Pe-re-men',
    'перемен': 'Pe-re-men',
    'восьмиклассница': 'Vos-mi-klass-ni-tsa',
    'кончится лето': 'Kon-chit-sya Le-to',
    'алюминиевые огурцы': 'A-lyu-mi-ni-e-vye O-gur-tsy',
    'пожелай мне удачи': 'Po-zhe-lay Mne U-da-chi',
    'моё настроение': 'Mo-yo Nas-tro-e-ni-e',

    // Molchat Doma & Post-Punk / Doomer
    'эмалированное судно': 'E-ma-li-ro-van-no-e Sud-no',
    'судно': 'Sud-no',
    'тоска': 'Tos-ka',
    'на дне': 'Na Dne',
    'клетка': 'Klet-ka',
    'дискотека': 'Dis-ko-te-ka',
    'люди надоели': 'Lyu-di Na-do-e-li',

    // Laskoviy Mai / Yuri Shatunov
    'белые розы': 'Be-ly-e Ro-zy',
    'седая ночь': 'Se-da-ya Noch',
    'розовый вечер': 'Ro-zo-vyy Ve-cher',
    'глупые снежинки': 'Glu-py-e Sne-zhin-ki',
    'лето': 'Le-to',

    // Zemfira & Russian Rock
    'искала': 'Is-ka-la',
    'хочешь': 'Kho-chesh',
    'ариведерчи': 'A-ri-ve-der-chi',
    'беспризорник': 'Bes-pri-zor-nik',
    'ромашки': 'Ro-mash-ki',
    'неболондон': 'Ne-bo-lon-don',

    // Basta & Modern Russian Hits
    'сансара': 'San-sa-ra',
    'моя игра': 'Mo-ya Ig-ra',
    'выпускной': 'Vy-pusk-noy',
    'медлячок': 'Med-lya-chok',
    'когда меня не станет': 'Kog-da Me-nya Ne Sta-net',

    // Korol i Shut (KiSh)
    'лесник': 'Les-nik',
    'прыгну со скалы': 'Pryg-nu So Ska-ly',
    'кукла колдуна': 'Kuk-la Kol-du-na',
    'дурак и молния': 'Du-rak I Mol-ni-ya',

    // Bi-2 & Splean
    'полковнику никто не пишет': 'Pol-kov-ni-ku Nik-to Ne Pi-shet',
    'варвара': 'Var-va-ra',
    'серебро': 'Se-reb-ro',
    'моё сердце': 'Mo-yo Serd-tse',
    'мое сердце': 'Mo-yo Serd-tse',
    'выхода нет': 'Vy-kho-da Net',
    'романс': 'Ro-mans',

    // Lyube & Folk
    'комбат': 'Kom-bat',
    'ты неси меня река': 'Ty Ne-si Me-nya Re-ka',
    'конь': 'Kon',
    'выйду ночью в поле с конём': 'Vy-ydu Noch-yu V Po-le S Ko-nyom',

    // Macan / Jony / Rauf & Faik / Miyagi
    'комета': 'Ko-me-ta',
    'детство': 'Det-stvo',
    'асфальт': 'As-falt',
    'без тебя я не я': 'Bez Te-bya Ya Ne Ya',
    'там ревели горы': 'Tam Re-ve-li Go-ry',
    'патрон': 'Pat-ron',

    // Love & Emotion Core Phrases
    'я люблю тебя': 'Ya Lyub-lyu Te-bya',
    'я тебя люблю': 'Ya Te-bya Lyub-lyu',
    'люблю тебя': 'Lyub-lyu Te-bya',
    'моя мечта': 'Mo-ya Mech-ta',
    'красиво': 'Kra-si-vo',
    'привет': 'Pri-vet',
    'пока': 'Po-ka',
    'сердце': 'Serd-tse',
    'любовь': 'Lyu-bov',
    'навсегда': 'Na-vseg-da',
    'солнце': 'Soln-tse',
    'звезда': 'Zvez-da',
    'дождь': 'Dozhd',
    'темнота': 'Tem-no-ta',
    'ночь': 'Noch',
    'день': 'Den',
    'вечер': 'Ve-cher',
    'утро': 'Ut-ro',
    'глаза': 'Gla-za',
    'душа': 'Du-sha',
    'жизнь': 'Zhizn',
    'смерть': 'Smert',
    'свобода': 'Svo-bo-da',
    'ветер': 'Ve-ter',
    'огонь': 'O-gon',
    'свет': 'Svet',
    'время': 'Vre-mya',
    'друг': 'Drug',
    'вместе': 'Vmes-te',
    'один': 'O-din',
    'никогда': 'Ni-kog-da',

    // Romanized Translit Variants
    'gruppa krovi': 'Grup-pa Kro-vi',
    'spokoynaya noch': 'Spo-koy-na-ya Noch',
    'belye rozy': 'Be-ly-e Ro-zy',
    'pachka sigaret': 'Pach-ka Si-ga-ret',
    'kukushka': 'Ku-kush-ka',
    'sansara': 'San-sa-ra',
    'peremen': 'Pe-re-men',
    'sudno': 'Sud-no',
    'toska': 'Tos-ka',
    'ya lyublyu tebya': 'Ya Lyub-lyu Te-bya'
  };

  /**
   * Transliterasi kata Cyrillic Rusia ke fonetik Latin bertanda hubung
   */
  function transliterateRussianWord(word) {
    if (!word) return '';

    const match = word.match(/^([^a-zA-Z0-9\u0400-\u04FF]*)(.*?)([^a-zA-Z0-9\u0400-\u04FF]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (!core) return word;

    const vowelIndices = [];
    for (let i = 0; i < core.length; i++) {
      if (RU_VOWELS.has(core[i])) {
        vowelIndices.push(i);
      }
    }

    if (vowelIndices.length <= 1) {
      let out = '';
      for (let i = 0; i < core.length; i++) {
        out += RU_CYRILLIC_MAP[core[i]] !== undefined ? RU_CYRILLIC_MAP[core[i]] : core[i];
      }
      const cap = core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
      if (cap && out.length > 0) {
        out = out.charAt(0).toUpperCase() + out.slice(1).toLowerCase();
      }
      return prefix + out + suffix;
    }

    const rawSyllables = [];
    let start = 0;

    for (let v = 0; v < vowelIndices.length - 1; v++) {
      const vCurr = vowelIndices[v];
      const vNext = vowelIndices[v + 1];
      const consCount = vNext - vCurr - 1;

      let splitAt;
      if (consCount <= 1) {
        splitAt = vNext - consCount;
      } else {
        splitAt = vCurr + 2;
      }

      rawSyllables.push(core.slice(start, splitAt));
      start = splitAt;
    }
    rawSyllables.push(core.slice(start));

    const latinSyllables = rawSyllables.map((syl, idx) => {
      let out = '';
      for (let i = 0; i < syl.length; i++) {
        out += RU_CYRILLIC_MAP[syl[i]] !== undefined ? RU_CYRILLIC_MAP[syl[i]] : syl[i];
      }
      if (idx === 0) {
        const isCap = core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
        if (isCap && out.length > 0) {
          return out.charAt(0).toUpperCase() + out.slice(1).toLowerCase();
        }
      }
      return out.toLowerCase();
    });

    return prefix + latinSyllables.join('-') + suffix;
  }

  /**
   * Syllabifier Lirik Latin Translit Rusia
   */
  function syllabifyRussianLatin(word) {
    if (!word || word.length <= 3 || word.includes('-')) return word;

    const match = word.match(/^([^a-zA-Z0-9À-ž]*)(.*?)([^a-zA-Z0-9À-ž]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    if (core.length <= 3 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();

    // Russian translit phonotactics
    const V = '[aeiouyё]';
    const C = '[^aeiouyё-]';

    let s = core.toLowerCase();

    // V-CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // V-CC-V
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      // Lindungi konsonan digraf yang tidak boleh terbelah (sh, ch, zh, ts, kh)
      if (['sh', 'ch', 'zh', 'ts', 'th', 'kh'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris teks Rusia (Aksara Sirilik atau Translit Latin) menjadi Lirik Siluman (Anti-Sensor) v2.0
   */
  function cloakRussianLine(line) {
    if (!line) return '';

    // 1. Ganti frasa & judul lagu populer dari kamus (Greedy Longest Match)
    const dictKeys = Object.keys(RU_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      const reg = new RegExp(key, 'gi');
      s = s.replace(reg, RU_POP_DICT[key]);
    }

    // 2. Tokenisasi kata dan transliterasi Cyrillic atau penggalan Latin Translit
    const tokens = s.split(/(\s+)/);
    const converted = tokens.map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;
      if (tok.startsWith('[') || tok.startsWith('(')) return tok;
      if (/[\u0400-\u04FF]/.test(tok)) {
        return transliterateRussianWord(tok);
      }
      if (/^[a-zA-Z0-9À-ž']+$/.test(tok) && !tok.includes('-')) {
        return syllabifyRussianLatin(tok);
      }
      return tok;
    });

    return converted.join('').replace(/\s+/g, ' ').trim();
  }

  // --- 12. FRENCH ACOUSTIC ENGINE (PHONOTACTIC CLOAKER v2.0) ---
  const FR_POP_DICT = {
    // Classic & Iconic Chanson Hits
    'non, je ne regrette rien': 'Non, Je Ne Re-gret-te Rien',
    'je ne regrette rien': 'Je Ne Re-gret-te Rien',
    'la vie en rose': 'La Vie En Ro-se',
    'ne me quitte pas': 'Ne Me Quit-te Pas',
    'la bohème': 'La Bo-hè-me',
    'la boheme': 'La Bo-hè-me',
    'les champs-élysées': 'Les Champs-É-ly-sées',
    'champs-elysees': 'Champs-É-ly-sées',
    'comme d\'habitude': 'Com-me D\'ha-bi-tu-de',
    'l\'hymne à l\'amour': 'L\'hym-ne À L\'a-mour',
    'au clair de la lune': 'Au Clair De La Lu-ne',
    'les feuilles mortes': 'Les Feuil-les Mor-tes',

    // Modern Pop & Viral Hits
    'dernière danse': 'Der-niè-re Dan-se',
    'derniere danse': 'Der-niè-re Dan-se',
    'tourner dans le vide': 'Tour-ner Dans Le Vi-de',
    'alors on danse': 'A-lors On Dan-se',
    'papaoutai': 'Pa-pa-ou-tai',
    'formidable': 'For-mi-da-ble',
    'pour que tu m\'aimes encore': 'Pour Que Tu M\'ai-mes En-co-re',
    'c\'est la vie': 'C\'est La Vie',
    'mon amour': 'Mon A-mour',
    'au revoir': 'Au Re-voir',
    'tout le monde': 'Tout Le Mon-de',
    'voyage voyage': 'Voya-ge, Voya-ge',
    'voyage, voyage': 'Voya-ge, Voya-ge',
    'moi lolita': 'Moi... Lo-li-ta',
    'moi... lolita': 'Moi... Lo-li-ta',
    'je m\'appelle lolita': 'Je M\'ap-pel-le Lo-li-ta',
    'quelqu\'un m\'a dit': 'Quel-qu\'un M\'a Dit',
    'je l\'aime à mourir': 'Je L\'ai-me À Mou-rir',
    'je vole': 'Je Vo-le',
    'je veux': 'Je Veux',
    'désenchantée': 'Dé-sen-chan-tée',
    'desenchantee': 'Dé-sen-chan-tée',
    'le festin': 'Le Fes-tin',
    'balance ton quoi': 'Ba-lan-ce Ton Quoi',
    'tu es foutu': 'Tu Es Fou-tu',

    // Love & Key Expressions (Word-bounded)
    'je t\'aime': 'Je T\'ai-me',
    'je t\'aimais': 'Je T\'ai-mais',
    'je t\'aimerai': 'Je T\'ai-me-rai',
    'aujourd\'hui': 'Au-jourd\'hui',
    'jusqu\'à': 'Jus-qu\'à',
    'quelqu\'un': 'Quel-qu\'un',
    'mon cœur': 'Mon Cœur',
    'mon coeur': 'Mon Coeur'
  };

  const FR_SYLLABLE_MAP = {
    'bonjour': 'bon-jour',
    'merci': 'mer-ci',
    'beaucoup': 'beau-coup',
    'souffrance': 'souf-fran-ce',
    'pourquoi': 'pour-quoi',
    'recommences': 're-com-men-ces',
    'recommence': 're-com-men-ce',
    'musique': 'mu-si-que',
    'silence': 'si-lan-ce',
    'toujours': 'tou-jours',
    'jamais': 'ja-mais',
    'demain': 'de-main',
    'regarde': 're-gar-de',
    'oublier': 'ou-bli-er',
    'histoire': 'his-toi-re',
    'lumière': 'lu-miè-re',
    'lumiere': 'lu-miè-re',
    'sombre': 'som-bre',
    'courage': 'cou-ra-ge',
    'sentiment': 'sen-ti-ment',
    'liberté': 'li-ber-té',
    'liberte': 'li-ber-té',
    'bonheur': 'bon-heur',
    'tristesse': 'tris-tes-se',
    'ensemble': 'en-sem-ble',
    'solitude': 'so-li-tu-de',
    'visage': 'vi-sa-ge',
    'espoir': 'es-poir',
    'secret': 'se-cret',
    'mémoire': 'mé-moi-re',
    'memoire': 'mé-moi-re',
    'chanson': 'chan-son',
    'voyage': 'voy-age',
    'voyages': 'voy-ages',
    'océan': 'o-cé-an',
    'ocean': 'o-cé-an',
    'chaos': 'cha-os',
    'cœur': 'cœur',
    'coeur': 'coeur',
    'sœur': 'sœur',
    'soeur': 'soeur',
    'œuvre': 'œu-vre',
    'oeuvre': 'œu-vre',
    'œil': 'œil',
    'oeil': 'oeil'
  };

  /**
   * Pemenggalan suku kata bahasa Prancis (Syllabification en français v2.0)
   * Menggunakan private unicode mask agar ligatur asli (œ, æ) tidak pernah termutasi.
   */
  function syllabifyFrenchWord(word) {
    if (!word) return '';
    const outerMatch = word.match(/^([^a-zA-Z0-9À-ž']*?)([a-zA-Z0-9À-ž'].*?)([^a-zA-Z0-9À-ž']*?)$/);
    if (!outerMatch) return word;
    const prefix = outerMatch[1];
    let core = outerMatch[2];
    const suffix = outerMatch[3];

    if (core.length <= 3 || core.includes('-')) return word;

    // Deteksi kata elisi majemuk khusus (aujourd'hui, quelqu'un, jusqu'à)
    const lowerCore = core.toLowerCase();
    if (lowerCore === "aujourd'hui") return prefix + "au-jourd'hui" + suffix;
    if (lowerCore === "jusqu'à" || lowerCore === "jusqu'a") return prefix + "jus-qu'à" + suffix;
    if (lowerCore === "quelqu'un") return prefix + "quel-qu'un" + suffix;

    // Deteksi elisi standar (d', l', j', c', s', n', m', t', qu')
    let elisionPrefix = '';
    const elisionMatch = core.match(/^([jldcmnst]'|qu')(.+)$/i);
    if (elisionMatch) {
      elisionPrefix = elisionMatch[1];
      core = elisionMatch[2];
    }

    if (core.length <= 3) {
      return prefix + elisionPrefix + core + suffix;
    }

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (FR_SYLLABLE_MAP[lower]) {
      let res = FR_SYLLABLE_MAP[lower];
      if (isAllCap) res = res.toUpperCase();
      else if (isCap) res = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + elisionPrefix + res + suffix;
    }

    // Lindungi digraf & trigraf menggunakan Private Use Unicode (tidak merusak œ yang merupakan huruf asli)
    let s = lower
      .replace(/eau/g, '\uE000')
      .replace(/aux/g, '\uE001')
      .replace(/ou/g, '\uE002')
      .replace(/oi/g, '\uE003')
      .replace(/ai/g, '\uE004')
      .replace(/ei/g, '\uE005')
      .replace(/eu/g, '\uE006')
      .replace(/ch/g, '\uE007')
      .replace(/ph/g, '\uE008')
      .replace(/th/g, '\uE009')
      .replace(/gn/g, '\uE00A')
      .replace(/qu/g, '\uE00B')
      .replace(/gu([eéèêëiîïy])/g, '\uE00C$1');

    // Pisah konsonan ganda
    s = s.replace(/([bcdfghjklmnpqrstvwxz])\1/g, '$1-$1');

    const V = '[aeiouyàâéèêëîïôùûüœ\uE000-\uE006]';
    const C = '[^aeiouyàâéèêëîïôùûüœ\uE000-\uE006-]';

    // 1. V - C - V -> V - CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // 2. Kluster konsonan (bl, cl, fl, gl, pl, br, cr, dr, fr, gr, pr, tr, vr)
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['bl','cl','fl','gl','pl','br','cr','dr','fr','gr','pr','tr','vr'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    // 3. Tiga konsonan V - CCC - V
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v, c1, c2, c3) {
      const cluster = (c2 + c3).toLowerCase();
      if (['bl','cl','fl','gl','pl','br','cr','dr','fr','gr','pr','tr','vr'].includes(cluster)) {
        return v + c1 + '-' + c2 + c3;
      }
      return v + c1 + c2 + '-' + c3;
    });

    // Pulihkan digraf / trigraf
    s = s.replace(/\uE000/g, 'eau')
         .replace(/\uE001/g, 'aux')
         .replace(/\uE002/g, 'ou')
         .replace(/\uE003/g, 'oi')
         .replace(/\uE004/g, 'ai')
         .replace(/\uE005/g, 'ei')
         .replace(/\uE006/g, 'eu')
         .replace(/\uE007/g, 'ch')
         .replace(/\uE008/g, 'ph')
         .replace(/\uE009/g, 'th')
         .replace(/\uE00A/g, 'gn')
         .replace(/\uE00B/g, 'qu')
         .replace(/\uE00C/g, 'gu')
         .replace(/-+/g, '-');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + elisionPrefix + formatted + suffix;
  }

  /**
   * Mengonversi baris lirik Prancis menjadi Lirik Siluman (Anti-Sensor) v2.0
   */
  function cloakFrenchLine(line) {
    if (!line) return '';

    // 1. Kamus frasa populer dengan proteksi boundary
    const dictKeys = Object.keys(FR_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const reg = new RegExp('(?<=^|[^a-zA-Z0-9À-ž])' + escapedKey + '(?=$|[^a-zA-Z0-9À-ž])', 'gi');
      s = s.replace(reg, FR_POP_DICT[key]);
    }

    // 2. Tokenisasi kata
    const words = s.split(/(\s+)/);
    return words.map(function (token) {
      if (/^\s+$/.test(token) || !token) return token;
      return syllabifyFrenchWord(token);
    }).join('');
  }

  // --- 13. GERMAN ACOUSTIC ENGINE (DEUTSCH CLOAKER) ---
  const DE_POP_DICT = {
    // Rammstein & Neue Deutsche Härte
    'du hast mich': 'Du Hast Mich',
    'du hast': 'Du Hast',
    'mein herz brennt': 'Mein Herz Brennt',
    'feuer frei': 'Feu-er Frei',
    'ich will': 'Ich Will',
    'deutschland': 'Deutsch-land',
    'ohne dich': 'Oh-ne Dich',
    'sonne': 'Son-ne',
    'engel': 'En-gel',
    'ausländer': 'Aus-län-der',
    'radio': 'Ra-dio',
    'haifisch': 'Hai-fisch',
    'rosenrot': 'Ro-sen-rot',
    'mutter': 'Mut-ter',
    'amerika': 'A-me-ri-ka',
    'links 2 3 4': 'Links 2-3-4',
    'zeit': 'Zeit',

    // Nena & 80s Neue Deutsche Welle
    '99 luftballons': '99 Luft-bal-lons',
    'irgendwie irgendwo irgendwann': 'Ir-gend-wie Ir-gend-wo Ir-gend-wann',
    'nur geträumt': 'Nur Ge-träumt',
    'leuchtturm': 'Leucht-turm',

    // Schlager & Pop Hits
    'atemlos durch die nacht': 'A-tem-los Durch Die Nacht',
    'atemlos': 'A-tem-los',
    'herzbeben': 'Herz-be-ben',
    'ich liebe dich': 'Ich Lie-be Dich',
    'für immer': 'Für Im-mer',
    'fuer immer': 'Für Im-mer',
    'auf wiedersehen': 'Auf Wie-der-se-hen',
    'danke schön': 'Dan-ke Schön',
    'danke schon': 'Dan-ke Schön',
    'guten morgen': 'Gu-ten Mor-gen',
    'gute nacht': 'Gu-te Nacht',

    // Tokio Hotel, Peter Fox, Falco, Cro
    'durch den monsun': 'Durch Den Mon-sun',
    'schrei': 'Schrei',
    'rette mich': 'Ret-te Mich',
    'haus am see': 'Haus Am See',
    'alles neu': 'Al-les Neu',
    'augenbling': 'Au-gen-bling',
    'rock me amadeus': 'Rock Me A-ma-de-us',
    'der kommissar': 'Der Kom-mis-sar',
    'jeanny': 'Jean-ny',
    'einmal um die welt': 'Ein-mal Um Die Welt',
    'roller': 'Rol-ler'
  };

  const DE_SYLLABLE_MAP = {
    'sonne': 'son-ne',
    'sterne': 'ster-ne',
    'himmel': 'him-mel',
    'wasser': 'was-ser',
    'feuer': 'feu-er',
    'herzen': 'her-zen',
    'tränen': 'trä-nen',
    'traenen': 'trä-nen',
    'schatten': 'schat-ten',
    'dunkelheit': 'dun-kel-heit',
    'hoffnung': 'hoff-nung',
    'sehnsucht': 'sehn-sucht',
    'freiheit': 'frei-heit',
    'wahrheit': 'wahr-heit',
    'zusammen': 'zu-sam-men',
    'einsamkeit': 'ein-sam-keit',
    'wunderbar': 'wun-der-bar',
    'gestern': 'ges-tern',
    'morgen': 'mor-gen',
    'fenster': 'fens-ter',
    'winter': 'win-ter',
    'sommer': 'som-mer',
    'augenblick': 'au-gen-blick',
    'lebenslang': 'le-bens-lang',
    'vergessen': 'ver-ges-sen',
    'verloren': 'ver-lo-ren'
  };

  /**
   * Pemenggalan suku kata bahasa Jerman (Silbentrennung im Deutschen v2.0)
   * Menangani hiatus diftong (neu-er, blau-e) dan kluster superlatif (-ste)
   */
  function syllabifyGermanWord(word) {
    if (!word) return '';
    const match = word.match(/^([^a-zA-Z0-9À-ž']*?)([a-zA-Z0-9À-ž'].*?)([^a-zA-Z0-9À-ž']*?)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (core.length <= 3 || core.includes('-')) return word;

    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (DE_SYLLABLE_MAP[lower]) {
      let res = DE_SYLLABLE_MAP[lower];
      if (isAllCap) res = res.toUpperCase();
      else if (isCap) res = res.charAt(0).toUpperCase() + res.slice(1);
      return prefix + res + suffix;
    }

    // Lindungi digraf, trigraf, diftong khas Jerman menggunakan safe Unicode:
    let s = lower
      .replace(/sch/g, '\uE001')
      .replace(/ch/g, '\uE002')
      .replace(/ck/g, '\uE003')
      .replace(/tz/g, '\uE004')
      .replace(/pf/g, '\uE005')
      .replace(/qu/g, '\uE006')
      .replace(/ng/g, 'n-g')
      .replace(/ei/g, '\uE007')
      .replace(/ai/g, '\uE008')
      .replace(/eu/g, '\uE009')
      .replace(/äu/g, '\uE00A')
      .replace(/au/g, '\uE00B')
      .replace(/ie/g, '\uE00C');

    const V = '[aeiouyäöü\uE007-\uE00C]';
    const C = '[^aeiouyäöü\uE007-\uE00C-]';

    // Hiatus Jerman: Diftong + Vokal fleksi (neu-er, teu-er, blau-e, frei-e)
    s = s.replace(new RegExp('([\uE007-\uE00C])([aeiouäöü])', 'g'), '$1-$2');

    // Pisah konsonan ganda HANYA jika diapit vokal: kom-men, bit-te, som-mer, was-ser
    s = s.replace(new RegExp('(' + V + ')([bcdfghjklmnpqrstvwxz])\\2(?=' + V + ')', 'g'), '$1$2-$2');

    // 1. V - C - V -> V - CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // 2. Superlatif /st/ suffix (hell-ste, schnell-ste, kalt-ste)
    s = s.replace(new RegExp('(' + V + C + '+)(st[enr]*)', 'g'), '$1-$2');

    // 3. V - CC - V -> VC - CV (misal: win-ter, fens-ter, dun-kel)
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['bl','br','cl','cr','dr','fl','fr','gl','gr','kl','kr','pl','pr','tr'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    // 4. V - CCC - V -> VCC - CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v, c1, c2, c3) {
      const cluster = (c2 + c3).toLowerCase();
      if (['bl','br','cl','cr','dr','fl','fr','gl','gr','kl','kr','pl','pr','tr'].includes(cluster)) {
        return v + c1 + '-' + c2 + c3;
      }
      return v + c1 + c2 + '-' + c3;
    });

    // Pulihkan digraf, trigraf, diftong
    s = s.replace(/\uE001/g, 'sch')
         .replace(/\uE002/g, 'ch')
         .replace(/\uE003/g, 'ck')
         .replace(/\uE004/g, 'tz')
         .replace(/\uE005/g, 'pf')
         .replace(/\uE006/g, 'qu')
         .replace(/\uE007/g, 'ei')
         .replace(/\uE008/g, 'ai')
         .replace(/\uE009/g, 'eu')
         .replace(/\uE00A/g, 'äu')
         .replace(/\uE00B/g, 'au')
         .replace(/\uE00C/g, 'ie')
         .replace(/-+/g, '-');

    let formatted = s;
    if (isAllCap) formatted = s.toUpperCase();
    else if (isCap) formatted = s.charAt(0).toUpperCase() + s.slice(1);

    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris lirik Jerman menjadi Lirik Siluman (Anti-Sensor) v2.0
   */
  function cloakGermanLine(line) {
    if (!line) return '';

    // 1. Kamus frasa populer dengan proteksi boundary
    const dictKeys = Object.keys(DE_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const reg = new RegExp('(?<=^|[^a-zA-Z0-9À-ž])' + escapedKey + '(?=$|[^a-zA-Z0-9À-ž])', 'gi');
      s = s.replace(reg, DE_POP_DICT[key]);
    }

    // 2. Tokenisasi kata
    const words = s.split(/(\s+)/);
    return words.map(function (token) {
      if (/^\s+$/.test(token) || !token) return token;
      return syllabifyGermanWord(token);
    }).join('');
  }

  // --- 14. FILIPINO / TAGALOG ACOUSTIC ENGINE (OPM CLOAKER v2.0) ---
  const TL_POP_DICT = {
    'ang huling el bimbo': 'Ang Hu-ling El Bim-bo',
    'raining in manila': 'Rai-ning In Ma-ni-la',
    'kathang isip': 'Ka-thang I-sip',
    'sa ilalim ng puting ilaw': 'Sa I-la-lim Ng Pu-ting I-law',
    'mahal kita': 'Ma-hal Ki-ta',
    'iniibig kita': 'I-ni-i-big Ki-ta',
    'ikaw at ako': 'I-kaw At A-ko',
    'walang hanggan': 'Wa-lang Hang-gan',
    'hanggang sa huli': 'Hang-gang Sa Hu-li',
    'maraming salamat': 'Ma-ra-ming Sa-la-mat',
    'bawat piyesa': 'Ba-wat Pi-ye-sa',
    // OPM Classics & Modern Hits
    'kung di rin lang ikaw': 'Kung Di Rin Lang I-kaw',
    'buwan': 'Bu-wan',
    'nobela': 'No-be-la',
    'magbalik': 'Mag-ba-lik',
    'tadhana': 'Tad-ha-na',
    'binibini': 'Bi-ni-bi-ni',
    'pasilyo': 'Pa-sil-yo',
    'leaves': 'Leaves',
    'araw-araw': 'A-raw-a-raw',
    'dahan-dahan': 'Da-han-da-han',
    'gabi-gabi': 'Ga-bi-ga-bi',
    'paulit-ulit': 'Pa-u-lit-u-lit',
    'sama-sama': 'Sa-ma-sa-ma',
    'dilaw': 'Di-law',
    'uhaw': 'U-haw',
    'pantropiko': 'Pan-tro-pi-ko',
    'salamin, salamin': 'Sa-la-min, Sa-la-min',
    'ere': 'E-re'
  };

  const TL_SYLLABLE_MAP = {
    'pasilyo': 'pa-sil-yo',
    'binibini': 'bi-ni-bi-ni',
    'tadhana': 'tad-ha-na',
    'magbalik': 'mag-ba-lik',
    'kundiman': 'kun-di-man',
    'panalangin': 'pa-na-la-ngin',
    'pagibig': 'pag-i-big',
    'pag-ibig': 'pag-i-big',
    'pangako': 'pa-nga-ko',
    'hanggang': 'hang-gang',
    'kailan': 'ka-i-lan',
    'paalam': 'pa-a-lam',
    'tumingin': 'tu-mi-ngin',
    'ngiti': 'ngi-ti',
    'ngayon': 'nga-yon',
    'liwanag': 'li-wa-nag',
    'dilim': 'di-lim',
    'umaga': 'u-ma-ga',
    'gabi': 'ga-bi',
    'hangin': 'ha-ngin',
    'ulan': 'u-lan',
    'mata': 'ma-ta',
    'kamay': 'ka-may',
    'yakap': 'ya-kap',
    'halik': 'ha-lik',
    'sandali': 'san-da-li',
    'pangarap': 'pa-nga-rap',
    'sigaw': 'si-gaw',
    'bulong': 'bu-long',
    'luha': 'lu-ha',
    'sinta': 'sin-ta',
    'giliw': 'gi-liw',
    'irog': 'i-rog',
    'tayo': 'ta-yo',
    'kayo': 'kay-o',
    'sila': 'si-la',
    'bata': 'ba-ta',
    'kaibigan': 'ka-i-bi-gan'
  };

  /**
   * Helper pemenggal satu segmen kata Tagalog
   */
  function syllabifySingleTagalogSegment(core) {
    if (core.length <= 3) return core;
    const isAllCap = core === core.toUpperCase() && core.length > 1;
    const isCap = core[0] === core[0].toUpperCase();
    const lower = core.toLowerCase();

    if (TL_SYLLABLE_MAP[lower]) {
      let res = TL_SYLLABLE_MAP[lower];
      if (isAllCap) res = res.toUpperCase();
      else if (isCap) res = res.charAt(0).toUpperCase() + res.slice(1);
      return res;
    }

    let s = lower
      .replace(/ee/g, '\uE001')
      .replace(/ngg/g, 'ŋ-g')
      .replace(/ng/g, 'ŋ');

    s = s.replace(/([bcdfghjklmnpqrstvwxz])\\1/g, '$1-$1');

    const V = '[aeiou\uE001]';
    const C = '[^aeiou\uE001-]';

    // 1. Hiatus Tagalog
    s = s.replace(/([aeiou])([aeiou])/g, '$1-$2');
    s = s.replace(/([aeiou])([aeiou])/g, '$1-$2');

    // 2. V - C - V -> V - CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(?=' + V + ')', 'g'), '$1-$2');

    // 3. V - CC - V -> VC - CV
    s = s.replace(new RegExp('(' + V + ')(' + C + ')(' + C + ')(?=' + V + ')', 'g'), function (m, v1, c1, c2) {
      const cluster = (c1 + c2).toLowerCase();
      if (['bl','br','kl','kr','pl','pr','tr','dr','gr'].includes(cluster)) {
        return v1 + '-' + c1 + c2;
      }
      return v1 + c1 + '-' + c2;
    });

    s = s.replace(/ŋ/g, 'ng').replace(/\uE001/g, 'ee').replace(/-+/g, '-');

    if (isAllCap) return s.toUpperCase();
    if (isCap) return s.charAt(0).toUpperCase() + s.slice(1);
    return s;
  }

  /**
   * Pemenggalan suku kata bahasa Filipino / Tagalog (Austronesian Phonotactics v2.0)
   * Menangani reduplikasi kata bertanda hubung (araw-araw -> a-raw-a-raw)
   */
  function syllabifyFilipinoWord(word) {
    if (!word) return '';
    const match = word.match(/^([^a-zA-Z0-9À-ž']*?)([a-zA-Z0-9À-ž'].*?)([^a-zA-Z0-9À-ž']*?)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;

    if (core.length <= 3) return word;

    // Jika kata majemuk / reduplikasi (araw-araw, dahan-dahan, gabi-gabi, pag-ibig)
    if (core.includes('-')) {
      const parts = core.split('-');
      const syllabifiedParts = parts.map(function (part) {
        return syllabifySingleTagalogSegment(part);
      });
      return prefix + syllabifiedParts.join('-') + suffix;
    }

    const formatted = syllabifySingleTagalogSegment(core);
    return prefix + formatted + suffix;
  }

  /**
   * Mengonversi baris lirik Filipino / Tagalog menjadi Lirik Siluman (Anti-Sensor) v2.0
   */
  function cloakFilipinoLine(line) {
    if (!line) return '';

    // 1. Kamus frasa OPM populer dengan proteksi boundary
    const dictKeys = Object.keys(TL_POP_DICT).sort((a, b) => b.length - a.length);
    let s = line;
    for (let k = 0; k < dictKeys.length; k++) {
      const key = dictKeys[k];
      const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const reg = new RegExp('(?<=^|[^a-zA-Z0-9À-ž])' + escapedKey + '(?=$|[^a-zA-Z0-9À-ž])', 'gi');
      s = s.replace(reg, TL_POP_DICT[key]);
    }

    // 2. Tokenisasi kata
    const words = s.split(/(\s+)/);
    return words.map(function (token) {
      if (/^\s+$/.test(token) || !token) return token;
      return syllabifyFilipinoWord(token);
    }).join('');
  }

  /**
   * Pembersih Metadata & Scraper Junk (Genius, Musixmatch, AZLyrics, Spotify)
   * Membersihkan blok rekomendasi seperti "You might also like", nama artis sponsor, "Embed", dll.
   * yang sering memicu copyright filter Suno karena menyebut nama artis lain (misal Taylor Swift, Drake, Kendrick Lamar).
   */
  function stripLyricsScraperJunk(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const cleaned = [];
    let skippingRecommendations = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Deteksi awal blok rekomendasi Genius
      if (/^you might also like/i.test(trimmed) || /see .* live/i.test(trimmed)) {
        skippingRecommendations = true;
        continue;
      }

      // Jika sedang skipping rekomendasi, berhenti skipping saat bertemu tag struktur lagu baru [Verse], [Chorus], dll.
      if (skippingRecommendations) {
        if (/^\[.*\]$/.test(trimmed)) {
          skippingRecommendations = false;
        } else {
          continue;
        }
      }

      // Deteksi baris metadata tunggal Genius / Scraper
      if (/^\d+\s*contributors?$/i.test(trimmed) ||
          /^[0-9]+embed$/i.test(trimmed) ||
          /^embed$/i.test(trimmed) ||
          /^lyrics (licensed|provided) by/i.test(trimmed)) {
        continue;
      }

      cleaned.push(line);
    }

    return cleaned.join('\n');
  }

  /**
   * Main Cloaking Function
   */
  function cloakLyrics(rawLyrics, lang) {
    if (!rawLyrics || !rawLyrics.trim()) return '';
    lang = lang || 'id';

    // 0. Auto-strip scraper metadata junk (Genius recommendations, etc.)
    const cleanLyrics = stripLyricsScraperJunk(rawLyrics);
    const lines = cleanLyrics.split('\n');

    const cloakedLines = lines.map(function (line) {
      const trimmed = line.trim();

      // 1. Preserve structure tags verbatim: [Verse 1], [Chorus], [Bridge], [主歌], [副歌], etc.
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('(') && trimmed.endsWith(')'))) {
        return line;
      }

      // 2. Preserve blank lines
      if (!trimmed) return line;

      // 3. Mandarin Chinese handling (Auto Hanzi to Hyphenated Pinyin)
      if (lang === 'zh') {
        return cloakMandarinLine(line);
      }

      // 4. Japanese handling (Kanji/Kana/Romaji to Hyphenated Mora-Syllables)
      if (lang === 'ja') {
        return cloakJapaneseLine(line);
      }

      // 5. Korean handling (Hangul/Romaja to Hyphenated Syllables)
      if (lang === 'ko') {
        return cloakKoreanLine(line);
      }

      // 6. Arabic handling (Arabic Script / Arabizi to Hyphenated Phonetics)
      if (lang === 'ar') {
        return cloakArabicLine(line);
      }

      // 7. Hindi & Indian handling (Devanagari, Telugu, Hinglish)
      if (lang === 'hi' || lang === 'in') {
        return cloakHindiLine(line);
      }

      // 8. Vietnamese (Tiếng Việt / V-Pop) handling
      if (lang === 'vi' || lang === 'vn') {
        return cloakVietnameseLine(line);
      }

      // 9. Thai (T-Pop / ภาษาไทย) handling
      if (lang === 'th') {
        return cloakThaiLine(line);
      }

      // 10. Russian (Cyrillic / Русский) handling
      if (lang === 'ru') {
        return cloakRussianLine(line);
      }

      // 11. French (Français / Chanson) handling
      if (lang === 'fr') {
        return cloakFrenchLine(line);
      }

      // 12. German (Deutsch / Neue Deutsche Härte) handling
      if (lang === 'de') {
        return cloakGermanLine(line);
      }

      // 13. Filipino / Tagalog (OPM) handling
      if (lang === 'tl' || lang === 'fil') {
        return cloakFilipinoLine(line);
      }

      // 14. Spanish (ES) syllabification
      if (lang === 'es') {
        const words = line.split(/(\s+)/);
        return words.map(function (token) {
          if (/^\s+$/.test(token) || !token) return token;
          return syllabifySpanishWord(token);
        }).join('');
      }

      // 15. Portuguese (PT) syllabification
      if (lang === 'pt') {
        const words = line.split(/(\s+)/);
        return words.map(function (token) {
          if (/^\s+$/.test(token) || !token) return token;
          return syllabifyPortugueseWord(token);
        }).join('');
      }

      // 16. Western / Latin syllabification (ID / JV / EN)
      const syllabifier = lang === 'en' ? syllabifyEnglishWord : syllabifyIndonesianWord;
      const words = line.split(/(\s+)/);
      return words.map(function (token) {
        if (/^\s+$/.test(token) || !token) return token;
        return syllabifier(token);
      }).join('');
    });

    return cloakedLines.join('\n');
  }

  return {
    cloakLyrics: cloakLyrics,
    stripLyricsScraperJunk: stripLyricsScraperJunk,
    syllabifyIndonesianWord: syllabifyIndonesianWord,
    syllabifyEnglishWord: syllabifyEnglishWord,
    syllabifySpanishWord: syllabifySpanishWord,
    syllabifyPortugueseWord: syllabifyPortugueseWord,
    cloakMandarinLine: cloakMandarinLine,
    cloakJapaneseLine: cloakJapaneseLine,
    syllabifyJapaneseRomaji: syllabifyJapaneseRomaji,
    cloakKoreanLine: cloakKoreanLine,
    syllabifyKoreanRomaja: syllabifyKoreanRomaja,
    cloakArabicLine: cloakArabicLine,
    syllabifyArabicLatin: syllabifyArabicLatin,
    cloakHindiLine: cloakHindiLine,
    transliterateIndicToken: transliterateIndicToken,
    syllabifyHindiLatin: syllabifyHindiLatin,
    cloakVietnameseLine: cloakVietnameseLine,
    cloakThaiLine: cloakThaiLine,
    transliterateThaiWord: transliterateThaiWord,
    syllabifyThaiLatin: syllabifyThaiLatin,
    cloakRussianLine: cloakRussianLine,
    transliterateRussianWord: transliterateRussianWord,
    syllabifyRussianLatin: syllabifyRussianLatin,
    cloakFrenchLine: cloakFrenchLine,
    syllabifyFrenchWord: syllabifyFrenchWord,
    cloakGermanLine: cloakGermanLine,
    syllabifyGermanWord: syllabifyGermanWord,
    cloakFilipinoLine: cloakFilipinoLine,
    syllabifyFilipinoWord: syllabifyFilipinoWord
  };
});
