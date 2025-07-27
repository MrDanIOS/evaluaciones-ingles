// Lógica principal de la app de evaluaciones

const cursos = [
  '1ºA', '1ºB', '2ºA', '2ºB', '3ºA', '3ºB', '4ºA', '4ºB',
  '5ºA', '5ºB', '6ºA', '6ºB', '7ºA', '7ºB', '8ºA', '8ºB'
];

let calendar;

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
  inicializarCalendario();
  mostrarListadoCursos();

  // Forzar mayúscula en los nombres de los meses
  setTimeout(() => {
    const monthLabels = document.querySelectorAll('.fc-toolbar-title');
    monthLabels.forEach(label => {
      label.textContent = label.textContent.replace(/^[a-záéíóúñ]/, c => c.toUpperCase());
    });
  }, 100);
});

function inicializarApp() {
  const cursoSelect = document.getElementById('curso');
  const cursoSpan = document.getElementById('curso-seleccionado');
  const form = document.getElementById('evaluacion-form');

  // Mostrar el curso seleccionado
  cursoSelect.addEventListener('change', () => {
    const curso = cursoSelect.value;
    cursoSpan.textContent = curso || '-';
    mostrarEvaluaciones(curso);
  });

  // Manejar envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const curso = cursoSelect.value;
    const fecha = document.getElementById('fecha').value;
    const tipo = document.getElementById('tipo').value;
    const contenido = document.getElementById('contenido').value;
    const oa = document.getElementById('oa').value;
    if (!curso) {
      alert('Selecciona un curso');
      return;
    }
    agregarEvaluacion(curso, fecha, tipo, contenido, oa);
    form.reset();
    cursoSpan.textContent = curso;
    mostrarEvaluaciones(curso);
  });

  // Inicializar con el primer curso si existe
  if (cursoSelect.value) {
    cursoSpan.textContent = cursoSelect.value;
    mostrarEvaluaciones(cursoSelect.value);
  } else {
    cursoSpan.textContent = '-';
  }
}

function inicializarCalendario() {
  const calendarEl = document.getElementById('calendario');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: {
      code: 'es-custom',
      week: { dow: 1 },
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día',
        list: 'Lista'
      },
      monthNames: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      monthNamesShort: [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ]
    },
    height: 500,
    weekends: false,
    events: obtenerEventosCalendario(),
    eventClassNames: function() { return ['evento-evaluacion']; },
    eventClick: function(info) {
      const ev = info.event.extendedProps;
      alert(`Curso: ${ev.curso}\nTipo: ${ev.tipo}\nOA: ${ev.oa}\nFecha: ${info.event.startStr}`);
    }
  });
  calendar.render();
  // Eliminar títulos extra que hayan quedado pegados
  limpiarTitulosCalendario();
}

function limpiarTitulosCalendario() {
  const titles = document.querySelectorAll('.fc-toolbar-title');
  if (titles.length > 1) {
    for (let i = 1; i < titles.length; i++) {
      titles[i].remove();
    }
  }
}

function obtenerEventosCalendario() {
  const evaluaciones = obtenerEvaluaciones();
  let eventos = [];
  for (const curso of cursos) {
    (evaluaciones[curso] || []).forEach(ev => {
      eventos.push({
        title: `${curso}: ${ev.tipo}${ev.contenido ? ' - ' + ev.contenido : ''}`,
        start: ev.fecha,
        curso: curso,
        tipo: ev.tipo,
        contenido: ev.contenido,
        oa: ev.oa
      });
    });
  }
  return eventos;
}

function refrescarCalendario() {
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(obtenerEventosCalendario());
    limpiarTitulosCalendario();
  }
}

function mostrarAlerta(tipo, mensaje) {
  const alertasDiv = document.getElementById('alertas');
  const tipoClase = tipo === 'exito' ? 'alert-success' : 'alert-danger';
  alertasDiv.innerHTML = `<div class="alert ${tipoClase} alert-dismissible fade show" role="alert">
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
  </div>`;
  setTimeout(() => {
    const alert = alertasDiv.querySelector('.alert');
    if (alert) alert.classList.remove('show');
  }, 3500);
}

function mostrarListadoCursos() {
  const cont = document.getElementById('listado-cursos');
  const evaluaciones = obtenerEvaluaciones();
  let html = '<div class="accordion" id="accordionCursos">';
  cursos.forEach((curso, idx) => {
    const lista = evaluaciones[curso] || [];
    html += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${idx}">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${idx}" aria-expanded="true" aria-controls="collapse${idx}">
            ${curso} (${lista.length} evaluaciones)
          </button>
        </h2>
        <div id="collapse${idx}" class="accordion-collapse collapse show" aria-labelledby="heading${idx}" data-bs-parent="#accordionCursos">
          <div class="accordion-body">
            <ul class="list-group">
              ${lista.length === 0 ? '<li class="list-group-item">Sin evaluaciones</li>' :
                lista.map(ev => `<li class="list-group-item"><strong>${formatearFecha(ev.fecha)}</strong>: <span class='badge bg-info'>${ev.tipo}</span> - <em>${ev.contenido || ''}</em> - <span class='badge-oa'>${ev.oa}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  cont.innerHTML = html;
}

function agregarEvaluacion(curso, fecha, tipo, contenido, oa) {
  const evaluaciones = obtenerEvaluaciones();
  if (!evaluaciones[curso]) {
    evaluaciones[curso] = [];
  }
  evaluaciones[curso].push({ fecha, tipo, contenido, oa });
  localStorage.setItem('evaluaciones', JSON.stringify(evaluaciones));
  refrescarCalendario();
  mostrarListadoCursos();
}

function mostrarEvaluaciones(curso) {
  const tbody = document.querySelector('#tabla-evaluaciones tbody');
  tbody.innerHTML = '';
  if (!curso) return;
  const evaluaciones = obtenerEvaluaciones();
  const lista = evaluaciones[curso] || [];
  lista.forEach((ev, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatearFecha(ev.fecha)}</td>
      <td><span class="badge bg-info">${ev.tipo}</span></td>
      <td>${ev.contenido || ''}</td>
      <td><span class="badge-oa">${ev.oa}</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="eliminarEvaluacion('${curso}', ${idx})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function obtenerEvaluaciones() {
  return JSON.parse(localStorage.getItem('evaluaciones')) || {};
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-');
  return `${d}-${m}-${y}`;
}

// Eliminar evaluación
window.eliminarEvaluacion = function(curso, idx) {
  const evaluaciones = obtenerEvaluaciones();
  if (!evaluaciones[curso]) return;
  evaluaciones[curso].splice(idx, 1);
  localStorage.setItem('evaluaciones', JSON.stringify(evaluaciones));
  mostrarEvaluaciones(curso);
  refrescarCalendario();
  mostrarListadoCursos();
} 