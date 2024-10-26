

/*
const iconoMenu = document.getElementById("iconoMenu")

 const header = document.querySelector(".header")
 
 const expand = () =>{
  header.classList.toggle("expand")
 }

iconoMenu.addEventListener("click", expand);

 */


// Añadir eventos a los botones



document.getElementById('simular-dfa').addEventListener('click', simularDFA);
document.getElementById('pausar-simulacion').addEventListener('click', pausarSimulacion);
document.getElementById('continuar-simulacion').addEventListener('click', continuarSimulacion);
document.getElementById('retroceder-simulacion').addEventListener('click', retrocederSimulacion);


class State {
    constructor(name, isInitial = false, isFinal = false) {
      this.name = name;  // El nombre o identificador del estado
      this.isInitial = isInitial;  // Indica si es el estado inicial
      this.isFinal = isFinal;  // Indica si es un estado final
      this.transitions = {};  // Objeto que almacena las conexiones { símbolo: destino }
    }
  
    // Método para añadir una transición desde este estado
    addTransition(symbol, destinationState) {
      this.transitions[symbol] = destinationState;
    }
  
    // Método para obtener el siguiente estado basado en un símbolo de entrada
    getNextState(symbol) {
      return this.transitions[symbol];
    }
}

  
class DFA {
  constructor() {
    this.states = {};  // Diccionario para almacenar los estados por su nombre
    this.initialState = null; 
  }
  
  // Método para crear un nuevo estado
  addState(name, isInitial = false, isFinal = false) {
    const newState = new State(name, isInitial, isFinal);
    this.states[name] = newState;
  
    if (isInitial) {
        this.initialState = newState;
      }
      return newState;
    }
  
    // Método para conectar dos estados
    addTransition(fromStateName, symbol, toStateName) {
      const fromState = this.states[fromStateName];
      const toState = this.states[toStateName];
  
      if (fromState && toState) {
        fromState.addTransition(symbol, toState);
      } else {
        console.error("Estado no encontrado");
      }
    }
  
    // Método para simular el DFA en base a una cadena de entrada
    run(input) {
      let currentState = this.initialState;
      for (let symbol of input) {
        currentState = currentState.getNextState(symbol);
        console.error(symbol);
        if (!currentState) {
          console.error("Cadena no válida, sin transición desde este estado.");
          return false;
        }
      }
      return currentState.isFinal;
    }
  }

  
// Instancia global del DFA
const dfa = new DFA();



const cy = cytoscape({
  container: document.getElementById('cy'),  // Contenedor donde se dibujará el grafo
  style: [  // Estilo de los nodos y aristas
    {
      selector: 'node',
      style: {
        'label': 'data(label)',  // Mostrar el nombre del nodo
        'text-valign': 'center',
        'text-halign': 'center',
        'background-color': '#61bffc',
        'width': 50,
        'height': 50,
        'color': '#000',
        'font-size': '12px'
      }
    },
    {
      selector: 'edge',
      style: {
        'label': 'data(label)',  // Mostrar el símbolo de la transición como etiqueta
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'font-size': '12px',
        'text-margin-y': -10,  // Ajustar la posición del texto
        'text-background-opacity': 1,
        'text-background-color': '#fff',
        'text-background-shape': 'round',
        'text-rotation': 'autorotate'
      }
    }
  ],
  layout: {
    name: 'preset'  // Layout en modo 'preset' para controlar la posición manualmente
  }
});


document.getElementById('agregar-estado').addEventListener('click', function() {
  const nombreEstado = document.getElementById('nombre').value;

  if (nombreEstado) {
    const nombresEstados = nombreEstado.split(',').map(nombre => nombre.trim());

    nombresEstados.forEach(nombre => {
      if (nombre) {
        // Agregar el estado en Cytoscape
        cy.add({
          group: 'nodes',
          data: { id: nombre, label: nombre },
          position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 }
        });

        // Agregar el estado en el DFA
        dfa.addState(nombre);
      }
    });

    cy.layout({ name: 'preset' }).run();
  }
});





document.getElementById('agregar-transicion').addEventListener('click', function() {
  const transicionInput = document.getElementById('transicion').value;

  if (transicionInput) {
    const transiciones = transicionInput.split(';').map(trans => trans.trim());

    transiciones.forEach(transicion => {
      const [estadoOrigen, simbolo, estadoDestino] = transicion.split(',').map(part => part.trim());

      // Verificar si existen los estados de origen y destino en Cytoscape
      if (cy.getElementById(estadoOrigen).length > 0 && cy.getElementById(estadoDestino).length > 0) {
        // Crear el ID único de la arista
        const edgeId = `${estadoOrigen}-${estadoDestino}-${simbolo}`;

        // Agregar la transición en Cytoscape
        cy.add({
          group: 'edges',
          data: { id: edgeId, source: estadoOrigen, target: estadoDestino, label: simbolo }
        });

        // Agregar la transición en el DFA
        dfa.addTransition(estadoOrigen, simbolo, estadoDestino);

        // Aplicar el layout para las conexiones
        cy.layout({ name: 'preset' }).run();
      } else {
        console.error("Uno de los estados no existe");
      }
    });
  }
});











let stepInterval;
let currentState;
let symbolIndex = 0;
let paused = false;
let symbols = [];
let history = [];

// Función para simular el DFA paso a paso o de manera normallet transitionSequence = [];  // Lista para almacenar la secuencia de transiciones

function simularDFA() {
  symbols = document.getElementById('simbolos').value.split(',').map(symbol => symbol.trim());
  const modoPaso = document.getElementById('modo-paso').checked;

  if (symbols.length === 0) {
    console.error("No se ingresaron símbolos.");
    return;
  }

  if (!dfa.initialState) {
    console.error("No se ha definido un estado inicial.");
    return;
  }

  // Reiniciar variables de estado
  currentState = dfa.initialState;
  symbolIndex = 0;
  transitionSequence = [];  // Reiniciar la secuencia de transiciones

  // Restablecer colores antes de comenzar
  resetColors();
  highlightNode(currentState.name);

  // Resolver todas las transiciones de antemano
  for (let symbol of symbols) {
    const nextState = currentState.getNextState(symbol);
    if (!nextState) {
      console.error(`No hay transición para el símbolo '${symbol}' desde el estado '${currentState.name}'.`);
      alert("Cadena no válida, sin transición desde este estado.");
      return;
    }

    // Almacenar la transición en la secuencia
    transitionSequence.push({ from: currentState.name, to: nextState.name, symbol });

    // Mover al siguiente estado
    currentState = nextState;
  }

  if(!modoPaso){
      // Verificar si el estado final es de aceptación
  if (currentState.isFinal) {
    alert("Cadena aceptada. Se terminó en un estado de aceptación.");
  } else {
    alert("Cadena no aceptada. No se terminó en un estado de aceptación.");
  }
  }



  // Si el modo paso a paso está activado, inicia la simulación visual
  if (modoPaso) {
    currentStep = 0;
    iniciarSimulacionVisual();  // Comienza la simulación visual
  }
}


let currentStep = 0;
 paused = false;

// Función para iniciar la simulación visual de la secuencia
function iniciarSimulacionVisual() {
  if (currentStep >= transitionSequence.length) {
    // Simulación completa, mostrar el resultado
    mostrarResultadoFinal();
    return;
  }

  // Si está pausada, no hacer nada
  if (paused) return;

  const { from, to, symbol } = transitionSequence[currentStep];

  // Resaltar el nodo y la arista de la transición actual
  highlightNode(from);
  const edgeId = `${from}-${to}-${symbol}`;
  highlightEdge(edgeId);

  // Esperar 4 segundos antes de restaurar y pasar al siguiente paso
  setTimeout(() => {
    if (paused) return;  // Verificar si se pausó mientras se esperaba

    unhighlightNode(from);
    unhighlightEdge(edgeId);
    highlightNode(to);

    currentStep++;  // Avanzar al siguiente paso

    // Continuar con la simulación si quedan pasos
    if (currentStep < transitionSequence.length) {
      iniciarSimulacionVisual();  // Llamada recursiva para continuar
    } else {
      mostrarResultadoFinal();  // Mostrar resultado al terminar
    }
  }, 4000);
}





function mostrarResultadoFinal() {
  if (currentState.isFinal) {
    alert("Cadena aceptada. Se terminó en un estado de aceptación.");
  } else {
    alert("Cadena no aceptada. No se terminó en un estado de aceptación.");
  }
}





// Función para resaltar un nodo en Cytoscape
function highlightNode(nodeId) {
  const node = cy.getElementById(nodeId);
  if (node) {
    node.style('background-color', '#FFD700');  // Cambia el color a amarillo (resaltado)
  }
}

// Función para deshacer el resaltado de un nodo
function unhighlightNode(nodeId) {
  const node = cy.getElementById(nodeId);
  if (node) {
    node.style('background-color', '#61bffc');  // Restaurar el color original
  }
}

// Función para resaltar una arista en Cytoscape
// Función para resaltar una arista en Cytoscape
function highlightEdge(edgeId) {
  const edge = cy.getElementById(edgeId);
  if (edge) {
    edge.style('line-color', '#FF4500');  // Cambia el color a naranja
    edge.style('target-arrow-color', '#FF4500');  // Cambia el color de la flecha
  }
}

// Función para deshacer el resaltado de una arista
function unhighlightEdge(edgeId) {
  const edge = cy.getElementById(edgeId);
  if (edge) {
    edge.style('line-color', '#ccc');  // Restaurar el color original
    edge.style('target-arrow-color', '#ccc');  // Restaurar el color de la flecha
  }
}


// Función para restablecer los colores de todos los nodos y aristas
function resetColors() {
  cy.nodes().style('background-color', '#61bffc');
  cy.edges().style('line-color', '#ccc');
  cy.edges().style('target-arrow-color', '#ccc');
}



// Función para pausar la simulación
function pausarSimulacion() {
  if (currentStep > 0 && currentStep < transitionSequence.length) {
    paused = true;
    console.log("Simulación pausada.");
  } else {
    console.error("No se puede pausar si no ha comenzado la simulación.");
  }
}

// Función para continuar la simulación
function continuarSimulacion() {
  if (paused && currentStep < transitionSequence.length) {
    paused = false;
    console.log("Reanudando la simulación...");
    iniciarSimulacionVisual();  // Reanudar la simulación desde el paso actual
  } else {
    console.error("No se puede continuar si la simulación no está pausada o ya terminó.");
  }
}

// Función para retroceder en la simulación
function retrocederSimulacion() {
  if (currentStep > 0) {
    currentStep--;  // Retroceder un paso
    const { from, to, symbol } = transitionSequence[currentStep];

    // Restaurar el estado visualmente
    resetColors();
    highlightNode(from);
    const edgeId = `${from}-${to}-${symbol}`;
    highlightEdge(edgeId);

    console.log(`Retrocediendo al paso ${currentStep + 1}`);
  } else {
    console.error("No se puede retroceder más.");
  }
}


// Añadir un evento para simular el DFA
document.getElementById('simular-dfa').addEventListener('click', simularDFA);



function setInitialState() {
  const initialStateName = document.getElementById('estado-inicial').value.trim();

  // Verificar si el estado existe en el DFA
  if (dfa.states.hasOwnProperty(initialStateName)) {
    dfa.initialState = dfa.states[initialStateName];  // Establecer el estado inicial
    alert(`Estado inicial establecido en: ${initialStateName}`);
  } else {
    console.error("El estado especificado no existe en el DFA.");
    alert("El estado inicial no existe. Por favor, ingrese un estado válido.");
  }
}

document.getElementById('establecer-estado-inicial').addEventListener('click', setInitialState);



function setFinalStates() {
  const finalStatesInput = document.getElementById('estado-final').value.trim();
  const finalStates = finalStatesInput.split(',').map(state => state.trim());  // Permite múltiples estados separados por comas

  finalStates.forEach(finalStateName => {
    // Verificar si el estado existe en el DFA
    if (dfa.states.hasOwnProperty(finalStateName)) {
      const state = dfa.states[finalStateName];
      state.isFinal = true;  // Marcar el estado como final en el DFA

      // Actualizar la visualización en Cytoscape
      const node = cy.getElementById(finalStateName);
      if (node) {
        node.style('background-color', '#FFA07A');  // Cambiar el color del nodo para indicar que es final
      }

      console.log(`Estado '${finalStateName}' marcado como estado de aceptación.`);
    } else {
      console.error(`El estado '${finalStateName}' no existe en el DFA.`);
      alert(`El estado '${finalStateName}' no existe. Por favor, ingrese un estado válido.`);
    }
  });
}

document.getElementById('establecer-estado-final').addEventListener('click', setFinalStates);




function cargarArchivo() {
  const archivoInput = document.getElementById('archivo-dfa');
  const archivo = archivoInput.files[0];

  if (archivo) {
    const lector = new FileReader();

    lector.onload = function(e) {
      const contenido = e.target.result;
      procesarArchivoDFA(contenido);  // Procesar el archivo y ejecutar paso a paso
    };

    lector.readAsText(archivo);
  } else {
    alert("Por favor, selecciona un archivo .txt para cargar el DFA.");
  }
}

function procesarArchivoDFA(contenido) {
  const lineas = contenido.split('\n').map(linea => linea.trim());

  let simbolos = [];
  let estados = [];
  let estadoInicial = '';
  let estadosAceptacion = [];
  let transiciones = [];

  cadenasAnalizar = [];  // Limpiar las cadenas a analizar
  transitionSequence = [];  // Limpiar la secuencia de transiciones

  // Leer cada línea y procesar la información correspondiente
  lineas.forEach(linea => {
    if (linea.startsWith('Simbolos:')) {
      simbolos = linea.replace('Simbolos:', '').split(',').map(s => s.trim());
    } else if (linea.startsWith('Estados:')) {
      estados = linea.replace('Estados:', '').split(',').map(e => e.trim());
    } else if (linea.startsWith('Estado inicial:')) {
      estadoInicial = linea.replace('Estado inicial:', '').trim();
    } else if (linea.startsWith('Estados de aceptación:')) {
      estadosAceptacion = linea.replace('Estados de aceptación:', '').split(',').map(e => e.trim());
    } else if (linea.match(/^Q[0-9]+(,Q[0-9]+)*$/)) {
      transiciones.push(linea.split(',').map(e => e.trim()));
    } else if (linea.match(/^[01,]+$/)) {
      cadenasAnalizar.push(linea.split(',').map(s => s.trim()));
    }
  });

  if (!simbolos.length || !estados.length || !estadoInicial || !transiciones.length || !cadenasAnalizar.length) {
    alert("Error al procesar el archivo. Por favor, revisa el formato.");
    return;
  }

  // Crear y mostrar la tabla de transiciones
  crearTablaTransiciones(simbolos, estados, transiciones);

  // Limpiar el DFA actual
  dfa.states = {};
  dfa.initialState = null;
  resetColors();  // Restablecer los colores en Cytoscape

  // Agregar los estados al DFA
  estados.forEach(estado => {
    const isFinal = estadosAceptacion.includes(estado);
    dfa.addState(estado, estado === estadoInicial, isFinal);

    // Agregar visualmente en Cytoscape
    cy.add({
      group: 'nodes',
      data: { id: estado, label: estado },
      position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 },
      style: { 'background-color': isFinal ? '#FFA07A' : '#61bffc' }
    });
  });

  // Asignar el estado inicial
  dfa.initialState = dfa.states[estadoInicial];

  // Agregar las transiciones al DFA
  transiciones.forEach((transicion, index) => {
    const fromState = estados[index];
    transicion.forEach((toState, symbolIndex) => {
      const symbol = simbolos[symbolIndex];
      dfa.addTransition(fromState, symbol, toState);

      cy.add({
        group: 'edges',
        data: { id: `${fromState}-${toState}-${symbol}`, source: fromState, target: toState, label: symbol }
      });
    });
  });

  cy.layout({ name: 'preset' }).run();

  // Preparar la secuencia de transiciones usando la primera cadena
  let cadena = cadenasAnalizar[0];
  currentState = dfa.initialState;

  for (let symbol of cadena) {
    const nextState = currentState.getNextState(symbol);
    if (!nextState) {
      alert(`La cadena contiene una transición no válida desde el estado ${currentState.name}.`);
      return;
    }
    transitionSequence.push({ from: currentState.name, to: nextState.name, symbol });
    currentState = nextState;
  }

  // Verificar si el modo paso a paso está activado antes de iniciar la simulación
  if (document.getElementById('modo-paso').checked) {
    currentStep = 0;
    iniciarSimulacionVisual();
  } else {
    mostrarResultadoFinal();  // Modo normal
  }
}



function iniciarSimulacionVisual() {
  if (currentStep >= transitionSequence.length) {
    mostrarResultadoFinal();
    return;
  }

  if (paused) return;  // No hacer nada si está pausada

  const { from, to, symbol } = transitionSequence[currentStep];

  // Resaltar el nodo y la arista de la transición actual
  highlightNode(from);
  const edgeId = `${from}-${to}-${symbol}`;
  highlightEdge(edgeId);

  // Esperar 4 segundos antes de restaurar y pasar al siguiente paso
  setTimeout(() => {
    if (paused) return;  // Verificar si se pausó mientras se esperaba

    unhighlightNode(from);
    unhighlightEdge(edgeId);
    highlightNode(to);

    currentState = dfa.states[to];
    currentStep++;  // Avanzar al siguiente paso

    // Continuar con la simulación si quedan pasos
    if (currentStep < transitionSequence.length) {
      iniciarSimulacionVisual();
    } else {
      mostrarResultadoFinal();  // Mostrar resultado al terminar
    }
  }, 4000);
}

function mostrarResultadoFinal() {
  if (currentState.isFinal) {
    alert("Cadena aceptada. Se terminó en un estado de aceptación.");
  } else {
    alert("Cadena no aceptada. No se terminó en un estado de aceptación.");
  }
}


function mostrarResultadoFinal() {
  if (currentState && currentState.isFinal) {
    alert("Cadena aceptada. Se terminó en un estado de aceptación.");
  } else if (currentState) {
    alert("Cadena no aceptada. No se terminó en un estado de aceptación.");
  } else {
    console.error("El estado actual no está definido.");
    alert("Ocurrió un error al finalizar la simulación.");
  }
}


document.getElementById('boton-simular').addEventListener('click', function() {
  // Verificar si hay un DFA cargado

  
  if (!dfa.initialState) {
    alert("No se ha cargado ningún DFA. Por favor, carga un archivo primero.");
    return;
  }

  // Verificar si hay una cadena para analizar
  if (cadenasAnalizar.length === 0) {
    alert("No hay cadenas para analizar. Por favor, asegúrate de que el archivo contenga cadenas a analizar.");
    return;
  }

  // Reiniciar variables de estado
  currentState = dfa.initialState;
  symbolIndex = 0;
  transitionSequence = [];
  resetColors();  // Restaurar los colores en Cytoscape

  // Resolver la secuencia de transiciones usando la primera cadena
  const cadena = cadenasAnalizar[0];  // Usar la primera cadena para simular
  for (let symbol of cadena) {
    const nextState = currentState.getNextState(symbol);
    if (!nextState) {
      alert("La cadena contiene una transición no válida.");
      return;
    }

    transitionSequence.push({ from: currentState.name, to: nextState.name, symbol });
    currentState = nextState;
  }

  // Verificar si está activado el modo paso a paso
  const modoPaso = document.getElementById('modo-paso').checked;
  if (modoPaso) {
    // Iniciar simulación paso a paso
    currentStep = 0;
    iniciarSimulacionVisual();
  } else {
    // Simulación normal
    mostrarResultadoFinal();
  }
});



function crearTablaTransiciones(simbolos, estados, transiciones) {
  const encabezado = document.getElementById('encabezado-simbolos');
  const cuerpoTabla = document.getElementById('cuerpo-tabla');

  // Limpiar la tabla antes de llenarla
  encabezado.innerHTML = '';
  cuerpoTabla.innerHTML = '';

  // Agregar encabezado de símbolos
  let encabezadoHTML = '<th>Estado</th>';
  simbolos.forEach(simbolo => {
    encabezadoHTML += `<th>${simbolo}</th>`;
  });
  encabezado.innerHTML = encabezadoHTML;

  // Agregar filas de transiciones para cada estado
  estados.forEach((estado, index) => {
    let filaHTML = `<tr id="fila-${estado}"><td>${estado}</td>`;

    transiciones[index].forEach((destino, simboloIndex) => {
      filaHTML += `<td>${destino}</td>`;
    });

    filaHTML += '</tr>';
    cuerpoTabla.innerHTML += filaHTML;
  });
}

// Función para resaltar la fila del estado actual en la tabla
function resaltarFila(estado) {
  // Limpiar el resaltado de todas las filas
  const filas = document.querySelectorAll('#cuerpo-tabla tr');
  filas.forEach(fila => {
    fila.style.backgroundColor = '';  // Restaurar color de fondo
  });

  // Resaltar la fila correspondiente al estado actual
  const filaActual = document.getElementById(`fila-${estado}`);
  if (filaActual) {
    filaActual.style.backgroundColor = '#FFD700';  // Cambiar a color amarillo
  }
}


function resaltarFila(estado, simbolo) {
  // Limpiar el resaltado de todas las filas
  const filas = document.querySelectorAll('#cuerpo-tabla tr');
  filas.forEach(fila => {
    fila.style.backgroundColor = '';  // Restaurar color de fondo de la fila
    const celdas = fila.querySelectorAll('td');
    celdas.forEach(celda => celda.style.backgroundColor = '');  // Restaurar color de fondo de la celda
  });

  // Resaltar la fila correspondiente al estado actual
  const filaActual = document.getElementById(`fila-${estado}`);
  if (filaActual) {
    filaActual.style.backgroundColor = '#FFD700';  // Cambiar a color amarillo

    // Resaltar la celda de la transición correspondiente al símbolo
    const indiceSimbolo = simbolo ? simbolo : null;
    if (indiceSimbolo !== null) {
      const celdas = filaActual.querySelectorAll('td');
      if (celdas[indiceSimbolo + 1]) {  // +1 para ajustar el índice por la primera columna de estado
        celdas[indiceSimbolo + 1].style.backgroundColor = '#FF4500';  // Cambiar a color naranja
      }
    }
  }
}


function agregarEstadoManual() {
  const nombreEstado = document.getElementById('nombre-estado').value.trim();
  if (!nombreEstado) {
    alert("Por favor, ingresa un nombre para el estado.");
    return;
  }

  const esFinal = document.getElementById('estado-final-checkbox').checked;
  const esInicial = document.getElementById('estado-inicial-checkbox').checked;

  dfa.addState(nombreEstado, esInicial, esFinal);

  // Actualizar visualmente en Cytoscape
  cy.add({
    group: 'nodes',
    data: { id: nombreEstado, label: nombreEstado },
    position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 },
    style: { 'background-color': esFinal ? '#FFA07A' : '#61bffc' }
  });

  // Crear o actualizar la tabla de transiciones
  actualizarTablaDFA();
}

function agregarTransicionManual() {
  const estadoOrigen = document.getElementById('estado-origen').value.trim();
  const simbolo = document.getElementById('simbolo-transicion').value.trim();
  const estadoDestino = document.getElementById('estado-destino').value.trim();

  if (!estadoOrigen || !simbolo || !estadoDestino) {
    alert("Por favor, completa todos los campos para agregar la transición.");
    return;
  }

  dfa.addTransition(estadoOrigen, simbolo, estadoDestino);

  // Agregar visualmente en Cytoscape
  cy.add({
    group: 'edges',
    data: { id: `${estadoOrigen}-${estadoDestino}-${simbolo}`, source: estadoOrigen, target: estadoDestino, label: simbolo }
  });

  cy.layout({ name: 'preset' }).run();

  // Crear o actualizar la tabla de transiciones
  actualizarTablaDFA();
}

function actualizarTablaDFA() {
  const estados = Object.keys(dfa.states);
  const simbolos = [...new Set(Object.values(dfa.states).flatMap(state => Object.keys(state.transitions)))];

  // Obtener transiciones de los estados
  const transiciones = estados.map(estado => {
    return simbolos.map(simbolo => dfa.states[estado].getNextState(simbolo)?.name || '-');
  });

  // Crear la tabla con los datos del DFA
  crearTablaTransiciones(simbolos, estados, transiciones);
}


document.getElementById('agregar-estado').addEventListener('click', function() {
  const nombreEstado = document.getElementById('nombre').value.trim();

  if (!nombreEstado) {
    alert("Por favor, ingresa un nombre para el estado.");
    return;
  }

  // Agregar el estado al DFA
  dfa.addState(nombreEstado);


  // Actualizar la tabla de transiciones
  actualizarTablaDFA();
});


document.getElementById('agregar-transicion').addEventListener('click', function() {
  const transicionInput = document.getElementById('transicion').value.trim();
  const [estadoOrigen, simbolo, estadoDestino] = transicionInput.split(',').map(e => e.trim());

  if (!estadoOrigen || !simbolo || !estadoDestino) {
    alert("Por favor, ingresa la transición en el formato correcto (estadoOrigen,símbolo,estadoDestino).");
    return;
  }

  // Agregar la transición al DFA
  dfa.addTransition(estadoOrigen, simbolo, estadoDestino);


  // Actualizar la tabla de transiciones
  actualizarTablaDFA();
});

document.getElementById('establecer-estado-inicial').addEventListener('click', function() {
  const estadoInicial = document.getElementById('estado-inicial').value.trim();

  if (!estadoInicial) {
    alert("Por favor, ingresa el estado inicial.");
    return;
  }

  if (dfa.states[estadoInicial]) {
    dfa.initialState = dfa.states[estadoInicial];
    alert(`Estado inicial establecido en: ${estadoInicial}`);
  } else {
    alert("El estado inicial ingresado no existe.");
  }

  // Actualizar la tabla de transiciones
  actualizarTablaDFA();
});

document.getElementById('establecer-estado-final').addEventListener('click', function() {
  const estadosFinales = document.getElementById('estado-final').value.split(',').map(e => e.trim());

  if (!estadosFinales.length) {
    alert("Por favor, ingresa al menos un estado final.");
    return;
  }

  estadosFinales.forEach(estadoFinal => {
    if (dfa.states[estadoFinal]) {
      dfa.states[estadoFinal].isFinal = true;
    } else {
      alert(`El estado final ${estadoFinal} no existe.`);
    }
  });

  // Actualizar la tabla de transiciones
  actualizarTablaDFA();
});


function actualizarTablaDFA() {
  const estados = Object.keys(dfa.states);
  const simbolos = [...new Set(Object.values(dfa.states).flatMap(state => Object.keys(state.transitions)))];

  // Obtener transiciones de los estados
  const transiciones = estados.map(estado => {
    return simbolos.map(simbolo => dfa.states[estado].getNextState(simbolo)?.name || '-');
  });

  // Crear la tabla con los datos del DFA
  crearTablaTransiciones(simbolos, estados, transiciones);
}







document.getElementById('descargar-txt').addEventListener('click', function() {
  // Tomar los datos directamente de los inputs

  // Simbolos
  const simbolosInput = document.getElementById('simbolos').value.trim();
  const simbolosArray = simbolosInput ? [...new Set(simbolosInput.split(',').map(s => s.trim()))] : [];
  const simbolosUnicos = simbolosArray.join(',');

  // Estados
  const estadosInput = document.getElementById('nombre').value.trim();
  const estadosArray = estadosInput ? estadosInput.split(',').map(e => e.trim()) : [];
  const estados = estadosArray.join(',');

  // Estado inicial
  const estadoInicialInput = document.getElementById('estado-inicial').value.trim();
  const estadoInicial = estadoInicialInput || 'N/A';

  // Estados de aceptación
  const estadosFinalesInput = document.getElementById('estado-final').value.trim();
  const estadosAceptacion = estadosFinalesInput || 'N/A';

  // Transiciones
  const transicionesInput = document.getElementById('transicion').value.trim();
  const transicionesArray = transicionesInput ? transicionesInput.split(';').map(t => t.trim()) : [];

  // Crear un objeto para organizar las transiciones por estado y símbolo
  const transicionesOrganizadas = {};
  transicionesArray.forEach(trans => {
    const [origen, simbolo, destino] = trans.split(',').map(e => e.trim());
    if (!transicionesOrganizadas[origen]) {
      transicionesOrganizadas[origen] = {};
    }
    transicionesOrganizadas[origen][simbolo] = destino;
  });

  // Construir la sección de transiciones en el formato correcto
  let transicionesTexto = '';
  estadosArray.forEach(estado => {
    let lineaTransicion = '';  // Inicializar línea de transiciones vacía
    simbolosArray.forEach(simbolo => {
      const destino = transicionesOrganizadas[estado] && transicionesOrganizadas[estado][simbolo] ? transicionesOrganizadas[estado][simbolo] : '';
      lineaTransicion += `${destino},`;
    });
    // Eliminar la última coma y agregar la línea de transiciones
    lineaTransicion = lineaTransicion.slice(0, -1);  // Eliminar la coma final
    transicionesTexto += `${lineaTransicion}\n`;
  });

  // Cadenas a analizar
  const cadenasInput = document.getElementById('simbolos').value.trim();
  const cadenasArray = cadenasInput ? cadenasInput.split(';').map(cadena => cadena.split(',').map(s => s.trim()).join(',')).join('\n') : 'N/A';

  // Construir el contenido del archivo en el formato correcto
  const contenidoArchivo = `Simbolos: ${simbolosUnicos}
Estados: ${estados}
Estado inicial: ${estadoInicial}
Estados de aceptación: ${estadosAceptacion}
Transiciones:
${transicionesTexto}Cadenas a analizar:
${cadenasArray}`;

  // Crear un archivo blob y descargarlo
  const blob = new Blob([contenidoArchivo], { type: 'text/plain' });
  const enlaceDescarga = document.createElement('a');
  enlaceDescarga.href = URL.createObjectURL(blob);
  enlaceDescarga.download = 'DFA_configuracion.txt';
  enlaceDescarga.click();
});


document.getElementById('reset-page').addEventListener('click', function() {
  location.reload();  // Recarga la página para vaciar todos los campos y configuraciones
});
