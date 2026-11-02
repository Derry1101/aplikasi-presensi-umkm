
const TUJUAN = {
  admin: "/admin/",
  karyawan: "/karyawan/"
};

const $ = (id) => document.getElementById(id);

const form = $("loginForm");
const userEl = $("username");
const passEl = $("password");
const errEl = $("error");
const btn = $("btn");

function showError(message, ...fields) {
  errEl.textContent = message;

  [userEl, passEl].forEach((field) => {
    field.classList.toggle("invalid", fields.includes(field));
  });
}

$("toggle").addEventListener("click", () => {
  const sembunyi = passEl.type === "password";

  passEl.type = sembunyi ? "text" : "password";

  $("toggle").setAttribute(
    "aria-label",
    sembunyi ? "Sembunyikan password" : "Tampilkan password"
  );
});

async function cekLogin(username, password) {
  let response;

  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke server.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Username atau password salah.");
  }

  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = userEl.value.trim();
  const password = passEl.value;

  if (!username || !password) {
    showError(
      "Username dan password wajib diisi.",
      ...(!username ? [userEl] : []),
      ...(!password ? [passEl] : [])
    );
    return;
  }

  showError("");
  btn.disabled = true;
  btn.textContent = "Memproses...";

  try {
    const data = await cekLogin(username, password);
    const { token, user } = data;

    if (!token || !user || !TUJUAN[user.role]) {
      throw new Error("Data login atau role tidak valid.");
    }

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

    location.href = TUJUAN[user.role];
  } catch (error) {
    showError(error.message, userEl, passEl);

    btn.disabled = false;
    btn.textContent = "Login";
    passEl.select();
  }
});
