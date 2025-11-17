# Frontend UIDE – Jarvis + Binary Search

Este proyecto es el **frontend** del sistema UIDE-Jarvis, construido con **React + TypeScript + Vite**. Permite la interacción con el backend para:

- **Chat con Jarvis:** Página de chat donde puedes hacer preguntas y recibir respuestas generadas por el asistente Jarvis.
- **Binary Search:** Página para visualizar cómo funciona el algoritmo de búsqueda binaria paso a paso.

## Tecnologías principales

- React + TypeScript
- Vite
- Zustand (estado global)
- Fetch API (comunicación con backend FastAPI)
- Vitest + React Testing Library (pruebas)

## Instalación y ejecución

Desde la carpeta `front`:

```bash
npm install      # Instalar dependencias
npm run dev      # Ejecutar en modo desarrollo
```

Luego acceder a [http://localhost:5173](http://localhost:5173) en el navegador.

## Estructura básica

- `src/` – Código fuente principal
  - `pages/Chat.tsx` – Página de chat con Jarvis
  - `pages/BinarySearch.tsx` – Visualización de búsqueda binaria
  - `store/` – Estado global con Zustand

## Ejemplo de uso

![Demo Frontend](/back/image.png)

1. Ve a la pestaña **LLM** para interactuar con Jarvis.
2. Ve a la pestaña **Binary Search** para ver el paso a paso del algoritmo.

## Pruebas

Para correr los tests del frontend:

```bash
npm run test
```

---
