document.addEventListener("DOMContentLoaded", () => {
  loadPublicaciones();

  const form = document.getElementById("form-publicacion");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const contenido = document.getElementById("contenido").value;
    const usuario_id = 1; // temporal: reemplaza con el ID real del usuario autenticado
    await fetch("/api/publicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id, contenido })
    });
    document.getElementById("contenido").value = "";
    loadPublicaciones();
  });
});

async function loadPublicaciones() {
  const res = await fetch("/api/publicaciones");
  const publicaciones = await res.json();
  const contenedor = document.getElementById("feed");
  contenedor.innerHTML = "";
  publicaciones.forEach(p => {
    const div = document.createElement("div");
    div.className = "publicacion";
    div.innerHTML = `
      <h4>${p.nombre} ${p.apellido}</h4>
      <p>${p.contenido}</p>
      <small>${new Date(p.fecha_publicacion).toLocaleString()}</small>
    `;
    contenedor.appendChild(div);
  });
}



// ================== MENU ACTIVO ==================
const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    menuItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ================== LIKE, BOOKMARK, SHARE ==================
document.querySelectorAll('.interaction-buttons span').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});
document.querySelectorAll('.bookmark span').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});

// ================== THEME MODAL ==================
const themeBtn = document.querySelector('.menu-item i.uil-palette')?.parentElement;
let themeModal;

if (themeBtn) {
  // Crear modal si no existe
  themeModal = document.createElement('div');
  themeModal.className = 'theme-modal';
  themeModal.innerHTML = `
    <div class="theme-modal-content">
      <h3>Elige un tema</h3>
      <div class="theme-options">
        <button class="theme-btn" data-theme="light">Claro</button>
        <button class="theme-btn" data-theme="dark">Oscuro</button>
      </div>
      <h4>Color principal</h4>
      <div class="color-options">
        <span class="color color-1" data-color="#6c63ff" style="background:#6c63ff"></span>
        <span class="color color-2" data-color="#ff4d4f" style="background:#ff4d4f"></span>
        <span class="color color-3" data-color="#00b894" style="background:#00b894"></span>
        <span class="color color-4" data-color="#fdcb6e" style="background:#fdcb6e"></span>
        <span class="color color-5" data-color="#0984e3" style="background:#0984e3"></span>
      </div>
      <button class="close-theme">Cerrar</button>
    </div>
  `;
  document.body.appendChild(themeModal);
  themeModal.style.display = 'none';

  themeBtn.addEventListener('click', () => {
    themeModal.style.display = 'flex';
  });
  themeModal.querySelector('.close-theme').onclick = () => {
    themeModal.style.display = 'none';
  };
  themeModal.onclick = e => {
    if (e.target === themeModal) themeModal.style.display = 'none';
  };

  // Cambiar modo claro/oscuro
  themeModal.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };
  });
  // Cambiar color principal
  themeModal.querySelectorAll('.color').forEach(color => {
    color.onclick = () => {
      document.documentElement.style.setProperty('--color-primary', color.dataset.color);
    };
  });
}

// ================== DARK THEME CSS ==================
const darkThemeStyles = document.createElement('style');
darkThemeStyles.innerHTML = `
  body.dark-theme {
    background: #18191a;
    color: #f5f6fa;
  }
  body.dark-theme nav, body.dark-theme .sidebar, body.dark-theme .profile-card, body.dark-theme .middle .story, body.dark-theme .create-post, body.dark-theme .feed, body.dark-theme .messages, body.dark-theme .friend-request {
    background: #242526 !important;
    color: #f5f6fa !important;
    box-shadow: none !important;
  }
  body.dark-theme .search-bar, body.dark-theme .messages .search-bar {
    background: #3a3b3c !important;
    color: #f5f6fa !important;
  }
  body.dark-theme .menu-item.active, body.dark-theme .menu-item:hover {
    background: #3a3b3c !important;
    color: var(--color-primary) !important;
  }
  body.dark-theme .category {
    border-bottom: 2px solid #3a3b3c;
  }
`;
document.head.appendChild(darkThemeStyles);

// ================== MENSAJES: BUSCADOR ==================
const messageSearch = document.querySelector('.messages .search-bar input[type="search"]');
if (messageSearch) {
  messageSearch.addEventListener('input', e => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.message').forEach(msg => {
      const name = msg.querySelector('h5').textContent.toLowerCase();
      msg.style.display = name.includes(val) ? '' : 'none';
    });
  });
}

// ================== CATEGORÍAS DE MENSAJES ==================
document.querySelectorAll('.category h6').forEach(tab => {
  tab.addEventListener('click', () => {
    tab.parentElement.querySelectorAll('h6').forEach(h => h.classList.remove('active'));
    tab.classList.add('active');
    // Aquí puedes agregar lógica para mostrar mensajes según la categoría
  });
});

// ================== BOTONES DE SOLICITUDES ==================
document.querySelectorAll('.friend-request .btn-primary').forEach(btn => {
  btn.onclick = () => {
    btn.textContent = 'Accepted';
    btn.disabled = true;
    btn.nextElementSibling.disabled = true;
  };
});
document.querySelectorAll('.friend-request .btn:not(.btn-primary)').forEach(btn => {
  btn.onclick = () => {
    btn.textContent = 'Declined';
    btn.disabled = true;
    btn.previousElementSibling.disabled = true;
  };
}); 