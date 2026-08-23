# Guess The Song

Game tebak lagu harian ala [Songly](https://quizly.gg/songly) / Heardle.
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

Setiap kali dibuka, yang muncul lebih dulu adalah **layar pilih mode**: tentukan region,
genre, era, dan mode harian/bebas, baru tekan **Start**. Tidak ada lagu yang diambil
sebelum tombol itu ditekan, jadi mengubah pilihan tidak menukar lagu di tengah sesi.

Ketik judul di kolom pencarian lalu **klik salah satu saran** — memilih langsung mengirim
tebakan, tidak ada tombol terpisah. Tiap saran menampilkan sampul albumnya.

Saat bermain, tombol **Change mode** mengembalikanmu ke layar pilihan. Sesi yang sedang
berjalan tidak hilang: tombolnya berubah jadi **Continue**, dan kalau sudah selesai,
menekannya membuka kembali layar hasilnya.

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

| Tahap | Tier lagu | Potongan yang terbuka (detik) |
|---|---|---|
| Easy | 1 | 2 · 3 · 5 · 8 · 12 · 16 |
| Medium | 1–2 | 1 · 2 · 4 · 7 · 11 · 16 |
| Hard | 2–3 | 0.5 · 1 · 2 · 4 · 8 · 14 |
| Expert | 3–4 | 0.3 · 0.6 · 1.2 · 2.5 · 5 · 10 |
| Impossible | 4–5 | 0.1 · 0.3 · 0.7 · 1.5 · 3 · 6 |

Tier menentukan seberapa terkenal lagunya — tahap awal lagu sejuta umat, tahap akhir lagu
yang jarang diputar.

**Gagal di satu tahap tidak menghentikan sesi.** Kamu tetap lanjut sampai Impossible, dan
nilai akhirnya berapa tahap yang kena, dari 5. Satu lagu tidak muncul dua kali dalam sesi
yang sama.

Begitu satu tahap selesai — menang maupun kalah — lagunya langsung diputar lebih panjang.
Menang memicu ledakan confetti hijau; kalah memicu serpihan merah yang jatuh dan kartunya
bergetar sebentar.

## Menyaring katalog

| Filter | Pilihan |
|---|---|
| Region | Western · Asia |
| Genre | Pop · Rock · Hip-hop · R&B/Soul · Electronic · Indie · Other |
| Era | Before 2000 · 2000s · 2010s · 2020s |

Tiap kombinasi punya sesi harian dan statistiknya sendiri. Baris kecil di bawah filter
memberitahu berapa lagu yang cocok, dan memperingatkan kalau filternya terlalu sempit.
Pilihan filter **tidak pernah dilonggarkan diam-diam** — kalau lagu yang cocok kurang,
yang dilebarkan hanya rentang tier tahap itu.

- **Daily** — semua orang dapat lima lagu yang sama tiap hari, ditentukan dari tanggal.
- **Free play** — lima lagu acak, bisa diulang terus lewat **Play again**. Tidak
  memengaruhi statistik.

## Isi folder

| Berkas | Isi |
|---|---|
| `Main Tebak Lagu.bat` | Klik dua kali untuk main |
| `Tebak Lagu.vbs` | Menyalakan server tanpa jendela; salinannya ada di folder Startup |
| `server.log` | Catatan server — dibaca kalau ada yang aneh |
| `index.html` | Markup |
| `styles.css` | Tampilan |
| `app.js` | Logika permainan, audio, pencarian, statistik |
| `songs.js` | Katalog 992 lagu |
| `app.webmanifest`, `icon-*.png` | Supaya bisa dipasang ke layar depan HP |
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
awk '/^[ \t]*\["/{n=gsub(/"/,"\"");if(n!=14)print NR": kutip="n}' songs.js
```

Tiap baris harus punya 14 tanda kutip. Judul beraksen atau ber-apostrof aman; yang
berbahaya adalah judul dengan kutip di dalamnya — `parse-artist.awk` sudah menolaknya,
karena satu saja bisa merusak sintaks seluruh berkas.

## Menambah satu-dua lagu manual

Tambahkan satu baris di `songs.js` — cukup empat kolom pertama:

```js
["Song Title", "Artist Name", 3, "gl"],
```

`tier` 1 (paling terkenal) sampai 5 (paling niche); `region` `"gl"` (Barat) atau `"as"`
(Asia). Genre, tahun, dan sampul tidak perlu diisi manual:

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
