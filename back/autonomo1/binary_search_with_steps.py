from typing import List, Optional, Tuple, Dict, Any

def binary_search_with_steps(
    arr: List[int], target: int
) -> Tuple[bool, Optional[int], List[Dict[str, Any]]]:
    """
    Ejecuta búsqueda binaria y devuelve:
      - found: si se encontró o no
      - index: índice donde se encontró (o None)
      - steps: lista de pasos con low, high, mid, mid_value y comparación
    """
    steps: List[Dict[str, Any]] = []

    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        mid_value = arr[mid]

        if mid_value == target:
            steps.append(
                {
                    "low": low,
                    "high": high,
                    "mid": mid,
                    "mid_value": mid_value,
                    "comparison": "arr[mid] == target",
                }
            )
            return True, mid, steps

        if mid_value < target:
            steps.append(
                {
                    "low": low,
                    "high": high,
                    "mid": mid,
                    "mid_value": mid_value,
                    "comparison": "arr[mid] < target → mover low",
                }
            )
            low = mid + 1
        else:
            steps.append(
                {
                    "low": low,
                    "high": high,
                    "mid": mid,
                    "mid_value": mid_value,
                    "comparison": "arr[mid] > target → mover high",
                }
            )
            high = mid - 1

    # No se encontró
    return False, None, steps