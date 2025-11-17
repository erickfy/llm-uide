# Frontend UIDE – Jarvis + Binary Search

Este proyecto es el **frontend** del sistema UIDE-Jarvis.  
Está construido con **React + TypeScript + Vite** y consume el backend hecho en **FastAPI**.

## ¿Qué hay en este frontend?

La aplicación tiene una interfaz sencilla con dos pestañas principales:

- **LLM**  
  Una página tipo “chat” donde el estudiante puede escribir preguntas y recibir respuestas de **Jarvis**, un asistente entrenado para apoyar a estudiantes de la UIDE.  
  El front envía las preguntas al backend (`/chat`) y muestra las respuestas en formato de conversación.

- **Binary Search**  
  Una segunda página (por ahora simple) pensada para ilustrar cómo funciona el algoritmo de **búsqueda binaria**.  
  Donde se muestra el paso a paso cómo el algoritmo va buscando dentro de una lista ordenada.

## Tecnologías usadas

- **React** + **TypeScript**
- **Vite** (herramienta de build y dev server)
- **Zustand** para manejar el estado del chat (mensajes, loading, errores)
- **Fetch API** para llamar al backend de FastAPI
- **Vitest** + **React Testing Library** para pruebas unitarias del frontend

## Cómo correr el proyecto

Desde la carpeta `front`:

```bash
# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev
```