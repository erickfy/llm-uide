import unittest

from autonomo1.binary_search_with_steps import binary_search_with_steps


class TestBinarySearchWithSteps(unittest.TestCase):
    def test_element_found_at_center(self):
        arr = [1, 2, 3, 4, 5]
        found, index, steps = binary_search_with_steps(arr, 3)

        self.assertTrue(found)
        self.assertEqual(index, 2)
        self.assertGreaterEqual(len(steps), 1)

        last_step = steps[-1]
        self.assertEqual(last_step["mid"], index)
        self.assertEqual(last_step["mid_value"], 3)
        self.assertIn("==", last_step["comparison"])

    def test_element_found_at_beginning(self):
        arr = [1, 2, 3, 4, 5]
        found, index, steps = binary_search_with_steps(arr, 1)

        self.assertTrue(found)
        self.assertEqual(index, 0)
        self.assertGreaterEqual(len(steps), 1)
        self.assertEqual(steps[-1]["mid_value"], 1)

    def test_element_found_at_end(self):
        arr = [1, 2, 3, 4, 5]
        found, index, steps = binary_search_with_steps(arr, 5)

        self.assertTrue(found)
        self.assertEqual(index, 4)
        self.assertGreaterEqual(len(steps), 1)
        self.assertEqual(steps[-1]["mid_value"], 5)

    def test_element_not_found(self):
        arr = [1, 2, 3, 4, 5]

        found, index, steps = binary_search_with_steps(arr, 6)
        self.assertFalse(found)
        self.assertIsNone(index)
        self.assertGreaterEqual(len(steps), 1)

        found2, index2, steps2 = binary_search_with_steps(arr, 0)
        self.assertFalse(found2)
        self.assertIsNone(index2)
        self.assertGreaterEqual(len(steps2), 1)

    def test_empty_array(self):
        arr: list[int] = []
        found, index, steps = binary_search_with_steps(arr, 1)

        self.assertFalse(found)
        self.assertIsNone(index)
        self.assertEqual(steps, [])

    def test_single_element_found(self):
        arr = [10]
        found, index, steps = binary_search_with_steps(arr, 10)

        self.assertTrue(found)
        self.assertEqual(index, 0)
        self.assertEqual(len(steps), 1)
        self.assertEqual(steps[0]["mid_value"], 10)

    def test_single_element_not_found(self):
        arr = [10]
        found, index, steps = binary_search_with_steps(arr, 5)

        self.assertFalse(found)
        self.assertIsNone(index)
        self.assertGreaterEqual(len(steps), 1)

    def test_duplicate_elements(self):
        # Si hay duplicados, devuelve cualquier índice válido
        arr = [1, 2, 2, 2, 3]
        found, index, steps = binary_search_with_steps(arr, 2)

        self.assertTrue(found)
        self.assertIn(index, [1, 2, 3])
        self.assertGreaterEqual(len(steps), 1)
        self.assertEqual(steps[-1]["mid_value"], 2)


if __name__ == "__main__":
    unittest.main()