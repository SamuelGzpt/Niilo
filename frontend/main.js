// ================== SESIÓN TEMPORAL ==================
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) {
  window.location.href = "login.html";
}

// ================== CARGAR PUBLICACIONES ==================
async function loadPublicaciones() {
  const res = await fetch("/api/publicaciones");
  const publicaciones = await res.json();
  const contenedor = document.getElementById("feed");
  contenedor.innerHTML = "";

  for (const pub of publicaciones) {
    const div = document.createElement("div");
    div.className = "publicacion";
    div.innerHTML = `
      <h4>${pub.nombre} ${pub.apellido}</h4>
      <p>${pub.contenido}</p>
      <small>${new Date(pub.fecha_publicacion).toLocaleString()}</small>
      <div class="post-stats" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
        <button onclick="darLike(${pub.id})" id="like-button-main-${pub.id}" class="like-btn">👍 Like</button>
        (<span id="like-count-main-${pub.id}">0</span>) |
        Comments: <span id="comment-count-main-${pub.id}">0</span>
      </div>
      <form onsubmit="comentar(event, ${pub.id})" class="comment-form">
        <input type="text" placeholder="Escribe un comentario..." required>
        <button type="submit">Comentar</button>
      </form>
      <div id="comentarios-${pub.id}" class="comments-container"></div>
    `;
    contenedor.appendChild(div);
    // Cargar datos de likes y comentarios
    await loadLikeDataForPost(pub.id);
    await cargarComentarios(pub.id); // Esto también actualizará el contador de comentarios
  }
}

async function loadLikeDataForPost(publicacion_id) {
  try {
    const res = await fetch(`/api/publicaciones/${publicacion_id}/likes`);
    if (!res.ok) {
      console.error(`Error fetching likes for post ${publicacion_id}: ${res.status}`);
      return;
    }
    const likeData = await res.json(); // { like_count: X, users_liked: [...] }

    const likeCountElement = document.getElementById(`like-count-main-${publicacion_id}`);
    if (likeCountElement) {
      likeCountElement.textContent = likeData.like_count || 0;
    }

    const likeButtonElement = document.getElementById(`like-button-main-${publicacion_id}`);
    if (likeButtonElement) {
      const userHasLiked = likeData.users_liked.some(u => u.usuario_id === user.id);
      if (userHasLiked) {
        likeButtonElement.textContent = '❤️ Liked';
        likeButtonElement.classList.add('liked');
      } else {
        likeButtonElement.textContent = '👍 Like';
        likeButtonElement.classList.remove('liked');
      }
    }
  } catch (error) {
    console.error(`Error in loadLikeDataForPost for post ${publicacion_id}:`, error);
  }
}

// ================== CREAR PUBLICACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-publicacion")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const contenido = document.getElementById("contenido").value;
    await fetch("/api/publicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: user.id, contenido })
    });
    document.getElementById("contenido").value = "";
    loadPublicaciones();
  });

  loadPublicaciones();
});

// ================== DAR LIKE ==================
async function darLike(publicacion_id) {
  await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: user.id, publicacion_id })
  });
  // Recargar datos de likes para el post específico para actualizar UI
  await loadLikeDataForPost(publicacion_id);
}

// ================== COMENTAR ==================
async function comentar(e, publicacion_id) {
  e.preventDefault();
  const input = e.target.querySelector("input");
  const contenido = input.value;
  await fetch("/api/comentarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: user.id, publicacion_id, contenido })
  });
  input.value = "";
  await cargarComentarios(publicacion_id);
}

// ================== CARGAR COMENTARIOS ==================
async function cargarComentarios(publicacion_id) {
  try {
    const res = await fetch(`/api/publicaciones/${publicacion_id}/comentarios`); // URL actualizada
    if (!res.ok) {
      console.error(`Error fetching comments for post ${publicacion_id}: ${res.status}`);
      const commentContainer = document.getElementById(`comentarios-${publicacion_id}`);
      if (commentContainer) {
        commentContainer.innerHTML = "<small>Error al cargar comentarios.</small>";
      }
      // Actualizar contador a 0 o 'Error' en caso de fallo
      const commentCountElement = document.getElementById(`comment-count-main-${publicacion_id}`);
      if (commentCountElement) {
          commentCountElement.textContent = 'Error';
      }
      return;
    }
    const comentarios = await res.json(); // Array de comentarios {id, contenido, fecha_comentario, nombre, apellido}

    const contenedor = document.getElementById(`comentarios-${publicacion_id}`);
    if (!contenedor) return;

    contenedor.innerHTML = ""; // Limpiar comentarios anteriores
    if (comentarios.length === 0) {
      contenedor.innerHTML = "<small>No hay comentarios aún.</small>";
    } else {
      comentarios.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment-item"; // Para posible estilizado
        div.innerHTML = `<small><strong>${c.nombre} ${c.apellido || ''}</strong>: ${c.contenido}</small>`;
        contenedor.appendChild(div);
      });
    }

    // Actualizar el contador de comentarios
    const commentCountElement = document.getElementById(`comment-count-main-${publicacion_id}`);
    if (commentCountElement) {
      commentCountElement.textContent = comentarios.length;
    }

  } catch (error) {
    console.error(`Error in cargarComentarios for post ${publicacion_id}:`, error);
    const commentContainer = document.getElementById(`comentarios-${publicacion_id}`);
    if (commentContainer) {
        commentContainer.innerHTML = "<small>Error al cargar comentarios.</small>";
    }
    const commentCountElement = document.getElementById(`comment-count-main-${publicacion_id}`);
    if (commentCountElement) {
        commentCountElement.textContent = 'Error';
    }
  }
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