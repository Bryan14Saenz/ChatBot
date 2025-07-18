/* 
    Estructura de la base de conocimientos:
    memoria = {
      'pregunta': {
        respuesta: 'Texto de respuesta',
        embedding: [ ...vector numérico... ]
      },
      ...
    }
  */

document.addEventListener('DOMContentLoaded', async () => {
  // Constantes globales
  const pantalla = document.getElementById('pantalla');
  const input = document.getElementById('enviar');
  const btnEnviar = document.getElementById('btnEnviar');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalPregunta = document.getElementById('modalPregunta');
  const modalInput = document.getElementById('modalInput');
  const modalBtn = document.getElementById('modalBtn');

  // Variables
  let necesitaActualización = false;

  // Universal Sentence Encoder
  alert('Cargando Universal Sentence Encoder...');
  const useModel = await use.load();
  alert('Universal Sentence Encoder cargado.');

  // Memoria
  let memoria = JSON.parse(localStorage.getItem('memoria')) || {
    hola: {
      respuesta: '¡Hola! ¿Cómo estás?',
    },
    '¿como te llamas?': {
      respuesta: 'Soy BASE, tu asistente de IA.',
    },
    '¿que puedes hacer?': {
      respuesta: 'Puedo responder preguntas básicas y resolver operaciones matemáticas.',
    },
    adios: {
      respuesta: '¡Hasta luego! 😊',
    },
  };

  // Guardar memoria
  function guardarMemoria() {
    localStorage.setItem('memoria', JSON.stringify(memoria));
    alert('Memoria guardada:', memoria);
  }

  // Agregar mensaje
  function agregarMensaje(texto, esBot) {
    let mensaje = document.createElement('p');

    mensaje.className = esBot ? 'msjBot' : 'msjUser';
    mensaje.innerText = texto;
    pantalla.appendChild(mensaje);

    pantalla.scrollTop = pantalla.scrollHeight;
  }

  // Calcular operaciones
  function calcularExpresión(expresión) {
    try {
      let resultado = new Function(`return ${expresión}`)();

      return `El resultado de la operación es: ${resultado}`;
    } catch {
      return 'Operación no válida';
    }
  }

  // Embeddings
  async function actualizarEmbeddings() {
    const preguntas = Object.keys(memoria);

    alert('Recalculando embeddings para todas las entradas de memoria...');

    // Array de preguntas
    const embeddingsTensor = await useModel.embed(preguntas);
    const embeddingsArray = await embeddingsTensor.array();

    preguntas.forEach((pregunta, i) => {
      memoria[pregunta].embedding = embeddingsArray[i];
    });

    guardarMemoria();
    alert('Embeddings actualizados para la memoria.');
  }

  for (let pregunta in memoria) {
    if (!memoria[pregunta].embedding || !Array.isArray(memoria[pregunta].embedding)) {
      necesitaActualización = true;
      break;
    }
  }
  if (necesitaActualización) {
    await actualizarEmbeddings();
  }

  // Coseno entre dos vectores
  function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (normA * normB);
  }

  // Respuesta similar
  async function buscarRespuesta(preguntaNueva) {
    const embeddingNuevaTensor = await useModel.embed([preguntaNueva]);
    const embeddingNueva = embeddingNuevaTensor.arraySync()[0];

    let maxSimilitud = -1;
    let respuestaEncontrada = null;

    for (let pregunta in memoria) {
      const item = memoria[pregunta];

      if (!item.embedding || !Array.isArray(item.embedding)) {
        alert(`La pregunta "${pregunta}" no tiene embedding. Se omite.`);
        continue;
      }

      const similitud = cosineSimilarity(embeddingNueva, item.embedding);

      alert(`Similitud entre "${preguntaNueva}" y "${pregunta}": ${similitud.toFixed(4)}`);

      if (similitud > maxSimilitud) {
        maxSimilitud = similitud;
        respuestaEncontrada = item.respuesta;
      }
    }

    return { respuesta: respuestaEncontrada, similitud: maxSimilitud };
  }

  // Modal
  function solicitarRespuesta(texto) {
    return new Promise((resolve) => {
      modalPregunta.innerText = `No tengo respuesta para: "${texto}". ¿Cómo debería responder?`;
      modalInput.value = '';
      modalOverlay.style.display = 'flex';

      modalBtn.onclick = async () => {
        const respuestaUsuario = modalInput.value.trim();
        modalOverlay.style.display = 'none';
        resolve(respuestaUsuario);
      };

      modalInput.onkeydown = (event) => {
        if (event.key === 'Enter') {
          modalBtn.click();
        }
      };
    });
  }

  // Mensaje del usuario
  async function procesarMensaje() {
    let texto = input.value.trim().toLowerCase();

    if (!texto) return;

    agregarMensaje(texto, false);

    alert('Mensaje del usuario:', texto);

    if (
      /^[\d+\-*/().\s]+$/.test(texto) &&
      (texto.includes('+') || texto.includes('-') || texto.includes('*') || texto.includes('/'))
    ) {
      const respuestaOp = calcularExpresión(texto);

      agregarMensaje(respuestaOp, true);

      alert('Operación matemática detectada:', texto);
    } else {
      const { respuesta, similitud } = await buscarRespuesta(texto);

      alert(`Máxima similitud obtenida: ${similitud.toFixed(4)}`);

      const UMBRAL = 0.7;
      if (similitud > UMBRAL && respuesta) {
        agregarMensaje(respuesta, true);

        alert('Respuesta encontrada en memoria:', respuesta);
      } else {
        agregarMensaje('No tengo respuesta. Espera un momento...', true);

        alert('No se encontró respuesta adecuada para:', texto);

        const respuestaUsuario = await solicitarRespuesta(texto);

        if (respuestaUsuario) {
          const embeddingTensor = await useModel.embed([texto]);
          const embeddingNueva = embeddingTensor.arraySync()[0];

          memoria[texto] = {
            respuesta: respuestaUsuario,
            embedding: embeddingNueva,
          };

          guardarMemoria();

          agregarMensaje('¡Gracias! Ahora lo recordaré. 😊', true);

          alert('Nueva respuesta aprendida:', respuestaUsuario);
        } else {
          agregarMensaje('Está bien, seguiré aprendiendo.', true);

          alert('No se proporcionó respuesta para:', texto);
        }
      }
    }

    input.value = '';
  }

  // Eventos
  btnEnviar.addEventListener('click', procesarMensaje);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      procesarMensaje();
    }
  });
});
