// data karyawan di simpan di local storage
let tersimpan = null;
try { tersimpan = JSON.parse(localStorage.getItem("dataKaryawan")); } catch (e) {}
const karyawan = Array.isArray(tersimpan) ? tersimpan : dataAwal;



function simpan() {
  try { localStorage.setItem("dataKaryawan", JSON.stringify(karyawan)); } catch (e) {}
}

// Setiap ada perubahan: simpan, lalu gambar ulang halaman
function simpanDanPerbarui() {
  simpan();
  perbarui();
}

// =====================================================
// 3. ALAT BANTU
// buat("p", "Halo", "kelas") membuat <p class="kelas">Halo</p>
// Memakai textContent, jadi aman dari kode HTML yang diketik pengguna.
// =====================================================
function buat(tag, teks, kelas) {
  const el = document.createElement(tag);
  if (teks) el.textContent = teks;
  if (kelas) el.className = kelas;
  return el;
}

function buatTombol(label, aksi) {
  const tombol = buat("button", label);
  tombol.addEventListener("click", aksi);
  return tombol;
}

// =====================================================
// 4. MEMBUAT TAMPILAN (dari bagian kecil ke besar)
// =====================================================

// Foto bulat, atau huruf pertama nama kalau tidak ada foto
function buatFoto(k) {
  if (k.foto) {
    const img = buat("img", "", "foto");
    img.src = k.foto;
    img.alt = k.nama;
    return img;
  }
  return buat("div", k.nama[0], "foto");
}

// ----- Alat bantu untuk waktu / deadline -----

// Mengubah "2026-10-15" menjadi "15 Okt 2026"
function formatTanggal(s) {
  return new Date(s + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Tanggal hari ini dengan format yang sama dengan kolom tanggal: "2026-10-15"
function hariIni() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tgl = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + bulan + "-" + tgl;
}

// Teks waktu tugas, misalnya "15 Okt 2026 → 20 Okt 2026"
function teksWaktu(t) {
  if (t.mulai && t.sampai) return formatTanggal(t.mulai) + " → " + formatTanggal(t.sampai);
  if (t.sampai) return "Sampai " + formatTanggal(t.sampai);
  if (t.mulai) return "Mulai " + formatTanggal(t.mulai);
  return "";
}

// Status deadline. Tugas yang sudah selesai tidak dianggap terlambat.
function statusWaktu(t) {
  if (t.selesai || !t.sampai) return "";
  if (t.sampai < hariIni()) return "Terlambat";
  if (t.sampai === hariIni()) return "Hari ini";
  return "";
}

// Dua kolom tanggal (Mulai dan Sampai). Dipakai di form tambah dan form ubah.
function buatInputWaktu(t) {
  const wadah = buat("div", "", "waktu");

  const mulai = buat("input");
  mulai.type = "date";
  mulai.value = t.mulai || "";

  const sampai = buat("input");
  sampai.type = "date";
  sampai.value = t.sampai || "";
  sampai.min = mulai.value; // "Sampai" tidak boleh sebelum "Mulai"

  mulai.addEventListener("change", () => {
    sampai.min = mulai.value;
  });

  wadah.append(buat("span", "Mulai"), mulai, buat("span", "Sampai"), sampai);
  return { wadah, mulai, sampai };
}

// ----- Prioritas -----
// Kiri = nilai yang disimpan di data, kanan = tulisan yang tampil
const PRIORITAS = { low: "Low", medium: "Medium", high: "High" };

// Kotak pilihan (dropdown) Low / Medium / High
function buatPilihanPrioritas(nilai) {
  const pilih = buat("select");
  for (const kunci in PRIORITAS) {
    const opsi = buat("option", PRIORITAS[kunci]);
    opsi.value = kunci;
    pilih.appendChild(opsi);
  }
  pilih.value = nilai || "medium"; // tugas lama yang belum punya prioritas dianggap medium
  return pilih;
}

// Satu baris tugas: centang, teks + waktu, tombol Ubah, tombol Hapus
// k = karyawan, t = tugas, i = nomor urut tugas
function buatBarisTugas(k, t, i) {
  const baris = buat("li");

  const cek = buat("input");
  cek.type = "checkbox";
  cek.checked = t.selesai;
  cek.addEventListener("change", () => {
    t.selesai = cek.checked;
    simpanDanPerbarui();
  });

  // Bagian info: teks tugas, dan keterangan waktu di bawahnya (kalau ada)
  const info = buat("div", "", "info");
  const p = t.prioritas || "medium";
  info.appendChild(buat("span", PRIORITAS[p], "prioritas " + p));
  info.appendChild(buat("span", t.teks, t.selesai ? "selesai" : ""));
  const waktu = teksWaktu(t);
  if (waktu) {
    const status = statusWaktu(t);
    const label = status ? waktu + " • " + status : waktu;
    info.appendChild(buat("small", label, status === "Terlambat" ? "batas terlambat" : "batas"));
  }

  // Tombol Ubah: info diganti form kecil berisi teks + tanggal
  const ubah = buatTombol("Ubah", () => {
    const form = buat("form", "", "edit");
    const input = buat("input");
    input.value = t.teks;
    const pilih = buatPilihanPrioritas(t.prioritas);
    const waktuBaru = buatInputWaktu(t);
    const batal = buatTombol("Batal", perbarui);
    batal.type = "button"; // supaya tidak ikut mengirim form

    form.append(input, pilih, waktuBaru.wadah, buat("button", "Simpan"), batal);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value.trim()) t.teks = input.value.trim();
      t.prioritas = pilih.value;
      t.mulai = waktuBaru.mulai.value;
      t.sampai = waktuBaru.sampai.value;
      simpanDanPerbarui();
    });

    ubah.remove();
    hapus.remove();
    baris.replaceChild(form, info);
    input.focus();
  });

  const hapus = buatTombol("Hapus", () => {
    k.todo.splice(i, 1); // hapus 1 item di posisi i
    simpanDanPerbarui();
  });

  baris.append(cek, info, ubah, hapus);
  return baris;
}

// Form kecil untuk menambah tugas baru (teks + tanggal mulai + tanggal sampai)
function buatFormTambah(k) {
  const form = buat("form", "", "tambah");
  const input = buat("input");
  input.placeholder = "Tugas baru...";
  const pilih = buatPilihanPrioritas("medium");
  const waktu = buatInputWaktu({});
  form.append(input, pilih, waktu.wadah, buat("button", "Tambah"));

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // cegah halaman refresh
    const isi = input.value.trim();
    if (!isi) return;
    k.todo.push({
      teks: isi,
      selesai: false,
      prioritas: pilih.value,
      mulai: waktu.mulai.value,
      sampai: waktu.sampai.value,
    });
    simpanDanPerbarui();
  });

  return form;
}

// Satu kartu lengkap untuk satu karyawan
function buatKartu(k) {
  const kartu = buat("div", "", "kartu");

  const daftar = buat("ul");
  k.todo.forEach((t, i) => daftar.appendChild(buatBarisTugas(k, t, i)));

  kartu.append(
    buatFoto(k),
    buat("h3", k.nama),
    buat("p", k.jabatan),
    daftar,
    buatFormTambah(k),
    buatTombolHapusSemua(k)
  );
  return kartu;
}

// Tampilkan daftar karyawan ke halaman
function tampilkan(daftar) {
  const wadah = document.getElementById("hasil");
  wadah.innerHTML = ""; // kosongkan hasil lama

  if (daftar.length === 0) {
    wadah.textContent = "Karyawan tidak ditemukan";
    return;
  }
  daftar.forEach((k) => wadah.appendChild(buatKartu(k)));
}

// =====================================================
// 5. PENCARIAN
// Kolom kosong = semua karyawan tampil.
// =====================================================
function perbarui() {
  const kata = document.getElementById("cari").value.trim().toLowerCase();
  const hasil = karyawan.filter((k) => k.nama.toLowerCase().includes(kata));
  tampilkan(hasil);
}

document.getElementById("cari").addEventListener("input", perbarui);

// =====================================================
// 6. JALANKAN saat halaman pertama dibuka
// =====================================================
perbarui();


// funsi tombol hapus semua todo listnya
function buatTombolHapusSemua(k) {
  return buatTombol("Hapus Semua", () => {
    if (!confirm("yakin ga ni cuuuuuy " + k.nama + "?")) return;

    k.todo = [];          // kosongkan semua tugas karyawan ini
    simpanDanPerbarui();  // simpan + gambar ulang
  });
}
// tanggal
const elemenTanggal = document.getElementById("tanggal");

const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

elemenTanggal.textContent = tanggalHariIni;


