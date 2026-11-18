# Galeri Daffa & Jelita

Website galeri romantis pribadi (HTML + CSS + JavaScript, tanpa backend).

## Cara menjalankan
Buka `index.html` di browser. Untuk hasil terbaik (musik & font), jalankan lewat GitHub Pages.

## Cara menambah foto
1. Masukkan foto ke `assets/photos/` (misalnya `jelita-01.jpg`).
2. Buka `js/gallery.js`, hapus tanda `//` pada contoh, lalu isi datanya. Salin blok `{ ... }` untuk foto berikutnya.
3. `featured: true` membuat foto tampil lebih besar.
Foto hero: simpan sebagai `assets/photos/hero.jpg` (atau ubah `hero.image` di `js/config.js`).
Foto tempat & first date: isi `photos.place` / `photos.firstDate` di `js/config.js`.

## Cara mengganti musik
Masukkan file ke `assets/music/`, lalu ubah `music.src` dan `music.title` di `js/config.js`.

## Cara mengganti quote
Edit `js/quotes.js`.

Tema: website ini hanya memakai mode gelap (burgundy).

## Cara mengganti nama / tanggal / timeline
Edit `js/config.js`.

## Cara upload ke GitHub Pages
1. Buat akun di github.com, klik **New repository**, beri nama (mis. `galeri-kita`), pilih Public.
2. Klik **uploading an existing file**, tarik seluruh isi folder ini (index.html, css, js, assets), lalu **Commit changes**.
3. Buka **Settings → Pages**, pilih Branch `main` dan folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit; alamat website muncul di halaman yang sama.
