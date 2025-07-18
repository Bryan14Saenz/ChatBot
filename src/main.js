import './style.css';

document.querySelector('#app').innerHTML = `
  <div class="contenedor">
    <div id="pantalla" class="pantalla">
      <p class="msjBot">
        ¡Hola! Soy la IA BASE, ¿en qué puedo ayudarte?
      </p>
      <p class="msjUser">
        ¡Hola! Soy la IA BASE, ¿en qué puedo ayudarte?
      </p>
    </div>
    <div class="enviarMjs">
      <input type="text" id="enviar" class="enviar" placeholder="Escribe un mensaje..." / autofocus>
      <button id="btnEnviar">Enviar</button>
    </div>
  </div>

  <!-- Modal-->
  <div id="modalOverlay" class="modalContenedor">
    <div id="modal" class="modal">
      <p id="modalPregunta" class="modalPregunta">No sé la respuesta. ¿Cómo debería responder?</p>
      <input type="text" id="modalInput" placeholder="Escribe tu respuesta...">
      <button id="modalBtn">Guardar respuesta</button>
    </div>
  </div>
`;
