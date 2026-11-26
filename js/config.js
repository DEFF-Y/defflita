// Semua data personal diedit di sini.
const siteConfig = {
  couple: { person1: "Daffa Yudhistira", person2: "Jelita Adinda Tanjung", short1: "Daffa", short2: "Jelita" },
  relationship: {
    startDate: "2025-05-11",
    anniversary: { day: 11, month: 5, label: "11 Mei" },
    firstDate: { day: "29", month: "November", year: "2025", caption: "Tanggal pertama kita keluar bersama." },
    meaningfulPlace: "Gedung Kesenian Miss Tjitjih",
    placeText: "Dari banyak tempat, ini salah satu yang akan selalu kita ingat."
  },
  birthdays: { person1: "16 Februari", person2: "5 Juli" },
  hero: {
    image: "assets/photos/hero.jpeg", // opsional; jika tidak ada, latar gradasi dipakai
    phrase: "Tempat kecil untuk menyimpan cerita kita."
  },
  photos: { place: "assets/photos/firstplace.jpeg", firstDate: "assets/photos/first.jpeg" }, // foto opsional untuk dua bagian khusus
  // Daftar lagu (boleh lebih dari satu). Taruh file mp3 di assets/music/
  playlist: [
    { src: "assets/music/song1.mp3", title: "Lagu Kesukaan Jelita" },
     { src: "assets/music/song2.mp3", title: "Lagu Kesukaan Deff" }
  ],
  // Halaman surat di dalam buku. Kosongkan text untuk menyembunyikannya.
  // Pisahkan paragraf dengan satu baris kosong.
  letter: { title: "", text: "", from: "" },
  // Daftar kecil (opsional): isi dengan hal-hal yang kalian suka/lakukan. Kosong = halaman tidak muncul.
  // Contoh: items: ["Nonton pertunjukan bareng", "Jalan sore"]
  // Kotak surat (opsional): tulis catatan singkat (1-2 kalimat). Ketuk amplop di buku untuk membuka salah satunya.
  // Contoh: notes: ["Terima kasih sudah ada.", "Aku senang hari ini."]
  notes: [],
  littleList: { title: "Daftar kecil kita", items: [] },
  timeline: [
    { date: "11.05.2025", title: "Awal Cerita", text: "Hari kita resmi menjadi kita." },
    { date: "29.11.2025", title: "First Date", text: "Pertama kali kita menghabiskan hari berdua." }
    // Tambahkan momen lain di sini.
  ],
  ending: ["Masih banyak cerita", "yang belum kita simpan di sini.", "Dan mungkin,", "cerita terbaiknya", "belum selesai."]
};
