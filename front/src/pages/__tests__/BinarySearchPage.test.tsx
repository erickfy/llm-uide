import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BinarySearchPage } from "../BinarySearchPage";

// Aseguramos que fetch existe y se puede mockear
const originalFetch = global.fetch;

describe("BinarySearchPage", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renderiza el formulario básico", () => {
    render(<BinarySearchPage />);

    // 👇 usamos rol heading en lugar de getByText
    expect(
      screen.getByRole("heading", { name: /Búsqueda binaria/i })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Array \(separado por comas\)/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Valor a buscar/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Ejecutar búsqueda/i })
    ).toBeInTheDocument();
  });

  it("muestra resultado cuando el backend encuentra el elemento", async () => {
    // Mock de la respuesta del backend
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: true,
        index: 3,
        steps: [
          {
            low: 0,
            high: 4,
            mid: 2,
            mid_value: 5,
            comparison: "arr[mid] < target → mover low",
          },
          {
            low: 3,
            high: 4,
            mid: 3,
            mid_value: 7,
            comparison: "arr[mid] == target",
          },
        ],
      }),
    });

    render(<BinarySearchPage />);

    const button = screen.getByRole("button", { name: /Ejecutar búsqueda/i });
    fireEvent.click(button);

    // Esperamos a que aparezca el resultado
    await waitFor(() => {
      expect(
        screen.getByText(/Elemento encontrado en el índice/i)
      ).toBeInTheDocument();
    });

    // La tabla de pasos debe aparecer
    expect(screen.getByText(/Pasos de la búsqueda/i)).toBeInTheDocument();

    // Verificamos que se rendericen las filas de la tabla
    expect(screen.getByText("arr[mid] == target")).toBeInTheDocument();
  });

  it("muestra mensaje cuando el elemento no se encuentra", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        found: false,
        index: null,
        steps: [
          {
            low: 0,
            high: 2,
            mid: 1,
            mid_value: 3,
            comparison: "arr[mid] > target → mover high",
          },
        ],
      }),
    });

    render(<BinarySearchPage />);

    // Cambiamos el target a algo que no esté
    const targetInput = screen.getByLabelText(/Valor a buscar/i);
    fireEvent.change(targetInput, { target: { value: "100" } });

    const button = screen.getByRole("button", { name: /Ejecutar búsqueda/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/Elemento no encontrado en el array/i)
      ).toBeInTheDocument();
    });
  });

  it("muestra error si el usuario escribe un valor no numérico en el array", async () => {
    render(<BinarySearchPage />);

    const arrayInput = screen.getByLabelText(/Array \(separado por comas\)/i);
    fireEvent.change(arrayInput, { target: { value: "1, 2, hola, 4" } });

    const button = screen.getByRole("button", { name: /Ejecutar búsqueda/i });
    fireEvent.click(button);

    // No debería llamar al backend
    expect(global.fetch).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(/'hola' no es un número válido/i)
      ).toBeInTheDocument();
    });
  });

  it("muestra error si el backend responde con status no OK", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "El array debe venir ordenado." }),
    });

    render(<BinarySearchPage />);

    const button = screen.getByRole("button", { name: /Ejecutar búsqueda/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/El array debe venir ordenado\./i)
      ).toBeInTheDocument();
    });
  });
});
