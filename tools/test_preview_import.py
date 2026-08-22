import json
import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from preview_import import preview


class PreviewImportTest(unittest.TestCase):
    def test_preview_classifies_blank_and_duplicate_rows_without_changing_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "sample.xlsx"
            wb = Workbook()
            ws = wb.active
            ws.title = "CORE"
            ws.append(["KODE", "CORE", "STATUS"])
            ws.append(["FO-A", 1, "TERPAKAI"])
            ws.append(["FO-A", 1, "TERPAKAI"])
            ws.append([None, None, None])
            ws.append(["FO-A", 2, "IDLE"])
            wb.save(source)
            before = source.read_bytes()

            report = preview(Path(tmp))

            self.assertEqual(report["summary"]["workbooks"], 1)
            self.assertEqual(report["summary"]["rows"], 4)
            self.assertEqual(report["summary"]["blank"], 1)
            self.assertEqual(report["summary"]["duplicate"], 1)
            self.assertEqual(report["summary"]["review"], 2)
            self.assertEqual(source.read_bytes(), before)
            self.assertNotIn("raw_rows", report["workbooks"][0]["sheets"][0])


if __name__ == "__main__":
    unittest.main()
