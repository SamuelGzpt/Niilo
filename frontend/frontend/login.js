async function login(event) {
  event.preventDefault(); // Previene recarga

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  // app.use((req, res, next) => {
  //   res.header('Access-Control-Allow-Origin', '*');
  //   res.header('Access-Control-Allow-Headers', 'Content-Type');
  //   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  //   next();
  // });
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const user = await res.json();
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem('userData', JSON.stringify(user));
    window.location.href = '/publicaciones';
    
  } else {
    const msg = await res.text();
    document.getElementById("errorMsg").innerText = msg;
  }

}
