# ReSu_ Master Audio Engine

Aplikasi web berbasis Node.js untuk memproses file audio. ReSu_ menyediakan preset pemrosesan dan mastering, konversi format, pengelolaan metadata audio, serta alat inspeksi dan penghapusan metadata tertentu.

## Fitur

- **Acoustic Cloaker** — memproses audio menggunakan preset mastering dan mengekspor ke MP3, WAV, FLAC, atau M4A/AAC.
- **C2PA Stripper** — memeriksa dan menghapus frame metadata tertentu dari file MP3.
- **CoSu Processor** — membuat preview atau mengekspor bagian audio maupun audio penuh menggunakan preset pemrosesan.
- **Custom Lab** — mengatur parameter pemrosesan khusus dan membuat preview.
- **Metadata dan cover art** — mengatur tag judul, artis, album, tahun, copyright, dan cover art.

> Gunakan hanya pada audio yang Anda miliki atau berwenang untuk modifikasi. Penghapusan metadata dapat menghilangkan informasi asal-usul atau atribusi; hasil pemrosesan tidak boleh diklaim sebagai file asli yang tidak dimodifikasi.

## Persyaratan

- Node.js dan npm
- FFmpeg tersedia di `PATH` (serta `ffprobe` untuk pembacaan metadata CoSu)

Pastikan instalasi FFmpeg dapat ditemukan sebelum menjalankan proses audio:

```bash
ffmpeg -version
ffprobe -version
```

## Instalasi dan menjalankan

```bash
npm install
npm start
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Port dapat diubah dengan variabel lingkungan `PORT`.

Untuk pengembangan, `npm run dev` menjalankan server yang sama. Pada Windows, `start.bat` juga dapat digunakan untuk membuka browser dan memulai server.

## Cara menggunakan

1. Pilih tab **Acoustic Cloaker**, **C2PA Stripper**, **CoSu Processor**, atau **Custom Lab**.
2. Unggah file audio. Format yang diterima adalah MP3, WAV, FLAC, M4A, OGG, dan AAC; batas ukuran unggahan adalah 500 MB.
3. Pilih preset atau format keluaran, dan isi metadata atau parameter yang tersedia.
4. Jalankan pemrosesan, lalu unduh hasilnya dari tautan yang ditampilkan aplikasi.

File unggahan dan hasil disimpan sementara di direktori sistem sementara. Server secara berkala menghapus file yang lebih lama dari 30 menit.

## Endpoint API

Semua endpoint tersedia di server lokal pada `http://localhost:3000`.

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/presets` | Daftar preset pemrosesan |
| `GET` | `/api/formats` | Daftar format keluaran |
| `POST` | `/api/process` | Pemrosesan dan mastering audio; unggah `audio`, opsional `coverArt` |
| `POST` | `/api/strip-c2pa` | Membersihkan metadata/frame tertentu; unggah `audio` |
| `POST` | `/api/inspect-frames` | Memeriksa frame dan cover art tanpa mengubah file; unggah `audio` |
| `POST` | `/api/cosu-export` | Ekspor audio CoSu; unggah `audio` |
| `POST` | `/api/cosu-preview` | Membuat preview CoSu; unggah `audio` |
| `POST` | `/api/lab-preview` | Membuat preview dari parameter Custom Lab; unggah `audio` |
| `POST` | `/api/metadata` | Membaca metadata audio; unggah `audio` |

Endpoint unggah menerima `multipart/form-data`. Berkas hasil dapat diunduh melalui URL `/downloads/...` yang dikembalikan endpoint pemrosesan.

## Struktur proyek

| Berkas | Fungsi |
|---|---|
| `server.js` | Server Express, endpoint API, dan penyajian antarmuka web |
| `index.html`, `style.css`, `app.js` | Antarmuka pengguna |
| `index.js` | Pipeline pemrosesan audio |
| `acoustic-cloaker.js` | Preset mastering dan encoding melalui FFmpeg |
| `c2pa-stripper.js` | Pemeriksaan dan pengelolaan metadata/frame MP3 |
| `cosu-processor.js` | Pemrosesan, preview, dan ekspor CoSu |
| `ffmpeg-kit-bridge.js` | Jembatan eksekusi FFmpeg untuk lingkungan yang mendukung FFmpegKit |
| `text_helper.js` | Helper teks untuk antarmuka |
| `test_engine.js`, `test_http.js` | Skrip pengujian/manual |

## Pengembangan dan pengujian

Skrip npm yang disediakan:

```bash
npm start
npm run dev
```

`test_engine.js` menjalankan pemeriksaan manual pipeline engine dan membutuhkan FFmpeg. `test_http.js` mengirim permintaan ke server yang sedang berjalan pada port 3000 dan juga membutuhkan FFmpeg.
