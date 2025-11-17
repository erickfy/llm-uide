import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


class TestAPI(unittest.TestCase):
    def test_root_ok(self):
        """
        Verifica que el endpoint GET / responde correctamente.
        """
        resp = client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("Jarvis backend activo", data["message"])

    @patch("main.generate_answer", new_callable=AsyncMock)
    def test_chat_ok(self, mock_generate_answer):
        """
        Verifica que /chat devuelve 200 y el JSON esperado cuando todo va bien.
        """
        mock_generate_answer.return_value = "Hola, soy Jarvis de prueba."

        resp = client.post("/chat", json={"message": "Hola Jarvis"})
        self.assertEqual(resp.status_code, 200)

        data = resp.json()
        self.assertEqual(data["answer"], "Hola, soy Jarvis de prueba.")

        mock_generate_answer.assert_awaited_once_with("Hola Jarvis")

    @patch("main.generate_answer", new_callable=AsyncMock)
    def test_chat_error(self, mock_generate_answer):
        """
        Si generate_answer lanza una excepción, /chat debe responder 500.
        """
        mock_generate_answer.side_effect = Exception("falló el modelo")

        resp = client.post("/chat", json={"message": "Hola Jarvis"})
        self.assertEqual(resp.status_code, 500)

        data = resp.json()
        self.assertIn("Error generando respuesta", data["detail"])
        self.assertIn("falló el modelo", data["detail"])


if __name__ == "__main__":
    unittest.main()