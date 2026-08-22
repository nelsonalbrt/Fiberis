import unittest

from generate_domain_mapping import classify_sheet, status_target


class DomainMappingTest(unittest.TestCase):
    def test_sheet_candidates_are_classified_without_becoming_authoritative(self):
        self.assertEqual(classify_sheet("PEMAKAIAN CORE"), "CORE_USAGE")
        self.assertEqual(classify_sheet("PERANGKAT"), "DEVICE")
        self.assertEqual(classify_sheet("SPLICE"), "SPLICE")
        self.assertEqual(classify_sheet("AKTIVITAS CHANGE OVER"), "CHANGE_OVER")
        self.assertEqual(classify_sheet("AKTIVITAS CO"), "CHANGE_OVER")
        self.assertEqual(classify_sheet("AREA A", "PEMAKAIAN CORE.xlsx"), "CORE_USAGE")
        self.assertEqual(classify_sheet("SPLICE", "PEMAKAIAN CORE.xlsx"), "SPLICE")
        self.assertIsNone(classify_sheet("README"))

    def test_status_mapping_keeps_unknown_values_blocked(self):
        self.assertEqual(status_target("TERPAKAI"), "IN_USE")
        self.assertEqual(status_target("IDLE"), "AVAILABLE")
        self.assertEqual(status_target("RUSAK"), "BROKEN")
        self.assertEqual(status_target("KRITIS"), "CRITICAL")
        self.assertEqual(status_target("LAINNYA"), "UNKNOWN")


if __name__ == "__main__":
    unittest.main()
