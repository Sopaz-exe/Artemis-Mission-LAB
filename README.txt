ARTEMIS MISSION LAB v3.0 · Estructura modular ES6

EJECUTAR
En Windows, descomprime todo el ZIP y abre Iniciar-juego.bat. El servidor
local incluido usa únicamente componentes de Windows y abre el juego en
http://127.0.0.1:8765/index.html. Mantén su ventana abierta mientras juegas.
No instala paquetes, no requiere privilegios de administrador y solo
escucha en tu propio equipo. El puerto fijo conserva el origen de localStorage.

También puedes servir esta carpeta con cualquier servidor HTTP estático.
Por ejemplo, si ya tienes Python: python -m http.server 8765 --bind 127.0.0.1
Los módulos ES6 se cargan por HTTP. Abrir index.html mediante file:// no
es el método de ejecución, por las restricciones de módulos del navegador.

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
La interfaz principal puede cambiarse entre ES y EN. Los casos, explicaciones
científicas y bitácoras se conservan en español; se indica junto al selector.
El cambio de idioma vuelve a renderizar la vista actual y conserva el estado
del minijuego, sus reservas, reloj y foco. Las lecturas de vuelo se traducen
directamente sin MutationObserver ni recorridos globales del documento.

CONSERVACIÓN
Se preservan las fórmulas del balance v2.9, la certificación, las capacidades
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
