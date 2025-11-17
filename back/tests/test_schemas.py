import unittest
from pydantic import ValidationError

from schemas import ChatRequest, ChatResponse


class TestSchemas(unittest.TestCase):
    def test_chatrequest_valid(self):
        req = ChatRequest(message="hola")
        self.assertEqual(req.message, "hola")

    def test_chatresponse_valid(self):
        res = ChatResponse(answer="respuesta")
        self.assertEqual(res.answer, "respuesta")

    def test_chatrequest_invalid_type(self):
        # message debe ser string, no número
        with self.assertRaises(ValidationError):
            ChatRequest(message=123)  # type: ignore


if __name__ == "__main__":
    unittest.main()