# Guess The Song

Game tebak lagu ala [Songly](https://quizly.gg/songly) / Heardle.
Dengarkan potongan pendek sebuah lagu, tebak judulnya. Salah tebak atau melewati akan
membuka potongan yang lebih panjang.

> Nama folder dan berkas peluncurnya masih `tebak-lagu` / `Tebak Lagu.*` — dibiarkan
> supaya entri autostart Windows tidak perlu dipasang ulang. Antarmuka gamenya sendiri
> berbahasa Inggris.

## Menjalankan

Servernya **nyala sendiri tiap kali kamu login Windows**, tanpa jendela apa pun. Tinggal
buka <http://localhost:8080> kapan saja.

Kalau ingin menyalakan sekarang juga sekaligus membuka browser, klik dua kali
**`Main Tebak Lagu.bat`**. Aman diklik berkali-kali — kalau servernya sudah jalan, dia
tidak menyalakan yang kedua.

Jangan buka `index.html` langsung lewat klik dua kali: sebagian browser memblokir
permintaan jaringan dari halaman `file://`, jadi lagunya gagal dimuat.

## Main di HP

Gamenya sudah online dan tidak butuh laptop sama sekali:

**<https://sayurkaget.github.io/guess-the-song/>**

Buka di HP, lalu tambahkan ke layar depan — **Android (Chrome)**: menu titik tiga →
*Add to Home screen*; **iPhone (Safari)**: tombol Share → *Add to Home Screen*. Ikonnya
muncul di layar depan dan terbuka layar penuh tanpa bilah alamat.

Sumbernya ada di repo <https://github.com/sayurkaget/guess-the-song>. Untuk memperbarui
versi online setelah mengubah game di folder ini:

```bash
robocopy . ..\guess-the-song index.html styles.css app.js songs.js app.webmanifest sw.js icon-180.png icon-192.png icon-512.png
```

lalu di folder `guess-the-song`: `git add -A`, `git commit -m "..."`, `git push`.
GitHub Pages membangun ulang sendiri dalam ~1 menit.

### Lewat jaringan lokal (saat laptop menyala)

Berguna untuk mencoba perubahan sebelum diunggah. Selama HP dan laptopnya di
**Wi-Fi yang sama**, buka alamat ini di browser HP:

```
http://192.168.1.9:8080
```

Alamat itu selalu tercatat di baris kedua `server.log` tiap kali server menyala — kalau
IP laptopmu berubah (pindah Wi-Fi, atau router memberi IP baru), lihat di situ.

Supaya terasa seperti aplikasi, tambahkan ke layar depan:

- **Android (Chrome)** — menu titik tiga → *Add to Home screen*
- **iPhone (Safari)** — tombol Share → *Add to Home Screen*

Setelah itu ikonnya muncul di layar depan dan terbuka layar penuh tanpa bilah alamat.

Kalau HP tidak bisa membuka alamatnya, biasanya salah satu dari ini:

- laptop dan HP beda jaringan (misal HP pakai data seluler, atau Wi-Fi tamu yang
  memisahkan perangkat)
- laptopnya sedang tidur — servernya ikut berhenti
- Windows Firewall memblokir. Jalankan PowerShell **sebagai Administrator** lalu:

  ```bash
  netsh advfirewall firewall add rule name="Guess The Song" dir=in action=allow protocol=TCP localport=8080
  ```

### Kalau kena ERR_CONNECTION_REFUSED

Servernya belum jalan. Klik dua kali `Main Tebak Lagu.bat`. Kalau tetap gagal, buka
`server.log` di folder ini — alasannya tercatat di situ.

### Mematikan autostart

Tekan `Win+R`, ketik `shell:startup`, lalu hapus **`Tebak Lagu.vbs`**.

### Menghentikan server yang sedang jalan

```bash
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*-File *serve.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
```

## Cara main

Setiap kali dibuka, yang muncul lebih dulu adalah **layar pilih mode**: tentukan genre dan era, baru tekan **Start**. Tidak ada lagu yang diambil sebelum tombol itu
ditekan, jadi mengubah pilihan tidak menukar lagu di tengah sesi.

Ketik judul di kolom pencarian lalu **klik salah satu saran** — memilih langsung mengirim
tebakan, tidak ada tombol terpisah. Tiap saran menampilkan sampul albumnya.

Saat bermain, tombol **Change mode** mengembalikanmu ke layar pilihan. Sesi yang sedang
berjalan tidak hilang: tombolnya berubah jadi **Continue**.

**Tiap kombinasi filter punya sesinya sendiri.** Ganti dari pop/2010s ke rock/before-2000
dan kamu mulai sesi baru dari tahap 1 — tombolnya kembali jadi **Start**. Ganti balik ke
pop/2010s dan sesi yang tadi masih di sana, lengkap dengan tahap yang sudah lewat. Tanpa
pemisahan ini, tahap yang sudah tercatat tetap memakai lagu lamanya, jadi filter
rock/before-2000 bisa memunculkan lagu pop 2010-an.

Sesinya **hanya hidup di memori** — muat ulang halaman selalu memulai sesi baru. Ini
disengaja. Yang bertahan lintas-refresh hanya statistik dan pilihan filter.

Setelah tiap tahap, layar hasil memenuhi layar: nama tahap membayang raksasa di
belakang, sampul album, judul besar, dan badge **GUESSED IN 0.1S!** atau **LOST!**.
Tombol **Challenge your friend** menyalin hasil tahap dan tautan ke satu rekaman yang
sama (ID Apple Music, tanpa judul lagu di URL). Penerima menekan **Accept challenge**
untuk memainkan satu ronde dengan lima kesempatan yang sama. Hasil akhir membandingkan
jumlah tebakan dengan penantang; ronde ini tidak masuk statistik lima tahap.
Jika rekaman tidak tersedia, pemain mendapat pesan kegagalan dan tombol coba lagi,
bukan lagu pengganti. Tautan bersifat kasual: hasil penantang tidak diverifikasi server.

| Aksi | Pintasan |
|---|---|
| Start (di layar pilih mode) | `Enter` |
| Putar / hentikan potongan | `Space` |
| Lewati | `Tab` |
| Pilih saran | `↑` `↓` lalu `Enter` |
| Tutup jendela | `Esc` |

## Lima tahap per sesi

Kesulitan bukan pilihan, melainkan **urutan**. Satu sesi berisi lima tahap yang makin
susah, satu lagu tiap tahap:

Tangga waktunya **sama di semua tahap** — 5 tebakan, potongan yang terbuka:

```
0.1s → 0.5s → 2s → 8s → 15s
```

Yang naik antar-tahap cuma keniche-an lagunya:

| Tahap | Tier lagu |
|---|---|
| Easy | 1 |
| Medium | 1–2 |
| Hard | 2–3 |
| Expert | 3–4 |
| Impossible | 4–5 |

Tier 1 lagu sejuta umat, tier 5 lagu yang jarang diputar.

Tiap tahap juga punya **warna aksennya sendiri**, dan **seluruh halaman** ikut warna itu —
bukan cuma tombol play, gelombang, angka detik, dan fokus pencarian, tapi juga latar aurora
dan layar reveal (cincin sampul, tombol Next, stempel menang): Easy hijau, Medium emas,
Hard oranye, Expert koral, Impossible ungu. Warnanya disetel lewat keluarga token `--acc`
(`--acc-l` puncak gradien, `--acc-d` dasar, `--acc-rgb` untuk cahaya) yang ditimpa per tahap
di `body[data-diff="…"]`. Diletakkan di `<body>`, bukan `#game`, justru karena latar dan
modal adalah saudara dari `#game` — kalau atributnya di `#game` keduanya tak pernah kebagian
warna. JS menyetelnya di `UI.game()`, lalu **membersihkannya** di `UI.lobby()` dan
`UI.runResult()`: lobi belum menjalankan satu kesulitan pun, dan rangkuman sesi merangkum
kelimanya sekaligus — keduanya kembali ke hijau default. Yang tetap merah dalam segala warna
adalah penanda kalah (stempel "Lost!", verdict), supaya kalah tetap terbaca sebagai kalah.

Yang diputar selalu **intro lagunya**, dari detik nol. Pemutarannya **menyambung**: kalau
kamu sudah mendengar 0,1 detik lalu melewati, tekan play akan memutar dari 0,1 ke 0,5 —
bukan mengulang dari awal. Tekan sekali lagi kalau mau mengulang dari nol.

**Gagal di satu tahap tidak menghentikan sesi.** Kamu tetap lanjut sampai Impossible, dan
nilai akhirnya berapa tahap yang kena, dari 5. Satu lagu tidak muncul dua kali dalam sesi
yang sama.

Begitu satu tahap selesai — menang maupun kalah — lagunya langsung diputar lebih panjang.
Menang memicu ledakan confetti hijau; kalah memicu serpihan merah yang jatuh dan kartunya
bergetar sebentar.

## Menyaring katalog

Mode utama hanya memakai lagu Western; pilihan region sudah dihapus. Custom Game
bisa mencari semua artis yang tersedia di Apple Music. Preferensi region lama diabaikan;
statistik Western tetap tersedia.

| Filter | Pilihan |
|---|---|
| Genre | Pop · Rock · Hip-hop · R&B/Soul · Electronic · Indie · Other |
| Era | Before 2000 · 2000s · 2010s · 2020s |

Tiap kombinasi punya statistiknya sendiri. Baris kecil di bawah filter
memberitahu berapa lagu yang cocok, dan memperingatkan kalau filternya terlalu sempit.
Pilihan filter **tidak pernah dilonggarkan diam-diam** — kalau lagu yang cocok kurang,
yang dilebarkan hanya rentang tier tahap itu.

Tiap sesi mengambil lima lagu acak, dan bisa diulang terus lewat **Play again**.
Setiap sesi yang tuntas masuk ke statistik kombinasi filter yang sedang dipakai.

## Isi folder

| Berkas | Isi |
|---|---|
| `Main Tebak Lagu.bat` | Klik dua kali untuk main |
| `Tebak Lagu.vbs` | Menyalakan server tanpa jendela; salinannya ada di folder Startup |
| `server.log` | Catatan server — dibaca kalau ada yang aneh |
| `index.html` | Markup |
| `styles.css` | Tampilan; seluruh halaman mengikuti warna kesulitan lewat `body[data-diff]` |
| `app.js` | Logika permainan, audio, pencarian, statistik |
| `songs.js` | Katalog 13,974 lagu Western |
| `app.webmanifest`, `icon-*.png` | Supaya bisa dipasang ke layar depan HP |
| `sw.js` | Service worker: game jalan luring, dan versi terbaru selalu menang saat online |
| `serve.ps1` | Server statis mini |
| `tools/` | Perkakas perawatan katalog (lihat di bawah) |

### Isi `tools/`

| Berkas | Gunanya |
|---|---|
| `artists.txt`, `artists2.txt` | Daftar artis yang wajib ada di katalog |
| `build-artists.sh`, `build-artists2.sh` | Panen lagu terpopuler tiap artis |
| `parse-artist.awk` | Pengurai balasan iTunes untuk pemanen artis |
| `combine.awk` | Gabungkan hasil panen dengan katalog, buang duplikat |
| `enrich.sh`, `parse.awk` | Panen genre/tahun/sampul untuk lagu yang ditambah manual |
| `merge.awk` | Tempelkan hasil `enrich.sh` ke `songs.js` |
| `audit.sh` | Periksa tiap lagu benar-benar ada di iTunes |
| `lookup.sh` | Lihat judul asli lagu seorang artis di iTunes |

## Menambah artis (cara utama)

Hampir seluruh katalog dibangun begini, dan ini jalan tercepat menambah banyak lagu
sekaligus. Tambahkan baris ke `tools/artists2.txt`:

```
171|Nama Artis|gl
```

Angka di depan itu peringkat populer — makin kecil, makin banyak lagunya dianggap
"sejuta umat" (tier rendah). `gl` untuk barat, `as` untuk Asia. Lalu:

```bash
bash tools/build-artists2.sh
```

Satu permintaan ke iTunes per artis mengembalikan 8 lagu terpopulernya **lengkap dengan
genre, tahun, dan sampul**, urut sesuai popularitas — jadi tidak perlu mengetik judul
satu per satu. Sekitar 1,5 detik per artis. Gabungkan:

```bash
cat tools/artist-songs.txt tools/artist-songs2.txt > /tmp/semua.txt
awk -f tools/combine.awk /tmp/semua.txt songs.js > baru.js
```

`combine.awk` membuang duplikat (judul+artis tanpa tanda baca) dan memenangkan hasil
panen, karena judulnya persis seperti di iTunes sehingga dijamin bisa diputar. Setelah
itu rapikan pembungkusnya: baris terakhir tanpa koma, lalu `];` di akhir.

Cek hasilnya sebelum dipakai:

```bash
awk '/^[ \t]*\["/{n=gsub(/"/,"\"");if(n!=10)print NR": kutip="n}' songs.js
```

Tidak ada keluaran = aman. Tiap baris harus punya tepat 10 tanda kutip (judul, artis,
region, genre, sampul — masing-masing sepasang). Judul beraksen atau ber-apostrof aman; yang
berbahaya adalah judul dengan kutip di dalamnya — `parse-artist.awk` sudah menolaknya,
karena satu saja bisa merusak sintaks seluruh berkas.

## Menambah satu-dua lagu manual

Tambahkan satu baris di `songs.js` — cukup empat kolom pertama:

```js
["Song Title", "Artist Name", 3, "gl"],
```

`tier` 1 (paling terkenal) sampai 5 (paling niche); `region` harus `"gl"` (Western). Genre, tahun, dan sampul tidak perlu diisi manual:

```bash
bash tools/enrich.sh
awk -f tools/merge.awk tools/enrich.tsv songs.js > baru.js && mv baru.js songs.js
```

`enrich.sh` memanen genre, tahun rilis, dan URL sampul dari iTunes. Sifatnya menambah —
lagu yang sudah punya data dilewati, jadi menambah beberapa lagu tidak memanen ulang
semuanya. Kecepatannya ~1,2 detik per lagu.

Setelah itu periksa hasilnya. Lagu yang genre-nya `?` berarti tidak ketemu di iTunes —
sebaiknya diganti, karena saat dimainkan ia akan jatuh ke lagu lain.

## Catatan teknis

Audio memakai potongan pratinjau 30 detik dari **iTunes Search API** (toko US) — publik,
tanpa API key, dan mengizinkan CORS. Tiap lagu di-*resolve* sekali lalu di-cache di
`localStorage` selama 7 hari.

Pemilihan hasil sengaja menghindari versi live, remix, akustik, dan karaoke, serta tidak
menghukum artis dengan embel-embel `feat.` — tanpa itu, "Havana (Live)" bisa menang skor
dari versi studionya. Pencocokan mengabaikan tanda baca dan aksen: "Cariño" = "Carino",
"Don't" = "Dont", "Dat $tick" = "dat stick", dan "JAŸ-Z" = "Jay-Z".

Titik awal potongan di-*seed* dari judul lagu, jadi konsisten tiap kali dimuat ulang, dan
selalu lewat dari fade-in di awal pratinjau.

Kalau aturan pencocokan diubah, naikkan versi kunci cache di `app.js`
(`tl:trk3:` → `tl:trk4:`) supaya hasil lama tidak nyangkut.

Semua kemajuan disimpan di `localStorage` — tidak ada server, tidak ada akun.

Komentar di dalam kode sengaja dibiarkan berbahasa Indonesia; hanya teks yang dilihat
pemain yang berbahasa Inggris.

## Pengujian tantangan

Jalankan `node --test tests/challenge.test.cjs` untuk memeriksa tautan, rekaman yang
dipilih, hasil perbandingan, pembatalan, dan pemisahan statistik.

## Daily Challenge

Daily memakai pool Western tetap di `daily-pool-v1.js`: jangan ubah isinya saat
memperbarui katalog mode bebas. Satu lagu dipilih deterministik per tanggal Daily. Reset pukul 07.00 pagi mengikuti zona waktu perangkat
pemain (termasuk perubahan daylight saving). Sebelum pukul 07.00, tanggal Daily
masih tanggal sebelumnya. Tanggal Daily yang sama memakai satu lagu yang sama, walau
pergantian hari terjadi pada waktu berbeda antarzona. Filter genre,
era, dan riwayat lagu mode bebas tidak memengaruhi Daily. Jika audio tidak tersedia,
pemain bisa mencoba lagi; lagunya tidak diganti secara acak.

Progres dan hasil Daily disimpan di browser ini. Progres lagu yang sama dari versi
lima tahap dipulihkan otomatis, dan riwayat streak tetap dipertahankan. Selesaikan satu ronde (menang atau kalah) untuk mencatat satu hari streak. Hasil yang selesai tidak dapat diulang pada
hari yang sama lewat UI. Streak terputus setelah melewatkan satu hari; best tetap ada.
Jika sesi melewati waktu reset, penyelesaiannya tetap untuk tanggal sesi semula.
Menghapus data browser menghapus progres dan streak; tidak ada sinkronisasi akun.

Copy result membagikan tanggal, skor, kotak tebakan, streak, dan link `#daily`, tanpa
judul lagu. Link membuka tantangan hari yang sedang berlaku, bukan arsip tanggal lama.
Uji semua mode dengan `node --test tests/*.test.cjs`.

## Feedback

Tombol Feedback di footer membuka form pribadi: kategori, pesan, email opsional, dan
detail game opsional yang dapat diedit. Judul lagu hanya diisi setelah ronde selesai.
Pengiriman melalui Netlify Forms (`player-feedback`) dan memakai honeypot spam.
Aktifkan **Forms → Enable form detection** di dashboard Netlify, lalu redeploy jika
form belum terdeteksi. Lihat kiriman di **Forms → player-feedback**, termasuk folder
spam bila perlu. Tidak ada login pemain, komentar publik, atau pengiriman email otomatis.
Kegagalan pengiriman mempertahankan isi form agar bisa dicoba lagi.

## Jawaban lagu duplikat

Jawaban dibandingkan memakai judul dan kredit artis katalog serta rekaman iTunes,
bukan slug saja. Pilihan Rihanna / Calvin Harris untuk We Found Love dan Silk Sonic /
Bruno Mars untuk Leave the Door Open sama-sama diterima. Kredit featuring dan metadata
remaster diabaikan pada judul; live, remix, akustik, dan lagu lain berjudul sama tetap
dibedakan. Tidak ada permintaan jaringan tambahan saat menjawab.

## Statistik aktivitas pemilik (menunggu konfigurasi)

`analytics.js` belum mengirim data atau memuat Google Analytics selama meta
`ga-measurement-id` di `index.html` kosong. Isi dengan Measurement ID GA4 milik pemilik
(`G-...`) setelah membuat Web data stream untuk `https://namethetrack.netlify.app`.
Tracking hanya berjalan di domain produksi. Saat menyiapkan stream, nonaktifkan
Enhanced Measurement agar form feedback dan perubahan hash tidak dilacak otomatis.

Event yang tersedia di laporan Events / Realtime Google Analytics:
- `game_start`: lagu pertama berhasil dimuat dalam sesi baru; resume tidak dihitung lagi.
- `custom_start`: sesi artis kustom berhasil dimulai (bagian dari game_start).
- `daily_complete`: Daily selesai; parameter result won/lost dan attempts 1–5.
- `challenge_copy`: tautan tantangan berhasil disalin, bukan bukti pesan terkirim.
- `result_copy`: hasil sesi/Daily berhasil disalin.

Parameter `game_mode` berisi regular, daily, custom, atau challenge. Daftarkan sebagai
custom dimension di GA4 untuk memecah laporan berdasarkan mode. Kode event tidak
mengirim judul/tebakan, kata pencarian, email, atau isi feedback. Pengumpulan belum
aktif dan dashboard belum terhubung sampai ID dipasang; data tidak berlaku surut.
