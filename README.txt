ARTEMIS MISSION LAB v3.1 · Estructura modular ES6

SPACE APPS

Artemis Mission LAB es un juego educativo interactivo que acerca los viajes
espaciales a los estudiantes. Mediante decisiones, desafíos y minijuegos, permite
planificar una misión y administrar recursos limitados, convirtiendo conceptos
complejos de ciencia e ingeniería en una experiencia accesible para aprender jugando.

EJECUTAR
En Windows, descomprime todo el ZIP y abre Iniciar-juego.bat. El servidor
local incluido usa únicamente componentes de Windows y abre el juego en
http://127.0.0.1:8765/index.html. Mantén su ventana abierta mientras juegas.
No instala paquetes, no requiere privilegios de administrador y solo
escucha en tu propio equipo. El puerto fijo conserva el origen de localStorage.

ARCHIVOS DEL JUEGO
index.html: estructura semántica, accesibilidad y entrada type="module".
css/styles.css: estilos consolidados y tipografías incluidas como Base64.
js/data.js: catálogo educativo original y fuentes NASA.
js/balance.js: configuración, lanzadores y certificación matemática.
js/activities.js: estado y lógica de los once minijuegos.
js/render.js: vistas, SVG, Canvas y actualizaciones visuales.
js/audio.js: síntesis procedural, música y efectos originales.
js/i18n.js: diccionario y traducción explícita de fragmentos y lecturas.
js/main.js: estado de misión, ciclo de vida, persistencia e informe HTML.

No se usan bibliotecas, CDN ni APIs externas para ejecutar el juego.
Las fuentes Outfit y Nunito Sans están embebidas; sus licencias acompañan
al código. Solo los enlaces de referencia NASA requieren conexión al abrirlos.

IDIOMAS
ES / EN cambia la interfaz, casos, opciones, resultados, explicaciones NASA,
minijuegos, cuaderno e informe completo. Los datos originales en español
se conservan; las traducciones están incluidas localmente en i18n.js.
No se usa ningún servicio de traducción, CDN ni conexión durante el juego.
El cambio conserva el estado, las puntuaciones, las reservas y el foco.
La traducción se aplica al renderizar, sin MutationObserver ni TreeWalker.

CONSERVACIÓN
Se preservan las fórmulas del balance v3.0, la certificación, las capacidades
y tarifas ficticias, las fórmulas de minijuegos, los contenidos científicos,
la síntesis WebAudio, teclado, ARIA, foco, movimiento reducido y fotografías
Base64 del informe. Se mantienen las partidas guardadas en el mismo origen
HTTP; un origen distinto tiene su propio almacenamiento del navegador.

DECLARACIÓN DE HERRAMIENTAS Y ASISTENCIA DE IA
El diseño educativo, la curaduría de escenarios, la verificación científica
contra fuentes oficiales de la NASA y la validación funcional de este simulador
fueron realizados por el autor. Se utilizaron herramientas de inteligencia
artificial (Gemini ChatGPT / Codex) como gran asistencia técnica para la
estructuración modular en JavaScript, optimización de gráficos en HTML5 Canvas
y depuración de código.
