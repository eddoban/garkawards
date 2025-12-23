// Estado de la aplicación
let events = [];
let selectedYear = new Date().getFullYear(); // Año actual por defecto
let accessCode = ''; // Se cargará desde config.json
let persons = []; // Personas disponibles

// Cargar personas desde persons.json
async function loadPersons() {
    try {
        const response = await fetch('persons.json');
        if (response.ok) {
            persons = await response.json();
        } else {
            // Personas por defecto si no se puede cargar
            persons = [
                { name: 'Guaton', avatar: 'avatars/guaton.jpg' },
                { name: 'Hato', avatar: 'avatars/hato.jpg' },
                { name: 'Chete', avatar: 'avatars/chete.jpg' }
            ];
        }
    } catch (error) {
        console.log('Error cargando personas, usando valores por defecto');
        persons = [
            { name: 'Guaton', avatar: 'avatars/guaton.jpg' },
            { name: 'Hato', avatar: 'avatars/hato.jpg' },
            { name: 'Chete', avatar: 'avatars/chete.jpg' }
        ];
    }
}

// Cargar código de acceso desde config.json
async function loadAccessCode() {
    try {
        // Agregar timestamp para evitar caché del navegador
        const response = await fetch(`config.json?t=${Date.now()}`);
        console.log('Response status:', response.status, response.ok);
        
        if (response.ok) {
            const config = await response.json();
            console.log('Config completo:', config);
            console.log('config.accessCode:', config.accessCode);
            console.log('Tipo de config.accessCode:', typeof config.accessCode);
            
            accessCode = config.accessCode || '1234';
            console.log('Código final asignado:', accessCode);
        } else {
            accessCode = '1234';
            console.log('No se pudo cargar config.json, usando código por defecto: 1234');
        }
    } catch (error) {
        accessCode = '1234';
        console.log('Error cargando config.json:', error);
        console.log('Usando código por defecto: 1234');
    }
}

// Cargar eventos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await loadPersons();
    await loadAccessCode();
    loadEvents(); // Esto configurará el listener en tiempo real y llamará a renderEvents automáticamente
    initializeEventListeners();
});

// Inicializar event listeners
function initializeEventListeners() {
    const form = document.getElementById('eventForm');
    const imageInput = document.getElementById('image');
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');

    form.addEventListener('submit', handleFormSubmit);
    imageInput.addEventListener('change', handleImagePreview);
    exportBtn.addEventListener('click', exportToJSON);
    importFile.addEventListener('change', handleImportJSON);
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();

    // Solicitar código de acceso
    const code = await requestAccessCode('crear este evento');
    if (!code) return; // Usuario canceló

    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const imageInput = document.getElementById('image');

    let imageData = null;

    // Convertir imagen a base64 si existe
    if (imageInput.files[0]) {
        imageData = await convertImageToBase64(imageInput.files[0]);
    }

    const event = {
        id: Date.now(),
        title,
        date,
        description,
        image: imageData,
        createdAt: new Date().toISOString()
    };

    // Guardar en Firestore (el listener actualizará la UI automáticamente)
    await saveEvent(event);

    // Limpiar formulario
    e.target.reset();
    document.getElementById('imagePreview').innerHTML = '';

    showNotification('✅ Evento guardado exitosamente');
}

// Convertir imagen a base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Vista previa de imagen
async function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const imageData = await convertImageToBase64(file);
        preview.innerHTML = `<img src="${imageData}" alt="Preview">`;
    } else {
        preview.innerHTML = '';
    }
}

// Renderizar eventos
function renderEvents() {
    const eventsList = document.getElementById('eventsList');

    // Actualizar podio
    updatePodium();

    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <span class="emoji">🎮</span>
                <p>No hay eventos programados</p>
                <p style="font-size: 0.9em;">¡Crea el primer evento FIFA con tus amigos!</p>
            </div>
        `;
        return;
    }

    // Ordenar eventos por fecha (más nuevo primero)
    const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

    eventsList.innerHTML = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const formattedDate = formatDate(eventDate);
        const imageHTML = event.image 
            ? `<img src="${event.image}" alt="${event.title}" class="event-image">` 
            : '';
        
        // Inicializar array de garkas si no existe
        if (!event.garkas) {
            event.garkas = [];
        }

        // Clase especial si tiene garkas
        const hasGarkas = event.garkas.length > 0;
        const cardClass = hasGarkas ? 'event-card event-card-with-garkas' : 'event-card';

        const garkasHTML = event.garkas.length > 0 
            ? `
                <div class="garkas-section">
                    <h4>🏆 GARKAS</h4>
                    <div class="garkas-list">
                        ${event.garkas.map((garka, index) => {
                            const person = persons.find(p => p.name === garka.name);
                            const avatarHTML = person ? `<img src="${person.avatar}" alt="${garka.name}" class="garka-avatar" onerror="this.style.display='none'">` : '';
                            return `
                                <div class="garka-item">
                                    ${avatarHTML}
                                    <div class="garka-info">
                                        <strong>${escapeHtml(garka.name)}</strong>
                                        <span>${escapeHtml(garka.description)}</span>
                                    </div>
                                    <button class="btn-remove-garka" onclick="removeGarka(${event.id}, ${index})" title="Eliminar">✕</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `
            : '';

        return `
            <div class="${cardClass}" data-id="${event.id}">
                <button class="btn-delete" onclick="deleteEvent(${event.id})" title="Eliminar evento">✕</button>
                ${imageHTML}
                <h3>${escapeHtml(event.title)}</h3>
                <div class="event-date">📅 ${formattedDate}</div>
                <p class="event-description">${escapeHtml(event.description)}</p>
                ${garkasHTML}
                <button class="btn-add-garka" onclick="showGarkaForm(${event.id})">
                    ➕ Agregar Garka
                </button>
            </div>
        `;
    }).join('');
}

// Formatear fecha
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Calcular estadísticas de garkas
function calculateGarkaStats(year = null) {
    const stats = {};
    
    // Inicializar stats con las personas disponibles
    persons.forEach(person => {
        stats[person.name] = 0;
    });

    // Filtrar eventos por año si se especifica
    const filteredEvents = year 
        ? events.filter(event => new Date(event.date).getFullYear() === year)
        : events;

    filteredEvents.forEach(event => {
        if (event.garkas && event.garkas.length > 0) {
            event.garkas.forEach(garka => {
                if (stats.hasOwnProperty(garka.name)) {
                    stats[garka.name]++;
                }
            });
        }
    });

    // Convertir a array y ordenar
    const sorted = Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return sorted;
}

// Obtener años disponibles de los eventos
function getAvailableYears() {
    const years = new Set();
    events.forEach(event => {
        const year = new Date(event.date).getFullYear();
        years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Más reciente primero
}

// Actualizar podio
function updatePodium() {
    const podiumElement = document.getElementById('podium');
    const availableYears = getAvailableYears();
    
    // Si no hay eventos, mostrar mensaje
    if (availableYears.length === 0) {
        podiumElement.innerHTML = `
            <div class="podium-empty">
                <p>🏆 Aún no hay eventos registrados</p>
            </div>
        `;
        return;
    }

    // Asegurar que selectedYear existe en los años disponibles
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
        selectedYear = availableYears[0];
    }

    const stats = calculateGarkaStats(selectedYear);

    // Crear selector de años (siempre visible si hay eventos)
    const yearSelector = availableYears.length > 0
        ? `
            <div class="year-selector">
                <label for="yearSelect">Año:</label>
                <select id="yearSelect" onchange="changeYear(this.value)">
                    ${availableYears.map(year => 
                        `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`
                    ).join('')}
                </select>
            </div>
        `
        : '';

    // Si no hay garkas en el año seleccionado
    if (stats.every(s => s.count === 0)) {
        podiumElement.innerHTML = `
            <div class="podium-header">
                <div class="podium-title">🏆 PODIO DE GARKAS ${selectedYear} 🏆</div>
                ${yearSelector}
            </div>
            <div class="podium-empty">
                <p>Aún no hay garkas registrados en ${selectedYear}</p>
            </div>
        `;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const positions = ['first', 'second', 'third'];

    podiumElement.innerHTML = `
        <div class="podium-header">
            <div class="podium-title">🏆 PODIO DE GARKAS ${selectedYear} 🏆</div>
            ${yearSelector}
        </div>
        <div class="podium-places">
            ${stats.map((player, index) => {
                if (index > 2) return ''; // Solo top 3
                const medal = medals[index];
                const position = positions[index];
                const countText = player.count === 1 ? '1 garka' : `${player.count} garkas`;
                const person = persons.find(p => p.name === player.name);
                const avatarHTML = person ? `<img src="${person.avatar}" alt="${person.name}" class="podium-avatar" onerror="this.style.display='none'">` : '';
                
                return `
                    <div class="podium-place ${position} ${player.count === 0 ? 'no-garkas' : ''}">
                        <div class="podium-medal">${medal}</div>
                        ${avatarHTML}
                        <div class="podium-name">${player.name}</div>
                        <div class="podium-count">${countText}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Cambiar año del podio
function changeYear(year) {
    selectedYear = parseInt(year);
    updatePodium();
}

// Eliminar evento
async function deleteEvent(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
    
    // Solicitar código de acceso
    const code = await requestAccessCode('eliminar este evento');
    if (!code) return;
    
    // Buscar el evento y eliminarlo de Firestore
    const event = events.find(e => e.id === id);
    if (event && event.firebaseId) {
        try {
            await db.collection('events').doc(event.firebaseId).delete();
            showNotification('🗑️ Evento eliminado');
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            showNotification('❌ Error al eliminar evento', 'error');
        }
    }
}

// Guardar evento en Firestore
async function saveEvent(event) {
    try {
        // Si el evento ya tiene ID en Firebase, actualizarlo, sino crearlo
        if (event.firebaseId) {
            await db.collection('events').doc(event.firebaseId).set(event);
        } else {
            const docRef = await db.collection('events').add(event);
            event.firebaseId = docRef.id;
        }
        console.log('Evento guardado en Firebase:', event.firebaseId);
    } catch (error) {
        console.error('Error al guardar evento:', error);
        showNotification('❌ Error al guardar en Firebase', 'error');
    }
}

// Función legacy para compatibilidad (ahora usa saveEvent)
function saveEvents() {
    console.warn('saveEvents() está deprecada, usa saveEvent() para cada evento individual');
}

// Cargar eventos desde Firestore con listener en tiempo real
function loadEvents() {
    // Suscribirse a cambios en tiempo real
    db.collection('events').onSnapshot((snapshot) => {
        events = [];
        snapshot.forEach((doc) => {
            const eventData = doc.data();
            eventData.firebaseId = doc.id;
            events.push(eventData);
        });
        console.log(`${events.length} eventos cargados desde Firebase`);
        renderEvents();
    }, (error) => {
        console.error('Error al cargar eventos:', error);
        showNotification('❌ Error al cargar eventos de Firebase', 'error');
        events = [];
    });
}

// Exportar eventos a JSON
function exportToJSON() {
    if (events.length === 0) {
        showNotification('⚠️ No hay eventos para exportar', 'warning');
        return;
    }

    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fifa-events-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showNotification('📥 Eventos exportados correctamente');
}

// Importar eventos desde JSON
async function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedEvents = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedEvents)) {
                throw new Error('El archivo no contiene un array válido');
            }

            // Validar estructura básica
            const isValid = importedEvents.every(e => 
                e.id && e.title && e.date && e.description
            );

            if (!isValid) {
                throw new Error('Formato de eventos inválido');
            }

            if (confirm(`¿Deseas importar ${importedEvents.length} eventos? Esto agregará los eventos a Firebase.`)) {
                // Guardar cada evento en Firebase
                for (const event of importedEvents) {
                    // Eliminar firebaseId del archivo importado para crear nuevos documentos
                    delete event.firebaseId;
                    await saveEvent(event);
                }
                showNotification('📤 Eventos importados correctamente a Firebase');
            }
        } catch (error) {
            console.error('Error al importar:', error);
            showNotification('❌ Error al importar: archivo inválido', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    if (type === 'error') {
        notification.style.background = '#e63946';
    } else if (type === 'warning') {
        notification.style.background = '#f77f00';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mostrar formulario para agregar garka
function showGarkaForm(eventId) {
    // Eliminar modal existente si hay uno
    const existingModal = document.querySelector('.garka-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'garka-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🏆 Agregar Garka</h3>
                <button class="btn-close-modal" onclick="closeGarkaModal()">✕</button>
            </div>
            <form id="garkaForm" onsubmit="addGarka(event, ${eventId})">
                <div class="form-group">
                    <label for="garkaName">Nombre</label>
                    <select id="garkaName" required>
                        <option value="">Selecciona una persona</option>
                        ${persons.map(person => `<option value="${person.name}">${person.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="garkaDescription">Descripción</label>
                    <textarea id="garkaDescription" rows="3" placeholder="¿Qué hizo para ser garka?" required></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeGarkaModal()">Cancelar</button>
                    <button type="submit" class="btn-save">Guardar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Focus en el primer select
    setTimeout(() => document.getElementById('garkaName').focus(), 100);
}

// Cerrar modal
function closeGarkaModal() {
    const modal = document.querySelector('.garka-modal');
    if (modal) {
        modal.remove();
    }
}

// Agregar garka
async function addGarka(e, eventId) {
    e.preventDefault();
    
    // Solicitar código de acceso
    const code = await requestAccessCode('agregar un garka');
    if (!code) return;
    
    const name = document.getElementById('garkaName').value;
    const description = document.getElementById('garkaDescription').value;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!event.garkas) {
        event.garkas = [];
    }
    
    event.garkas.push({
        name,
        description,
        addedAt: new Date().toISOString()
    });
    
    // Guardar en Firestore (el listener actualizará la UI automáticamente)
    await saveEvent(event);
    closeGarkaModal();
    showNotification('✅ Garka agregado');
}

// Eliminar garka
async function removeGarka(eventId, garkaIndex) {
    if (!confirm('¿Eliminar este garka?')) return;
    
    // Solicitar código de acceso
    const code = await requestAccessCode('eliminar este garka');
    if (!code) return;
    
    const event = events.find(e => e.id === eventId);
    if (!event || !event.garkas) return;
    
    event.garkas.splice(garkaIndex, 1);
    
    // Guardar en Firestore (el listener actualizará la UI automáticamente)
    await saveEvent(event);
    showNotification('🗑️ Garka eliminado');
}

// Solicitar código de acceso
function requestAccessCode(action) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'access-code-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔒 Código de Acceso</h3>
                </div>
                <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.8);">
                    Ingresa el código para ${action}
                </p>
                <div class="form-group">
                    <input type="password" id="accessCodeInput" placeholder="Código" class="code-input" autocomplete="off">
                    <div id="codeError" class="code-error" style="display: none;">Código incorrecto</div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" id="cancelCodeBtn">Cancelar</button>
                    <button type="button" class="btn-save" id="submitCodeBtn">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = document.getElementById('accessCodeInput');
        const error = document.getElementById('codeError');
        const submitBtn = document.getElementById('submitCodeBtn');
        const cancelBtn = document.getElementById('cancelCodeBtn');

        const closeModal = () => {
            modal.remove();
        };

        const verifyCode = () => {
            const enteredCode = input.value.trim();
            if (enteredCode === accessCode) {
                closeModal();
                resolve(true);
            } else {
                error.style.display = 'block';
                input.value = '';
                input.focus();
                setTimeout(() => {
                    error.style.display = 'none';
                }, 2000);
            }
        };

        submitBtn.addEventListener('click', verifyCode);
        cancelBtn.addEventListener('click', () => {
            closeModal();
            resolve(false);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyCode();
            }
        });

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                resolve(false);
            }
        });

        setTimeout(() => input.focus(), 100);
    });
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.querySelector('.garka-modal');
    if (modal && e.target === modal) {
        closeGarkaModal();
    }
});
