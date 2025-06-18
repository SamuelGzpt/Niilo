async function login(event) {
  event.preventDefault(); // Previene recarga

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const user = await res.json();
    sessionStorage.setItem("user", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    const msg = await res.text();
    document.getElementById("errorMsg").innerText = msg;
  }
}

