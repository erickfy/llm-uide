import { type FormEvent, useState } from "react";

type Step = {
  low: number;
  high: number;
  mid: number;
  mid_value: number;
  comparison: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export function BinarySearchPage() {
  const [arrayInput, setArrayInput] = useState("1, 3, 5, 7, 9");
  const [targetInput, setTargetInput] = useState("7");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [found, setFound] = useState<boolean | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError(null);
    setSteps([]);
    setFound(null);
    setIndex(null);

    // 1. Parsear el array
    const parts = arrayInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (parts.length === 0) {
      setError("Ingresa al menos un número en el array.");
      return;
    }

    const array: number[] = [];
    for (const p of parts) {
      const n = Number(p);
      if (Number.isNaN(n)) {
        setError(`'${p}' no es un número válido.`);
        return;
      }
      array.push(n);
    }

    // 2. Parsear el target
    const target = Number(targetInput);
    if (Number.isNaN(target)) {
      setError("El valor a buscar debe ser un número.");
      return;
    }

    // 3. Ordenar el array (la API lo exige ordenado)
    const sortedArray = [...array].sort((a, b) => a - b);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/binary-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          array: sortedArray,
          target,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          body?.detail ??
          `Error ${res.status} llamando al backend de búsqueda binaria.`;
        throw new Error(msg);
      }

      const data: {
        found: boolean;
        index: number | null;
        steps: Step[];
      } = await res.json();

      setSteps(data.steps);
      setFound(data.found);
      setIndex(data.index);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header">
          <h2>Búsqueda binaria</h2>
          <p>
            Ingresa un arreglo de números y un valor objetivo. El backend
            ejecuta la búsqueda binaria y te muestra cada paso.
          </p>
        </div>

        <form className="panel-content search-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Array (separado por comas)</span>
            <input
              className="form-input"
              type="text"
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              placeholder="Ej: 1, 3, 5, 7, 9"
            />
          </label>

          <label className="field">
            <span>Valor a buscar</span>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Ej: 7"
            />
          </label>

          <button
            type="submit"
            className="form-submit-button"
            disabled={loading || !targetInput.trim() || !arrayInput.trim()}
          >
            {loading ? "Buscando..." : "Ejecutar búsqueda"}
          </button>
        </form>

        <div className="panel-content">
          {error && <div className="error-box">{error}</div>}

          {found !== null && !error && (
            <div className="result-box">
              {found ? (
                <p>
                  ✅ Elemento encontrado en el índice <strong>{index}</strong>.
                </p>
              ) : (
                <p>❌ Elemento no encontrado en el array.</p>
              )}
            </div>
          )}

          {steps.length > 0 && (
            <div className="steps-table-wrapper">
              <h3>Pasos de la búsqueda</h3>
              <table className="steps-table">
                <thead>
                  <tr>
                    <th>Paso</th>
                    <th>low</th>
                    <th>high</th>
                    <th>mid</th>
                    <th>arr[mid]</th>
                    <th>Comparación</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{s.low}</td>
                      <td>{s.high}</td>
                      <td>{s.mid}</td>
                      <td>{s.mid_value}</td>
                      <td>{s.comparison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {steps.length === 0 && !error && (
            <p className="hint">
              Ejecuta una búsqueda para ver cómo se van acotando{" "}
              <code>low</code> y <code>high</code>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
