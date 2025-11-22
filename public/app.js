class QueRegaloApp {
  constructor() {
    this.state = {
      view: 'landing', // landing, group, user-select, user
      groupId: null,
      userId: null,
      groupName: null,
      userName: null,
      users: [],
      allGifts: [],
      myGifts: [],
      otherUsersGifts: {},
      expandedUsers: {},
      loading: false,
      loadingMessage: '',
    };

    this.init();
  }

  init() {
    // Prevenir que el navegador maneje el scroll automáticamente
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    this.render();
    this.loadStateFromUrl();
  }

  // Cookie Management
  saveUserToCookie(groupId, userName) {
    const cookieData = JSON.stringify({ groupId, userName });
    // Guardar cookie por 30 días
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `queregalo_user=${cookieData}; ${expires}; path=/`;
  }

  getUserFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith('queregalo_user=')) {
        try {
          const cookieData = JSON.parse(decodeURIComponent(cookie.substring('queregalo_user='.length)));
          return cookieData;
        } catch (e) {
          console.error('Error al leer cookie:', e);
        }
      }
    }
    return null;
  }

  // Guardar estado en URL para compartir el enlace
  saveStateToUrl() {
    if (this.state.groupId && this.state.userId) {
      window.history.replaceState({}, '', `/?group=${this.state.groupId}&user=${encodeURIComponent(this.state.userName)}`);
    } else if (this.state.groupId) {
      window.history.replaceState({}, '', `/?group=${this.state.groupId}`);
    }
  }

  // Cargar estado desde URL
  loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('group');
    const userName = params.get('user');

    if (groupId && userName) {
      this.state.groupId = groupId;
      this.state.view = 'user-select';
      this.fetchGroup((error) => {
        if (error) {
          this.goToLanding();
        } else {
          this.createOrSelectUser(decodeURIComponent(userName));
        }
      });
    } else if (groupId) {
      // Si hay un groupId en la URL, intentar cargar el usuario de la cookie si coincide el grupo
      const cookieData = this.getUserFromCookie();
      if (cookieData && cookieData.groupId === groupId) {
        this.state.groupId = groupId;
        this.state.view = 'user-select';
        this.fetchGroup((error) => {
          if (error) {
            this.goToLanding();
          } else {
            this.createOrSelectUser(cookieData.userName);
          }
        });
      } else {
        this.state.groupId = groupId;
        this.state.view = 'user-select';
        this.fetchGroup((error) => {
          if (error) {
            this.goToLanding();
          }
        });
      }
    }
  }

  // Loading indicators
  setLoading(isLoading, message = '') {
    this.state.loading = isLoading;
    this.state.loadingMessage = message;
    this.render();
  }

  // API BASE URL
  apiCall(path, options = {}) {
    const url = `/.netlify/functions/api/api${path}`;
    return fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  }

  // API CALLS
  async fetchGroup(callback) {
    try {
      this.setLoading(true, 'Cargando grupo...');
      const response = await this.apiCall(`/groups/${this.state.groupId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'El grupo no existe');
      }

      const group = await response.json();
      this.state.groupName = group.name;
      await this.fetchUsers();
      this.setLoading(false);
      this.render();
      if (callback) callback(null);
    } catch (error) {
      console.error('Error al obtener grupo:', error);
      this.setLoading(false);

      const errorMessage = error.message || 'Error al cargar el grupo';
      this.showAlert(errorMessage, 'error');

      // Redirigir al inicio después de mostrar el error
      setTimeout(() => {
        this.goToLanding();
      }, 2000);

      if (callback) callback(error);
    }
  }

  async createGroup(name) {
    try {
      this.setLoading(true, 'Creando grupo...');
      const response = await this.apiCall('/groups', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      this.state.groupId = data.groupId;
      this.state.groupName = data.name;
      this.state.view = 'user-select';
      this.saveStateToUrl();
      await this.fetchUsers();
      this.setLoading(false);
      this.render();
    } catch (error) {
      console.error('Error al crear grupo:', error);
      this.setLoading(false);
      this.showAlert('Error al crear el grupo', 'error');
    }
  }

  async fetchUsers() {
    try {
      const response = await this.apiCall(`/groups/${this.state.groupId}/users`);
      this.state.users = await response.json();
      await this.fetchAllGifts();
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  }

  async createOrSelectUser(name) {
    try {
      this.setLoading(true, 'Cargando usuario...');
      const response = await this.apiCall(`/groups/${this.state.groupId}/users`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      this.state.userId = data.userId;
      this.state.userName = data.name;
      this.state.view = 'user';
      this.saveStateToUrl();
      this.saveUserToCookie(this.state.groupId, data.name);
      await this.fetchUsers();
      await this.fetchMyGifts();
      this.setLoading(false);
      this.render();
    } catch (error) {
      console.error('Error al crear/seleccionar usuario:', error);
      this.setLoading(false);
      this.showAlert('Error al crear usuario', 'error');
    }
  }

  async fetchAllGifts() {
    try {
      const response = await this.apiCall(`/groups/${this.state.groupId}/gifts`);
      this.state.allGifts = await response.json();
      this.organizeGifts();
    } catch (error) {
      console.error('Error al obtener regalos:', error);
    }
  }

  async fetchMyGifts() {
    try {
      const response = await this.apiCall(`/groups/${this.state.groupId}/users/${this.state.userId}/gifts`);
      this.state.myGifts = await response.json();
    } catch (error) {
      console.error('Error al obtener mis regalos:', error);
    }
  }

  organizeGifts() {
    this.state.otherUsersGifts = {};
    this.state.allGifts.forEach(gift => {
      if (gift.user_id !== this.state.userId) {
        if (!this.state.otherUsersGifts[gift.user_name]) {
          this.state.otherUsersGifts[gift.user_name] = [];
        }
        this.state.otherUsersGifts[gift.user_name].push(gift);
      }
    });
  }

  async addGift(name, price, location) {
    try {
      this.setLoading(true, 'Agregando regalo...');
      const response = await this.apiCall(
        `/groups/${this.state.groupId}/users/${this.state.userId}/gifts`,
        {
          method: 'POST',
          body: JSON.stringify({ name, price, location }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      await this.fetchMyGifts();
      await this.fetchAllGifts();
      this.setLoading(false);
      this.render();
      this.showAlert('Regalo añadido exitosamente', 'success');
    } catch (error) {
      console.error('Error al añadir regalo:', error);
      this.setLoading(false);
      this.showAlert(error.message || 'Error al añadir regalo', 'error');
    }
  }

  async lockGift(giftId) {
    try {
      const content = document.querySelector('.content');
      const scrollPos = content ? content.scrollTop : 0;

      this.setLoading(true, 'Bloqueando regalo...');
      const response = await this.apiCall(`/gifts/${giftId}/lock`, {
        method: 'PUT',
        body: JSON.stringify({ lockedBy: this.state.userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      await this.fetchAllGifts();
      this.setLoading(false);

      // Restaurar scroll después de que se renderice
      setTimeout(() => {
        const content = document.querySelector('.content');
        if (content) {
          content.scrollTop = scrollPos;
        }
      }, 0);
    } catch (error) {
      console.error('Error al bloquear regalo:', error);
      this.setLoading(false);
      this.showAlert(error.message || 'Error al bloquear regalo', 'error');
    }
  }

  async unlockGift(giftId) {
    try {
      const content = document.querySelector('.content');
      const scrollPos = content ? content.scrollTop : 0;

      this.setLoading(true, 'Desbloqueando regalo...');
      const response = await this.apiCall(`/gifts/${giftId}/unlock`, {
        method: 'PUT',
        body: JSON.stringify({ unlockedBy: this.state.userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      await this.fetchAllGifts();
      this.setLoading(false);

      // Restaurar scroll después de que se renderice
      setTimeout(() => {
        const content = document.querySelector('.content');
        if (content) {
          content.scrollTop = scrollPos;
        }
      }, 0);
    } catch (error) {
      console.error('Error al desbloquear regalo:', error);
      this.setLoading(false);
      this.showAlert(error.message || 'Error al desbloquear regalo', 'error');
    }
  }

  toggleUserGifts(userName) {
    const content = document.querySelector('.content');
    const scrollPos = content ? content.scrollTop : 0;

    this.state.expandedUsers[userName] = !this.state.expandedUsers[userName];
    this.render();

    // Restaurar scroll después de que se renderice
    setTimeout(() => {
      const content = document.querySelector('.content');
      if (content) {
        content.scrollTop = scrollPos;
      }
    }, 0);
  }

  async deleteGift(giftId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este regalo?')) return;

    try {
      this.setLoading(true, 'Eliminando regalo...');
      const response = await this.apiCall(`/gifts/${giftId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar regalo');
      await this.fetchMyGifts();
      await this.fetchAllGifts();
      this.setLoading(false);
      this.render();
      this.showAlert('Regalo eliminado', 'success');
    } catch (error) {
      console.error('Error al eliminar regalo:', error);
      this.setLoading(false);
      this.showAlert('Error al eliminar regalo', 'error');
    }
  }

  editGiftModal(giftId) {
    const gift = this.state.myGifts.find(g => g.id === giftId);
    if (!gift) return;

    // Guardar el ID del regalo siendo editado
    this.state.editingGiftId = giftId;

    // Llenar el modal con los datos del regalo
    document.getElementById('edit-gift-name').value = gift.name;
    document.getElementById('edit-gift-price').value = gift.price;
    document.getElementById('edit-gift-location').value = gift.location;

    // Mostrar el modal
    document.getElementById('edit-gift-modal').classList.add('active');
  }

  async editGift(giftId, name, price, location) {
    try {
      this.setLoading(true, 'Actualizando regalo...');
      const response = await this.apiCall(`/gifts/${giftId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, price, location }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      await this.fetchMyGifts();
      await this.fetchAllGifts();
      this.setLoading(false);
      this.render();
      this.showAlert('Regalo actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error al actualizar regalo:', error);
      this.setLoading(false);
      this.showAlert(error.message || 'Error al actualizar regalo', 'error');
    }
  }

  // NAVEGACIÓN
  goToLanding() {
    this.state.view = 'landing';
    this.state.groupId = null;
    this.state.userId = null;
    this.state.groupName = null;
    this.state.userName = null;
    window.history.replaceState({}, '', '/');
    this.render();
  }

  goToUserSelect() {
    this.state.view = 'user-select';
    this.state.userId = null;
    this.state.userName = null;
    this.render();
  }

  // UI HELPERS
  showAlert(message, type = 'info') {
    const alertId = Date.now();
    const alertHtml = `<div class="alert alert-${type}">${message}</div>`;
    const app = document.getElementById('app');
    const alertElement = document.createElement('div');
    alertElement.id = `alert-${alertId}`;
    alertElement.innerHTML = alertHtml;

    const container = app.querySelector('.container');
    if (container && container.querySelector('.content')) {
      container.querySelector('.content').insertAdjacentElement('beforebegin', alertElement);
    }

    setTimeout(() => {
      const element = document.getElementById(`alert-${alertId}`);
      if (element) element.remove();
    }, 4000);
  }

  copyToClipboard() {
    const groupLink = `${window.location.origin}/?group=${this.state.groupId}`;
    const btn = document.getElementById('copy-link-btn');

    if (!btn) {
      this.showAlert('Error: botón de copiar no encontrado', 'error');
      return;
    }

    // Intentar con clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(groupLink)
        .then(() => {
          this.showCopyFeedback(btn);
        })
        .catch((err) => {
          console.error('Error con Clipboard API:', err);
          this.copyToClipboardFallback(groupLink, btn);
        });
    } else {
      // Fallback directo si no hay clipboard API
      this.copyToClipboardFallback(groupLink, btn);
    }
  }

  copyToClipboardFallback(text, btn) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        this.showCopyFeedback(btn);
      } else {
        this.showAlert('Error al copiar el enlace', 'error');
      }
    } catch (err) {
      console.error('Error en fallback:', err);
      this.showAlert('Error al copiar el enlace', 'error');
    }
  }

  showCopyFeedback(btn) {
    const originalText = btn.textContent;
    const originalColor = btn.style.background;

    btn.textContent = '✓ Copiado!';
    btn.style.background = '#51cf66'; // Color verde de success

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = originalColor;
    }, 2000);
  }

  isUrlValid(string) {
    try {
      new URL(string);
      return true;
    } catch (e) {
      return false;
    }
  }

  formatPrice(price) {
    if (!price) return '0€';
    return `${price}€`;
  }

  formatLocation(location) {
    if (this.isUrlValid(location)) {
      return `<a href="${location}" target="_blank" class="gift-location-url">${location}</a>`;
    }
    return location;
  }

  // RENDER
  render() {
    const app = document.getElementById('app');

    if (this.state.view === 'landing') {
      app.innerHTML = this.renderLanding();
    } else if (this.state.view === 'user-select') {
      app.innerHTML = this.renderUserSelect();
    } else if (this.state.view === 'user') {
      app.innerHTML = this.renderUserView();
    }

    // Agregar overlay de loading si está activo
    if (this.state.loading) {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>${this.state.loadingMessage}</p>
        </div>
      `;
      app.appendChild(loadingOverlay);
    }

    this.attachEventListeners();
  }

  renderLanding() {
    return `
      <div class="container">
        <div class="header">
          <h1>🎁 QueRegalo</h1>
          <p>Comparte tus listas de regalos con tu grupo</p>
        </div>
        <div class="content">
          <div class="section">
            <h2 class="section-title">Crear un nuevo grupo</h2>
            <div class="input-group">
              <label for="group-name">Nombre del grupo</label>
              <input type="text" id="group-name" placeholder="Ej: Reyes Magos 2024" minlength="2" maxlength="100" required>
            </div>
            <button class="button button-primary button-block" id="create-group-btn">
              Crear Grupo
            </button>
          </div>

          <div style="text-align: center; margin: 30px 0; color: #999;">
            ó
          </div>

          <div class="section">
            <h2 class="section-title">Acceder a un grupo existente</h2>
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">
              Pídele al administrador del grupo que te comparta el enlace
            </p>
            <div class="input-group">
              <label for="group-id">Código del grupo</label>
              <input type="text" id="group-id" placeholder="Ej: a1b2c3d4" minlength="3" required>
            </div>
            <button class="button button-secondary button-block" id="join-group-btn">
              Acceder al Grupo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderUserSelect() {
    const groupLink = `${window.location.origin}/?group=${this.state.groupId}`;

    return `
      <div class="container">
        <div class="header">
          <h1>🎁 ${this.state.groupName}</h1>
          <p>Selecciona tu nombre o crea uno nuevo</p>
        </div>
        <div class="content">
          <div class="breadcrumb">
            <button id="back-to-landing" class="back-button">← Volver</button>
          </div>

          <div class="section">
            <h3 class="section-title">Enlace del grupo</h3>
            <div class="copy-link">
              <input type="text" value="${groupLink}" readonly>
              <button type="button" id="copy-link-btn">Copiar Enlace</button>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Selecciona tu usuario</h3>
            ${this.state.users.length > 0 ? `
              <div class="user-list">
                ${this.state.users.map(user => `
                  <button class="user-btn" data-user-id="${user.id}">
                    👤 ${user.name}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h3 class="section-title">O crea uno nuevo</h3>
            <div class="input-group">
              <label for="new-user-name">Tu nombre</label>
              <input type="text" id="new-user-name" placeholder="Ej: Juan" minlength="2" maxlength="100" required>
            </div>
            <button class="button button-secondary button-block" id="create-user-btn">
              Crear Usuario
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderUserView() {
    return `
      <div class="container">
        <div class="header">
          <h1>🎁 ${this.state.groupName}</h1>
          <p class="user-name-header">👤 ${this.state.userName}</p>
        </div>
        <div class="content">
          <div class="breadcrumb">
            <button id="back-to-group" class="back-button">↼ No soy ${this.state.userName}</button>
          </div>

          <!-- MIS REGALOS -->
          <div class="section owner-section">
            <h3 class="section-title">Mis Regalos</h3>

            ${this.state.myGifts.length === 0 ? `
              <div class="no-gifts">No has añadido ningún regalo todavía</div>
            ` : `
              ${this.state.myGifts.map(gift => `
                <div class="gift-card">
                  <div class="gift-header">
                    <span class="gift-name">${gift.name}</span>
                    <span class="gift-price">${this.formatPrice(gift.price)}</span>
                  </div>
                  <div class="gift-location">
                    <span class="gift-location-label">Dónde encontrarlo:</span> ${this.formatLocation(gift.location)}
                  </div>
                  <div class="gift-actions">
                    <button class="button button-secondary button-small" data-edit-gift="${gift.id}" title="Editar regalo">
                      ✏️
                    </button>
                    <button class="button button-danger button-small" data-delete-gift="${gift.id}">
                      Eliminar
                    </button>
                  </div>
                </div>
              `).join('')}
            `}

            <button class="button button-secondary button-block" id="add-gift-modal-btn">
              + Añadir Regalo
            </button>
          </div>

          <!-- REGALOS DE OTROS USUARIOS -->
          <div class="other-users-section">
            <h3 class="section-title">Regalos de tus amigos</h3>

            ${Object.keys(this.state.otherUsersGifts).length === 0 ? `
              <div class="no-gifts">Aún nadie ha añadido regalos a su lista</div>
            ` : `
              ${Object.entries(this.state.otherUsersGifts).map(([userName, gifts]) => `
                <div class="user-section">
                  <div class="user-section-title expandable" data-toggle-user="${userName}">
                    <span class="toggle-icon">${this.state.expandedUsers[userName] ? '▼' : '▶'}</span>
                    👤 ${userName}
                  </div>
                  ${this.state.expandedUsers[userName] ? `
                    ${gifts.map(gift => `
                      <div class="gift-card ${gift.locked_by ? 'locked' : ''}">
                        <div class="gift-header">
                          <span class="gift-name">${gift.name}</span>
                          <span class="gift-price">${this.formatPrice(gift.price)}</span>
                        </div>
                        <div class="gift-location">
                          <span class="gift-location-label">Dónde encontrarlo:</span> ${this.formatLocation(gift.location)}
                        </div>
                        ${gift.locked_by ? `
                          ${gift.locked_by === this.state.userId ? `
                            <div class="gift-status gift-status-locked">
                              ✓ Tú estás regalando esto
                            </div>
                            <div class="gift-actions">
                              <button class="button button-danger button-small" data-unlock-gift="${gift.id}">
                                Desbloquear
                              </button>
                            </div>
                          ` : `
                            <div class="gift-status gift-status-locked">
                              🔒 Regalo bloqueado
                            </div>
                          `}
                        ` : `
                          <div class="gift-actions">
                            <button class="button button-success button-small" data-lock-gift="${gift.id}">
                              Quiero regalarlo
                            </button>
                          </div>
                        `}
                      </div>
                    `).join('')}
                  ` : ``}
                </div>
              `).join('')}
            `}
          </div>
        </div>
      </div>

      <!-- MODAL PARA AÑADIR REGALO -->
      <div class="modal" id="add-gift-modal">
        <div class="modal-content">
          <button class="modal-close" id="close-modal">×</button>
          <div class="modal-header">
            <h2>Añadir nuevo regalo</h2>
          </div>
          <form id="add-gift-form">
            <div class="input-group">
              <label for="gift-name">Nombre del regalo</label>
              <input type="text" id="gift-name" placeholder="Ej: Auriculares Bluetooth" required minlength="2" maxlength="200">
            </div>
            <div class="input-group">
              <label for="gift-price">Precio aproximado (número sin símbolo)</label>
              <input type="number" id="gift-price" placeholder="Ej: 50" required min="1" max="100000" step="1">
            </div>
            <div class="input-group">
              <label for="gift-location">Dónde encontrarlo</label>
              <textarea id="gift-location" placeholder="URL, nombre de tienda o descripción" required minlength="2" maxlength="500"></textarea>
            </div>
            <div class="button-group">
              <button type="button" class="button" id="cancel-gift-btn">Cancelar</button>
              <button type="submit" class="button button-primary">Añadir Regalo</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL PARA EDITAR REGALO -->
      <div class="modal" id="edit-gift-modal">
        <div class="modal-content">
          <button class="modal-close" id="close-edit-modal">×</button>
          <div class="modal-header">
            <h2>Editar regalo</h2>
          </div>
          <form id="edit-gift-form">
            <div class="input-group">
              <label for="edit-gift-name">Nombre del regalo</label>
              <input type="text" id="edit-gift-name" placeholder="Ej: Auriculares Bluetooth" required minlength="2" maxlength="200">
            </div>
            <div class="input-group">
              <label for="edit-gift-price">Precio aproximado (número sin símbolo)</label>
              <input type="number" id="edit-gift-price" placeholder="Ej: 50" required min="1" max="100000" step="1">
            </div>
            <div class="input-group">
              <label for="edit-gift-location">Dónde encontrarlo</label>
              <textarea id="edit-gift-location" placeholder="URL, nombre de tienda o descripción" required minlength="2" maxlength="500"></textarea>
            </div>
            <div class="button-group">
              <button type="button" class="button" id="cancel-edit-btn">Cancelar</button>
              <button type="submit" class="button button-primary">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // LANDING VIEW
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
      createGroupBtn.addEventListener('click', () => {
        const name = document.getElementById('group-name').value.trim();
        if (!name) {
          this.showAlert('Por favor ingresa un nombre para el grupo', 'error');
          return;
        }
        if (name.length < 2) {
          this.showAlert('El nombre del grupo debe tener al menos 2 caracteres', 'error');
          return;
        }
        if (name.length > 100) {
          this.showAlert('El nombre del grupo no puede exceder 100 caracteres', 'error');
          return;
        }
        this.createGroup(name);
      });
    }

    const joinGroupBtn = document.getElementById('join-group-btn');
    if (joinGroupBtn) {
      joinGroupBtn.addEventListener('click', () => {
        const groupId = document.getElementById('group-id').value.trim();
        if (!groupId) {
          this.showAlert('Por favor ingresa el código del grupo', 'error');
          return;
        }
        if (groupId.length < 3) {
          this.showAlert('El código del grupo debe tener al menos 3 caracteres', 'error');
          return;
        }
        this.state.groupId = groupId;
        this.state.view = 'user-select';
        this.saveStateToUrl();
        this.fetchGroup((error) => {
          if (error) {
            this.goToLanding();
          }
        });
      });
    }

    // USER SELECT VIEW
    const backToLandingBtn = document.getElementById('back-to-landing');
    if (backToLandingBtn) {
      backToLandingBtn.addEventListener('click', () => this.goToLanding());
    }

    const copyLinkBtn = document.getElementById('copy-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => this.copyToClipboard());
    }

    const userBtns = document.querySelectorAll('.user-btn');
    userBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const user = this.state.users.find(u => u.id === btn.dataset.userId);
        if (user) {
          this.createOrSelectUser(user.name);
        }
      });
    });

    const createUserBtn = document.getElementById('create-user-btn');
    if (createUserBtn) {
      createUserBtn.addEventListener('click', () => {
        const name = document.getElementById('new-user-name').value.trim();
        if (!name) {
          this.showAlert('Por favor ingresa tu nombre', 'error');
          return;
        }
        if (name.length < 2) {
          this.showAlert('El nombre debe tener al menos 2 caracteres', 'error');
          return;
        }
        if (name.length > 100) {
          this.showAlert('El nombre no puede exceder 100 caracteres', 'error');
          return;
        }
        this.createOrSelectUser(name);
      });
    }

    // USER VIEW
    const backToGroupBtn = document.getElementById('back-to-group');
    if (backToGroupBtn) {
      backToGroupBtn.addEventListener('click', () => this.goToUserSelect());
    }

    const addGiftModalBtn = document.getElementById('add-gift-modal-btn');
    if (addGiftModalBtn) {
      addGiftModalBtn.addEventListener('click', () => {
        document.getElementById('add-gift-modal').classList.add('active');
      });
    }

    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        document.getElementById('add-gift-modal').classList.remove('active');
      });
    }

    const cancelGiftBtn = document.getElementById('cancel-gift-btn');
    if (cancelGiftBtn) {
      cancelGiftBtn.addEventListener('click', () => {
        document.getElementById('add-gift-modal').classList.remove('active');
      });
    }

    const addGiftForm = document.getElementById('add-gift-form');
    if (addGiftForm) {
      addGiftForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('gift-name').value.trim();
        const priceInput = document.getElementById('gift-price');
        const price = priceInput.value.trim();
        const location = document.getElementById('gift-location').value.trim();

        // Validaciones en frontend
        if (!name) {
          this.showAlert('Por favor ingresa el nombre del regalo', 'error');
          return;
        }

        if (!price) {
          this.showAlert('Por favor ingresa el precio del regalo', 'error');
          return;
        }

        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum < 1 || priceNum > 100000 || !Number.isInteger(priceNum)) {
          this.showAlert('El precio debe ser un número entero entre 1 y 100000', 'error');
          return;
        }

        if (!location) {
          this.showAlert('Por favor ingresa dónde encontrar el regalo', 'error');
          return;
        }

        this.addGift(name, priceNum, location);
        document.getElementById('add-gift-modal').classList.remove('active');
        addGiftForm.reset();
      });
    }

    // Edit gift buttons
    const editGiftBtns = document.querySelectorAll('[data-edit-gift]');
    editGiftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.editGiftModal(btn.dataset.editGift);
      });
    });

    // Delete gift buttons
    const deleteGiftBtns = document.querySelectorAll('[data-delete-gift]');
    deleteGiftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteGift(btn.dataset.deleteGift);
      });
    });

    // Lock gift buttons
    const lockGiftBtns = document.querySelectorAll('[data-lock-gift]');
    lockGiftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.lockGift(btn.dataset.lockGift);
      });
    });

    // Unlock gift buttons
    const unlockGiftBtns = document.querySelectorAll('[data-unlock-gift]');
    unlockGiftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.unlockGift(btn.dataset.unlockGift);
      });
    });

    // Toggle user gifts
    const toggleUserBtns = document.querySelectorAll('[data-toggle-user]');
    toggleUserBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleUserGifts(btn.dataset.toggleUser);
      });
    });

    // Edit gift form
    const editGiftForm = document.getElementById('edit-gift-form');
    if (editGiftForm) {
      editGiftForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('edit-gift-name').value.trim();
        const priceInput = document.getElementById('edit-gift-price');
        const price = priceInput.value.trim();
        const location = document.getElementById('edit-gift-location').value.trim();

        // Validaciones en frontend
        if (!name) {
          this.showAlert('Por favor ingresa el nombre del regalo', 'error');
          return;
        }

        if (!price) {
          this.showAlert('Por favor ingresa el precio del regalo', 'error');
          return;
        }

        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum < 1 || priceNum > 100000 || !Number.isInteger(priceNum)) {
          this.showAlert('El precio debe ser un número entero entre 1 y 100000', 'error');
          return;
        }

        if (!location) {
          this.showAlert('Por favor ingresa dónde encontrar el regalo', 'error');
          return;
        }

        this.editGift(this.state.editingGiftId, name, priceNum, location);
        document.getElementById('edit-gift-modal').classList.remove('active');
      });
    }

    // Close edit modal button
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    if (closeEditModalBtn) {
      closeEditModalBtn.addEventListener('click', () => {
        document.getElementById('edit-gift-modal').classList.remove('active');
      });
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.getElementById('edit-gift-modal').classList.remove('active');
      });
    }

    // Close modal on outside click
    const modal = document.getElementById('add-gift-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }

    // Close edit modal on outside click
    const editModal = document.getElementById('edit-gift-modal');
    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
          editModal.classList.remove('active');
        }
      });
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new QueRegaloApp();
});
