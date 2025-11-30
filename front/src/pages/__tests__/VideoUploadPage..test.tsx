/**
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// 🧪 Mock de la librería de subida (no queremos tocar AWS real)
vi.mock("@aws-sdk/lib-storage", () => {
  return {
    Upload: class MockUpload {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_: any) {}
      on() {
        // no-op
      }
      async done() {
        // simulamos subida exitosa inmediata
        return {};
      }
    },
  };
});

// 🧪 Mock del cliente S3 y bucket de entrada
vi.mock("../aws/s3Client", () => ({
  s3Client: {}, // truthy para pasar la validación
  S3_INPUT_BUCKET: "fake-bucket",
}));

import { VideoUploadPage } from "../VideoUploadPage";

describe("VideoUploadPage", () => {
  it("muestra un error si el archivo supera los 20 MB y no inicia la subida", async () => {
    render(<VideoUploadPage />);

    const fileInput = screen.getByLabelText(/archivo de video/i);

    const bigBytes = 21 * 1024 * 1024;
    const bigBlob = new Uint8Array(bigBytes);
    const bigFile = new File([bigBlob], "video-grande.mp4", {
      type: "video/mp4",
    });

    fireEvent.change(fileInput, {
      target: { files: [bigFile] },
    });

    const button = screen.getByRole("button", { name: /subir video a s3/i });
    fireEvent.click(button);

    expect(
      await screen.findByText(/El máximo permitido es 20 MB/i)
    ).toBeInTheDocument();
  });

  it("limpia título, archivo y resetea barra y mensaje tras una subida exitosa", async () => {
    vi.useFakeTimers();

    const { container } = render(<VideoUploadPage />);

    const titleInput = screen.getByLabelText(/título o versión del video/i);
    const fileInput = screen.getByLabelText(/archivo de video/i);

    // Archivo válido (< 20 MB)
    const smallBytes = 5 * 1024 * 1024;
    const smallBlob = new Uint8Array(smallBytes);
    const smallFile = new File([smallBlob], "video-ok.mp4", {
      type: "video/mp4",
    });

    // Rellenamos campos
    fireEvent.change(titleInput, {
      target: { value: "mi-video-hls" },
    });

    fireEvent.change(fileInput, {
      target: { files: [smallFile] },
    });

    const button = screen.getByRole("button", { name: /subir video a s3/i });
    fireEvent.click(button);

    // Dejamos que las promesas (upload.done + setState) se resuelvan
    await act(async () => {
      await Promise.resolve();
    });

    // ✅ Mensaje de éxito presente
    const successMsg = screen.getByText(/Video subido correctamente como/i);
    expect(successMsg).toBeInTheDocument();

    // ✅ Título limpio
    expect((titleInput as HTMLInputElement).value).toBe("");

    // ✅ File input limpio
    expect((fileInput as HTMLInputElement).value).toBe("");

    // ✅ Progreso al 100% justo después de terminar
    const progressBar = container.querySelector(
      ".vu-progress-bar"
    ) as HTMLDivElement;
    expect(progressBar).not.toBeNull();
    expect(progressBar.style.width).toBe("100%");

    // Avanzamos 10s para que se ejecute el setTimeout del componente
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    // ✅ Mensaje desaparece
    expect(
      screen.queryByText(/Video subido correctamente como/i)
    ).not.toBeInTheDocument();

    // ✅ Barra vuelve a 0%
    expect(progressBar.style.width).toBe("0%");

    vi.useRealTimers();
  });
});
