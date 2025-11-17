import unittest
from unittest import IsolatedAsyncioTestCase, mock

import llm


class TestCallOllama(IsolatedAsyncioTestCase):
    @mock.patch("llm.httpx.AsyncClient")
    async def test_call_ollama_ok(self, mock_async_client_cls):
        """
        Verifica que _call_ollama llame correctamente a /api/generate
        y devuelva el JSON esperado.
        """
        # Respuesta simulada de Ollama
        mock_resp = mock.Mock()
        mock_resp.raise_for_status = mock.Mock()
        mock_resp.json.return_value = {
            "response": "Hola desde Ollama",
            "done_reason": "stop",
        }

        # Cliente HTTP simulado (context manager async)
        mock_client_instance = mock.AsyncMock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.post.return_value = mock_resp

        mock_async_client_cls.return_value = mock_client_instance

        result = await llm._call_ollama("Hola")

        self.assertEqual(result["response"], "Hola desde Ollama")
        mock_client_instance.post.assert_awaited_once()
        mock_resp.raise_for_status.assert_called_once()

    @mock.patch("llm._call_ollama")
    async def test_generate_answer_ok(self, mock_call_ollama):
        """
        Caso normal: _call_ollama devuelve texto a la primera.
        """
        mock_call_ollama.return_value = {
            "response": "La capital de Francia es París.",
            "done_reason": "stop",
        }

        result = await llm.generate_answer("¿Cuál es la capital de Francia?")

        self.assertIn("París", result)
        mock_call_ollama.assert_awaited_once()
        # Revisamos que el prompt tenga el mensaje del usuario
        args, kwargs = mock_call_ollama.call_args
        prompt_enviado = args[0]
        self.assertIn("Usuario: ¿Cuál es la capital de Francia?", prompt_enviado)

    @mock.patch("llm._call_ollama")
    async def test_generate_answer_retry_on_load(self, mock_call_ollama):
        """
        Si la primera respuesta viene vacía con done_reason='load',
        generate_answer debe reintentar una vez.
        """
        mock_call_ollama.side_effect = [
            {"response": "", "done_reason": "load"},
            {"response": "Respuesta después de cargar.", "done_reason": "stop"},
        ]

        result = await llm.generate_answer("Hola Jarvis")

        self.assertEqual(result, "Respuesta después de cargar.")
        self.assertEqual(mock_call_ollama.await_count, 2)

    @mock.patch("llm._call_ollama")
    async def test_generate_answer_raises_when_no_text(self, mock_call_ollama):
        """
        Si después del reintento seguimos sin texto, debe lanzar RuntimeError.
        """
        mock_call_ollama.side_effect = [
            {"response": "", "done_reason": "load"},
            {"response": "", "done_reason": "error"},
        ]

        with self.assertRaises(RuntimeError):
            await llm.generate_answer("Hola Jarvis")


if __name__ == "__main__":
    unittest.main()