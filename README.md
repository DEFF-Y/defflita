# Galeri Daffa & Jelita

Website buku kenangan pribadi (HTML + CSS + JavaScript, tanpa backend, siap GitHub Pages).

## Menambah foto (cara mudah)
1. Buka `tambah-foto.html` dengan Chrome/Edge di komputer.
2. (Jika sudah punya foto lama) klik **Muat gallery.js lama** dan pilih `js/gallery.js`.
3. Tarik semua foto baru ke kotak. Foto diperkecil otomatis dan tanggal dibaca dari kamera.
4. Isi judul/caption bila mau (boleh kosong), centang **Foto utama** untuk 1-2 foto favorit.
5. Klik **Unduh paket-galeri.zip**, ekstrak, lalu upload isinya ke GitHub (folder `assets` dan `js`), timpa `gallery.js` lama.
File `tambah-foto.html` tidak perlu diupload ke GitHub.

## Lagu
Taruh mp3 di `assets/music/`, lalu edit `playlist` di `js/config.js`. Boleh lebih dari satu lagu.

## Surat di dalam buku
Isi `letter` di `js/config.js` (title, text, from). Kosongkan `text` untuk menyembunyikannya.

## Mengganti nama / tanggal / timeline / quote
`js/config.js` dan `js/quotes.js`.

## Upload ke GitHub Pages
1. Buka repository, **Add file → Upload files**, tarik isi folder ini (`index.html`, `css`, `js`, `assets`).
2. **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
3. Tunggu 1-3 menit, alamat website muncul di halaman Pages.

## Fitur lucu
- Geser halaman mengikuti jari/mouse; lepas di tengah jalan untuk membatalkan.
- Stiker di tiap halaman: ketuk untuk melihat percikan. Ketuk meja di sekitar buku juga ada percikan.
- Ketuk hitungan hari di halaman judul untuk fakta lain (jam, menit, minggu, bulan purnama).
- Pojok halaman kanan bisa diketuk untuk maju. Hari ulang tahun/anniversary otomatis dirayakan.
- Isi `littleList` di `js/config.js` untuk halaman "Daftar kecil kita" yang bisa dicentang.

## Rasa buku sungguhan
Halaman melengkung saat dibalik, ada bayangan dan suara kertas (tombol 🔊 untuk mematikan), dan tumpukan kertas di kiri/kanan menebal-menipis sesuai halaman.

## Fitur tambahan
- 🎀 Tempel stiker sendiri di halaman (tersimpan di browser). ▶ Mode cerita membalik halaman otomatis.
- Isi `notes` di `js/config.js` untuk halaman "Kotak surat" (amplop yang bisa dibuka).

## Menu ajaib (tombol ✨)
Suasana lilin, hujan kelopak, acak kenangan, warna kertas, timer tidur, layar penuh, suara halaman. Di lightbox, tombol ♡ menandai foto favorit.

## Tambahan terbaru
Pembalikan halaman bergaya kain sutra; jejak kilau kursor, balon hati, suara hujan, penanda halaman, foto favorit, stiker bisa digeser (24 stiker), chip hari spesial, pesan harian, rahasia kecil (ketuk nama di pojok kiri atas 5 kali).

## Kotak Fitur (50 fitur)
Tombol 🎁 di bawah buku membuka 50 fitur: suasana, foto, suara, alat, dan permainan. File tambahannya: `js/extras.js` dan `css/extras.css` (sudah disambungkan di index.html).
Opsional di config.js: `wheel: ["Nonton film", ...]` untuk isi Roda kencan.
